// Types
export * from './types/index.js';

// Error Codes
export {
  SYSTEM_ERROR_CODES,
  BUSINESS_ERROR_CODES,
  INTEGRATION_ERROR_CODES,
  SECURITY_ERROR_CODES,
  ERROR_CODES,
  type ErrorCode,
  getErrorCategory,
  getHttpStatusForCategory,
  getHttpStatusForErrorCode,
  HTTP_STATUS_MAPPING
} from './codes/index.js';

// Core Error Classes
export * from './errors/index.js';

// Response Formatting
export * from './responses/index.js';

// Recovery Strategies
export * from './strategies/index.js';

// Decorators
export * from './decorators/index.js';

// Monitoring
export * from './monitoring/index.js';

// Testing Utilities
export * from './testing/index.js';

// Configuration
export * from './config/index.js';

// Context and Propagation
import { ErrorContext } from './types/index.js';
import { SkerError, wrapError } from './errors/index.js';
import { getGlobalErrorCollector } from './monitoring/index.js';

let currentErrorContext: ErrorContext | null = null;

export async function withErrorContext<T>(
  context: ErrorContext,
  fn: () => Promise<T>
): Promise<T> {
  const previousContext = currentErrorContext;
  currentErrorContext = { ...previousContext, ...context };
  
  try {
    return await fn();
  } catch (error) {
    // 自动添加上下文信息到错误
    const enrichedError = error instanceof SkerError 
      ? error.withContext(currentErrorContext) 
      : wrapError(error, currentErrorContext);
    
    // 收集错误
    getGlobalErrorCollector().collect(enrichedError, currentErrorContext);
    
    throw enrichedError;
  } finally {
    currentErrorContext = previousContext;
  }
}

export function getCurrentErrorContext(): ErrorContext | null {
  return currentErrorContext ? { ...currentErrorContext } : null;
}

export class ErrorPropagator {
  constructor(
    private options: {
      includeStackTrace?: boolean;
      includeContext?: boolean;
      maxContextDepth?: number;
    } = {}
  ) {}

  propagate(error: any, additionalContext?: Record<string, any>): SkerError {
    const context = {
      ...getCurrentErrorContext(),
      ...additionalContext
    };

    // 应用配置选项
    if (!this.options.includeContext) {
      // 如果不包含上下文，则清空上下文
      Object.keys(context).forEach(key => delete context[key]);
    }

    if (error instanceof SkerError) {
      return error.withContext(context);
    }

    return wrapError(error, context);
  }
}

// Version info
export const VERSION = '1.0.0';

// Auto-configure from environment on import
import { configureFromEnvironment } from './config/index.js';
configureFromEnvironment();