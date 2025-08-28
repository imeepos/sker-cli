/**
 * 消息对象池实现
 * Message object pool implementation
 */

import type { UDEFMessageImpl } from '../core/message.js';
import { UDEFMessage, MessageFactory } from '../core/message.js';
import type { ServiceInfo } from '@sker/types';

export interface PoolOptions<T = any> {
  initialSize?: number;
  maxSize?: number;
  factory?: () => T;
  resetFunction?: (item: T) => void;
  validateFunction?: (item: T) => boolean;
  ttl?: number; // Time to live in milliseconds
}

export interface PoolStats {
  totalCreated: number;
  totalAcquired: number;
  totalReleased: number;
  currentSize: number;
  activeCount: number;
  hitRate: number;
}

/**
 * 对象池基类
 * Base object pool class
 */
export class ObjectPool<T> {
  private pool: Array<{ item: T; createdAt: number; lastUsed: number }> = [];
  private active: Set<T> = new Set();
  private options: Required<PoolOptions<T>>;
  private stats: PoolStats;

  constructor(options: PoolOptions<T> = {}) {
    this.options = {
      initialSize: 10,
      maxSize: 100,
      factory: () => ({} as T),
      resetFunction: () => {},
      validateFunction: () => true,
      ttl: 300000, // 5 minutes
      ...options
    } as Required<PoolOptions<T>>;

    this.stats = {
      totalCreated: 0,
      totalAcquired: 0,
      totalReleased: 0,
      currentSize: 0,
      activeCount: 0,
      hitRate: 0
    };

    // 初始化池
    this.initialize();
    
    // 设置清理定时器
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  /**
   * 初始化对象池
   * Initialize object pool
   */
  private initialize(): void {
    for (let i = 0; i < this.options.initialSize; i++) {
      const item = this.createNew();
      this.pool.push({
        item,
        createdAt: Date.now(),
        lastUsed: Date.now()
      });
      this.stats.totalCreated++;
    }
    this.stats.currentSize = this.pool.length;
  }

  /**
   * 获取对象
   * Acquire object
   */
  acquire(): T {
    this.stats.totalAcquired++;

    // 尝试从池中获取有效对象
    let pooledItem = this.getFromPool();
    
    if (pooledItem) {
      this.active.add(pooledItem.item);
      pooledItem.lastUsed = Date.now();
      this.stats.activeCount = this.active.size;
      this.updateHitRate();
      return pooledItem.item;
    }

    // 如果池为空且未达到最大大小，创建新对象
    if (this.stats.currentSize < this.options.maxSize) {
      const item = this.createNew();
      this.active.add(item);
      this.stats.totalCreated++;
      this.stats.activeCount = this.active.size;
      this.updateHitRate();
      return item;
    }

    // 如果达到最大大小，抛出错误或等待
    throw new Error('Object pool exhausted');
  }

  /**
   * 释放对象
   * Release object
   */
  release(item: T): void {
    if (!this.active.has(item)) {
      return; // 对象不在活跃集合中
    }

    this.active.delete(item);
    this.stats.totalReleased++;
    this.stats.activeCount = this.active.size;

    // 重置对象
    try {
      this.options.resetFunction(item);
      
      // 验证对象
      if (this.options.validateFunction(item)) {
        // 如果池未满，归还到池中
        if (this.pool.length < this.options.maxSize) {
          this.pool.push({
            item,
            createdAt: Date.now(),
            lastUsed: Date.now()
          });
          this.stats.currentSize = this.pool.length;
        }
      }
    } catch (error) {
      // 重置或验证失败，对象被丢弃
      console.warn('Failed to reset/validate pooled object:', error);
    }
  }

  /**
   * 清理过期对象
   * Cleanup expired objects
   */
  private cleanup(): void {
    const now = Date.now();
    const validItems = this.pool.filter(pooledItem => 
      now - pooledItem.lastUsed < this.options.ttl
    );

    if (validItems.length !== this.pool.length) {
      this.pool = validItems;
      this.stats.currentSize = this.pool.length;
    }
  }

  /**
   * 从池中获取对象
   * Get object from pool
   */
  private getFromPool(): { item: T; createdAt: number; lastUsed: number } | null {
    while (this.pool.length > 0) {
      const pooledItem = this.pool.pop()!;
      
      // 检查对象是否过期
      if (Date.now() - pooledItem.lastUsed > this.options.ttl) {
        continue;
      }

      // 验证对象
      if (this.options.validateFunction(pooledItem.item)) {
        this.stats.currentSize = this.pool.length;
        return pooledItem;
      }
    }
    
    this.stats.currentSize = this.pool.length;
    return null;
  }

  /**
   * 创建新对象
   * Create new object
   */
  private createNew(): T {
    return this.options.factory();
  }

  /**
   * 更新命中率
   * Update hit rate
   */
  private updateHitRate(): void {
    if (this.stats.totalAcquired > 0) {
      const hits = this.stats.totalAcquired - this.stats.totalCreated;
      this.stats.hitRate = Math.max(0, hits / this.stats.totalAcquired);
    }
  }

  /**
   * 获取池统计信息
   * Get pool statistics
   */
  getStats(): PoolStats {
    return { ...this.stats };
  }

  /**
   * 清空池
   * Clear pool
   */
  clear(): void {
    this.pool = [];
    this.active.clear();
    this.stats.currentSize = 0;
    this.stats.activeCount = 0;
  }

  /**
   * 销毁池
   * Destroy pool
   */
  destroy(): void {
    this.clear();
    // 清理定时器由垃圾回收器处理
  }
}

/**
 * UDEF消息对象池
 * UDEF message object pool
 */
export class UDEFMessagePool {
  private pool: ObjectPool<UDEFMessageImpl>;

