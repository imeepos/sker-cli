/**
 * 消息中间件和处理管道实现
 * Message middleware and processing pipeline implementation
 */

import type { UDEFMessageImpl } from '../core/message.js';
import { type SkerString } from '@sker/types';

export interface MiddlewareContext {
  message: UDEFMessageImpl;
  processingStartTime: Date;
  processingId: string;
  metadata: Record<string, unknown>;
  skip?: boolean;
  error?: Error;
}

export interface MiddlewareFunction {
  (context: MiddlewareContext, next: NextFunction): Promise<void> | void;
}

export interface NextFunction {
  (): Promise<void> | void;
}

export interface ProcessingResult {
  success: boolean;
  message?: UDEFMessageImpl;
  error?: Error;
  metadata: Record<string, unknown>;
  processingTime: number;
  middlewareResults: MiddlewareResult[];
}

export interface MiddlewareResult {
  name: string;
  executed: boolean;
  duration: number;
  error?: Error;
  metadata?: Record<string, unknown>;
}

export interface ProcessingOptions {
  timeout?: number;
  skipOnError?: boolean;
  collectMetrics?: boolean;
  enableTracing?: boolean;
}

/**
 * 消息处理器
 * Message processor
 */
export class MessageProcessor {
  private middleware: Array<{ name: string; fn: MiddlewareFunction }> = [];
  private options: ProcessingOptions;

  constructor(options: ProcessingOptions = {}) {
    this.options = {
      timeout: 30000, // 30秒默认超时
      skipOnError: false,
      collectMetrics: true,
      enableTracing: true,
      ...options
    };
  }

  /**
   * 添加中间件
   * Add middleware
   */
  use(name: string, middleware: MiddlewareFunction): this {
    this.middleware.push({ name, fn: middleware });
    return this;
  }

