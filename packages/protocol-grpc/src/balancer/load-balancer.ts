/**
 * gRPC负载均衡器实现
 */

import { EventEmitter } from 'events';
import { LoadBalancerConfig, HealthCheckerConfig, CircuitBreakerConfig } from '../types/grpc-types.js';
import { HealthChecker } from './health-checker.js';

export interface ServiceInstance {
  id: string;
  address: string;
  port: number;
  weight?: number;
  metadata?: Record<string, any>;
  health: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  requestCount: number;
  errorCount: number;
}

/**
 * 负载均衡策略接口
 */
export interface LoadBalancingStrategy {
  selectInstance(instances: ServiceInstance[]): ServiceInstance | null;
  updateStats(instance: ServiceInstance, responseTime: number, isError: boolean): void;
  getName(): string;
}

/**
 * 轮询策略
 */
export class RoundRobinStrategy implements LoadBalancingStrategy {
  private currentIndex = 0;

  getName(): string {
    return 'round_robin';
  }

  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(i => i.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      return null;
    }

    const selected = healthyInstances[this.currentIndex % healthyInstances.length];
    this.currentIndex++;
    
    return selected || null;
  }

  updateStats(instance: ServiceInstance, responseTime: number, isError: boolean): void {
    instance.responseTime = responseTime;
    instance.requestCount++;
    if (isError) {
      instance.errorCount++;
    }
  }
}

/**
 * 加权轮询策略
 */
export class WeightedRoundRobinStrategy implements LoadBalancingStrategy {
  private weightedQueue: ServiceInstance[] = [];
  private currentIndex = 0;

  getName(): string {
    return 'weighted_round_robin';
  }

  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(i => i.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      return null;
    }

    // 重建加权队列
    this.rebuildWeightedQueue(healthyInstances);
    
    if (this.weightedQueue.length === 0) {
      return null;
    }

    const selected = this.weightedQueue[this.currentIndex % this.weightedQueue.length];
    this.currentIndex++;
    
    return selected || null;
  }

  updateStats(instance: ServiceInstance, responseTime: number, isError: boolean): void {
    instance.responseTime = responseTime;
    instance.requestCount++;
    if (isError) {
      instance.errorCount++;
    }
  }

  private rebuildWeightedQueue(instances: ServiceInstance[]): void {
    this.weightedQueue = [];
    
    instances.forEach(instance => {
      const weight = instance.weight || 1;
      for (let i = 0; i < weight; i++) {
        this.weightedQueue.push(instance);
      }
    });
  }
}

/**
 * 最少请求数策略
 */
export class LeastRequestsStrategy implements LoadBalancingStrategy {
  getName(): string {
    return 'least_requests';
  }

  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(i => i.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      return null;
    }

    return healthyInstances.reduce((min, current) => 
      current.requestCount < min.requestCount ? current : min
    );
  }

  updateStats(instance: ServiceInstance, responseTime: number, isError: boolean): void {
    instance.responseTime = responseTime;
    instance.requestCount++;
    if (isError) {
      instance.errorCount++;
    }
  }
}

/**
 * 最快响应策略
 */
export class FastestResponseStrategy implements LoadBalancingStrategy {
  getName(): string {
    return 'fastest_response';
  }

  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(i => i.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      return null;
    }

    return healthyInstances.reduce((fastest, current) => 
      current.responseTime < fastest.responseTime ? current : fastest
    );
  }

  updateStats(instance: ServiceInstance, responseTime: number, isError: boolean): void {
    // 使用移动平均计算响应时间
    const alpha = 0.1; // 平滑因子
    instance.responseTime = instance.responseTime * (1 - alpha) + responseTime * alpha;
    instance.requestCount++;
    if (isError) {
      instance.errorCount++;
    }
  }
}

/**
 * 随机策略
 */
export class RandomStrategy implements LoadBalancingStrategy {
  getName(): string {
    return 'random';
  }

  selectInstance(instances: ServiceInstance[]): ServiceInstance | null {
    const healthyInstances = instances.filter(i => i.health === 'healthy');
    
    if (healthyInstances.length === 0) {
      return null;
    }

    const index = Math.floor(Math.random() * healthyInstances.length);
    return healthyInstances[index] || null;
  }

