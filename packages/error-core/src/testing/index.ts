import { SkerError, SystemError, BusinessError, IntegrationError, SecurityError } from '../errors/index.js';
import { ERROR_CODES } from '../codes/index.js';

export class ErrorTestHelper {
  private collectedErrors: any[] = [];
  private originalErrorHandlers: any = {};

  constructor() {
    this.setupErrorCapture();
  }

  private setupErrorCapture(): void {
    // 捕获进程错误事件用于测试
    const originalUnhandledRejection = process.listeners('unhandledRejection');
    const originalUncaughtException = process.listeners('uncaughtException');

    this.originalErrorHandlers = {
      unhandledRejection: originalUnhandledRejection,
      uncaughtException: originalUncaughtException
    };

    process.on('unhandledRejection', (error) => {
      this.collectedErrors.push({
        type: 'unhandledRejection',
        error,
        timestamp: new Date()
      });
    });

    process.on('uncaughtException', (error) => {
      this.collectedErrors.push({
        type: 'uncaughtException',
        error,
        timestamp: new Date()
      });
    });
  }

  collectError(error: any): void {
    this.collectedErrors.push({
      type: 'manual',
      error,
      timestamp: new Date()
    });
  }

  getCollectedErrors(): any[] {
    return [...this.collectedErrors];
  }

  getErrorsByType(type: string): any[] {
    return this.collectedErrors.filter(item => item.type === type);
  }

  getErrorCount(): number {
    return this.collectedErrors.length;
  }

  hasErrorOfType(errorType: typeof SkerError): boolean {
    return this.collectedErrors.some(item => item.error instanceof errorType);
  }

  hasErrorWithCode(code: string): boolean {
    return this.collectedErrors.some(item => 
      item.error instanceof SkerError && item.error.code === code
    );
  }

  reset(): void {
    this.collectedErrors = [];
  }

  cleanup(): void {
    this.reset();
    // 恢复原始错误处理器
    process.removeAllListeners('unhandledRejection');
    process.removeAllListeners('uncaughtException');
    
    this.originalErrorHandlers.unhandledRejection.forEach((listener: any) => {
      process.on('unhandledRejection', listener);
    });
    
    this.originalErrorHandlers.uncaughtException.forEach((listener: any) => {
      process.on('uncaughtException', listener);
    });
  }
}

export class MockErrorProvider {
  static createSystemError(options?: Partial<{
    code: string;
    message: string;
    context: Record<string, any>;
  }>): SystemError {
    return new SystemError({
      code: options?.code || ERROR_CODES.GENERIC_ERROR,
      message: options?.message || 'Mock system error',
      context: options?.context || { mock: true }
    });
  }

  static createBusinessError(options?: Partial<{
    code: string;
    message: string;
    context: Record<string, any>;
  }>): BusinessError {
    return new BusinessError({
      code: options?.code || ERROR_CODES.VALIDATION_FAILED,
      message: options?.message || 'Mock business error',
      context: options?.context || { mock: true }
    });
  }

  static createIntegrationError(options?: Partial<{
    code: string;
    message: string;
    context: Record<string, any>;
  }>): IntegrationError {
    return new IntegrationError({
      code: options?.code || ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE,
      message: options?.message || 'Mock integration error',
      context: options?.context || { mock: true }
    });
  }

  static createSecurityError(options?: Partial<{
    code: string;
    message: string;
    context: Record<string, any>;
  }>): SecurityError {
    return new SecurityError({
      code: options?.code || ERROR_CODES.AUTHENTICATION_FAILED,
      message: options?.message || 'Mock security error',
      context: options?.context || { mock: true }
    });
  }

  static createGenericError(message: string = 'Mock error'): Error {
    return new Error(message);
  }

  static createAsyncError(delay: number = 100, error?: Error): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(error || new Error('Mock async error'));
      }, delay);
    });
  }
}

// 自定义断言扩展
export interface ErrorAssertions {
  toThrowSkerError(expectedCode?: string): void;
  toMatchErrorPattern(pattern: {
    code?: string;
    category?: string;
    message?: string;
    httpStatusCode?: number;
  }): void;
  toHaveErrorDetails(expectedDetails?: any[]): void;
  toBeRetryableError(): void;
  toBeNonRetryableError(): void;
}

