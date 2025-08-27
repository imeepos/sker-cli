/**
 * 实用工具函数
 * Utility functions
 */

import type { UDEFMessageImpl } from '../core/message.js';
import { type SkerString, type UUID } from '@sker/types';

/**
 * 深拷贝工具
 * Deep clone utility
 */
export class DeepClone {
  /**
   * 深拷贝对象
   * Deep clone object
   */
  static clone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (obj instanceof Date) {
      return new Date(obj.getTime()) as unknown as T;
    }

    if (obj instanceof Array) {
      return obj.map(item => DeepClone.clone(item)) as unknown as T;
    }

    if (obj instanceof Set) {
      return new Set(Array.from(obj).map(item => DeepClone.clone(item))) as unknown as T;
    }

    if (obj instanceof Map) {
      return new Map(Array.from(obj.entries()).map(([k, v]) => [
        DeepClone.clone(k),
        DeepClone.clone(v)
      ])) as unknown as T;
    }

    if (typeof obj === 'object') {
      const cloned = {} as T;
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          (cloned as any)[key] = DeepClone.clone((obj as any)[key]);
        }
      }
      return cloned;
    }

    return obj;
  }
}

/**
 * 消息比较工具
 * Message comparison utility
 */
export class MessageComparator {
  /**
   * 比较两个消息是否相等
   * Compare if two messages are equal
   */
  static equals(msg1: UDEFMessageImpl, msg2: UDEFMessageImpl): boolean {
    return this.deepEquals(msg1.toObject(), msg2.toObject());
  }

  /**
   * 深度比较两个对象
   * Deep compare two objects
   */
  static deepEquals(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) {
      return true;
    }

    if (obj1 === null || obj2 === null || obj1 === undefined || obj2 === undefined) {
      return obj1 === obj2;
    }

    if (typeof obj1 !== typeof obj2) {
      return false;
    }

    if (obj1 instanceof Date && obj2 instanceof Date) {
      return obj1.getTime() === obj2.getTime();
    }

    if (Array.isArray(obj1) && Array.isArray(obj2)) {
      if (obj1.length !== obj2.length) {
        return false;
      }
      return obj1.every((item, index) => this.deepEquals(item, obj2[index]));
    }

    if (typeof obj1 === 'object') {
      const keys1 = Object.keys(obj1);
      const keys2 = Object.keys(obj2);

      if (keys1.length !== keys2.length) {
        return false;
      }

      return keys1.every(key => this.deepEquals(obj1[key], obj2[key]));
    }

    return false;
  }

  /**
   * 计算消息差异
   * Calculate message differences
   */
  static diff(msg1: UDEFMessageImpl, msg2: UDEFMessageImpl): MessageDiff {
    const obj1 = msg1.toObject();
    const obj2 = msg2.toObject();

    return this.objectDiff('', obj1, obj2);
  }

  /**
   * 对象差异计算
   * Object difference calculation
   */
  private static objectDiff(path: string, obj1: any, obj2: any): MessageDiff {
    const added: string[] = [];
    const removed: string[] = [];
    const changed: Array<{ path: string; oldValue: any; newValue: any }> = [];

    if (obj1 === null || obj1 === undefined) {
      if (obj2 !== null && obj2 !== undefined) {
        added.push(path);
      }
      return { added, removed, changed };
    }

    if (obj2 === null || obj2 === undefined) {
      removed.push(path);
      return { added, removed, changed };
    }

    if (typeof obj1 !== 'object' || typeof obj2 !== 'object') {
      if (obj1 !== obj2) {
        changed.push({ path, oldValue: obj1, newValue: obj2 });
      }
      return { added, removed, changed };
    }

    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);

    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (!(key in obj1)) {
        added.push(fullPath);
      } else if (!(key in obj2)) {
        removed.push(fullPath);
      } else {
        const subDiff = this.objectDiff(fullPath, val1, val2);
        added.push(...subDiff.added);
        removed.push(...subDiff.removed);
        changed.push(...subDiff.changed);
      }
    }

    return { added, removed, changed };
  }
}

export interface MessageDiff {
  added: string[];
  removed: string[];
  changed: Array<{ path: string; oldValue: any; newValue: any }>;
}

/**
 * 路径操作工具
 * Path manipulation utility
 */
export class PathUtils {
  /**
   * 获取嵌套对象的值
   * Get nested object value
   */
  static get(obj: any, path: string): any {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[key];
    }

