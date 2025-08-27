/**
 * @sker/types - Sker通用类型定义包
 * Universal type definitions package for Sker communication framework
 * 
 * 提供跨语言类型映射和统一数据类型定义
 * Provides cross-language type mappings and unified data type definitions
 */

// ==================== 基础类型 Basic Types ====================
export type {
  SkerBoolean,
  SkerInteger,
  SkerFloat,
  SkerString,
  SkerTimestamp,
  SkerDecimal,
  Brand,
  UUID,
  MoneyAmount,
  URL,
  Email
} from './basic-types.js';

export { BasicTypes } from './basic-types.js';

// ==================== 集合类型 Collection Types ====================
export type {
  SkerArray,
  SkerMap,
  SkerSet,
  SkerOptional,
  SkerTuple,
  SkerRecord
} from './collection-types.js';

export { CollectionTypes } from './collection-types.js';

// ==================== 消息类型 Message Types ====================
export {
  ContentType,
  MessageType,
  MessagePriority
} from './message-types.js';

export type {
  ServiceInfo,
  MessageHeader,
  MessageMetadata,
  MessageEnvelope,
  MessagePayload,
  UDEFMessage,
  TypedUDEFMessage,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  CommandMessage,
  NotificationMessage,
  HeartbeatMessage,
  MessageBatch,
  MessageAck,
  MessageStats,
  MessageFilter,
  MessageRoutingRule,
  MessageTransformation
} from './message-types.js';

// ==================== 错误处理类型 Error Handling Types ====================
export {
  ErrorLevel,
  ErrorSeverity,
  HttpStatusCode,
  ErrorCodes
} from './error-types.js';

export type {
  ErrorDetail,
  ErrorStackTrace,
  ErrorResponse,
  SuccessResponse,
  ServiceResult,
  ValidationResult,
  BaseException,
  BusinessException,
  SystemException,
  SecurityException,
  ErrorAggregation
} from './error-types.js';

// ==================== 服务相关类型 Service Types ====================
export {
  Protocol,
  HealthStatus,
  LoadBalanceStrategy,
  ServiceState
} from './service-types.js';

export type {
  NetworkInfo,
  HealthCheckConfig,
  ServiceMetrics,
  ServiceInfo as ServiceInfoType,
  ServiceEndpoint,
  ServiceRegistry,
  ServiceDiscoveryQuery,
  ServiceDiscoveryResult,
  ServiceDependency,
  ServiceDeployment
} from './service-types.js';

// ==================== 认证授权类型 Auth Types ====================
export {
  AuthMethod,
  OAuth2GrantType,
  TokenType,
  UserStatus,
  PermissionAction,
  PermissionEffect
} from './auth-types.js';

export type {
  AuthenticationInfo,
  AuthorizationToken,
  JWTToken,
  APIKey,
  OAuth2Token,
  Permission,
  Role,
  UserPrincipal,
  AuthenticationContext,
  AuthorizationPolicy,
  AuthorizationRequest,
  AuthorizationResult
} from './auth-types.js';

// ==================== 验证工具 Validation Utilities ====================
export type {
  Validator,
  FieldValidationRule,
  SchemaValidationRule
} from './validation.js';

export {
  BasicValidators,
  CollectionValidators,
  MessageValidators,
  SchemaValidator,
  Validators,
  ValidationUtils
} from './validation.js';

// ==================== 转换工具 Conversion Utilities ====================
export {
  SerializationFormat
} from './conversion.js';

export type {
  SerializationOptions,
  DeserializationOptions,
  ConversionResult
} from './conversion.js';

export {
  ProtobufConverter,
  JSONConverter,
  MessageSerializer,
  ConversionUtils
} from './conversion.js';

// ==================== 工厂函数 Factory Functions ====================
export type {
  CreateMessageOptions,
  CreateErrorResponseOptions,
  CreateServiceInfoOptions,
  CreateJWTTokenOptions
} from './factories.js';

export {
  MessageFactory,
  ErrorFactory,
  ServiceFactory,
  AuthFactory,
  Factories
} from './factories.js';

// ==================== 版本信息 Version Information ====================

/**
 * 包版本信息
 * Package version information
 */
export const VERSION = '1.0.0';

/**
 * API版本信息
 * API version information
 */
export const API_VERSION = '1.0.0';

/**
 * 支持的协议版本
 * Supported protocol versions
 */
export const SUPPORTED_PROTOCOL_VERSIONS = ['1.0.0'];

/**
 * 默认配置
 * Default configuration
 */
export const DEFAULT_CONFIG = {
  message: {
    default_content_type: 'application/json' as const,
    default_message_priority: 5 as const,
    default_ttl_seconds: 3600,
    default_schema_version: '1.0.0'
  },
  service: {
    default_protocol: 'http' as const,
    default_health_check_interval_seconds: 30,
    default_health_check_timeout_seconds: 10,
    default_load_balance_weight: 100
  },
  auth: {
    default_token_expires_in_seconds: 3600,
    default_jwt_algorithm: 'HS256'
  },
  validation: {
    strict_mode: false,
    validate_schema: true
  },
  serialization: {
    default_format: 'json' as const,
    pretty_print: false,
    include_metadata: true
  }
} as const;

// ==================== 类型保护函数 Type Guard Functions ====================

/**
 * 检查值是否为成功响应
 * Check if value is success response
 */
export function isSuccessResponse(response: any): boolean {
  return response && response.success === true;
}

/**
 * 检查值是否为错误响应
 * Check if value is error response
 */
export function isErrorResponse(response: any): boolean {
  return response && response.success === false;
}

/**
 * 检查值是否为请求消息
 * Check if value is request message
 */
export function isRequestMessage(message: any): boolean {
  return message && message.envelope?.header?.message_type === 'request';
}

/**
 * 检查值是否为响应消息
 * Check if value is response message
 */
export function isResponseMessage(message: any): boolean {
  return message && message.envelope?.header?.message_type === 'response';
}

/**
 * 检查值是否为事件消息
 * Check if value is event message
 */
export function isEventMessage(message: any): boolean {
  return message && message.envelope?.header?.message_type === 'event';
}

/**
 * 检查服务是否健康
 * Check if service is healthy
 */
export function isServiceHealthy(service: any): boolean {
  return service && service.health_status === 1; // HealthStatus.HEALTHY
}

/**
 * 检查用户是否活跃
 * Check if user is active
 */
export function isUserActive(user: any): boolean {
  return user && user.status === 'active'; // UserStatus.ACTIVE
}