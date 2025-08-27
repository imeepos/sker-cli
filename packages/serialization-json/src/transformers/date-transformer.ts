/**
 * Date数据转换器
 */

import {
  Transformer,
  TransformContext,
  DateTransformConfig
} from '../types/serializer-types.js';
import { DATA_TYPE_CONSTANTS, REGEX_PATTERNS } from '../constants/json-constants.js';

/**
 * Date转换器
 */
export class DateTransformer implements Transformer<Date, string | number | object> {
  readonly type = 'date';
  private config: Required<DateTransformConfig>;

  constructor(config?: DateTransformConfig | string) {
    if (typeof config === 'string') {
      config = { format: config as 'iso' | 'timestamp' | 'custom' };
    }

    this.config = {
      format: config?.format ?? 'iso',
      timezone: config?.timezone ?? 'UTC',
      customFormat: config?.customFormat ?? ''
    };
  }

  /**
   * 序列化Date
   */
  serialize(value: Date, context: TransformContext): string | number | object {
    if (isNaN(value.getTime())) {
      throw new Error('Invalid Date object');
    }

    switch (this.config.format) {
      case 'iso':
        return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE}${value.toISOString()}`;

      case 'timestamp':
        return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE}${value.getTime()}`;

      case 'custom':
        if (this.config.customFormat) {
          return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE}${this.formatCustomDate(value)}`;
        }
        // 回退到ISO格式
        return `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE}${value.toISOString()}`;

      default:
        // 详细对象格式
        return {
          __type: 'Date',
          iso: value.toISOString(),
          timestamp: value.getTime(),
          timezone: this.getTimezone(value),
          year: value.getFullYear(),
          month: value.getMonth() + 1,
          day: value.getDate(),
          hour: value.getHours(),
          minute: value.getMinutes(),
          second: value.getSeconds(),
          millisecond: value.getMilliseconds()
        };
    }
  }

  /**
   * 反序列化Date
   */
  deserialize(value: string | number | object, context: TransformContext): Date {
    // 处理对象格式
    if (typeof value === 'object' && value !== null) {
      const obj = value as any;
      if (obj.__type === 'Date') {
        // 优先使用ISO字符串
        if (obj.iso) {
          return new Date(obj.iso);
        }
        // 使用时间戳
        if (typeof obj.timestamp === 'number') {
          return new Date(obj.timestamp);
        }
        // 使用组合字段
        if (obj.year !== undefined) {
          return new Date(
            obj.year,
            (obj.month || 1) - 1, // 月份从0开始
            obj.day || 1,
            obj.hour || 0,
            obj.minute || 0,
            obj.second || 0,
            obj.millisecond || 0
          );
        }
      }
      throw new Error('Invalid Date object format');
    }

    // 处理字符串格式
    if (typeof value === 'string') {
      let dateString = value;

      // 移除类型标记
      if (value.startsWith(DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE)) {
        dateString = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE.length);
      }

      // 尝试解析不同格式
      let date: Date;

      // ISO格式
      if (REGEX_PATTERNS.ISO_DATE.test(dateString)) {
        date = new Date(dateString);
      }
      // 时间戳字符串
      else if (REGEX_PATTERNS.DATE_TIMESTAMP.test(dateString)) {
        date = new Date(parseInt(dateString, 10));
      }
      // 自定义格式
      else if (this.config.customFormat) {
        date = this.parseCustomDate(dateString);
      }
      // 通用日期字符串
      else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date string: ${dateString}`);
      }

      return date;
    }

    // 处理数字格式（时间戳）
    if (typeof value === 'number') {
      const date = new Date(value);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid timestamp: ${value}`);
      }
      return date;
    }

    throw new Error(`Cannot deserialize Date from ${typeof value}`);
  }

  /**
   * 检查是否可以转换
   */
  canTransform(value: any): value is Date {
    return value instanceof Date;
  }

  /**
   * 验证反序列化值
   */
  canDeserialize(value: any): boolean {
    // 数字（时间戳）
    if (typeof value === 'number') {
      return !isNaN(value) && isFinite(value) && value >= 0;
    }

    // 字符串
    if (typeof value === 'string') {
      // 检查Date标记
      if (value.startsWith(DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE)) {
        const datePart = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.DATE.length);
        return this.isValidDateString(datePart);
      }

      // 直接检查字符串
      return this.isValidDateString(value);
    }

    // 对象
    if (typeof value === 'object' && value !== null) {
      const obj = value as any;
      return obj.__type === 'Date' && (
        typeof obj.iso === 'string' ||
        typeof obj.timestamp === 'number' ||
        typeof obj.year === 'number'
      );
    }

    return false;
  }

  /**
   * 检查是否为有效日期字符串
   */
  private isValidDateString(str: string): boolean {
    if (!str) return false;

    // ISO格式
    if (REGEX_PATTERNS.ISO_DATE.test(str)) {
      return !isNaN(Date.parse(str));
    }

    // 时间戳格式
    if (REGEX_PATTERNS.DATE_TIMESTAMP.test(str)) {
      const timestamp = parseInt(str, 10);
      return !isNaN(new Date(timestamp).getTime());
    }

    // 通用日期字符串
    return !isNaN(Date.parse(str));
  }

  /**
   * 获取时区信息
   */
  private getTimezone(date: Date): string {
    if (this.config.timezone === 'UTC') {
      return 'UTC';
    }

    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return 'UTC';
    }
  }

  /**
   * 自定义格式化
   */
  private formatCustomDate(date: Date): string {
    if (!this.config.customFormat) {
      return date.toISOString();
    }

    let format = this.config.customFormat;
    
    // 支持的格式化标记
    const replacements: { [key: string]: string } = {
      'YYYY': date.getFullYear().toString(),
      'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
      'DD': date.getDate().toString().padStart(2, '0'),
      'HH': date.getHours().toString().padStart(2, '0'),
      'mm': date.getMinutes().toString().padStart(2, '0'),
      'ss': date.getSeconds().toString().padStart(2, '0'),
      'SSS': date.getMilliseconds().toString().padStart(3, '0')
    };

    for (const [token, replacement] of Object.entries(replacements)) {
      format = format.replace(new RegExp(token, 'g'), replacement);
    }

    return format;
  }

  /**
   * 自定义解析
   */
  private parseCustomDate(dateString: string): Date {
    if (!this.config.customFormat) {
      return new Date(dateString);
    }

    // 这里实现自定义格式的解析逻辑
    // 简化实现，实际应该根据customFormat进行严格解析
    const patterns = [
      /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{4})\/(\d{2})\/(\d{2}) (\d{2}):(\d{2}):(\d{2})$/,
      /^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2}):(\d{2})$/
    ];

    for (const pattern of patterns) {
      const match = dateString.match(pattern);
      if (match) {
        const [, year, month, day, hour, minute, second] = match.map(Number);
        return new Date(
          year || 1970, 
          (month || 1) - 1, 
          day || 1, 
          hour || 0, 
          minute || 0, 
          second || 0
        );
      }
    }

    // 回退到通用解析
    return new Date(dateString);
  }

  /**
   * 获取配置
   */
  getConfig(): Required<DateTransformConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<DateTransformConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * 支持的格式列表
   */
  static getSupportedFormats(): string[] {
    return ['iso', 'timestamp', 'custom', 'detailed'];
  }

  /**
   * 创建预设配置
   */
  static createPreset(preset: 'iso' | 'timestamp' | 'readable' | 'compact'): DateTransformConfig {
    switch (preset) {
      case 'iso':
        return { format: 'iso', timezone: 'UTC' };
      
      case 'timestamp':
        return { format: 'timestamp', timezone: 'UTC' };
      
      case 'readable':
        return { 
          format: 'custom', 
          customFormat: 'YYYY-MM-DD HH:mm:ss',
          timezone: 'local' 
        };
      
      case 'compact':
        return { 
          format: 'custom', 
          customFormat: 'YYYYMMDDHHMMSS',
          timezone: 'UTC' 
        };
      
      default:
        return { format: 'iso', timezone: 'UTC' };
    }
  }
}