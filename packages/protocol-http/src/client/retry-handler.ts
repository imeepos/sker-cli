/**
 * @fileoverview 重试处理器实现
 */

import { HTTPError } from '../types/http-types.js';

export interface RetryConfig {
  maxAttempts: number;
  backoff: 'exponential' | 'linear' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  retryCondition: (error: HTTPError) => boolean;
  jitter?: boolean;
  onRetry?: (attempt: number, error: HTTPError) => void;
}

export interface RetryState {
  attempt: number;
  totalAttempts: number;
  lastError?: HTTPError;
  startTime: number;
  delays: number[];
}

/**
 * 重试处理器类
 */
export class RetryHandler {
  private config: RetryConfig;

  constructor(config: RetryConfig) {
    this.config = {
      jitter: true,
      ...config
    };
  }

  /**
   * 执行带重试的操作
   */
  async execute<T>(
    operation: () => Promise<T>,
    customConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const config = { ...this.config, ...customConfig };
    const state: RetryState = {
      attempt: 0,
      totalAttempts: config.maxAttempts,
      startTime: Date.now(),
      delays: []
    };

    while (state.attempt < config.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        const httpError = error as HTTPError;
        state.lastError = httpError;
        state.attempt++;

        // 检查是否应该重试
        if (state.attempt >= config.maxAttempts || !config.retryCondition(httpError)) {
          throw error;
        }

        // 计算延迟时间
        const delay = this.calculateDelay(state, config);
        state.delays.push(delay);

        // 触发重试回调
        if (config.onRetry) {
          config.onRetry(state.attempt, httpError);
        }

        // 等待延迟
        await this.sleep(delay);
      }
    }

    throw state.lastError;
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(state: RetryState, config: RetryConfig): number {
    let delay: number;

    switch (config.backoff) {
      case 'exponential':
        delay = config.initialDelay * Math.pow(2, state.attempt - 1);
        break;
      case 'linear':
        delay = config.initialDelay * state.attempt;
        break;
      case 'fixed':
      default:
        delay = config.initialDelay;
        break;
    }

    // 应用最大延迟限制
    delay = Math.min(delay, config.maxDelay);

    // 添加抖动以避免雷群效应
    if (config.jitter) {
      delay = delay * (0.5 + Math.random() * 0.5);
    }

    return Math.round(delay);
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取重试统计信息
   */
  getStats(state: RetryState): RetryStats {
    return {
      totalAttempts: state.attempt,
      maxAttempts: state.totalAttempts,
      totalDelay: state.delays.reduce((sum, delay) => sum + delay, 0),
      averageDelay: state.delays.length > 0 ? state.delays.reduce((sum, delay) => sum + delay, 0) / state.delays.length : 0,
      totalTime: Date.now() - state.startTime,
      delays: [...state.delays],
      lastError: state.lastError
    };
  }
}

/**
 * 重试统计信息
 */
export interface RetryStats {
  totalAttempts: number;
  maxAttempts: number;
  totalDelay: number;
  averageDelay: number;
  totalTime: number;
  delays: number[];
  lastError?: HTTPError;
}

/**
 * 预定义的重试条件
 */
export const RetryConditions = {
  /**
   * 网络错误重试
   */
  networkErrors: (error: HTTPError): boolean => {
    const networkErrorCodes = ['NETWORK_ERROR', 'TIMEOUT_ERROR', 'CONNECTION_ERROR'];
    return networkErrorCodes.includes(error.code);
  },

  /**
   * 5xx服务器错误重试
   */
  serverErrors: (error: HTTPError): boolean => {
    return error.statusCode >= 500 && error.statusCode < 600;
  },

  /**
   * 特定状态码重试
   */
  statusCodes: (codes: number[]) => (error: HTTPError): boolean => {
    return codes.includes(error.statusCode);
  },

  /**
   * 组合条件
   */
  combine: (...conditions: Array<(error: HTTPError) => boolean>) => (error: HTTPError): boolean => {
    return conditions.some(condition => condition(error));
  },

  /**
   * 默认重试条件（网络错误和5xx错误）
   */
  default: (error: HTTPError): boolean => {
    return RetryConditions.networkErrors(error) || RetryConditions.serverErrors(error);
  }
};

/**
 * 预定义的重试配置
 */
export const RetryConfigs = {
  /**
   * 快速重试配置
   */
  fast: (): RetryConfig => ({
    maxAttempts: 3,
    backoff: 'fixed',
    initialDelay: 100,
    maxDelay: 1000,
    retryCondition: RetryConditions.default
  }),

  /**
   * 标准重试配置
   */
  standard: (): RetryConfig => ({
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryCondition: RetryConditions.default
  }),

  /**
   * 保守重试配置
   */
  conservative: (): RetryConfig => ({
    maxAttempts: 5,
    backoff: 'exponential',
    initialDelay: 2000,
    maxDelay: 30000,
    retryCondition: RetryConditions.serverErrors
  }),

  /**
   * 自定义配置构建器
   */
  custom: (options: Partial<RetryConfig>): RetryConfig => ({
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryCondition: RetryConditions.default,
    ...options
  })
};

/**
 * 断路器状态
 */
enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half-open'
}

/**
 * 断路器配置
 */
export interface CircuitBreakerConfig {
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
  volumeThreshold: number;
}

/**
 * 断路器实现
 */
export class CircuitBreaker {
  private state: CircuitBreakerState = CircuitBreakerState.CLOSED;
  private failureCount = 0;
  private requestCount = 0;
  private lastFailureTime = 0;
  private config: CircuitBreakerConfig;

  constructor(config: CircuitBreakerConfig) {
    this.config = config;
  }

  /**
   * 执行操作（带断路器保护）
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitBreakerState.OPEN) {
      if (Date.now() - this.lastFailureTime >= this.config.recoveryTimeout) {
        this.state = CircuitBreakerState.HALF_OPEN;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * 成功回调
   */
  private onSuccess(): void {
    this.requestCount++;
    
    if (this.state === CircuitBreakerState.HALF_OPEN) {
      this.reset();
    }
  }

  /**
   * 失败回调
   */
  private onFailure(): void {
    this.requestCount++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.shouldOpen()) {
      this.state = CircuitBreakerState.OPEN;
    }
  }

  /**
   * 检查是否应该打开断路器
   */
  private shouldOpen(): boolean {
    return (
      this.requestCount >= this.config.volumeThreshold &&
      this.failureCount >= this.config.failureThreshold
    );
  }

  /**
   * 重置断路器
   */
  private reset(): void {
    this.state = CircuitBreakerState.CLOSED;
    this.failureCount = 0;
    this.requestCount = 0;
  }

  /**
   * 获取断路器状态
   */
  getState(): {
    state: CircuitBreakerState;
    failureCount: number;
    requestCount: number;
    failureRate: number;
  } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0
    };
  }
}