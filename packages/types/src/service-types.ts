/**
 * 服务相关类型定义
 * Service-related type definitions
 */

import type { SkerString, SkerTimestamp, UUID, URL } from './basic-types.js';
import type { SkerArray, SkerRecord, SkerMap } from './collection-types.js';

/**
 * 协议类型枚举
 * Protocol type enumeration
 */
export enum Protocol {
  UNKNOWN = 'unknown',
  HTTP = 'http',
  HTTPS = 'https',
  GRPC = 'grpc',
  GRPC_WEB = 'grpc-web',
  WEBSOCKET = 'websocket',
  WEBSOCKET_SECURE = 'wss',
  TCP = 'tcp',
  UDP = 'udp',
  MQTT = 'mqtt',
  AMQP = 'amqp',
  KAFKA = 'kafka',
  REDIS = 'redis'
}

/**
 * 健康状态枚举
 * Health status enumeration
 */
export enum HealthStatus {
  /** 未知状态 */
  UNKNOWN = 0,
  
  /** 健康状态 */
  HEALTHY = 1,
  
  /** 不健康状态 */
  UNHEALTHY = 2,
  
  /** 维护状态 */
  MAINTENANCE = 3,
  
  /** 降级服务状态 */
  DEGRADED = 4,
  
  /** 启动中状态 */
  STARTING = 5,
  
  /** 关闭中状态 */
  SHUTTING_DOWN = 6
}

/**
 * 负载均衡策略枚举
 * Load balance strategy enumeration
 */
export enum LoadBalanceStrategy {
  /** 轮询 */
  ROUND_ROBIN = 'round_robin',
  
  /** 随机 */
  RANDOM = 'random',
  
  /** 最少连接 */
  LEAST_CONNECTIONS = 'least_connections',
  
  /** 加权轮询 */
  WEIGHTED_ROUND_ROBIN = 'weighted_round_robin',
  
  /** 加权随机 */
  WEIGHTED_RANDOM = 'weighted_random',
  
  /** 最少响应时间 */
  LEAST_RESPONSE_TIME = 'least_response_time',
  
  /** 一致性哈希 */
  CONSISTENT_HASH = 'consistent_hash',
  
  /** IP哈希 */
  IP_HASH = 'ip_hash'
}

/**
 * 服务状态枚举
 * Service state enumeration
 */
export enum ServiceState {
  /** 初始化中 */
  INITIALIZING = 'initializing',
  
  /** 运行中 */
  RUNNING = 'running',
  
  /** 暂停 */
  PAUSED = 'paused',
  
  /** 停止 */
  STOPPED = 'stopped',
  
  /** 错误状态 */
  ERROR = 'error',
  
  /** 重启中 */
  RESTARTING = 'restarting'
}

/**
 * 网络信息接口
 * Network information interface
 */
export interface NetworkInfo {
  /** 主机地址 */
  host: SkerString;
  
  /** 端口号 */
  port: number;
  
  /** 协议类型 */
  protocol: Protocol;
  
  /** 基础路径 */
  base_path?: SkerString;
  
  /** SSL/TLS配置 */
  tls_config?: {
    enabled: boolean;
    cert_file?: SkerString;
    key_file?: SkerString;
    ca_file?: SkerString;
    insecure_skip_verify?: boolean;
  };
  
  /** 连接超时（毫秒） */
  connect_timeout_ms?: number;
  
  /** 读取超时（毫秒） */
  read_timeout_ms?: number;
  
  /** 写入超时（毫秒） */
  write_timeout_ms?: number;
  
  /** 最大连接数 */
  max_connections?: number;
}

/**
 * 服务健康检查配置接口
 * Service health check configuration interface
 */
export interface HealthCheckConfig {
  /** 健康检查URL */
  health_check_url?: URL;
  
  /** 检查间隔（秒） */
  interval_seconds: number;
  
  /** 超时时间（秒） */
  timeout_seconds: number;
  
  /** 健康阈值 */
  healthy_threshold: number;
  
  /** 不健康阈值 */
  unhealthy_threshold: number;
  
  /** 启用标识 */
  enabled: boolean;
  
  /** 自定义健康检查方法 */
  custom_check?: SkerString;
}

/**
 * 服务指标接口
 * Service metrics interface
 */
