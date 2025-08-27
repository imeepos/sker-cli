/**
 * 双向流实现
 */

import { EventEmitter } from 'events';
import { BidirectionalStreamHandler, StreamMessage, StreamOptions } from './stream-handler.js';

export interface BidirectionalStreamOptions extends StreamOptions {
  pingInterval?: number;
  pongTimeout?: number;
  reconnectAttempts?: number;
  reconnectDelay?: number;
}

/**
 * 双向流客户端
 */
export class BidirectionalStreamClient<TReq = any, TRes = any> extends EventEmitter {
  private handler: BidirectionalStreamHandler<TReq, TRes>;
  private options: Required<BidirectionalStreamOptions>;
  private pingInterval?: NodeJS.Timeout;
  private pongTimeout?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private isConnected = false;

  constructor(options: BidirectionalStreamOptions = {}) {
    super();
    
    this.options = {
      bufferSize: options.bufferSize || 1000,
      timeout: options.timeout || 30000,
      maxMessages: options.maxMessages || Number.MAX_SAFE_INTEGER,
      enableBackpressure: options.enableBackpressure ?? true,
      compressionEnabled: options.compressionEnabled ?? false,
      pingInterval: options.pingInterval || 30000, // 30秒心跳
      pongTimeout: options.pongTimeout || 10000,   // 10秒响应超时
      reconnectAttempts: options.reconnectAttempts || 5,
      reconnectDelay: options.reconnectDelay || 1000
    };

    this.handler = new BidirectionalStreamHandler<TReq, TRes>(this.options);
    this.setupHandlerEvents();
  }

  /**
   * 连接到服务器
   */
  async connect(target: string): Promise<void> {
    try {
      await this.handler.start();
      this.isConnected = true;
      this.startHeartbeat();
      this.emit('connected', { target });
    } catch (error) {
      this.emit('error', { type: 'connect', error });
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    try {
      this.stopHeartbeat();
      await this.handler.stop();
      this.isConnected = false;
      this.emit('disconnected');
    } catch (error) {
      this.emit('error', { type: 'disconnect', error });
      throw error;
    }
  }

  /**
   * 发送消息
   */
  async send(data: TReq, metadata?: Record<string, any>): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    try {
      await this.handler.sendRequest(data, metadata);
      this.emit('message:sent', { data, metadata });
    } catch (error) {
      this.emit('error', { type: 'send', error });
      throw error;
    }
  }

  /**
   * 接收消息流
   */
  async *receive(): AsyncGenerator<TRes> {
    if (!this.isConnected) {
      throw new Error('Not connected to server');
    }

    try {
      for await (const message of this.handler.receiveResponses()) {
        if (this.isHeartbeatMessage(message)) {
          this.handleHeartbeatMessage(message);
        } else {
          this.emit('message:received', message);
          yield message.data;
        }
      }
    } catch (error) {
      this.emit('error', { type: 'receive', error });
      throw error;
    }
  }

  /**
   * 发送聊天消息（示例方法）
   */
  async sendChatMessage(content: string, userId: string): Promise<void> {
    const message = {
      type: 'chat',
      content,
      userId,
      timestamp: new Date()
    } as TReq;

    await this.send(message);
  }

  /**
   * 订阅事件流（示例方法）
   */
  async subscribeToEvents(eventTypes: string[], filters?: Record<string, any>): Promise<void> {
    const subscribeMessage = {
      type: 'subscribe',
      eventTypes,
      filters,
      timestamp: new Date()
    } as TReq;

    await this.send(subscribeMessage);
  }

