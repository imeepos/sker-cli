/**
 * JSON序列化器常量定义
 */

import { OptimizationStrategy, CompressionAlgorithm, CacheStrategy } from '../types/serializer-types.js';

// 默认配置常量
export const DEFAULT_CONFIG = {
  ENCODING: 'utf8' as const,
  PRETTY: false,
  SPACE: 2,
  COMPRESSION_THRESHOLD: 1024, // 1KB
  CACHE_SIZE: 1000,
  CACHE_TTL: 300000, // 5分钟
  PARALLEL_THRESHOLD: 10000,
  CHUNK_SIZE: 1000,
  MAX_WORKERS: 4,
  MAX_ERRORS: 100,
  HIGH_WATER_MARK: 16 * 1024, // 16KB
  BACKPRESSURE_THRESHOLD: 100 * 1024, // 100KB
  BACKPRESSURE_TIMEOUT: 5000, // 5秒
  SERIALIZE_TIMEOUT: 30000, // 30秒
  DESERIALIZE_TIMEOUT: 30000, // 30秒
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1秒
  MAX_QUEUE_SIZE: 10000,
  CONCURRENCY: 4,
  MAX_MEMORY: 100 * 1024 * 1024 // 100MB
} as const;

// UDEF消息格式常量
export const UDEF_CONSTANTS = {
  VERSION: '1.0.0',
  CONTENT_TYPE: 'application/json',
  ENCODING: 'utf-8',
  MESSAGE_ID_LENGTH: 32,
  CHECKSUM_ALGORITHM: 'sha256',
  SCHEMA_NAMESPACE: 'com.sker.udef',
  
  // 消息头字段
  HEADERS: {
    MESSAGE_ID: 'messageId',
    TIMESTAMP: 'timestamp',
    VERSION: 'version',
    SOURCE: 'source',
    DESTINATION: 'destination',
    CONTENT_TYPE: 'contentType',
    ENCODING: 'encoding',
    COMPRESSION: 'compression',
    SCHEMA: 'schema',
    CHECKSUM: 'checksum'
  },

  // 压缩标识
  COMPRESSION_MARKERS: {
    GZIP: 'gzip',
    BROTLI: 'br',
    DEFLATE: 'deflate'
  }
} as const;

// 性能相关常量
export const PERFORMANCE_CONSTANTS = {
  // 优化策略
  OPTIMIZATION_STRATEGIES: {
    [OptimizationStrategy.SPEED]: {
      compression: CompressionAlgorithm.NONE,
      cacheEnabled: true,
      parallelEnabled: true,
      validationEnabled: false
    },
    [OptimizationStrategy.SIZE]: {
      compression: CompressionAlgorithm.BROTLI,
      cacheEnabled: false,
      parallelEnabled: false,
      validationEnabled: true
    },
    [OptimizationStrategy.BALANCED]: {
      compression: CompressionAlgorithm.GZIP,
      cacheEnabled: true,
      parallelEnabled: true,
      validationEnabled: true
    }
  },

  // 基准数据大小阈值
  SIZE_THRESHOLDS: {
    TINY: 1024,           // 1KB
    SMALL: 10 * 1024,     // 10KB
    MEDIUM: 100 * 1024,   // 100KB
    LARGE: 1024 * 1024,   // 1MB
    HUGE: 10 * 1024 * 1024 // 10MB
  },

  // 性能基准配置
  BENCHMARK_CONFIG: {
    WARMUP_ITERATIONS: 100,
    TEST_ITERATIONS: 1000,
    MEMORY_CHECK_INTERVAL: 10,
    GC_FORCE_INTERVAL: 100
  }
} as const;

