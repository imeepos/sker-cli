// 服务状态
export const SERVICE_STATUS = {
  UNKNOWN: 0,
  HEALTHY: 1,
  UNHEALTHY: 2,
  MAINTENANCE: 3,
  STARTING: 4,
  STOPPING: 5
} as const;

// 负载均衡策略
export const LOAD_BALANCE_STRATEGIES = {
  ROUND_ROBIN: 'round_robin',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  RANDOM: 'random',
  CONSISTENT_HASHING: 'consistent_hashing',
  IP_HASH: 'ip_hash'
} as const;

// 默认端口配置
export const DEFAULT_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  GRPC: 50051,
  WEBSOCKET: 8080,
  WEBSOCKET_SECURE: 8443,
  REDIS: 6379,
  MYSQL: 3306,
  POSTGRESQL: 5432,
  MONGODB: 27017,
  ELASTICSEARCH: 9200
} as const;

// 健康检查配置
export const HEALTH_CHECK_CONFIG = {
  DEFAULT_INTERVAL: 30000,      // 30秒
  DEFAULT_TIMEOUT: 10000,       // 10秒  
  DEFAULT_RETRIES: 3,           // 3次重试
  DEFAULT_THRESHOLD: 3,         // 连续3次失败才标记为不健康
  STARTUP_GRACE_PERIOD: 60000   // 启动宽限期60秒
} as const;

// 服务信息接口
export interface ServiceInfo {
  name: string;
  version: string;
  host: string;
  port: number;
  status: ServiceStatusType;
  loadBalanceStrategy: LoadBalanceStrategyType;
  healthCheck?: {
    endpoint: string;
    interval: number;
    timeout: number;
    retries?: number;
  };
  metadata?: Record<string, any>;
}

// 类型定义
export type ServiceStatusType = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];
export type LoadBalanceStrategyType = typeof LOAD_BALANCE_STRATEGIES[keyof typeof LOAD_BALANCE_STRATEGIES];
export type DefaultPortType = typeof DEFAULT_PORTS[keyof typeof DEFAULT_PORTS];