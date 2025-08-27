import { Type, Message } from 'protobufjs';
import { SchemaRegistry } from '../schema/schema-registry.js';
import {
  SerializationOptions,
  SerializationResult,
  DeserializationOptions,
  SerializationMetadata,
  ValidationResult,
  SerializationStatistics
} from '../types/protobuf-types.js';
import { PROTOBUF_CONSTANTS } from '../constants/protobuf-constants.js';
import {
  compressData,
  decompressData,
  calculateCRC32,
  calculateMD5,
  convertJSTypeToProtoType,
  convertProtoTypeToJSType,
  formatBytes,
  timeout
} from '../utils/protobuf-utils.js';

/**
 * Protocol Buffers序列化器
 * 提供高性能的二进制序列化和反序列化功能
 */
export class ProtobufSerializer {
  private schemaRegistry: SchemaRegistry;
  private options: Required<SerializationOptions>;
  private cache = new Map<string, any>();
  private stats: SerializationStatistics = {
    totalSerializations: 0,
    totalDeserializations: 0,
    averageSerializeTime: 0,
    averageDeserializeTime: 0,
    compressionStats: {
      totalCompressed: 0,
      totalUncompressed: 0,
      averageRatio: 0
    },
    cacheStats: {
      hits: 0,
      misses: 0,
      hitRatio: 0
    }
  };

  constructor(schemaRegistry: SchemaRegistry, options: SerializationOptions = {}) {
    this.schemaRegistry = schemaRegistry;
    this.options = this.mergeOptions(options);
  }

  private mergeOptions(options: SerializationOptions): Required<SerializationOptions> {
    return {
      enableCache: options.enableCache ?? true,
      cacheSize: options.cacheSize ?? PROTOBUF_CONSTANTS.DEFAULT_CACHE_SIZE,
      compression: {
        algorithm: options.compression?.algorithm ?? 'gzip',
        level: options.compression?.level ?? PROTOBUF_CONSTANTS.COMPRESSION_LEVELS.DEFAULT,
        threshold: options.compression?.threshold ?? PROTOBUF_CONSTANTS.DEFAULT_COMPRESSION_THRESHOLD,
        dictionary: options.compression?.dictionary
      },
      validation: {
        strict: options.validation?.strict ?? true,
        validateOnSerialize: options.validation?.validateOnSerialize ?? true,
        validateOnDeserialize: options.validation?.validateOnDeserialize ?? true,
        customValidators: options.validation?.customValidators ?? {},
        errorFormat: options.validation?.errorFormat ?? 'detailed'
      },
      typeMapping: {
        int64ToBigInt: options.typeMapping?.int64ToBigInt ?? true,
        timestampToDate: options.typeMapping?.timestampToDate ?? true,
        bytesToUint8Array: options.typeMapping?.bytesToUint8Array ?? true,
        mapsToMaps: options.typeMapping?.mapsToMaps ?? true
      },
      output: {
        format: options.output?.format ?? 'binary',
        encoding: options.output?.encoding ?? 'utf8',
        prettify: options.output?.prettify ?? false
      }
    };
  }

