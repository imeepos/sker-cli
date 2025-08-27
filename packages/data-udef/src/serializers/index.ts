/**
 * 序列化器模块导出
 * Serializer module exports
 */

export * from './base-serializer.js';
export * from './json-serializer.js';
export * from './messagepack-serializer.js';
export * from './protobuf-serializer.js';

// 序列化器工厂
import { JSONSerializer, CompactJSONSerializer, PrettyJSONSerializer } from './json-serializer.js';
import { MessagePackSerializer } from './messagepack-serializer.js';
import { ProtobufSerializer } from './protobuf-serializer.js';
import type { SerializationOptions } from './base-serializer.js';

export type SerializerType = 'json' | 'compact-json' | 'pretty-json' | 'messagepack' | 'protobuf';

/**
 * 序列化器工厂
 * Serializer factory
 */
export class SerializerFactory {
  /**
   * 创建序列化器
   * Create serializer
   */
  static create(type: SerializerType, options: SerializationOptions = {}): 
    JSONSerializer | MessagePackSerializer | ProtobufSerializer {
    
    switch (type) {
      case 'json':
        return new JSONSerializer(options);
      case 'compact-json':
        return new CompactJSONSerializer(options);
      case 'pretty-json':
        return new PrettyJSONSerializer(options);
      case 'messagepack':
        return new MessagePackSerializer(options);
      case 'protobuf':
        return new ProtobufSerializer(options);
      default:
        throw new Error(`Unsupported serializer type: ${type}`);
    }
  }

  /**
   * 获取可用的序列化器类型
   * Get available serializer types
   */
  static getAvailableTypes(): SerializerType[] {
    return ['json', 'compact-json', 'pretty-json', 'messagepack', 'protobuf'];
  }

  /**
   * 根据内容类型推荐序列化器
   * Recommend serializer based on content type
   */
  static recommendForContentType(contentType: string): SerializerType {
    const normalizedType = contentType.toLowerCase();
    
    if (normalizedType.includes('json')) {
      return 'json';
    } else if (normalizedType.includes('protobuf') || normalizedType.includes('proto')) {
      return 'protobuf';
    } else if (normalizedType.includes('msgpack') || normalizedType.includes('messagepack')) {
      return 'messagepack';
    } else {
      // 默认使用JSON
      return 'json';
    }
  }

  /**
   * 根据数据大小推荐序列化器
   * Recommend serializer based on data size
   */
  static recommendForDataSize(sizeBytes: number): SerializerType {
    if (sizeBytes < 1024) {
      // 小于1KB，使用可读性好的JSON
      return 'pretty-json';
    } else if (sizeBytes < 10 * 1024) {
      // 小于10KB，使用紧凑JSON
      return 'compact-json';
    } else if (sizeBytes < 100 * 1024) {
      // 小于100KB，使用MessagePack
      return 'messagepack';
    } else {
      // 大于100KB，使用Protobuf
      return 'protobuf';
    }
  }

  /**
   * 根据性能要求推荐序列化器
   * Recommend serializer based on performance requirements
   */
  static recommendForPerformance(priority: 'speed' | 'size' | 'compatibility'): SerializerType {
    switch (priority) {
      case 'speed':
        return 'json'; // JSON序列化通常最快
      case 'size':
        return 'protobuf'; // Protobuf通常最紧凑
      case 'compatibility':
        return 'json'; // JSON兼容性最好
      default:
        return 'json';
    }
  }
}