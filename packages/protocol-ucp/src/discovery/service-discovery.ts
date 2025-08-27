import { EventEmitter } from 'events';
import {
  ServiceRegistration,
  ServiceDiscoveryQuery,
  ServiceDiscoveryResult,
  HealthStatus,
  HealthCheckConfig
} from '../types/ucp-types.js';

/**
 * 服务发现配置
 */
export interface ServiceDiscoveryConfig {
  type: 'consul' | 'etcd' | 'zookeeper' | 'kubernetes' | 'static';
  address?: string;
  prefix?: string;
  timeout?: number;
  retryInterval?: number;
  maxRetries?: number;
  cacheTimeout?: number;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout?: number;
  };
}

/**
 * 服务注册配置
 */
export interface RegistryConfig extends ServiceDiscoveryConfig {
  service: {
    name: string;
    version: string;
    tags?: string[];
    meta?: Record<string, string>;
  };
  healthCheck?: HealthCheckConfig & {
    http?: string;
    tcp?: string;
    script?: string;
    interval: string;
    timeout?: string;
    deregisterAfter?: string;
  };
}

/**
 * 服务发现接口
 */
export interface ServiceDiscoveryInterface {
  register(service: ServiceRegistration): Promise<void>;
  deregister(serviceId: string): Promise<void>;
  discover(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult>;
  watch(query: ServiceDiscoveryQuery, callback: (result: ServiceDiscoveryResult) => void): () => void;
  getHealth(serviceId: string): Promise<HealthStatus>;
  updateHealth(serviceId: string, status: HealthStatus): Promise<void>;
}

/**
 * 服务发现实现
 */
export class ServiceDiscovery extends EventEmitter implements ServiceDiscoveryInterface {
  private readonly config: ServiceDiscoveryConfig;
  private services: Map<string, ServiceRegistration> = new Map();
  private cache: Map<string, { result: ServiceDiscoveryResult; expires: number }> = new Map();
  private watchers: Map<string, Array<{ query: ServiceDiscoveryQuery; callback: Function }>> = new Map();
  private healthChecks: Map<string, NodeJS.Timeout> = new Map();
  
  constructor(config: ServiceDiscoveryConfig) {
    super();
    this.config = config;
    this.startCacheCleanup();
  }
  
  /**
   * 注册服务
   */
  async register(service: ServiceRegistration): Promise<void> {
    try {
      switch (this.config.type) {
        case 'consul':
          await this.registerConsul(service);
          break;
        case 'etcd':
          await this.registerEtcd(service);
          break;
        case 'zookeeper':
          await this.registerZookeeper(service);
          break;
        case 'kubernetes':
          await this.registerKubernetes(service);
          break;
        case 'static':
          await this.registerStatic(service);
          break;
        default:
          throw new Error(`Unsupported service discovery type: ${this.config.type}`);
      }
      
      this.services.set(service.id, service);
      this.startHealthCheck(service);
      this.emit('service_registered', service);
      
    } catch (error) {
      this.emit('registration_failed', { service, error });
      throw error;
    }
  }
  
  /**
   * 注销服务
   */
  async deregister(serviceId: string): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    
    try {
      switch (this.config.type) {
        case 'consul':
          await this.deregisterConsul(serviceId);
          break;
        case 'etcd':
          await this.deregisterEtcd(serviceId);
          break;
        case 'zookeeper':
          await this.deregisterZookeeper(serviceId);
          break;
        case 'kubernetes':
          await this.deregisterKubernetes(serviceId);
          break;
        case 'static':
          await this.deregisterStatic(serviceId);
          break;
      }
      
      this.services.delete(serviceId);
      this.stopHealthCheck(serviceId);
      this.emit('service_deregistered', service);
      
    } catch (error) {
      this.emit('deregistration_failed', { serviceId, error });
      throw error;
    }
  }
  
