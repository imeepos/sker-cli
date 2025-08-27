export interface CacheOptions<K = any, V = any> {
  maxSize?: number;
  ttl?: number;
  onEvict?: (key: K, value: V) => void;
}

export interface CacheEntry<T> {
  value: T;
  expiresAt?: number;
  lastAccessed: number;
}

export class LRUCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>();
  private accessOrder = new Map<K, number>();
  private accessCounter = 0;
  private readonly maxSize: number;
  private readonly ttl?: number;
  private readonly onEvict?: (key: K, value: V) => void;

  constructor(options: CacheOptions<K, V> = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl;
    this.onEvict = options.onEvict;
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (this.isExpired(entry)) {
      this.delete(key);
      return undefined;
    }

    entry.lastAccessed = Date.now();
    this.accessOrder.set(key, ++this.accessCounter);
    return entry.value;
  }

  set(key: K, value: V): void {
    const now = Date.now();
    const expiresAt = this.ttl ? now + this.ttl : undefined;

    if (this.cache.has(key)) {
      const entry = this.cache.get(key)!;
      entry.value = value;
      entry.expiresAt = expiresAt;
      entry.lastAccessed = now;
      this.accessOrder.set(key, ++this.accessCounter);
      return;
    }

    if (this.cache.size >= this.maxSize) {
      this.evictLeastRecentlyUsed();
    }

    this.cache.set(key, {
      value,
      expiresAt,
      lastAccessed: now
    });
    this.accessOrder.set(key, ++this.accessCounter);
  }

  delete(key: K): boolean {
    const entry = this.cache.get(key);
    if (entry && this.onEvict) {
      this.onEvict(key, entry.value);
    }
    this.accessOrder.delete(key);
    return this.cache.delete(key);
  }

  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.value);
      }
    }
    this.cache.clear();
    this.accessOrder.clear();
    this.accessCounter = 0;
  }

  has(key: K): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (this.isExpired(entry)) {
      this.delete(key);
      return false;
    }
    return true;
  }

  size(): number {
    return this.cache.size;
  }

  keys(): K[] {
    return Array.from(this.cache.keys());
  }

  values(): V[] {
    return Array.from(this.cache.values()).map(entry => entry.value);
  }

  entries(): [K, V][] {
    return Array.from(this.cache.entries()).map(([key, entry]) => [key, entry.value]);
  }

  private isExpired(entry: CacheEntry<V>): boolean {
    return entry.expiresAt !== undefined && Date.now() > entry.expiresAt;
  }

  private evictLeastRecentlyUsed(): void {
    let lruKey: K | undefined;
    let lruAccess = Infinity;

    for (const [key, accessCount] of this.accessOrder) {
      if (accessCount < lruAccess) {
        lruAccess = accessCount;
        lruKey = key;
      }
    }

    if (lruKey !== undefined) {
      this.delete(lruKey);
    }
  }
}

export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: CacheOptions<string, ReturnType<T>> = {}
): T {
  const cache = new LRUCache<string, ReturnType<T>>(options);

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: CacheOptions<string, ReturnType<T>> = {}
): T {
  const cache = new LRUCache<string, ReturnType<T>>(options);
  const pendingCache = new Map<string, ReturnType<T>>();

  const ret: unknown = ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return Promise.resolve(cache.get(key)!) as ReturnType<T>;
    }

    if (pendingCache.has(key)) {
      return pendingCache.get(key)!;
    }

    const promise = fn(...args).then(
      (result: Awaited<ReturnType<T>>) => {
        cache.set(key, Promise.resolve(result) as ReturnType<T>);
        pendingCache.delete(key);
        return result;
      },
      (error: any) => {
        pendingCache.delete(key);
        throw error;
      }
    ) as ReturnType<T>;

    pendingCache.set(key, promise);
    return promise;
  });

  return ret as T;
}