/**
 * gRPC服务器核心实现
 */

import { SkerCore } from '@sker/core';
import { 
  ServerConfig, 
  ServiceHandler, 
  ServiceRegistrationOptions, 
  ServerMiddleware, 
  MiddlewareContext as GRPCMiddlewareContext,
  GRPCServerOptions 
} from '../types/grpc-types.js';
import { MiddlewareContext } from '@sker/core';
import { DEFAULT_SERVER_CONFIG } from '../constants/grpc-constants.js';
import { ServiceRegistry } from './service-registry.js';

export class GRPCServer extends SkerCore {
  private config: ServerConfig;
  private serviceRegistry: ServiceRegistry;
  private server: any; // HTTP/2服务器实例

  constructor(options: GRPCServerOptions) {
    super({
      serviceName: options.serviceName || 'grpc-server',
      version: options.version || '1.0.0',
      environment: options.environment || 'development',
      ...options.coreOptions
    });
    
    this.config = { ...DEFAULT_SERVER_CONFIG, ...options.serverConfig } as any;
    this.serviceRegistry = new ServiceRegistry();
    
    // 设置生命周期钩子
    this.getLifecycle().onStart(this.startGRPCServer.bind(this));
    this.getLifecycle().onStop(this.stopGRPCServer.bind(this));
    
    // 注册核心中间件
    this.setupCoreMiddleware();
  }

  /**
   * 设置核心中间件
   */
  private setupCoreMiddleware(): void {
    // 使用 @sker/core 的中间件管理器
    const middleware = this.getMiddleware();
    
    // 添加请求日志中间件
    middleware.use(async (context, next) => {
      const start = Date.now();
      // Extract method from context metadata if available
      const method = context.metadata?.method || 'unknown';
      this.emit('request:start', {
        method,
        timestamp: start
      });
      
      try {
        const result = await next();
        const duration = Date.now() - start;
        this.emit('request:success', {
          method,
          duration,
          timestamp: start
        });
        return result;
      } catch (error) {
        const duration = Date.now() - start;
        this.emit('request:error', {
          method,
          error,
          duration,
          timestamp: start
        });
        throw error;
      }
    });
  }

  /**
   * 添加服务实现
   */
  addService<T extends ServiceHandler>(
    serviceName: string, 
    implementation: T, 
    options?: ServiceRegistrationOptions
  ): void {
    this.serviceRegistry.addService(serviceName, implementation, options);
    this.emit('service:registered', { serviceName, options });
  }

  /**
   * 移除服务
   */
  removeService(serviceName: string): boolean {
    const removed = this.serviceRegistry.removeService(serviceName);
    if (removed) {
      this.emit('service:unregistered', { serviceName });
    }
    return removed;
  }

  /**
   * 获取已注册的服务列表
   */
  getServices(): string[] {
    return this.serviceRegistry.listServices();
  }

  /**
   * 添加服务中间件 (使用核心中间件管理器)
   */
  use(name: string, middlewares: ServerMiddleware | ServerMiddleware[]): void {
    const middlewareManager = this.getMiddleware();
    const middlewareArray = Array.isArray(middlewares) ? middlewares : [middlewares];
    
    middlewareArray.forEach((middleware, index) => {
      // Wrap gRPC middleware to match core middleware interface
      const wrappedMiddleware = async (context: MiddlewareContext, next: () => Promise<void>) => {
        // Create gRPC-specific context from core context
        const grpcContext: GRPCMiddlewareContext = {
          service: context.metadata?.service || '',
          method: context.metadata?.method || '',
          peer: context.metadata?.peer || '',
          getMetadata: () => new Map(),
          setUser: (user: any) => {
            if (!context.metadata) context.metadata = {};
            context.metadata.user = user;
          }
        };
        
        return await middleware(grpcContext, async () => {
          await next();
          return context.response;
        });
      };
      
      middlewareManager.use(wrappedMiddleware, { name: `${name}-${index}` });
    });
  }

  /**
   * gRPC服务器启动逻辑 (生命周期钩子)
   */
  private async startGRPCServer(): Promise<void> {
    try {
      await this.createServer();
      await this.bindServer();
      await this.startHealthCheck();
      
      this.emit('grpc:server_started', {
        host: this.config.host,
        port: this.config.port,
        services: this.getServices()
      });
    } catch (error) {
      this.emit('grpc:server_error', error);
      throw error;
    }
  }

  /**
   * gRPC服务器停止逻辑 (生命周期钩子)
   */
  private async stopGRPCServer(): Promise<void> {
    try {
      await this.stopServer();
      this.emit('grpc:server_stopped');
    } catch (error) {
      this.emit('grpc:server_error', error);
      throw error;
    }
  }

