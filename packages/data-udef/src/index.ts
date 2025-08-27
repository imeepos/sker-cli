/**
 * UDEF (Unified Data Exchange Format) 主入口文件
 * UDEF main entry point
 */

// 核心消息类和工厂
export * from './core/message.js';
export * from './core/envelope.js';
export * from './core/payload.js';

// 序列化器
export * from './serializers/index.js';

// 验证和Schema注册
export * from './validation/index.js';

// 跨语言转换
export * from './transformation/index.js';

// 版本管理
export * from './versioning/index.js';

// 中间件和处理管道
export * from './middleware/index.js';

// 性能优化
export * from './performance/index.js';

// 实用工具
export * from './utils/index.js';

// 便捷导出 - 主要类
export {
  // 核心类
  UDEFMessage,
  MessageFactory
} from './core/message.js';

export {
  UDEFEnvelope,
  EnvelopeBuilder
} from './core/envelope.js';

export {
  UDEFPayload,
  PayloadBuilder
} from './core/payload.js';

export {
  // 序列化器
  JSONSerializer,
  CompactJSONSerializer,
  PrettyJSONSerializer,
  MessagePackSerializer,
  ProtobufSerializer,
  SerializerFactory
} from './serializers/index.js';

export {
  // 验证器
  SchemaRegistry,
  MessageValidator,
  UDEFMessageValidator,
  JSONSchemaValidator
} from './validation/index.js';

export {
  // 转换器
  TypeMapper,
  DataTransformer,
  CrossLanguageTypeMapper,
  CrossLanguageTransformer
} from './transformation/index.js';

export {
  // 版本管理
  VersionTransformer,
  VersionComparator
} from './versioning/index.js';

export {
  // 中间件
  MessageProcessor,
  BuiltinMiddleware,
  MiddlewareComposer
} from './middleware/index.js';

export {
  // 性能优化
  ObjectPool,
  UDEFMessagePool,
  SerializationCache,
  BatchProcessor
} from './performance/index.js';

export {
  // 工具类
  DeepClone,
  MessageComparator,
  PathUtils,
  Formatter,
  ValidationUtils,
  PerformanceMonitor,
  DebugUtils
} from './utils/index.js';

// 常用接口和类型导出
export type {
  // 消息类型
  UDEFMessage as UDEFMessageType,
  TypedUDEFMessage,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  CommandMessage,
  NotificationMessage,
  HeartbeatMessage,
  MessageHeader,
  MessageMetadata,
  MessagePayload,
  MessageEnvelope,
  ServiceInfo,
  ContentType,
  MessageType,
  MessagePriority
} from '@sker/types';

export type {
  // 序列化相关
  SerializationOptions,
  SerializationResult,
  DeserializationOptions,
  SerializerType
} from './serializers/index.js';

export type {
  // 验证相关
  ValidationResult,
  ValidationError,
  ValidationWarning,
  ValidationOptions,
  Schema,
  SchemaVersion,
  MigrationRule as SchemaMigrationRule,
  FieldMigrationRule as SchemaFieldMigrationRule,
  SchemaRegistryConfig
} from './validation/index.js';

export type {
  // 转换相关
  SupportedLanguage,
  TypeMapping,
  LanguageMapping,
  NamingConvention,
  TransformationContext,
  CodeGenerationOptions,
  TransformationResult
} from './transformation/index.js';

export type {
  // 版本管理相关
  MigrationRule,
  FieldMigrationRule,
  MigrationContext,
  MigrationResult,
  VersionCompatibility
} from './versioning/index.js';

export type {
  // 中间件相关
  MiddlewareContext,
  MiddlewareFunction,
  NextFunction,
  ProcessingResult,
  MiddlewareResult,
  ProcessingOptions
} from './middleware/index.js';

export type {
  // 性能优化相关
  PoolOptions,
  PoolStats,
  CacheEntry,
  CacheOptions,
  CacheStats,
  BatchOptions
} from './performance/index.js';

export type {
  // 工具相关
  MessageDiff
} from './utils/index.js';

// 版本信息
export const VERSION = '1.0.0';

// 默认配置
export const DEFAULT_CONFIG = {
  serialization: {
    defaultFormat: 'json' as const,
    compression: 'gzip' as const,
    validate: true,
    pretty: false
  },
  validation: {
    strict: true,
    allowAdditionalProperties: false,
    skipMissingSchema: false
  },
  performance: {
    enableCaching: true,
    enablePooling: true,
    cacheSize: 10 * 1024 * 1024, // 10MB
    poolSize: 100
  }
} as const;