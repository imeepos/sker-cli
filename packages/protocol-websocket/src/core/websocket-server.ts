/**
 * @sker/protocol-websocket - WebSocket服务器核心实现
 */

import { SkerCore, MiddlewareContext, Logger, deepMerge } from '@sker/core';
import { EventEmitter } from 'events';
import { Server } from 'http';
import { WebSocketServer as WSServer } from 'ws';
import {
  ServerConfig,
  WebSocketConnection,
  MessageHandler,
  Middleware,
  WebSocketState,
  ConnectionInfo,
  User,
  WebSocketServerOptions
} from '../types/websocket-types.js';
import {
  DEFAULT_SERVER_CONFIG,
  WebSocketEvent,
  WebSocketCloseCode,
  MessageTypes
} from '../constants/websocket-constants.js';
import { ConnectionManager } from './connection-manager.js';
import { WebSocketEventEmitter } from '../events/event-emitter.js';
import { DefaultMessageHandler } from '../events/message-handler.js';
import { LifecycleHandler } from '../events/lifecycle-handler.js';
import {
  generateConnectionId,
  formatConnectionInfo,
  parseUserAgent
} from '../utils/websocket-utils.js';

export class WebSocketServer extends SkerCore {
  private config: ServerConfig;
  private logger: Logger;
  private server?: Server;
  private wsServer?: WSServer;
  private connectionManager: ConnectionManager;
  private eventEmitter: WebSocketEventEmitter;
  private messageHandler: MessageHandler;
  private lifecycleHandler: LifecycleHandler;

  constructor(options: WebSocketServerOptions) {
    super({
      serviceName: options.serviceName || 'websocket-server',
      version: options.version || '1.0.0',
      environment: options.environment || 'development',
      ...options.coreOptions
    });

    this.config = deepMerge(DEFAULT_SERVER_CONFIG as ServerConfig, options.serverConfig || {});
    this.logger = new Logger({
      name: 'WebSocketServer',
      level: (this.config.monitoring?.logging?.level as any) || 'info'
    });

    this.eventEmitter = new WebSocketEventEmitter(this.logger);
    this.connectionManager = new ConnectionManager(
      this.config.websocket?.connection,
      this.logger
    );

    this.messageHandler = new DefaultMessageHandler(this.logger, this.eventEmitter);
    this.lifecycleHandler = new LifecycleHandler(this.logger, this.eventEmitter);

    // 设置生命周期钩子
    this.getLifecycle().onStart(this.startWebSocketServer.bind(this));
    this.getLifecycle().onStop(this.stopWebSocketServer.bind(this));

    // 设置核心中间件
    this.setupCoreMiddleware();
    this.setupEventHandlers();
    this.validateConfiguration();
  }

  /**
   * 设置核心中间件
   */
  private setupCoreMiddleware(): void {
    const middleware = this.getMiddleware();

    // WebSocket连接日志中间件
    middleware.use(async (context: any, next: () => Promise<any>) => {
      const start = Date.now();
      this.emit('ws:request:start', {
        connectionId: context.connectionId,
        messageType: context.messageType,
        timestamp: start
      });

      try {
        const result = await next();
        const duration = Date.now() - start;
        this.emit('ws:request:success', {
          connectionId: context.connectionId,
          messageType: context.messageType,
          duration,
          timestamp: start
        });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        this.emit('ws:request:error', {
          connectionId: context.connectionId,
          messageType: context.messageType,
          error,
          duration,
          timestamp: start
        });
        throw error;
      }
    }, { name: 'websocket-logger' });
  }

  /**
   * WebSocket服务器启动逻辑 (生命周期钩子)
   */
  private async startWebSocketServer(): Promise<void> {
    try {
      this.logger.info('Starting WebSocket server', {
        host: this.config.host,
        port: this.config.port,
        maxConnections: this.config.websocket?.connection?.maxConnections
      });

      // 创建HTTP服务器（如果需要）
      if (!this.server) {
        this.server = new Server();
      }

      // 创建WebSocket服务器
      this.wsServer = new WSServer({
        server: this.server,
        perMessageDeflate: this.config.websocket?.message?.compression?.enabled || false,
        maxPayload: this.config.websocket?.message?.maxSize || 1024 * 1024,
        clientTracking: true,
        handleProtocols: this.handleProtocols.bind(this)
      });

      // 设置WebSocket事件处理
      this.wsServer.on('connection', this.handleConnection.bind(this));
      this.wsServer.on('error', this.handleServerError.bind(this));
      this.wsServer.on('headers', this.handleHeaders.bind(this));

      // 启动HTTP服务器
      await new Promise<void>((resolve, reject) => {
        this.server!.listen(this.config.port, this.config.host, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.logger.info('WebSocket server started successfully', {
        address: `ws://${this.config.host}:${this.config.port}`
      });

      this.emit('ws:server_started', {
        host: this.config.host,
        port: this.config.port
      });

    } catch (error) {
      this.logger.error('Failed to start WebSocket server', {
        error: error instanceof Error ? error.message : String(error)
      });

      await this.cleanup();
      this.emit('ws:server_error', error);
      throw error;
    }
  }

  /**
   * WebSocket服务器停止逻辑 (生命周期钩子)
   */
  private async stopWebSocketServer(): Promise<void> {
    const timeout = 30000;
    this.logger.info('Stopping WebSocket server', { timeout });

    try {
      // 停止接受新连接
      if (this.wsServer) {
        this.wsServer.close();
      }

      // 优雅关闭所有连接
      await this.connectionManager.shutdown(timeout);

      // 关闭HTTP服务器
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => resolve());
        });
      }

      await this.cleanup();

      this.logger.info('WebSocket server stopped successfully');
      this.emit('ws:server_stopped');

    } catch (error) {
      this.logger.error('Error during server shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      this.emit('ws:server_error', error);
      throw error;
    }
  }

