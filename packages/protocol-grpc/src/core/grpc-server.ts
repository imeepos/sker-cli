/**
 * gRPC服务器核心实现
 */

import { EventEmitter } from 'events';
import { 
  ServerConfig, 
  ServiceHandler, 
  ServiceRegistrationOptions, 
  ServerMiddleware, 
  MiddlewareContext 
} from '../types/grpc-types.js';
import { DEFAULT_SERVER_CONFIG } from '../constants/grpc-constants.js';
import { ServiceRegistry } from './service-registry.js';

export class GRPCServer extends EventEmitter {
  private config: ServerConfig;
  private serviceRegistry: ServiceRegistry;
  private middlewares: ServerMiddleware[] = [];
  private isRunning = false;
  private server: any; // HTTP/2服务器实例

  constructor(config: Partial<ServerConfig> = {}) {
    super();
    this.config = { ...DEFAULT_SERVER_CONFIG, ...config } as any;
    this.serviceRegistry = new ServiceRegistry();
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
   * 添加服务器中间件
   */
  use(middlewares: ServerMiddleware | ServerMiddleware[]): void {
    const middlewareArray = Array.isArray(middlewares) ? middlewares : [middlewares];
    this.middlewares.push(...middlewareArray);
  }

  /**
   * 启动gRPC服务器
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server is already running');
    }

    try {
      await this.createServer();
      await this.bindServer();
      await this.startHealthCheck();
      
      this.isRunning = true;
      this.emit('server:started', {
        host: this.config.host,
        port: this.config.port
      });
    } catch (error) {
      this.emit('server:error', error);
      throw error;
    }
  }

  /**
   * 停止gRPC服务器
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.stopServer();
      this.isRunning = false;
      this.emit('server:stopped');
    } catch (error) {
      this.emit('server:error', error);
      throw error;
    }
  }

  /**
   * 优雅关闭服务器
   */
  async gracefulShutdown(timeout: number = 5000): Promise<void> {
    if (!this.isRunning) {
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
      
      this.isRunning = false;
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
      isRunning: this.isRunning,
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
    context: MiddlewareContext
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
    return async (context: MiddlewareContext) => {
      let index = 0;

      const next = async (): Promise<any> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index++]!;
          return await middleware(context, next);
        }
        
        // 执行实际的服务方法
        return await this.executeServiceMethod(serviceName, methodName, request, context);
      };

      return await next();
    };
  }

  /**
   * 执行服务方法
   */
  private async executeServiceMethod(
    serviceName: string,
    methodName: string,
    request: any,
    context: MiddlewareContext
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