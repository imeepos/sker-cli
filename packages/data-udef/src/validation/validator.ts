/**
 * Schema验证器实现
 * Schema validator implementation
 */

import type { UDEFMessageImpl } from '../core/message.js';
import type { SchemaRegistryOperations, Schema } from './schema-registry.js';
import { type SkerString } from '@sker/types';

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  schema_used?: Schema;
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  expected?: unknown;
  actual?: unknown;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  suggestion?: string;
}

export interface ValidationOptions {
  strict?: boolean;
  allowAdditionalProperties?: boolean;
  validateFormat?: boolean;
  customValidators?: Record<string, (value: any) => boolean>;
  skipMissingSchema?: boolean;
  maxDepth?: number;
}

/**
 * 基础验证器抽象类
 * Base validator abstract class
 */
export abstract class BaseValidator {
  protected options: ValidationOptions;

  constructor(options: ValidationOptions = {}) {
    this.options = {
      strict: true,
      allowAdditionalProperties: false,
      validateFormat: true,
      skipMissingSchema: false,
      maxDepth: 32,
      ...options
    };
  }

  abstract validate(data: any, schema: any): ValidationResult;

  /**
   * 创建验证错误
   * Create validation error
   */
  protected createError(
    code: string, 
    message: string, 
    path: string, 
    expected?: unknown, 
    actual?: unknown
  ): ValidationError {
    return { code, message, path, expected, actual };
  }

  /**
   * 创建验证警告
   * Create validation warning
   */
  protected createWarning(
    code: string, 
    message: string, 
    path: string, 
    suggestion?: string
  ): ValidationWarning {
    return { code, message, path, suggestion };
  }

  /**
   * 格式化路径
   * Format path
   */
  protected formatPath(basePath: string, key: string): string {
    return basePath ? `${basePath}.${key}` : key;
  }
}

/**
 * JSON Schema验证器
 * JSON Schema validator
 */
