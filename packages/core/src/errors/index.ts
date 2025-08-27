import { ErrorCodes } from '../types/index.js';

export class SkerError extends Error {
  public readonly code: ErrorCodes;
  public readonly details: Record<string, any> | undefined;
  public override readonly cause: Error | undefined;

  constructor(
    code: ErrorCodes = ErrorCodes.UNKNOWN,
    message?: string,
    details?: Record<string, any>,
    cause?: Error
  ) {
    super(message || code);
    this.name = 'SkerError';
    this.code = code;
    this.details = details;
    this.cause = cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SkerError);
    }
  }

  public toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
      cause: this.cause?.message
    };
  }

  public override toString(): string {
    let result = `${this.name} [${this.code}]: ${this.message}`;

    if (this.details) {
      result += `\nDetails: ${JSON.stringify(this.details, null, 2)}`;
    }

    if (this.cause) {
      result += `\nCaused by: ${this.cause.message}`;
    }

    return result;
  }
}

export function createError(
  code: ErrorCodes,
  message?: string,
  details?: Record<string, any>,
  cause?: Error
): SkerError {
  return new SkerError(code, message, details, cause);
}

export function isError(error: any): error is Error {
  return error instanceof Error;
}

export function isSkerError(error: any): error is SkerError {
  return error instanceof SkerError;
}

export function wrapError(error: unknown, code: ErrorCodes, message?: string): SkerError {
  if (isSkerError(error)) {
    return error;
  }

  if (isError(error)) {
    return new SkerError(code, message || error.message, undefined, error);
  }

  return new SkerError(code, message || String(error));
}

export { ErrorCodes };