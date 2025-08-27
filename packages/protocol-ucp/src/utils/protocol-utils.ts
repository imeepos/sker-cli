import {
  ProtocolType,
  ProtocolError,
  CallOptions,
  StreamOptions
} from '../interfaces/protocol.js';

/**
 * 协议错误实现
 */
export class ProtocolErrorImpl extends Error implements ProtocolError {
  public readonly code: string;
  public readonly protocol?: ProtocolType;
  public readonly service?: string;
  public readonly method?: string;
  public readonly target?: string;
  public override readonly cause?: Error;
  
  constructor(options: {
    code: string;
    message: string;
    protocol?: ProtocolType;
    service?: string;
    method?: string;
    target?: string;
    cause?: Error;
  }) {
    super(options.message);
    this.name = 'ProtocolError';
    this.code = options.code;
    this.protocol = options.protocol;
    this.service = options.service;
    this.method = options.method;
    this.target = options.target;
    this.cause = options.cause;
    
    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ProtocolErrorImpl);
    }
  }
  
  override toString(): string {
    return `${this.name}: [${this.code}] ${this.message}${this.protocol ? ` (protocol: ${this.protocol})` : ''}${this.target ? ` (target: ${this.target})` : ''}`;
  }
  
  toJSON(): any {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      protocol: this.protocol,
      service: this.service,
      method: this.method,
      target: this.target,
      stack: this.stack
    };
  }
}

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  // 连接错误
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  CONNECTION_LOST = 'CONNECTION_LOST',
  CONNECTION_REFUSED = 'CONNECTION_REFUSED',
  
  // 协议错误
  PROTOCOL_ERROR = 'PROTOCOL_ERROR',
  PROTOCOL_NOT_SUPPORTED = 'PROTOCOL_NOT_SUPPORTED',
  PROTOCOL_VERSION_MISMATCH = 'PROTOCOL_VERSION_MISMATCH',
  
  // 请求错误
  TIMEOUT = 'TIMEOUT',
  REQUEST_FAILED = 'REQUEST_FAILED',
  INVALID_REQUEST = 'INVALID_REQUEST',
  REQUEST_TOO_LARGE = 'REQUEST_TOO_LARGE',
  
  // 响应错误
  RESPONSE_ERROR = 'RESPONSE_ERROR',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  RESPONSE_TOO_LARGE = 'RESPONSE_TOO_LARGE',
  
  // 服务错误
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  SERVICE_NOT_FOUND = 'SERVICE_NOT_FOUND',
  METHOD_NOT_FOUND = 'METHOD_NOT_FOUND',
  SERVICE_OVERLOADED = 'SERVICE_OVERLOADED',
  
  // 认证错误
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  AUTHORIZATION_FAILED = 'AUTHORIZATION_FAILED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  
  // 系统错误
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  RATE_LIMITED = 'RATE_LIMITED'
}

/**
 * 协议工具函数
 */
export class ProtocolUtils {
  /**
   * 创建协议错误
   */
  static createError(
    code: ErrorCode | string,
    message: string,
    options?: {
      protocol?: ProtocolType;
      service?: string;
      method?: string;
      target?: string;
      cause?: Error;
    }
  ): ProtocolError {
    return new ProtocolErrorImpl({
      code,
      message,
      ...options
    });
  }
  
  /**
   * 检查错误是否为协议错误
   */
  static isProtocolError(error: any): error is ProtocolError {
    return error instanceof ProtocolErrorImpl || 
           (error && typeof error.code === 'string' && typeof error.protocol === 'string');
  }
  
  /**
   * 检查错误是否可重试
   */
  static isRetryableError(error: any): boolean {
    if (!this.isProtocolError(error)) {
      return false;
    }
    
    const retryableCodes = [
      ErrorCode.CONNECTION_TIMEOUT,
      ErrorCode.CONNECTION_LOST,
      ErrorCode.CONNECTION_REFUSED,
      ErrorCode.TIMEOUT,
      ErrorCode.SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_OVERLOADED,
      ErrorCode.INTERNAL_ERROR
    ];
    
    return retryableCodes.includes(error.code as ErrorCode);
  }
  
