import { SkerError } from './base.js';
import { SystemError, BusinessError, IntegrationError, SecurityError } from './specific.js';
import { getErrorCategory } from '../codes/index.js';

export function isSkerError(error: any): error is SkerError {
  return error instanceof SkerError;
}

export function isSystemError(error: any): error is SystemError {
  return error instanceof SystemError;
}

export function isBusinessError(error: any): error is BusinessError {
  return error instanceof BusinessError;
}

export function isIntegrationError(error: any): error is IntegrationError {
  return error instanceof IntegrationError;
}

export function isSecurityError(error: any): error is SecurityError {
  return error instanceof SecurityError;
}

export function isErrorOfCategory(error: any, category: string): boolean {
  if (isSkerError(error)) {
    return error.category === category;
  }
  return false;
}

export function wrapError(error: any, additionalContext?: Record<string, any>): SkerError {
  if (isSkerError(error)) {
    if (additionalContext) {
      error.withContext(additionalContext);
    }
    return error;
  }

  // 包装原始错误
  return new SystemError({
    code: '100001',
    message: error?.message || 'Unknown error',
    originalError: error,
    context: additionalContext || {}
  });
}

export function sanitizeErrorForLogging(error: SkerError, sensitiveFields: string[] = []): any {
  const sanitized = error.toJSON();
  
  // 移除敏感字段
  const defaultSensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
  
  function removeSensitiveData(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(removeSensitiveData);
    }
    
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (allSensitiveFields.some(field => 
        key.toLowerCase().includes(field.toLowerCase())
      )) {
        cleaned[key] = '[REDACTED]';
      } else {
        cleaned[key] = removeSensitiveData(value);
      }
    }
    return cleaned;
  }
  
  return removeSensitiveData(sanitized);
}

export function extractErrorInfo(error: any): {
  message: string;
  code: string;
  category: string;
  stack?: string;
} {
  if (isSkerError(error)) {
    return {
      message: error.message,
      code: error.code,
      category: error.category,
      stack: error.stack
    };
  }
  
  return {
    message: error?.message || 'Unknown error',
    code: '100001',
    category: 'system',
    stack: error?.stack
  };
}

export function createErrorFromCode(
  code: string,
  message: string,
  context?: Record<string, any>
): SkerError {
  const category = getErrorCategory(code);
  
  switch (category) {
    case 'business':
      return new BusinessError({ code, message, context });
    case 'integration':
      return new IntegrationError({ code, message, context });
    case 'security':
      return new SecurityError({ code, message, context });
    case 'system':
    default:
      return new SystemError({ code, message, context });
  }
}