  /**
   * 序列化数据
   */
  async serialize(
    messageType: string,
    data: any,
    options: {
      schemaVersion?: string;
      timeout?: number;
    } = {}
  ): Promise<SerializationResult> {
    const startTime = performance.now();
    const operationId = `serialize_${messageType}_${Date.now()}`;

    try {
      // 获取Schema
      const compiledSchema = await this.schemaRegistry.getCompiledSchema(
        messageType.split('.').slice(0, -1).join('.') || messageType,
        options.schemaVersion
      );

      if (!compiledSchema) {
        throw new Error(`Schema not found for message type: ${messageType}`);
      }

      // 获取消息类型
      const MessageType = compiledSchema.types.get(messageType);
      if (!MessageType) {
        throw new Error(`Message type not found: ${messageType}`);
      }

      // 验证数据
      if (this.options.validation.validateOnSerialize) {
        const validation = this.validateData(data, MessageType);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
        }
      }

      // 转换数据类型
      const convertedData = this.options.typeMapping ? 
        convertJSTypeToProtoType(data) : data;

      // 创建消息实例
      const message = MessageType.create(convertedData);

      // 序列化为二进制
      let binaryData: Uint8Array;
      
      if (options.timeout) {
        binaryData = await timeout(
          Promise.resolve(MessageType.encode(message).finish()),
          options.timeout
        );
      } else {
        binaryData = MessageType.encode(message).finish();
      }

      // 压缩（如果需要）
      const shouldCompress = binaryData.length >= (this.options.compression.threshold ?? 1024);
      let finalData = binaryData;
      let compressionRatio: number | undefined;
      
      if (shouldCompress && this.options.compression.algorithm !== 'none') {
        const compressedData = compressData(
          binaryData,
          this.options.compression.algorithm,
          (this.options.compression.level ?? 6) as any
        );
        
        if (compressedData.length < binaryData.length) {
          finalData = compressedData;
          compressionRatio = binaryData.length / compressedData.length;
          
          // 更新压缩统计
          this.stats.compressionStats.totalCompressed++;
          this.stats.compressionStats.totalUncompressed++;
        } else {
          // 压缩没有减小大小，使用原始数据
          compressionRatio = 1;
        }
      }

      // 创建元数据
      const metadata: SerializationMetadata = {
        schemaId: compiledSchema.metadata.id,
        schemaVersion: compiledSchema.metadata.version,
        algorithm: shouldCompress ? this.options.compression.algorithm : undefined,
        timestamp: new Date(),
        checksums: {
          crc32: calculateCRC32(finalData),
          md5: calculateMD5(finalData)
        }
      };

      const result: SerializationResult = {
        data: finalData,
        size: finalData.length,
        compressionRatio,
        metadata
      };

      // 更新统计信息
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.updateSerializationStats(duration);

      // 缓存结果（可选）
      if (this.options.enableCache) {
        this.setCacheItem(operationId, result);
      }

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Serialization failed for ${messageType}: ${errorMessage}`);
    }
  }

  /**
   * 反序列化数据
   */
  async deserialize<T = any>(
    messageType: string,
    data: Uint8Array,
    options: DeserializationOptions & {
      schemaVersion?: string;
      timeout?: number;
      metadata?: SerializationMetadata;
    } = {}
  ): Promise<T> {
    const startTime = performance.now();

    try {
      // 获取Schema
      const schemaVersion = options.metadata?.schemaVersion || options.schemaVersion;
      const compiledSchema = await this.schemaRegistry.getCompiledSchema(
        messageType.split('.').slice(0, -1).join('.') || messageType,
        schemaVersion
      );

      if (!compiledSchema) {
        throw new Error(`Schema not found for message type: ${messageType}`);
      }

      // 获取消息类型
      const MessageType = compiledSchema.types.get(messageType);
      if (!MessageType) {
        throw new Error(`Message type not found: ${messageType}`);
      }

      // 解压缩（如果需要）
      let binaryData = data;
      if (options.metadata?.algorithm && options.metadata.algorithm !== 'none') {
        try {
          binaryData = decompressData(data, options.metadata.algorithm);
        } catch (error) {
          throw new Error(`Decompression failed: ${error}`);
        }
      }

      // 验证校验和（如果提供）
      if (options.metadata?.checksums) {
        const actualCrc32 = calculateCRC32(binaryData);
        if (options.metadata.checksums.crc32 !== actualCrc32) {
          throw new Error(`CRC32 checksum mismatch. Expected: ${options.metadata.checksums.crc32}, Actual: ${actualCrc32}`);
        }
      }

      // 反序列化
      let message: Message;
      
      if (options.timeout) {
        message = await timeout(
          Promise.resolve(MessageType.decode(binaryData)),
          options.timeout
        );
      } else {
        message = MessageType.decode(binaryData);
      }

      // 验证Schema（如果需要）
      if (options.validateSchema && this.options.validation.validateOnDeserialize) {
        const validation = this.validateMessage(message, MessageType);
        if (!validation.valid) {
          throw new Error(`Schema validation failed: ${validation.errors?.map(e => e.message).join(', ')}`);
        }
      }

      // 转换为JavaScript对象
      let result: any = message.toJSON();

      // 应用类型映射
      if (this.options.typeMapping) {
        result = this.applyTypeMapping(result, MessageType);
      }

      // 处理未知字段
      if (!options.allowUnknownFields) {
        result = this.removeUnknownFields(result, MessageType);
      }

      // 更新统计信息
      const endTime = performance.now();
      const duration = endTime - startTime;
      this.updateDeserializationStats(duration);

      return result as T;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Deserialization failed for ${messageType}: ${errorMessage}`);
    }
  }

  /**
   * 验证数据
   */
  private validateData(data: any, messageType: Type): ValidationResult {
    const errors: any[] = [];

    try {
      // 基本验证：检查必需字段
      for (const field of messageType.fieldsArray) {
        if (field.required && (data[field.name] === undefined || data[field.name] === null)) {
          errors.push({
            field: field.name,
            message: `Required field '${field.name}' is missing`,
            code: 'REQUIRED_FIELD_MISSING',
            value: data[field.name]
          });
        }

        // 自定义验证器
        const validator = this.options.validation.customValidators?.[field.name];
        if (validator && data[field.name] !== undefined) {
          const isValid = validator(data[field.name]);
          if (!isValid) {
            errors.push({
              field: field.name,
              message: `Custom validation failed for field '${field.name}'`,
              code: 'CUSTOM_VALIDATION_FAILED',
              value: data[field.name]
            });
          }
        }
      }

      return {
        valid: errors.length === 0,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: `Validation error: ${error}`,
          code: 'VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * 验证消息
   */
  private validateMessage(message: Message, messageType: Type): ValidationResult {
    // 简化实现：在实际项目中应该进行更详细的验证
    try {
      const json = message.toJSON();
      return this.validateData(json, messageType);
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: `Message validation error: ${error}`,
          code: 'MESSAGE_VALIDATION_ERROR'
        }]
      };
    }
  }

  /**
   * 应用类型映射
   */
  private applyTypeMapping(data: any, messageType: Type): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result = { ...data };

    for (const field of messageType.fieldsArray) {
      const value = result[field.name];
      if (value !== undefined && value !== null) {
        result[field.name] = convertProtoTypeToJSType(value, field);
      }
    }

    return result;
  }

  /**
   * 移除未知字段
   */
  private removeUnknownFields(data: any, messageType: Type): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const result: any = {};
    const fieldNames = new Set(messageType.fieldsArray.map(f => f.name));

    for (const [key, value] of Object.entries(data)) {
      if (fieldNames.has(key)) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * 缓存管理
   */
  private setCacheItem(key: string, value: any): void {
    if (this.cache.size >= this.options.cacheSize) {
      // 移除最旧的条目
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  private getCacheItem(key: string): any | undefined {
    const item = this.cache.get(key);
    if (item) {
      this.stats.cacheStats.hits++;
      return item;
    } else {
      this.stats.cacheStats.misses++;
      return undefined;
    }
  }

  /**
   * 更新统计信息
   */
  private updateSerializationStats(duration: number): void {
    this.stats.totalSerializations++;
    this.stats.averageSerializeTime = 
      (this.stats.averageSerializeTime * (this.stats.totalSerializations - 1) + duration) / 
      this.stats.totalSerializations;
  }

  private updateDeserializationStats(duration: number): void {
    this.stats.totalDeserializations++;
    this.stats.averageDeserializeTime = 
      (this.stats.averageDeserializeTime * (this.stats.totalDeserializations - 1) + duration) / 
      this.stats.totalDeserializations;
  }

  /**
   * 获取统计信息
   */
  getStatistics(): SerializationStatistics {
    // 计算缓存命中率
    const totalCacheRequests = this.stats.cacheStats.hits + this.stats.cacheStats.misses;
    this.stats.cacheStats.hitRatio = totalCacheRequests > 0 ? 
      this.stats.cacheStats.hits / totalCacheRequests : 0;

    // 计算压缩比
    if (this.stats.compressionStats.totalCompressed > 0) {
      this.stats.compressionStats.averageRatio = 
        this.stats.compressionStats.totalUncompressed / this.stats.compressionStats.totalCompressed;
    }

    return { ...this.stats };
  }

  /**
   * 重置统计信息
   */
  resetStatistics(): void {
    this.stats = {
      totalSerializations: 0,
      totalDeserializations: 0,
      averageSerializeTime: 0,
      averageDeserializeTime: 0,
      compressionStats: {
        totalCompressed: 0,
        totalUncompressed: 0,
        averageRatio: 0
      },
      cacheStats: {
        hits: 0,
        misses: 0,
        hitRatio: 0
      }
    };
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   */
  getCacheSize(): number {
    return this.cache.size;
  }

  /**
   * 批量序列化
   */
  async serializeBatch<T>(
    messageType: string,
    dataArray: T[],
    options: {
      schemaVersion?: string;
      batchSize?: number;
      parallel?: boolean;
    } = {}
  ): Promise<SerializationResult[]> {
    const batchSize = options.batchSize || 100;
    const results: SerializationResult[] = [];

    if (options.parallel) {
      // 并行处理
      const promises: Promise<SerializationResult>[] = [];
      
      for (const data of dataArray) {
        promises.push(this.serialize(messageType, data, options));
        
        if (promises.length >= batchSize) {
          const batchResults = await Promise.all(promises);
          results.push(...batchResults);
          promises.length = 0;
        }
      }
      
      if (promises.length > 0) {
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }
    } else {
      // 顺序处理
      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        
        for (const data of batch) {
          const result = await this.serialize(messageType, data, options);
          results.push(result);
        }
      }
    }

    return results;
  }

  /**
   * 批量反序列化
   */
  async deserializeBatch<T = any>(
    messageType: string,
    dataArray: Uint8Array[],
    options: DeserializationOptions & {
      schemaVersion?: string;
      batchSize?: number;
      parallel?: boolean;
    } = {}
  ): Promise<T[]> {
    const batchSize = options.batchSize || 100;
    const results: T[] = [];

    if (options.parallel) {
      // 并行处理
      const promises: Promise<T>[] = [];
      
      for (const data of dataArray) {
        promises.push(this.deserialize<T>(messageType, data, options));
        
        if (promises.length >= batchSize) {
          const batchResults = await Promise.all(promises);
          results.push(...batchResults);
          promises.length = 0;
        }
      }
      
      if (promises.length > 0) {
        const batchResults = await Promise.all(promises);
        results.push(...batchResults);
      }
    } else {
      // 顺序处理
      for (let i = 0; i < dataArray.length; i += batchSize) {
        const batch = dataArray.slice(i, i + batchSize);
        
        for (const data of batch) {
          const result = await this.deserialize<T>(messageType, data, options);
          results.push(result);
        }
      }
    }

    return results;
  }
}