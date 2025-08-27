import Long from 'long';
import { Type, Root, ReflectionObject } from 'protobufjs';

/**
 * Protocol Buffers序列化器类型定义
 */

export interface SerializationOptions {
  enableCache?: boolean;
  cacheSize?: number;
  compression?: CompressionConfig;
  validation?: ValidationConfig;
  typeMapping?: TypeMappingConfig;
  output?: OutputConfig;
}

export interface CompressionConfig {
  algorithm?: CompressionAlgorithm;
  level?: number;
  threshold?: number;
  dictionary?: Uint8Array;
}

export type CompressionAlgorithm = 'gzip' | 'lz4' | 'snappy' | 'brotli' | 'none';

export interface ValidationConfig {
  strict?: boolean;
  validateOnSerialize?: boolean;
  validateOnDeserialize?: boolean;
  customValidators?: Record<string, (value: any) => boolean>;
  errorFormat?: 'simple' | 'detailed';
}

export interface TypeMappingConfig {
  int64ToBigInt?: boolean;
  timestampToDate?: boolean;
  bytesToUint8Array?: boolean;
  mapsToMaps?: boolean;
}

export interface OutputConfig {
  format?: 'binary' | 'json' | 'text';
  encoding?: string;
  prettify?: boolean;
}

export interface SchemaRegistryConfig {
  backend?: 'file' | 'redis' | 'http' | 'memory';
  file?: FileBackendConfig;
  redis?: RedisBackendConfig;
  http?: HttpBackendConfig;
  versioning?: VersioningConfig;
  compatibility?: CompatibilityConfig;
  cache?: CacheConfig;
}

export interface FileBackendConfig {
  schemaDir: string;
  autoLoad?: boolean;
  watchChanges?: boolean;
}

export interface RedisBackendConfig {
  host: string;
  port: number;
  password?: string;
  database?: number;
  keyPrefix?: string;
}

export interface HttpBackendConfig {
  baseURL: string;
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
  };
  timeout?: number;
}

export interface VersioningConfig {
  strategy?: 'semantic' | 'sequential' | 'timestamp';
  defaultVersion?: string;
  autoIncrement?: boolean;
}

export interface CompatibilityConfig {
  level?: 'backward' | 'forward' | 'full' | 'none';
  strictChecks?: boolean;
  allowEvolution?: boolean;
}

export interface CacheConfig {
  enabled?: boolean;
  ttl?: number;
  maxSize?: number;
}

export interface SchemaMetadata {
  id: string;
  name: string;
  package?: string;
  version: string;
  hash: string;
  createdAt: Date;
  updatedAt: Date;
  dependencies?: string[];
  tags?: Record<string, string>;
}

export interface SchemaRegistration {
  metadata: SchemaMetadata;
  content: string;
  compiled?: CompiledSchema;
}

export interface CompiledSchema {
  root: Root;
  types: Map<string, Type>;
  descriptors: Uint8Array;
  metadata: SchemaMetadata;
}

export interface SerializationResult {
  data: Uint8Array;
  size: number;
  compressionRatio?: number;
  metadata?: SerializationMetadata;
}

export interface SerializationMetadata {
  schemaId: string;
  schemaVersion: string;
  algorithm?: CompressionAlgorithm;
  timestamp: Date;
  checksums?: {
    crc32?: number;
    md5?: string;
  };
}

export interface DeserializationOptions {
  validateSchema?: boolean;
  strictMode?: boolean;
  allowUnknownFields?: boolean;
  preserveProtoFieldNames?: boolean;
}

export interface PerformanceConfig {
  enableCache?: boolean;
  cacheSize?: number;
  enableParallelProcessing?: boolean;
  maxConcurrency?: number;
  useWorkerThreads?: boolean;
  optimizer?: OptimizationConfig;
}

export interface OptimizationConfig {
  level?: OptimizationLevel;
  caching?: CachingConfig;
  precompilation?: PrecompilationConfig;
  memory?: MemoryConfig;
  skipUnknownFields?: boolean;
  useUnsafeOperations?: boolean;
  enableFastPath?: boolean;
  preallocateBuffers?: boolean;
}

export enum OptimizationLevel {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  AGGRESSIVE = 'AGGRESSIVE'
}

export interface CachingConfig {
  enabled?: boolean;
  strategy?: 'lru' | 'lfu' | 'ttl';
  maxSize?: number;
  maxEntries?: number;
  ttl?: number;
}

export interface PrecompilationConfig {
  enabled?: boolean;
  schemas?: string[];
  warmupData?: any[];
}

export interface MemoryConfig {
  enablePooling?: boolean;
  poolSize?: number;
  enableRecycling?: boolean;
  gcOptimization?: boolean;
}

export interface StreamingConfig {
  mode?: StreamingMode;
  batchSize?: number;
  compression?: CompressionAlgorithm;
  backpressure?: BackpressureConfig;
}

export enum StreamingMode {
  DELIMITED = 'DELIMITED',
  LENGTH_PREFIXED = 'LENGTH_PREFIXED',
  RAW = 'RAW'
}

export interface BackpressureConfig {
  highWaterMark?: number;
  maxPendingWrites?: number;
}

export interface CodeGenerationConfig {
  outputDir: string;
  options?: CodeGenerationOptions;
}

export interface CodeGenerationOptions {
  useInterfaces?: boolean;
  generateValidators?: boolean;
  generateConverters?: boolean;
  exportStyle?: 'named' | 'default' | 'namespace';
  naming?: NamingConfig;
}

export interface NamingConfig {
  interface?: 'PascalCase' | 'camelCase' | 'snake_case';
  property?: 'camelCase' | 'snake_case' | 'original';
  enum?: 'PascalCase' | 'UPPER_CASE' | 'original';
}

export interface MigrationRule {
  from: string;
  to: string;
  transformations: Transformation[];
}

export interface Transformation {
  type: 'add_field' | 'remove_field' | 'deprecate_field' | 'restructure_message';
  field?: string;
  defaultValue?: any;
  replacement?: string;
  location?: string;
  message?: string;
  transformation?: (oldData: any) => any;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ProtobufMessage<T = any> {
  serialize(): Uint8Array;
  deserialize(data: Uint8Array): T;
  validate(): ValidationResult;
  toJSON(): any;
  fromJSON(json: any): T;
}

export interface SerializationStatistics {
  totalSerializations: number;
  totalDeserializations: number;
  averageSerializeTime: number;
  averageDeserializeTime: number;
  compressionStats: {
    totalCompressed: number;
    totalUncompressed: number;
    averageRatio: number;
  };
  cacheStats: {
    hits: number;
    misses: number;
    hitRatio: number;
  };
}