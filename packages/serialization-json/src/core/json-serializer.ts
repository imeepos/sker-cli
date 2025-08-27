/**
 * 核心JSON序列化器实现
 */

import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { gzip, gunzip, brotliCompress, brotliDecompress, deflate, inflate } from 'zlib';
import { promisify } from 'util';
import { EventEmitter } from 'events';

import {
  ISerializer,
  SerializerConfig,
  UDEFMessage,
  SerializationResult,
  DeserializationResult,
  TransformContext,
  Transformer,
  PerformanceStats
} from '../types/serializer-types.js';

import {
  DEFAULT_CONFIG,
  UDEF_CONSTANTS,
  ERROR_MESSAGES,
  DATA_TYPE_CONSTANTS,
  PERFORMANCE_CONSTANTS
} from '../constants/json-constants.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const brotliCompressAsync = promisify(brotliCompress);
const brotliDecompressAsync = promisify(brotliDecompress);
const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

/**
 * JSON序列化器错误类
 */
export class JSONSerializerError extends Error {
  public readonly code: string;
  public readonly details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'JSONSerializerError';
    this.code = code;
    this.details = details;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, JSONSerializerError);
    }
  }
}

/**
 * 核心JSON序列化器
 */
export class JSONSerializer extends EventEmitter implements ISerializer {
  private config: Required<SerializerConfig>;
  private cache: Map<string, any> = new Map();
  private stats: PerformanceStats = {
    cacheHitRate: 0,
    avgSerializeTime: 0,
    avgDeserializeTime: 0,
    memoryUsage: 0,
    throughput: 0,
    errorsCount: 0
  };
  private transformers: Map<string, Transformer> = new Map();
  
  constructor(config: Partial<SerializerConfig> = {}) {
    super();
    this.config = this.mergeConfig(config);
    this.initializeTransformers();
    this.setupPerformanceMonitoring();
  }

  /**
   * 合并配置
   */
  private mergeConfig(config: Partial<SerializerConfig>): Required<SerializerConfig> {
    return {
      encoding: config.encoding ?? DEFAULT_CONFIG.ENCODING,
      pretty: config.pretty ?? DEFAULT_CONFIG.PRETTY,
      space: config.space ?? DEFAULT_CONFIG.SPACE,
      
      compression: {
        algorithm: config.compression?.algorithm ?? 'none',
        level: config.compression?.level ?? 6,
        threshold: config.compression?.threshold ?? DEFAULT_CONFIG.COMPRESSION_THRESHOLD,
        dictionary: config.compression?.dictionary
      },
      
      validation: {
        enabled: config.validation?.enabled ?? false,
        strict: config.validation?.strict ?? true,
        schemas: config.validation?.schemas ?? {},
        customValidators: config.validation?.customValidators ?? {},
        errorFormat: config.validation?.errorFormat ?? 'detailed',
        onSerialize: config.validation?.onSerialize ?? true,
        onDeserialize: config.validation?.onDeserialize ?? true,
        schema: config.validation?.schema ?? undefined,
        processor: config.validation?.processor ?? undefined
      },
      
      transformers: {
        bigint: config.transformers?.bigint ?? true,
        date: config.transformers?.date ?? 'iso',
        buffer: config.transformers?.buffer ?? 'base64',
        undefined: config.transformers?.undefined ?? 'null',
        function: config.transformers?.function ?? 'omit',
        symbol: config.transformers?.symbol ?? 'omit',
        custom: config.transformers?.custom ?? []
      },
      
      cache: {
        enabled: config.cache?.enabled ?? true,
        strategy: config.cache?.strategy ?? 'lru',
        maxSize: config.cache?.maxSize ?? DEFAULT_CONFIG.CACHE_SIZE,
        maxMemory: config.cache?.maxMemory ?? DEFAULT_CONFIG.MAX_MEMORY,
        ttl: config.cache?.ttl ?? DEFAULT_CONFIG.CACHE_TTL,
        keyGenerator: config.cache?.keyGenerator ?? this.defaultKeyGenerator
      },
      
      parallel: {
        enabled: config.parallel?.enabled ?? false,
        workers: config.parallel?.workers ?? DEFAULT_CONFIG.MAX_WORKERS,
        threshold: config.parallel?.threshold ?? DEFAULT_CONFIG.PARALLEL_THRESHOLD,
        chunkSize: config.parallel?.chunkSize ?? DEFAULT_CONFIG.CHUNK_SIZE
      },
      
      errorHandling: {
        continueOnError: config.errorHandling?.continueOnError ?? false,
        maxErrors: config.errorHandling?.maxErrors ?? DEFAULT_CONFIG.MAX_ERRORS,
        errorCallback: config.errorHandling?.errorCallback
      },
      
      streaming: {
        highWaterMark: config.streaming?.highWaterMark ?? DEFAULT_CONFIG.HIGH_WATER_MARK,
        objectMode: config.streaming?.objectMode ?? false,
        backpressure: {
          enabled: config.streaming?.backpressure?.enabled ?? true,
          threshold: config.streaming?.backpressure?.threshold ?? DEFAULT_CONFIG.BACKPRESSURE_THRESHOLD,
          timeout: config.streaming?.backpressure?.timeout ?? DEFAULT_CONFIG.BACKPRESSURE_TIMEOUT
        }
      },
      
      optimizer: config.optimizer
    };
  }

