/**
 * @fileoverview HTTP缓存管理器实现
 */

import { EventEmitter } from 'events';
import { CacheManagerConfig, CacheStrategy } from '../types/http-types.js';
import { HTTPRequest, HTTPResponseData } from '../types/http-types.js';

export interface CacheEntry<T = any> {
  key: string;
  data: T;
  expires: number;
  createdAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  metadata?: Record<string, any>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  totalEntries: number;
  totalSize: number;
  avgEntrySize: number;
  oldestEntry?: number;
  newestEntry?: number;
}

/**
 * 缓存存储接口
 */
export interface CacheStorage {
  get<T = any>(key: string): Promise<CacheEntry<T> | null> | CacheEntry<T> | null;
  set<T = any>(key: string, entry: CacheEntry<T>): Promise<void> | void;
  delete(key: string): Promise<boolean> | boolean;
  clear(): Promise<void> | void;
  keys(): Promise<string[]> | string[];
  size(): Promise<number> | number;
}

/**
 * 内存缓存存储实现
 */
export class MemoryCacheStorage implements CacheStorage {
  private cache = new Map<string, CacheEntry>();
  private maxSize: number;
  private maxEntries: number;

  constructor(maxSize = 100 * 1024 * 1024, maxEntries = 1000) {
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
  }

