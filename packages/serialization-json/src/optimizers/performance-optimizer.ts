/**
 * 性能优化器
 */

import { EventEmitter } from 'events';
import {
  OptimizationStrategy,
  CacheStrategy,
  PerformanceStats
} from '../types/serializer-types.js';
import { PERFORMANCE_CONSTANTS } from '../constants/json-constants.js';

/**
 * 性能优化器配置接口
 */
export interface PerformanceOptimizerConfig {
  strategy?: OptimizationStrategy;
  cache?: {
    enabled?: boolean;
    type?: CacheStrategy;
    maxSize?: number;
    maxMemory?: number;
    ttl?: number;
  };
  precompile?: {
    enabled?: boolean;
    schemas?: string[];
    warmup?: boolean;
  };
  memory?: {
    pooling?: boolean;
    recycling?: boolean;
    gcOptimization?: boolean;
  };
}

/**
 * LRU缓存实现
 */
class LRUCache<K, V> extends EventEmitter {
  private cache = new Map<K, V>();
  private maxSize: number;
  private maxMemory: number;
  private currentMemory = 0;

  constructor(maxSize: number, maxMemory: number) {
    super();
    this.maxSize = maxSize;
    this.maxMemory = maxMemory;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // 移到最后（最新使用）
      this.cache.delete(key);
      this.cache.set(key, value);
      this.emit('hit', { key });
      return value;
    }
    this.emit('miss', { key });
    return undefined;
  }

  set(key: K, value: V): void {
    const valueSize = this.estimateSize(value);
    
    // 检查内存限制
    if (valueSize > this.maxMemory) {
      this.emit('oversized', { key, size: valueSize });
      return;
    }

    // 如果已存在，先删除旧值
    if (this.cache.has(key)) {
      const oldValue = this.cache.get(key)!;
      this.currentMemory -= this.estimateSize(oldValue);
      this.cache.delete(key);
    }

    // 清理空间
    while (
      (this.cache.size >= this.maxSize || 
       this.currentMemory + valueSize > this.maxMemory) && 
      this.cache.size > 0
    ) {
      const firstKey = this.cache.keys().next().value!;
      const firstValue = this.cache.get(firstKey)!;
      this.currentMemory -= this.estimateSize(firstValue);
      this.cache.delete(firstKey);
      this.emit('evicted', { key: firstKey });
    }

    // 添加新值
    this.cache.set(key, value);
    this.currentMemory += valueSize;
    this.emit('set', { key, size: valueSize });
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.currentMemory -= this.estimateSize(value);
      this.cache.delete(key);
      this.emit('deleted', { key });
      return true;
    }
    return false;
  }

  clear(): void {
    this.cache.clear();
    this.currentMemory = 0;
    this.emit('cleared');
  }

  size(): number {
    return this.cache.size;
  }

  memoryUsage(): number {
    return this.currentMemory;
  }

  private estimateSize(value: V): number {
    if (typeof value === 'string') {
      return value.length * 2; // UTF-16
    }
    if (typeof value === 'number') {
      return 8; // 64-bit number
    }
    if (typeof value === 'boolean') {
      return 4;
    }
    if (Buffer.isBuffer(value)) {
      return value.length;
    }
    if (typeof value === 'object' && value !== null) {
      return Buffer.byteLength(JSON.stringify(value), 'utf8');
    }
    return 24; // 估算对象开销
  }
}

/**
 * 对象池
 */
class ObjectPool<T> {
  private pool: T[] = [];
  private factory: () => T;
  private reset?: (obj: T) => void;
  private maxSize: number;

  constructor(factory: () => T, maxSize = 100, reset?: (obj: T) => void) {
    this.factory = factory;
    this.maxSize = maxSize;
    this.reset = reset;
  }

  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.factory();
  }

  release(obj: T): void {
    if (this.pool.length < this.maxSize) {
      if (this.reset) {
        this.reset(obj);
      }
      this.pool.push(obj);
    }
  }

  size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
  }
}

/**
 * 性能监控器
 */
class PerformanceMonitor extends EventEmitter {
  private stats: PerformanceStats = {
    cacheHitRate: 0,
    avgSerializeTime: 0,
    avgDeserializeTime: 0,
    memoryUsage: 0,
    throughput: 0,
    errorsCount: 0
  };

  private metrics = {
    serializationTimes: [] as number[],
    deserializationTimes: [] as number[],
    cacheHits: 0,
    cacheMisses: 0,
    errors: 0,
    operations: 0,
    startTime: Date.now()
  };

  recordSerializationTime(time: number): void {
    this.metrics.serializationTimes.push(time);
    this.metrics.operations++;
    this.updateStats();
  }

  recordDeserializationTime(time: number): void {
    this.metrics.deserializationTimes.push(time);
    this.metrics.operations++;
    this.updateStats();
  }

  recordCacheHit(): void {
    this.metrics.cacheHits++;
    this.updateStats();
  }

  recordCacheMiss(): void {
    this.metrics.cacheMisses++;
    this.updateStats();
  }

  recordError(): void {
    this.metrics.errors++;
    this.updateStats();
  }

