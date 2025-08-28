/**
 * gRPC客户端核心实现
 */

import { EventEmitter } from 'events';
import {
  ClientConfig,
  ClientMiddleware,
  MiddlewareContext,
  ServiceDiscoveryConfig,
  LoadBalancerConfig
} from '../types/grpc-types.js';
import { DEFAULT_CLIENT_CONFIG } from '../constants/grpc-constants.js';
import { ServiceDiscovery } from './service-discovery.js';
import { LoadBalancer } from '../balancer/load-balancer.js';
import { ConnectionPool } from './connection-pool.js';

// 定义协议类型以实现接口对齐
type ProtocolType = 'http' | 'grpc' | 'websocket' | 'ucp';

export interface ServiceClient {
  [methodName: string]: (...args: any[]) => Promise<any> | AsyncGenerator<any>;
}

export class GRPCClient extends EventEmitter {
  private config: ClientConfig;
  private middlewares: ClientMiddleware[] = [];
  private serviceDiscovery?: ServiceDiscovery;
  private loadBalancer?: LoadBalancer;
  private connectionPool?: ConnectionPool;
  private services = new Map<string, ServiceClient>();
  private isConnected = false;

  constructor(config: Partial<ClientConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CLIENT_CONFIG, ...config };

    this.initializeServiceDiscovery();
    this.initializeLoadBalancer();
    this.initializeConnectionPool();
  }

  /**
   * 获取服务客户端
   */
  getService<T extends ServiceClient>(serviceName: string): T {
    if (!this.services.has(serviceName)) {
      const serviceClient = this.createServiceClient<T>(serviceName);
      this.services.set(serviceName, serviceClient);
    }

    return this.services.get(serviceName) as T;
  }

  /**
   * 添加客户端中间件
   */
  use(middlewares: ClientMiddleware | ClientMiddleware[]): void {
    const middlewareArray = Array.isArray(middlewares) ? middlewares : [middlewares];
    this.middlewares.push(...middlewareArray);
  }

  /**
   * 连接到服务器
   */
  async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      if (this.serviceDiscovery) {
        await this.serviceDiscovery.start();
      }

      if (this.connectionPool) {
        await this.connectionPool.initialize();
      }

      this.isConnected = true;
      this.emit('client:connected');
    } catch (error) {
      this.emit('client:error', error);
      throw error;
    }
  }

  /**
   * 断开连接
   */
  async disconnect(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.connectionPool) {
        await this.connectionPool.close();
      }

      if (this.serviceDiscovery) {
        await this.serviceDiscovery.stop();
      }

      this.services.clear();
      this.isConnected = false;
      this.emit('client:disconnected');
    } catch (error) {
      this.emit('client:error', error);
      throw error;
    }
  }

  /**
   * 获取客户端状态
   */
  getStatus(): {
    isConnected: boolean;
    config: ClientConfig;
    services: string[];
    activeConnections: number;
  } {
    return {
      isConnected: this.isConnected,
      config: this.config,
      services: Array.from(this.services.keys()),
      activeConnections: this.connectionPool?.getActiveConnectionCount() || 0
    };
  }

  /**
   * 创建服务客户端代理
   */
  private createServiceClient<T extends ServiceClient>(serviceName: string): T {
    const serviceConfig = this.config.services?.[serviceName];

    return new Proxy({} as T, {
      get: (target, methodName: string) => {
        return (...args: any[]) => {
          return this.makeCall(serviceName, methodName, args[0], serviceConfig);
        };
      }
    });
  }

  /**
   * 执行gRPC调用
   */
  private async makeCall(
    serviceName: string,
    methodName: string,
    request: any,
    serviceConfig?: any
  ): Promise<any> {
    const context: MiddlewareContext = {
      service: serviceName,
      method: methodName,
      peer: this.getTargetAddress(serviceName),
      getMetadata: () => new Map(),
      setUser: () => { }
    };

    // 执行中间件链
    const middlewareChain = this.buildMiddlewareChain(serviceName, methodName, request, serviceConfig);
    return await middlewareChain(context);
  }

  /**
   * 构建中间件执行链
   */
  private buildMiddlewareChain(
    serviceName: string,
    methodName: string,
    request: any,
    serviceConfig?: any
  ) {
    return async (context: MiddlewareContext) => {
      let index = 0;

      const next = async (): Promise<any> => {
        if (index < this.middlewares.length) {
          const middleware = this.middlewares[index++]!;
          return await middleware({})(context, next);
        }

        // 执行实际的网络调用
        return await this.executeNetworkCall(serviceName, methodName, request, context, serviceConfig);
      };

      return await next();
    };
  }

  /**
   * 执行网络调用
   */
  private async executeNetworkCall(
    serviceName: string,
    methodName: string,
    request: any,
    context: MiddlewareContext,
    serviceConfig?: any
  ): Promise<any> {
    const target = await this.resolveTarget(serviceName);
    const timeout = serviceConfig?.timeout || this.config.defaultTimeout;

    try {
      // 模拟网络调用
      const response = await this.performActualCall(target || '', serviceName, methodName, request, timeout);

      this.emit('call:success', {
        service: serviceName,
        method: methodName,
        target
      });

      return response;
    } catch (error) {
      this.emit('call:error', {
        service: serviceName,
        method: methodName,
        target,
        error
      });
      throw error;
    }
  }

  /**
   * 解析目标地址
   */
  private async resolveTarget(serviceName: string): Promise<string | null> {
    // 如果有服务发现，使用服务发现
    if (this.serviceDiscovery) {
      const instances = await this.serviceDiscovery.discover(serviceName);
      if (instances.length > 0) {
        // 使用负载均衡器选择实例
        if (this.loadBalancer) {
          return this.loadBalancer.selectInstance(instances);
        }
        return instances[0] || null;
      }
    }

    // 如果有负载均衡配置
    if (this.config.loadBalancing?.targets && this.config.loadBalancing.targets.length > 0) {
      if (this.loadBalancer) {
        return this.loadBalancer.selectInstance(this.config.loadBalancing.targets);
      }
      return this.config.loadBalancing.targets[0] || null;
    }

    // 使用默认目标
    return this.config.target || 'localhost:50051';
  }

  /**
   * 获取目标地址（同步版本）
   */
  private getTargetAddress(serviceName: string): string {
    // 简化版本，实际应该异步解析
    return this.config.target || 'localhost:50051';
  }

  /**
   * 执行实际的网络调用
   */
  private async performActualCall(
    target: string,
    serviceName: string,
    methodName: string,
    request: any,
    timeout?: number
  ): Promise<any> {
    // 这里需要实际的gRPC网络调用实现
    // 为了示例，返回模拟响应
    return new Promise((resolve, reject) => {
      const timer = timeout ? setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout) : null;

      // 模拟异步网络调用
      setTimeout(() => {
        if (timer) clearTimeout(timer);

        // 模拟成功响应
        resolve({
          success: true,
          service: serviceName,
          method: methodName,
          data: request
        });
      }, 100);
    });
  }

  /**
   * 初始化服务发现
   */
  private initializeServiceDiscovery(): void {
    if (this.config.serviceDiscovery) {
      this.serviceDiscovery = new ServiceDiscovery(this.config.serviceDiscovery);
    }
  }

  /**
   * 初始化负载均衡器
   */
  private initializeLoadBalancer(): void {
    if (this.config.loadBalancer || this.config.loadBalancing) {
      this.loadBalancer = new LoadBalancer(
        this.config.loadBalancer || {
          policy: this.config.loadBalancing?.policy || 'round_robin'
        }
      );
    }
  }

  /**
   * 初始化连接池
   */
  private initializeConnectionPool(): void {
    if (this.config.connection) {
      // 根据连接配置创建连接池
      this.connectionPool = new ConnectionPool({
        minConnections: 5,
        maxConnections: 50,
        maxConnectionAge: 600000,
        maxConnectionIdle: 300000,
        connectionTimeout: 10000,
        healthCheckInterval: 30000,
        healthCheckTimeout: 5000,
        balancingPolicy: 'round_robin',
        warmupConnections: 3,
        warmupTimeout: 5000
      });
    }
  }

  // ========================================
  // ProtocolClient接口实现 - 接口对齐
  // ========================================

  /**
   * 协议类型 - ProtocolClient接口要求
   */
  get protocol(): ProtocolType {
    return 'grpc' as ProtocolType;
  }

  /**
   * 目标地址 - ProtocolClient接口要求
   */
  get target(): string {
    return this.config.target || '';
  }

  /**
   * 统一的RPC调用方法 - ProtocolClient接口实现
   * gRPC本身就是RPC协议，直接映射
   *
   * @param service 服务名称
   * @param method 方法名称
   * @param data 请求数据
   * @param options 调用选项
   */
  async call(service: string, method: string, data: any, options?: any): Promise<any> {
    try {
      // 获取或创建服务客户端
      const serviceClient = await this.getServiceClient(service);

      // 调用指定方法
      if (typeof serviceClient[method] === 'function') {
        const result = await serviceClient[method](data, options);
        return result;
      } else {
        throw new Error(`Method ${method} not found in service ${service}`);
      }
    } catch (error) {
      throw this.convertToProtocolError(error);
    }
  }

  /**
   * 流式调用方法 - ProtocolClient接口实现
   * gRPC原生支持流式调用
   *
   * @param service 服务名称
   * @param method 方法名称
   * @param data 请求数据
   * @param options 流选项
   */
  async *stream(service: string, method: string, data: any, options?: any): AsyncIterableIterator<any> {
    try {
      // 获取或创建服务客户端
      const serviceClient = await this.getServiceClient(service);

      // 调用流式方法
      if (typeof serviceClient[method] === 'function') {
        const stream = serviceClient[method](data, options);

        // 如果返回的是AsyncGenerator，直接yield
        if (stream && typeof (stream as any)[Symbol.asyncIterator] === 'function') {
          for await (const item of stream as AsyncIterable<any>) {
            yield item;
          }
        } else {
          // 如果是Promise，等待结果并yield
          const result = await stream;
          yield result;
        }
      } else {
        throw new Error(`Stream method ${method} not found in service ${service}`);
      }
    } catch (error) {
      throw this.convertToProtocolError(error);
    }
  }

  /**
   * 关闭连接 - ProtocolClient接口实现
   */
  async close(): Promise<void> {
    if (!this.isConnected) {
      return;
    }

    try {
      if (this.connectionPool) {
        await this.connectionPool.close();
      }

      if (this.serviceDiscovery) {
        await this.serviceDiscovery.stop();
      }

      this.services.clear();
      this.isConnected = false;
      this.emit('client:disconnected');
    } catch (error) {
      this.emit('client:error', error);
      throw error;
    }
  }

  /**
   * 获取服务客户端
   */
  private async getServiceClient(serviceName: string): Promise<ServiceClient> {
    let serviceClient = this.services.get(serviceName);

    if (!serviceClient) {
      // 如果服务客户端不存在，创建一个基本的代理
      serviceClient = new Proxy({}, {
        get: (target, prop: string) => {
          return async (data: any, options?: any) => {
            // 这里应该实现实际的gRPC调用逻辑
            // 当前是一个占位符实现
            throw new Error(`gRPC call not implemented: ${serviceName}.${prop}`);
          };
        }
      });

      this.services.set(serviceName, serviceClient);
    }

    return serviceClient;
  }

  /**
   * 将gRPC错误转换为协议错误
   */
  private convertToProtocolError(error: any): Error {
    if (error.code !== undefined) {
      // gRPC错误
      const protocolError = new Error(`gRPC ${error.code}: ${error.details || error.message}`);
      (protocolError as any).code = `GRPC_${error.code}`;
      (protocolError as any).status = error.code;
      (protocolError as any).details = error.details;
      return protocolError;
    } else {
      // 其他错误
      return error;
    }
  }
}