// 系统级错误码 (1xx-xxx)
export const SYSTEM_ERROR_CODES = {
  // 通用系统错误 (100-xxx)
  INTERNAL_ERROR: '100001',
  SERVICE_UNAVAILABLE: '100002',
  SERVICE_TIMEOUT: '100003',
  RESOURCE_EXHAUSTED: '100004',
  CONFIGURATION_ERROR: '100005',
  
  // 网络错误 (101-xxx)
  NETWORK_CONNECTION_FAILED: '101001',
  NETWORK_TIMEOUT: '101002',
  NETWORK_INTERRUPTED: '101003',
  DNS_RESOLUTION_FAILED: '101004',
  
  // 数据错误 (102-xxx)
  SERIALIZATION_FAILED: '102001',
  DESERIALIZATION_FAILED: '102002',
  DATA_FORMAT_ERROR: '102003',
  DATA_SIZE_EXCEEDED: '102004'
} as const;

// 业务级错误码 (2xx-xxx)
export const BUSINESS_ERROR_CODES = {
  // 通用业务错误 (200-xxx)
  BUSINESS_RULE_VIOLATION: '200001',
  BUSINESS_PROCESS_ERROR: '200002',
  BUSINESS_STATE_INVALID: '200003',
  BUSINESS_DATA_INCONSISTENT: '200004',
  
  // 用户相关错误 (201-xxx)
  USER_NOT_FOUND: '201001',
  USER_ALREADY_EXISTS: '201002',
  USER_STATE_INVALID: '201003',
  USER_PERMISSION_DENIED: '201004',
  
  // 订单相关错误 (202-xxx)
  ORDER_NOT_FOUND: '202001',
  ORDER_STATE_INVALID: '202002',
  ORDER_AMOUNT_INVALID: '202003',
  INSUFFICIENT_INVENTORY: '202004'
} as const;

// 集成级错误码 (3xx-xxx)
export const INTEGRATION_ERROR_CODES = {
  // 外部服务错误 (300-xxx)
  EXTERNAL_SERVICE_UNAVAILABLE: '300001',
  EXTERNAL_SERVICE_RESPONSE_INVALID: '300002',
  API_VERSION_INCOMPATIBLE: '300003',
  DATA_MAPPING_FAILED: '300004',
  
  // 数据库错误 (301-xxx)
  DATABASE_CONNECTION_FAILED: '301001',
  QUERY_TIMEOUT: '301002',
  TRANSACTION_ROLLBACK: '301003',
  CONSTRAINT_VIOLATION: '301004'
} as const;

// 安全级错误码 (4xx-xxx)
export const SECURITY_ERROR_CODES = {
  // 认证错误 (400-xxx)
  AUTHENTICATION_FAILED: '400001',
  AUTHORIZATION_FAILED: '400002',
  TOKEN_EXPIRED: '400003',
  SIGNATURE_VERIFICATION_FAILED: '400004',
  IP_RESTRICTED: '400005',
  RATE_LIMITED: '400006',
  
  // 数据安全错误 (401-xxx)
  SENSITIVE_DATA_ACCESS_DENIED: '401001',
  DATA_ENCRYPTION_FAILED: '401002',
  DATA_DECRYPTION_FAILED: '401003'
} as const;

// 错误响应接口
export interface ErrorDetail {
  field: string;
  error_code: string;
  error_message: string;
}

export interface ErrorResponse {
  code: string;
  message: string;
  details?: ErrorDetail[];
  timestamp?: string;
  trace_id?: string;
}

// 创建标准错误响应
export function createErrorResponse(error: Omit<ErrorResponse, 'timestamp'>): ErrorResponse {
  return {
    ...error,
    timestamp: new Date().toISOString()
  };
}

// 类型定义
export type SystemErrorCode = typeof SYSTEM_ERROR_CODES[keyof typeof SYSTEM_ERROR_CODES];
export type BusinessErrorCode = typeof BUSINESS_ERROR_CODES[keyof typeof BUSINESS_ERROR_CODES];
export type IntegrationErrorCode = typeof INTEGRATION_ERROR_CODES[keyof typeof INTEGRATION_ERROR_CODES];
export type SecurityErrorCode = typeof SECURITY_ERROR_CODES[keyof typeof SECURITY_ERROR_CODES];

export type ErrorCode = SystemErrorCode | BusinessErrorCode | IntegrationErrorCode | SecurityErrorCode;