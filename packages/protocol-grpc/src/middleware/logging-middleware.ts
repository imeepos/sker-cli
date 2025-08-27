/**
 * gRPC日志记录中间件
 */

import { ServerMiddleware, ClientMiddleware, MiddlewareContext } from '../types/grpc-types.js';

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  service: string;
  method: string;
  peer?: string;
  duration?: number;
  status: 'success' | 'error';
  error?: string;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface LoggingOptions {
  level: 'debug' | 'info' | 'warn' | 'error';
  includeMetadata: boolean;
  includeRequest: boolean;
  includeResponse: boolean;
  maskSensitiveFields: string[];
  customLogger?: (entry: LogEntry) => void;
  requestIdHeader?: string;
  maxRequestSize?: number;
  maxResponseSize?: number;
}

/**
 * 服务端日志中间件
 */
export function createServerLoggingMiddleware(options: Partial<LoggingOptions> = {}): ServerMiddleware {
  const {
    level = 'info',
    includeMetadata = false,
    includeRequest = false,
    includeResponse = false,
    maskSensitiveFields = ['password', 'token', 'secret'],
    customLogger,
    requestIdHeader = 'x-request-id',
    maxRequestSize = 1024,
    maxResponseSize = 1024
  } = options;

  return async (context: MiddlewareContext, next) => {
    const startTime = Date.now();
    const { service, method, peer } = context;
    const metadata = context.getMetadata();
    
    // 生成或获取请求ID
    const requestId = metadata.get(requestIdHeader)?.[0] || generateRequestId();
    
    // 获取用户ID
    const userId = metadata.get('user-id')?.[0];

    // 记录请求开始
    const startEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service,
      method,
      peer,
      status: 'success',
      requestId,
      userId,
      metadata: includeMetadata ? Object.fromEntries(metadata) : undefined
    };

    logEntry(startEntry, `[${requestId}] gRPC call started: ${service}.${method}`, customLogger);

    try {
      const result = await next();
      const duration = Date.now() - startTime;

      // 记录成功响应
      const successEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        service,
        method,
        peer,
        duration,
        status: 'success',
        requestId,
        userId,
        metadata: includeResponse ? maskSensitiveData(result, maskSensitiveFields, maxResponseSize) : undefined
      };

      logEntry(successEntry, `[${requestId}] gRPC call completed: ${service}.${method} in ${duration}ms`, customLogger);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 记录错误响应
      const errorEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'error',
        service,
        method,
        peer,
        duration,
        status: 'error',
        error: errorMessage,
        requestId,
        userId
      };

      logEntry(errorEntry, `[${requestId}] gRPC call failed: ${service}.${method} after ${duration}ms - ${errorMessage}`, customLogger);

      throw error;
    }
  };
}

/**
 * 客户端日志中间件
 */
export function createClientLoggingMiddleware(options: Partial<LoggingOptions> = {}): ClientMiddleware {
  const {
    level = 'info',
    includeMetadata = false,
    includeRequest = false,
    includeResponse = false,
    maskSensitiveFields = ['password', 'token', 'secret'],
    customLogger,
    requestIdHeader = 'x-request-id',
    maxRequestSize = 1024,
    maxResponseSize = 1024
  } = options;

  return () => {
    return async (context: MiddlewareContext, next) => {
      const startTime = Date.now();
      const { service, method, peer } = context;
      const metadata = context.getMetadata();
      
      // 生成请求ID
      const requestId = generateRequestId();
      metadata.set(requestIdHeader, [requestId]);

      // 记录请求开始
      const startEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: 'info',
        service,
        method,
        peer,
        status: 'success',
        requestId,
        metadata: includeMetadata ? Object.fromEntries(metadata) : undefined
      };

      logEntry(startEntry, `[${requestId}] gRPC request started: ${service}.${method} to ${peer}`, customLogger);

      try {
        const result = await next();
        const duration = Date.now() - startTime;

        // 记录成功响应
        const successEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'info',
          service,
          method,
          peer,
          duration,
          status: 'success',
          requestId,
          metadata: includeResponse ? maskSensitiveData(result, maskSensitiveFields, maxResponseSize) : undefined
        };

        logEntry(successEntry, `[${requestId}] gRPC request completed: ${service}.${method} in ${duration}ms`, customLogger);

        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);

        // 记录错误响应
        const errorEntry: LogEntry = {
          timestamp: new Date().toISOString(),
          level: 'error',
          service,
          method,
          peer,
          duration,
          status: 'error',
          error: errorMessage,
          requestId
        };

        logEntry(errorEntry, `[${requestId}] gRPC request failed: ${service}.${method} after ${duration}ms - ${errorMessage}`, customLogger);

        throw error;
      }
    };
  };
}

/**
 * 结构化日志中间件
 */
