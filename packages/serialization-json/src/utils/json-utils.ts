/**
 * JSON工具函数
 */

import { createHash } from 'crypto';
import { REGEX_PATTERNS, SECURITY_CONSTANTS } from '../constants/json-constants.js';

/**
 * 安全的JSON解析
 */
export function safeJSONParse<T = any>(jsonString: string, reviver?: (this: any, key: string, value: any) => any): T {
  // 检查字符串长度
  if (jsonString.length > SECURITY_CONSTANTS.MAX_STRING_LENGTH) {
    throw new Error('JSON string too large');
  }

  // 检查危险模式
  for (const pattern of SECURITY_CONSTANTS.DANGEROUS_PATTERNS) {
    if (pattern.test(jsonString)) {
      throw new Error('Potentially dangerous content detected');
    }
  }

  try {
    return JSON.parse(jsonString, reviver);
  } catch (error) {
    throw new Error(`JSON parse failed: ${(error as Error).message}`);
  }
}

/**
 * 安全的JSON字符串化
 */
export function safeJSONStringify(
  value: any,
  replacer?: (this: any, key: string, value: any) => any | (number | string)[] | null,
  space?: string | number,
  maxDepth = SECURITY_CONSTANTS.MAX_OBJECT_DEPTH
): string {
  // 检查对象深度
  checkObjectDepth(value, maxDepth);
  
  try {
    return JSON.stringify(value, replacer, space);
  } catch (error) {
    throw new Error(`JSON stringify failed: ${(error as Error).message}`);
  }
}

/**
 * 检查对象深度
 */
export function checkObjectDepth(obj: any, maxDepth = SECURITY_CONSTANTS.MAX_OBJECT_DEPTH, currentDepth = 0): void {
  if (currentDepth > maxDepth) {
    throw new Error(`Object depth exceeds maximum allowed depth of ${maxDepth}`);
  }

  if (obj === null || typeof obj !== 'object') {
    return;
  }

  if (Array.isArray(obj)) {
    if (obj.length > SECURITY_CONSTANTS.MAX_ARRAY_LENGTH) {
      throw new Error(`Array length exceeds maximum allowed length of ${SECURITY_CONSTANTS.MAX_ARRAY_LENGTH}`);
    }
    
    for (const item of obj) {
      checkObjectDepth(item, maxDepth, currentDepth + 1);
    }
  } else {
    const keys = Object.keys(obj);
    if (keys.length > SECURITY_CONSTANTS.MAX_PROPERTY_COUNT) {
      throw new Error(`Object property count exceeds maximum allowed count of ${SECURITY_CONSTANTS.MAX_PROPERTY_COUNT}`);
    }
    
    for (const key of keys) {
      checkObjectDepth(obj[key], maxDepth, currentDepth + 1);
    }
  }
}

/**
 * 计算JSON字符串的哈希值
 */
export function calculateJSONHash(jsonString: string, algorithm = 'sha256'): string {
  return createHash(algorithm).update(jsonString, 'utf8').digest('hex');
}

/**
 * 比较两个JSON对象是否相等
 */
export function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 == null || obj2 == null) {
    return obj1 === obj2;
  }

  if (typeof obj1 !== typeof obj2) {
    return false;
  }

  if (typeof obj1 === 'object') {
    if (Array.isArray(obj1) !== Array.isArray(obj2)) {
      return false;
    }

    if (Array.isArray(obj1)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      
      for (let i = 0; i < obj1.length; i++) {
        if (!deepEqual(obj1[i], obj2[i])) {
          return false;
        }
      }
      
      return true;
    }

    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    if (keys1.length !== keys2.length) {
      return false;
    }

    for (const key of keys1) {
      if (!keys2.includes(key)) {
        return false;
      }
      
      if (!deepEqual(obj1[key], obj2[key])) {
        return false;
      }
    }

    return true;
  }

  return false;
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as T;
  }

  if (obj instanceof RegExp) {
    return new RegExp(obj) as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepClone(item)) as T;
  }

  const cloned = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      (cloned as any)[key] = deepClone((obj as any)[key]);
    }
  }

  return cloned;
}

/**
 * 压缩JSON字符串（移除空白字符）
 */
export function compactJSON(jsonString: string): string {
  try {
    return JSON.stringify(JSON.parse(jsonString));
  } catch (error) {
    throw new Error(`Failed to compact JSON: ${(error as Error).message}`);
  }
}

/**
 * 格式化JSON字符串
 */
export function formatJSON(jsonString: string, space: string | number = 2): string {
  try {
    return JSON.stringify(JSON.parse(jsonString), null, space);
  } catch (error) {
    throw new Error(`Failed to format JSON: ${(error as Error).message}`);
  }
}

/**
 * 验证JSON字符串格式
 */
