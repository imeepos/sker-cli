import { SkerError } from './base.js';
import { ErrorOptions, ErrorCategory } from '../types/index.js';
import { getHttpStatusForCategory } from '../codes/index.js';

export class SystemError extends SkerError {
  public readonly category: ErrorCategory = 'system';

  constructor(options: ErrorOptions) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory('system')
    });
  }
}

export class BusinessError extends SkerError {
  public readonly category: ErrorCategory = 'business';

  constructor(options: ErrorOptions) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory('business')
    });
  }
}

export class IntegrationError extends SkerError {
  public readonly category: ErrorCategory = 'integration';

  constructor(options: ErrorOptions) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory('integration')
    });
  }
}

export class SecurityError extends SkerError {
  public readonly category: ErrorCategory = 'security';

  constructor(options: ErrorOptions) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory('security')
    });
  }
}

// 验证错误类
export class ValidationError extends BusinessError {
  public readonly validationErrors: Array<{
    field: string;
    rule: string;
    message: string;
    value?: any;
  }>;

  constructor(options: ErrorOptions & { 
    validationErrors: Array<{
      field: string;
      rule: string;
      message: string;
      value?: any;
    }> 
  }) {
    super({
      ...options,
      code: options.code || '200001'
    });
    
    this.validationErrors = options.validationErrors;
    this.name = 'ValidationError';
  }

  override toResponse() {
    const baseResponse = super.toResponse();
    return {
      ...baseResponse,
      error: {
        ...baseResponse.error,
        validation_errors: this.validationErrors
      }
    };
  }
}

// 工厂函数
export function createSystemError(options: Omit<ErrorOptions, 'httpStatusCode'>): SystemError {
  return new SystemError(options);
}

export function createBusinessError(options: Omit<ErrorOptions, 'httpStatusCode'>): BusinessError {
  return new BusinessError(options);
}

export function createIntegrationError(options: Omit<ErrorOptions, 'httpStatusCode'>): IntegrationError {
  return new IntegrationError(options);
}

export function createSecurityError(options: Omit<ErrorOptions, 'httpStatusCode'>): SecurityError {
  return new SecurityError(options);
}

export function createValidationError(
  message: string,
  validationErrors: Array<{
    field: string;
    rule: string;
    message: string;
    value?: any;
  }>,
  context?: Record<string, any>
): ValidationError {
  return new ValidationError({
    message,
    validationErrors,
    context
  });
}