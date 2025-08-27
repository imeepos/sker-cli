import { 
  PROTOCOL_TYPES, 
  ProtocolType, 
  HTTP_METHODS, 
  HttpMethod 
} from './protocol.js';
import { 
  SYSTEM_ERROR_CODES, 
  BUSINESS_ERROR_CODES, 
  INTEGRATION_ERROR_CODES, 
  SECURITY_ERROR_CODES, 
  ErrorCode 
} from './errors.js';
import { SERVICE_STATUS, ServiceStatusType } from './service.js';
import { LOG_LEVELS, LogLevel } from './monitoring.js';

// 协议验证
export function isValidProtocol(protocol: string): protocol is ProtocolType {
  return Object.values(PROTOCOL_TYPES).includes(protocol as ProtocolType);
}

// HTTP方法验证
export function isValidHttpMethod(method: string): method is HttpMethod {
  return Object.values(HTTP_METHODS).includes(method as HttpMethod);
}

// 错误码验证
export function isValidErrorCode(code: string): code is ErrorCode {
  return (
    Object.values(SYSTEM_ERROR_CODES).includes(code as any) ||
    Object.values(BUSINESS_ERROR_CODES).includes(code as any) ||
    Object.values(INTEGRATION_ERROR_CODES).includes(code as any) ||
    Object.values(SECURITY_ERROR_CODES).includes(code as any)
  );
}

// 获取错误码类别
export function getErrorCategory(code: string): string {
  if (code.startsWith('1')) return 'system';
  if (code.startsWith('2')) return 'business';
  if (code.startsWith('3')) return 'integration';
  if (code.startsWith('4')) return 'security';
  return 'unknown';
}

// 格式化错误码
export function formatErrorCode(options: {
  category: 'system' | 'business' | 'integration' | 'security';
  subcategory: string;
  error: string;
}): string {
  const categoryPrefix = {
    system: '1',
    business: '2',
    integration: '3',
    security: '4'
  }[options.category];

  const subcategoryMap: Record<string, string> = {
    // System subcategories
    general: '00',
    network: '01',
    data: '02',
    
    // Business subcategories  
    common: '00',
    user: '01',
    order: '02',
    
    // Integration subcategories
    external: '00',
    database: '01',
    
    // Security subcategories
    auth: '00',
    data_security: '01'
  };

  const subcategoryCode = subcategoryMap[options.subcategory] || '99';
  return `${categoryPrefix}${subcategoryCode}${options.error.padStart(3, '0')}`;
}

// 协议转换
export function protocolToString(protocol: ProtocolType): string {
  return protocol;
}

export function stringToProtocol(protocol: string): ProtocolType | null {
  return isValidProtocol(protocol) ? protocol : null;
}

// 服务状态转换
export function statusToNumber(status: ServiceStatusType): number {
  return status;
}

export function numberToStatus(num: number): ServiceStatusType | null {
  return Object.values(SERVICE_STATUS).includes(num as ServiceStatusType) 
    ? num as ServiceStatusType 
    : null;
}

// 日志级别转换
export function logLevelToNumber(level: string): LogLevel | null {
  const levelUpper = level.toUpperCase();
  return (LOG_LEVELS as any)[levelUpper] ?? null;
}

export function numberToLogLevel(num: number): string | null {
  const entry = Object.entries(LOG_LEVELS).find(([_, value]) => value === num);
  return entry ? entry[0] : null;
}

// URL构建器
export function buildUrl(options: {
  protocol: ProtocolType;
  host: string;
  port?: number;
  path?: string;
  query?: Record<string, string>;
}): string {
  let url = `${options.protocol}://${options.host}`;
  
  if (options.port) {
    url += `:${options.port}`;
  }
  
  if (options.path) {
    if (!options.path.startsWith('/')) {
      url += '/';
    }
    url += options.path;
  }
  
  if (options.query && Object.keys(options.query).length > 0) {
    const queryString = new URLSearchParams(options.query).toString();
    url += `?${queryString}`;
  }
  
  return url;
}

// 深度合并对象
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        typeof sourceValue === 'object' &&
        sourceValue !== null &&
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' &&
        targetValue !== null &&
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as T[Extract<keyof T, string>];
      }
    }
  }
  
  return result;
}

// 延迟函数
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 重试函数
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt);
    }
  }
  
  throw lastError!;
}

// 生成UUID v4
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// 生成追踪ID
export function generateTraceId(): string {
  return generateUUID().replace(/-/g, '');
}

// 时间戳工具
export function getCurrentTimestamp(): number {
  return Date.now();
}

export function formatTimestamp(timestamp: number, format: 'iso' | 'unix' = 'iso'): string | number {
  if (format === 'unix') {
    return Math.floor(timestamp / 1000);
  }
  return new Date(timestamp).toISOString();
}