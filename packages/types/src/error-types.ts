/**
 * 标准错误处理类型定义
 * Standard error handling type definitions
 */

import type { SkerString, SkerTimestamp, UUID } from './basic-types.js';
import type { SkerArray, SkerRecord } from './collection-types.js';

/**
 * 错误级别枚举
 * Error level enumeration
 */
export enum ErrorLevel {
  /** 系统级错误 - 如网络错误、服务不可用等 */
  SYSTEM = 'system',
  
  /** 业务逻辑错误 - 如验证失败、业务规则违反等 */
  BUSINESS = 'business',
  
  /** 集成错误 - 如第三方服务错误、数据格式不匹配等 */
  INTEGRATION = 'integration',
  
  /** 安全错误 - 如认证失败、权限不足等 */
  SECURITY = 'security',
  
  /** 配置错误 - 如配置缺失、配置格式错误等 */
  CONFIGURATION = 'configuration',
  
  /** 数据错误 - 如数据不一致、数据损坏等 */
  DATA = 'data'
}

/**
 * 错误严重性枚举
 * Error severity enumeration
 */
export enum ErrorSeverity {
  /** 低 - 不影响主要功能 */
  LOW = 1,
  
  /** 中等 - 影响部分功能 */
  MEDIUM = 2,
  
  /** 高 - 影响主要功能 */
  HIGH = 3,
  
  /** 严重 - 导致服务不可用 */
  CRITICAL = 4
}

/**
 * HTTP状态码枚举（常用）
 * HTTP status code enumeration (common ones)
 */
export enum HttpStatusCode {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,
  
  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  NOT_MODIFIED = 304,
  
  // 4xx Client Error
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  
  // 5xx Server Error
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504
}

/**
 * 标准错误码定义
 * Standard error code definitions
 */
export const ErrorCodes = {
  // 系统级错误 (1xxxx)
  SYSTEM: {
    NETWORK_ERROR: '10001',
    SERVICE_UNAVAILABLE: '10002',
    TIMEOUT: '10003',
    INTERNAL_ERROR: '10004',
    RESOURCE_EXHAUSTED: '10005',
    CIRCUIT_BREAKER_OPEN: '10006'
  },
  
  // 业务逻辑错误 (2xxxx)
  BUSINESS: {
    VALIDATION_FAILED: '20001',
    BUSINESS_RULE_VIOLATION: '20002',
    DUPLICATE_RESOURCE: '20003',
    RESOURCE_NOT_FOUND: '20004',
    INVALID_OPERATION: '20005',
    INSUFFICIENT_FUNDS: '20006',
    QUOTA_EXCEEDED: '20007'
  },
  
  // 集成错误 (3xxxx)
  INTEGRATION: {
    EXTERNAL_SERVICE_ERROR: '30001',
    DATA_FORMAT_MISMATCH: '30002',
    API_VERSION_INCOMPATIBLE: '30003',
    SERIALIZATION_ERROR: '30004',
    DESERIALIZATION_ERROR: '30005',
    PROTOCOL_ERROR: '30006'
  },
  
  // 安全错误 (4xxxx)
  SECURITY: {
    AUTHENTICATION_FAILED: '40001',
    AUTHORIZATION_FAILED: '40002',
    TOKEN_EXPIRED: '40003',
    TOKEN_INVALID: '40004',
    ACCESS_DENIED: '40005',
    RATE_LIMIT_EXCEEDED: '40006',
    SECURITY_VIOLATION: '40007'
  },
  
  // 配置错误 (5xxxx)
  CONFIGURATION: {
    MISSING_CONFIGURATION: '50001',
    INVALID_CONFIGURATION: '50002',
    ENVIRONMENT_MISMATCH: '50003',
    DEPENDENCY_MISSING: '50004'
  },
  
  // 数据错误 (6xxxx)
  DATA: {
    DATA_CORRUPTION: '60001',
    DATA_INCONSISTENCY: '60002',
    SCHEMA_MISMATCH: '60003',
    CONSTRAINT_VIOLATION: '60004',
    DUPLICATE_KEY: '60005',
    FOREIGN_KEY_VIOLATION: '60006'
  }
} as const;

/**
 * 错误详情接口
 * Error detail interface
 */
export interface ErrorDetail {
  /** 字段名（如果错误与特定字段相关） */
  field?: SkerString;
  
  /** 具体错误码 */
  error_code: SkerString;
  
  /** 错误描述 */
  error_message: SkerString;
  
  /** 错误值（引起错误的具体值） */
  error_value?: unknown;
  
  /** 期望值 */
  expected_value?: unknown;
  
  /** 错误上下文 */
  context?: SkerRecord<string, unknown>;
}

/**
 * 错误堆栈跟踪接口
 * Error stack trace interface
 */
export interface ErrorStackTrace {
  /** 函数名 */
  function_name: SkerString;
  
  /** 文件名 */
  file_name: SkerString;
  
  /** 行号 */
  line_number: number;
  
  /** 列号 */
  column_number?: number;
  
  /** 源码片段 */
  source_snippet?: SkerString;
}

/**
 * 错误响应接口
 * Error response interface
 */
export interface ErrorResponse {
  /** 成功标识，错误时固定为false */
  success: false;
  
