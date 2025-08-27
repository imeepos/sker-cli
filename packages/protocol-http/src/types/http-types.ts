/**
 * @fileoverview HTTP协议核心类型定义
 */

import { IncomingMessage, ServerResponse } from 'http';
import { Socket } from 'net';
import type { CoreOptions } from '@sker/core';

// HTTP Server Options interface for SkerCore integration
export interface HTTPServerOptions {
  serviceName?: string;
  version?: string;
  environment?: string;
  config?: Record<string, any>;
  plugins?: any[];
  lifecycle?: any;
  server?: Partial<ServerConfig>;
}

// HTTP方法类型
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'TRACE';

// HTTP状态码
export type HTTPStatusCode = number;

// 通用HTTP头部类型
export interface HTTPHeaders {
  [key: string]: string | string[] | undefined;
}

// HTTP请求查询参数
export interface HTTPQuery {
  [key: string]: string | string[] | undefined;
}

// HTTP请求参数
export interface HTTPParams {
  [key: string]: string;
}

// 服务器配置接口
export interface ServerConfig {
  // 基础配置
  host: string;
  port: number;
  
  // HTTPS配置
  https?: {
    enabled: boolean;
    keyFile?: string;
    certFile?: string;
    caFile?: string;
    http2?: {
      enabled: boolean;
      allowHTTP1: boolean;
      maxConcurrentStreams: number;
      maxFrameSize: number;
      initialWindowSize: number;
    };
    security?: {
      hsts?: {
        enabled: boolean;
        maxAge: number;
        includeSubDomains: boolean;
        preload: boolean;
      };
      csp?: {
        enabled: boolean;
        policy: string;
      };
    };
  };
  
  // 集群配置
  cluster?: {
    enabled: boolean;
    workers: 'auto' | number;
    maxMemory: string;
    gracefulShutdown: number;
  };
  
  // CORS配置
  cors?: {
    enabled: boolean;
    origin: string | string[] | RegExp | ((origin: string) => boolean);
    methods: string[];
    allowedHeaders: string[];
    exposedHeaders?: string[];
    credentials: boolean;
    maxAge: number;
  };
  
  // 压缩配置
  compression?: {
    enabled: boolean;
    algorithm: 'gzip' | 'deflate' | 'br';
    level: number;
    threshold: number;
  };
  
  // 限流配置
  rateLimit?: {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    message: string;
    keyGenerator: (req: HTTPRequest) => string;
    skip: (req: HTTPRequest) => boolean;
  };
  
  // 请求解析配置
  parsing?: {
    json?: {
      limit: string;
      strict: boolean;
    };
    urlencoded?: {
      limit: string;
      extended: boolean;
    };
    multipart?: {
      limit: string;
      maxFiles: number;
    };
  };
  
  // 静态文件服务
  static?: {
    enabled: boolean;
    root: string;
    maxAge: number;
    index: string[];
  };
  
  // 性能配置
  performance?: {
    maxConnections: number;
    keepAliveTimeout: number;
    headersTimeout: number;
    requestTimeout: number;
    maxHeaderSize: number;
    maxRequestSize: string;
    connectionPool?: {
      enabled: boolean;
      maxIdle: number;
      maxActive: number;
      idleTimeout: number;
    };
  };
  
  // 监控配置
  monitoring?: {
    enabled: boolean;
    health?: {
      enabled: boolean;
      path: string;
      checks: string[];
    };
    metrics?: {
      enabled: boolean;
      path: string;
      format: 'prometheus' | 'json';
    };
    tracing?: {
      enabled: boolean;
      serviceName: string;
      jaegerEndpoint: string;
    };
  };
  
  // 安全配置
  security?: {
    helmet?: {
      enabled: boolean;
      contentSecurityPolicy: boolean;
      crossOriginEmbedderPolicy: boolean;
      dnsPrefetchControl: boolean;
      frameguard: boolean;
      hidePoweredBy: boolean;
      hsts: boolean;
      ieNoOpen: boolean;
      noSniff: boolean;
      originAgentCluster: boolean;
      permittedCrossDomainPolicies: boolean;
      referrerPolicy: boolean;
      xssFilter: boolean;
    };
    rateLimit?: {
      global?: {
        windowMs: number;
        maxRequests: number;
      };
      paths?: Record<string, {
        windowMs: number;
        maxRequests: number;
      }>;
    };
  };
}

