/**
 * gRPC协议核心类型定义
 */

import type { CoreOptions } from '@sker/core';

export interface GRPCServerOptions {
  serviceName?: string;
  version?: string;
  environment?: string;
  serverConfig?: Partial<ServerConfig>;
  coreOptions?: Partial<CoreOptions>;
}

export interface TLSConfig {
  enabled: boolean;
  keyFile?: string;
  certFile?: string;
  caFile?: string;
  clientCertAuth?: boolean;
  cipherSuites?: string[];
  serverName?: string;
  insecureSkipVerify?: boolean;
}

export interface KeepAliveConfig {
  enabled: boolean;
  time: number;
  timeout: number;
  permitWithoutStream: boolean;
}

export interface CompressionConfig {
  enabled: boolean;
  algorithms: string[];
  level?: number;
  threshold?: number;
}

export interface HTTP2Config {
  maxConcurrentStreams: number;
  maxFrameSize: number;
  initialWindowSize: number;
  maxHeaderListSize: number;
}

export interface ConnectionConfig {
  maxConnections?: number;
  maxConnectionAge?: number;
  maxConnectionAgeGrace?: number;
  maxConnectionIdle?: number;
  keepAlive?: KeepAliveConfig;
  idleTimeout?: number;
  connectTimeout?: number;
}

export interface MessageConfig {
  maxReceiveSize: number;
  maxSendSize: number;
  maxMetadataSize?: number;
  compression?: CompressionConfig;
}

export interface ThreadPoolConfig {
  coreSize: number;
  maxSize: number;
  keepAlive: number;
  queueSize: number;
}

export interface HealthCheckConfig {
  enabled: boolean;
  services?: string[];
  serviceName?: string;
  interval?: number;
  timeout?: number;
}

export interface MonitoringConfig {
  enabled: boolean;
  metricsPort?: number;
  healthCheckPort?: number;
  metrics?: {
    requestDuration: boolean;
    requestCount: boolean;
    activeConnections: boolean;
    errorRate: boolean;
  };
}

export interface ServerConfig {
  host: string;
  port: number;
  tls?: TLSConfig;
  http2?: HTTP2Config;
  connection?: ConnectionConfig;
  message?: MessageConfig;
  threadPool?: ThreadPoolConfig;
  monitoring?: MonitoringConfig;
  healthCheck?: HealthCheckConfig;
  maxReceiveMessageSize?: number;
  maxSendMessageSize?: number;
  compression?: CompressionConfig;
  keepAlive?: KeepAliveConfig;
  maxConnections?: number;
}

export interface RetryPolicy {
  hedging?: {
    enabled: boolean;
    hedgingDelay: number;
    maxAttempts: number;
  };
}

export interface RetryConfig {
  maxAttempts: number;
  initialBackoff: number;
  maxBackoff: number;
  backoffMultiplier: number;
  jitter?: number;
  retryableStatusCodes: string[];
  retryPolicy?: RetryPolicy;
}

export interface LoadBalancingConfig {
  policy: 'round_robin' | 'pick_first' | 'grpclb' | 'weighted_round_robin' | 'least_requests';
  targets?: string[];
  subchannelPoolSize?: number;
  healthCheck?: HealthCheckConfig;
  locality?: {
    region: string;
    zone: string;
    subzone: string;
  };
}

export interface AuthConfig {
  type: 'jwt' | 'api_key' | 'oauth2' | 'mtls';
  jwt?: {
    tokenProvider: () => Promise<string>;
    refreshThreshold: number;
  };
  apiKey?: {
    key: string;
    headerName?: string;
  };
  oauth2?: {
    clientId: string;
    clientSecret: string;
    tokenUrl: string;
  };
}

export interface SecurityConfig {
  tls?: TLSConfig;
  auth?: AuthConfig;
}

export interface ClientConfig {
  target?: string;
  connection?: ConnectionConfig;
  retry?: RetryConfig;
  loadBalancing?: LoadBalancingConfig;
  security?: SecurityConfig;
  serviceDiscovery?: ServiceDiscoveryConfig;
  loadBalancer?: LoadBalancerConfig;
  defaultTimeout?: number;
  maxReceiveMessageSize?: number;
  maxSendMessageSize?: number;
  tls?: TLSConfig;
  keepAlive?: KeepAliveConfig;
  services?: Record<string, ServiceConfig>;
}