  /**
   * 检查错误是否为临时错误
   */
  static isTemporaryError(error: any): boolean {
    if (!this.isProtocolError(error)) {
      return false;
    }
    
    const temporaryCodes = [
      ErrorCode.CONNECTION_TIMEOUT,
      ErrorCode.CONNECTION_LOST,
      ErrorCode.TIMEOUT,
      ErrorCode.SERVICE_OVERLOADED,
      ErrorCode.RESOURCE_EXHAUSTED,
      ErrorCode.RATE_LIMITED
    ];
    
    return temporaryCodes.includes(error.code as ErrorCode);
  }
  
  /**
   * 从HTTP状态码创建协议错误
   */
  static fromHttpStatus(
    status: number,
    message?: string,
    options?: {
      protocol?: ProtocolType;
      service?: string;
      method?: string;
      target?: string;
    }
  ): ProtocolError {
    let code: ErrorCode;
    let defaultMessage: string;
    
    switch (status) {
      case 400:
        code = ErrorCode.INVALID_REQUEST;
        defaultMessage = 'Bad Request';
        break;
      case 401:
        code = ErrorCode.AUTHENTICATION_REQUIRED;
        defaultMessage = 'Unauthorized';
        break;
      case 403:
        code = ErrorCode.AUTHORIZATION_FAILED;
        defaultMessage = 'Forbidden';
        break;
      case 404:
        code = ErrorCode.SERVICE_NOT_FOUND;
        defaultMessage = 'Not Found';
        break;
      case 408:
        code = ErrorCode.TIMEOUT;
        defaultMessage = 'Request Timeout';
        break;
      case 429:
        code = ErrorCode.RATE_LIMITED;
        defaultMessage = 'Too Many Requests';
        break;
      case 500:
        code = ErrorCode.INTERNAL_ERROR;
        defaultMessage = 'Internal Server Error';
        break;
      case 502:
        code = ErrorCode.SERVICE_UNAVAILABLE;
        defaultMessage = 'Bad Gateway';
        break;
      case 503:
        code = ErrorCode.SERVICE_UNAVAILABLE;
        defaultMessage = 'Service Unavailable';
        break;
      case 504:
        code = ErrorCode.TIMEOUT;
        defaultMessage = 'Gateway Timeout';
        break;
      default:
        code = ErrorCode.RESPONSE_ERROR;
        defaultMessage = `HTTP Error ${status}`;
        break;
    }
    
    return this.createError(code, message || defaultMessage, {
      protocol: ProtocolType.HTTP,
      ...options
    });
  }
  
  /**
   * 解析目标地址
   */
  static parseTarget(target: string): {
    protocol?: string;
    host: string;
    port?: number;
    path?: string;
  } {
    try {
      const url = new URL(target);
      return {
        protocol: url.protocol.replace(':', ''),
        host: url.hostname,
        port: url.port ? parseInt(url.port) : undefined,
        path: url.pathname
      };
    } catch {
      // 如果不是完整的URL，尝试解析为host:port格式
      const [host, portStr] = target.split(':');
      return {
        host: host || 'localhost',
        port: portStr ? parseInt(portStr) : undefined
      };
    }
  }
  
  /**
   * 格式化目标地址
   */
  static formatTarget(protocol: ProtocolType, host: string, port: number, path?: string): string {
    const protocolPrefix = this.getProtocolPrefix(protocol);
    const basePath = path && !path.startsWith('/') ? `/${path}` : (path || '');
    return `${protocolPrefix}://${host}:${port}${basePath}`;
  }
  
  /**
   * 获取协议前缀
   */
  static getProtocolPrefix(protocol: ProtocolType): string {
    switch (protocol) {
      case ProtocolType.HTTP:
        return 'http';
      case ProtocolType.WEBSOCKET:
        return 'ws';
      case ProtocolType.GRPC:
        return 'grpc';
      case ProtocolType.MESSAGE_QUEUE:
        return 'mq';
      default:
        return protocol;
    }
  }
  
