import { EventEmitter } from 'events';
import {
  ProtocolType,
  ProtocolStatus,
  Connection,
  ConnectionConfig,
  CallOptions,
  StreamOptions
} from '../interfaces/protocol.js';

/**
 * 服务元数据接口
 */
export interface ServiceMetadata {
  name: string;
  version: string;
  description?: string;
  endpoints: ServiceEndpoint[];
  schemas?: Record<string, any>;
  tags?: string[];
  dependencies?: string[];
  healthCheck?: HealthCheckConfig;
  monitoring?: MonitoringConfig;
  rateLimit?: RateLimitConfig;
}

/**
 * 服务端点接口
 */
export interface ServiceEndpoint {
  protocol: ProtocolType;
  host: string;
  port: number;
  path?: string;
  metadata?: Record<string, any>;
  weight?: number;
  priority?: number;
  health?: HealthStatus;
}

/**
 * 健康检查配置
 */
export interface HealthCheckConfig {
  enabled: boolean;
  endpoint?: string;
  interval: number;
  timeout?: number;
  retries?: number;
  successThreshold?: number;
  failureThreshold?: number;
}

/**
 * 健康状态枚举
 */
export enum HealthStatus {
  HEALTHY = 'healthy',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown',
  DEGRADED = 'degraded'
}

/**
 * 监控配置
 */
export interface MonitoringConfig {
  enabled: boolean;
  metricsEndpoint?: string;
  tracingEnabled?: boolean;
  loggingLevel?: 'error' | 'warn' | 'info' | 'debug';
  customMetrics?: string[];
}

/**
 * 限流配置
 */
export interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond?: number;
  requestsPerMinute?: number;
  burstSize?: number;
  strategy?: 'fixed_window' | 'sliding_window' | 'token_bucket';
}

/**
 * 请求上下文接口
 */
export interface RequestContext {
  id: string;
  protocol: ProtocolType;
  service: string;
  method: string;
  startTime: number;
  timeout?: number;
  retries?: number;
  metadata: Record<string, any>;
  tracing?: TracingInfo;
  user?: UserInfo;
}

/**
 * 追踪信息接口
 */
export interface TracingInfo {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  baggage?: Record<string, any>;
}

/**
 * 用户信息接口
 */
export interface UserInfo {
  id: string;
  name?: string;
  roles?: string[];
  permissions?: string[];
  metadata?: Record<string, any>;
}

/**
 * 协议客户端工厂接口
 */
export interface ProtocolClientFactory {
  createClient(
    protocol: ProtocolType,
    target: string,
    config?: ConnectionConfig,
    options?: ClientOptions
  ): Promise<ProtocolClientWrapper>;
  
  getSupportedProtocols(): ProtocolType[];
  validateTarget(protocol: ProtocolType, target: string): boolean;
}

/**
 * 客户端选项接口
 */
export interface ClientOptions {
  retry?: RetryOptions;
  timeout?: number;
  pool?: PoolOptions;
  middleware?: MiddlewareConfig[];
  interceptors?: InterceptorConfig[];
}

/**
 * 重试选项接口
 */
export interface RetryOptions {
  maxAttempts: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: any) => boolean;
}

/**
 * 连接池选项接口
 */
export interface PoolOptions {
  enabled: boolean;
  maxSize?: number;
  minSize?: number;
  idleTimeout?: number;
  acquireTimeout?: number;
  validation?: boolean;
}

/**
 * 中间件配置接口
 */
export interface MiddlewareConfig {
  name: string;
  enabled: boolean;
  order?: number;
  config?: Record<string, any>;
}

/**
 * 拦截器配置接口
 */
export interface InterceptorConfig {
  name: string;
  type: 'request' | 'response' | 'error';
  handler: Function;
  order?: number;
}

/**
 * 协议客户端包装器接口
 */
export interface ProtocolClientWrapper extends EventEmitter {
  readonly protocol: ProtocolType;
  readonly target: string;
  readonly isConnected: boolean;
  readonly stats: ClientStats;
  
  call<T = any>(
    service: string,
    method: string,
    data: any,
    options?: CallOptions
  ): Promise<T>;
  
  stream<T = any>(
    service: string,
    method: string,
    data: any,
    options?: StreamOptions
  ): AsyncIterableIterator<T>;
  
  ping(): Promise<number>;
  close(): Promise<void>;
  
  // 事件
  on(event: 'connected', listener: () => void): this;
  on(event: 'disconnected', listener: (reason?: string) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'request', listener: (context: RequestContext) => void): this;
  on(event: 'response', listener: (context: RequestContext, data: any) => void): this;
}

/**
 * 客户端统计信息接口
 */
export interface ClientStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalBytes: number;
  averageLatency: number;
  lastRequestTime: number;
  connectionCount: number;
  errorRate: number;
}

/**
 * 协议服务端工厂接口
 */
export interface ProtocolServerFactory {
  createServer(
    protocol: ProtocolType,
    config: ServerConfig
  ): Promise<ProtocolServerWrapper>;
  