export function createStructuredLoggingMiddleware(
  logger: any, // 外部日志库实例（如winston, pino等）
  options: Partial<LoggingOptions> = {}
): ServerMiddleware {
  return async (context: MiddlewareContext, next) => {
    const startTime = process.hrtime.bigint();
    const { service, method, peer } = context;
    const metadata = context.getMetadata();
    const requestId = metadata.get('x-request-id')?.[0] || generateRequestId();

    const baseLogContext = {
      requestId,
      service,
      method,
      peer,
      timestamp: new Date().toISOString()
    };

    // 记录请求开始
    logger.info('gRPC request started', baseLogContext);

    try {
      const result = await next();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // 转换为毫秒

      // 记录成功完成
      logger.info('gRPC request completed', {
        ...baseLogContext,
        duration: Math.round(duration * 100) / 100, // 保留两位小数
        status: 'success'
      });

      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
      const errorMessage = error instanceof Error ? error.message : String(error);

      // 记录错误
      logger.error('gRPC request failed', {
        ...baseLogContext,
        duration: Math.round(duration * 100) / 100,
        status: 'error',
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined
      });

      throw error;
    }
  };
}

/**
 * 访问日志中间件（Apache风格）
 */
export function createAccessLogMiddleware(options: { format?: 'common' | 'combined' | 'json' } = {}): ServerMiddleware {
  const { format = 'common' } = options;

  return async (context: MiddlewareContext, next) => {
    const startTime = Date.now();
    const { service, method, peer } = context;
    const metadata = context.getMetadata();
    
    const userAgent = metadata.get('user-agent')?.[0] || '-';
    const remoteUser = metadata.get('remote-user')?.[0] || '-';

    try {
      const result = await next();
      const duration = Date.now() - startTime;

      // 格式化访问日志
      const logLine = formatAccessLog(format, {
        remoteAddr: peer,
        remoteUser,
        timestamp: new Date(),
        method: `${service}/${method}`,
        status: 200, // gRPC成功
        responseSize: JSON.stringify(result).length,
        duration,
        userAgent
      });

      console.log(logLine);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      const logLine = formatAccessLog(format, {
        remoteAddr: peer,
        remoteUser,
        timestamp: new Date(),
        method: `${service}/${method}`,
        status: 500, // gRPC错误
        responseSize: 0,
        duration,
        userAgent,
        error: error instanceof Error ? error.message : String(error)
      });

      console.log(logLine);

      throw error;
    }
  };
}

/**
 * 生成请求ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 记录日志条目
 */
function logEntry(entry: LogEntry, message: string, customLogger?: (entry: LogEntry) => void): void {
  if (customLogger) {
    customLogger(entry);
  } else {
    // 默认控制台输出
    const timestamp = entry.timestamp;
    const level = entry.level.toUpperCase();
    console.log(`[${timestamp}] ${level}: ${message}`);
    
    if (entry.level === 'error' && entry.error) {
      console.error('Error details:', entry.error);
    }
  }
}

/**
 * 遮蔽敏感数据
 */
function maskSensitiveData(data: any, sensitiveFields: string[], maxSize: number): any {
  if (!data || typeof data !== 'object') {
    const str = String(data);
    return str.length > maxSize ? str.substring(0, maxSize) + '...' : str;
  }

  const masked = { ...data };
  
  sensitiveFields.forEach(field => {
    if (field in masked) {
      masked[field] = '***MASKED***';
    }
  });

  const jsonStr = JSON.stringify(masked);
  if (jsonStr.length > maxSize) {
    return JSON.parse(jsonStr.substring(0, maxSize) + '}');
  }

  return masked;
}

/**
 * 格式化访问日志
 */
function formatAccessLog(format: string, data: {
  remoteAddr: string;
  remoteUser: string;
  timestamp: Date;
  method: string;
  status: number;
  responseSize: number;
  duration: number;
  userAgent: string;
  error?: string;
}): string {
  const { remoteAddr, remoteUser, timestamp, method, status, responseSize, duration, userAgent, error } = data;

  switch (format) {
    case 'json':
      return JSON.stringify({
        remoteAddr,
        remoteUser,
        timestamp: timestamp.toISOString(),
        method,
        status,
        responseSize,
        duration,
        userAgent,
        error
      });

    case 'combined':
      const timestampStr = timestamp.toISOString();
      return `${remoteAddr} - ${remoteUser} [${timestampStr}] "${method}" ${status} ${responseSize} "-" "${userAgent}" ${duration}ms ${error ? `"${error}"` : ''}`.trim();

    case 'common':
    default:
      const timestampCommon = timestamp.toISOString();
      return `${remoteAddr} - ${remoteUser} [${timestampCommon}] "${method}" ${status} ${responseSize} ${duration}ms`.trim();
  }
}