  /**
   * 初始化转换器
   */
  private initializeTransformers(): void {
    // 内置转换器
    if (this.config.transformers.bigint) {
      this.transformers.set('bigint', new BigIntTransformer(this.config.transformers.bigint));
    }
    
    if (this.config.transformers.date) {
      this.transformers.set('date', new DateTransformer(this.config.transformers.date));
    }
    
    if (this.config.transformers.buffer) {
      this.transformers.set('buffer', new BufferTransformer(this.config.transformers.buffer));
    }
    
    // 自定义转换器
    if (this.config.transformers.custom) {
      this.config.transformers.custom.forEach(transformer => {
        this.transformers.set(transformer.type, transformer);
      });
    }
  }

  /**
   * 设置性能监控
   */
  private setupPerformanceMonitoring(): void {
    setInterval(() => {
      this.updatePerformanceStats();
      this.emit('stats', this.stats);
    }, 5000); // 每5秒更新一次统计
  }

  /**
   * 默认缓存键生成器
   */
  private defaultKeyGenerator = (data: any): string => {
    return createHash('sha256').update(JSON.stringify(data)).digest('hex');
  };

  /**
   * 序列化数据
   */
  async serialize(data: any, options?: Partial<SerializerConfig>): Promise<string> {
    const startTime = Date.now();
    this.emit('serialize:start', { data, options });
    
    try {
      const mergedConfig = { ...this.config, ...options };
      
      // 检查缓存
      let cacheKey: string | undefined;
      if (mergedConfig.cache.enabled && mergedConfig.cache.keyGenerator) {
        cacheKey = mergedConfig.cache.keyGenerator(data);
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.emit('cache:hit', { key: cacheKey });
          return cached;
        }
        this.emit('cache:miss', { key: cacheKey });
      }

      // 创建UDEF消息
      const udefMessage = this.createUDEFMessage(data);
      
      // 应用转换器
      const transformedData = await this.applyTransformers(udefMessage, true);
      
      // 验证数据
      if (mergedConfig.validation.enabled && mergedConfig.validation.onSerialize) {
        await this.validateData(transformedData, mergedConfig);
      }
      
      // 序列化为JSON
      let jsonString = this.config.pretty 
        ? JSON.stringify(transformedData, null, this.config.space)
        : JSON.stringify(transformedData);
      
      // 压缩数据
      if (mergedConfig.compression.algorithm !== 'none') {
        const algorithm = mergedConfig.compression.algorithm || 'gzip';
        const compressed = await this.compressData(Buffer.from(jsonString, this.config.encoding), algorithm);
        jsonString = compressed.toString('base64');
        udefMessage.envelope.metadata.compression = algorithm;
      }
      
      // 计算校验和
      udefMessage.envelope.metadata.checksum = this.calculateChecksum(jsonString);
      
      // 更新缓存
      if (cacheKey && mergedConfig.cache.enabled) {
        this.updateCache(cacheKey, jsonString);
      }
      
      const endTime = Date.now();
      this.emit('serialize:end', { 
        data, 
        result: jsonString, 
        duration: endTime - startTime 
      });
      
      return jsonString;
      
    } catch (error) {
      this.stats.errorsCount++;
      this.emit('serialize:error', { data, error });
      
      if (this.config.errorHandling.errorCallback) {
        this.config.errorHandling.errorCallback(error as Error);
      }
      
      throw new JSONSerializerError(
        ERROR_MESSAGES.SERIALIZE_FAILED,
        'SERIALIZE_ERROR',
        { originalError: error, data }
      );
    }
  }

  /**
   * 反序列化数据
   */
  async deserialize<T = any>(jsonString: string, options?: Partial<SerializerConfig>): Promise<T> {
    const startTime = Date.now();
    this.emit('deserialize:start', { data: jsonString, options });
    
    try {
      const mergedConfig = { ...this.config, ...options };
      
      let processedData = jsonString;
      
      // 检测是否为压缩数据
      if (this.isCompressedData(jsonString)) {
        const buffer = Buffer.from(jsonString, 'base64');
        const algorithm = mergedConfig.compression.algorithm || 'gzip';
        const decompressed = await this.decompressData(buffer, algorithm);
        processedData = decompressed.toString(this.config.encoding);
      }
      
      // 解析JSON
      const parsedData = JSON.parse(processedData);
      
      // 验证UDEF格式
      if (!this.isValidUDEFMessage(parsedData)) {
        throw new Error('Invalid UDEF message format');
      }
      
      // 验证校验和
      const expectedChecksum = parsedData.envelope.metadata.checksum;
      if (expectedChecksum) {
        const actualChecksum = this.calculateChecksum(processedData);
        if (actualChecksum !== expectedChecksum) {
          throw new Error('Checksum validation failed');
        }
      }
      
      // 应用转换器（反向）
      const transformedData = await this.applyTransformers(parsedData, false);
      
      // 验证数据
      if (mergedConfig.validation.enabled && mergedConfig.validation.onDeserialize) {
        await this.validateData(transformedData.payload.data, mergedConfig);
      }
      
      const endTime = Date.now();
      this.emit('deserialize:end', {
        data: jsonString,
        result: transformedData.payload.data,
        duration: endTime - startTime
      });
      
      return transformedData.payload.data;
      
    } catch (error) {
      this.stats.errorsCount++;
      this.emit('deserialize:error', { data: jsonString, error });
      
      if (this.config.errorHandling.errorCallback) {
        this.config.errorHandling.errorCallback(error as Error);
      }
      
      throw new JSONSerializerError(
        ERROR_MESSAGES.DESERIALIZE_FAILED,
        'DESERIALIZE_ERROR',
        { originalError: error, data: jsonString }
      );
    }
  }

  /**
   * 序列化为Buffer
   */
  async serializeToBuffer(data: any, options?: Partial<SerializerConfig>): Promise<Buffer> {
    const jsonString = await this.serialize(data, options);
    return Buffer.from(jsonString, this.config.encoding);
  }

  /**
   * 从Buffer反序列化
   */
  async deserializeFromBuffer<T = any>(buffer: Buffer, options?: Partial<SerializerConfig>): Promise<T> {
    const jsonString = buffer.toString(this.config.encoding);
    return this.deserialize<T>(jsonString, options);
  }

  /**
   * 创建UDEF消息
   */
  private createUDEFMessage<T>(data: T): UDEFMessage<T> {
    return {
      envelope: {
        header: {
          messageId: randomUUID(),
          timestamp: Date.now(),
          version: UDEF_CONSTANTS.VERSION
        },
        metadata: {
          contentType: UDEF_CONSTANTS.CONTENT_TYPE,
          encoding: this.config.encoding
        }
      },
      payload: {
        data,
        schema: {
          version: UDEF_CONSTANTS.VERSION
        }
      }
    };
  }

  /**
   * 验证UDEF消息格式
   */
  private isValidUDEFMessage(data: any): data is UDEFMessage {
    return data && 
           data.envelope &&
           data.envelope.header &&
           data.envelope.metadata &&
           data.payload &&
           typeof data.envelope.header.messageId === 'string' &&
           typeof data.envelope.header.timestamp === 'number' &&
           typeof data.envelope.metadata.contentType === 'string';
  }

  /**
   * 应用转换器
   */
  private async applyTransformers(data: any, isSerializing: boolean): Promise<any> {
    const context: TransformContext = {
      path: [],
      depth: 0,
      options: this.config
    };
    
    return this.transformValue(data, context, isSerializing);
  }

  /**
   * 转换单个值
   */
  private transformValue(value: any, context: TransformContext, isSerializing: boolean): any {
    if (value === null || value === undefined) {
      return this.handleSpecialValue(value);
    }
    
    // 查找合适的转换器
    for (const [type, transformer] of this.transformers) {
      if (isSerializing) {
        if (transformer.canTransform(value)) {
          return transformer.serialize(value, context);
        }
      } else {
        // 反序列化时需要检查特殊标记
        if (this.isTransformedValue(value, type)) {
          return transformer.deserialize(value, context);
        }
      }
    }
    
    // 递归处理对象和数组
    if (Array.isArray(value)) {
      return value.map((item, index) => 
        this.transformValue(item, {
          ...context,
          path: [...context.path, index.toString()],
          depth: context.depth + 1
        }, isSerializing)
      );
    }
    
    if (typeof value === 'object') {
      const result: any = {};
      for (const [key, val] of Object.entries(value)) {
        result[key] = this.transformValue(val, {
          ...context,
          path: [...context.path, key],
          depth: context.depth + 1
        }, isSerializing);
      }
      return result;
    }
    
    return value;
  }

  /**
   * 处理特殊值
   */
  private handleSpecialValue(value: any): any {
    if (value === undefined) {
      switch (this.config.transformers.undefined) {
        case 'null':
          return null;
        case 'omit':
          return undefined; // 将在父对象中被过滤
        case 'skip':
        default:
          return undefined;
      }
    }
    return value;
  }

  /**
   * 检查是否为转换后的值
   */
  private isTransformedValue(value: any, type: string): boolean {
    if (typeof value === 'string') {
      const marker = DATA_TYPE_CONSTANTS.TYPE_MARKERS[type.toUpperCase() as keyof typeof DATA_TYPE_CONSTANTS.TYPE_MARKERS];
      return marker ? value.startsWith(marker) : false;
    }
    
    if (typeof value === 'object' && value !== null) {
      return value.__type === type;
    }
    
    return false;
  }

  /**
   * 验证数据
   */
  private async validateData(data: any, config: Required<SerializerConfig>): Promise<void> {
    if (!config.validation.enabled) return;
    
    // 这里应该实现具体的验证逻辑
    // 可以集成JSON Schema验证器或自定义验证逻辑
    
    if (config.validation.processor && config.validation.processor.validate) {
      await config.validation.processor.validate(data, config.validation);
    }
  }

  /**
   * 压缩数据
   */
  private async compressData(buffer: Buffer, algorithm: string): Promise<Buffer> {
    switch (algorithm) {
      case 'gzip':
        return gzipAsync(buffer);
      case 'brotli':
        return brotliCompressAsync(buffer);
      case 'deflate':
        return deflateAsync(buffer);
      default:
        throw new JSONSerializerError(
          ERROR_MESSAGES.UNSUPPORTED_COMPRESSION,
          'UNSUPPORTED_COMPRESSION',
          { algorithm }
        );
    }
  }

  /**
   * 解压数据
   */
  private async decompressData(buffer: Buffer, algorithm: string): Promise<Buffer> {
    switch (algorithm) {
      case 'gzip':
        return gunzipAsync(buffer);
      case 'brotli':
        return brotliDecompressAsync(buffer);
      case 'deflate':
        return inflateAsync(buffer);
      default:
        throw new JSONSerializerError(
          ERROR_MESSAGES.UNSUPPORTED_COMPRESSION,
          'UNSUPPORTED_COMPRESSION',
          { algorithm }
        );
    }
  }

  /**
   * 检测是否为压缩数据
   */
  private isCompressedData(data: string): boolean {
    try {
      // 尝试解析为base64，如果成功且长度合理，可能是压缩数据
      const buffer = Buffer.from(data, 'base64');
      return buffer.length > 0 && buffer.toString('base64') === data;
    } catch {
      return false;
    }
  }

  /**
   * 计算校验和
   */
  private calculateChecksum(data: string): string {
    return createHash(UDEF_CONSTANTS.CHECKSUM_ALGORITHM)
      .update(data, this.config.encoding)
      .digest('hex');
  }

  /**
   * 更新缓存
   */
  private updateCache(key: string, value: any): void {
    if (this.cache.size >= (this.config.cache.maxSize || DEFAULT_CONFIG.CACHE_SIZE)) {
      // 简单的LRU实现：删除最老的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, value);
    
    // TTL处理
    if (this.config.cache.ttl && this.config.cache.ttl > 0) {
      setTimeout(() => {
        this.cache.delete(key);
      }, this.config.cache.ttl);
    }
  }

  /**
   * 更新性能统计
   */
  private updatePerformanceStats(): void {
    // 这里实现性能统计的更新逻辑
    const memoryUsage = process.memoryUsage();
    this.stats.memoryUsage = memoryUsage.heapUsed;
    
    // 计算缓存命中率等其他指标...
  }

  /**
   * 获取性能统计
   */
  getStats(): PerformanceStats {
    return { ...this.stats };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.cache.clear();
    this.removeAllListeners();
  }
}

