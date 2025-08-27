/**
 * gRPC工具函数
 */

import { Status, StatusCode } from '../types/grpc-types.js';

/**
 * gRPC错误处理工具
 */
export class GRPCError extends Error {
  public readonly code: StatusCode;
  public readonly details: string;
  public readonly metadata?: Record<string, any>;

  constructor(code: StatusCode, message: string, metadata?: Record<string, any>) {
    super(message);
    this.name = 'GRPCError';
    this.code = code;
    this.details = message;
    this.metadata = metadata;
  }

  toStatus(): Status {
    return new Status(this.code, this.details, this.metadata);
  }

  static fromError(error: Error, defaultCode: StatusCode = StatusCode.INTERNAL): GRPCError {
    if (error instanceof GRPCError) {
      return error;
    }

    if (error instanceof Status) {
      return new GRPCError(error.code, error.details, error.metadata);
    }

    return new GRPCError(defaultCode, error.message);
  }
}

/**
 * 创建gRPC状态
 */
export function createStatus(code: StatusCode, message: string, metadata?: Record<string, any>): Status {
  return new Status(code, message, metadata);
}

/**
 * 创建成功状态
 */
export function createSuccessStatus(metadata?: Record<string, any>): Status {
  return new Status(StatusCode.OK, 'Success', metadata);
}

/**
 * 创建错误状态
 */
export function createErrorStatus(message: string, code: StatusCode = StatusCode.INTERNAL, metadata?: Record<string, any>): Status {
  return new Status(code, message, metadata);
}

/**
 * 检查状态是否成功
 */
export function isStatusOK(status: Status): boolean {
  return status.code === StatusCode.OK;
}

/**
 * 检查是否为重试状态码
 */
export function isRetryableStatus(status: Status): boolean {
  const retryableCodes = [
    StatusCode.UNAVAILABLE,
    StatusCode.DEADLINE_EXCEEDED,
    StatusCode.RESOURCE_EXHAUSTED,
    StatusCode.ABORTED
  ];
  
  return retryableCodes.includes(status.code);
}

/**
 * 超时工具
 */
export class TimeoutManager {
  private timeouts = new Map<string, NodeJS.Timeout>();

  /**
   * 设置超时
   */
  setTimeout(id: string, callback: () => void, ms: number): void {
    this.clearTimeout(id);
    
    const timeout = setTimeout(() => {
      this.timeouts.delete(id);
      callback();
    }, ms);
    
    this.timeouts.set(id, timeout);
  }

  /**
   * 清除超时
   */
  clearTimeout(id: string): boolean {
    const timeout = this.timeouts.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(id);
      return true;
    }
    return false;
  }

  /**
   * 清除所有超时
   */
  clearAll(): void {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  /**
   * 获取活跃超时数量
   */
  getActiveCount(): number {
    return this.timeouts.size;
  }
}

/**
 * 重试工具
 */
export class RetryManager {
  /**
   * 执行重试逻辑
   */
  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts: number;
      initialBackoff: number;
      maxBackoff: number;
      backoffMultiplier: number;
      jitter?: number;
      retryCondition?: (error: any) => boolean;
    }
  ): Promise<T> {
    let lastError: any;
    let backoff = options.initialBackoff;

    for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // 检查是否应该重试
        if (attempt === options.maxAttempts) {
          break; // 最后一次尝试，不再重试
        }

        if (options.retryCondition && !options.retryCondition(error)) {
          break; // 不满足重试条件
        }

        // 计算延迟时间
        const jitter = options.jitter ? Math.random() * options.jitter * backoff : 0;
        const delay = Math.min(backoff + jitter, options.maxBackoff);

        await new Promise(resolve => setTimeout(resolve, delay));
        
        backoff *= options.backoffMultiplier;
      }
    }

    throw lastError;
  }

  /**
   * 创建指数退避延迟
   */
  static calculateBackoff(
    attempt: number,
    initialBackoff: number,
    maxBackoff: number,
    multiplier: number,
    jitter: number = 0
  ): number {
    const exponentialBackoff = initialBackoff * Math.pow(multiplier, attempt - 1);
    const jitterAmount = jitter > 0 ? Math.random() * jitter * exponentialBackoff : 0;
    
    return Math.min(exponentialBackoff + jitterAmount, maxBackoff);
  }
}

/**
 * 批处理工具
 */
export class BatchProcessor<T, R> {
  private batchSize: number;
  private flushInterval: number;
  private processor: (batch: T[]) => Promise<R[]>;
  private buffer: T[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isProcessing = false;

  constructor(
    batchSize: number,
    flushInterval: number,
    processor: (batch: T[]) => Promise<R[]>
  ) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
    this.processor = processor;
    this.startFlushTimer();
  }

  /**
   * 添加项目到批处理
   */
  async add(item: T): Promise<void> {
    this.buffer.push(item);

    if (this.buffer.length >= this.batchSize) {
      await this.flush();
    }
  }

  /**
   * 手动刷新批处理
   */
  async flush(): Promise<R[]> {
    if (this.buffer.length === 0 || this.isProcessing) {
      return [];
    }

    this.isProcessing = true;
    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const results = await this.processor(batch);
      return results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 关闭批处理器
   */
  async close(): Promise<R[]> {
    this.stopFlushTimer();
    return await this.flush();
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.buffer.length > 0) {
        await this.flush();
      }
    }, this.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }
}