  updateStats(instance: ServiceInstance, responseTime: number, isError: boolean): void {
    instance.responseTime = responseTime;
    instance.requestCount++;
    if (isError) {
      instance.errorCount++;
    }
  }
}

/**
 * 熔断器
 */
export class CircuitBreaker extends EventEmitter {
  private config: CircuitBreakerConfig;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;

  constructor(config: CircuitBreakerConfig) {
    super();
    this.config = config;
  }

  /**
   * 检查是否可以执行请求
   */
  canExecute(): boolean {
    const now = Date.now();

    switch (this.state) {
      case 'CLOSED':
        return true;
      
      case 'OPEN':
        if (this.nextAttemptTime && now >= this.nextAttemptTime) {
          this.state = 'HALF_OPEN';
          this.emit('state:changed', { from: 'OPEN', to: 'HALF_OPEN' });
          return true;
        }
        return false;
      
      case 'HALF_OPEN':
        return true;
      
      default:
        return false;
    }
  }

  /**
   * 记录执行结果
   */
  recordResult(success: boolean): void {
    if (success) {
      this.onSuccess();
    } else {
      this.onFailure();
    }
  }

  /**
   * 获取熔断器状态
   */
  getState(): {
    state: string;
    failureCount: number;
    lastFailureTime?: number;
    nextAttemptTime?: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.emit('state:changed', { from: 'HALF_OPEN', to: 'CLOSED' });
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.state === 'HALF_OPEN') {
      this.openCircuit();
    } else if (this.failureCount >= this.config.failureThreshold) {
      this.openCircuit();
    }
  }

  private openCircuit(): void {
    this.state = 'OPEN';
    this.nextAttemptTime = Date.now() + this.config.recoveryTimeout;
    this.emit('state:changed', { from: 'CLOSED', to: 'OPEN' });
  }
}

/**
 * 负载均衡器
 */
export class LoadBalancer extends EventEmitter {
  private config: LoadBalancerConfig;
  private strategy: LoadBalancingStrategy;
  private instances = new Map<string, ServiceInstance>();
  private healthChecker?: HealthChecker;
  private circuitBreakers = new Map<string, CircuitBreaker>();

  constructor(config: LoadBalancerConfig) {
    super();
    this.config = config;
    this.strategy = this.createStrategy(config.policy);
    
    if (config.healthChecker) {
      this.healthChecker = new HealthChecker(config.healthChecker);
      this.setupHealthChecker();
    }
  }

  /**
   * 添加服务实例
   */
  addInstance(instance: Omit<ServiceInstance, 'health' | 'responseTime' | 'requestCount' | 'errorCount'>): void {
    const fullInstance: ServiceInstance = {
      ...instance,
      health: 'unknown',
      responseTime: 0,
      requestCount: 0,
      errorCount: 0
    };

    this.instances.set(instance.id, fullInstance);
    
    // 创建熔断器
    if (this.config.circuitBreaker?.enabled) {
      const circuitBreaker = new CircuitBreaker(this.config.circuitBreaker);
      this.circuitBreakers.set(instance.id, circuitBreaker);
    }

    this.emit('instance:added', { instance: fullInstance });
  }

  /**
   * 移除服务实例
   */
  removeInstance(instanceId: string): boolean {
    const removed = this.instances.delete(instanceId);
    if (removed) {
      this.circuitBreakers.delete(instanceId);
      this.emit('instance:removed', { instanceId });
    }
    return removed;
  }

  /**
   * 选择服务实例
   */
  selectInstance(availableTargets?: string[]): string | null {
    let candidateInstances = Array.from(this.instances.values());

    // 如果指定了可用目标，过滤实例
    if (availableTargets && availableTargets.length > 0) {
      candidateInstances = candidateInstances.filter(instance => 
        availableTargets.includes(`${instance.address}:${instance.port}`)
      );
    }

    // 过滤掉熔断器打开的实例
    if (this.config.circuitBreaker?.enabled) {
      candidateInstances = candidateInstances.filter(instance => {
        const circuitBreaker = this.circuitBreakers.get(instance.id);
        return !circuitBreaker || circuitBreaker.canExecute();
      });
    }

    const selected = this.strategy.selectInstance(candidateInstances);
    
    if (selected) {
      this.emit('instance:selected', { 
        instanceId: selected.id,
        strategy: this.strategy.getName(),
        address: `${selected.address}:${selected.port}`
      });
      return `${selected.address}:${selected.port}`;
    }

    this.emit('instance:none_available', { 
      totalInstances: this.instances.size,
      candidateCount: candidateInstances.length 
    });
    return null;
  }

