/**
 * Buffer数据转换器
 */

import {
  Transformer,
  TransformContext,
  BufferTransformConfig
} from '../types/serializer-types.js';
import { DATA_TYPE_CONSTANTS, REGEX_PATTERNS, SECURITY_CONSTANTS } from '../constants/json-constants.js';

/**
 * Buffer转换器
 */
export class BufferTransformer implements Transformer<Buffer, string> {
  readonly type = 'buffer';
  private config: Required<BufferTransformConfig>;

  constructor(config?: BufferTransformConfig | string) {
    if (typeof config === 'string') {
      config = { encoding: config as 'base64' | 'hex' | 'binary' };
    }

    this.config = {
      encoding: config?.encoding ?? 'base64',
      maxSize: config?.maxSize ?? SECURITY_CONSTANTS.MAX_STRING_LENGTH
    };
  }

  /**
   * 序列化Buffer
   */
  serialize(value: Buffer, context: TransformContext): string {
    // 检查大小限制
    if (value.length > this.config.maxSize) {
      throw new Error(`Buffer size ${value.length} exceeds maximum allowed size ${this.config.maxSize}`);
    }

    let encodedString: string;

    switch (this.config.encoding) {
      case 'base64':
        encodedString = value.toString('base64');
        break;
      
      case 'hex':
        encodedString = value.toString('hex');
        break;
      
      case 'binary':
        encodedString = value.toString('binary');
        break;
      
      default:
        throw new Error(`Unsupported buffer encoding: ${this.config.encoding}`);
    }

    // 添加类型标记和编码信息
    return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER}${this.config.encoding}:${encodedString}`;
  }

  /**
   * 反序列化Buffer
   */
  deserialize(value: string, context: TransformContext): Buffer {
    if (typeof value !== 'string') {
      throw new Error(`Expected string for Buffer deserialization, got ${typeof value}`);
    }

    let dataString = value;
    let encoding = this.config.encoding;

    // 移除类型标记
    if (value.startsWith(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER)) {
      dataString = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER.length);
    }

    // 提取编码信息
    const colonIndex = dataString.indexOf(':');
    if (colonIndex > 0) {
      const extractedEncoding = dataString.slice(0, colonIndex);
      if (this.isValidEncoding(extractedEncoding)) {
        encoding = extractedEncoding as 'base64' | 'hex' | 'binary';
        dataString = dataString.slice(colonIndex + 1);
      }
    }

    // 验证数据格式
    if (!this.isValidEncodedString(dataString, encoding)) {
      throw new Error(`Invalid ${encoding} encoded string`);
    }

    try {
      const buffer = Buffer.from(dataString, encoding);
      
      // 检查大小限制
      if (buffer.length > this.config.maxSize) {
        throw new Error(`Decoded buffer size ${buffer.length} exceeds maximum allowed size ${this.config.maxSize}`);
      }
      
      return buffer;
    } catch (error) {
      throw new Error(`Failed to decode buffer from ${encoding}: ${(error as Error).message}`);
    }
  }

  /**
   * 检查是否可以转换
   */
  canTransform(value: any): value is Buffer {
    return Buffer.isBuffer(value);
  }

  /**
   * 验证反序列化值
   */
  canDeserialize(value: any): boolean {
    if (typeof value !== 'string') {
      return false;
    }

    let dataString = value;
    let encoding = this.config.encoding;

    // 检查Buffer标记
    if (value.startsWith(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER)) {
      dataString = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BUFFER.length);
      
      // 提取编码信息
      const colonIndex = dataString.indexOf(':');
      if (colonIndex > 0) {
        const extractedEncoding = dataString.slice(0, colonIndex);
        if (this.isValidEncoding(extractedEncoding)) {
          encoding = extractedEncoding as 'base64' | 'hex' | 'binary';
          dataString = dataString.slice(colonIndex + 1);
        }
      }
    }

    return this.isValidEncodedString(dataString, encoding);
  }

  /**
   * 检查是否为有效编码
   */
  private isValidEncoding(encoding: string): boolean {
    return ['base64', 'hex', 'binary'].includes(encoding);
  }

  /**
   * 验证编码字符串格式
   */
  private isValidEncodedString(str: string, encoding: string): boolean {
    if (!str) return false;

    switch (encoding) {
      case 'base64':
        return REGEX_PATTERNS.BASE64.test(str) && str.length % 4 === 0;
      
      case 'hex':
        return REGEX_PATTERNS.HEX.test(str) && str.length % 2 === 0;
      
      case 'binary':
        // Binary编码允许所有字符，只检查长度
        return str.length > 0;
      
      default:
        return false;
    }
  }

  /**
   * 获取编码效率
   */
  getEncodingEfficiency(originalSize: number): { [key: string]: number } {
    return {
      base64: Math.ceil(originalSize * 4 / 3), // Base64 增加约33%
      hex: originalSize * 2,                   // Hex 增加100%
      binary: originalSize                     // Binary 保持原大小
    };
  }

  /**
   * 选择最优编码
   */
  selectOptimalEncoding(buffer: Buffer, prioritizeSize = true): 'base64' | 'hex' | 'binary' {
    if (prioritizeSize) {
      // 优先考虑大小，binary最小
      return 'binary';
    }

    // 检查数据内容
    const hasNonPrintable = buffer.some(byte => byte < 32 || byte > 126);
    
    if (!hasNonPrintable) {
      // 如果都是可打印字符，使用binary
      return 'binary';
    }

    // 包含不可打印字符，base64通常是更好的选择
    return 'base64';
  }

  /**
   * 压缩Buffer（简单RLE压缩）
   */
  compress(buffer: Buffer): Buffer {
    const compressed: number[] = [];
    let i = 0;

    while (i < buffer.length) {
      const currentByte = buffer[i];
      let count = 1;

      // 计算连续相同字节的数量
      while (i + count < buffer.length && 
             buffer[i + count] === currentByte && 
             count < 255) {
        count++;
      }

      if (count > 3) {
        // 值得压缩：使用RLE格式 [255, count, value]
        compressed.push(255, count, currentByte!);
      } else {
        // 不值得压缩，直接添加原字节
        for (let j = 0; j < count; j++) {
          const byteValue = buffer[i + j];
          if (byteValue === 255) {
            // 转义255字节
            compressed.push(255, 1, 255);
          } else {
            compressed.push(byteValue || 0);
          }
        }
      }

      i += count;
    }

    return Buffer.from(compressed);
  }

  /**
   * 解压缩Buffer
   */
  decompress(buffer: Buffer): Buffer {
    const decompressed: number[] = [];
    let i = 0;

    while (i < buffer.length) {
      if (buffer[i] === 255 && i + 2 < buffer.length) {
        const count = buffer[i + 1] || 0;
        const value = buffer[i + 2] || 0;
        
        for (let j = 0; j < count; j++) {
          decompressed.push(value);
        }
        
        i += 3;
      } else {
        decompressed.push(buffer[i] || 0);
        i++;
      }
    }

    return Buffer.from(decompressed);
  }

  /**
   * 计算Buffer哈希
   */
  calculateHash(buffer: Buffer, algorithm = 'sha256'): string {
    const crypto = require('crypto');
    return crypto.createHash(algorithm).update(buffer).digest('hex');
  }

  /**
   * 验证Buffer完整性
   */
  verifyIntegrity(buffer: Buffer, expectedHash: string, algorithm = 'sha256'): boolean {
    const actualHash = this.calculateHash(buffer, algorithm);
    return actualHash === expectedHash;
  }

  /**
   * 分块Buffer
   */
  chunk(buffer: Buffer, chunkSize: number): Buffer[] {
    const chunks: Buffer[] = [];
    
    for (let i = 0; i < buffer.length; i += chunkSize) {
      chunks.push(buffer.subarray(i, i + chunkSize));
    }
    
    return chunks;
  }

  /**
   * 合并Buffer块
   */
  merge(chunks: Buffer[]): Buffer {
    return Buffer.concat(chunks);
  }

  /**
   * 获取Buffer统计信息
   */
  getStats(buffer: Buffer): {
    size: number;
    entropy: number;
    nonPrintableBytes: number;
    compressionRatio: number;
  } {
    const size = buffer.length;
    
    // 计算字节频率
    const frequencies = new Map<number, number>();
    let nonPrintableBytes = 0;
    
    for (const byte of buffer) {
      frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
      
      if (byte < 32 || byte > 126) {
        nonPrintableBytes++;
      }
    }

    // 计算熵
    let entropy = 0;
    for (const freq of frequencies.values()) {
      const probability = freq / size;
      entropy -= probability * Math.log2(probability);
    }

    // 估算压缩比
    const compressed = this.compress(buffer);
    const compressionRatio = compressed.length / size;

    return {
      size,
      entropy,
      nonPrintableBytes,
      compressionRatio
    };
  }

  /**
   * 获取配置
   */
  getConfig(): Required<BufferTransformConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<BufferTransformConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 支持的编码列表
   */
  static getSupportedEncodings(): string[] {
    return ['base64', 'hex', 'binary'];
  }

  /**
   * 创建预设配置
   */
  static createPreset(preset: 'compact' | 'readable' | 'safe'): BufferTransformConfig {
    switch (preset) {
      case 'compact':
        return { 
          encoding: 'binary',
          maxSize: 10 * 1024 * 1024 // 10MB
        };
      
      case 'readable':
        return { 
          encoding: 'base64',
          maxSize: 5 * 1024 * 1024 // 5MB
        };
      
      case 'safe':
        return { 
          encoding: 'hex',
          maxSize: 1024 * 1024 // 1MB
        };
      
      default:
        return { 
          encoding: 'base64',
          maxSize: 10 * 1024 * 1024
        };
    }
  }
}