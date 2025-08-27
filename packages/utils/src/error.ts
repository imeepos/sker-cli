export interface ErrorContext {
  [key: string]: any;
}

export class CustomError extends Error {
  public readonly code: string;
  public readonly context: ErrorContext;
  public readonly timestamp: Date;
  public override readonly cause: Error | undefined;

  constructor(
    code: string,
    message: string,
    context: ErrorContext = {},
    cause?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.context = context;
    this.timestamp = new Date();
    this.cause = cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): object {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      context: this.context,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
      cause: this.cause?.message
    };
  }
}

export function createError(
  code: string,
  message: string,
  context: ErrorContext = {}
): CustomError {
  return new CustomError(code, message, context);
}

export function wrapError(
  error: Error,
  code: string,
  message: string,
  context: ErrorContext = {}
): CustomError {
  return new CustomError(code, message, context, error);
}

export function isErrorType(error: any, type: string): boolean {
  return error instanceof Error &&
    (error.name === type ||
      (error as CustomError).code === type);
}

export interface ErrorHandlerOptions {
  onError?: (error: Error) => void;
  retries?: number;
  backoff?: 'fixed' | 'linear' | 'exponential';
  delay?: number;
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export class ErrorHandler {
  private options: Required<ErrorHandlerOptions>;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      onError: options.onError || (() => { }),
      retries: options.retries || 0,
      backoff: options.backoff || 'fixed',
      delay: options.delay || 1000,
      shouldRetry: options.shouldRetry || (() => true)
    };
  }

  wrap<T extends (...args: any[]) => any>(fn: T): T {
    return ((...args: Parameters<T>) => {
      return this.execute(() => fn(...args));
    }) as T;
  }

  async execute<T>(fn: () => T | Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= this.options.retries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        this.options.onError(lastError);

        if (attempt === this.options.retries) break;
        if (!this.options.shouldRetry(lastError, attempt + 1)) break;

        await this.delay(attempt + 1);
      }
    }

    throw lastError!;
  }

  private async delay(attempt: number): Promise<void> {
    let ms = this.options.delay;

    switch (this.options.backoff) {
      case 'linear':
        ms *= attempt;
        break;
      case 'exponential':
        ms *= Math.pow(2, attempt - 1);
        break;
    }

    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export function safeAsync<T>(
  fn: () => Promise<T>
): Promise<[Error | null, T | null]> {
  return fn()
    .then(result => [null, result] as [null, T])
    .catch(error => [error, null] as [Error, null]);
}

export function safeSync<T>(fn: () => T): [Error | null, T | null] {
  try {
    const result = fn();
    return [null, result];
  } catch (error) {
    return [error as Error, null];
  }
}

export class ErrorCollector {
  private errors: Error[] = [];

  add(error: Error): void {
    this.errors.push(error);
  }

  addAll(errors: Error[]): void {
    this.errors.push(...errors);
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getErrors(): Error[] {
    return [...this.errors];
  }

  getFirst(): Error | undefined {
    return this.errors[0];
  }

  getLast(): Error | undefined {
    return this.errors[this.errors.length - 1];
  }

  clear(): void {
    this.errors = [];
  }

  throwIfAny(): void {
    if (this.hasErrors()) {
      if (this.errors.length === 1) {
        throw this.errors[0];
      } else {
        throw new AggregateError(this.errors, `${this.errors.length} errors occurred`);
      }
    }
  }

  count(): number {
    return this.errors.length;
  }
}

export class AggregateError extends Error {
  public readonly errors: Error[];

  constructor(errors: Error[], message?: string) {
    super(message || `${errors.length} errors occurred`);
    this.name = 'AggregateError';
    this.errors = errors;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors.map(err => err.message),
      stack: this.stack
    };
  }
}