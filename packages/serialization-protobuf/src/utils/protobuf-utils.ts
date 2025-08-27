import Long from 'long';
import { Type, Root, Field, Enum } from 'protobufjs';
import { gzipSync, gunzipSync } from 'zlib';
import pako from 'pako';
import { PROTOBUF_CONSTANTS } from '../constants/protobuf-constants.js';
import { CompressionAlgorithm } from '../types/protobuf-types.js';

/**
 * Protocol Buffers工具函数集合
 */

/**
 * 压缩数据
 */
export type CompressDataLevel = -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | undefined
export function compressData(data: Uint8Array, algorithm: CompressionAlgorithm = 'gzip', level: CompressDataLevel = 6): Uint8Array {
  switch (algorithm) {
    case 'gzip':
      return pako.gzip(data, { level });
    case 'lz4':
      // Note: lz4js implementation would go here
      // For now, return original data
      console.warn('LZ4 compression not yet implemented, returning uncompressed data');
      return data;
    case 'brotli':
      // Note: Brotli implementation would go here
      console.warn('Brotli compression not yet implemented, using gzip');
      return pako.gzip(data, { level });
    case 'snappy':
      // Note: Snappy implementation would go here
      console.warn('Snappy compression not yet implemented, using gzip');
      return pako.gzip(data, { level });
    case 'none':
    default:
      return data;
  }
}

/**
 * 解压数据
 */
export function decompressData(data: Uint8Array, algorithm: CompressionAlgorithm = 'gzip'): Uint8Array {
  switch (algorithm) {
    case 'gzip':
      return pako.ungzip(data);
    case 'lz4':
      console.warn('LZ4 decompression not yet implemented, returning original data');
      return data;
    case 'brotli':
      console.warn('Brotli decompression not yet implemented, using gzip');
      return pako.ungzip(data);
    case 'snappy':
      console.warn('Snappy decompression not yet implemented, using gzip');
      return pako.ungzip(data);
    case 'none':
    default:
      return data;
  }
}

/**
 * 计算CRC32校验和
 */
export function calculateCRC32(data: Uint8Array): number {
  let crc = 0xffffffff;
  const table = getCRC32Table();

  for (let i = 0; i < data.length; i++) {
    const val = data[i]!
    crc = (crc >>> 8) ^ table[(crc ^ val) & 0xff]!;
  }

  return (crc ^ 0xffffffff) >>> 0;
}

let crc32Table: Uint32Array | null = null;

function getCRC32Table(): Uint32Array {
  if (crc32Table) return crc32Table;

  crc32Table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let crc = i;
    for (let j = 0; j < 8; j++) {
      crc = crc & 1 ? (0xedb88320 ^ (crc >>> 1)) : (crc >>> 1);
    }
    crc32Table[i] = crc;
  }

  return crc32Table;
}

/**
 * 计算MD5哈希
 */
export function calculateMD5(data: Uint8Array): string {
  // Note: This would require a proper MD5 implementation
  // For now, return a simple hash
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const val = data[i]!
    hash = ((hash << 5) - hash + val) & 0xffffffff;
  }
  return hash.toString(16);
}

/**
 * 验证Schema版本格式
 */
export function validateSchemaVersion(version: string): boolean {
  return PROTOBUF_CONSTANTS.SCHEMA_VERSION.PATTERN.test(version);
}

/**
 * 比较Schema版本
 */
export function compareSchemaVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);

  for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;

    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }

  return 0;
}

/**
 * 生成Schema哈希
 */
export function generateSchemaHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16);
}

/**
 * 转换JavaScript类型到Protocol Buffers类型
 */
export function convertJSTypeToProtoType(value: any): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value === 'bigint') {
    return Long.fromBigInt(value);
  }

  if (value instanceof Date) {
    return {
      seconds: Math.floor(value.getTime() / 1000),
      nanos: (value.getTime() % 1000) * 1000000
    };
  }

  if (value instanceof Map) {
    const obj: Record<string, any> = {};
    for (const [key, val] of value.entries()) {
      obj[key] = convertJSTypeToProtoType(val);
    }
    return obj;
  }

  if (Array.isArray(value)) {
    return value.map(convertJSTypeToProtoType);
  }

  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertJSTypeToProtoType(val);
    }
    return result;
  }

  return value;
}

/**
 * 转换Protocol Buffers类型到JavaScript类型
 */
export function convertProtoTypeToJSType(value: any, field?: Field): any {
  if (value === null || value === undefined) {
    return value;
  }

  if (Long.isLong(value)) {
    return value.toBigInt();
  }

  if (field?.type === 'google.protobuf.Timestamp' && typeof value === 'object') {
    const seconds = value.seconds || 0;
    const nanos = value.nanos || 0;
    return new Date(seconds * 1000 + Math.floor(nanos / 1000000));
  }

  if (field?.type === 'bytes' && value instanceof Uint8Array) {
    return value;
  }

  if (field?.map && typeof value === 'object') {
    const map = new Map();
    for (const [key, val] of Object.entries(value)) {
      map.set(key, convertProtoTypeToJSType(val));
    }
    return map;
  }

  if (Array.isArray(value)) {
    return value.map(val => convertProtoTypeToJSType(val, field));
  }

  if (typeof value === 'object') {
    const result: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      result[key] = convertProtoTypeToJSType(val);
    }
    return result;
  }

  return value;
}

/**
 * 验证字段值
 */
export function validateFieldValue(value: any, field: Field): boolean {
  if (field.required && (value === null || value === undefined)) {
    return false;
  }

  if (value === null || value === undefined) {
    return !field.required;
  }

  switch (field.type) {
    case 'double':
    case 'float':
      return typeof value === 'number' && isFinite(value);

    case 'int32':
    case 'sint32':
    case 'sfixed32':
      return Number.isInteger(value) && value >= -2147483648 && value <= 2147483647;

    case 'uint32':
    case 'fixed32':
      return Number.isInteger(value) && value >= 0 && value <= 4294967295;

    case 'int64':
    case 'sint64':
    case 'sfixed64':
    case 'uint64':
    case 'fixed64':
      return typeof value === 'bigint' || Long.isLong(value) ||
        (Number.isInteger(value) && Number.isSafeInteger(value));

    case 'bool':
      return typeof value === 'boolean';

    case 'string':
      return typeof value === 'string';

    case 'bytes':
      return value instanceof Uint8Array || typeof value === 'string';

    default:
      return true; // For custom types, assume valid
  }
}

/**
 * 格式化字节大小
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * 创建延迟Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        await delay(delayMs * attempt);
      }
    }
  }

  throw lastError!;
}

/**
 * 创建超时Promise
 */
export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

/**
 * 生成唯一ID
 */
export function generateId(prefix = 'proto'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深度合并对象
 */
export function deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target };

  for (const source of sources) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const sourceValue = source[key]!;
        const targetValue = result[key]!;

        if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
          result[key] = deepMerge(targetValue, sourceValue);
        } else {
          result[key] = sourceValue as any;
        }
      }
    }
  }

  return result;
}

function isPlainObject(obj: any): obj is Record<string, any> {
  return obj !== null && typeof obj === 'object' && obj.constructor === Object;
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const remaining = wait - (now - previous);

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      func.apply(this, args);
    } else if (!timeout) {
      timeout = setTimeout(() => {
        previous = Date.now();
        timeout = null;
        func.apply(this, args);
      }, remaining);
    }
  };
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}