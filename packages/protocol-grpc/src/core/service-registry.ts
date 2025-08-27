/**
 * 服务注册中心
 */

import { ServiceHandler, ServiceRegistrationOptions } from '../types/grpc-types.js';

interface RegisteredService {
  implementation: ServiceHandler;
  options?: ServiceRegistrationOptions;
}

export class ServiceRegistry {
  private services = new Map<string, RegisteredService>();

  /**
   * 添加服务实现
   */
  addService<T extends ServiceHandler>(
    serviceName: string,
    implementation: T,
    options?: ServiceRegistrationOptions
  ): void {
    if (this.services.has(serviceName)) {
      throw new Error(`Service already registered: ${serviceName}`);
    }

    this.services.set(serviceName, {
      implementation,
      options
    });
  }

  /**
   * 获取服务实现
   */
  getService(serviceName: string): ServiceHandler | undefined {
    const service = this.services.get(serviceName);
    return service?.implementation;
  }

  /**
   * 获取服务配置
   */
  getServiceOptions(serviceName: string): ServiceRegistrationOptions | undefined {
    const service = this.services.get(serviceName);
    return service?.options;
  }

  /**
   * 移除服务
   */
  removeService(serviceName: string): boolean {
    return this.services.delete(serviceName);
  }

  /**
   * 列出所有注册的服务
   */
  listServices(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * 检查服务是否存在
   */
  hasService(serviceName: string): boolean {
    return this.services.has(serviceName);
  }

  /**
   * 清空所有服务
   */
  clear(): void {
    this.services.clear();
  }

  /**
   * 获取服务数量
   */
  size(): number {
    return this.services.size;
  }
}