  constructor(options: Omit<PoolOptions<UDEFMessageImpl>, 'factory' | 'resetFunction'> = {}) {
    const defaultSource: ServiceInfo = {
      service_name: 'pool',
      service_version: '1.0.0',
      service_id: 'pool-service'
    };

    this.pool = new ObjectPool<UDEFMessageImpl>({
      ...options,
      factory: () => MessageFactory.createEvent({}, defaultSource),
      resetFunction: (message: UDEFMessageImpl) => {
        // 重置消息到初始状态
        // 这里简化实现，实际应该重置所有字段
      }
    });
  }

  acquire(): UDEFMessageImpl {
    return this.pool.acquire();
  }

  release(item: UDEFMessageImpl): void {
    return this.pool.release(item);
  }

  getStats(): PoolStats {
    return this.pool.getStats();
  }

  clear(): void {
    return this.pool.clear();
  }

  destroy(): void {
    return this.pool.destroy();
  }
}

/**
 * 序列化缓存实现
 * Serialization cache implementation
 */
export interface CacheEntry<T> {
  value: T;
  createdAt: number;
  lastAccessed: number;
  accessCount: number;
  size: number;
}

export interface CacheOptions {
  maxSize: number;
  maxEntries?: number;
  ttl?: number;
  algorithm?: 'lru' | 'lfu' | 'fifo';
}

export interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  totalSize: number;
  hitRate: number;
  evictions: number;
}

/**
 * LRU缓存实现
 * LRU cache implementation
 */
