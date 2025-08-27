// 环境类型
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production'
} as const;

// 配置源
export const CONFIG_SOURCES = {
  ENVIRONMENT: 'env',
  FILE: 'file',
  REMOTE: 'remote',
  DATABASE: 'database',
  CONSUL: 'consul',
  ETCD: 'etcd'
} as const;

// 默认限制
export const DEFAULT_LIMITS = {
  MAX_REQUEST_SIZE: 10485760,     // 10MB
  MAX_RESPONSE_SIZE: 10485760,    // 10MB
  MAX_CONNECTIONS: 1000,          // 最大连接数
  MAX_CONCURRENT_REQUESTS: 100,   // 最大并发请求
  RATE_LIMIT_PER_MINUTE: 1000,    // 每分钟限制数
  MAX_RETRY_ATTEMPTS: 3,          // 最大重试次数
  MAX_BATCH_SIZE: 100             // 最大批处理大小
} as const;

// 配置优先级
export const CONFIG_PRIORITIES = {
  COMMAND_LINE: 0,      // 最高优先级
  ENVIRONMENT: 1,
  FILE: 2,
  REMOTE: 3,
  DEFAULT: 4            // 最低优先级
} as const;

// 配置接口
export interface ConfigEntry {
  key: string;
  value: any;
  source: ConfigSourceType;
  priority: number;
  description?: string;
  required?: boolean;
  defaultValue?: any;
}

export interface ApplicationConfig {
  environment: EnvironmentType;
  service: {
    name: string;
    version: string;
    port: number;
  };
  database?: {
    host: string;
    port: number;
    name: string;
    username: string;
    password: string;
  };
  cache?: {
    host: string;
    port: number;
    ttl: number;
  };
  logging?: {
    level: string;
    format: string;
    output: string;
  };
  security?: {
    jwtSecret: string;
    encryptionKey: string;
    corsOrigins: string[];
  };
  limits?: Partial<typeof DEFAULT_LIMITS>;
}

// 类型定义
export type EnvironmentType = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];
export type ConfigSourceType = typeof CONFIG_SOURCES[keyof typeof CONFIG_SOURCES];
export type DefaultLimit = typeof DEFAULT_LIMITS[keyof typeof DEFAULT_LIMITS];
export type ConfigPriority = typeof CONFIG_PRIORITIES[keyof typeof CONFIG_PRIORITIES];