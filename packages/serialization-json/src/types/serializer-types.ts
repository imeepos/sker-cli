/**
 * 序列化器类型定义
 */

import { Readable, Writable, Transform } from 'stream';

// UDEF标准消息结构
export interface UDEFMessage<T = any> {
  envelope: {
    header: {
      messageId: string;
      timestamp: number;
      version: string;
      source?: string;
      destination?: string;
    };
    metadata: {
      contentType: string;
      encoding?: string;
      compression?: string;
      schema?: string;
      checksum?: string;
    };
  };
  payload: {
    data: T;
    schema?: {
      version: string;
      definition?: any;
    };
  };
}

// 序列化器配置接口
export interface SerializerConfig {
  encoding?: BufferEncoding;
  pretty?: boolean;
  space?: number | string;
  compression?: CompressionConfig;
  validation?: ValidationConfig;
  transformers?: TransformersConfig;
  cache?: CacheConfig;
  parallel?: ParallelConfig;
  errorHandling?: ErrorHandlingConfig;
  streaming?: StreamingConfig;
  optimizer?: any;
}

// 压缩配置
export interface CompressionConfig {
  algorithm?: 'none' | 'gzip' | 'brotli' | 'deflate';
  level?: number;
  threshold?: number;
  dictionary?: Buffer | undefined;
}

// 验证配置
export interface ValidationConfig {
  enabled?: boolean;
  strict?: boolean;
  schemas?: Record<string, JSONSchema>;
  customValidators?: Record<string, ValidatorFunction>;
  errorFormat?: 'simple' | 'detailed';
  onSerialize?: boolean;
  onDeserialize?: boolean;
  schema?: string;
  processor?: any;
}

// 转换器配置
export interface TransformersConfig {
  bigint?: BigIntTransformConfig | boolean;
  date?: DateTransformConfig | string;
  buffer?: BufferTransformConfig | string;
  undefined?: 'null' | 'omit' | 'skip';
  function?: 'omit' | 'string';
  symbol?: 'omit' | 'string';
  custom?: Transformer[];
}

// BigInt转换配置
export interface BigIntTransformConfig {
  format?: 'string' | 'number';
  prefix?: string;
}

// Date转换配置
export interface DateTransformConfig {
  format?: 'iso' | 'timestamp' | 'custom';
  timezone?: string;
  customFormat?: string;
}

// Buffer转换配置
export interface BufferTransformConfig {
  encoding?: 'base64' | 'hex' | 'binary';
  maxSize?: number;
}

// 缓存配置
export interface CacheConfig {
  enabled?: boolean;
  strategy?: 'lru' | 'lfu' | 'ttl';
  maxSize?: number;
  maxMemory?: number;
  ttl?: number;
  keyGenerator?: (data: any) => string;
}

// 并行处理配置
export interface ParallelConfig {
  enabled?: boolean;
  workers?: number;
  threshold?: number;
  chunkSize?: number;
}

// 错误处理配置
export interface ErrorHandlingConfig {
  continueOnError?: boolean;
  maxErrors?: number;
  errorCallback?: (error: Error) => void;
}

// 流配置
export interface StreamingConfig {
  highWaterMark?: number;
  objectMode?: boolean;
  backpressure?: BackpressureConfig;
}

// 背压配置
export interface BackpressureConfig {
  enabled?: boolean;
  threshold?: number;
  timeout?: number;
}

// JSON Schema接口
export interface JSONSchema {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  additionalProperties?: boolean | JSONSchema;
  enum?: any[];
  const?: any;
  format?: string;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  pattern?: string;
  allOf?: JSONSchema[];
  anyOf?: JSONSchema[];
  oneOf?: JSONSchema[];
  not?: JSONSchema;
  if?: JSONSchema;
  then?: JSONSchema;
  else?: JSONSchema;
  default?: any;
  examples?: any[];
  title?: string;
  description?: string;
  $ref?: string;
  $id?: string;
  $schema?: string;
}

// 验证器函数类型
export type ValidatorFunction = (value: any) => boolean | Promise<boolean>;