/**
 * BigInt转换器
 */
class BigIntTransformer implements Transformer<bigint, string> {
  readonly type = 'bigint';
  
  constructor(private config: any) {}
  
  serialize(value: bigint): string {
    return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT}${value.toString()}`;
  }
  
  deserialize(value: string): bigint {
    const data = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT.length);
    return BigInt(data);
  }
  
  canTransform(value: any): value is bigint {
    return typeof value === 'bigint';
  }
}

/**
 * Date转换器
 */
class DateTransformer implements Transformer<Date, string> {
  readonly type = 'date';
  
  constructor(private config: any) {}
  
  serialize(value: Date): string {
    return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE}${value.toISOString()}`;
  }
  
  deserialize(value: string): Date {
    const data = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE.length);
    return new Date(data);
  }
  
  canTransform(value: any): value is Date {
    return value instanceof Date;
  }
}

/**
 * Buffer转换器
 */
class BufferTransformer implements Transformer<Buffer, string> {
  readonly type = 'buffer';
  
  constructor(private config: any) {}
  
  serialize(value: Buffer): string {
    return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER}${value.toString('base64')}`;
  }
  
  deserialize(value: string): Buffer {
    const data = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER.length);
    return Buffer.from(data, 'base64');
  }
  
  canTransform(value: any): value is Buffer {
    return Buffer.isBuffer(value);
  }
}