  private updateStats(): void {
    // 计算缓存命中率
    const totalCacheAccess = this.metrics.cacheHits + this.metrics.cacheMisses;
    this.stats.cacheHitRate = totalCacheAccess > 0 ? 
      this.metrics.cacheHits / totalCacheAccess : 0;

    // 计算平均序列化时间
    if (this.metrics.serializationTimes.length > 0) {
      this.stats.avgSerializeTime = 
        this.metrics.serializationTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.serializationTimes.length;
    }

    // 计算平均反序列化时间
    if (this.metrics.deserializationTimes.length > 0) {
      this.stats.avgDeserializeTime = 
        this.metrics.deserializationTimes.reduce((a, b) => a + b, 0) / 
        this.metrics.deserializationTimes.length;
    }

    // 计算内存使用
    if (typeof process !== 'undefined' && process.memoryUsage) {
      this.stats.memoryUsage = process.memoryUsage().heapUsed;
    }

    // 计算吞吐量
    const elapsedTime = (Date.now() - this.metrics.startTime) / 1000;
    this.stats.throughput = elapsedTime > 0 ? this.metrics.operations / elapsedTime : 0;

    // 记录错误数
    this.stats.errorsCount = this.metrics.errors;

    // 定期清理旧数据
    if (this.metrics.serializationTimes.length > 1000) {
      this.metrics.serializationTimes = this.metrics.serializationTimes.slice(-500);
    }
    if (this.metrics.deserializationTimes.length > 1000) {
      this.metrics.deserializationTimes = this.metrics.deserializationTimes.slice(-500);
    }

    this.emit('statsUpdated', this.stats);
  }

  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  reset(): void {
    this.metrics = {
      serializationTimes: [],
      deserializationTimes: [],
      cacheHits: 0,
      cacheMisses: 0,
      errors: 0,
      operations: 0,
      startTime: Date.now()
    };
    
    this.stats = {
      cacheHitRate: 0,
      avgSerializeTime: 0,
      avgDeserializeTime: 0,
      memoryUsage: 0,
      throughput: 0,
      errorsCount: 0
    };
  }
}

/**
 * 性能优化器
 */
export class PerformanceOptimizer extends EventEmitter {
  private config: Required<PerformanceOptimizerConfig>;
  private cache: LRUCache<string, any>;
  private objectPools = new Map<string, ObjectPool<any>>();
  private monitor: PerformanceMonitor;
  private precompiledSchemas = new Map<string, any>();

  constructor(config: PerformanceOptimizerConfig = {}) {
    super();

    this.config = {
      strategy: config.strategy ?? OptimizationStrategy.BALANCED,
      cache: {
        enabled: config.cache?.enabled ?? true,
        type: config.cache?.type ?? CacheStrategy.LRU,
        maxSize: config.cache?.maxSize ?? 10000,
        maxMemory: config.cache?.maxMemory ?? 100 * 1024 * 1024, // 100MB
        ttl: config.cache?.ttl ?? 300000 // 5分钟
      },
      precompile: {
        enabled: config.precompile?.enabled ?? true,
        schemas: config.precompile?.schemas ?? [],
        warmup: config.precompile?.warmup ?? true
      },
      memory: {
        pooling: config.memory?.pooling ?? true,
        recycling: config.memory?.recycling ?? true,
        gcOptimization: config.memory?.gcOptimization ?? true
      }
    };

    this.cache = new LRUCache(
      this.config.cache.maxSize || 10000,
      this.config.cache.maxMemory || 100 * 1024 * 1024
    );

    this.monitor = new PerformanceMonitor();

    this.setupEventHandlers();
    this.initializeOptimizations();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.cache.on('hit', () => {
      this.monitor.recordCacheHit();
      this.emit('cacheHit');
    });

    this.cache.on('miss', () => {
      this.monitor.recordCacheMiss();
      this.emit('cacheMiss');
    });

    this.cache.on('evicted', (info) => {
      this.emit('cacheEvicted', info);
    });

    this.monitor.on('statsUpdated', (stats) => {
      this.emit('stats', stats);
    });
  }

  /**
   * 初始化优化设置
   */
  private initializeOptimizations(): void {
    // 根据策略应用配置
    const strategyConfig = PERFORMANCE_CONSTANTS.OPTIMIZATION_STRATEGIES[this.config.strategy];
    
    if (strategyConfig) {
      // 应用策略特定的配置
      this.applyStrategyConfig(strategyConfig);
    }

    // 初始化对象池
    if (this.config.memory.pooling) {
      this.initializeObjectPools();
    }

    // 预编译schemas
    if (this.config.precompile.enabled) {
      this.precompileSchemas();
    }

    // GC优化
    if (this.config.memory.gcOptimization) {
      this.setupGCOptimization();
    }
  }

  /**
   * 应用策略配置
   */
  private applyStrategyConfig(strategyConfig: any): void {
    // 这里可以根据策略调整内部设置
    this.emit('strategyApplied', { 
      strategy: this.config.strategy, 
      config: strategyConfig 
    });
  }