// 转换器接口
export interface Transformer<TInput = any, TOutput = any> {
  readonly type: string;
  serialize(value: TInput, context: TransformContext): TOutput;
  deserialize(value: TOutput, context: TransformContext): TInput;
  canTransform(value: any): value is TInput;
}

// 转换上下文
export interface TransformContext {
  path: string[];
  depth: number;
  options: SerializerConfig;
  metadata?: Record<string, any>;
}

// 序列化结果
export interface SerializationResult {
  data: string;
  metadata: {
    originalSize: number;
    compressedSize?: number;
    compressionRatio?: number;
    encoding: string;
    checksum?: string;
    transformations?: string[];
  };
}

// 反序列化结果
export interface DeserializationResult<T = any> {
  data: T;
  metadata: {
    originalSize: number;
    encoding: string;
    validationPassed?: boolean;
    transformations?: string[];
  };
}

// 批量序列化选项
export interface BatchSerializationOptions {
  onProgress?: (completed: number, total: number) => void;
  onError?: (error: Error, index: number) => void;
  continueOnError?: boolean;
}

// 性能统计
export interface PerformanceStats {
  cacheHitRate: number;
  avgSerializeTime: number;
  avgDeserializeTime: number;
  memoryUsage: number;
  throughput: number;
  errorsCount: number;
}

// 异步序列化器配置
export interface AsyncSerializerConfig extends SerializerConfig {
  concurrency?: number;
  chunkSize?: number;
  maxQueueSize?: number;
  serializeTimeout?: number;
  deserializeTimeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

// 流式序列化器配置
export interface StreamingSerializerConfig extends SerializerConfig {
  highWaterMark?: number;
  objectMode?: boolean;
  transform?: TransformOptions;
  backpressure?: BackpressureConfig;
}

// 转换选项
export interface TransformOptions {
  allowHalfOpen?: boolean;
  readableObjectMode?: boolean;
  writableObjectMode?: boolean;
  decodeStrings?: boolean;
  encoding?: BufferEncoding;
  highWaterMark?: number;
  objectMode?: boolean;
}

// 验证错误
export interface ValidationError {
  instancePath: string;
  schemaPath: string;
  keyword: string;
  params: Record<string, any>;
  message: string;
  data?: any;
}

// 序列化器接口
export interface ISerializer {
  serialize(data: any, options?: Partial<SerializerConfig>): Promise<string>;
  deserialize<T = any>(data: string, options?: Partial<SerializerConfig>): Promise<T>;
  serializeToBuffer(data: any, options?: Partial<SerializerConfig>): Promise<Buffer>;
  deserializeFromBuffer<T = any>(buffer: Buffer, options?: Partial<SerializerConfig>): Promise<T>;
}

// 流式序列化器接口
export interface IStreamingSerializer extends ISerializer {
  createSerializeStream(options?: Partial<StreamingSerializerConfig>): Transform;
  createDeserializeStream(options?: Partial<StreamingSerializerConfig>): Transform;
  serializeStream(source: Readable, options?: Partial<StreamingSerializerConfig>): Readable;
  deserializeStream(source: Readable, options?: Partial<StreamingSerializerConfig>): Readable;
}

// 异步序列化器接口
export interface IAsyncSerializer extends ISerializer {
  serializeBatch(data: any[], options?: BatchSerializationOptions): Promise<string[]>;
  deserializeBatch<T = any>(data: string[], options?: BatchSerializationOptions): Promise<T[]>;
  serializeAsync(data: any, options?: Partial<AsyncSerializerConfig>): Promise<string>;
  deserializeAsync<T = any>(data: string, options?: Partial<AsyncSerializerConfig>): Promise<T>;
}

// 优化策略枚举
export enum OptimizationStrategy {
  SPEED = 'speed',
  SIZE = 'size',
  BALANCED = 'balanced'
}

// 压缩算法枚举
export enum CompressionAlgorithm {
  NONE = 'none',
  GZIP = 'gzip',
  BROTLI = 'brotli',
  DEFLATE = 'deflate'
}

// 缓存策略枚举
export enum CacheStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  TTL = 'ttl'
}

// 编码格式枚举
export enum EncodingFormat {
  UTF8 = 'utf8',
  BASE64 = 'base64',
  HEX = 'hex',
  BINARY = 'binary'
}