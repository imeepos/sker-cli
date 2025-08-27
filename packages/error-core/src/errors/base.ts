import { ErrorOptions, ErrorResponse, ErrorDetail, ErrorCategory } from '../types/index.js';

export abstract class SkerError extends Error {
  public readonly code: string;
  public readonly details: ErrorDetail[];
  public readonly context: Record<string, any>;
  public readonly originalError?: Error | any;
  public readonly httpStatusCode: number;
  public readonly timestamp: Date;
  public readonly traceId?: string;
  public readonly requestId?: string;
  public abstract readonly category: ErrorCategory;

  constructor(options: ErrorOptions) {
    super(options.message);
    
    this.name = this.constructor.name;
    this.code = options.code || '000000';
    this.details = options.details || [];
    this.context = options.context || {};
    this.originalError = options.originalError;
    this.httpStatusCode = options.httpStatusCode || 500;
    this.timestamp = options.timestamp || new Date();
    this.traceId = options.traceId;
    this.requestId = options.requestId;

    // 设置原型链，确保 instanceof 工作正常
    Object.setPrototypeOf(this, new.target.prototype);

    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toResponse(): ErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details.length > 0 ? this.details : undefined,
        timestamp: this.timestamp.toISOString(),
        trace_id: this.traceId,
        request_id: this.requestId
      },
      success: false
    };
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      details: this.details,
      context: this.context,
      httpStatusCode: this.httpStatusCode,
      timestamp: this.timestamp.toISOString(),
      traceId: this.traceId,
      requestId: this.requestId,
      stack: this.stack,
      originalError: this.originalError?.toString()
    };
  }

  override toString(): string {
    return `${this.name}: ${this.message} (${this.code})`;
  }

  withContext(additionalContext: Record<string, any>): this {
    Object.assign(this.context, additionalContext);
    return this;
  }

  withTraceId(traceId: string): this {
    (this as any).traceId = traceId;
    return this;
  }

  withRequestId(requestId: string): this {
    (this as any).requestId = requestId;
    return this;
  }
}