  getSupportedProtocols(): ProtocolType[];
}

/**
 * 服务端配置接口
 */
export interface ServerConfig {
  host: string;
  port: number;
  ssl?: SSLConfig;
  middleware?: MiddlewareConfig[];
  interceptors?: InterceptorConfig[];
  rateLimit?: RateLimitConfig;
  cors?: CorsConfig;
  compression?: CompressionConfig;
  metadata?: Record<string, any>;
}

/**
 * SSL配置接口
 */
export interface SSLConfig {
  enabled: boolean;
  certificate?: string;
  privateKey?: string;
  caCertificate?: string;
  clientAuth?: boolean;
}

/**
 * CORS配置接口
 */
export interface CorsConfig {
  enabled: boolean;
  origins?: string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

/**
 * 压缩配置接口
 */
export interface CompressionConfig {
  enabled: boolean;
  algorithm?: 'gzip' | 'brotli' | 'deflate';
  level?: number;
  threshold?: number;
}

/**
 * 协议服务端包装器接口
 */
export interface ProtocolServerWrapper extends EventEmitter {
  readonly protocol: ProtocolType;
  readonly address: string;
  readonly port: number;
  readonly isRunning: boolean;
  readonly stats: ServerStats;
  
  start(): Promise<void>;
  stop(): Promise<void>;
  
  registerHandler(service: string, methods: Record<string, Function>): void;
  unregisterHandler(service: string): void;
  
  // 事件
  on(event: 'started', listener: () => void): this;
  on(event: 'stopped', listener: () => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'request', listener: (context: RequestContext) => void): this;
  on(event: 'response', listener: (context: RequestContext, data: any) => void): this;
  on(event: 'connection', listener: (connection: Connection) => void): this;
}

/**
 * 服务端统计信息接口
 */
export interface ServerStats {
  totalRequests: number;
  activeRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalConnections: number;
  activeConnections: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

/**
 * 服务注册信息接口
 */
export interface ServiceRegistration {
  id: string;
  name: string;
  version: string;
  address: string;
  port: number;
  protocol: ProtocolType;
  tags?: string[];
  metadata?: Record<string, any>;
  healthCheck?: HealthCheckConfig;
  ttl?: number;
  registeredAt: number;
}

/**
 * 服务发现查询接口
 */
export interface ServiceDiscoveryQuery {
  name: string;
  version?: string;
  protocol?: ProtocolType;
  tags?: string[];
  healthy?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 服务发现结果接口
 */
export interface ServiceDiscoveryResult {
  services: ServiceRegistration[];
  lastUpdated: number;
  source: string;
}

/**
 * 负载均衡器接口
 */
export interface LoadBalancer {
  readonly strategy: string;
  
  select(
    services: ServiceRegistration[],
    context?: RequestContext
  ): ServiceRegistration | null;
  
  updateHealth(serviceId: string, health: HealthStatus): void;
  getStats(): LoadBalancerStats;
}

/**
 * 负载均衡统计信息接口
 */
export interface LoadBalancerStats {
  totalRequests: number;
  distributionMap: Record<string, number>;
  averageLatency: Record<string, number>;
  errorRates: Record<string, number>;
}

/**
 * 熔断器状态枚举
 */
export enum CircuitBreakerState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

/**
 * 熔断器配置接口
 */
export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod: number;
  minimumRequests: number;
  successThreshold?: number;
}

/**
 * 熔断器状态接口
 */
export interface CircuitBreakerStatus {
  state: CircuitBreakerState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
  isRequestAllowed: boolean;
}

/**
 * 性能指标接口
 */
export interface PerformanceMetrics {
  timestamp: number;
  protocol: ProtocolType;
  service?: string;
  method?: string;
  
  // 请求指标
  requestCount: number;
  requestRate: number;
  
  // 延迟指标
  latencyP50: number;
  latencyP95: number;
  latencyP99: number;
  averageLatency: number;
  
  // 错误指标
  errorCount: number;
  errorRate: number;
  
  // 吞吐量指标
  throughput: number;
  
  // 连接指标
  connectionCount: number;
  activeConnections: number;
  
  // 资源指标
  memoryUsage?: number;
  cpuUsage?: number;
}

/**
 * 协议选择上下文接口
 */
export interface ProtocolSelectionContext {
  service: string;
  method: string;
  payloadSize?: number;
  clientType?: 'web' | 'mobile' | 'server' | 'iot';
  latencyRequirement?: number;
  throughputRequirement?: number;
  reliabilityRequirement?: number;
  securityRequirement?: boolean;
  streamingRequired?: boolean;
  bidirectionalRequired?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 协议选择结果接口
 */
export interface ProtocolSelectionResult {
  protocol: ProtocolType;
  score: number;
  reason: string;
  alternatives: Array<{
    protocol: ProtocolType;
    score: number;
    reason: string;
  }>;
  selectionTime: number;
}