export interface ServiceConfig {
  discovery?: {
    serviceName: string;
    tags?: string[];
  };
  timeout?: number;
  retries?: number;
  cache?: {
    ttl: number;
  };
  streamingTimeout?: number;
}

export interface ServiceDiscoveryConfig {
  provider: 'consul' | 'etcd' | 'zookeeper' | 'dns';
  consul?: {
    host: string;
    port: number;
    registration?: ConsulRegistration;
  };
}

export interface ConsulRegistration {
  name: string;
  id: string;
  tags: string[];
  address: string;
  port: number;
  check?: {
    grpc: string;
    interval: string;
    timeout: string;
  };
}

export interface LoadBalancerConfig {
  policy: string;
  healthChecker?: HealthCheckerConfig;
  circuitBreaker?: CircuitBreakerConfig;
}

export interface HealthCheckerConfig {
  interval: number;
  timeout: number;
  unhealthyThreshold: number;
  healthyThreshold: number;
}

export interface CircuitBreakerConfig {
  enabled: boolean;
  failureThreshold: number;
  recoveryTimeout: number;
  monitoringPeriod: number;
}

export interface PoolConfig {
  minConnections: number;
  maxConnections: number;
  maxConnectionAge: number;
  maxConnectionIdle: number;
  connectionTimeout: number;
  healthCheckInterval: number;
  healthCheckTimeout: number;
  balancingPolicy: string;
  warmupConnections: number;
  warmupTimeout: number;
}

export interface StreamOptimizerConfig {
  bufferSize: number;
  maxBufferedMessages: number;
  batchSize: number;
  batchTimeout: number;
  backpressure: {
    enabled: boolean;
    highWaterMark: number;
    lowWaterMark: number;
    strategy: 'drop_oldest' | 'drop_newest' | 'block';
  };
  compression: CompressionConfig;
}

export interface MiddlewareContext {
  service: string;
  method: string;
  peer: string;
  getMetadata(): Map<string, string[]>;
  setUser(user: any): void;
}

export type ServerMiddleware = (context: MiddlewareContext, next: () => Promise<any>) => Promise<any>;
export type ClientMiddleware = (options?: any) => (context: MiddlewareContext, next: () => Promise<any>) => Promise<any>;

export interface ServiceHandler<T = any> {
  [key: string]: (...args: any[]) => Promise<any> | AsyncGenerator<any> | any;
}

export interface ServiceRegistry {
  addService<T>(serviceName: string, implementation: ServiceHandler<T>, options?: ServiceRegistrationOptions): void;
  getService(serviceName: string): ServiceHandler | undefined;
  removeService(serviceName: string): boolean;
  listServices(): string[];
}

export interface ServiceRegistrationOptions {
  middleware?: string[];
  methods?: Record<string, MethodConfig>;
}

export interface MethodConfig {
  timeout?: number;
  retries?: number;
  cache?: {
    ttl: number;
  };
  streamingTimeout?: number;
}

export enum StatusCode {
  OK = 0,
  CANCELLED = 1,
  UNKNOWN = 2,
  INVALID_ARGUMENT = 3,
  DEADLINE_EXCEEDED = 4,
  NOT_FOUND = 5,
  ALREADY_EXISTS = 6,
  PERMISSION_DENIED = 7,
  RESOURCE_EXHAUSTED = 8,
  FAILED_PRECONDITION = 9,
  ABORTED = 10,
  OUT_OF_RANGE = 11,
  UNIMPLEMENTED = 12,
  INTERNAL = 13,
  UNAVAILABLE = 14,
  DATA_LOSS = 15,
  UNAUTHENTICATED = 16
}

export class Status extends Error {
  constructor(
    public readonly code: StatusCode,
    public readonly details: string,
    public readonly metadata?: Record<string, any>
  ) {
    super(details);
    this.name = 'GRPCStatus';
  }
}