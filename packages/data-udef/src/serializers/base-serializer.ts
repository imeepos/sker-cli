/**
 * 基础序列化器抽象类
 * Base serializer abstract class
 */

import type { UDEFMessage } from '@sker/core';
import type { UDEFMessageImpl } from '../core/message.js';

export interface SerializationOptions {
  compression?: 'gzip' | 'brotli' | 'deflate' | 'none';
  validate?: boolean;
  maxSize?: number;
  pretty?: boolean;
}

export interface SerializationResult {
  data: Uint8Array;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  format: string;
}

export interface DeserializationOptions {
  validate?: boolean;
  maxSize?: number;
}

export abstract class BaseSerializer {
  protected readonly format: string;
  protected readonly options: SerializationOptions;

  constructor(format: string, options: SerializationOptions = {}) {
    this.format = format;
    this.options = {
      compression: 'none',
      validate: false,
      maxSize: 10 * 1024 * 1024, // 10MB default
      pretty: false,
      ...options
    };
  }

  /**
   * 序列化消息
   * Serialize message
   */
  abstract serialize(message: UDEFMessageImpl): Promise<SerializationResult>;

  /**
   * 反序列化消息
   * Deserialize message
   */
  abstract deserialize(data: Uint8Array, options?: DeserializationOptions): Promise<UDEFMessageImpl>;

  /**
   * 获取序列化器格式
   * Get serializer format
   */
  getFormat(): string {
    return this.format;
  }

  /**
   * 压缩数据
   * Compress data
   */
  protected async compress(data: string | Uint8Array): Promise<Uint8Array> {
    const { compression } = this.options;
    
    if (compression === 'none' || !compression) {
      return typeof data === 'string' ? new TextEncoder().encode(data) : data;
    }

    const inputData = typeof data === 'string' ? new TextEncoder().encode(data) : data;

    try {
      switch (compression) {
        case 'gzip':
          return await this.gzipCompress(inputData);
        case 'brotli':
          return await this.brotliCompress(inputData);
        case 'deflate':
          return await this.deflateCompress(inputData);
        default:
          return inputData;
      }
    } catch (error) {
      console.warn(`Compression failed with ${compression}, using uncompressed data:`, error);
      return inputData;
    }
  }

  /**
   * 解压缩数据
   * Decompress data
   */
  protected async decompress(data: Uint8Array, compression?: string): Promise<string> {
    const compressionType = compression || this.options.compression;
    
    if (compressionType === 'none' || !compressionType) {
      return new TextDecoder().decode(data);
    }

    try {
      let decompressedData: Uint8Array;
      
      switch (compressionType) {
        case 'gzip':
          decompressedData = await this.gzipDecompress(data);
          break;
        case 'brotli':
          decompressedData = await this.brotliDecompress(data);
          break;
        case 'deflate':
          decompressedData = await this.deflateDecompress(data);
          break;
        default:
          decompressedData = data;
      }

      return new TextDecoder().decode(decompressedData);
    } catch (error) {
      console.warn(`Decompression failed with ${compressionType}, trying as plain text:`, error);
      return new TextDecoder().decode(data);
    }
  }

  /**
   * GZIP压缩
   */
  private async gzipCompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof CompressionStream !== 'undefined') {
      // 浏览器环境
      const stream = new CompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } else {
      // Node.js环境 - 使用zlib
      const zlib = await import('zlib');
      const { promisify } = await import('util');
      const gzip = promisify(zlib.gzip);
      return new Uint8Array(await gzip(Buffer.from(data)));
    }
  }

  /**
   * GZIP解压缩
   */
  private async gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream !== 'undefined') {
      // 浏览器环境
      const stream = new DecompressionStream('gzip');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } else {
      // Node.js环境
      const zlib = await import('zlib');
      const { promisify } = await import('util');
      const gunzip = promisify(zlib.gunzip);
      return new Uint8Array(await gunzip(Buffer.from(data)));
    }
  }

  /**
   * Brotli压缩（简化实现，实际可能需要第三方库）
   */
  private async brotliCompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof CompressionStream !== 'undefined') {
      try {
        const stream = new CompressionStream('deflate-raw');
        // 简化为deflate，实际应使用brotli库
        return this.deflateCompress(data);
      } catch {
        return data;
      }
    } else {
      try {
        const zlib = await import('zlib');
        const { promisify } = await import('util');
        const brotliCompress = promisify(zlib.brotliCompress);
        return new Uint8Array(await brotliCompress(Buffer.from(data)));
      } catch {
        return data;
      }
    }
  }

  /**
   * Brotli解压缩
   */
  private async brotliDecompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream !== 'undefined') {
      try {
        return this.deflateDecompress(data);
      } catch {
        return data;
      }
    } else {
      try {
        const zlib = await import('zlib');
        const { promisify } = await import('util');
        const brotliDecompress = promisify(zlib.brotliDecompress);
        return new Uint8Array(await brotliDecompress(Buffer.from(data)));
      } catch {
        return data;
      }
    }
  }

  /**
   * Deflate压缩
   */
  private async deflateCompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof CompressionStream !== 'undefined') {
      const stream = new CompressionStream('deflate-raw');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } else {
      const zlib = await import('zlib');
      const { promisify } = await import('util');
      const deflate = promisify(zlib.deflate);
      return new Uint8Array(await deflate(Buffer.from(data)));
    }
  }

  /**
   * Deflate解压缩
   */
  private async deflateDecompress(data: Uint8Array): Promise<Uint8Array> {
    if (typeof DecompressionStream !== 'undefined') {
      const stream = new DecompressionStream('deflate-raw');
      const writer = stream.writable.getWriter();
      const reader = stream.readable.getReader();

      writer.write(data);
      writer.close();

      const chunks: Uint8Array[] = [];
      let done = false;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) chunks.push(value);
      }

      const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const result = new Uint8Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
      }
      return result;
    } else {
      const zlib = await import('zlib');
      const { promisify } = await import('util');
      const inflate = promisify(zlib.inflate);
      return new Uint8Array(await inflate(Buffer.from(data)));
    }
  }

  /**
   * 验证数据大小
   * Validate data size
   */
  protected validateSize(data: Uint8Array | string): void {
    const size = typeof data === 'string' ? 
      new TextEncoder().encode(data).length : data.length;
    
    if (this.options.maxSize && size > this.options.maxSize) {
      throw new Error(`Data size ${size} exceeds maximum allowed size ${this.options.maxSize}`);
    }
  }
}