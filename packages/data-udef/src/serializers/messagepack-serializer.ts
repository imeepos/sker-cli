/**
 * MessagePack序列化器实现
 * MessagePack serializer implementation
 */

import { BaseSerializer, type SerializationOptions, type SerializationResult, type DeserializationOptions } from './base-serializer.js';
import type { UDEFMessageImpl } from '../core/message.js';
import { MessageFactory } from '../core/message.js';

export interface MessagePackOptions extends SerializationOptions {
  useTypedArrays?: boolean;
  useBinaryString?: boolean;
  ignoreUndefined?: boolean;
  extensionCodec?: ExtensionCodec;
}

export interface ExtensionCodec {
  encode?: (obj: any) => Uint8Array | null;
  decode?: (data: Uint8Array, type: number) => any;
}

export class MessagePackSerializer extends BaseSerializer {
  private readonly msgpackOptions: MessagePackOptions;

  constructor(options: MessagePackOptions = {}) {
    super('messagepack', options);
    this.msgpackOptions = {
      useTypedArrays: true,
      useBinaryString: false,
      ignoreUndefined: true,
      ...options
    };
  }

  /**
   * 序列化UDEF消息为MessagePack
   * Serialize UDEF message to MessagePack
   */
  async serialize(message: UDEFMessageImpl): Promise<SerializationResult> {
    try {
      // 转换消息为可序列化对象
      const messageObj = this.prepareForSerialization(message);
      
      // MessagePack序列化
      const msgpackData = this.encode(messageObj);
      
      // 验证大小
      this.validateSize(msgpackData);
      
      const originalSize = msgpackData.length;
      
      // 压缩（MessagePack已经很紧凑，通常不需要额外压缩）
      const compressedData = this.options.compression !== 'none' ? 
        await this.compress(msgpackData) : msgpackData;
      
      const compressedSize = compressedData.length;
      
      return {
        data: compressedData,
        originalSize,
        compressedSize,
        compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
        format: this.format
      };
    } catch (error) {
      throw new Error(`MessagePack serialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * 从MessagePack反序列化UDEF消息
   * Deserialize UDEF message from MessagePack
   */
  async deserialize(data: Uint8Array, options: DeserializationOptions = {}): Promise<UDEFMessageImpl> {
    try {
      // 验证大小
      this.validateSize(data);
      
      // 解压缩（如果需要）
      const msgpackData = this.options.compression !== 'none' ? 
        new Uint8Array(Buffer.from(await this.decompress(data))) : data;
      
      // MessagePack解码
      const messageObj = this.decode(msgpackData);
      
      // 验证消息结构
      this.validateMessageStructure(messageObj);
      
      // 创建消息实例
      return this.createMessageFromObject(messageObj);
      
    } catch (error) {
      throw new Error(`MessagePack deserialization failed: ${(error as Error).message}`);
    }
  }

  /**
   * 准备消息对象用于序列化
   * Prepare message object for serialization
   */
  private prepareForSerialization(message: UDEFMessageImpl): any {
    const messageObj = message.toObject();
    
    // MessagePack元数据
    (messageObj as any)._udef_meta = {
      serializer: 'messagepack',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    };
    
    return this.preprocessObject(messageObj);
  }

  /**
   * 预处理对象以适应MessagePack
   * Preprocess object for MessagePack compatibility
   */
  private preprocessObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (obj instanceof Date) {
      // 将Date转换为时间戳
      return { __type: 'Date', value: obj.getTime() };
    }
    
    if (typeof obj === 'bigint') {
      // 将BigInt转换为字符串
      return { __type: 'BigInt', value: obj.toString() };
    }
    
    if (obj instanceof RegExp) {
      // 将RegExp转换为对象
      return { __type: 'RegExp', source: obj.source, flags: obj.flags };
    }
    
    if (obj instanceof Set) {
      // 将Set转换为数组
      return { __type: 'Set', values: Array.from(obj) };
    }
    
    if (obj instanceof Map) {
      // 将Map转换为数组
      return { __type: 'Map', entries: Array.from(obj.entries()) };
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.preprocessObject(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (!this.msgpackOptions.ignoreUndefined || value !== undefined) {
          result[key] = this.preprocessObject(value);
        }
      }
      return result;
    }
    
    return obj;
  }

  /**
   * 后处理对象以恢复类型
   * Postprocess object to restore types
   */
  private postprocessObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'object' && obj.__type) {
      switch (obj.__type) {
        case 'Date':
          return new Date(obj.value);
        case 'BigInt':
          return BigInt(obj.value);
        case 'RegExp':
          return new RegExp(obj.source, obj.flags);
        case 'Set':
          return new Set(obj.values.map((item: any) => this.postprocessObject(item)));
        case 'Map':
          return new Map(obj.entries.map(([k, v]: [any, any]) => [
            this.postprocessObject(k),
            this.postprocessObject(v)
          ]));
        default:
          // 未知类型，移除类型标记
          const { __type, ...rest } = obj;
          return this.postprocessObject(rest);
      }
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.postprocessObject(item));
    }
    
    if (typeof obj === 'object') {
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        result[key] = this.postprocessObject(value);
      }
      return result;
    }
    
    return obj;
  }

  /**
   * MessagePack编码（简化实现）
   * MessagePack encode (simplified implementation)
   */
  private encode(obj: any): Uint8Array {
    // 这里提供一个简化的MessagePack编码实现
    // 在生产环境中，应该使用成熟的MessagePack库如@msgpack/msgpack
    
    const encoder = new MessagePackEncoder();
    return encoder.encode(obj);
  }

  /**
   * MessagePack解码（简化实现）
   * MessagePack decode (simplified implementation)
   */
  private decode(data: Uint8Array): any {
    // 这里提供一个简化的MessagePack解码实现
    // 在生产环境中，应该使用成熟的MessagePack库如@msgpack/msgpack
    
    const decoder = new MessagePackDecoder();
    const result = decoder.decode(data);
    return this.postprocessObject(result);
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
  }

  /**
   * 从对象创建消息实例
   * Create message instance from object
   */
  private createMessageFromObject(messageObj: any): UDEFMessageImpl {
    return MessageFactory.fromJSON(JSON.stringify(messageObj));
  }
}

/**
 * 简化的MessagePack编码器
 * Simplified MessagePack encoder
 */
class MessagePackEncoder {
  private buffer: number[] = [];

  encode(obj: any): Uint8Array {
    this.buffer = [];
    this.encodeValue(obj);
    return new Uint8Array(this.buffer);
  }

  private encodeValue(value: any): void {
    if (value === null) {
      this.buffer.push(0xc0); // nil
    } else if (value === false) {
      this.buffer.push(0xc2); // false
    } else if (value === true) {
      this.buffer.push(0xc3); // true
    } else if (typeof value === 'number') {
      this.encodeNumber(value);
    } else if (typeof value === 'string') {
      this.encodeString(value);
    } else if (Array.isArray(value)) {
      this.encodeArray(value);
    } else if (typeof value === 'object') {
      this.encodeObject(value);
    } else {
      // 其他类型转换为字符串
      this.encodeString(String(value));
    }
  }

  private encodeNumber(num: number): void {
    if (Number.isInteger(num)) {
      if (num >= 0 && num <= 127) {
        this.buffer.push(num); // positive fixint
      } else if (num >= -32 && num < 0) {
        this.buffer.push(0xe0 | (num + 32)); // negative fixint
      } else {
        // 使用32位整数格式
        this.buffer.push(0xce);
        const view = new DataView(new ArrayBuffer(4));
        view.setUint32(0, num, false);
        this.buffer.push(...new Uint8Array(view.buffer));
      }
    } else {
      // 浮点数
      this.buffer.push(0xcb);
      const view = new DataView(new ArrayBuffer(8));
      view.setFloat64(0, num, false);
      this.buffer.push(...new Uint8Array(view.buffer));
    }
  }

  private encodeString(str: string): void {
    const bytes = new TextEncoder().encode(str);
    const len = bytes.length;
    
    if (len <= 31) {
      this.buffer.push(0xa0 | len); // fixstr
    } else if (len <= 255) {
      this.buffer.push(0xd9, len); // str 8
    } else {
      this.buffer.push(0xda);
      const view = new DataView(new ArrayBuffer(2));
      view.setUint16(0, len, false);
      this.buffer.push(...new Uint8Array(view.buffer));
    }
    
    this.buffer.push(...bytes);
  }

  private encodeArray(arr: any[]): void {
    const len = arr.length;
    
    if (len <= 15) {
      this.buffer.push(0x90 | len); // fixarray
    } else {
      this.buffer.push(0xdc);
      const view = new DataView(new ArrayBuffer(2));
      view.setUint16(0, len, false);
      this.buffer.push(...new Uint8Array(view.buffer));
    }
    
    arr.forEach(item => this.encodeValue(item));
  }

  private encodeObject(obj: any): void {
    const entries = Object.entries(obj);
    const len = entries.length;
    
    if (len <= 15) {
      this.buffer.push(0x80 | len); // fixmap
    } else {
      this.buffer.push(0xde);
      const view = new DataView(new ArrayBuffer(2));
      view.setUint16(0, len, false);
      this.buffer.push(...new Uint8Array(view.buffer));
    }
    
    entries.forEach(([key, value]) => {
      this.encodeValue(key);
      this.encodeValue(value);
    });
  }
}

/**
 * 简化的MessagePack解码器
 * Simplified MessagePack decoder
 */
class MessagePackDecoder {
  private buffer!: Uint8Array;
  private offset: number = 0;

  decode(data: Uint8Array): any {
    this.buffer = data;
    this.offset = 0;
    return this.decodeValue();
  }

  private decodeValue(): any {
    if (this.offset >= this.buffer.length) {
      throw new Error('Unexpected end of buffer');
    }
    
    const byte = this.buffer[this.offset++];
    
    if (byte === undefined) {
      throw new Error('Unexpected end of buffer');
    }
    
    // nil, false, true
    if (byte === 0xc0) return null;
    if (byte === 0xc2) return false;
    if (byte === 0xc3) return true;
    
    // positive fixint
    if ((byte & 0x80) === 0) return byte;
    
    // negative fixint
    if ((byte & 0xe0) === 0xe0) return byte - 256;
    
    // fixstr
    if ((byte & 0xe0) === 0xa0) {
      const len = byte & 0x1f;
      return this.decodeString(len);
    }
    
    // fixarray
    if ((byte & 0xf0) === 0x90) {
      const len = byte & 0x0f;
      return this.decodeArray(len);
    }
    
    // fixmap
    if ((byte & 0xf0) === 0x80) {
      const len = byte & 0x0f;
      return this.decodeMap(len);
    }
    
    // 其他格式的简化处理
    switch (byte) {
      case 0xce: // uint32
        return this.decodeUint32();
      case 0xcb: // float64
        return this.decodeFloat64();
      case 0xd9: // str8
        const nextByte = this.buffer[this.offset++];
        if (nextByte === undefined) {
          throw new Error('Unexpected end of buffer');
        }
        return this.decodeString(nextByte);
      case 0xdc: // array16
        return this.decodeArray(this.decodeUint16());
      case 0xde: // map16
        return this.decodeMap(this.decodeUint16());
      default:
        throw new Error(`Unsupported MessagePack format: 0x${byte.toString(16)}`);
    }
  }

  private decodeString(len: number): string {
    const bytes = this.buffer.slice(this.offset, this.offset + len);
    this.offset += len;
    return new TextDecoder().decode(bytes);
  }

  private decodeArray(len: number): any[] {
    const arr = [];
    for (let i = 0; i < len; i++) {
      arr.push(this.decodeValue());
    }
    return arr;
  }

  private decodeMap(len: number): any {
    const obj: any = {};
    for (let i = 0; i < len; i++) {
      const key = this.decodeValue();
      const value = this.decodeValue();
      obj[key] = value;
    }
    return obj;
  }

  private decodeUint16(): number {
    const view = new DataView(this.buffer.buffer, this.offset, 2);
    this.offset += 2;
    return view.getUint16(0, false);
  }

  private decodeUint32(): number {
    const view = new DataView(this.buffer.buffer, this.offset, 4);
    this.offset += 4;
    return view.getUint32(0, false);
  }

  private decodeFloat64(): number {
    const view = new DataView(this.buffer.buffer, this.offset, 8);
    this.offset += 8;
    return view.getFloat64(0, false);
  }
}