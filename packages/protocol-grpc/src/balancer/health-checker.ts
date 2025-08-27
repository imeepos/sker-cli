/**
 * gRPC健康检查器实现
 */

import { EventEmitter } from 'events';
import { HealthCheckerConfig } from '../types/grpc-types.js';

export interface HealthCheckResult {
  instanceId: string;
  target: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  responseTime: number;
  error?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface HealthCheckTarget {
  id: string;
  address: string;
  port: number;
  serviceName?: string;
  metadata?: Record<string, any>;
}

/**
 * 健康检查器
 */
export class HealthChecker extends EventEmitter {
  protected config: HealthCheckerConfig;
  private targets = new Map<string, HealthCheckTarget>();
  protected healthStatus = new Map<string, HealthCheckResult>();
  private checkInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor(config: HealthCheckerConfig) {
    super();
    this.config = config;
  }

  /**
   * 启动健康检查
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.scheduleNextCheck();
    this.emit('started');
  }

  /**
   * 停止健康检查
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    
    if (this.checkInterval) {
      clearTimeout(this.checkInterval);
      this.checkInterval = undefined;
    }

    this.emit('stopped');
  }

  /**
   * 添加健康检查目标
   */
  addTarget(target: HealthCheckTarget): void {
    this.targets.set(target.id, target);
    
    // 初始化健康状态为未知
    this.healthStatus.set(target.id, {
      instanceId: target.id,
      target: `${target.address}:${target.port}`,
      status: 'unknown',
      responseTime: 0,
      timestamp: new Date()
    });

    this.emit('target:added', { target });
  }

  /**
   * 移除健康检查目标
   */
  removeTarget(targetId: string): boolean {
    const removed = this.targets.delete(targetId);
    if (removed) {
      this.healthStatus.delete(targetId);
      this.emit('target:removed', { targetId });
    }
    return removed;
  }

  /**
   * 获取目标健康状态
   */
  getTargetHealth(targetId: string): HealthCheckResult | undefined {
    return this.healthStatus.get(targetId);
  }

  /**
   * 获取所有目标健康状态
   */
  getAllHealthStatuses(): HealthCheckResult[] {
    return Array.from(this.healthStatus.values());
  }

  /**
   * 手动执行健康检查
   */
  async checkTarget(targetId: string): Promise<HealthCheckResult> {
    const target = this.targets.get(targetId);
    if (!target) {
      throw new Error(`Target not found: ${targetId}`);
    }

    return await this.performHealthCheck(target);
  }

  /**
   * 检查所有目标
   */
  async checkAllTargets(): Promise<HealthCheckResult[]> {
    const checkPromises = Array.from(this.targets.values()).map(target => 
      this.performHealthCheck(target)
    );

    return await Promise.all(checkPromises);
  }

  /**
   * 获取健康检查统计
   */
  getStats(): {
    totalTargets: number;
    healthyTargets: number;
    unhealthyTargets: number;
    unknownTargets: number;
    averageResponseTime: number;
  } {
    const results = Array.from(this.healthStatus.values());
    const totalTargets = results.length;
    const healthyTargets = results.filter(r => r.status === 'healthy').length;
    const unhealthyTargets = results.filter(r => r.status === 'unhealthy').length;
    const unknownTargets = results.filter(r => r.status === 'unknown').length;
    const averageResponseTime = totalTargets > 0 
      ? results.reduce((sum, r) => sum + r.responseTime, 0) / totalTargets
      : 0;

    return {
      totalTargets,
      healthyTargets,
      unhealthyTargets,
      unknownTargets,
      averageResponseTime
    };
  }

