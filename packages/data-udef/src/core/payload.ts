/**
 * UDEF消息载荷实现
 * UDEF message payload implementation
 */

import type { MessagePayload } from '@sker/types';
import { BasicTypes, type SkerString } from '@sker/types';
import { createHash } from 'crypto';

export class UDEFPayload implements MessagePayload {
  public readonly data: unknown;
  public readonly schema_version: SkerString;
  public readonly checksum?: SkerString;
  public readonly size_bytes?: number;
  public readonly encoding?: SkerString;
  public readonly compression?: SkerString;

  constructor(
    data: unknown,
    options: {
      schema_version?: SkerString;
      checksum?: SkerString;
      size_bytes?: number;
      encoding?: SkerString;
      compression?: SkerString;
      autoCalculateChecksum?: boolean;
    } = {}
  ) {
    this.data = data;
    this.schema_version = options.schema_version || '1.0.0';
    this.encoding = options.encoding || 'utf-8';
    this.compression = options.compression;

    // 自动计算校验和和大小
    if (options.autoCalculateChecksum !== false) {
      const serializedData = JSON.stringify(data);
      this.checksum = options.checksum || this.calculateChecksum(serializedData);
      this.size_bytes = options.size_bytes || Buffer.byteLength(serializedData, 'utf-8');
    } else {
      this.checksum = options.checksum;
      this.size_bytes = options.size_bytes;
    }
  }

  /**
   * 计算数据校验和
   * Calculate data checksum
   */
  private calculateChecksum(data: string): string {
    return createHash('sha256').update(data, 'utf-8').digest('hex');
  }

  /**
   * 验证数据完整性
   * Verify data integrity
   */
  verifyIntegrity(): boolean {
    if (!this.checksum) return true; // 没有校验和则认为有效

    const serializedData = JSON.stringify(this.data);
    const calculatedChecksum = this.calculateChecksum(serializedData);
    return calculatedChecksum === this.checksum;
  }

  /**
   * 获取数据大小（字节）
   * Get data size in bytes
   */
  getDataSize(): number {
    if (this.size_bytes) return this.size_bytes;

    const serializedData = JSON.stringify(this.data);
    return Buffer.byteLength(serializedData, 'utf-8');
  }

  /**
   * 检查是否为空载荷
   * Check if payload is empty
   */
  isEmpty(): boolean {
    return this.data === null || this.data === undefined || 
           (typeof this.data === 'object' && Object.keys(this.data as object).length === 0);
  }

  /**
   * 获取类型化数据
   * Get typed data
   */
  getData<T = unknown>(): T {
    return this.data as T;
  }

  /**
   * 转换为普通对象
   * Convert to plain object
   */
  toObject(): MessagePayload {
    return {
      data: this.data,
      schema_version: this.schema_version,
      checksum: this.checksum,
      size_bytes: this.size_bytes,
      encoding: this.encoding,
      compression: this.compression
    };
  }

  /**
   * 克隆载荷
   * Clone payload
   */
  clone(): UDEFPayload {
    return new UDEFPayload(
      JSON.parse(JSON.stringify(this.data)), {
        schema_version: this.schema_version,
        checksum: this.checksum,
        size_bytes: this.size_bytes,
        encoding: this.encoding,
        compression: this.compression,
        autoCalculateChecksum: false
      }
    );
  }

  /**
   * 更新数据
   * Update data
   */
  updateData(data: unknown, autoCalculateChecksum = true): UDEFPayload {
    return new UDEFPayload(data, {
      schema_version: this.schema_version,
      encoding: this.encoding,
      compression: this.compression,
      autoCalculateChecksum
    });
  }

  /**
   * 设置压缩
   * Set compression
   */
  setCompression(compression: SkerString): UDEFPayload {
    return new UDEFPayload(this.data, {
      schema_version: this.schema_version,
      checksum: this.checksum,
      size_bytes: this.size_bytes,
      encoding: this.encoding,
      compression,
      autoCalculateChecksum: false
    });
  }
}

/**
 * 载荷构建器
 * Payload builder
 */
export class PayloadBuilder {
  private data: unknown;
  private schemaVersion: SkerString = '1.0.0';
  private encoding: SkerString = 'utf-8';
  private compression?: SkerString;
  private autoCalculateChecksum = true;

  /**
   * 设置数据
   */
  setData(data: unknown): this {
    this.data = data;
    return this;
  }

  /**
   * 设置Schema版本
   */
  setSchemaVersion(version: SkerString): this {
    this.schemaVersion = version;
    return this;
  }

  /**
   * 设置编码
   */
  setEncoding(encoding: SkerString): this {
    this.encoding = encoding;
    return this;
  }

  /**
   * 设置压缩
   */
  setCompression(compression: SkerString): this {
    this.compression = compression;
    return this;
  }

  /**
   * 禁用自动计算校验和
   */
  disableAutoChecksum(): this {
    this.autoCalculateChecksum = false;
    return this;
  }

  /**
   * 构建载荷
   */
  build(): UDEFPayload {
    if (this.data === undefined) {
      throw new Error('Payload data is required');
    }

    return new UDEFPayload(this.data, {
      schema_version: this.schemaVersion,
      encoding: this.encoding,
      compression: this.compression,
      autoCalculateChecksum: this.autoCalculateChecksum
    });
  }
}

/**
 * 载荷工具函数
 * Payload utility functions
 */
export const PayloadUtils = {
  /**
   * 创建空载荷
   */
  createEmpty(schemaVersion = '1.0.0'): UDEFPayload {
    return new UDEFPayload(null, { schema_version: schemaVersion });
  },

  /**
   * 从JSON创建载荷
   */
  fromJSON(json: string, schemaVersion = '1.0.0'): UDEFPayload {
    try {
      const data = JSON.parse(json);
      return new UDEFPayload(data, { schema_version: schemaVersion });
    } catch (error) {
      throw new Error(`Failed to create payload from JSON: ${(error as Error).message}`);
    }
  },

  /**
   * 创建错误载荷
   */
  createError(error: Error, schemaVersion = '1.0.0'): UDEFPayload {
    return new UDEFPayload({
      error_type: error.constructor.name,
      error_message: error.message,
      error_stack: error.stack,
      timestamp: new Date().toISOString()
    }, { schema_version: schemaVersion });
  }
};