  /**
   * 优雅关闭服务器
   */
  async gracefulShutdown(timeout: number = 5000): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    this.emit('server:graceful_shutdown_start');

    try {
      // 停止接收新连接
      await this.stopAcceptingConnections();
      
      // 等待现有连接完成
      const shutdownPromise = this.waitForConnectionsToClose();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Graceful shutdown timeout')), timeout)
      );

      await Promise.race([shutdownPromise, timeoutPromise]);
      
      // 强制关闭剩余连接
      await this.forceCloseConnections();
      
      // Use the core's stop method to properly set the started state
      await this.stop();
      this.emit('server:graceful_shutdown_complete');
    } catch (error) {
      this.emit('server:error', error);
      await this.stop(); // 强制停止
      throw error;
    }
  }

  /**
   * 获取服务器状态
   */
  getStatus(): {
    isRunning: boolean;
    config: ServerConfig;
    services: string[];
    connections: number;
  } {
    return {
      isRunning: this.isStarted,
      config: this.config,
      services: this.getServices(),
      connections: this.getActiveConnectionCount()
    };
  }

  /**
   * 处理gRPC调用
   */
  private async handleCall(
    serviceName: string,
    methodName: string,
    request: any,
    context: GRPCMiddlewareContext
  ): Promise<any> {
    // 执行中间件链
    const middlewareChain = this.buildMiddlewareChain(serviceName, methodName, request);
    return await middlewareChain(context);
  }

  /**
   * 构建中间件执行链
   */
  private buildMiddlewareChain(
    serviceName: string,
    methodName: string,
    request: any
  ) {
    const middlewareManager = this.getMiddleware();
    return async (context: GRPCMiddlewareContext) => {
      // Convert gRPC context to core middleware context
      const coreContext: MiddlewareContext = {
        request,
        response: undefined,
        data: undefined,
        metadata: {
          service: context.service,
          method: context.method,
          peer: context.peer
        }
      };
      
      // 使用核心中间件管理器执行中间件链
      await middlewareManager.execute(coreContext);
      
      // 执行实际的服务方法
      return await this.executeServiceMethod(serviceName, methodName, request, context);
    };
  }

  /**
   * 执行服务方法
   */
  private async executeServiceMethod(
    serviceName: string,
    methodName: string,
    request: any,
    context: GRPCMiddlewareContext
  ): Promise<any> {
    const service = this.serviceRegistry.getService(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    const method = service[methodName];
    if (!method || typeof method !== 'function') {
      throw new Error(`Method not found: ${serviceName}.${methodName}`);
    }

    try {
      const result = await method.call(service, request, context);
      return result;
    } catch (error) {
      this.emit('method:error', {
        service: serviceName,
        method: methodName,
        error
      });
      throw error;
    }
  }

  /**
   * 创建HTTP/2服务器
   */
  private async createServer(): Promise<void> {
    // 这里需要实际的HTTP/2服务器实现
    // 为了示例，使用模拟实现
    this.server = {
      listen: (port: number, host: string) => {
        return new Promise((resolve) => {
          setTimeout(resolve, 100); // 模拟异步启动
        });
      },
      close: () => {
        return new Promise((resolve) => {
          setTimeout(resolve, 100); // 模拟异步关闭
        });
      }
    };
  }

  /**
   * 绑定服务器到指定端口
   */
  private async bindServer(): Promise<void> {
    return await this.server.listen(this.config.port, this.config.host);
  }

  /**
   * 启动健康检查
   */
  private async startHealthCheck(): Promise<void> {
    if (this.config.healthCheck?.enabled) {
      // 实现健康检查逻辑
      this.emit('health_check:started');
    }
  }

  /**
   * 停止服务器
   */
  private async stopServer(): Promise<void> {
    if (this.server) {
      await this.server.close();
    }
  }

  /**
   * 停止接收新连接
   */
  private async stopAcceptingConnections(): Promise<void> {
    // 实现停止接收新连接的逻辑
  }

  /**
   * 等待现有连接关闭
   */
  private async waitForConnectionsToClose(): Promise<void> {
    // 实现等待连接关闭的逻辑
    return new Promise((resolve) => {
      const checkConnections = () => {
        if (this.getActiveConnectionCount() === 0) {
          resolve();
        } else {
          setTimeout(checkConnections, 100);
        }
      };
      checkConnections();
    });
  }

  /**
   * 强制关闭连接
   */
  private async forceCloseConnections(): Promise<void> {
    // 实现强制关闭连接的逻辑
  }

  /**
   * 获取活跃连接数
   */
  private getActiveConnectionCount(): number {
    // 实现获取活跃连接数的逻辑
    return 0; // 模拟返回
  }
}