  /**
   * 初始化对象池
   */
  private initializeObjectPools(): void {
    // 创建常用对象的对象池
    this.objectPools.set('object', new ObjectPool(() => ({}), 100));
    this.objectPools.set('array', new ObjectPool(() => [], 100));
    this.objectPools.set('buffer', new ObjectPool(() => Buffer.alloc(0), 50));
  }

  /**
   * 预编译schemas
   */
  private precompileSchemas(): void {
    this.config.precompile.schemas?.forEach(schemaName => {
      // 这里应该实现schema预编译逻辑
      this.precompiledSchemas.set(schemaName, { compiled: true });
      this.emit('schemaPrecompiled', { schema: schemaName });
    });

    if (this.config.precompile.warmup) {
      this.warmupCache();
    }
  }

  /**
   * 缓存预热
   */
  private warmupCache(): void {
    // 实现缓存预热逻辑
    this.emit('cacheWarmupStarted');
    
    // 模拟一些常见操作来预热缓存
    setTimeout(() => {
      this.emit('cacheWarmupCompleted');
    }, 1000);
  }

  /**
   * 设置GC优化
   */
  private setupGCOptimization(): void {
    // 定期触发垃圾回收
    if (typeof global !== 'undefined' && (global as any).gc) {
      setInterval(() => {
        const beforeMemory = process.memoryUsage().heapUsed;
        (global as any).gc();
        const afterMemory = process.memoryUsage().heapUsed;
        
        this.emit('gcTriggered', {
          beforeMemory,
          afterMemory,
          freed: beforeMemory - afterMemory
        });
      }, 30000); // 每30秒
    }
  }

  /**
   * 获取缓存值
   */
  getCached(key: string): any {
    const startTime = Date.now();
    const result = this.cache.get(key);
    const duration = Date.now() - startTime;
    
    if (result !== undefined) {
      this.monitor.recordSerializationTime(duration);
    }
    
    return result;
  }

  /**
   * 设置缓存值
   */
  setCached(key: string, value: any): void {
    const startTime = Date.now();
    this.cache.set(key, value);
    const duration = Date.now() - startTime;
    
    this.monitor.recordSerializationTime(duration);
  }

  /**
   * 从对象池获取对象
   */
  acquireObject<T>(type: string): T | null {
    if (!this.config.memory.pooling) {
      return null;
    }

    const pool = this.objectPools.get(type);
    return pool ? pool.acquire() : null;
  }

  /**
   * 释放对象到对象池
   */
  releaseObject<T>(type: string, obj: T): void {
    if (!this.config.memory.pooling || !this.config.memory.recycling) {
      return;
    }

    const pool = this.objectPools.get(type);
    if (pool) {
      pool.release(obj);
    }
  }

  /**
   * 优化JSON字符串
   */
  optimizeJSON(jsonString: string): string {
    // 根据策略优化JSON
    switch (this.config.strategy) {
      case OptimizationStrategy.SIZE:
        return this.compactJSON(jsonString);
      
      case OptimizationStrategy.SPEED:
        return jsonString; // 不做额外处理
      
      case OptimizationStrategy.BALANCED:
      default:
        return this.balancedOptimizeJSON(jsonString);
    }
  }

  /**
   * 压缩JSON
   */
  private compactJSON(jsonString: string): string {
    try {
      return JSON.stringify(JSON.parse(jsonString));
    } catch {
      return jsonString;
    }
  }

  /**
   * 平衡优化JSON
   */
  private balancedOptimizeJSON(jsonString: string): string {
    // 实现平衡的优化策略
    if (jsonString.length < 1024) {
      return jsonString; // 小对象不优化
    }
    
    return this.compactJSON(jsonString);
  }

  /**
   * 记录操作性能
   */
  recordOperation(type: 'serialize' | 'deserialize', duration: number): void {
    if (type === 'serialize') {
      this.monitor.recordSerializationTime(duration);
    } else {
      this.monitor.recordDeserializationTime(duration);
    }
  }

  /**
   * 记录错误
   */
  recordError(): void {
    this.monitor.recordError();
  }

  /**
   * 获取性能统计
   */
  getStats(): PerformanceStats {
    return this.monitor.getStats();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats() {
    return {
      size: this.cache.size(),
      memoryUsage: this.cache.memoryUsage(),
      maxSize: this.config.cache.maxSize,
      maxMemory: this.config.cache.maxMemory
    };
  }

  /**
   * 获取对象池统计
   */
  getObjectPoolStats() {
    const stats: { [key: string]: number } = {};
    
    for (const [type, pool] of this.objectPools) {
      stats[type] = pool.size();
    }
    
    return stats;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
    this.emit('cacheCleared');
  }

  /**
   * 重置性能统计
   */
  resetStats(): void {
    this.monitor.reset();
    this.emit('statsReset');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<PerformanceOptimizerConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.cache.clear();
    
    for (const pool of this.objectPools.values()) {
      pool.clear();
    }
    
    this.objectPools.clear();
    this.precompiledSchemas.clear();
    this.removeAllListeners();
    this.monitor.removeAllListeners();
  }
}