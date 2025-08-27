import { ErrorCategory } from '../types/index.js';

// 系统级错误码 (100xxx)
export const SYSTEM_ERROR_CODES = {
  GENERIC_ERROR: '100001',
  SERVICE_UNAVAILABLE: '100002',
  DATABASE_CONNECTION_FAILED: '100003',
  TIMEOUT: '100004',
  MEMORY_OVERFLOW: '100005',
  RESOURCE_EXHAUSTED: '100006',
  CONFIGURATION_ERROR: '100007',
  DEPENDENCY_FAILURE: '100008',
  NETWORK_ERROR: '100009',
  FILE_SYSTEM_ERROR: '100010'
} as const;

// 业务级错误码 (200xxx)
export const BUSINESS_ERROR_CODES = {
  VALIDATION_FAILED: '200001',
  USER_NOT_FOUND: '201001',
  USER_ALREADY_EXISTS: '201002',
  USER_INACTIVE: '201003',
  INVALID_CREDENTIALS: '201004',
  PERMISSION_DENIED: '201005',
  RESOURCE_NOT_FOUND: '202001',
  RESOURCE_CONFLICT: '202002',
  RESOURCE_LOCKED: '202003',
  INVALID_INPUT: '203001',
  INVALID_FORMAT: '203002',
  INVALID_RANGE: '203003',
  BUSINESS_RULE_VIOLATION: '204001',
  WORKFLOW_ERROR: '204002',
  STATE_TRANSITION_ERROR: '204003'
} as const;

// 集成级错误码 (300xxx)
export const INTEGRATION_ERROR_CODES = {
  EXTERNAL_SERVICE_UNAVAILABLE: '300001',
  EXTERNAL_SERVICE_TIMEOUT: '300002',
  API_RATE_LIMIT_EXCEEDED: '300003',
  PROTOCOL_ERROR: '300004',
  SERIALIZATION_ERROR: '300005',
  DESERIALIZATION_ERROR: '300006',
  VERSION_MISMATCH: '300007',
  AUTHENTICATION_FAILED: '300008',
  AUTHORIZATION_FAILED: '300009',
  CONTRACT_VIOLATION: '300010'
} as const;

// 安全级错误码 (400xxx)
export const SECURITY_ERROR_CODES = {
  AUTHENTICATION_REQUIRED: '400001',
  AUTHENTICATION_FAILED: '400002',
  AUTHORIZATION_FAILED: '400003',
  ACCESS_DENIED: '400004',
  TOKEN_EXPIRED: '400005',
  TOKEN_INVALID: '400006',
  SECURITY_VIOLATION: '400007',
  SUSPICIOUS_ACTIVITY: '400008',
  RATE_LIMIT_EXCEEDED: '400009',
  ENCRYPTION_FAILED: '400010',
  DECRYPTION_FAILED: '400011',
  SIGNATURE_INVALID: '400012'
} as const;

// 所有错误码集合
export const ERROR_CODES = {
  ...SYSTEM_ERROR_CODES,
  ...BUSINESS_ERROR_CODES,
  ...INTEGRATION_ERROR_CODES,
  ...SECURITY_ERROR_CODES
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// 错误分类映射
const ERROR_CATEGORY_MAP: Record<string, ErrorCategory> = {};

// 系统错误
Object.values(SYSTEM_ERROR_CODES).forEach(code => {
  ERROR_CATEGORY_MAP[code] = 'system';
});

// 业务错误
Object.values(BUSINESS_ERROR_CODES).forEach(code => {
  ERROR_CATEGORY_MAP[code] = 'business';
});

// 集成错误
Object.values(INTEGRATION_ERROR_CODES).forEach(code => {
  ERROR_CATEGORY_MAP[code] = 'integration';
});

// 安全错误
Object.values(SECURITY_ERROR_CODES).forEach(code => {
  ERROR_CATEGORY_MAP[code] = 'security';
});

export function getErrorCategory(code: string): ErrorCategory {
  return ERROR_CATEGORY_MAP[code] || 'system';
}

export function isSystemError(code: string): boolean {
  return getErrorCategory(code) === 'system';
}

export function isBusinessError(code: string): boolean {
  return getErrorCategory(code) === 'business';
}

export function isIntegrationError(code: string): boolean {
  return getErrorCategory(code) === 'integration';
}

export function isSecurityError(code: string): boolean {
  return getErrorCategory(code) === 'security';
}

// HTTP状态码映射
export const HTTP_STATUS_MAPPING: Record<ErrorCategory, number> = {
  system: 500,
  business: 400,
  integration: 502,
  security: 401
};

export function getHttpStatusForCategory(category: ErrorCategory): number {
  return HTTP_STATUS_MAPPING[category] || 500;
}

export function getHttpStatusForErrorCode(code: string): number {
  const category = getErrorCategory(code);
  return getHttpStatusForCategory(category);
}