  private validateConfiguration(): void {

    if (this.config.websocket?.connection?.maxConnections &&
      this.config.websocket.connection.maxConnections < 1) {
      throw new Error('maxConnections must be greater than 0');
    }

    this.logger.debug('Configuration validated', {
      port: this.config.port,
      host: this.config.host,
      maxConnections: this.config.websocket?.connection?.maxConnections
    });
  }

  override setupEventHandlers(): void {
    // 连接管理器事件
    this.connectionManager.on(WebSocketEvent.CONNECTION, (connection: WebSocketConnection) => {
      this.emit(WebSocketEvent.CONNECTION, connection);
    });

    this.connectionManager.on(WebSocketEvent.DISCONNECT, (connection: WebSocketConnection, reason: string) => {
      this.emit(WebSocketEvent.DISCONNECT, { connection, reason });
    });

    // 生命周期处理器事件
    this.lifecycleHandler.onConnection((connection: WebSocketConnection) => {
      this.logger.info('Connection established', formatConnectionInfo(connection));
    });

    this.lifecycleHandler.onDisconnect((connection: WebSocketConnection, reason?: string) => {
      this.logger.info('Connection closed', {
        ...formatConnectionInfo(connection),
        reason
      });
    });

    this.lifecycleHandler.onAuthenticated((connection: WebSocketConnection, user: User) => {
      this.logger.info('User authenticated', {
        connectionId: connection.id,
        userId: user.id,
        username: user.username
      });
    });

    // 事件发射器错误处理
    this.eventEmitter.on('error', (error: Error) => {
      this.logger.error('EventEmitter error', { error: error.message });
      this.emit('error', error);
    });
  }