  /**
   * 发现服务
   */
  async discover(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult> {
    const cacheKey = this.getCacheKey(query);
    const cached = this.cache.get(cacheKey);
    
    if (cached && cached.expires > Date.now()) {
      return cached.result;
    }
    
    try {
      let result: ServiceDiscoveryResult;
      
      switch (this.config.type) {
        case 'consul':
          result = await this.discoverConsul(query);
          break;
        case 'etcd':
          result = await this.discoverEtcd(query);
          break;
        case 'zookeeper':
          result = await this.discoverZookeeper(query);
          break;
        case 'kubernetes':
          result = await this.discoverKubernetes(query);
          break;
        case 'static':
          result = await this.discoverStatic(query);
          break;
        default:
          throw new Error(`Unsupported service discovery type: ${this.config.type}`);
      }
      
      // 过滤结果
      result.services = this.filterServices(result.services, query);
      
      // 缓存结果
      const cacheTimeout = this.config.cacheTimeout || 30000;
      this.cache.set(cacheKey, {
        result,
        expires: Date.now() + cacheTimeout
      });
      
      this.emit('services_discovered', { query, result });
      return result;
      
    } catch (error) {
      this.emit('discovery_failed', { query, error });
      throw error;
    }
  }
  
  /**
   * 监听服务变化
   */
  watch(query: ServiceDiscoveryQuery, callback: (result: ServiceDiscoveryResult) => void): () => void {
    const watchKey = this.getCacheKey(query);
    const watchers = this.watchers.get(watchKey) || [];
    watchers.push({ query, callback });
    this.watchers.set(watchKey, watchers);
    
    // 立即执行一次发现
    this.discover(query).then(callback).catch(error => {
      this.emit('watch_error', { query, error });
    });
    
    // 返回取消监听的函数
    return () => {
      const watchers = this.watchers.get(watchKey);
      if (watchers) {
        const index = watchers.findIndex(w => w.callback === callback);
        if (index !== -1) {
          watchers.splice(index, 1);
          if (watchers.length === 0) {
            this.watchers.delete(watchKey);
          }
        }
      }
    };
  }
  
  /**
   * 获取服务健康状态
   */
  async getHealth(serviceId: string): Promise<HealthStatus> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    
    try {
      switch (this.config.type) {
        case 'consul':
          return await this.getHealthConsul(serviceId);
        case 'etcd':
          return await this.getHealthEtcd(serviceId);
        case 'static':
          return await this.getHealthStatic(serviceId);
        default:
          return HealthStatus.UNKNOWN;
      }
    } catch (error) {
      this.emit('health_check_failed', { serviceId, error });
      return HealthStatus.UNHEALTHY;
    }
  }
  
  /**
   * 更新服务健康状态
   */
  async updateHealth(serviceId: string, status: HealthStatus): Promise<void> {
    const service = this.services.get(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }
    
    try {
      switch (this.config.type) {
        case 'consul':
          await this.updateHealthConsul(serviceId, status);
          break;
        case 'etcd':
          await this.updateHealthEtcd(serviceId, status);
          break;
        case 'static':
          await this.updateHealthStatic(serviceId, status);
          break;
      }
      
      this.emit('health_updated', { serviceId, status });
      
    } catch (error) {
      this.emit('health_update_failed', { serviceId, status, error });
      throw error;
    }
  }
  
  // Consul 实现
  private async registerConsul(service: ServiceRegistration): Promise<void> {
    // 实际的Consul注册实现
    // const consul = require('consul')({ host: this.config.address });
    // await consul.agent.service.register({
    //   id: service.id,
    //   name: service.name,
    //   address: service.address,
    //   port: service.port,
    //   tags: service.tags,
    //   check: service.healthCheck ? {
    //     http: service.healthCheck.endpoint,
    //     interval: service.healthCheck.interval
    //   } : undefined
    // });
    
    console.log(`Registering service ${service.name} with Consul`);
  }
  
  private async deregisterConsul(serviceId: string): Promise<void> {
    console.log(`Deregistering service ${serviceId} from Consul`);
  }
  
