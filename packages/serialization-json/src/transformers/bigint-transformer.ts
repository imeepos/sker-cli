/**
 * BigInt数据转换器
 */

import {
  Transformer,
  TransformContext,
  BigIntTransformConfig
} from '../types/serializer-types.js';
import { DATA_TYPE_CONSTANTS } from '../constants/json-constants.js';

/**
 * BigInt转换器
 */
export class BigIntTransformer implements Transformer<bigint, string | number> {
  readonly type = 'bigint';
  private config: Required<BigIntTransformConfig>;

  constructor(config?: BigIntTransformConfig | boolean) {
    if (typeof config === 'boolean') {
      config = config ? {} : { format: 'string' as const };
    }

    this.config = {
      format: config?.format ?? 'string',
      prefix: config?.prefix ?? ''
    };
  }

  /**
   * 序列化BigInt
   */
  serialize(value: bigint, context: TransformContext): string | number {
    if (this.config.format === 'number') {
      // 检查数值范围
      if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
        throw new Error(`BigInt value ${value} is outside safe integer range for number format`);
      }
      return Number(value);
    }

    // 字符串格式
    const stringValue = value.toString();
    return this.config.prefix ? 
      `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT}${this.config.prefix}${stringValue}` :
      `${DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT}${stringValue}`;
  }

  /**
   * 反序列化BigInt
   */
  deserialize(value: string | number, context: TransformContext): bigint {
    if (typeof value === 'number') {
      return BigInt(value);
    }

    if (typeof value === 'string') {
      let numericString = value;

      // 移除类型标记
      if (value.startsWith(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT)) {
        numericString = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT.length);
      }

      // 移除前缀
      if (this.config.prefix && numericString.startsWith(this.config.prefix)) {
        numericString = numericString.slice(this.config.prefix.length);
      }

      try {
        return BigInt(numericString);
      } catch (error) {
        throw new Error(`Invalid BigInt string: ${numericString}`);
      }
    }

    throw new Error(`Cannot deserialize BigInt from ${typeof value}`);
  }

  /**
   * 检查是否可以转换
   */
  canTransform(value: any): value is bigint {
    return typeof value === 'bigint';
  }

  /**
   * 验证反序列化值
   */
  canDeserialize(value: any): boolean {
    if (typeof value === 'number') {
      return Number.isInteger(value);
    }

    if (typeof value === 'string') {
      // 检查是否有BigInt标记
      if (value.startsWith(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT)) {
        const numericPart = value.slice(DATA_TYPE_CONSTANTS.TYPE_MARKERS.BIGINT.length);
        return this.isValidBigIntString(numericPart);
      }

      // 检查是否为纯数字字符串
      return this.isValidBigIntString(value);
    }

    return false;
  }

  /**
   * 检查是否为有效的BigInt字符串
   */
  private isValidBigIntString(str: string): boolean {
    if (!str) return false;
    
    // 移除前缀（如果有）
    let cleanStr = str;
    if (this.config.prefix && str.startsWith(this.config.prefix)) {
      cleanStr = str.slice(this.config.prefix.length);
    }

    // 检查是否为有效数字字符串
    return /^[+-]?\d+$/.test(cleanStr);
  }

  /**
   * 获取配置
   */
  getConfig(): Required<BigIntTransformConfig> {
    return { ...this.config };
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<BigIntTransformConfig>): void {
    this.config = { ...this.config, ...config };
  }
}