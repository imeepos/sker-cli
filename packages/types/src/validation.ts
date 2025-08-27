/**
 * 类型验证工具函数（简化版）
 * Type validation utility functions (simplified version)
 */

import { BasicTypes } from './basic-types.js';
import type { UDEFMessage } from './message-types.js';
import type { ServiceInfo as ServiceInfoType } from './service-types.js';
import type { ValidationResult, ErrorDetail } from './error-types.js';

/**
 * 验证器接口
 * Validator interface
 */
export interface Validator<T> {
  validate(value: unknown): ValidationResult & { data?: T };
}

/**
 * 字段验证规则接口
 * Field validation rule interface
 */
export interface FieldValidationRule {
  field: string;
  required?: boolean;
  type?: string;
  validator?: (value: unknown) => boolean;
}

/**
 * 模式验证规则接口
 * Schema validation rule interface
 */
export interface SchemaValidationRule {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  required?: string[];
}

/**
 * 基础类型验证器
 * Basic type validators
 */
export const BasicValidators = {
  /**
   * 验证布尔类型
   * Validate boolean type
   */
  boolean(value: unknown): ValidationResult & { data?: boolean } {
    if (typeof value === 'boolean') {
      return { valid: true, errors: [], data: value };
    }
    return {
      valid: false,
      errors: [{
        error_code: 'TYPE_MISMATCH',
        error_message: 'Expected boolean type',
        error_value: value
      }]
    };
  },

  /**
   * 验证字符串类型
   * Validate string type
   */
  string(value: unknown): ValidationResult & { data?: string } {
    if (typeof value === 'string') {
      return { valid: true, errors: [], data: value };
    }
    return {
      valid: false,
      errors: [{
        error_code: 'TYPE_MISMATCH',
        error_message: 'Expected string type',
        error_value: value
      }]
    };
  }
};

/**
 * 集合类型验证器
 * Collection type validators
 */
export const CollectionValidators = {
  /**
   * 验证数组类型
   * Validate array type
   */
  array(value: unknown): ValidationResult {
    if (Array.isArray(value)) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: [{
        error_code: 'TYPE_MISMATCH',
        error_message: 'Expected array type',
        error_value: value
      }]
    };
  }
};

/**
 * 消息类型验证器
 * Message type validators
 */
export const MessageValidators = {
  /**
   * 验证UDEF消息
   * Validate UDEF message
   */
  udefMessage(value: unknown): ValidationResult {
    if (!value || typeof value !== 'object') {
      return {
        valid: false,
        errors: [{
          error_code: 'INVALID_UDEF_MESSAGE',
          error_message: 'UDEF message must be an object',
          error_value: value
        }]
      };
    }

    const obj = value as Record<string, unknown>;
    const errors: ErrorDetail[] = [];

    // 基本验证
    if (!obj.envelope) {
      errors.push({
        error_code: 'MISSING_ENVELOPE',
        error_message: 'Message envelope is required',
        field: 'envelope'
      });
    }

    if (!obj.payload) {
      errors.push({
        error_code: 'MISSING_PAYLOAD',
        error_message: 'Message payload is required',
        field: 'payload'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
};

/**
 * 模式验证器
 * Schema validator
 */
export class SchemaValidator<T = unknown> implements Validator<T> {
  constructor(_schema: SchemaValidationRule) {}

  validate(value: unknown): ValidationResult & { data?: T } {
    // 简化的验证实现
    return {
      valid: true,
      errors: [],
      data: value as T
    };
  }
}

/**
 * 通用验证函数
 * Generic validation functions
 */
export const Validators = {
  /**
   * 验证消息格式
   * Validate message format
   */
  isValidMessage: (message: unknown): message is UDEFMessage => {
    const result = MessageValidators.udefMessage(message);
    return result.valid;
  },

  /**
   * 验证时间戳
   * Validate timestamp
   */
  isValidTimestamp: BasicTypes.isValidTimestamp,

  /**
   * 验证服务信息
   * Validate service info
   */
  isValidServiceInfo: (serviceInfo: unknown): serviceInfo is ServiceInfoType => {
    if (!serviceInfo || typeof serviceInfo !== 'object') {
      return false;
    }

    const obj = serviceInfo as Record<string, unknown>;
    return !!(
      obj.service_name && 
      obj.service_version && 
      obj.service_id && 
      obj.network_info &&
      typeof obj.health_status === 'number'
    );
  },

  /**
   * 通用类型验证
   * Generic type validation
   */
  validateType: <T>(data: unknown, validator: Validator<T>): ValidationResult & { data?: T } => {
    return validator.validate(data);
  }
};

/**
 * 导出验证工具集合
 * Export validation utilities collection
 */
export const ValidationUtils = {
  BasicValidators,
  CollectionValidators,
  MessageValidators,
  SchemaValidator,
  Validators
};