// 客户端配置接口
export interface ClientConfig {
  // 基础URL
  baseURL: string;
  
  // 默认请求头
  defaultHeaders?: HTTPHeaders;
  
  // 认证配置
  auth?: {
    type: 'bearer' | 'basic' | 'digest' | 'oauth2';
    token?: string;
    username?: string;
    password?: string;
    oauth2?: {
      clientId: string;
      clientSecret: string;
      tokenEndpoint: string;
      refreshToken?: string;
    };
  };
  
  // 超时配置
  timeout?: {
    connect?: number;
    request?: number;
    response?: number;
  };
  
  // 重试配置
  retry?: {
    maxAttempts: number;
    backoff: 'exponential' | 'linear' | 'fixed';
    initialDelay: number;
    maxDelay: number;
    retryCondition: (error: HTTPError) => boolean;
  };
  
  // 连接池配置
  connectionPool?: {
    maxConnections: number;
    maxConnectionsPerHost: number;
    keepAlive: boolean;
    keepAliveMsecs: number;
  };
  
  // 缓存配置
  cache?: {
    enabled: boolean;
    storage: 'memory' | 'redis' | 'file';
    ttl: number;
    maxSize: number;
    redis?: {
      host: string;
      port: number;
      password?: string;
      keyPrefix?: string;
    };
    strategies?: Record<string, { ttl: number }>;
    respectCacheHeaders?: boolean;
    staleWhileRevalidate?: boolean;
  };
  
  // HTTP Agent配置
  httpAgent?: {
    keepAlive: boolean;
    keepAliveMsecs: number;
    maxSockets: number;
    maxFreeSockets: number;
    timeout: number;
    freeSocketTimeout: number;
  };
  
  // 代理配置
  proxy?: {
    enabled: boolean;
    protocol: 'http' | 'https';
    host: string;
    port: number;
    auth?: {
      username: string;
      password: string;
    };
    rules?: Array<{
      match: string;
      proxy: string;
    }>;
  };
  
  // 断路器配置
  circuitBreaker?: {
    enabled: boolean;
    failureThreshold: number;
    recoveryTimeout: number;
    monitoringPeriod: number;
    services?: Record<string, {
      failureThreshold: number;
      recoveryTimeout: number;
    }>;
  };
  
  // 负载均衡配置
  loadBalancing?: {
    enabled: boolean;
    strategy: 'round_robin' | 'least_connections' | 'weighted';
    servers: Array<{
      url: string;
      weight?: number;
    }>;
    healthCheck?: {
      enabled: boolean;
      interval: number;
      timeout: number;
      path: string;
    };
  };
}

// 请求配置接口
export interface RequestConfig {
  method?: HTTPMethod;
  url?: string;
  headers?: HTTPHeaders;
  params?: HTTPQuery;
  data?: any;
  timeout?: number;
  responseType?: 'json' | 'text' | 'blob' | 'stream';
  cache?: {
    enabled: boolean;
    key?: string;
    ttl?: number;
  };
  retry?: {
    maxAttempts: number;
    backoff: 'exponential' | 'linear';
    retryDelay?: number;
  };
  validateStatus?: (status: number) => boolean;
  transformResponse?: (data: any) => any;
  onUploadProgress?: (progress: ProgressEvent) => void;
  onDownloadProgress?: (progress: ProgressEvent) => void;
  metadata?: Record<string, any>;
  compress?: boolean;
}

// 进度事件接口
export interface ProgressEvent {
  loaded: number;
  total?: number;
  percent: number;
}

// HTTP错误类
export class HTTPError extends Error {
  public code: string;
  public statusCode: number;
  public details?: any;
  