  get<T = any>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key) as CacheEntry<T>;

    if (!entry) return null;

    // 检查是否过期
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    // 更新访问信息
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry;
  }

  set<T = any>(key: string, entry: CacheEntry<T>): void {
    // 检查容量限制
    this.enforceCapacityLimits();

    this.cache.set(key, entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  /**
   * 执行容量限制
   */
  private enforceCapacityLimits(): void {
    // 检查条目数限制
    if (this.cache.size >= this.maxEntries) {
      this.evictLRU();
    }

    // 检查总大小限制
    const totalSize = Array.from(this.cache.values()).reduce((sum, entry) => sum + entry.size, 0);
    if (totalSize >= this.maxSize) {
      this.evictLRU();
    }
  }

  /**
   * LRU淘汰策略
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * 获取存储统计信息
   */
  getStorageStats(): {
    entries: number;
    totalSize: number;
    averageSize: number;
    oldestEntry: number;
    newestEntry: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const times = entries.map(entry => entry.lastAccessed);

    return {
      entries: entries.length,
      totalSize,
      averageSize: entries.length > 0 ? totalSize / entries.length : 0,
      oldestEntry: Math.min(...times),
      newestEntry: Math.max(...times)
    };
  }
}

/**
 * Redis缓存存储实现
 */
export class RedisCacheStorage implements CacheStorage {
  private redis: any; // Redis客户端实例
  private keyPrefix: string;

  constructor(redisClient: any, keyPrefix = 'http_cache:') {
    this.redis = redisClient;
    this.keyPrefix = keyPrefix;
  }

  async get<T = any>(key: string): Promise<CacheEntry<T> | null> {
    try {
      const data = await this.redis.get(this.keyPrefix + key);
      if (!data) return null;

      const entry = JSON.parse(data) as CacheEntry<T>;

      // 检查是否过期
      if (Date.now() > entry.expires) {
        await this.delete(key);
        return null;
      }

      // 更新访问信息
      entry.accessCount++;
      entry.lastAccessed = Date.now();
      await this.redis.set(this.keyPrefix + key, JSON.stringify(entry));

      return entry;
    } catch (error) {
      console.error('Redis cache get error:', error);
      return null;
    }
  }

  async set<T = any>(key: string, entry: CacheEntry<T>): Promise<void> {
    try {
      const ttl = Math.ceil((entry.expires - Date.now()) / 1000);
      if (ttl > 0) {
        await this.redis.setex(this.keyPrefix + key, ttl, JSON.stringify(entry));
      }
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.redis.del(this.keyPrefix + key);
      return result > 0;
    } catch (error) {
      console.error('Redis cache delete error:', error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      const keys = await this.redis.keys(this.keyPrefix + '*');
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Redis cache clear error:', error);
    }
  }

  async keys(): Promise<string[]> {
    try {
      const keys = await this.redis.keys(this.keyPrefix + '*');
      return keys.map((key: string) => key.replace(this.keyPrefix, ''));
    } catch (error) {
      console.error('Redis cache keys error:', error);
      return [];
    }
  }

  async size(): Promise<number> {
    try {
      const keys = await this.keys();
      return keys.length;
    } catch (error) {
      console.error('Redis cache size error:', error);
      return 0;
    }
  }
}

/**
 * HTTP缓存管理器
 */
export class CacheManager extends EventEmitter {
  private storage: CacheStorage;
  private strategies: Map<string, CacheStrategy>;
  private stats: CacheStats;

  constructor(storage: CacheStorage, strategies: Record<string, CacheStrategy> = {}) {
    super();
    this.storage = storage;
    this.strategies = new Map(Object.entries(strategies));
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      avgEntrySize: 0
    };
  }

  /**
   * 获取缓存数据
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const entry = await this.storage.get<T>(key);

      if (entry) {
        this.stats.hits++;
        this.updateHitRate();
        this.emit('cache-hit', { key, entry });
        return entry.data;
      } else {
        this.stats.misses++;
        this.updateHitRate();
        this.emit('cache-miss', { key });
        return null;
      }
    } catch (error) {
      this.emit('cache-error', { operation: 'get', key, error });
      return null;
    }
  }

  /**
   * 设置缓存数据
   */
  async set<T = any>(key: string, data: T, ttl?: number, metadata?: Record<string, any>): Promise<void> {
    try {
      const now = Date.now();
      const defaultTtl = 300000; // 5分钟默认TTL
      const entry: CacheEntry<T> = {
        key,
        data,
        expires: now + (ttl || defaultTtl),
        createdAt: now,
        accessCount: 0,
        lastAccessed: now,
        size: this.calculateSize(data),
        metadata
      };

      await this.storage.set(key, entry);
      this.emit('cache-set', { key, entry });
    } catch (error) {
      this.emit('cache-error', { operation: 'set', key, error });
    }
  }

  /**
   * 删除缓存数据
   */
  async delete(key: string): Promise<boolean> {
    try {
      const result = await this.storage.delete(key);
      if (result) {
        this.emit('cache-delete', { key });
      }
      return result;
    } catch (error) {
      this.emit('cache-error', { operation: 'delete', key, error });
      return false;
    }
  }

  /**
   * 清空缓存
   */
  async clear(): Promise<void> {
    try {
      await this.storage.clear();
      this.resetStats();
      this.emit('cache-clear');
    } catch (error) {
      this.emit('cache-error', { operation: 'clear', error });
    }
  }

  /**
   * 根据请求获取缓存键
   */
  getCacheKey(req: HTTPRequest): string {
    // 查找匹配的策略
    for (const [pattern, strategy] of this.strategies.entries()) {
      if (strategy.pattern.test(req.url)) {
        if (strategy.keyGenerator) {
          return strategy.keyGenerator(req);
        }
        break;
      }
    }

    // 默认键生成策略
    return `${req.method}:${req.url}`;
  }

  /**
   * 检查响应是否可缓存
   */
  shouldCache(req: HTTPRequest, res: HTTPResponseData): boolean {
    // 只缓存GET请求
    if (req.method !== 'GET') {
      return false;
    }

    // 只缓存成功响应
    if (res.status >= 400) {
      return false;
    }

    // 检查缓存控制头部
    const cacheControl = res.headers['cache-control'] as string;
    if (cacheControl) {
      if (cacheControl.includes('no-cache') || cacheControl.includes('no-store')) {
        return false;
      }
    }

    return true;
  }

  /**
   * 从响应头部提取TTL
   */
  extractTTL(headers: Record<string, string | string[] | undefined>): number {
    const cacheControl = headers['cache-control'] as string;
    if (cacheControl) {
      const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
      if (maxAgeMatch) {
        return parseInt(maxAgeMatch[1]!, 10) * 1000;
      }
    }

    const expires = headers['expires'] as string;
    if (expires) {
      const expiresDate = new Date(expires);
      return Math.max(0, expiresDate.getTime() - Date.now());
    }

    return 300000; // 默认5分钟
  }

  /**
   * 缓存HTTP响应
   */
  async cacheResponse(req: HTTPRequest, res: HTTPResponseData): Promise<void> {
    if (!this.shouldCache(req, res)) {
      return;
    }

    const key = this.getCacheKey(req);
    const ttl = this.extractTTL(res.headers);
    const metadata = {
      status: res.status,
      headers: res.headers,
      url: req.url,
      method: req.method
    };

    await this.set(key, res.data, ttl, metadata);
  }

  /**
   * 添加缓存策略
   */
  addStrategy(name: string, strategy: CacheStrategy): void {
    this.strategies.set(name, strategy);
  }

  /**
   * 移除缓存策略
   */
  removeStrategy(name: string): boolean {
    return this.strategies.delete(name);
  }

  /**
   * 获取缓存统计信息
   */
  async getStats(): Promise<CacheStats> {
    try {
      this.stats.totalEntries = await this.storage.size();

      // 如果是内存存储，可以获取更详细的统计信息
      if (this.storage instanceof MemoryCacheStorage) {
        const storageStats = this.storage.getStorageStats();
        this.stats.totalSize = storageStats.totalSize;
        this.stats.avgEntrySize = storageStats.averageSize;
        this.stats.oldestEntry = storageStats.oldestEntry;
        this.stats.newestEntry = storageStats.newestEntry;
      }

      return { ...this.stats };
    } catch (error) {
      this.emit('cache-error', { operation: 'stats', error });
      return this.stats;
    }
  }

  /**
   * 清理过期缓存
   */
  async cleanup(): Promise<{ removed: number; errors: number }> {
    let removed = 0;
    let errors = 0;

    try {
      const keys = await this.storage.keys();

      for (const key of keys) {
        try {
          const entry = await this.storage.get(key);
          if (!entry || Date.now() > entry.expires) {
            await this.storage.delete(key);
            removed++;
          }
        } catch (error) {
          errors++;
          this.emit('cache-error', { operation: 'cleanup', key, error });
        }
      }

      this.emit('cache-cleanup', { removed, errors });
    } catch (error) {
      this.emit('cache-error', { operation: 'cleanup', error });
    }

    return { removed, errors };
  }

  /**
   * 计算数据大小
   */
  private calculateSize(data: any): number {
    if (typeof data === 'string') {
      return Buffer.byteLength(data);
    } else if (Buffer.isBuffer(data)) {
      return data.length;
    } else {
      return Buffer.byteLength(JSON.stringify(data));
    }
  }

  /**
   * 更新命中率
   */
  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  /**
   * 重置统计信息
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      hitRate: 0,
      totalEntries: 0,
      totalSize: 0,
      avgEntrySize: 0
    };
  }
}

/**
 * 创建默认缓存管理器
 */
export function createDefaultCacheManager(): CacheManager {
  const storage = new MemoryCacheStorage();
  const strategies: Record<string, CacheStrategy> = {
    'api-responses': {
      pattern: /^\/api\//,
      ttl: 300000, // 5分钟
      keyGenerator: (req) => `api:${req.method}:${req.url}`
    },
    'static-content': {
      pattern: /\.(js|css|png|jpg|gif|ico)$/,
      ttl: 86400000, // 1天
      keyGenerator: (req) => `static:${req.url}`
    }
  };

  return new CacheManager(storage, strategies);
}