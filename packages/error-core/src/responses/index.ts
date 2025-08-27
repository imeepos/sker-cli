import { ErrorResponse, ErrorDetail } from '../types/index.js';
import { SkerError } from '../errors/index.js';

export function createErrorResponse(options: {
  code: string;
  message: string;
  details?: ErrorDetail[];
  traceId?: string;
  requestId?: string;
  timestamp?: Date;
}): ErrorResponse {
  return {
    error: {
      code: options.code,
      message: options.message,
      details: options.details,
      timestamp: (options.timestamp || new Date()).toISOString(),
      trace_id: options.traceId,
      request_id: options.requestId
    },
    success: false
  };
}

export function errorToResponse(error: SkerError): ErrorResponse {
  return error.toResponse();
}

export function formatErrorForApi(error: any, options?: {
  includeStackTrace?: boolean;
  includeSensitiveData?: boolean;
  traceId?: string;
  requestId?: string;
}): ErrorResponse {
  const traceId = options?.traceId;
  const requestId = options?.requestId;

  if (error instanceof SkerError) {
    const response = error.toResponse();
    
    // 添加 trace_id 和 request_id
    if (traceId) response.error.trace_id = traceId;
    if (requestId) response.error.request_id = requestId;
    
    return response;
  }

  // 处理原生错误
  return createErrorResponse({
    code: '100001',
    message: error?.message || 'Internal server error',
    traceId,
    requestId
  });
}

export function formatErrorForClient(error: any): ErrorResponse {
  return formatErrorForApi(error, {
    includeStackTrace: false,
    includeSensitiveData: false
  });
}

export function formatErrorForDevelopment(error: any): ErrorResponse & { 
  debug?: { 
    stack?: string; 
    originalError?: any;
    context?: Record<string, any>;
  } 
} {
  const baseResponse = formatErrorForApi(error, {
    includeStackTrace: true,
    includeSensitiveData: true
  });

  if (error instanceof SkerError) {
    return {
      ...baseResponse,
      debug: {
        stack: error.stack,
        originalError: error.originalError,
        context: error.context
      }
    };
  }

  return {
    ...baseResponse,
    debug: {
      stack: error?.stack,
      originalError: error
    }
  };
}

export class ApiErrorFormatter {
  constructor(
    private options: {
      includeStackTrace: boolean;
      includeSensitiveData: boolean;
      defaultTraceIdProvider?: () => string;
      defaultRequestIdProvider?: () => string;
    }
  ) {}

  format(error: any, context?: {
    traceId?: string;
    requestId?: string;
  }): ErrorResponse {
    const traceId = context?.traceId || this.options.defaultTraceIdProvider?.();
    const requestId = context?.requestId || this.options.defaultRequestIdProvider?.();

    return formatErrorForApi(error, {
      includeStackTrace: this.options.includeStackTrace,
      includeSensitiveData: this.options.includeSensitiveData,
      traceId,
      requestId
    });
  }
}

// 预定义的格式化器
export const productionFormatter = new ApiErrorFormatter({
  includeStackTrace: false,
  includeSensitiveData: false
});

export const developmentFormatter = new ApiErrorFormatter({
  includeStackTrace: true,
  includeSensitiveData: true
});

export const testingFormatter = new ApiErrorFormatter({
  includeStackTrace: true,
  includeSensitiveData: true,
  defaultTraceIdProvider: () => 'test-trace-id',
  defaultRequestIdProvider: () => 'test-request-id'
});