// 数据类型常量
export const DATA_TYPE_CONSTANTS = {
  // JavaScript数据类型
  TYPES: {
    UNDEFINED: 'undefined',
    NULL: 'null',
    BOOLEAN: 'boolean',
    NUMBER: 'number',
    BIGINT: 'bigint',
    STRING: 'string',
    SYMBOL: 'symbol',
    OBJECT: 'object',
    FUNCTION: 'function'
  },

  // 特殊对象类型
  SPECIAL_TYPES: {
    DATE: 'Date',
    REGEXP: 'RegExp',
    ERROR: 'Error',
    ARRAY: 'Array',
    MAP: 'Map',
    SET: 'Set',
    BUFFER: 'Buffer',
    UINT8ARRAY: 'Uint8Array',
    ARRAYBUFFER: 'ArrayBuffer'
  },

  // 类型标记前缀
  TYPE_MARKERS: {
    BIGINT: '__bigint:',
    DATE: '__date:',
    REGEXP: '__regexp:',
    FUNCTION: '__function:',
    SYMBOL: '__symbol:',
    BUFFER: '__buffer:',
    UNDEFINED: '__undefined'
  }
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  // 序列化错误
  SERIALIZE_FAILED: 'JSON序列化失败',
  SERIALIZE_TIMEOUT: '序列化超时',
  SERIALIZE_MEMORY_LIMIT: '序列化内存超限',
  SERIALIZE_INVALID_DATA: '无效的序列化数据',
  
  // 反序列化错误
  DESERIALIZE_FAILED: 'JSON反序列化失败',
  DESERIALIZE_TIMEOUT: '反序列化超时',
  DESERIALIZE_INVALID_JSON: '无效的JSON格式',
  DESERIALIZE_SCHEMA_MISMATCH: 'Schema不匹配',
  
  // 验证错误
  VALIDATION_FAILED: '数据验证失败',
  SCHEMA_NOT_FOUND: 'Schema未找到',
  CUSTOM_VALIDATOR_ERROR: '自定义验证器错误',
  
  // 压缩错误
  COMPRESSION_FAILED: '数据压缩失败',
  DECOMPRESSION_FAILED: '数据解压失败',
  UNSUPPORTED_COMPRESSION: '不支持的压缩算法',
  
  // 流处理错误
  STREAM_ERROR: '流处理错误',
  BACKPRESSURE_TIMEOUT: '背压超时',
  STREAM_CLOSED: '流已关闭',
  
  // 缓存错误
  CACHE_ERROR: '缓存错误',
  CACHE_FULL: '缓存已满',
  CACHE_KEY_ERROR: '缓存键错误',
  
  // 配置错误
  INVALID_CONFIG: '无效的配置参数',
  MISSING_REQUIRED_CONFIG: '缺少必需的配置参数',
  
  // 转换器错误
  TRANSFORMER_ERROR: '数据转换错误',
  UNKNOWN_TYPE: '未知的数据类型',
  TRANSFORM_FAILED: '类型转换失败'
} as const;

// 正则表达式常量
export const REGEX_PATTERNS = {
  // 日期格式
  ISO_DATE: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
  DATE_TIMESTAMP: /^\d{13}$/,
  
  // 数字格式
  INTEGER: /^-?\d+$/,
  FLOAT: /^-?\d+(\.\d+)?$/,
  SCIENTIFIC: /^-?\d+(\.\d+)?[eE][+-]?\d+$/,
  
  // 其他格式
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  URL: /^https?:\/\/.+/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  BASE64: /^[A-Za-z0-9+/]*={0,2}$/,
  HEX: /^[0-9a-fA-F]+$/
} as const;

// 编码相关常量
export const ENCODING_CONSTANTS = {
  // 字符编码
  ENCODINGS: {
    UTF8: 'utf8',
    UTF16LE: 'utf16le',
    ASCII: 'ascii',
    BASE64: 'base64',
    HEX: 'hex',
    BINARY: 'binary'
  },

  // BOM标记
  BOM: {
    UTF8: Buffer.from([0xEF, 0xBB, 0xBF]),
    UTF16LE: Buffer.from([0xFF, 0xFE]),
    UTF16BE: Buffer.from([0xFE, 0xFF])
  },

  // 换行符
  LINE_ENDINGS: {
    LF: '\n',
    CRLF: '\r\n',
    CR: '\r'
  }
} as const;

// 安全相关常量
export const SECURITY_CONSTANTS = {
  // 最大限制
  MAX_STRING_LENGTH: 50 * 1024 * 1024,    // 50MB
  MAX_ARRAY_LENGTH: 1000000,              // 100万
  MAX_OBJECT_DEPTH: 100,                  // 100层
  MAX_PROPERTY_COUNT: 100000,             // 10万个属性
  
  // 危险模式检测
  DANGEROUS_PATTERNS: [
    /__proto__/,
    /constructor/,
    /prototype/,
    /eval/,
    /Function/
  ],

  // 内容安全策略
  CSP_HEADERS: {
    'Content-Security-Policy': "default-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  }
} as const;

// 监控和日志常量
export const MONITORING_CONSTANTS = {
  // 日志级别
  LOG_LEVELS: {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3,
    TRACE: 4
  },

  // 指标类型
  METRICS: {
    SERIALIZE_COUNT: 'serialize_count',
    DESERIALIZE_COUNT: 'deserialize_count',
    ERROR_COUNT: 'error_count',
    CACHE_HIT_COUNT: 'cache_hit_count',
    CACHE_MISS_COUNT: 'cache_miss_count',
    COMPRESSION_RATIO: 'compression_ratio',
    PROCESSING_TIME: 'processing_time',
    MEMORY_USAGE: 'memory_usage',
    THROUGHPUT: 'throughput'
  },

  // 事件类型
  EVENTS: {
    SERIALIZE_START: 'serialize:start',
    SERIALIZE_END: 'serialize:end',
    SERIALIZE_ERROR: 'serialize:error',
    DESERIALIZE_START: 'deserialize:start',
    DESERIALIZE_END: 'deserialize:end',
    DESERIALIZE_ERROR: 'deserialize:error',
    CACHE_HIT: 'cache:hit',
    CACHE_MISS: 'cache:miss',
    VALIDATION_SUCCESS: 'validation:success',
    VALIDATION_FAILURE: 'validation:failure'
  }
} as const;