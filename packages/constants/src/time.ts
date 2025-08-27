// 默认超时配置
export const DEFAULT_TIMEOUTS = {
  CONNECTION: 5000,           // 连接超时5秒
  REQUEST: 30000,             // 请求超时30秒
  READ: 60000,                // 读取超时60秒
  WRITE: 10000,               // 写入超时10秒
  IDLE: 300000,               // 空闲超时5分钟
  HEALTH_CHECK: 10000         // 健康检查超时10秒
} as const;

// 重试策略
export const RETRY_STRATEGIES = {
  FIXED_DELAY: 'fixed_delay',
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  LINEAR_BACKOFF: 'linear_backoff',
  RANDOM_JITTER: 'random_jitter'
} as const;

// 时间单位
export const TIME_UNITS = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000
} as const;

// 重试配置接口
export interface RetryConfig {
  strategy: RetryStrategyType;
  maxAttempts: number;
  baseDelay: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitterRange?: number;
}

// 超时配置接口
export interface TimeoutConfig {
  connection?: number;
  request?: number;
  read?: number;
  write?: number;
  idle?: number;
  healthCheck?: number;
}

// 类型定义
export type DefaultTimeout = typeof DEFAULT_TIMEOUTS[keyof typeof DEFAULT_TIMEOUTS];
export type RetryStrategyType = typeof RETRY_STRATEGIES[keyof typeof RETRY_STRATEGIES];
export type TimeUnit = typeof TIME_UNITS[keyof typeof TIME_UNITS];