  override async start(): Promise<void> {
    if (this.isStarted) {
      throw new Error('Server is already started');
    }

    try {
      this.logger.info('Starting WebSocket server', {
        host: this.config.host,
        port: this.config.port,
        maxConnections: this.config.websocket?.connection?.maxConnections
      });

      // 创建HTTP服务器（如果需要）
      if (!this.server) {
        this.server = new Server();
      }

      // 创建WebSocket服务器
      this.wsServer = new WSServer({
        server: this.server,
        perMessageDeflate: this.config.websocket?.message?.compression?.enabled || false,
        maxPayload: this.config.websocket?.message?.maxSize || 1024 * 1024,
        clientTracking: true,
        handleProtocols: this.handleProtocols.bind(this)
      });

      // 设置WebSocket事件处理
      this.wsServer.on('connection', this.handleConnection.bind(this));
      this.wsServer.on('error', this.handleServerError.bind(this));
      this.wsServer.on('headers', this.handleHeaders.bind(this));

      // 启动HTTP服务器
      await new Promise<void>((resolve, reject) => {
        this.server!.listen(this.config.port, this.config.host, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      // Set started state using parent class method
      await super.start();

      this.logger.info('WebSocket server started successfully', {
        address: `ws://${this.config.host}:${this.config.port}`
      });

      this.emit('started');

    } catch (error) {
      this.logger.error('Failed to start WebSocket server', {
        error: error instanceof Error ? error.message : String(error)
      });

      await this.cleanup();
      throw error;
    }
  }

  override async stop(timeout: number = 30000): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.logger.info('Stopping WebSocket server', { timeout });

    try {
      // 停止接受新连接
      if (this.wsServer) {
        this.wsServer.close();
      }

      // 优雅关闭所有连接
      await this.connectionManager.shutdown(timeout);

      // 关闭HTTP服务器
      if (this.server) {
        await new Promise<void>((resolve) => {
          this.server!.close(() => resolve());
        });
      }

      await this.cleanup();

      // Use parent class method to properly set stopped state
      await super.stop();
      this.logger.info('WebSocket server stopped successfully');
      this.emit('stopped');

    } catch (error) {
      this.logger.error('Error during server shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private async cleanup(): Promise<void> {
    // 清理资源
    this.wsServer = undefined;
    this.server = undefined;

    // 移除所有事件监听器
    this.removeAllListeners();
  }

  private handleConnection(ws: any, request: any): void {
    try {
      // 创建连接信息
      const connectionInfo: ConnectionInfo = {
        id: generateConnectionId(),
        ip: this.getClientIP(request),
        userAgent: request.headers['user-agent'],
        origin: request.headers.origin,
        protocol: ws.protocol,
        connectedAt: new Date()
      };

      // 解析用户代理信息
      const clientInfo = parseUserAgent(connectionInfo.userAgent || '');

      // 创建WebSocket连接包装器
      const connection: WebSocketConnection = this.createConnection(ws, connectionInfo, clientInfo);

      // 添加到连接管理器
      const added = this.connectionManager.addConnection(connection);
      if (!added) {
        // 连接被拒绝（可能由于达到限制）
        ws.close(WebSocketCloseCode.POLICY_VIOLATION, 'Connection rejected');
        return;
      }

      // 应用中间件
      this.applyMiddlewares(connection);

      this.logger.debug('New WebSocket connection created', {
        connectionId: connection.id,
        ip: connectionInfo.ip,
        userAgent: connectionInfo.userAgent
      });

    } catch (error) {
      this.logger.error('Error handling new connection', {
        error: error instanceof Error ? error.message : String(error)
      });

      ws.close(WebSocketCloseCode.INTERNAL_ERROR, 'Connection setup failed');
    }
  }

  private createConnection(
    ws: any,
    info: ConnectionInfo,
    clientInfo: any
  ): WebSocketConnection {
    const connection = new EventEmitter() as WebSocketConnection;

    // 设置基本属性
    connection.id = info.id;
    connection.info = info;
    connection.rooms = new Set<string>();
    connection.state = 'OPEN' as WebSocketState;
    connection.platform = clientInfo.os;
    connection.clientVersion = clientInfo.version;

    // 实现连接方法
    connection.send = async (message: any): Promise<void> => {
      if (connection.state !== 'OPEN') {
        throw new Error('Connection is not open');
      }

      try {
        const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
        ws.send(messageStr);
      } catch (error) {
        throw new Error(`Failed to send message: ${error}`);
      }
    };

    connection.close = (code?: number, reason?: string): void => {
      if (connection.state === 'CLOSED' || connection.state === 'CLOSING') {
        return;
      }

      connection.state = 'CLOSING';
      ws.close(code || WebSocketCloseCode.NORMAL_CLOSURE, reason);
    };

    connection.ping = (): void => {
      if (connection.state === 'OPEN') {
        ws.ping();
        connection.info.lastPingAt = new Date();
      }
    };

    connection.isAlive = (): boolean => {
      return connection.state === 'OPEN' && ws.readyState === ws.OPEN;
    };

    // 设置WebSocket事件监听
    ws.on('message', async (data: Buffer) => {
      try {
        const messageStr = data.toString('utf8');
        const message = JSON.parse(messageStr);

        // 通过消息处理器处理消息
        await this.messageHandler.handleMessage(connection, message);

        connection.emit('message', message);
      } catch (error) {
        this.logger.error('Error processing message', {
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error)
        });

        connection.emit('error', error);
      }
    });

    ws.on('close', (code: number, reason: Buffer) => {
      connection.state = 'CLOSED';
      const reasonStr = reason.toString('utf8');

      this.connectionManager.removeConnection(connection.id, reasonStr);
      connection.emit('close', code, reasonStr);
    });

    ws.on('error', (error: Error) => {
      this.logger.error('WebSocket error', {
        connectionId: connection.id,
        error: error.message
      });

      connection.emit('error', error);
    });

    ws.on('ping', () => {
      connection.emit('ping');
    });

    ws.on('pong', () => {
      connection.emit('pong');
    });

    return connection;
  }

  private getClientIP(request: any): string {
    return request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      '127.0.0.1';
  }

  private handleProtocols(protocols: Set<string>): string | false {
    // 处理子协议选择
    if (this.config.protocols) {
      for (const protocol of this.config.protocols) {
        if (protocols.has(protocol)) {
          return protocol;
        }
      }
    }
    return false;
  }

  private handleServerError(error: Error): void {
    this.logger.error('WebSocket server error', {
      error: error.message,
      stack: error.stack
    });

    this.emit('error', error);
  }

  private handleHeaders(headers: string[], request: any): void {
    // 可以在这里修改响应头
    if (this.config.cors?.enabled) {
      const origin = request.headers.origin;
      if (this.isOriginAllowed(origin)) {
        headers.push('Access-Control-Allow-Origin: ' + origin);

        if (this.config.cors.credentials) {
          headers.push('Access-Control-Allow-Credentials: true');
        }
      }
    }
  }

  private isOriginAllowed(origin: string): boolean {
    if (!this.config.cors?.origin) {
      return true;
    }

    if (typeof this.config.cors.origin === 'string') {
      return this.config.cors.origin === origin;
    }

    return this.config.cors.origin.includes(origin);
  }

  private applyMiddlewares(connection: WebSocketConnection): void {
    // 应用中间件到连接
    const middlewares = this.getMiddleware().getMiddlewares();
    for (const middleware of middlewares) {
      try {
        // 中间件应用逻辑
        this.logger.debug('Applying middleware', {
          middlewareName: middleware.name,
          connectionId: connection.id
        });
      } catch (error) {
        this.logger.error('Middleware application failed', {
          middlewareName: middleware.name,
          connectionId: connection.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  // 公共方法
  public setMessageHandler(handler: MessageHandler): void {
    this.messageHandler = handler;
    this.logger.debug('Message handler updated');
  }

  public use(name: string, middleware: Middleware): void;
  public use(middlewares: string[]): void;
  public use(nameOrArray: string | string[], middleware?: Middleware): void {
    const middlewareManager = this.getMiddleware();

    if (Array.isArray(nameOrArray)) {
      // 如果是字符串数组，创建内置中间件
      for (const middlewareName of nameOrArray) {
        const builtinMiddleware = this.createBuiltinMiddleware(middlewareName);
        if (builtinMiddleware) {
          // Wrap WebSocket middleware to match core middleware interface
          const wrappedMiddleware = async (context: MiddlewareContext, next: () => Promise<void>) => {
            // Create a mock WebSocket connection context if needed
            const connection: WebSocketConnection = context.data as WebSocketConnection;
            const message = context.request;
            
            return await builtinMiddleware.execute(connection, message, () => next());
          };
          middlewareManager.use(wrappedMiddleware, { name: middlewareName });
        }
      }
    } else if (middleware) {
      // 直接注册中间件 - wrap WebSocket middleware to match core interface
      const wrappedMiddleware = async (context: MiddlewareContext, next: () => Promise<void>) => {
        const connection: WebSocketConnection = context.data as WebSocketConnection;
        const message = context.request;
        
        return await middleware.execute(connection, message, () => next());
      };
      middlewareManager.use(wrappedMiddleware, { name: nameOrArray });
    }

    this.logger.debug('Middleware added', {
      name: nameOrArray,
      count: middlewareManager.getMiddlewares().length
    });
  }

  private createBuiltinMiddleware(name: string): Middleware | null {
    // 创建内置中间件的工厂方法
    switch (name) {
      case 'auth':
        return {
          name: 'auth',
          execute: async (connection: WebSocketConnection, message: any, next: () => void) => {
            // 认证中间件逻辑
            next();
          }
        };
      case 'rateLimit':
        return {
          name: 'rateLimit',
          execute: async (connection: WebSocketConnection, message: any, next: () => void) => {
            // 限流中间件逻辑
            next();
          }
        };
      case 'logging':
        return {
          name: 'logging',
          execute: async (connection: WebSocketConnection, message: any, next: () => void) => {
            this.logger.debug('Message received', {
              connectionId: connection.id,
              messageType: message.type
            });
            next();
          }
        };
      default:
        this.logger.warn('Unknown builtin middleware', { name });
        return null;
    }
  }

  public getConnectionManager(): ConnectionManager {
    return this.connectionManager;
  }

  public getEventEmitter(): WebSocketEventEmitter {
    return this.eventEmitter;
  }

  public isRunning(): boolean {
    return this.isStarted;
  }

  public getConnections(): WebSocketConnection[] {
    return this.connectionManager.getAllConnections();
  }

  public getConnectionCount(): number {
    return this.connectionManager.getConnectionCount();
  }

  public getServerConfig(): ServerConfig {
    return { ...this.config };
  }

  public async gracefulShutdown(timeout: number = 30000): Promise<void> {
    this.logger.info('Starting graceful shutdown', { timeout });

    try {
      // 发送关闭通知到所有连接
      const connections = this.connectionManager.getAllConnections();
      const shutdownMessage = {
        type: MessageTypes.SYSTEM_MESSAGE,
        data: {
          content: 'Server is shutting down',
          level: 'warning'
        }
      };

      await Promise.all(
        connections.map(async (connection: WebSocketConnection) => {
          try {
            await connection.send(shutdownMessage);
          } catch (error) {
            // 忽略发送错误
          }
        })
      );

      // 等待一段时间让客户端处理消息
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 执行正常关闭
      await this.stop(timeout);

    } catch (error) {
      this.logger.error('Error during graceful shutdown', {
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }
}