export class JSONSchemaValidator extends BaseValidator {
  validate(data: any, schema: any): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      this.validateValue(data, schema, '', errors, warnings, 0);
    } catch (error) {
      errors.push(this.createError(
        'VALIDATION_EXCEPTION',
        `Validation failed: ${(error as Error).message}`,
        ''
      ));
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  private validateValue(
    value: any, 
    schema: any, 
    path: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[],
    depth: number
  ): void {
    // 检查最大深度
    if (depth > (this.options.maxDepth || 32)) {
      errors.push(this.createError(
        'MAX_DEPTH_EXCEEDED',
        'Maximum validation depth exceeded',
        path
      ));
      return;
    }

    if (!schema || typeof schema !== 'object') {
      return;
    }

    // 验证类型
    if (schema.type) {
      this.validateType(value, schema.type, path, errors);
    }

    // 验证必填字段
    if (schema.required && Array.isArray(schema.required) && typeof value === 'object' && value !== null) {
      for (const requiredField of schema.required) {
        if (!(requiredField in value)) {
          errors.push(this.createError(
            'MISSING_REQUIRED_FIELD',
            `Required field '${requiredField}' is missing`,
            this.formatPath(path, requiredField)
          ));
        }
      }
    }

    // 验证对象属性
    if (schema.properties && typeof value === 'object' && value !== null) {
      this.validateProperties(value, schema, path, errors, warnings, depth + 1);
    }

    // 验证数组项
    if (schema.items && Array.isArray(value)) {
      this.validateArrayItems(value, schema.items, path, errors, warnings, depth + 1);
    }

    // 验证格式
    if (this.options.validateFormat && schema.format) {
      this.validateFormat(value, schema.format, path, errors, warnings);
    }

    // 验证数值范围
    if (typeof value === 'number') {
      this.validateNumericConstraints(value, schema, path, errors);
    }

    // 验证字符串长度
    if (typeof value === 'string') {
      this.validateStringConstraints(value, schema, path, errors);
    }

    // 验证数组约束
    if (Array.isArray(value)) {
      this.validateArrayConstraints(value, schema, path, errors);
    }

    // 自定义验证器
    if (this.options.customValidators) {
      this.runCustomValidators(value, schema, path, errors, warnings);
    }
  }

  private validateType(value: any, expectedType: string | string[], path: string, errors: ValidationError[]): void {
    const actualType = this.getJSONSchemaType(value);
    const expectedTypes = Array.isArray(expectedType) ? expectedType : [expectedType];

    if (!expectedTypes.includes(actualType)) {
      errors.push(this.createError(
        'TYPE_MISMATCH',
        `Expected type ${expectedTypes.join(' or ')}, got ${actualType}`,
        path,
        expectedTypes,
        actualType
      ));
    }
  }

  private validateProperties(
    value: any, 
    schema: any, 
    path: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[],
    depth: number
  ): void {
    // 验证已定义的属性
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (propName in value) {
        this.validateValue(
          value[propName],
          propSchema,
          this.formatPath(path, propName),
          errors,
          warnings,
          depth
        );
      }
    }

    // 检查额外属性
    if (!this.options.allowAdditionalProperties && !schema.additionalProperties) {
      for (const propName of Object.keys(value)) {
        if (!(propName in schema.properties)) {
          const warning = this.createWarning(
            'ADDITIONAL_PROPERTY',
            `Property '${propName}' is not defined in schema`,
            this.formatPath(path, propName),
            'Consider removing this property or adding it to the schema'
          );
          warnings.push(warning);

          if (this.options.strict) {
            errors.push(this.createError(
              'ADDITIONAL_PROPERTY_NOT_ALLOWED',
              `Additional property '${propName}' is not allowed`,
              this.formatPath(path, propName)
            ));
          }
        }
      }
    }
  }

  private validateArrayItems(
    array: any[], 
    itemSchema: any, 
    path: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[],
    depth: number
  ): void {
    array.forEach((item, index) => {
      this.validateValue(
        item,
        itemSchema,
        `${path}[${index}]`,
        errors,
        warnings,
        depth
      );
    });
  }

  private validateFormat(
    value: any, 
    format: string, 
    path: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    if (typeof value !== 'string') {
      return;
    }

    let isValid = false;
    let errorMessage = '';

    switch (format) {
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        errorMessage = 'Invalid email format';
        break;
      case 'uri':
      case 'url':
        try {
          new URL(value);
          isValid = true;
        } catch {
          isValid = false;
          errorMessage = 'Invalid URL format';
        }
        break;
      case 'uuid':
        isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
        errorMessage = 'Invalid UUID format';
        break;
      case 'date':
        isValid = !isNaN(Date.parse(value));
        errorMessage = 'Invalid date format';
        break;
      case 'date-time':
        isValid = !isNaN(Date.parse(value)) && value.includes('T');
        errorMessage = 'Invalid date-time format';
        break;
      case 'ipv4':
        isValid = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(value);
        errorMessage = 'Invalid IPv4 format';
        break;
      default:
        warnings.push(this.createWarning(
          'UNKNOWN_FORMAT',
          `Unknown format '${format}'`,
          path,
          'Check if the format is supported'
        ));
        return;
    }

    if (!isValid) {
      errors.push(this.createError(
        'FORMAT_VALIDATION_FAILED',
        errorMessage,
        path,
        format,
        value
      ));
    }
  }

  private validateNumericConstraints(value: number, schema: any, path: string, errors: ValidationError[]): void {
    if (schema.minimum !== undefined && value < schema.minimum) {
      errors.push(this.createError(
        'MINIMUM_CONSTRAINT_VIOLATION',
        `Value ${value} is below minimum ${schema.minimum}`,
        path,
        schema.minimum,
        value
      ));
    }

    if (schema.maximum !== undefined && value > schema.maximum) {
      errors.push(this.createError(
        'MAXIMUM_CONSTRAINT_VIOLATION',
        `Value ${value} is above maximum ${schema.maximum}`,
        path,
        schema.maximum,
        value
      ));
    }

    if (schema.exclusiveMinimum !== undefined && value <= schema.exclusiveMinimum) {
      errors.push(this.createError(
        'EXCLUSIVE_MINIMUM_CONSTRAINT_VIOLATION',
        `Value ${value} is not greater than exclusive minimum ${schema.exclusiveMinimum}`,
        path,
        schema.exclusiveMinimum,
        value
      ));
    }

    if (schema.exclusiveMaximum !== undefined && value >= schema.exclusiveMaximum) {
      errors.push(this.createError(
        'EXCLUSIVE_MAXIMUM_CONSTRAINT_VIOLATION',
        `Value ${value} is not less than exclusive maximum ${schema.exclusiveMaximum}`,
        path,
        schema.exclusiveMaximum,
        value
      ));
    }

    if (schema.multipleOf !== undefined && value % schema.multipleOf !== 0) {
      errors.push(this.createError(
        'MULTIPLE_OF_CONSTRAINT_VIOLATION',
        `Value ${value} is not a multiple of ${schema.multipleOf}`,
        path,
        schema.multipleOf,
        value
      ));
    }
  }

  private validateStringConstraints(value: string, schema: any, path: string, errors: ValidationError[]): void {
    if (schema.minLength !== undefined && value.length < schema.minLength) {
      errors.push(this.createError(
        'MIN_LENGTH_CONSTRAINT_VIOLATION',
        `String length ${value.length} is below minimum ${schema.minLength}`,
        path,
        schema.minLength,
        value.length
      ));
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      errors.push(this.createError(
        'MAX_LENGTH_CONSTRAINT_VIOLATION',
        `String length ${value.length} is above maximum ${schema.maxLength}`,
        path,
        schema.maxLength,
        value.length
      ));
    }

    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(value)) {
        errors.push(this.createError(
          'PATTERN_CONSTRAINT_VIOLATION',
          `String does not match pattern ${schema.pattern}`,
          path,
          schema.pattern,
          value
        ));
      }
    }
  }

  private validateArrayConstraints(value: any[], schema: any, path: string, errors: ValidationError[]): void {
    if (schema.minItems !== undefined && value.length < schema.minItems) {
      errors.push(this.createError(
        'MIN_ITEMS_CONSTRAINT_VIOLATION',
        `Array length ${value.length} is below minimum ${schema.minItems}`,
        path,
        schema.minItems,
        value.length
      ));
    }

    if (schema.maxItems !== undefined && value.length > schema.maxItems) {
      errors.push(this.createError(
        'MAX_ITEMS_CONSTRAINT_VIOLATION',
        `Array length ${value.length} is above maximum ${schema.maxItems}`,
        path,
        schema.maxItems,
        value.length
      ));
    }

    if (schema.uniqueItems === true) {
      const seen = new Set();
      const duplicates = [];
      for (let i = 0; i < value.length; i++) {
        const item = JSON.stringify(value[i]);
        if (seen.has(item)) {
          duplicates.push(i);
        } else {
          seen.add(item);
        }
      }

      if (duplicates.length > 0) {
        errors.push(this.createError(
          'UNIQUE_ITEMS_CONSTRAINT_VIOLATION',
          `Array contains duplicate items at indices: ${duplicates.join(', ')}`,
          path
        ));
      }
    }
  }

  private runCustomValidators(
    value: any, 
    schema: any, 
    path: string, 
    errors: ValidationError[], 
    warnings: ValidationWarning[]
  ): void {
    for (const [validatorName, validatorFn] of Object.entries(this.options.customValidators || {})) {
      if (schema[validatorName] !== undefined) {
        try {
          if (!validatorFn(value)) {
            errors.push(this.createError(
              'CUSTOM_VALIDATION_FAILED',
              `Custom validation '${validatorName}' failed`,
              path
            ));
          }
        } catch (error) {
          warnings.push(this.createWarning(
            'CUSTOM_VALIDATOR_ERROR',
            `Custom validator '${validatorName}' threw an error: ${(error as Error).message}`,
            path
          ));
        }
      }
    }
  }

  private getJSONSchemaType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'object';
    return typeof value;
  }
}