  /**
   * 获取协议的默认端口
   */
  static getDefaultPort(protocol: ProtocolType): number {
    switch (protocol) {
      case ProtocolType.HTTP:
        return 80;
      case ProtocolType.WEBSOCKET:
        return 8080;
      case ProtocolType.GRPC:
        return 50051;
      case ProtocolType.TCP:
        return 9000;
      case ProtocolType.UDP:
        return 9001;
      default:
        return 8000;
    }
  }
  
  /**
   * 合并调用选项
   */
  static mergeCallOptions(
    defaults: CallOptions,
    options?: CallOptions
  ): CallOptions {
    if (!options) {
      return defaults;
    }
    
    return {
      timeout: options.timeout ?? defaults.timeout,
      retries: options.retries ?? defaults.retries,
      headers: {
        ...defaults.headers,
        ...options.headers
      },
      metadata: {
        ...defaults.metadata,
        ...options.metadata
      }
    };
  }
  
  /**
   * 合并流选项
   */
  static mergeStreamOptions(
    defaults: StreamOptions,
    options?: StreamOptions
  ): StreamOptions {
    if (!options) {
      return defaults;
    }
    
    return {
      ...this.mergeCallOptions(defaults, options),
      bufferSize: options.bufferSize ?? defaults.bufferSize,
      backpressure: options.backpressure ?? defaults.backpressure
    };
  }
  
  /**
   * 生成唯一ID
   */
  static generateId(prefix?: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return prefix ? `${prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  }
  
  /**
   * 生成客户端ID
   */
  static generateClientId(protocol: ProtocolType): string {
    return this.generateId(`${protocol}-client`);
  }
  
  /**
   * 验证服务名称
   */
  static validateServiceName(serviceName: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(serviceName);
  }
  
  /**
   * 验证方法名称
   */
  static validateMethodName(methodName: string): boolean {
    return /^[a-zA-Z][a-zA-Z0-9_]*$/.test(methodName);
  }
  
  /**
   * 序列化元数据
   */
  static serializeMetadata(metadata: Record<string, any>): Record<string, string> {
    const serialized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      if (typeof value === 'string') {
        serialized[key] = value;
      } else {
        try {
          serialized[key] = JSON.stringify(value);
        } catch {
          serialized[key] = String(value);
        }
      }
    }
    
    return serialized;
  }
  
  /**
   * 反序列化元数据
   */
  static deserializeMetadata(metadata: Record<string, string>): Record<string, any> {
    const deserialized: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(metadata)) {
      try {
        deserialized[key] = JSON.parse(value);
      } catch {
        deserialized[key] = value;
      }
    }
    
    return deserialized;
  }
  
  /**
   * 计算重试延迟
   */
  static calculateRetryDelay(
    attempt: number,
    baseDelay: number = 1000,
    maxDelay: number = 30000,
    backoffMultiplier: number = 2,
    jitter: boolean = true
  ): number {
    let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);
    delay = Math.min(delay, maxDelay);
    
    if (jitter) {
      delay = delay * (0.5 + Math.random() * 0.5); // 50%-100%的随机延迟
    }
    
    return Math.floor(delay);
  }
  
  /**
   * 检查是否应该重试
   */
  static shouldRetry(
    attempt: number,
    maxAttempts: number,
    error: any,
    retryCondition?: (error: any) => boolean
  ): boolean {
    if (attempt >= maxAttempts) {
      return false;
    }
    
    if (retryCondition) {
      return retryCondition(error);
    }
    
    return this.isRetryableError(error);
  }
}

/**
 * 协议中间件接口
 */
export interface ProtocolMiddleware {
  (context: any, next: () => Promise<any>): Promise<any>;
}

/**
 * 中间件执行器
 */
export class MiddlewareExecutor {
  private middleware: ProtocolMiddleware[] = [];
  
  use(middleware: ProtocolMiddleware): void {
    this.middleware.push(middleware);
  }
  
  async execute(context: any, handler: () => Promise<any>): Promise<any> {
    let index = 0;
    
    const next = async (): Promise<any> => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++]!;
        return await middleware(context, next);
      } else {
        return await handler();
      }
    };
    
    return await next();
  }
  
  clear(): void {
    this.middleware = [];
  }
  
  getMiddlewareCount(): number {
    return this.middleware.length;
  }
}