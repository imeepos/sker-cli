/**
 * 数据验证处理器
 */

import { EventEmitter } from 'events';
import {
  JSONSchema,
  ValidationConfig,
  ValidatorFunction,
  ValidationError
} from '../types/serializer-types.js';
import { ERROR_MESSAGES } from '../constants/json-constants.js';

/**
 * 验证错误类
 */
export class ValidationProcessorError extends Error {
  public readonly code: string;
  public readonly errors: ValidationError[];
  
  constructor(message: string, code: string, errors: ValidationError[]) {
    super(message);
    this.name = 'ValidationProcessorError';
    this.code = code;
    this.errors = errors;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationProcessorError);
    }
  }
}

/**
 * 验证处理器
 */
export class ValidationProcessor extends EventEmitter {
  private schemas: Map<string, JSONSchema> = new Map();
  private customValidators: Map<string, ValidatorFunction> = new Map();
  private config: ValidationConfig;

  constructor(config: ValidationConfig = {}) {
    super();
    this.config = {
      enabled: true,
      strict: true,
      errorFormat: 'detailed',
      onSerialize: true,
      onDeserialize: true,
      ...config
    };
    
    this.initializeSchemas();
    this.initializeCustomValidators();
  }

  /**
   * 初始化schemas
   */
  private initializeSchemas(): void {
    if (this.config.schemas) {
      Object.entries(this.config.schemas).forEach(([name, schema]) => {
        this.schemas.set(name, schema);
      });
    }
  }

  /**
   * 初始化自定义验证器
   */
  private initializeCustomValidators(): void {
    if (this.config.customValidators) {
      Object.entries(this.config.customValidators).forEach(([name, validator]) => {
        this.customValidators.set(name, validator);
      });
    }
  }

  /**
   * 验证数据
   */
  async validate(data: any, options?: Partial<ValidationConfig>): Promise<void> {
    if (!this.config.enabled) return;

    const mergedConfig = { ...this.config, ...options };
    const errors: ValidationError[] = [];

    try {
      this.emit('validation:start', { data, config: mergedConfig });

      // Schema验证
      if (mergedConfig.schema) {
        const schemaErrors = await this.validateWithSchema(data, mergedConfig.schema);
        errors.push(...schemaErrors);
      }

      // 自定义验证器
      const customErrors = await this.validateWithCustomValidators(data);
      errors.push(...customErrors);

      // 基本类型验证
      const typeErrors = this.validateBasicTypes(data);
      errors.push(...typeErrors);

      if (errors.length > 0) {
        this.emit('validation:failure', { data, errors });
        
        if (mergedConfig.strict) {
          throw new ValidationProcessorError(
            ERROR_MESSAGES.VALIDATION_FAILED,
            'VALIDATION_FAILED',
            errors
          );
        }
      }

      this.emit('validation:success', { data });
      
    } catch (error) {
      this.emit('validation:error', { data, error });
      throw error;
    }
  }