  /**
   * 获取连接状态
   */
  getStatus(): {
    isConnected: boolean;
    reconnectAttempts: number;
    streamStatus: any;
  } {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      streamStatus: this.handler.getStatus()
    };
  }

  /**
   * 设置流处理器事件
   */
  private setupHandlerEvents(): void {
    this.handler.on('request:sent', (message) => {
      this.emit('request:sent', message);
    });

    this.handler.on('response:received', (message) => {
      this.emit('response:received', message);
    });

    this.handler.on('stream:started', () => {
      this.emit('stream:started');
    });

    this.handler.on('stream:stopped', () => {
      this.emit('stream:stopped');
      this.attemptReconnect();
    });
  }

  /**
   * 启动心跳检测
   */
  private startHeartbeat(): void {
    this.pingInterval = setInterval(async () => {
      try {
        await this.sendPing();
        this.setupPongTimeout();
      } catch (error) {
        this.emit('heartbeat:error', error);
      }
    }, this.options.pingInterval);
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }

    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
      this.pongTimeout = undefined;
    }
  }

  /**
   * 发送心跳包
   */
  private async sendPing(): Promise<void> {
    const pingMessage = {
      type: 'ping',
      timestamp: Date.now()
    } as TReq;

    await this.handler.sendRequest(pingMessage);
  }

  /**
   * 设置心跳响应超时
   */
  private setupPongTimeout(): void {
    if (this.pongTimeout) {
      clearTimeout(this.pongTimeout);
    }

    this.pongTimeout = setTimeout(() => {
      this.emit('heartbeat:timeout');
      this.handleConnectionLost();
    }, this.options.pongTimeout);
  }

  /**
   * 处理心跳消息
   */
  private handleHeartbeatMessage(message: StreamMessage<TRes>): void {
    const data = message.data as any;
    
    if (data.type === 'pong') {
      if (this.pongTimeout) {
        clearTimeout(this.pongTimeout);
        this.pongTimeout = undefined;
      }
      this.emit('heartbeat:received');
    }
  }

  /**
   * 检查是否为心跳消息
   */
  private isHeartbeatMessage(message: StreamMessage<TRes>): boolean {
    const data = message.data as any;
    return data && (data.type === 'ping' || data.type === 'pong');
  }

  /**
   * 处理连接丢失
   */
  private handleConnectionLost(): void {
    this.isConnected = false;
    this.emit('connection:lost');
    this.attemptReconnect();
  }

  /**
   * 尝试重连
   */
  private async attemptReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.options.reconnectAttempts) {
      this.emit('reconnect:failed');
      return;
    }

    this.reconnectAttempts++;
    this.emit('reconnect:attempt', { attempt: this.reconnectAttempts });

    setTimeout(async () => {
      try {
        await this.handler.start();
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('reconnected');
      } catch (error) {
        this.emit('reconnect:error', { attempt: this.reconnectAttempts, error });
        await this.attemptReconnect();
      }
    }, this.options.reconnectDelay * this.reconnectAttempts);
  }
}

/**
 * 双向流服务器
 */
export class BidirectionalStreamServer<TReq = any, TRes = any> extends EventEmitter {
  private connections = new Map<string, BidirectionalStreamHandler<TReq, TRes>>();
  private options: BidirectionalStreamOptions;
  private isListening = false;

  constructor(options: BidirectionalStreamOptions = {}) {
    super();
    this.options = options;
  }

  /**
   * 启动服务器监听
   */
  async listen(port: number): Promise<void> {
    try {
      // 模拟服务器启动
      this.isListening = true;
      this.emit('listening', { port });
    } catch (error) {
      this.emit('error', { type: 'listen', error });
      throw error;
    }
  }

  /**
   * 停止服务器
   */
  async stop(): Promise<void> {
    try {
      // 关闭所有连接
      const closePromises = Array.from(this.connections.values()).map(handler => 
        handler.stop()
      );
      await Promise.all(closePromises);
      
      this.connections.clear();
      this.isListening = false;
      this.emit('stopped');
    } catch (error) {
      this.emit('error', { type: 'stop', error });
      throw error;
    }
  }

  /**
   * 处理新连接
   */
  async handleConnection(connectionId: string): Promise<BidirectionalStreamHandler<TReq, TRes>> {
    const handler = new BidirectionalStreamHandler<TReq, TRes>(this.options);
    
    // 设置连接事件处理
    handler.on('request:sent', (message) => {
      this.emit('message:received', { connectionId, message });
    });

    handler.on('stream:stopped', () => {
      this.connections.delete(connectionId);
      this.emit('connection:closed', { connectionId });
    });

    await handler.start();
    this.connections.set(connectionId, handler);
    
    this.emit('connection:established', { connectionId });
    return handler;
  }

  /**
   * 向特定连接发送消息
   */
  async sendToConnection(connectionId: string, data: TRes, metadata?: Record<string, any>): Promise<void> {
    const handler = this.connections.get(connectionId);
    if (!handler) {
      throw new Error(`Connection not found: ${connectionId}`);
    }

    await handler.sendResponse(data, metadata);
  }

  /**
   * 广播消息到所有连接
   */
  async broadcast(data: TRes, metadata?: Record<string, any>): Promise<void> {
    const promises = Array.from(this.connections.values()).map(handler => 
      handler.sendResponse(data, metadata)
    );

    await Promise.allSettled(promises);
  }

  /**
   * 获取连接列表
   */
  getConnections(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * 获取服务器状态
   */
  getStatus(): {
    isListening: boolean;
    connectionCount: number;
    connections: string[];
  } {
    return {
      isListening: this.isListening,
      connectionCount: this.connections.size,
      connections: this.getConnections()
    };
  }

  /**
   * 关闭特定连接
   */
  async closeConnection(connectionId: string): Promise<void> {
    const handler = this.connections.get(connectionId);
    if (handler) {
      await handler.stop();
      this.connections.delete(connectionId);
      this.emit('connection:closed', { connectionId });
    }
  }
}