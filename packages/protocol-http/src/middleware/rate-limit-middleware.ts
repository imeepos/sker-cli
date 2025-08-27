/**
 * @fileoverview 限流中间件实现
 */

import { Middleware, MiddlewareContext } from '../types/http-types.js';
import { HTTP_STATUS } from '../constants/http-constants.js';

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (ctx: MiddlewareContext) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skip?: (ctx: MiddlewareContext) => boolean;
  onLimitReached?: (ctx: MiddlewareContext) => void;
  store?: RateLimitStore;
}

export interface RateLimitStore {
  get(key: string): Promise<RateLimitInfo | null> | RateLimitInfo | null;
  set(key: string, info: RateLimitInfo): Promise<void> | void;
  increment(key: string): Promise<RateLimitInfo> | RateLimitInfo;
  delete(key: string): Promise<void> | void;
  clear(): Promise<void> | void;
}

export interface RateLimitInfo {
  count: number;
  resetTime: number;
}

/**
 * 内存存储实现
 */
class MemoryStore implements RateLimitStore {
  private store = new Map<string, RateLimitInfo>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // 定期清理过期数据
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 每分钟清理一次
  }

  get(key: string): RateLimitInfo | null {
    const info = this.store.get(key);
    if (!info) return null;
    
    if (Date.now() > info.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return info;
  }

  set(key: string, info: RateLimitInfo): void {
    this.store.set(key, info);
  }

  increment(key: string): RateLimitInfo {
    const now = Date.now();
    const existing = this.get(key);
    
    if (existing) {
      existing.count++;
      return existing;
    } else {
      const info: RateLimitInfo = { count: 1, resetTime: now + 60000 }; // 默认1分钟窗口
      this.set(key, info);
      return info;
    }
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, info] of this.store.entries()) {
      if (now > info.resetTime) {
        this.store.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

/**
 * 创建限流中间件
 */
export function rateLimit(options: RateLimitOptions = {}): Middleware {
  const {
    windowMs = 60000, // 1分钟
    maxRequests = 100,
    message = 'Too many requests',
    statusCode = HTTP_STATUS.TOO_MANY_REQUESTS,
    keyGenerator = (ctx) => ctx.request.ip,
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    skip = () => false,
    onLimitReached,
    store = new MemoryStore()
  } = options;

  return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
    // 检查是否跳过此请求
    if (skip(ctx)) {
      await next();
      return;
    }

    const key = keyGenerator(ctx);
    let info = await store.get(key);
    const now = Date.now();

    // 如果没有记录或已过期，创建新记录
    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + windowMs
      };
    }

    // 检查是否超出限制
    if (info.count >= maxRequests) {
      if (onLimitReached) {
        onLimitReached(ctx);
      }

      // 设置限流头部
      ctx.response.setHeader('X-RateLimit-Limit', maxRequests.toString());
      ctx.response.setHeader('X-RateLimit-Remaining', '0');
      ctx.response.setHeader('X-RateLimit-Reset', info.resetTime.toString());
      ctx.response.setHeader('Retry-After', Math.ceil((info.resetTime - now) / 1000).toString());

      ctx.response.statusCode = statusCode;
      ctx.json({ error: message });
      return;
    }

    // 增加计数
    info.count++;
    await store.set(key, info);

    // 设置限流头部
    ctx.response.setHeader('X-RateLimit-Limit', maxRequests.toString());
    ctx.response.setHeader('X-RateLimit-Remaining', (maxRequests - info.count).toString());
    ctx.response.setHeader('X-RateLimit-Reset', info.resetTime.toString());

    let shouldRecord = true;

    try {
      await next();

      // 检查是否跳过成功请求
      if (skipSuccessfulRequests && ctx.response.statusCode < 400) {
        shouldRecord = false;
      }
    } catch (error) {
      // 检查是否跳过失败请求
      if (skipFailedRequests) {
        shouldRecord = false;
      }
      throw error;
    } finally {
      // 如果不应该记录，则减少计数
      if (!shouldRecord && info.count > 0) {
        info.count--;
        await store.set(key, info);
      }
    }
  };
}

/**
 * 创建基于路径的限流中间件
 */
export function pathRateLimit(pathLimits: Record<string, RateLimitOptions>): Middleware {
  const middlewares = new Map<string, Middleware>();
  
  // 为每个路径创建限流中间件
  for (const [path, options] of Object.entries(pathLimits)) {
    middlewares.set(path, rateLimit(options));
  }

  return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
    const path = ctx.request.path;
    
    // 查找匹配的路径限流规则
    for (const [pattern, middleware] of middlewares) {
      if (pathMatches(pattern, path)) {
        await middleware(ctx, next);
        return;
      }
    }
    
    // 没有匹配的限流规则，直接执行下一个中间件
    await next();
  };
}

/**
 * 检查路径是否匹配模式
 */
function pathMatches(pattern: string, path: string): boolean {
  // 支持通配符匹配
  if (pattern.includes('*')) {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(path);
  }
  
  return pattern === path;
}

/**
 * 创建基于用户的限流中间件
 */
export function userRateLimit(options: RateLimitOptions = {}): Middleware {
  const defaultOptions: RateLimitOptions = {
    ...options,
    keyGenerator: (ctx) => {
      // 优先使用用户ID，否则使用IP
      const userId = ctx.user?.id || ctx.request.headers['x-user-id'];
      return userId ? `user:${userId}` : `ip:${ctx.request.ip}`;
    }
  };

  return rateLimit(defaultOptions);
}

/**
 * 创建基于API密钥的限流中间件
 */
export function apiKeyRateLimit(options: RateLimitOptions = {}): Middleware {
  const defaultOptions: RateLimitOptions = {
    ...options,
    keyGenerator: (ctx) => {
      const apiKey = ctx.request.headers['x-api-key'] || ctx.request.headers['authorization'];
      return apiKey ? `apikey:${apiKey}` : `ip:${ctx.request.ip}`;
    }
  };

  return rateLimit(defaultOptions);
}

/**
 * 导出内存存储类
 */
export { MemoryStore };