  /**
   * 使用JSON Schema验证
   */
  private async validateWithSchema(data: any, schemaName: string): Promise<ValidationError[]> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      throw new ValidationProcessorError(
        ERROR_MESSAGES.SCHEMA_NOT_FOUND,
        'SCHEMA_NOT_FOUND',
        [{ instancePath: '', schemaPath: '', keyword: 'schema', params: { schema: schemaName }, message: `Schema '${schemaName}' not found` }]
      );
    }

    return this.validateAgainstSchema(data, schema, '');
  }

  /**
   * 对schema进行验证
   */
  private validateAgainstSchema(data: any, schema: JSONSchema, path: string = ''): ValidationError[] {
    const errors: ValidationError[] = [];

    // 类型验证
    if (schema.type) {
      const typeError = this.validateType(data, schema.type, path);
      if (typeError) errors.push(typeError);
    }

    // 枚举验证
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/enum`,
        keyword: 'enum',
        params: { allowedValues: schema.enum },
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        data
      });
    }

    // 常量验证
    if (schema.const !== undefined && data !== schema.const) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/const`,
        keyword: 'const',
        params: { allowedValue: schema.const },
        message: `Value must be ${schema.const}`,
        data
      });
    }

    // 对象验证
    if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
      errors.push(...this.validateObject(data, schema, path));
    }

    // 数组验证
    if (Array.isArray(data)) {
      errors.push(...this.validateArray(data, schema, path));
    }

    // 字符串验证
    if (typeof data === 'string') {
      errors.push(...this.validateString(data, schema, path));
    }

    // 数字验证
    if (typeof data === 'number') {
      errors.push(...this.validateNumber(data, schema, path));
    }

    return errors;
  }

  /**
   * 验证类型
   */
  private validateType(data: any, expectedType: string | string[], path: string): ValidationError | null {
    const actualType = this.getDataType(data);
    const types = Array.isArray(expectedType) ? expectedType : [expectedType];

    if (!types.includes(actualType)) {
      return {
        instancePath: path,
        schemaPath: `${path}/type`,
        keyword: 'type',
        params: { type: expectedType },
        message: `Expected ${types.join(' or ')} but got ${actualType}`,
        data
      };
    }

    return null;
  }

  /**
   * 验证对象
   */
  private validateObject(data: any, schema: JSONSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // 必需属性验证
    if (schema.required) {
      schema.required.forEach(prop => {
        if (!(prop in data)) {
          errors.push({
            instancePath: path,
            schemaPath: `${path}/required`,
            keyword: 'required',
            params: { missingProperty: prop },
            message: `Missing required property: ${prop}`,
            data
          });
        }
      });
    }

    // 属性验证
    if (schema.properties) {
      Object.entries(schema.properties).forEach(([prop, propSchema]) => {
        if (prop in data) {
          const propPath = path ? `${path}/${prop}` : prop;
          errors.push(...this.validateAgainstSchema(data[prop], propSchema, propPath));
        }
      });
    }

    // 额外属性验证
    if (schema.additionalProperties === false) {
      const allowedProps = new Set(Object.keys(schema.properties || {}));
      Object.keys(data).forEach(prop => {
        if (!allowedProps.has(prop)) {
          errors.push({
            instancePath: `${path}/${prop}`,
            schemaPath: `${path}/additionalProperties`,
            keyword: 'additionalProperties',
            params: { additionalProperty: prop },
            message: `Additional property not allowed: ${prop}`,
            data: data[prop]
          });
        }
      });
    }

    return errors;
  }

  /**
   * 验证数组
   */
  private validateArray(data: any[], schema: JSONSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // 最小长度验证
    if (schema.minItems !== undefined && data.length < schema.minItems) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/minItems`,
        keyword: 'minItems',
        params: { limit: schema.minItems },
        message: `Array must have at least ${schema.minItems} items`,
        data
      });
    }

    // 最大长度验证
    if (schema.maxItems !== undefined && data.length > schema.maxItems) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/maxItems`,
        keyword: 'maxItems',
        params: { limit: schema.maxItems },
        message: `Array must have at most ${schema.maxItems} items`,
        data
      });
    }

    // 项目验证
    if (schema.items) {
      const itemSchema = Array.isArray(schema.items) ? schema.items[0] : schema.items;
      if (itemSchema) {
        data.forEach((item, index) => {
          const itemPath = `${path}[${index}]`;
          errors.push(...this.validateAgainstSchema(item, itemSchema, itemPath));
        });
      }
    }

    return errors;
  }

  /**
   * 验证字符串
   */
  private validateString(data: string, schema: JSONSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // 最小长度
    if (schema.minLength !== undefined && data.length < schema.minLength) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/minLength`,
        keyword: 'minLength',
        params: { limit: schema.minLength },
        message: `String must be at least ${schema.minLength} characters long`,
        data
      });
    }

    // 最大长度
    if (schema.maxLength !== undefined && data.length > schema.maxLength) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/maxLength`,
        keyword: 'maxLength',
        params: { limit: schema.maxLength },
        message: `String must be at most ${schema.maxLength} characters long`,
        data
      });
    }

    // 正则表达式
    if (schema.pattern) {
      const regex = new RegExp(schema.pattern);
      if (!regex.test(data)) {
        errors.push({
          instancePath: path,
          schemaPath: `${path}/pattern`,
          keyword: 'pattern',
          params: { pattern: schema.pattern },
          message: `String does not match pattern: ${schema.pattern}`,
          data
        });
      }
    }

    // 格式验证
    if (schema.format) {
      const formatError = this.validateFormat(data, schema.format, path);
      if (formatError) errors.push(formatError);
    }

    return errors;
  }

  /**
   * 验证数字
   */
  private validateNumber(data: number, schema: JSONSchema, path: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // 最小值
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/minimum`,
        keyword: 'minimum',
        params: { limit: schema.minimum },
        message: `Number must be >= ${schema.minimum}`,
        data
      });
    }

    // 最大值
    if (schema.maximum !== undefined && data > schema.maximum) {
      errors.push({
        instancePath: path,
        schemaPath: `${path}/maximum`,
        keyword: 'maximum',
        params: { limit: schema.maximum },
        message: `Number must be <= ${schema.maximum}`,
        data
      });
    }

    return errors;
  }

  /**
   * 验证格式
   */
  private validateFormat(data: string, format: string, path: string): ValidationError | null {
    let isValid = false;

    switch (format) {
      case 'email':
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data);
        break;
      case 'uri':
      case 'url':
        isValid = /^https?:\/\/.+/.test(data);
        break;
      case 'uuid':
        isValid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data);
        break;
      case 'date':
        isValid = !isNaN(Date.parse(data));
        break;
      case 'date-time':
        isValid = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/.test(data);
        break;
      default:
        return null; // 未知格式，跳过验证
    }

    if (!isValid) {
      return {
        instancePath: path,
        schemaPath: `${path}/format`,
        keyword: 'format',
        params: { format },
        message: `String does not match format: ${format}`,
        data
      };
    }

    return null;
  }

  /**
   * 使用自定义验证器验证
   */
  private async validateWithCustomValidators(data: any): Promise<ValidationError[]> {
    const errors: ValidationError[] = [];

    for (const [name, validator] of this.customValidators) {
      try {
        const isValid = await validator(data);
        if (!isValid) {
          errors.push({
            instancePath: '',
            schemaPath: `/customValidator/${name}`,
            keyword: 'customValidator',
            params: { validator: name },
            message: `Custom validator '${name}' failed`,
            data
          });
        }
      } catch (error) {
        errors.push({
          instancePath: '',
          schemaPath: `/customValidator/${name}`,
          keyword: 'customValidator',
          params: { validator: name, error: (error as Error).message },
          message: `Custom validator '${name}' threw an error: ${(error as Error).message}`,
          data
        });
      }
    }

    return errors;
  }

  /**
   * 基本类型验证
   */
  private validateBasicTypes(data: any): ValidationError[] {
    const errors: ValidationError[] = [];

    // 检查循环引用
    if (this.hasCircularReference(data)) {
      errors.push({
        instancePath: '',
        schemaPath: '/circularReference',
        keyword: 'circularReference',
        params: {},
        message: 'Circular reference detected',
        data
      });
    }

    return errors;
  }

  /**
   * 检查循环引用
   */
  private hasCircularReference(obj: any, seen = new WeakSet()): boolean {
    if (obj === null || typeof obj !== 'object') {
      return false;
    }

    if (seen.has(obj)) {
      return true;
    }

    seen.add(obj);

    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (this.hasCircularReference(obj[key], seen)) {
          return true;
        }
      }
    }

    seen.delete(obj);
    return false;
  }

  /**
   * 获取数据类型
   */
  private getDataType(data: any): string {
    if (data === null) return 'null';
    if (Array.isArray(data)) return 'array';
    if (typeof data === 'object') return 'object';
    return typeof data;
  }

  /**
   * 添加schema
   */
  addSchema(name: string, schema: JSONSchema): void {
    this.schemas.set(name, schema);
  }

  /**
   * 删除schema
   */
  removeSchema(name: string): boolean {
    return this.schemas.delete(name);
  }

  /**
   * 获取schema
   */
  getSchema(name: string): JSONSchema | undefined {
    return this.schemas.get(name);
  }

  /**
   * 添加自定义验证器
   */
  addCustomValidator(name: string, validator: ValidatorFunction): void {
    this.customValidators.set(name, validator);
  }

  /**
   * 删除自定义验证器
   */
  removeCustomValidator(name: string): boolean {
    return this.customValidators.delete(name);
  }

  /**
   * 获取所有schema名称
   */
  getSchemaNames(): string[] {
    return Array.from(this.schemas.keys());
  }

  /**
   * 获取所有自定义验证器名称
   */
  getCustomValidatorNames(): string[] {
    return Array.from(this.customValidators.keys());
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.schemas.clear();
    this.customValidators.clear();
    this.removeAllListeners();
  }
}