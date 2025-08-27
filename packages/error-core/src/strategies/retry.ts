import { RetryOptions, BackoffStrategy } from '../types/index.js';
import { ExponentialBackoffStrategy, LinearBackoffStrategy, FixedBackoffStrategy } from './backoff.js';

export class RetryStrategy {
  private backoffStrategy: BackoffStrategy;

  constructor(private options: RetryOptions) {
    this.backoffStrategy = this.createBackoffStrategy();
  }

  private createBackoffStrategy(): BackoffStrategy {
    const backoffMultiplier = this.options.backoffMultiplier || 2;
    const maxDelay = this.options.maxDelay || 30000;
    const jitter = this.options.jitter || false;

    if (backoffMultiplier === 1) {
      return new FixedBackoffStrategy(jitter);
    } else if (backoffMultiplier > 1) {
      return new ExponentialBackoffStrategy(backoffMultiplier, maxDelay, jitter);
    } else {
      return new LinearBackoffStrategy(1000, maxDelay, jitter);
    }
  }

  async execute<T>(fn: () => Promise<T>, _context?: Record<string, any>): Promise<T> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (attempt >= this.options.maxAttempts) {
          break;
        }
        
        if (this.options.retryCondition && !this.options.retryCondition(error, attempt)) {
          break;
        }
        
        // 计算延迟时间
        const delay = this.backoffStrategy.calculateDelay(attempt, this.options.initialDelay);
        
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class RetryBuilder {
  private options: Partial<RetryOptions> = {};

  maxAttempts(attempts: number): this {
    this.options.maxAttempts = attempts;
    return this;
  }

  initialDelay(delay: number): this {
    this.options.initialDelay = delay;
    return this;
  }

  backoffMultiplier(multiplier: number): this {
    this.options.backoffMultiplier = multiplier;
    return this;
  }

  maxDelay(delay: number): this {
    this.options.maxDelay = delay;
    return this;
  }

  withJitter(): this {
    this.options.jitter = true;
    return this;
  }

  retryOn(condition: (error: any, attempt: number) => boolean): this {
    this.options.retryCondition = condition;
    return this;
  }

  build(): RetryStrategy {
    if (!this.options.maxAttempts) {
      throw new Error('maxAttempts is required');
    }
    if (!this.options.initialDelay) {
      throw new Error('initialDelay is required');
    }

    return new RetryStrategy(this.options as RetryOptions);
  }
}

// 预定义的重试策略
export const DEFAULT_RETRY_STRATEGY = new RetryStrategy({
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  jitter: true
});

export const AGGRESSIVE_RETRY_STRATEGY = new RetryStrategy({
  maxAttempts: 5,
  initialDelay: 500,
  backoffMultiplier: 1.5,
  maxDelay: 5000,
  jitter: true
});

export const CONSERVATIVE_RETRY_STRATEGY = new RetryStrategy({
  maxAttempts: 2,
  initialDelay: 2000,
  backoffMultiplier: 2,
  maxDelay: 30000,
  jitter: false
});

// 工厂函数
export function createRetryStrategy(): RetryBuilder {
  return new RetryBuilder();
}

export function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  const strategy = new RetryStrategy({
    maxAttempts,
    initialDelay,
    backoffMultiplier: 2,
    jitter: true
  });
  
  return strategy.execute(fn);
}

export function retryWithLinearBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  const strategy = new RetryStrategy({
    maxAttempts,
    initialDelay,
    backoffMultiplier: 1,
    jitter: false
  });
  
  return strategy.execute(fn);
}