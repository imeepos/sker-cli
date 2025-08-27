/**
 * JSON序列化器实现
 * JSON serializer implementation
 */

import { BaseSerializer, type SerializationOptions, type SerializationResult, type DeserializationOptions } from './base-serializer.js';
import type { UDEFMessageImpl } from '../core/message.js';
import { MessageFactory } from '../core/message.js';

export interface JSONSerializationOptions extends SerializationOptions {
  dateFormat?: 'iso' | 'timestamp' | 'custom';
  customDateFormatter?: (date: Date) => string;
  customDateParser?: (value: string) => Date;
  includeMetadata?: boolean;
  space?: number | string;
}

export class JSONSerializer extends BaseSerializer {
  private readonly jsonOptions: JSONSerializationOptions;

  constructor(options: JSONSerializationOptions = {}) {
    super('json', options);
    this.jsonOptions = {
      dateFormat: 'iso',
      includeMetadata: true,
      space: options.pretty ? 2 : undefined,
      ...options
    };
  }

  /**
   * 序列化UDEF消息为JSON
   * Serialize UDEF message to JSON
   */
  async serialize(message: UDEFMessageImpl): Promise<SerializationResult> {
    try {
      // 转换消息为可序列化对象
      const messageObj = this.prepareForSerialization(message);
      
      // JSON序列化
      const jsonString = JSON.stringify(
        messageObj,
        this.createReplacer(),
        this.jsonOptions.space
      );
      
      // 验证大小
      this.validateSize(jsonString);
      
      const originalSize = new TextEncoder().encode(jsonString).length;
      
      // 压缩
      const compressedData = await this.compress(jsonString);
      const compressedSize = compressedData.length;
      
      return {
        data: compressedData,
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
        format: this.format
      };
    } catch (error) {
      throw new Error(`JSON serialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * 从JSON反序列化UDEF消息
   * Deserialize UDEF message from JSON
   */
  async deserialize(data: Uint8Array, options: DeserializationOptions = {}): Promise<UDEFMessageImpl> {
    try {
      // 验证大小
      this.validateSize(data);
      
      // 解压缩
      const jsonString = await this.decompress(data);
      
      // JSON解析
      const messageObj = JSON.parse(jsonString, this.createReviver());
      
      // 验证消息结构
      this.validateMessageStructure(messageObj);
      
      // 创建消息实例
      return this.createMessageFromObject(messageObj);
      
    } catch (error) {
      throw new Error(`JSON deserialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * 准备消息对象用于序列化
   * Prepare message object for serialization
   */
  private prepareForSerialization(message: UDEFMessageImpl): any {
    const messageObj = message.toObject();
    
    // 添加序列化元数据
    if (this.jsonOptions.includeMetadata) {
      (messageObj as any)._udef_meta = {
        serializer: 'json',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        compression: this.options.compression
      };
    }
    
    return messageObj;
  }

  /**
   * 创建JSON替换器
   * Create JSON replacer
   */
  private createReplacer(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      // 处理Date类型
      if (value instanceof Date) {
        switch (this.jsonOptions.dateFormat) {
          case 'iso':
            return value.toISOString();
          case 'timestamp':
            return value.getTime();
          case 'custom':
            return this.jsonOptions.customDateFormatter?.(value) || value.toISOString();
          default:
            return value.toISOString();
        }
      }
      
      // 处理BigInt类型
      if (typeof value === 'bigint') {
        return value.toString();
      }
      
      // 处理undefined
      if (value === undefined) {
        return null;
      }
      
      // 处理函数（应该被忽略）
      if (typeof value === 'function') {
        return undefined;
      }
      
      return value;
    };
  }

  /**
   * 创建JSON恢复器
   * Create JSON reviver
   */
  private createReviver(): (key: string, value: any) => any {
    return (key: string, value: any) => {
      // 恢复时间戳字段
      if (key === 'timestamp' || key.endsWith('_timestamp') || key.endsWith('_time')) {
        if (typeof value === 'string') {
          // 尝试解析ISO字符串
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            return date;
          }
        } else if (typeof value === 'number') {
          // 时间戳格式
          return new Date(value);
        }
      }
      
      // 恢复自定义日期字段
      if (this.jsonOptions.customDateParser && typeof value === 'string') {
        try {
          if (this.isDateLikeString(value)) {
            return this.jsonOptions.customDateParser(value);
          }
        } catch {
          // 忽略解析错误，返回原值
        }
      }
      
      return value;
    };
  }

  /**
   * 检查字符串是否像日期
   * Check if string looks like a date
   */
  private isDateLikeString(value: string): boolean {
    // ISO 8601格式检查
    const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/;
    return iso8601Regex.test(value);
  }

  /**
   * 验证消息结构
   * Validate message structure
   */
  private validateMessageStructure(messageObj: any): void {
    if (!messageObj || typeof messageObj !== 'object') {
      throw new Error('Invalid message object: not an object');
    }
    
    if (!messageObj.envelope) {
      throw new Error('Invalid message object: missing envelope');
    }
    
    if (!messageObj.payload) {
      throw new Error('Invalid message object: missing payload');
    }
    
    if (!messageObj.envelope.header) {
      throw new Error('Invalid message object: missing envelope.header');
    }
    
    if (!messageObj.envelope.header.message_id) {
      throw new Error('Invalid message object: missing message_id');
    }
    
    if (!messageObj.envelope.header.timestamp) {
      throw new Error('Invalid message object: missing timestamp');
    }
    
    if (!messageObj.payload.schema_version) {
      throw new Error('Invalid message object: missing schema_version');
    }
  }

  /**
   * 从对象创建消息实例
   * Create message instance from object
   */
  private createMessageFromObject(messageObj: any): UDEFMessageImpl {
    return MessageFactory.fromJSON(JSON.stringify(messageObj));
  }

  /**
   * 获取压缩统计信息
   * Get compression statistics
   */
  getCompressionStats(result: SerializationResult): {
    originalSizeKB: number;
    compressedSizeKB: number;
    savedBytes: number;
    savedPercentage: number;
  } {
    const savedBytes = result.originalSize - result.compressedSize;
    const savedPercentage = result.originalSize > 0 ? 
      (savedBytes / result.originalSize) * 100 : 0;
    
    return {
      originalSizeKB: Math.round(result.originalSize / 1024 * 100) / 100,
      compressedSizeKB: Math.round(result.compressedSize / 1024 * 100) / 100,
      savedBytes,
      savedPercentage: Math.round(savedPercentage * 100) / 100
    };
  }
}

/**
 * 紧凑JSON序列化器
 * Compact JSON serializer
 */
export class CompactJSONSerializer extends JSONSerializer {
  constructor(options: JSONSerializationOptions = {}) {
    super({
      ...options,
      pretty: false,
      includeMetadata: false,
      compression: options.compression || 'gzip'
    });
  }
}

/**
 * 美化JSON序列化器
 * Pretty JSON serializer
 */
export class PrettyJSONSerializer extends JSONSerializer {
  constructor(options: JSONSerializationOptions = {}) {
    super({
      ...options,
      pretty: true,
      space: options.space || 2,
      compression: options.compression || 'none'
    });
  }
}