    return current;
  }

  /**
   * 设置嵌套对象的值
   * Set nested object value
   */
  static set(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key];
    }

    current[lastKey] = value;
  }

  /**
   * 删除嵌套对象的值
   * Delete nested object value
   */
  static delete(obj: any, path: string): boolean {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    let current = obj;

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        return false;
      }
      current = current[key];
    }

    if (lastKey in current) {
      delete current[lastKey];
      return true;
    }

    return false;
  }

  /**
   * 检查路径是否存在
   * Check if path exists
   */
  static has(obj: any, path: string): boolean {
    const keys = path.split('.');
    let current = obj;

    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object' || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }
}

/**
 * 格式化工具
 * Formatting utility
 */
export class Formatter {
  /**
   * 格式化字节大小
   * Format byte size
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化持续时间
   * Format duration
   */
  static formatDuration(milliseconds: number): string {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }

    const seconds = Math.floor(milliseconds / 1000);
    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `${minutes}m ${seconds % 60}s`;
    }

    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  }

  /**
   * 格式化消息摘要
   * Format message summary
   */
  static formatMessageSummary(message: UDEFMessageImpl): string {
    const timestamp = message.envelope.header.timestamp.toISOString();
    const messageType = message.messageType;
    const messageId = message.messageId.substring(0, 8);
    const dataSize = this.formatBytes(message.getSize());

    return `${messageType}[${messageId}...] ${timestamp} (${dataSize})`;
  }
}

/**
 * 验证工具
 * Validation utility
 */
export class ValidationUtils {
  /**
   * 验证UUID格式
   * Validate UUID format
   */
  static isValidUUID(value: string): value is UUID {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * 验证邮箱格式
   * Validate email format
   */
  static isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * 验证URL格式
   * Validate URL format
   */
  static isValidURL(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证JSON格式
   * Validate JSON format
   */
  static isValidJSON(value: string): boolean {
    try {
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证语义化版本格式
   * Validate semantic version format
   */
  static isValidSemanticVersion(value: string): boolean {
    const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
    return semverRegex.test(value);
  }
}

/**
 * 性能监控工具
 * Performance monitoring utility
 */
export class PerformanceMonitor {
  private static timers: Map<string, number> = new Map();

  /**
   * 开始计时
   * Start timing
   */
  static start(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * 结束计时并返回耗时
   * End timing and return duration
   */
  static end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      throw new Error(`Timer "${label}" was not started`);
    }

    const duration = Date.now() - startTime;
    this.timers.delete(label);
    return duration;
  }

  /**
   * 测量函数执行时间
   * Measure function execution time
   */
  static async measure<T>(label: string, fn: () => Promise<T> | T): Promise<{ result: T; duration: number }> {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;

    return { result, duration };
  }

  /**
   * 创建性能报告
   * Create performance report
   */
  static createReport(measurements: Array<{ label: string; duration: number }>): string {
    const totalDuration = measurements.reduce((sum, m) => sum + m.duration, 0);
    
    let report = `Performance Report (Total: ${Formatter.formatDuration(totalDuration)}):\n`;
    report += '='.repeat(50) + '\n';

    measurements
      .sort((a, b) => b.duration - a.duration)
      .forEach(({ label, duration }) => {
        const percentage = totalDuration > 0 ? ((duration / totalDuration) * 100).toFixed(1) : '0.0';
        report += `${label.padEnd(30)} ${Formatter.formatDuration(duration).padStart(8)} (${percentage}%)\n`;
      });

    return report;
  }
}

/**
 * 调试工具
 * Debug utility
 */
export class DebugUtils {
  private static debugEnabled = false;

  /**
   * 启用调试模式
   * Enable debug mode
   */
  static enable(): void {
    this.debugEnabled = true;
  }

  /**
   * 禁用调试模式
   * Disable debug mode
   */
  static disable(): void {
    this.debugEnabled = false;
  }

  /**
   * 调试日志
   * Debug log
   */
  static log(message: string, ...args: any[]): void {
    if (this.debugEnabled) {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, ...args);
    }
  }

  /**
   * 转储对象为调试信息
   * Dump object for debugging
   */
  static dump(label: string, obj: any): void {
    if (this.debugEnabled) {
      console.log(`[DEBUG] ${label}:`, JSON.stringify(obj, null, 2));
    }
  }

  /**
   * 创建消息调试信息
   * Create message debug info
   */
  static dumpMessage(message: UDEFMessageImpl): void {
    if (this.debugEnabled) {
      const info = {
        messageId: message.messageId,
        messageType: message.messageType,
        contentType: message.contentType,
        timestamp: message.envelope.header.timestamp,
        dataSize: message.getSize(),
        data: message.getData()
      };

      this.dump('UDEF Message', info);
    }
  }
}