  /**
   * 记录请求结果
   */
  recordRequestResult(target: string, responseTime: number, isError: boolean): void {
    const instance = this.findInstanceByTarget(target);
    if (!instance) {
      return;
    }

    // 更新策略统计
    this.strategy.updateStats(instance, responseTime, isError);
    
    // 更新熔断器
    const circuitBreaker = this.circuitBreakers.get(instance.id);
    if (circuitBreaker) {
      circuitBreaker.recordResult(!isError);
    }

    this.emit('request:recorded', {
      instanceId: instance.id,
      target,
      responseTime,
      isError,
      stats: {
        requestCount: instance.requestCount,
        errorCount: instance.errorCount,
        errorRate: instance.errorCount / instance.requestCount
      }
    });
  }

  /**
   * 获取所有实例状态
   */
  getInstanceStatuses(): Array<ServiceInstance & { circuitBreakerState?: any }> {
    return Array.from(this.instances.values()).map(instance => ({
      ...instance,
      circuitBreakerState: this.circuitBreakers.get(instance.id)?.getState()
    }));
  }

  /**
   * 获取负载均衡器统计
   */
  getStats(): {
    strategy: string;
    totalInstances: number;
    healthyInstances: number;
    unhealthyInstances: number;
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
  } {
    const instances = Array.from(this.instances.values());
    const totalRequests = instances.reduce((sum, i) => sum + i.requestCount, 0);
    const totalErrors = instances.reduce((sum, i) => sum + i.errorCount, 0);
    const avgResponseTime = instances.length > 0 
      ? instances.reduce((sum, i) => sum + i.responseTime, 0) / instances.length 
      : 0;

    return {
      strategy: this.strategy.getName(),
      totalInstances: instances.length,
      healthyInstances: instances.filter(i => i.health === 'healthy').length,
      unhealthyInstances: instances.filter(i => i.health === 'unhealthy').length,
      totalRequests,
      totalErrors,
      averageResponseTime: avgResponseTime
    };
  }

  /**
   * 更改负载均衡策略
   */
  changeStrategy(policy: string): void {
    this.strategy = this.createStrategy(policy);
    this.config.policy = policy;
    this.emit('strategy:changed', { policy });
  }

  /**
   * 创建负载均衡策略
   */
  private createStrategy(policy: string): LoadBalancingStrategy {
    switch (policy) {
      case 'round_robin':
        return new RoundRobinStrategy();
      case 'weighted_round_robin':
        return new WeightedRoundRobinStrategy();
      case 'least_requests':
        return new LeastRequestsStrategy();
      case 'fastest_response':
        return new FastestResponseStrategy();
      case 'random':
        return new RandomStrategy();
      default:
        throw new Error(`Unsupported load balancing policy: ${policy}`);
    }
  }

  /**
   * 设置健康检查器
   */
  private setupHealthChecker(): void {
    if (!this.healthChecker) {
      return;
    }

    this.healthChecker.on('health:changed', ({ instanceId, health }) => {
      const instance = this.instances.get(instanceId);
      if (instance) {
        instance.health = health;
        this.emit('instance:health_changed', { instanceId, health });
      }
    });

    // 启动健康检查
    this.healthChecker.start();
  }

  /**
   * 根据目标地址查找实例
   */
  private findInstanceByTarget(target: string): ServiceInstance | undefined {
    return Array.from(this.instances.values()).find(instance => 
      `${instance.address}:${instance.port}` === target
    );
  }

  /**
   * 停止负载均衡器
   */
  async stop(): Promise<void> {
    if (this.healthChecker) {
      await this.healthChecker.stop();
    }
    this.instances.clear();
    this.circuitBreakers.clear();
    this.emit('stopped');
  }
}