export function extendExpect(expect: any): void {
  expect.extend({
    toThrowSkerError(received: any, expectedCode?: string) {
      let pass = false;
      let message = '';

      try {
        if (typeof received === 'function') {
          received();
        }
      } catch (error) {
        if (error instanceof SkerError) {
          if (expectedCode) {
            pass = error.code === expectedCode;
            message = pass 
              ? `Expected SkerError with code ${expectedCode}` 
              : `Expected SkerError with code ${expectedCode}, but got ${error.code}`;
          } else {
            pass = true;
            message = 'Expected SkerError';
          }
        } else {
          pass = false;
          message = `Expected SkerError, but got ${error?.constructor?.name || 'unknown error'}`;
        }
      }

      return {
        message: () => message,
        pass
      };
    },

    toMatchErrorPattern(received: any, pattern: {
      code?: string;
      category?: string;
      message?: string;
      httpStatusCode?: number;
    }) {
      if (!(received instanceof SkerError)) {
        return {
          message: () => `Expected SkerError, but got ${received?.constructor?.name || 'unknown'}`,
          pass: false
        };
      }

      const failures: string[] = [];

      if (pattern.code && received.code !== pattern.code) {
        failures.push(`code: expected ${pattern.code}, got ${received.code}`);
      }

      if (pattern.category && received.category !== pattern.category) {
        failures.push(`category: expected ${pattern.category}, got ${received.category}`);
      }

      if (pattern.message && !received.message.includes(pattern.message)) {
        failures.push(`message: expected to include "${pattern.message}", got "${received.message}"`);
      }

      if (pattern.httpStatusCode && received.httpStatusCode !== pattern.httpStatusCode) {
        failures.push(`httpStatusCode: expected ${pattern.httpStatusCode}, got ${received.httpStatusCode}`);
      }

      const pass = failures.length === 0;
      const message = pass 
        ? `Expected error to not match pattern`
        : `Error pattern mismatch: ${failures.join(', ')}`;

      return {
        message: () => message,
        pass
      };
    },

    toHaveErrorDetails(received: any, expectedDetails?: any[]) {
      if (!(received instanceof SkerError)) {
        return {
          message: () => `Expected SkerError, but got ${received?.constructor?.name || 'unknown'}`,
          pass: false
        };
      }

      if (!expectedDetails) {
        const pass = received.details && received.details.length > 0;
        return {
          message: () => pass 
            ? 'Expected error to not have details'
            : 'Expected error to have details',
          pass
        };
      }

      const pass = JSON.stringify(received.details) === JSON.stringify(expectedDetails);
      return {
        message: () => pass
          ? 'Expected error details to not match'
          : `Expected error details to match ${JSON.stringify(expectedDetails)}, got ${JSON.stringify(received.details)}`,
        pass
      };
    }
  });
}

// 测试工具函数
export function createTestError(type: 'system' | 'business' | 'integration' | 'security' = 'system'): SkerError {
  switch (type) {
    case 'business':
      return MockErrorProvider.createBusinessError();
    case 'integration':
      return MockErrorProvider.createIntegrationError();
    case 'security':
      return MockErrorProvider.createSecurityError();
    default:
      return MockErrorProvider.createSystemError();
  }
}

export async function expectAsyncError(
  asyncFn: () => Promise<any>,
  expectedErrorType?: typeof SkerError,
  expectedCode?: string
): Promise<void> {
  let error: any;
  
  try {
    await asyncFn();
    throw new Error('Expected function to throw, but it did not');
  } catch (e) {
    error = e;
  }

  if (expectedErrorType && !(error instanceof expectedErrorType)) {
    throw new Error(`Expected ${expectedErrorType.name}, but got ${error?.constructor?.name || 'unknown'}`);
  }

  if (expectedCode && error instanceof SkerError && error.code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode}, but got ${error.code}`);
  }
}

export function mockAsyncOperation<T>(
  result: T,
  delay: number = 100,
  shouldFail: boolean = false,
  error?: Error
): () => Promise<T> {
  return () => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(error || new Error('Mock operation failed'));
      } else {
        resolve(result);
      }
    }, delay);
  });
}