  /**
   * 执行健康检查
   */
  protected async performHealthCheck(target: HealthCheckTarget): Promise<HealthCheckResult> {
    const startTime = Date.now();
    let result: HealthCheckResult;

    try {
      // 执行实际的健康检查
      await this.executeHealthCheck(target);
      
      const responseTime = Date.now() - startTime;
      result = {
        instanceId: target.id,
        target: `${target.address}:${target.port}`,
        status: 'healthy',
        responseTime,
        timestamp: new Date(),
        metadata: target.metadata
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      result = {
        instanceId: target.id,
        target: `${target.address}:${target.port}`,
        status: 'unhealthy',
        responseTime,
        error: errorMessage,
        timestamp: new Date(),
        metadata: target.metadata
      };
    }

    // 更新健康状态
    const previousResult = this.healthStatus.get(target.id);
    this.healthStatus.set(target.id, result);

    // 如果状态发生变化，发出事件
    if (!previousResult || previousResult.status !== result.status) {
      this.emit('health:changed', {
        instanceId: target.id,
        target: result.target,
        previousStatus: previousResult?.status,
        currentStatus: result.status,
        health: result.status
      });
    }

    this.emit('check:completed', result);
    return result;
  }

  /**
   * 执行实际的健康检查请求
   */
  protected async executeHealthCheck(target: HealthCheckTarget): Promise<void> {
    // 模拟gRPC健康检查调用
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'));
      }, this.config.timeout);

      // 模拟网络请求
      setTimeout(() => {
        clearTimeout(timeout);
        
        // 模拟随机健康状态（实际实现中应该进行真正的gRPC调用）
        const isHealthy = Math.random() > 0.1; // 90%概率健康
        
        if (isHealthy) {
          resolve();
        } else {
          reject(new Error('Service unavailable'));
        }
      }, Math.random() * 100); // 模拟0-100ms响应时间
    });
  }

  /**
   * 调度下一次检查
   */
  private scheduleNextCheck(): void {
    if (!this.isRunning) {
      return;
    }

    this.checkInterval = setTimeout(async () => {
      try {
        await this.checkAllTargets();
      } catch (error) {
        this.emit('error', { type: 'batch_check', error });
      }
      
      this.scheduleNextCheck();
    }, this.config.interval);
  }
}

/**
 * 高级健康检查器
 */
export class AdvancedHealthChecker extends HealthChecker {
  private consecutiveFailures = new Map<string, number>();
  private consecutiveSuccesses = new Map<string, number>();

  constructor(config: HealthCheckerConfig) {
    super(config);
  }

  /**
   * 执行健康检查（重写以支持连续失败/成功计数）
   */
  protected override async performHealthCheck(target: HealthCheckTarget): Promise<HealthCheckResult> {
    const result = await super['performHealthCheck'](target);
    
    // 更新连续计数
    if (result.status === 'healthy') {
      this.consecutiveFailures.set(target.id, 0);
      const successCount = (this.consecutiveSuccesses.get(target.id) || 0) + 1;
      this.consecutiveSuccesses.set(target.id, successCount);
    } else {
      this.consecutiveSuccesses.set(target.id, 0);
      const failureCount = (this.consecutiveFailures.get(target.id) || 0) + 1;
      this.consecutiveFailures.set(target.id, failureCount);
    }

    // 根据连续计数调整状态
    const adjustedResult = this.adjustStatusBasedOnThresholds(target.id, result);
    
    return adjustedResult;
  }

  /**
   * 根据阈值调整健康状态
   */
  private adjustStatusBasedOnThresholds(targetId: string, result: HealthCheckResult): HealthCheckResult {
    const failureCount = this.consecutiveFailures.get(targetId) || 0;
    const successCount = this.consecutiveSuccesses.get(targetId) || 0;
    const currentStatus = this.healthStatus.get(targetId)?.status || 'unknown';

    let newStatus = result.status;

    // 如果当前是健康的，需要连续失败达到阈值才标记为不健康
    if (currentStatus === 'healthy' && result.status === 'unhealthy') {
      if (failureCount < this.config.unhealthyThreshold) {
        newStatus = 'healthy'; // 保持健康状态
      }
    }

    // 如果当前是不健康的，需要连续成功达到阈值才标记为健康
    if (currentStatus === 'unhealthy' && result.status === 'healthy') {
      if (successCount < this.config.healthyThreshold) {
        newStatus = 'unhealthy'; // 保持不健康状态
      }
    }

    return {
      ...result,
      status: newStatus,
      metadata: {
        ...result.metadata,
        consecutiveFailures: failureCount,
        consecutiveSuccesses: successCount
      }
    };
  }

  /**
   * 获取连续失败/成功计数
   */
  getConsecutiveCounts(targetId: string): {
    failures: number;
    successes: number;
  } {
    return {
      failures: this.consecutiveFailures.get(targetId) || 0,
      successes: this.consecutiveSuccesses.get(targetId) || 0
    };
  }
}

/**
 * gRPC特定的健康检查器
 */