  constructor(statusCode: number, message: string, details?: any) {
    super(message);
    this.name = 'HTTPError';
    this.statusCode = statusCode;
    this.code = this.getErrorCode(statusCode);
    this.details = details;
  }
  
  private getErrorCode(statusCode: number): string {
    if (statusCode >= 400 && statusCode < 500) return 'CLIENT_ERROR';
    if (statusCode >= 500) return 'SERVER_ERROR';
    return 'HTTP_ERROR';
  }
}

// HTTP请求接口
export interface HTTPRequest {
  method: HTTPMethod;
  url: string;
  path: string;
  query: HTTPQuery;
  params: HTTPParams;
  headers: HTTPHeaders;
  body?: any;
  raw?: IncomingMessage;
  ip: string;
  socket: Socket;
}

// HTTP响应接口
export interface HTTPResponse {
  statusCode: number;
  headers: HTTPHeaders;
  body?: any;
  raw?: ServerResponse;
  
  status(code: number): HTTPResponse;
  header(name: string, value: string): HTTPResponse;
  setHeader(name: string, value: string): HTTPResponse;
  json(data: any): void;
  send(data: any): void;
  end(): void;
}

// 中间件上下文接口
export interface MiddlewareContext {
  request: HTTPRequest;
  response: HTTPResponse;
  params: HTTPParams;
  query: HTTPQuery;
  user?: any;
  state: Record<string, any>;
  
  throw(status: number, message?: string): never;
  json(data: any): void;
  send(data: any): void;
}

// 中间件函数类型
export type Middleware = (ctx: MiddlewareContext, next: () => Promise<void>) => Promise<void>;

// 路由处理器类型
export type RouteHandler = (ctx: MiddlewareContext) => Promise<void> | void;

// 请求拦截器类型
export type RequestInterceptor = (config: RequestConfig) => Promise<RequestConfig>;

// 响应拦截器类型
export type ResponseInterceptor = (response: HTTPResponseData) => Promise<HTTPResponseData>;

// HTTP响应数据接口
export interface HTTPResponseData<T = any> {
  status: number;
  statusText: string;
  headers: HTTPHeaders;
  data: T;
  config: RequestConfig;
}

// 路由配置接口
export interface RouteConfig {
  method: HTTPMethod;
  path: string;
  handler: RouteHandler;
  middleware?: Middleware[];
}

// 路由器配置接口
export interface RouterConfig {
  prefix?: string;
  caseSensitive?: boolean;
  strictSlash?: boolean;
}

// 控制器元数据接口
export interface ControllerMetadata {
  path: string;
  middleware?: Middleware[];
  routes: RouteMetadata[];
}

// 路由元数据接口
export interface RouteMetadata {
  method: HTTPMethod;
  path: string;
  propertyKey: string;
  middleware?: Middleware[];
  parameters?: ParameterMetadata[];
}

// 参数元数据接口
export interface ParameterMetadata {
  index: number;
  type: 'body' | 'param' | 'query' | 'header';
  key?: string;
}

// 缓存策略配置
export interface CacheStrategy {
  pattern: RegExp;
  ttl: number;
  keyGenerator?: (req: HTTPRequest) => string;
  staleWhileRevalidate?: boolean;
}

// 连接池配置
export interface ConnectionPoolConfig {
  maxConnections: number;
  maxConnectionsPerHost: number;
  keepAlive: boolean;
  keepAliveMsecs: number;
  maxIdleTime: number;
  connectTimeout: number;
  socketTimeout: number;
  healthCheck?: {
    enabled: boolean;
    interval: number;
    timeout: number;
    path?: string;
  };
  reuseConnections: boolean;
  warmup?: {
    enabled: boolean;
    connections: number;
    hosts: string[];
  };
}

// 缓存管理器配置
export interface CacheManagerConfig {
  levels: Array<{
    name: string;
    type: 'lru' | 'redis';
    maxSize?: number;
    ttl: number;
    connection?: {
      host: string;
      port: number;
    };
  }>;
  strategies: Record<string, CacheStrategy>;
  preload?: {
    enabled: boolean;
    urls: string[];
  };
}