  /**
   * 移除中间件
   * Remove middleware
   */
  remove(name: string): boolean {
    const index = this.middleware.findIndex(m => m.name === name);
    if (index >= 0) {
      this.middleware.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * 处理消息
   * Process message
   */
  async process(message: UDEFMessageImpl): Promise<ProcessingResult> {
    const processingId = this.generateProcessingId();
    const startTime = new Date();
    
    const context: MiddlewareContext = {
      message: message.clone(),
      processingStartTime: startTime,
      processingId,
      metadata: {}
    };

    const middlewareResults: MiddlewareResult[] = [];
    let currentIndex = 0;

    try {
      // 设置超时
      const timeoutPromise = this.options.timeout ? 
        this.createTimeoutPromise(this.options.timeout) : 
        null;

      const processingPromise = this.executeMiddleware(
        context, 
        currentIndex, 
        middlewareResults
      );

      if (timeoutPromise) {
        await Promise.race([processingPromise, timeoutPromise]);
      } else {
        await processingPromise;
      }

      const endTime = new Date();
      const processingTime = endTime.getTime() - startTime.getTime();

      return {
        success: !context.error,
        message: context.message,
        error: context.error,
        metadata: context.metadata,
        processingTime,
        middlewareResults
      };
    } catch (error) {
      const endTime = new Date();
      const processingTime = endTime.getTime() - startTime.getTime();

      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        metadata: context.metadata,
        processingTime,
        middlewareResults
      };
    }
  }

  /**
   * 执行中间件
   * Execute middleware
   */
  private async executeMiddleware(
    context: MiddlewareContext,
    index: number,
    results: MiddlewareResult[]
  ): Promise<void> {
    if (index >= this.middleware.length || context.skip) {
      return;
    }

    const middlewareInfo = this.middleware[index]!;
    const startTime = Date.now();

    const result: MiddlewareResult = {
      name: middlewareInfo.name,
      executed: false,
      duration: 0
    };

    try {
      let nextCalled = false;
      
      const next: NextFunction = async () => {
        if (nextCalled) {
          throw new Error(`next() called multiple times in middleware: ${middlewareInfo?.name}`);
        }
        nextCalled = true;
        await this.executeMiddleware(context, index + 1, results);
      };

      await middlewareInfo?.fn(context, next);
      
      result.executed = true;
      result.duration = Date.now() - startTime;

      // 如果中间件没有调用next()，自动调用
      if (!nextCalled && !context.skip && !context.error) {
        await next();
      }
    } catch (error) {
      result.error = error instanceof Error ? error : new Error(String(error));
      result.duration = Date.now() - startTime;

      if (this.options.skipOnError) {
        context.error = result.error;
        context.skip = true;
      } else {
        throw result.error;
      }
    } finally {
      results.push(result);
    }
  }

  /**
   * 创建超时Promise
   * Create timeout promise
   */
  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Processing timeout after ${timeout}ms`));
      }, timeout);
    });
  }

  /**
   * 生成处理ID
   * Generate processing ID
   */
  private generateProcessingId(): string {
    return `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取中间件列表
   * Get middleware list
   */
  getMiddleware(): Array<{ name: string }> {
    return this.middleware.map(m => ({ name: m.name }));
  }

  /**
   * 清除所有中间件
   * Clear all middleware
   */
  clear(): void {
    this.middleware = [];
  }
}

/**
 * 内置中间件
 * Built-in middleware
 */
export class BuiltinMiddleware {
  /**
   * 日志中间件
   * Logging middleware
   */
  static logging(options: { 
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    logRequest?: boolean;
    logResponse?: boolean;
  } = {}): MiddlewareFunction {
    const { logLevel = 'info', logRequest = true, logResponse = true } = options;

    return async (context: MiddlewareContext, next: NextFunction) => {
      const { message, processingId } = context;

      if (logRequest) {
        console.log(`[${logLevel}] Processing message ${processingId}: ${message.messageType}`);
      }

      const startTime = Date.now();
      
      try {
        await next();
        
        if (logResponse) {
          const duration = Date.now() - startTime;
          console.log(`[${logLevel}] Completed message ${processingId} in ${duration}ms`);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[error] Failed processing message ${processingId} after ${duration}ms:`, error);
        throw error;
      }
    };
  }

  /**
   * 验证中间件
   * Validation middleware
   */
  static validation(validator: {
    validate: (message: UDEFMessageImpl) => Promise<{ valid: boolean; errors: any[] }>;
  }): MiddlewareFunction {
    return async (context: MiddlewareContext, next: NextFunction) => {
      try {
        const result = await validator.validate(context.message);
        
        if (!result.valid) {
          throw new Error(`Validation failed: ${result.errors.map(e => e.message).join(', ')}`);
        }

        context.metadata.validationResult = result;
        await next();
      } catch (error) {
        context.error = error instanceof Error ? error : new Error(String(error));
        throw context.error;
      }
    };
  }

  /**
   * 重试中间件
   * Retry middleware
   */
  static retry(options: {
    maxRetries?: number;
    delay?: number;
    exponentialBackoff?: boolean;
    retryCondition?: (error: Error) => boolean;
  } = {}): MiddlewareFunction {
    const { 
      maxRetries = 3, 
      delay = 1000, 
      exponentialBackoff = true,
      retryCondition = () => true 
    } = options;

    return async (context: MiddlewareContext, next: NextFunction) => {
      let lastError: Error | undefined;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await next();
          return;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          
          if (attempt === maxRetries || !retryCondition(lastError)) {
            throw lastError;
          }

          // 计算延迟
          const currentDelay = exponentialBackoff ? 
            delay * Math.pow(2, attempt) : delay;
          
          await this.sleep(currentDelay);
          
          context.metadata.retryAttempt = attempt + 1;
        }
      }
      
      throw lastError;
    };
  }

  /**
   * 缓存中间件
   * Cache middleware
   */
  static cache(cache: {
    get: (key: string) => Promise<UDEFMessageImpl | null>;
    set: (key: string, value: UDEFMessageImpl, ttl?: number) => Promise<void>;
    delete: (key: string) => Promise<void>;
  }, options: {
    keyGenerator?: (message: UDEFMessageImpl) => string;
    ttl?: number;
    skipCache?: (message: UDEFMessageImpl) => boolean;
  } = {}): MiddlewareFunction {
    const { 
      keyGenerator = (msg) => `udef_${msg.messageType}_${JSON.stringify(msg.getData()).slice(0, 100)}`,
      ttl = 300000, // 5 minutes
      skipCache = () => false
    } = options;

    return async (context: MiddlewareContext, next: NextFunction) => {
      const { message } = context;
      
      if (skipCache(message)) {
        await next();
        return;
      }

      const cacheKey = keyGenerator(message);
      
      try {
        // 尝试从缓存获取
        const cachedMessage = await cache.get(cacheKey);
        if (cachedMessage) {
          context.message = cachedMessage;
          context.metadata.cacheHit = true;
          return;
        }

        // 执行后续中间件
        await next();

        // 缓存结果
        if (!context.error) {
          await cache.set(cacheKey, context.message, ttl);
          context.metadata.cached = true;
        }
      } catch (error) {
        // 缓存错误不应该影响正常处理
        console.warn('Cache middleware error:', error);
        await next();
      }
    };
  }

  /**
   * 指标收集中间件
   * Metrics collection middleware
   */
  static metrics(metricsCollector: {
    increment: (name: string, tags?: Record<string, string>) => void;
    timing: (name: string, duration: number, tags?: Record<string, string>) => void;
    gauge: (name: string, value: number, tags?: Record<string, string>) => void;
  }): MiddlewareFunction {
    return async (context: MiddlewareContext, next: NextFunction) => {
      const { message, processingId } = context;
      const startTime = Date.now();

      const tags = {
        messageType: message.messageType,
        contentType: message.contentType,
        processingId
      };

      try {
        metricsCollector.increment('udef.message.processing.started', tags);
        
        await next();
        
        const duration = Date.now() - startTime;
        metricsCollector.timing('udef.message.processing.duration', duration, tags);
        metricsCollector.increment('udef.message.processing.success', tags);
      } catch (error) {
        const duration = Date.now() - startTime;
        metricsCollector.timing('udef.message.processing.duration', duration, tags);
        metricsCollector.increment('udef.message.processing.error', {
          ...tags,
          errorType: (error as Error).constructor.name
        });
        throw error;
      }
    };
  }

  /**
   * 错误处理中间件
   * Error handling middleware
   */
  static errorHandler(options: {
    onError?: (error: Error, context: MiddlewareContext) => void;
    transformError?: (error: Error) => Error;
    continueOnError?: boolean;
  } = {}): MiddlewareFunction {
    const { onError, transformError, continueOnError = false } = options;

    return async (context: MiddlewareContext, next: NextFunction) => {
      try {
        await next();
      } catch (error) {
        let handledError = error instanceof Error ? error : new Error(String(error));
        
        if (transformError) {
          handledError = transformError(handledError);
        }

        if (onError) {
          onError(handledError, context);
        }

        context.error = handledError;

        if (!continueOnError) {
          throw handledError;
        }
      }
    };
  }

  /**
   * 睡眠辅助函数
   * Sleep helper function
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * 中间件组合器
 * Middleware composer
 */
export class MiddlewareComposer {
  /**
   * 组合多个中间件
   * Compose multiple middleware
   */
  static compose(...middleware: Array<{ name: string; fn: MiddlewareFunction }>): MessageProcessor {
    const processor = new MessageProcessor();
    
    for (const mw of middleware) {
      processor.use(mw.name, mw.fn);
    }
    
    return processor;
  }

  /**
   * 创建条件中间件
   * Create conditional middleware
   */
  static when(
    condition: (context: MiddlewareContext) => boolean,
    middleware: MiddlewareFunction
  ): MiddlewareFunction {
    return async (context: MiddlewareContext, next: NextFunction) => {
      if (condition(context)) {
        await middleware(context, next);
      } else {
        await next();
      }
    };
  }

  /**
   * 创建并行中间件
   * Create parallel middleware
   */
  static parallel(...middleware: MiddlewareFunction[]): MiddlewareFunction {
    return async (context: MiddlewareContext, next: NextFunction) => {
      const promises = middleware.map(mw => 
        new Promise<void>((resolve, reject) => {
          try {
            const result = mw(context, () => Promise.resolve());
            Promise.resolve(result).then(resolve).catch(reject);
          } catch (error) {
            reject(error);
          }
        })
      );

      await Promise.all(promises);
      await next();
    };
  }
}