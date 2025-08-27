/**
 * Protocol Buffers序列化器常量定义
 */

export const PROTOBUF_CONSTANTS = {
  // 默认配置
  DEFAULT_CACHE_SIZE: 10000,
  DEFAULT_COMPRESSION_THRESHOLD: 1024,
  DEFAULT_BATCH_SIZE: 1000,
  DEFAULT_TIMEOUT: 30000,
  DEFAULT_TTL: 300000, // 5分钟

  // 压缩级别
  COMPRESSION_LEVELS: {
    NONE: 0,
    FAST: 1,
    DEFAULT: 6,
    BEST: 9
  } as const,

  // 流处理配置
  STREAMING: {
    DEFAULT_HIGH_WATER_MARK: 16 * 1024, // 16KB
    DEFAULT_MAX_PENDING_WRITES: 10,
    DEFAULT_BATCH_SIZE: 1000
  } as const,

  // Schema版本
  SCHEMA_VERSION: {
    DEFAULT: '1.0.0',
    PATTERN: /^\d+\.\d+\.\d+$/
  } as const,

  // 错误代码
  ERROR_CODES: {
    SERIALIZATION_ERROR: 'PROTOBUF_SERIALIZATION_ERROR',
    DESERIALIZATION_ERROR: 'PROTOBUF_DESERIALIZATION_ERROR',
    SCHEMA_NOT_FOUND: 'PROTOBUF_SCHEMA_NOT_FOUND',
    SCHEMA_INVALID: 'PROTOBUF_SCHEMA_INVALID',
    VALIDATION_ERROR: 'PROTOBUF_VALIDATION_ERROR',
    COMPRESSION_ERROR: 'PROTOBUF_COMPRESSION_ERROR',
    REGISTRY_ERROR: 'PROTOBUF_REGISTRY_ERROR',
    COMPILATION_ERROR: 'PROTOBUF_COMPILATION_ERROR',
    VERSION_MISMATCH: 'PROTOBUF_VERSION_MISMATCH'
  } as const,

  // 文件扩展名
  FILE_EXTENSIONS: {
    PROTO: '.proto',
    TS: '.ts',
    JS: '.js',
    D_TS: '.d.ts'
  } as const,

  // MIME类型
  MIME_TYPES: {
    PROTOBUF: 'application/x-protobuf',
    PROTO_TEXT: 'text/x-proto'
  } as const,

  // 缓存策略
  CACHE_STRATEGIES: {
    LRU: 'lru',
    LFU: 'lfu',
    TTL: 'ttl'
  } as const,

  // 优化级别
  OPTIMIZATION_LEVELS: {
    BASIC: 'BASIC',
    STANDARD: 'STANDARD',
    AGGRESSIVE: 'AGGRESSIVE'
  } as const,

  // 兼容性级别
  COMPATIBILITY_LEVELS: {
    NONE: 'none',
    BACKWARD: 'backward',
    FORWARD: 'forward',
    FULL: 'full'
  } as const,

  // 流模式
  STREAMING_MODES: {
    DELIMITED: 'DELIMITED',
    LENGTH_PREFIXED: 'LENGTH_PREFIXED',
    RAW: 'RAW'
  } as const,

  // 压缩算法
  COMPRESSION_ALGORITHMS: {
    NONE: 'none',
    GZIP: 'gzip',
    LZ4: 'lz4',
    SNAPPY: 'snappy',
    BROTLI: 'brotli'
  } as const,

  // 后端类型
  BACKEND_TYPES: {
    FILE: 'file',
    REDIS: 'redis',
    HTTP: 'http',
    MEMORY: 'memory'
  } as const,

  // 版本策略
  VERSION_STRATEGIES: {
    SEMANTIC: 'semantic',
    SEQUENTIAL: 'sequential',
    TIMESTAMP: 'timestamp'
  } as const,

  // 输出格式
  OUTPUT_FORMATS: {
    BINARY: 'binary',
    JSON: 'json',
    TEXT: 'text'
  } as const,

  // 认证类型
  AUTH_TYPES: {
    BEARER: 'bearer',
    BASIC: 'basic',
    API_KEY: 'api-key'
  } as const,

  // 导出样式
  EXPORT_STYLES: {
    NAMED: 'named',
    DEFAULT: 'default',
    NAMESPACE: 'namespace'
  } as const,

  // 命名约定
  NAMING_CONVENTIONS: {
    PASCAL_CASE: 'PascalCase',
    CAMEL_CASE: 'camelCase',
    SNAKE_CASE: 'snake_case',
    UPPER_CASE: 'UPPER_CASE',
    ORIGINAL: 'original'
  } as const,

  // 字段类型
  FIELD_TYPES: {
    DOUBLE: 'double',
    FLOAT: 'float',
    INT32: 'int32',
    INT64: 'int64',
    UINT32: 'uint32',
    UINT64: 'uint64',
    SINT32: 'sint32',
    SINT64: 'sint64',
    FIXED32: 'fixed32',
    FIXED64: 'fixed64',
    SFIXED32: 'sfixed32',
    SFIXED64: 'sfixed64',
    BOOL: 'bool',
    STRING: 'string',
    BYTES: 'bytes',
    MESSAGE: 'message',
    ENUM: 'enum'
  } as const,

  // 变换类型
  TRANSFORMATION_TYPES: {
    ADD_FIELD: 'add_field',
    REMOVE_FIELD: 'remove_field',
    DEPRECATE_FIELD: 'deprecate_field',
    RESTRUCTURE_MESSAGE: 'restructure_message'
  } as const,

  // 内存配置
  MEMORY: {
    DEFAULT_POOL_SIZE: 1000,
    DEFAULT_BUFFER_SIZE: 8192,
    GC_THRESHOLD: 1000000 // 1MB
  } as const,

  // 性能监控
  METRICS: {
    HISTOGRAM_BUCKETS: [0.001, 0.01, 0.1, 1, 10, 100, 1000],
    SAMPLE_SIZE: 1000,
    COLLECTION_INTERVAL: 60000 // 1分钟
  } as const
} as const;


export default PROTOBUF_CONSTANTS;