export function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取JSON对象的大小（字节）
 */
export function getJSONSize(obj: any): number {
  return Buffer.byteLength(JSON.stringify(obj), 'utf8');
}

/**
 * 扁平化嵌套对象
 */
export function flattenObject(obj: any, prefix = '', separator = '.'): Record<string, any> {
  const flattened: Record<string, any> = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}${separator}${key}` : key;
      const value = obj[key];

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, flattenObject(value, newKey, separator));
      } else {
        flattened[newKey] = value;
      }
    }
  }

  return flattened;
}

/**
 * 反扁平化对象
 */
export function unflattenObject(flattened: Record<string, any>, separator = '.'): any {
  const result: any = {};

  for (const key in flattened) {
    if (flattened.hasOwnProperty(key)) {
      const keys = key.split(separator);
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        const k = keys[i]!;
        if (!(k in current)) {
          current[k] = {};
        }
        current = current[k];
      }

      current[keys[keys.length - 1]!] = flattened[key];
    }
  }

  return result;
}

/**
 * 过滤对象属性
 */
export function filterObjectProperties(obj: any, predicate: (key: string, value: any) => boolean): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => filterObjectProperties(item, predicate));
  }

  const filtered: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && predicate(key, obj[key])) {
      filtered[key] = filterObjectProperties(obj[key], predicate);
    }
  }

  return filtered;
}

/**
 * 移除对象中的空值
 */
export function removeEmptyValues(obj: any): any {
  return filterObjectProperties(obj, (key, value) => {
    if (value === null || value === undefined || value === '') {
      return false;
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return false;
    }
    
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return false;
    }
    
    return true;
  });
}

/**
 * 合并多个对象
 */
export function mergeObjects(...objects: any[]): any {
  const result: any = {};

  for (const obj of objects) {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            result[key] = mergeObjects(result[key] || {}, obj[key]);
          } else {
            result[key] = obj[key];
          }
        }
      }
    }
  }

  return result;
}

/**
 * 获取对象的路径值
 */
export function getNestedValue(obj: any, path: string, separator = '.'): any {
  const keys = path.split(separator);
  let current = obj;

  for (const key of keys) {
    if (current === null || current === undefined || !(key in current)) {
      return undefined;
    }
    current = current[key];
  }

  return current;
}

/**
 * 设置对象的路径值
 */
export function setNestedValue(obj: any, path: string, value: any, separator = '.'): void {
  const keys = path.split(separator);
  let current = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]!;
    if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]!] = value;
}

/**
 * 检查是否为日期字符串
 */
export function isDateString(str: string): boolean {
  return REGEX_PATTERNS.ISO_DATE.test(str);
}

/**
 * 检查是否为数字字符串
 */
export function isNumericString(str: string): boolean {
  return REGEX_PATTERNS.INTEGER.test(str) || REGEX_PATTERNS.FLOAT.test(str) || REGEX_PATTERNS.SCIENTIFIC.test(str);
}

/**
 * 检查是否为UUID
 */
export function isUUID(str: string): boolean {
  return REGEX_PATTERNS.UUID.test(str);
}

/**
 * 检查是否为Base64字符串
 */
export function isBase64(str: string): boolean {
  return REGEX_PATTERNS.BASE64.test(str);
}

/**
 * 智能类型转换
 */
export function smartTypeConversion(value: any): any {
  if (typeof value === 'string') {
    // 尝试转换为数字
    if (isNumericString(value)) {
      const num = Number(value);
      if (!isNaN(num)) {
        return num;
      }
    }

    // 尝试转换为布尔值
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // 尝试转换为日期
    if (isDateString(value)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
  }

  return value;
}

/**
 * 计算对象内存占用大小（估算）
 */
export function estimateMemoryUsage(obj: any): number {
  let bytes = 0;

  function calculateBytes(value: any, visited = new WeakSet()): void {
    if (value === null || value === undefined) {
      bytes += 4; // null/undefined 占用
      return;
    }

    if (typeof value === 'boolean') {
      bytes += 4;
      return;
    }

    if (typeof value === 'number') {
      bytes += 8; // 64-bit number
      return;
    }

    if (typeof value === 'string') {
      bytes += value.length * 2; // UTF-16
      return;
    }

    if (typeof value === 'object') {
      if (visited.has(value)) {
        return; // 避免循环引用
      }
      visited.add(value);

      if (Array.isArray(value)) {
        bytes += 24; // Array对象基础开销
        value.forEach(item => calculateBytes(item, visited));
      } else {
        bytes += 24; // Object对象基础开销
        Object.entries(value).forEach(([key, val]) => {
          bytes += key.length * 2; // 键名占用
          calculateBytes(val, visited);
        });
      }

      visited.delete(value);
    }
  }

  calculateBytes(obj);
  return bytes;
}