export interface ServiceMetrics {
  /** CPU使用率（百分比） */
  cpu_usage_percent?: number;
  
  /** 内存使用量（字节） */
  memory_usage_bytes?: number;
  
  /** 内存使用率（百分比） */
  memory_usage_percent?: number;
  
  /** 磁盘使用量（字节） */
  disk_usage_bytes?: number;
  
  /** 网络输入字节数 */
  network_in_bytes?: number;
  
  /** 网络输出字节数 */
  network_out_bytes?: number;
  
  /** 活跃连接数 */
  active_connections?: number;
  
  /** 平均响应时间（毫秒） */
  average_response_time_ms?: number;
  
  /** 每秒请求数 */
  requests_per_second?: number;
  
  /** 错误率（百分比） */
  error_rate_percent?: number;
  
  /** 正常运行时间（秒） */
  uptime_seconds?: number;
  
  /** 最后更新时间 */
  last_updated: SkerTimestamp;
  
  /** 自定义指标 */
  custom_metrics?: SkerRecord<string, number>;
}

/**
 * 服务信息接口
 * Service information interface
 */
export interface ServiceInfo {
  /** 服务名称 */
  service_name: SkerString;
  
  /** 服务版本 */
  service_version: SkerString;
  
  /** 服务实例ID */
  service_id: UUID;
  
  /** 实例ID（同一服务的不同实例） */
  instance_id?: UUID;
  
  /** 网络信息 */
  network_info: NetworkInfo;
  
  /** 健康状态 */
  health_status: HealthStatus;
  
  /** 服务状态 */
  service_state: ServiceState;
  
  /** 服务描述 */
  description?: SkerString;
  
  /** 服务标签 */
  tags: SkerArray<SkerString>;
  
  /** 服务能力列表 */
  capabilities: SkerArray<SkerString>;
  
  /** 支持的API版本 */
  supported_api_versions: SkerArray<SkerString>;
  
  /** 元数据 */
  metadata: SkerRecord<string, unknown>;
  
  /** 注册时间 */
  registered_at: SkerTimestamp;
  
  /** 最后更新时间 */
  last_updated: SkerTimestamp;
  
  /** 最后心跳时间 */
  last_heartbeat?: SkerTimestamp;
  
  /** 健康检查配置 */
  health_check?: HealthCheckConfig;
  
  /** 服务指标 */
  metrics?: ServiceMetrics;
  
  /** 负载均衡权重 */
  load_balance_weight?: number;
  
  /** 服务依赖 */
  dependencies?: SkerArray<SkerString>;
  
  /** 服务端点列表 */
  endpoints?: SkerArray<ServiceEndpoint>;
}

/**
 * 服务端点接口
 * Service endpoint interface
 */
export interface ServiceEndpoint {
  /** 端点ID */
  endpoint_id: UUID;
  
  /** 端点名称 */
  name: SkerString;
  
  /** 端点路径 */
  path: SkerString;
  
  /** HTTP方法 */
  method?: SkerString;
  
  /** 端点描述 */
  description?: SkerString;
  
  /** 输入模式 */
  input_schema?: SkerString;
  
  /** 输出模式 */
  output_schema?: SkerString;
  
  /** 是否已弃用 */
  deprecated?: boolean;
  
  /** 版本信息 */
  version?: SkerString;
  
  /** 标签 */
  tags?: SkerArray<SkerString>;
  
  /** 元数据 */
  metadata?: SkerRecord<string, unknown>;
}

/**
 * 服务注册表接口
 * Service registry interface
 */
export interface ServiceRegistry {
  /** 注册表ID */
  registry_id: UUID;
  
  /** 注册表名称 */
  name: SkerString;
  
  /** 服务列表 */
  services: SkerMap<SkerString, SkerArray<ServiceInfo>>;
  
  /** 负载均衡策略 */
  load_balance_strategy: LoadBalanceStrategy;
  
  /** 服务发现配置 */
  discovery_config: {
    /** 启用服务发现 */
    enabled: boolean;
    
    /** 发现间隔（秒） */
    discovery_interval_seconds: number;
    
    /** 缓存TTL（秒） */
    cache_ttl_seconds: number;
    
    /** 故障转移启用 */
    failover_enabled: boolean;
    
    /** 断路器配置 */
    circuit_breaker?: {
      failure_threshold: number;
      recovery_timeout_seconds: number;
      half_open_max_calls: number;
    };
  };
  
