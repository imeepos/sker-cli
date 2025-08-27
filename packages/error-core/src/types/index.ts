export interface ErrorDetail {
  field: string;
  error_code: string;
  error_message: string;
  context?: any;
}

export interface ErrorOptions {
  code?: string;
  message: string;
  details?: ErrorDetail[];
  context?: Record<string, any>;
  originalError?: Error | any;
  httpStatusCode?: number;
  timestamp?: Date;
  traceId?: string;
  requestId?: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    timestamp: string;
    trace_id?: string;
    request_id?: string;
  };
  success: false;
}

export interface ErrorContext {
  operation?: string;
  userId?: string;
  traceId?: string;
  requestId?: string;
  [key: string]: any;
}

export type ErrorCategory = 'system' | 'business' | 'integration' | 'security';

export interface ValidationDetail {
  field: string;
  rule: string;
  message: string;
  value?: any;
}

export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  jitter?: boolean;
  retryCondition?: (error: any, attempt: number) => boolean;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxCalls?: number;
  monitoringPeriod?: number;
  onStateChange?: (state: CircuitBreakerState) => void;
}

export type CircuitBreakerState = 'closed' | 'open' | 'half-open';

export interface FallbackOptions {
  fallback: (error: any, context: any) => Promise<any>;
  condition?: (error: any) => boolean;
}

export interface ErrorCollectorOptions {
  samplingRate?: number;
  filters?: Array<(error: any) => boolean>;
  reporters?: ErrorReporter[];
  enrichers?: Array<(error: any, context: any) => any>;
}

export interface ErrorReporter {
  type: string;
  config: Record<string, any>;
}

export interface AlertingRule {
  name: string;
  condition: string;
  duration: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
}

export interface BackoffStrategy {
  calculateDelay(attempt: number, baseDelay: number): number;
}