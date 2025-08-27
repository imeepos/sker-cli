/**
 * @fileoverview 验证中间件实现
 */

import { Middleware, MiddlewareContext } from '../types/http-types.js';
import { HTTP_STATUS } from '../constants/http-constants.js';

export interface ValidationSchema {
  validate(data: any): ValidationResult;
}

export interface ValidationResult {
  valid: boolean;
  errors?: ValidationError[];
  value?: any;
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationOptions {
  body?: ValidationSchema;
  query?: ValidationSchema;
  params?: ValidationSchema;
  headers?: ValidationSchema;
  allowUnknown?: boolean;
  abortEarly?: boolean;
  stripUnknown?: boolean;
}

/**
 * 创建验证中间件
 */
export function validation(options: ValidationOptions = {}): Middleware {
  return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
    const errors: ValidationError[] = [];

    try {
      // 验证请求体
      if (options.body && ctx.request.body !== undefined) {
        const result = options.body.validate(ctx.request.body);
        if (!result.valid && result.errors) {
          errors.push(...result.errors);
        } else if (result.value !== undefined) {
          ctx.request.body = result.value;
        }
      }

      // 验证查询参数
      if (options.query) {
        const result = options.query.validate(ctx.request.query);
        if (!result.valid && result.errors) {
          errors.push(...result.errors);
        } else if (result.value !== undefined) {
          ctx.request.query = result.value;
          ctx.query = result.value;
        }
      }

      // 验证路径参数
      if (options.params) {
        const result = options.params.validate(ctx.request.params);
        if (!result.valid && result.errors) {
          errors.push(...result.errors);
        } else if (result.value !== undefined) {
          ctx.request.params = result.value;
          ctx.params = result.value;
        }
      }

      // 验证请求头
      if (options.headers) {
        const result = options.headers.validate(ctx.request.headers);
        if (!result.valid && result.errors) {
          errors.push(...result.errors);
        } else if (result.value !== undefined) {
          ctx.request.headers = result.value;
        }
      }

      // 如果有验证错误，返回错误响应
      if (errors.length > 0) {
        ctx.response.statusCode = HTTP_STATUS.BAD_REQUEST;
        ctx.json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: errors
          },
          timestamp: new Date().toISOString()
        });
        return;
      }

      await next();
    } catch (error) {
      const err = error as any;
      ctx.response.statusCode = HTTP_STATUS.BAD_REQUEST;
      ctx.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: err.message || 'Validation error',
          details: err.details || []
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * 简单的JSON Schema验证器
 */
export class JSONSchemaValidator implements ValidationSchema {
  private schema: any;

  constructor(schema: any) {
    this.schema = schema;
  }

  validate(data: any): ValidationResult {
    const errors: ValidationError[] = [];
    
    try {
      const result = this.validateObject(data, this.schema, '');
      return {
        valid: result.errors.length === 0,
        errors: result.errors,
        value: result.value
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          field: 'root',
          message: (error as Error).message
        }]
      };
    }
  }

  private validateObject(data: any, schema: any, path: string): { errors: ValidationError[]; value: any } {
    const errors: ValidationError[] = [];
    const result: any = {};

    // 验证必需字段
    if (schema.required && Array.isArray(schema.required)) {
      for (const field of schema.required) {
        if (data[field] === undefined || data[field] === null) {
          errors.push({
            field: path ? `${path}.${field}` : field,
            message: `Field '${field}' is required`
          });
        }
      }
    }

    // 验证属性
    if (schema.properties) {
      for (const [key, fieldSchema] of Object.entries(schema.properties)) {
        const fieldPath = path ? `${path}.${key}` : key;
        const fieldValue = data[key];

        if (fieldValue !== undefined) {
          const fieldResult = this.validateField(fieldValue, fieldSchema as any, fieldPath);
          errors.push(...fieldResult.errors);
          
          if (fieldResult.errors.length === 0) {
            result[key] = fieldResult.value;
          }
        }
      }
    }

    // 处理额外属性
    for (const [key, value] of Object.entries(data || {})) {
      if (!schema.properties || !schema.properties[key]) {
        if (schema.additionalProperties === false) {
          errors.push({
            field: path ? `${path}.${key}` : key,
            message: `Additional property '${key}' is not allowed`
          });
        } else {
          result[key] = value;
        }
      }
    }

    return { errors, value: result };
  }

  private validateField(value: any, schema: any, path: string): { errors: ValidationError[]; value: any } {
    const errors: ValidationError[] = [];
    let result = value;

    // 类型验证
    if (schema.type) {
      const actualType = Array.isArray(value) ? 'array' : typeof value;
      if (actualType !== schema.type) {
        errors.push({
          field: path,
          message: `Expected type '${schema.type}', got '${actualType}'`,
          value
        });
        return { errors, value: result };
      }
    }

    // 字符串验证
    if (schema.type === 'string') {
      if (schema.minLength && value.length < schema.minLength) {
        errors.push({
          field: path,
          message: `String must be at least ${schema.minLength} characters long`,
          value
        });
      }
      
      if (schema.maxLength && value.length > schema.maxLength) {
        errors.push({
          field: path,
          message: `String must be at most ${schema.maxLength} characters long`,
          value
        });
      }

      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push({
          field: path,
          message: `String does not match pattern '${schema.pattern}'`,
          value
        });
      }
    }

    // 数字验证
    if (schema.type === 'number' || schema.type === 'integer') {
      if (schema.minimum && value < schema.minimum) {
        errors.push({
          field: path,
          message: `Number must be at least ${schema.minimum}`,
          value
        });
      }

      if (schema.maximum && value > schema.maximum) {
        errors.push({
          field: path,
          message: `Number must be at most ${schema.maximum}`,
          value
        });
      }
    }

    // 数组验证
    if (schema.type === 'array') {
      if (schema.minItems && value.length < schema.minItems) {
        errors.push({
          field: path,
          message: `Array must have at least ${schema.minItems} items`,
          value
        });
      }

      if (schema.maxItems && value.length > schema.maxItems) {
        errors.push({
          field: path,
          message: `Array must have at most ${schema.maxItems} items`,
          value
        });
      }

      if (schema.items) {
        const resultArray = [];
        for (let i = 0; i < value.length; i++) {
          const itemResult = this.validateField(value[i], schema.items, `${path}[${i}]`);
          errors.push(...itemResult.errors);
          resultArray.push(itemResult.value);
        }
        result = resultArray;
      }
    }

    // 对象验证
    if (schema.type === 'object') {
      const objectResult = this.validateObject(value, schema, path);
      errors.push(...objectResult.errors);
      result = objectResult.value;
    }

    // 枚举验证
    if (schema.enum && !schema.enum.includes(value)) {
      errors.push({
        field: path,
        message: `Value must be one of: ${schema.enum.join(', ')}`,
        value
      });
    }

    return { errors, value: result };
  }
}

/**
 * 创建JSON Schema验证中间件
 */
export function jsonSchema(schema: any): Middleware {
  const validator = new JSONSchemaValidator(schema);
  
  return validation({
    body: validator
  });
}

/**
 * 常用验证函数
 */
export const validators = {
  email: {
    validate: (value: string) => ({
      valid: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      errors: [{
        field: 'email',
        message: 'Invalid email format'
      }]
    })
  },

  url: {
    validate: (value: string) => ({
      valid: /^https?:\/\/.+/.test(value),
      errors: [{
        field: 'url',
        message: 'Invalid URL format'
      }]
    })
  },

  uuid: {
    validate: (value: string) => ({
      valid: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value),
      errors: [{
        field: 'uuid',
        message: 'Invalid UUID format'
      }]
    })
  },

  objectId: {
    validate: (value: string) => ({
      valid: /^[0-9a-fA-F]{24}$/.test(value),
      errors: [{
        field: 'objectId',
        message: 'Invalid ObjectId format'
      }]
    })
  }
};