  /** 注册表元数据 */
  metadata?: SkerRecord<string, unknown>;
  
  /** 创建时间 */
  created_at: SkerTimestamp;
  
  /** 最后更新时间 */
  last_updated: SkerTimestamp;
}

/**
 * 服务发现查询接口
 * Service discovery query interface
 */
export interface ServiceDiscoveryQuery {
  /** 服务名称 */
  service_name?: SkerString;
  
  /** 服务版本 */
  service_version?: SkerString;
  
  /** 标签过滤器 */
  tags?: SkerArray<SkerString>;
  
  /** 健康状态过滤器 */
  health_status?: SkerArray<HealthStatus>;
  
  /** 能力过滤器 */
  capabilities?: SkerArray<SkerString>;
  
  /** 元数据过滤器 */
  metadata_filters?: SkerRecord<string, unknown>;
  
  /** 最大返回数量 */
  max_results?: number;
  
  /** 排序方式 */
  sort_by?: 'name' | 'version' | 'health' | 'load' | 'response_time';
  
  /** 排序方向 */
  sort_order?: 'asc' | 'desc';
}

/**
 * 服务发现结果接口
 * Service discovery result interface
 */
export interface ServiceDiscoveryResult {
  /** 查询ID */
  query_id: UUID;
  
  /** 查询参数 */
  query: ServiceDiscoveryQuery;
  
  /** 匹配的服务列表 */
  services: SkerArray<ServiceInfo>;
  
  /** 总数量 */
  total_count: number;
  
  /** 查询时间 */
  query_time: SkerTimestamp;
  
  /** 查询耗时（毫秒） */
  query_duration_ms: number;
  
  /** 是否来自缓存 */
  from_cache: boolean;
  
  /** 缓存过期时间 */
  cache_expires_at?: SkerTimestamp;
}

/**
 * 服务依赖关系接口
 * Service dependency interface
 */
export interface ServiceDependency {
  /** 依赖ID */
  dependency_id: UUID;
  
  /** 源服务 */
  source_service: SkerString;
  
  /** 目标服务 */
  target_service: SkerString;
  
  /** 依赖类型 */
  dependency_type: 'required' | 'optional' | 'conditional';
  
  /** 依赖强度 */
  strength: 'strong' | 'weak';
  
  /** 描述 */
  description?: SkerString;
  
  /** 版本约束 */
  version_constraint?: SkerString;
  
  /** 元数据 */
  metadata?: SkerRecord<string, unknown>;
  
  /** 创建时间 */
  created_at: SkerTimestamp;
}

/**
 * 服务部署信息接口
 * Service deployment information interface
 */
export interface ServiceDeployment {
  /** 部署ID */
  deployment_id: UUID;
  
  /** 服务信息 */
  service_info: ServiceInfo;
  
  /** 部署环境 */
  environment: 'development' | 'testing' | 'staging' | 'production' | SkerString;
  
  /** 部署版本 */
  deployment_version: SkerString;
  
  /** 镜像信息 */
  image_info?: {
    registry: SkerString;
    repository: SkerString;
    tag: SkerString;
    digest?: SkerString;
  };
  
  /** 配置信息 */
  configuration: SkerRecord<string, unknown>;
  
  /** 资源限制 */
  resource_limits?: {
    cpu_cores?: number;
    memory_mb?: number;
    disk_gb?: number;
    network_bandwidth_mbps?: number;
  };
  
  /** 扩容配置 */
  scaling_config?: {
    min_instances: number;
    max_instances: number;
    target_cpu_utilization?: number;
    target_memory_utilization?: number;
    scale_up_threshold?: number;
    scale_down_threshold?: number;
  };
  
  /** 部署状态 */
  deployment_status: 'deploying' | 'running' | 'failed' | 'rolling_back' | 'stopped';
  
  /** 部署时间 */
  deployed_at: SkerTimestamp;
  
  /** 最后更新时间 */
  last_updated: SkerTimestamp;
  
  /** 部署日志 */
  deployment_logs?: SkerArray<SkerString>;
  
  /** 元数据 */
  metadata?: SkerRecord<string, unknown>;
}