/**
 * UDEF消息验证器
 * UDEF message validator
 */
export class UDEFMessageValidator {
  private schemaRegistry: SchemaRegistryOperations;
  private jsonValidator: JSONSchemaValidator;
  private options: ValidationOptions;

  constructor(
    schemaRegistry: SchemaRegistryOperations,
    options: ValidationOptions = {}
  ) {
    this.schemaRegistry = schemaRegistry;
    this.options = options;
    this.jsonValidator = new JSONSchemaValidator(options);
  }

  /**
   * 验证UDEF消息
   * Validate UDEF message
   */
  async validate(message: UDEFMessageImpl): Promise<ValidationResult> {
    try {
      // 获取消息类型和版本
      const messageType = message.messageType;
      const schemaVersion = message.payload.schema_version;

      // 从注册表获取Schema
      const schema = await this.schemaRegistry.get(messageType, schemaVersion);
      
      if (!schema) {
        if (this.options.skipMissingSchema) {
          return {
            valid: true,
            errors: [],
            warnings: [{
              code: 'SCHEMA_NOT_FOUND',
              message: `Schema not found for ${messageType}@${schemaVersion}`,
              path: '',
              suggestion: 'Register the schema or enable skipMissingSchema'
            }]
          };
        } else {
          return {
            valid: false,
            errors: [{
              code: 'SCHEMA_NOT_FOUND',
              message: `Schema not found for ${messageType}@${schemaVersion}`,
              path: ''
            }],
            warnings: []
          };
        }
      }

      // 验证消息数据
      const result = this.jsonValidator.validate(message.getData(), schema.definition);
      result.schema_used = schema;

      return result;
    } catch (error) {
      return {
        valid: false,
        errors: [{
          code: 'VALIDATION_ERROR',
          message: `Validation failed: ${(error as Error).message}`,
          path: ''
        }],
        warnings: []
      };
    }
  }

  /**
   * 批量验证消息
   * Batch validate messages
   */
  async validateBatch(messages: UDEFMessageImpl[]): Promise<ValidationResult[]> {
    return Promise.all(messages.map(msg => this.validate(msg)));
  }
}