/**
 * 速率限制器
 */
export class RateLimiter {
  private tokens: number;
  private maxTokens: number;
  private refillRate: number;
  private lastRefill: number;

  constructor(maxTokens: number, refillRate: number) {
    this.maxTokens = maxTokens;
    this.refillRate = refillRate; // tokens per second
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * 尝试获取令牌
   */
  tryAcquire(tokens: number = 1): boolean {
    this.refillTokens();

    if (this.tokens >= tokens) {
      this.tokens -= tokens;
      return true;
    }

    return false;
  }

  /**
   * 等待直到可以获取令牌
   */
  async acquire(tokens: number = 1): Promise<void> {
    while (!this.tryAcquire(tokens)) {
      const waitTime = this.calculateWaitTime(tokens);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * 获取当前令牌数量
   */
  getAvailableTokens(): number {
    this.refillTokens();
    return this.tokens;
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = Math.floor(elapsed * this.refillRate);

    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd);
      this.lastRefill = now;
    }
  }

  private calculateWaitTime(tokens: number): number {
    const tokensNeeded = tokens - this.tokens;
    return Math.ceil(tokensNeeded / this.refillRate * 1000); // milliseconds
  }
}

/**
 * 压缩工具
 */
export class CompressionUtils {
  /**
   * 检查数据是否应该压缩
   */
  static shouldCompress(data: any, threshold: number = 1024): boolean {
    const size = this.estimateSize(data);
    return size > threshold;
  }

  /**
   * 估算数据大小
   */
  static estimateSize(data: any): number {
    if (data === null || data === undefined) {
      return 0;
    }

    if (typeof data === 'string') {
      return data.length * 2; // UTF-16
    }

    if (typeof data === 'number') {
      return 8;
    }

    if (typeof data === 'boolean') {
      return 1;
    }

    if (data instanceof ArrayBuffer) {
      return data.byteLength;
    }

    if (data instanceof Buffer) {
      return data.length;
    }

    // 对于对象，使用JSON序列化的长度作为估算
    try {
      return JSON.stringify(data).length * 2;
    } catch {
      return 0;
    }
  }

  /**
   * 模拟压缩（实际实现应使用真实的压缩库）
   */
  static async compress(data: Buffer): Promise<Buffer> {
    // 模拟压缩延迟和压缩比
    await new Promise(resolve => setTimeout(resolve, 10));
    
    // 模拟70%的压缩率
    const compressedSize = Math.floor(data.length * 0.7);
    return Buffer.alloc(compressedSize, data[0]);
  }

  /**
   * 模拟解压缩
   */
  static async decompress(data: Buffer, originalSize?: number): Promise<Buffer> {
    // 模拟解压缩延迟
    await new Promise(resolve => setTimeout(resolve, 5));
    
    // 如果有原始大小，使用它；否则估算
    const decompressedSize = originalSize || Math.floor(data.length * 1.4);
    return Buffer.alloc(decompressedSize, data[0]);
  }
}

/**
 * 指标收集工具
 */
export class MetricsCollectorUtils {
  /**
   * 创建直方图桶
   */
  static createHistogramBuckets(min: number, max: number, bucketCount: number): number[] {
    const buckets: number[] = [];
    const multiplier = Math.pow(max / min, 1 / (bucketCount - 1));
    
    for (let i = 0; i < bucketCount; i++) {
      buckets.push(min * Math.pow(multiplier, i));
    }
    
    return buckets;
  }

  /**
   * 计算百分位数
   */
  static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    
    return sorted[Math.max(0, index)]!;
  }

  /**
   * 计算移动平均
   */
  static calculateMovingAverage(values: number[], windowSize: number): number[] {
    if (values.length < windowSize) return values;
    
    const result: number[] = [];
    
    for (let i = windowSize - 1; i < values.length; i++) {
      const window = values.slice(i - windowSize + 1, i + 1);
      const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
      result.push(average);
    }
    
    return result;
  }
}

/**
 * 调试工具
 */
export class DebugUtils {
  private static debugEnabled = process.env.GRPC_DEBUG === 'true';

  /**
   * 调试日志
   */
  static log(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      console.log(`[GRPC DEBUG] ${message}`, ...args);
    }
  }

  /**
   * 调试错误
   */
  static error(message: string, error?: any): void {
    if (this.debugEnabled) {
      console.error(`[GRPC DEBUG ERROR] ${message}`, error);
    }
  }

  /**
   * 调试性能
   */
  static time(label: string): void {
    if (this.debugEnabled) {
      console.time(`[GRPC DEBUG TIME] ${label}`);
    }
  }

  /**
   * 结束性能调试
   */
  static timeEnd(label: string): void {
    if (this.debugEnabled) {
      console.timeEnd(`[GRPC DEBUG TIME] ${label}`);
    }
  }

  /**
   * 启用调试
   */
  static enable(): void {
    this.debugEnabled = true;
  }

  /**
   * 禁用调试
   */
  static disable(): void {
    this.debugEnabled = false;
  }
}