  private async discoverConsul(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult> {
    console.log(`Discovering services in Consul:`, query);
    return {
      services: [],
      lastUpdated: Date.now(),
      source: 'consul'
    };
  }
  
  private async getHealthConsul(serviceId: string): Promise<HealthStatus> {
    return HealthStatus.HEALTHY;
  }
  
  private async updateHealthConsul(serviceId: string, status: HealthStatus): Promise<void> {
    console.log(`Updating health status for ${serviceId}: ${status}`);
  }
  
  // etcd 实现
  private async registerEtcd(service: ServiceRegistration): Promise<void> {
    console.log(`Registering service ${service.name} with etcd`);
  }
  
  private async deregisterEtcd(serviceId: string): Promise<void> {
    console.log(`Deregistering service ${serviceId} from etcd`);
  }
  
  private async discoverEtcd(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult> {
    console.log(`Discovering services in etcd:`, query);
    return {
      services: [],
      lastUpdated: Date.now(),
      source: 'etcd'
    };
  }
  
  private async getHealthEtcd(serviceId: string): Promise<HealthStatus> {
    return HealthStatus.HEALTHY;
  }
  
  private async updateHealthEtcd(serviceId: string, status: HealthStatus): Promise<void> {
    console.log(`Updating health status for ${serviceId}: ${status}`);
  }
  
  // Zookeeper 实现
  private async registerZookeeper(service: ServiceRegistration): Promise<void> {
    console.log(`Registering service ${service.name} with Zookeeper`);
  }
  
  private async deregisterZookeeper(serviceId: string): Promise<void> {
    console.log(`Deregistering service ${serviceId} from Zookeeper`);
  }
  
  private async discoverZookeeper(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult> {
    console.log(`Discovering services in Zookeeper:`, query);
    return {
      services: [],
      lastUpdated: Date.now(),
      source: 'zookeeper'
    };
  }
  
  // Kubernetes 实现
  private async registerKubernetes(service: ServiceRegistration): Promise<void> {
    console.log(`Registering service ${service.name} with Kubernetes`);
  }
  
  private async deregisterKubernetes(serviceId: string): Promise<void> {
    console.log(`Deregistering service ${serviceId} from Kubernetes`);
  }
  
  private async discoverKubernetes(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult> {
    console.log(`Discovering services in Kubernetes:`, query);
    return {
      services: [],
      lastUpdated: Date.now(),
      source: 'kubernetes'
    };
  }
  
  // 静态配置实现
  private async registerStatic(service: ServiceRegistration): Promise<void> {
    console.log(`Registering service ${service.name} with static registry`);
  }
  
  private async deregisterStatic(serviceId: string): Promise<void> {
    console.log(`Deregistering service ${serviceId} from static registry`);
  }
  
  private async discoverStatic(query: ServiceDiscoveryQuery): Promise<ServiceDiscoveryResult> {
    const services = Array.from(this.services.values())
      .filter(service => service.name === query.name);
    
    return {
      services,
      lastUpdated: Date.now(),
      source: 'static'
    };
  }
  
  private async getHealthStatic(serviceId: string): Promise<HealthStatus> {
    return HealthStatus.HEALTHY;
  }
  
  private async updateHealthStatic(serviceId: string, status: HealthStatus): Promise<void> {
    console.log(`Updating health status for ${serviceId}: ${status}`);
  }
  
  private filterServices(services: ServiceRegistration[], query: ServiceDiscoveryQuery): ServiceRegistration[] {
    return services.filter(service => {
      // 名称匹配
      if (query.name && service.name !== query.name) {
        return false;
      }
      
      // 版本匹配
      if (query.version && service.version !== query.version) {
        return false;
      }
      
      // 协议匹配
      if (query.protocol && service.protocol !== query.protocol) {
        return false;
      }
      
      // 标签匹配
      if (query.tags && query.tags.length > 0) {
        const serviceTags = service.tags || [];
        const hasAllTags = query.tags.every(tag => serviceTags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }
      
      // 健康状态匹配
      if (query.healthy !== undefined) {
        // 这里需要实际的健康检查逻辑
        // 暂时假设所有服务都是健康的
      }
      
      // 元数据匹配
      if (query.metadata) {
        const serviceMetadata = service.metadata || {};
        for (const [key, value] of Object.entries(query.metadata)) {
          if (serviceMetadata[key] !== value) {
            return false;
          }
        }
      }
      
      return true;
    });
  }
  
  private getCacheKey(query: ServiceDiscoveryQuery): string {
    return JSON.stringify(query);
  }
  
  private startHealthCheck(service: ServiceRegistration): void {
    if (!this.config.healthCheck?.enabled || !service.healthCheck) {
      return;
    }
    
    const interval = this.config.healthCheck.interval || 30000;
    const timer = setInterval(async () => {
      try {
        const status = await this.performHealthCheck(service);
        await this.updateHealth(service.id, status);
      } catch (error) {
        this.emit('health_check_error', { serviceId: service.id, error });
        await this.updateHealth(service.id, HealthStatus.UNHEALTHY);
      }
    }, interval);
    
    this.healthChecks.set(service.id, timer);
  }
  
  private stopHealthCheck(serviceId: string): void {
    const timer = this.healthChecks.get(serviceId);
    if (timer) {
      clearInterval(timer);
      this.healthChecks.delete(serviceId);
    }
  }
  
  private async performHealthCheck(service: ServiceRegistration): Promise<HealthStatus> {
    if (!service.healthCheck || !service.healthCheck.enabled) {
      return HealthStatus.UNKNOWN;
    }
    
    try {
      // 简化的健康检查实现
      const healthUrl = `http://${service.address}:${service.port}${service.healthCheck.endpoint || '/health'}`;
      const response = await fetch(healthUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(service.healthCheck.timeout || 5000)
      });
      
      return response.ok ? HealthStatus.HEALTHY : HealthStatus.UNHEALTHY;
      
    } catch (error) {
      return HealthStatus.UNHEALTHY;
    }
  }
  
  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.cache) {
        if (cached.expires < now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // 每分钟清理一次
  }
  
  /**
   * 关闭服务发现
   */
  destroy(): void {
    // 停止所有健康检查
    for (const timer of this.healthChecks.values()) {
      clearInterval(timer);
    }
    this.healthChecks.clear();
    
    // 清理缓存和监听器
    this.cache.clear();
    this.watchers.clear();
    
    this.emit('destroyed');
  }
}