export class SerializationCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private accessOrder: string[] = [];
  private options: Required<CacheOptions>;
  private stats: CacheStats;

  constructor(options: CacheOptions) {
    this.options = {
      maxEntries: 1000,
      ttl: 300000, // 5 minutes
      algorithm: 'lru',
      ...options
    } as Required<CacheOptions>;

    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      totalSize: 0,
      hitRate: 0,
      evictions: 0
    };

    // 设置清理定时器
    setInterval(() => this.cleanup(), 60000); // 每分钟清理一次
  }

  /**
   * 获取缓存项
   * Get cache entry
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 检查是否过期
    if (Date.now() - entry.createdAt > this.options.ttl) {
      this.cache.delete(key);
      this.removeFromAccessOrder(key);
      this.updateStats();
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // 更新访问信息
    entry.lastAccessed = Date.now();
    entry.accessCount++;

    // 更新访问顺序
    this.updateAccessOrder(key);

    this.stats.hits++;
    this.updateHitRate();
    
    return entry.value;
  }

  /**
   * 设置缓存项
   * Set cache entry
   */
  set(key: string, value: T, customTtl?: number): void {
    const size = this.calculateSize(value);
    const now = Date.now();

    // 检查是否需要驱逐
    this.ensureCapacity(size);

    const entry: CacheEntry<T> = {
      value,
      createdAt: now,
      lastAccessed: now,
      accessCount: 1,
      size
    };

    // 如果键已存在，更新统计信息
    const existingEntry = this.cache.get(key);
    if (existingEntry) {
      this.stats.totalSize -= existingEntry.size;
    } else {
      this.stats.entries++;
    }

    this.cache.set(key, entry);
    this.stats.totalSize += size;
    
    this.updateAccessOrder(key);
  }

  /**
   * 删除缓存项
   * Delete cache entry
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    this.cache.delete(key);
    this.removeFromAccessOrder(key);
    this.stats.totalSize -= entry.size;
    this.stats.entries--;
    
    return true;
  }

  /**
   * 清空缓存
   * Clear cache
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder = [];
    this.stats.entries = 0;
    this.stats.totalSize = 0;
  }

  /**
   * 确保容量充足
   * Ensure sufficient capacity
   */
  private ensureCapacity(newItemSize: number): void {
    // 检查条目数量限制
    while (this.cache.size >= this.options.maxEntries) {
      this.evictOne();
    }

    // 检查总大小限制
    while (this.stats.totalSize + newItemSize > this.options.maxSize) {
      this.evictOne();
    }
  }

  /**
   * 驱逐一个条目
   * Evict one entry
   */
  private evictOne(): void {
    let keyToEvict: string;

    switch (this.options.algorithm) {
      case 'lru':
        keyToEvict = this.accessOrder[0]!;
        break;
      case 'lfu':
        keyToEvict = this.findLeastFrequentlyUsed();
        break;
      case 'fifo':
        keyToEvict = this.accessOrder[0]!;
        break;
      default:
        keyToEvict = this.accessOrder[0]!;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  /**
   * 查找最少使用的键
   * Find least frequently used key
   */
  private findLeastFrequentlyUsed(): string {
    let leastUsedKey = '';
    let minAccessCount = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.accessCount < minAccessCount) {
        minAccessCount = entry.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  /**
   * 更新访问顺序
   * Update access order
   */
  private updateAccessOrder(key: string): void {
    // 移除旧位置
    this.removeFromAccessOrder(key);
    // 添加到末尾
    this.accessOrder.push(key);
  }

  /**
   * 从访问顺序中移除
   * Remove from access order
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
  }

  /**
   * 计算值的大小
   * Calculate value size
   */
  private calculateSize(value: T): number {
    // 简化实现：使用JSON字符串长度
    try {
      return JSON.stringify(value).length;
    } catch {
      return 1024; // 默认大小
    }
  }

  /**
   * 清理过期条目
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.createdAt > this.options.ttl) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.delete(key);
    }
  }

  /**
   * 更新统计信息
   * Update statistics
   */
  private updateStats(): void {
    this.stats.entries = this.cache.size;
  }

  /**
   * 更新命中率
   * Update hit rate
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 获取缓存统计
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }
}

/**
 * 批处理器实现
 * Batch processor implementation
 */
export interface BatchOptions<T, R> {
  batchSize: number;
  flushInterval: number;
  processor: (items: T[]) => Promise<R[]>;
  onError?: (error: Error, items: T[]) => void;
  maxRetries?: number;
}

export class BatchProcessor<T, R> {
  private batch: T[] = [];
  private options: BatchOptions<T, R>;
  private flushTimer?: NodeJS.Timeout;
  private processing = false;

  constructor(options: BatchOptions<T, R>) {
    this.options = {
      maxRetries: 3,
      ...options
    };

    // 启动定时刷新
    this.startFlushTimer();
  }

  /**
   * 添加项目到批次
   * Add item to batch
   */
  async add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      // 为项目添加Promise解析器
      const enhancedItem = {
        ...item,
        _resolve: resolve,
        _reject: reject
      } as any;

      this.batch.push(enhancedItem);

      // 如果达到批次大小，立即刷新
      if (this.batch.length >= this.options.batchSize) {
        this.flush();
      }
    });
  }

  /**
   * 刷新批次
   * Flush batch
   */
  private async flush() {
    if (this.batch.length === 0 || this.processing) {
      return;
    }

    const currentBatch = this.batch.slice();
    this.batch = [];
    this.processing = true;

    try {
      const results = await this.processBatch(currentBatch);
      
      // 解析Promise
      currentBatch.forEach((item: any, index) => {
        if (item._resolve && results[index] !== undefined) {
          item._resolve(results[index]);
        }
      });
    } catch (error) {
      // 拒绝所有Promise
      currentBatch.forEach((item: any) => {
        if (item._reject) {
          item._reject(error);
        }
      });

      if (this.options.onError) {
        this.options.onError(error instanceof Error ? error : new Error(String(error)), currentBatch);
      }
    } finally {
      this.processing = false;
    }

    // 重新启动定时器
    this.startFlushTimer();
  }

  /**
   * 处理批次
   * Process batch
   */
  private async processBatch(items: T[], retryCount = 0): Promise<R[]> {
    try {
      return await this.options.processor(items);
    } catch (error) {
      if (retryCount < (this.options.maxRetries || 0)) {
        // 指数退避重试
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.processBatch(items, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * 启动刷新定时器
   * Start flush timer
   */
  private startFlushTimer(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.options.flushInterval);
  }

  /**
   * 停止批处理器
   * Stop batch processor
   */
  async stop(): Promise<void> {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // 处理剩余的批次
    if (this.batch.length > 0) {
      await this.flush();
    }
  }
}