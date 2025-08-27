// 重新导出@sker/error-core中的错误处理功能
import { SystemError as BaseSystemError, isSkerError, wrapError } from '@sker/error-core';

export { BaseSystemError as SystemError, isSkerError, wrapError };

// 重新导出错误码
export {
  SYSTEM_ERROR_CODES,
  CORE_ERROR_CODES,
  type ErrorCode
} from '@sker/constants';

// 为了向后兼容，创建ErrorCodes枚举
export const ErrorCodes = {
  UNKNOWN: '100000',
  INITIALIZATION_FAILED: '100006',
  START_FAILED: '100007',
  STOP_FAILED: '100008',
  CONFIG_ERROR: '150001',
  PLUGIN_ERROR: '150002',
  CONTEXT_ERROR: '150003',
  MIDDLEWARE_ERROR: '150004',
  EVENT_ERROR: '150005'
} as const;

export type ErrorCodes = typeof ErrorCodes[keyof typeof ErrorCodes];

// 为Core模块创建一个具体的错误类
export class SkerError extends BaseSystemError {
  // 确保message属性可访问
  declare public readonly message: string;
  
  constructor(
    code: string = ErrorCodes.UNKNOWN,
    message?: string,
    details?: any[] | Record<string, any>,
    cause?: Error
  ) {
    // 兼容处理不同的details格式
    let formattedDetails: any[] = [];
    if (Array.isArray(details)) {
      formattedDetails = details;
    } else if (details && typeof details === 'object') {
      formattedDetails = [{ 
        field: 'details', 
        error_code: code, 
        error_message: JSON.stringify(details)
      }];
    }

    super({
      code,
      message: message || code,
      details: formattedDetails,
      originalError: cause,
      context: {}
    });
  }
}

// 为了向后兼容的函数别名
export function createError(
  code: string,
  message?: string,
  details?: any[] | Record<string, any>,
  cause?: Error
): SkerError {
  return new SkerError(code, message, details, cause);
}

export function isError(error: any): error is Error {
  return error instanceof Error;
}