export class GRPCHealthChecker extends AdvancedHealthChecker {
  constructor(config: HealthCheckerConfig) {
    super(config);
  }

  /**
   * 执行gRPC健康检查请求
   */
  protected override async executeHealthCheck(target: HealthCheckTarget): Promise<void> {
    const serviceName = target.serviceName || 'grpc.health.v1.Health';
    
    // 这里应该实现真正的gRPC健康检查调用
    // 使用grpc.health.v1.Health服务的Check方法
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`gRPC health check timeout for ${serviceName}`));
      }, this.config.timeout);

      // 模拟gRPC调用
      this.simulateGRPCHealthCheck(target, serviceName)
        .then(() => {
          clearTimeout(timeout);
          resolve();
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * 模拟gRPC健康检查调用
   */
  private async simulateGRPCHealthCheck(target: HealthCheckTarget, serviceName: string): Promise<void> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    
    // 模拟健康检查响应
    // 实际实现中应该创建gRPC客户端并调用Health服务
    const responses = ['SERVING', 'NOT_SERVING', 'SERVICE_UNKNOWN'];
    const response = responses[Math.floor(Math.random() * 10)]; // 大概率返回SERVING
    
    if (response !== 'SERVING') {
      throw new Error(`Service ${serviceName} is ${response}`);
    }
  }
}

/**
 * 健康检查工厂
 */
export class HealthCheckerFactory {
  /**
   * 创建健康检查器
   */
  static create(type: 'basic' | 'advanced' | 'grpc', config: HealthCheckerConfig): HealthChecker {
    switch (type) {
      case 'basic':
        return new HealthChecker(config);
      case 'advanced':
        return new AdvancedHealthChecker(config);
      case 'grpc':
        return new GRPCHealthChecker(config);
      default:
        throw new Error(`Unsupported health checker type: ${type}`);
    }
  }
}

/**
 * 健康检查管理器
 */
export class HealthCheckManager extends EventEmitter {
  private checkers = new Map<string, HealthChecker>();
  
  /**
   * 添加健康检查器
   */
  addChecker(name: string, checker: HealthChecker): void {
    this.checkers.set(name, checker);
    
    // 转发检查器事件
    checker.on('health:changed', (event) => {
      this.emit('health:changed', { checker: name, ...event });
    });

    checker.on('check:completed', (result) => {
      this.emit('check:completed', { checker: name, result });
    });

    checker.on('error', (error) => {
      this.emit('error', { checker: name, error });
    });
  }

  /**
   * 移除健康检查器
   */
  removeChecker(name: string): boolean {
    const checker = this.checkers.get(name);
    if (checker) {
      checker.removeAllListeners();
      return this.checkers.delete(name);
    }
    return false;
  }

  /**
   * 启动所有检查器
   */
  startAll(): void {
    Array.from(this.checkers.values()).forEach(checker => {
      checker.start();
    });
    this.emit('all_started');
  }

  /**
   * 停止所有检查器
   */
  async stopAll(): Promise<void> {
    const stopPromises = Array.from(this.checkers.values()).map(checker => 
      checker.stop()
    );
    
    await Promise.all(stopPromises);
    this.emit('all_stopped');
  }

  /**
   * 获取所有健康状态
   */
  getAllHealthStatuses(): Record<string, HealthCheckResult[]> {
    const result: Record<string, HealthCheckResult[]> = {};
    
    this.checkers.forEach((checker, name) => {
      result[name] = checker.getAllHealthStatuses();
    });
    
    return result;
  }

  /**
   * 获取聚合统计
   */
  getAggregatedStats(): {
    totalCheckers: number;
    totalTargets: number;
    totalHealthy: number;
    totalUnhealthy: number;
    totalUnknown: number;
  } {
    let totalTargets = 0;
    let totalHealthy = 0;
    let totalUnhealthy = 0;
    let totalUnknown = 0;

    this.checkers.forEach(checker => {
      const stats = checker.getStats();
      totalTargets += stats.totalTargets;
      totalHealthy += stats.healthyTargets;
      totalUnhealthy += stats.unhealthyTargets;
      totalUnknown += stats.unknownTargets;
    });

    return {
      totalCheckers: this.checkers.size,
      totalTargets,
      totalHealthy,
      totalUnhealthy,
      totalUnknown
    };
  }
}