  /** 错误信息 */
  error: {
    /** 错误码 */
    code: SkerString;
    
    /** 错误消息 */
    message: SkerString;
    
    /** 错误级别 */
    level: ErrorLevel;
    
    /** 错误严重性 */
    severity: ErrorSeverity;
    
    /** HTTP状态码 */
    http_status?: HttpStatusCode;
    
    /** 错误详情列表 */
    details?: SkerArray<ErrorDetail>;
    
    /** 错误发生时间 */
    timestamp: SkerTimestamp;
    
    /** 追踪ID */
    trace_id?: SkerString;
    
    /** 错误堆栈跟踪 */
    stack_trace?: SkerArray<ErrorStackTrace>;
    
    /** 帮助链接 */
    help_url?: SkerString;
    
    /** 错误原因（上游错误） */
    cause?: ErrorResponse;
    
    /** 建议的解决方案 */
    suggested_actions?: SkerArray<SkerString>;
    
    /** 是否可重试 */
    retryable: boolean;
    
    /** 重试延迟（毫秒） */
    retry_after_ms?: number;
  };
  
  /** 元数据 */
  metadata: {
    /** 请求ID */
    request_id?: UUID;
    
    /** API版本 */
    api_version: SkerString;
    
    /** 处理时间（毫秒） */
    processing_time_ms: number;
    
    /** 服务实例ID */
    instance_id?: SkerString;
    
    /** 错误发生的服务名称 */
    service_name?: SkerString;
    
    /** 错误发生的方法名称 */
    method_name?: SkerString;
    
    /** 用户代理 */
    user_agent?: SkerString;
    
    /** 客户端IP */
    client_ip?: SkerString;
    
    /** 错误统计信息 */
    error_stats?: {
      /** 此错误今日发生次数 */
      occurrence_count_today: number;
      
      /** 首次发生时间 */
      first_occurrence: SkerTimestamp;
      
      /** 最后发生时间 */
      last_occurrence: SkerTimestamp;
    };
  };
}

/**
 * 成功响应接口
 * Success response interface
 */
export interface SuccessResponse<TData = unknown> {
  /** 成功标识，成功时固定为true */
  success: true;
  
  /** 响应数据 */
  data: TData;
  
  /** 元数据 */
  metadata: {
    /** 请求ID */
    request_id?: UUID;
    
    /** API版本 */
    api_version: SkerString;
    
    /** 处理时间（毫秒） */
    processing_time_ms: number;
    
    /** 服务实例ID */
    instance_id?: SkerString;
    
    /** 响应时间戳 */
    timestamp: SkerTimestamp;
    
    /** 分页信息（如果适用） */
    pagination?: {
      page: number;
      page_size: number;
      total_count: number;
      total_pages: number;
      has_next: boolean;
      has_previous: boolean;
    };
    
    /** 数据版本（用于乐观锁） */
    version?: SkerString;
    
    /** 缓存信息 */
    cache_info?: {
      cached: boolean;
      cache_key?: SkerString;
      cache_ttl_seconds?: number;
      cache_timestamp?: SkerTimestamp;
    };
  };
}

/**
 * 服务结果联合类型
 * Service result union type
 */
export type ServiceResult<TData = unknown> = SuccessResponse<TData> | ErrorResponse;

/**
 * 验证结果接口
 * Validation result interface
 */
export interface ValidationResult {
  /** 是否验证通过 */
  valid: boolean;
  
  /** 错误列表 */
  errors: SkerArray<ErrorDetail>;
  
  /** 警告列表 */
  warnings?: SkerArray<ErrorDetail>;
}

/**
 * 异常基类接口
 * Base exception interface
 */
export interface BaseException {
  /** 异常名称 */
  name: SkerString;
  
  /** 异常消息 */
  message: SkerString;
  
  /** 错误码 */
  code: SkerString;
  
  /** 错误级别 */
  level: ErrorLevel;
  
  /** 错误严重性 */
  severity: ErrorSeverity;
  
  /** 发生时间 */
  timestamp: SkerTimestamp;
  
  /** 堆栈跟踪 */
  stack?: SkerString;
  
  /** 内部错误 */
  inner_error?: BaseException;
  
  /** 上下文数据 */
  context?: SkerRecord<string, unknown>;
}

/**
 * 业务异常接口
 * Business exception interface
 */
export interface BusinessException extends BaseException {
  level: ErrorLevel.BUSINESS;
  
  /** 业务规则ID */
  business_rule_id?: SkerString;
  
  /** 违反的约束条件 */
  violated_constraints?: SkerArray<SkerString>;
}

/**
 * 系统异常接口
 * System exception interface
 */
export interface SystemException extends BaseException {
  level: ErrorLevel.SYSTEM;
  
  /** 系统组件 */
  component?: SkerString;
  
  /** 系统资源 */
  resource?: SkerString;
  
  /** 系统指标 */
  metrics?: SkerRecord<string, number>;
}

/**
 * 安全异常接口
 * Security exception interface
 */
export interface SecurityException extends BaseException {
  level: ErrorLevel.SECURITY;
  
  /** 安全策略ID */
  security_policy_id?: SkerString;
  
  /** 尝试的操作 */
  attempted_operation?: SkerString;
  
  /** 用户标识 */
  user_identifier?: SkerString;
  
  /** IP地址 */
  ip_address?: SkerString;
}

/**
 * 错误聚合接口
 * Error aggregation interface
 */
export interface ErrorAggregation {
  /** 错误码 */
  error_code: SkerString;
  
  /** 错误消息 */
  error_message: SkerString;
  
  /** 发生次数 */
  occurrence_count: number;
  
  /** 首次发生时间 */
  first_occurrence: SkerTimestamp;
  
  /** 最后发生时间 */
  last_occurrence: SkerTimestamp;
  
  /** 影响的用户数 */
  affected_users?: number;
  
  /** 影响的请求数 */
  affected_requests?: number;
  
  /** 平均响应时间（毫秒） */
  average_response_time_ms?: number;
}