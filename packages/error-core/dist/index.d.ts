interface ErrorDetail {
    field: string;
    error_code: string;
    error_message: string;
    context?: any;
}
interface ErrorOptions {
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
interface ErrorResponse {
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
interface ErrorContext {
    operation?: string;
    userId?: string;
    traceId?: string;
    requestId?: string;
    [key: string]: any;
}
type ErrorCategory = 'system' | 'business' | 'integration' | 'security';
interface ValidationDetail {
    field: string;
    rule: string;
    message: string;
    value?: any;
}
interface RetryOptions {
    maxAttempts: number;
    initialDelay: number;
    backoffMultiplier?: number;
    maxDelay?: number;
    jitter?: boolean;
    retryCondition?: (error: any, attempt: number) => boolean;
}
interface CircuitBreakerOptions$1 {
    failureThreshold: number;
    resetTimeout: number;
    halfOpenMaxCalls?: number;
    monitoringPeriod?: number;
    onStateChange?: (state: CircuitBreakerState) => void;
}
type CircuitBreakerState = 'closed' | 'open' | 'half-open';
interface FallbackOptions {
    fallback: (error: any, context: any) => Promise<any>;
    condition?: (error: any) => boolean;
}
interface ErrorCollectorOptions {
    samplingRate?: number;
    filters?: Array<(error: any) => boolean>;
    reporters?: ErrorReporter[];
    enrichers?: Array<(error: any, context: any) => any>;
}
interface ErrorReporter {
    type: string;
    config: Record<string, any>;
}
interface AlertingRule {
    name: string;
    condition: string;
    duration: string;
    labels: Record<string, string>;
    annotations: Record<string, string>;
}
interface BackoffStrategy {
    calculateDelay(attempt: number, baseDelay: number): number;
}

declare const SYSTEM_ERROR_CODES: {
    readonly GENERIC_ERROR: "100001";
    readonly SERVICE_UNAVAILABLE: "100002";
    readonly DATABASE_CONNECTION_FAILED: "100003";
    readonly TIMEOUT: "100004";
    readonly MEMORY_OVERFLOW: "100005";
    readonly RESOURCE_EXHAUSTED: "100006";
    readonly CONFIGURATION_ERROR: "100007";
    readonly DEPENDENCY_FAILURE: "100008";
    readonly NETWORK_ERROR: "100009";
    readonly FILE_SYSTEM_ERROR: "100010";
};
declare const BUSINESS_ERROR_CODES: {
    readonly VALIDATION_FAILED: "200001";
    readonly USER_NOT_FOUND: "201001";
    readonly USER_ALREADY_EXISTS: "201002";
    readonly USER_INACTIVE: "201003";
    readonly INVALID_CREDENTIALS: "201004";
    readonly PERMISSION_DENIED: "201005";
    readonly RESOURCE_NOT_FOUND: "202001";
    readonly RESOURCE_CONFLICT: "202002";
    readonly RESOURCE_LOCKED: "202003";
    readonly INVALID_INPUT: "203001";
    readonly INVALID_FORMAT: "203002";
    readonly INVALID_RANGE: "203003";
    readonly BUSINESS_RULE_VIOLATION: "204001";
    readonly WORKFLOW_ERROR: "204002";
    readonly STATE_TRANSITION_ERROR: "204003";
};
declare const INTEGRATION_ERROR_CODES: {
    readonly EXTERNAL_SERVICE_UNAVAILABLE: "300001";
    readonly EXTERNAL_SERVICE_TIMEOUT: "300002";
    readonly API_RATE_LIMIT_EXCEEDED: "300003";
    readonly PROTOCOL_ERROR: "300004";
    readonly SERIALIZATION_ERROR: "300005";
    readonly DESERIALIZATION_ERROR: "300006";
    readonly VERSION_MISMATCH: "300007";
    readonly AUTHENTICATION_FAILED: "300008";
    readonly AUTHORIZATION_FAILED: "300009";
    readonly CONTRACT_VIOLATION: "300010";
};
declare const SECURITY_ERROR_CODES: {
    readonly AUTHENTICATION_REQUIRED: "400001";
    readonly AUTHENTICATION_FAILED: "400002";
    readonly AUTHORIZATION_FAILED: "400003";
    readonly ACCESS_DENIED: "400004";
    readonly TOKEN_EXPIRED: "400005";
    readonly TOKEN_INVALID: "400006";
    readonly SECURITY_VIOLATION: "400007";
    readonly SUSPICIOUS_ACTIVITY: "400008";
    readonly RATE_LIMIT_EXCEEDED: "400009";
    readonly ENCRYPTION_FAILED: "400010";
    readonly DECRYPTION_FAILED: "400011";
    readonly SIGNATURE_INVALID: "400012";
};
declare const ERROR_CODES: {
    readonly AUTHENTICATION_REQUIRED: "400001";
    readonly AUTHENTICATION_FAILED: "400002";
    readonly AUTHORIZATION_FAILED: "400003";
    readonly ACCESS_DENIED: "400004";
    readonly TOKEN_EXPIRED: "400005";
    readonly TOKEN_INVALID: "400006";
    readonly SECURITY_VIOLATION: "400007";
    readonly SUSPICIOUS_ACTIVITY: "400008";
    readonly RATE_LIMIT_EXCEEDED: "400009";
    readonly ENCRYPTION_FAILED: "400010";
    readonly DECRYPTION_FAILED: "400011";
    readonly SIGNATURE_INVALID: "400012";
    readonly EXTERNAL_SERVICE_UNAVAILABLE: "300001";
    readonly EXTERNAL_SERVICE_TIMEOUT: "300002";
    readonly API_RATE_LIMIT_EXCEEDED: "300003";
    readonly PROTOCOL_ERROR: "300004";
    readonly SERIALIZATION_ERROR: "300005";
    readonly DESERIALIZATION_ERROR: "300006";
    readonly VERSION_MISMATCH: "300007";
    readonly CONTRACT_VIOLATION: "300010";
    readonly VALIDATION_FAILED: "200001";
    readonly USER_NOT_FOUND: "201001";
    readonly USER_ALREADY_EXISTS: "201002";
    readonly USER_INACTIVE: "201003";
    readonly INVALID_CREDENTIALS: "201004";
    readonly PERMISSION_DENIED: "201005";
    readonly RESOURCE_NOT_FOUND: "202001";
    readonly RESOURCE_CONFLICT: "202002";
    readonly RESOURCE_LOCKED: "202003";
    readonly INVALID_INPUT: "203001";
    readonly INVALID_FORMAT: "203002";
    readonly INVALID_RANGE: "203003";
    readonly BUSINESS_RULE_VIOLATION: "204001";
    readonly WORKFLOW_ERROR: "204002";
    readonly STATE_TRANSITION_ERROR: "204003";
    readonly GENERIC_ERROR: "100001";
    readonly SERVICE_UNAVAILABLE: "100002";
    readonly DATABASE_CONNECTION_FAILED: "100003";
    readonly TIMEOUT: "100004";
    readonly MEMORY_OVERFLOW: "100005";
    readonly RESOURCE_EXHAUSTED: "100006";
    readonly CONFIGURATION_ERROR: "100007";
    readonly DEPENDENCY_FAILURE: "100008";
    readonly NETWORK_ERROR: "100009";
    readonly FILE_SYSTEM_ERROR: "100010";
};
type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
declare function getErrorCategory(code: string): ErrorCategory;
declare const HTTP_STATUS_MAPPING: Record<ErrorCategory, number>;
declare function getHttpStatusForCategory(category: ErrorCategory): number;
declare function getHttpStatusForErrorCode(code: string): number;

declare abstract class SkerError extends Error {
    readonly code: string;
    readonly details: ErrorDetail[];
    readonly context: Record<string, any>;
    readonly originalError?: Error | any;
    readonly httpStatusCode: number;
    readonly timestamp: Date;
    readonly traceId?: string;
    readonly requestId?: string;
    abstract readonly category: ErrorCategory;
    constructor(options: ErrorOptions);
    toResponse(): ErrorResponse;
    toJSON(): Record<string, any>;
    toString(): string;
    withContext(additionalContext: Record<string, any>): this;
    withTraceId(traceId: string): this;
    withRequestId(requestId: string): this;
}

declare class SystemError extends SkerError {
    readonly category: ErrorCategory;
    constructor(options: ErrorOptions);
}
declare class BusinessError extends SkerError {
    readonly category: ErrorCategory;
    constructor(options: ErrorOptions);
}
declare class IntegrationError extends SkerError {
    readonly category: ErrorCategory;
    constructor(options: ErrorOptions);
}
declare class SecurityError extends SkerError {
    readonly category: ErrorCategory;
    constructor(options: ErrorOptions);
}
declare class ValidationError extends BusinessError {
    readonly validationErrors: Array<{
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
        }>;
    });
    toResponse(): {
        error: {
            validation_errors: {
                field: string;
                rule: string;
                message: string;
                value?: any;
            }[];
            code: string;
            message: string;
            details?: ErrorDetail[];
            timestamp: string;
            trace_id?: string;
            request_id?: string;
        };
        success: false;
    };
}
declare function createSystemError(options: Omit<ErrorOptions, 'httpStatusCode'>): SystemError;
declare function createBusinessError(options: Omit<ErrorOptions, 'httpStatusCode'>): BusinessError;
declare function createIntegrationError(options: Omit<ErrorOptions, 'httpStatusCode'>): IntegrationError;
declare function createSecurityError(options: Omit<ErrorOptions, 'httpStatusCode'>): SecurityError;
declare function createValidationError(message: string, validationErrors: Array<{
    field: string;
    rule: string;
    message: string;
    value?: any;
}>, context?: Record<string, any>): ValidationError;

declare function isSkerError(error: any): error is SkerError;
declare function isSystemError(error: any): error is SystemError;
declare function isBusinessError(error: any): error is BusinessError;
declare function isIntegrationError(error: any): error is IntegrationError;
declare function isSecurityError(error: any): error is SecurityError;
declare function isErrorOfCategory(error: any, category: string): boolean;
declare function wrapError(error: any, additionalContext?: Record<string, any>): SkerError;
declare function sanitizeErrorForLogging(error: SkerError, sensitiveFields?: string[]): any;
declare function extractErrorInfo(error: any): {
    message: string;
    code: string;
    category: string;
    stack?: string;
};
declare function createErrorFromCode(code: string, message: string, context?: Record<string, any>): SkerError;

declare function createErrorResponse(options: {
    code: string;
    message: string;
    details?: ErrorDetail[];
    traceId?: string;
    requestId?: string;
    timestamp?: Date;
}): ErrorResponse;
declare function errorToResponse(error: SkerError): ErrorResponse;
declare function formatErrorForApi(error: any, options?: {
    includeStackTrace?: boolean;
    includeSensitiveData?: boolean;
    traceId?: string;
    requestId?: string;
}): ErrorResponse;
declare function formatErrorForClient(error: any): ErrorResponse;
declare function formatErrorForDevelopment(error: any): ErrorResponse & {
    debug?: {
        stack?: string;
        originalError?: any;
        context?: Record<string, any>;
    };
};
declare class ApiErrorFormatter {
    private options;
    constructor(options: {
        includeStackTrace: boolean;
        includeSensitiveData: boolean;
        defaultTraceIdProvider?: () => string;
        defaultRequestIdProvider?: () => string;
    });
    format(error: any, context?: {
        traceId?: string;
        requestId?: string;
    }): ErrorResponse;
}
declare const productionFormatter: ApiErrorFormatter;
declare const developmentFormatter: ApiErrorFormatter;
declare const testingFormatter: ApiErrorFormatter;

declare class ExponentialBackoffStrategy implements BackoffStrategy {
    private multiplier;
    private maxDelay;
    private jitter;
    constructor(multiplier?: number, maxDelay?: number, jitter?: boolean);
    calculateDelay(attempt: number, baseDelay: number): number;
}
declare class LinearBackoffStrategy implements BackoffStrategy {
    private increment;
    private maxDelay;
    private jitter;
    constructor(increment?: number, maxDelay?: number, jitter?: boolean);
    calculateDelay(attempt: number, baseDelay: number): number;
}
declare class FixedBackoffStrategy implements BackoffStrategy {
    private jitter;
    constructor(jitter?: boolean);
    calculateDelay(_attempt: number, baseDelay: number): number;
}

declare class RetryStrategy {
    private options;
    private backoffStrategy;
    constructor(options: RetryOptions);
    private createBackoffStrategy;
    execute<T>(fn: () => Promise<T>, _context?: Record<string, any>): Promise<T>;
    private sleep;
}
declare class RetryBuilder {
    private options;
    maxAttempts(attempts: number): this;
    initialDelay(delay: number): this;
    backoffMultiplier(multiplier: number): this;
    maxDelay(delay: number): this;
    withJitter(): this;
    retryOn(condition: (error: any, attempt: number) => boolean): this;
    build(): RetryStrategy;
}
declare const DEFAULT_RETRY_STRATEGY: RetryStrategy;
declare const AGGRESSIVE_RETRY_STRATEGY: RetryStrategy;
declare const CONSERVATIVE_RETRY_STRATEGY: RetryStrategy;
declare function createRetryStrategy(): RetryBuilder;
declare function retryWithExponentialBackoff<T>(fn: () => Promise<T>, maxAttempts?: number, initialDelay?: number): Promise<T>;
declare function retryWithLinearBackoff<T>(fn: () => Promise<T>, maxAttempts?: number, initialDelay?: number): Promise<T>;

declare class CircuitBreakerStrategy {
    private options;
    private state;
    private failureCount;
    private successCount;
    private nextAttemptTime?;
    constructor(options: CircuitBreakerOptions$1);
    execute<T>(fn: () => Promise<T>): Promise<T>;
    private onSuccess;
    private onFailure;
    private shouldAttemptReset;
    private setNextAttemptTime;
    private notifyStateChange;
    getState(): CircuitBreakerState;
    getFailureCount(): number;
    getSuccessCount(): number;
    reset(): void;
    forceOpen(): void;
    forceClose(): void;
}
declare class CircuitBreakerBuilder {
    private options;
    failureThreshold(threshold: number): this;
    resetTimeout(timeout: number): this;
    halfOpenMaxCalls(calls: number): this;
    monitoringPeriod(period: number): this;
    onStateChange(callback: (state: CircuitBreakerState) => void): this;
    build(): CircuitBreakerStrategy;
}
declare const DEFAULT_CIRCUIT_BREAKER: CircuitBreakerStrategy;
declare const AGGRESSIVE_CIRCUIT_BREAKER: CircuitBreakerStrategy;
declare const CONSERVATIVE_CIRCUIT_BREAKER: CircuitBreakerStrategy;
declare function createCircuitBreaker(): CircuitBreakerBuilder;

declare class FallbackStrategy {
    private options;
    constructor(options: FallbackOptions);
    execute<T>(fn: () => Promise<T>, context?: Record<string, any>): Promise<T>;
    private shouldUseFallback;
}
declare class ErrorRecoveryStrategy {
    private strategies;
    constructor(strategies: Array<{
        type: 'retry' | 'fallback' | 'circuit-breaker';
        strategy: any;
    }>);
    execute<T>(fn: () => Promise<T>, context?: Record<string, any>): Promise<T>;
}
declare class CacheFallbackStrategy extends FallbackStrategy {
    private cache;
    private keyGenerator;
    constructor(cache?: Map<string, any>, keyGenerator?: (context: Record<string, any>) => string, condition?: (error: any) => boolean);
    setCachedValue(context: Record<string, any>, value: any): void;
    clearCache(): void;
}
declare class DefaultValueFallbackStrategy extends FallbackStrategy {
    private defaultValue;
    constructor(defaultValue: any, condition?: (error: any) => boolean);
}
declare class AlternativeServiceFallbackStrategy extends FallbackStrategy {
    private alternativeService;
    constructor(alternativeService: () => Promise<any>, condition?: (error: any) => boolean);
}
declare function createFallbackStrategy(fallback: (error: any, context: any) => Promise<any>, condition?: (error: any) => boolean): FallbackStrategy;
declare function createCacheFallback(cache?: Map<string, any>, keyGenerator?: (context: Record<string, any>) => string, condition?: (error: any) => boolean): CacheFallbackStrategy;
declare function createDefaultValueFallback<T>(defaultValue: T, condition?: (error: any) => boolean): DefaultValueFallbackStrategy;
declare function createAlternativeServiceFallback(alternativeService: () => Promise<any>, condition?: (error: any) => boolean): AlternativeServiceFallbackStrategy;

interface HandleErrorsOptions {
    onError?: (error: any, context?: any) => void;
    rethrow?: boolean;
    wrapUnknownErrors?: boolean;
    contextProvider?: () => Record<string, any>;
}
interface RetryOnErrorOptions {
    maxAttempts: number;
    delay: number;
    backoff?: 'fixed' | 'linear' | 'exponential';
    retryCondition?: (error: any) => boolean;
}
interface CircuitBreakerOptions {
    failureThreshold: number;
    resetTimeout: number;
    monitoringPeriod?: number;
    onStateChange?: (state: string) => void;
}
declare function HandleErrors(options?: HandleErrorsOptions): (_target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare function RetryOnError(options: RetryOnErrorOptions): (_target: any, _propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare function CircuitBreaker(options: CircuitBreakerOptions): (_target: any, _propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare function FallbackOnError(fallbackMethod: string | Function): (_target: any, _propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare function RetryWithTimeout(options: {
    maxAttempts: number;
    delay: number;
    timeout: number;
    timeoutError?: string;
}): (_target: any, _propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
declare function GlobalErrorHandler(options?: HandleErrorsOptions): <T extends {
    new (...args: any[]): {};
}>(constructor: T) => {
    new (...args: any[]): {};
} & T;
declare function ValidateParam(validator: (value: any) => boolean | string): (target: any, propertyName: string | symbol, parameterIndex: number) => void;
declare function ValidateParams(): (target: any, propertyName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;

declare class ErrorCollector {
    private options;
    private collectedErrors;
    private reporters;
    constructor(options?: ErrorCollectorOptions);
    collect(error: any, context?: Record<string, any>): Promise<void>;
    private sanitizeGenericError;
    private generateErrorId;
    private reportError;
    private reportToReporter;
    getCollectedErrors(): any[];
    getErrorCount(): number;
    getErrorsByCategory(): Record<string, number>;
    getErrorsByTimeRange(startTime: Date, endTime: Date): any[];
    clear(): void;
    addReporter(reporter: ErrorReporter): void;
    removeReporter(type: string): void;
}
declare function getGlobalErrorCollector(): ErrorCollector;
declare function setGlobalErrorCollector(collector: ErrorCollector): void;
declare function collectError(error: any, context?: Record<string, any>): Promise<void>;
declare function setupGlobalErrorHandling(collector?: ErrorCollector): void;

interface ErrorMetric {
    name: string;
    value: number;
    labels: Record<string, string>;
    timestamp: Date;
}
declare class ErrorMetrics {
    private options;
    private metrics;
    private counters;
    private timers;
    constructor(options?: {
        collectionInterval?: number;
        dimensions?: string[];
        metrics?: string[];
    });
    private startCollection;
    private collectMetrics;
    private parseLabelsFromKey;
    private calculateErrorRates;
    private calculateRecoveryTimes;
    addMetric(metric: ErrorMetric): void;
    incrementCounter(key: string, labels?: Record<string, string>, value?: number): void;
    recordTime(key: string, labels: Record<string, string>, duration: number): void;
    private buildMetricKey;
    getMetrics(filter?: {
        name?: string;
        startTime?: Date;
        endTime?: Date;
        labels?: Record<string, string>;
    }): ErrorMetric[];
    getCounters(): Record<string, number>;
    resetMetrics(): void;
}
declare class ErrorAlerting {
    private options;
    private rules;
    private alertHistory;
    constructor(options?: {
        rules?: AlertingRule[];
        notifiers?: Array<{
            type: string;
            config: Record<string, any>;
        }>;
    });
    addRule(rule: AlertingRule): void;
    removeRule(name: string): void;
    checkAlerts(metrics: ErrorMetrics): void;
    private evaluateRule;
    private triggerAlert;
    private getCurrentMetricValue;
    private sendNotifications;
    private sendNotification;
    private formatAlertMessage;
    getAlertHistory(): Array<{
        rule: AlertingRule;
        timestamp: Date;
        value: number;
    }>;
    clearAlertHistory(): void;
}

declare class ErrorTestHelper {
    private collectedErrors;
    private originalErrorHandlers;
    constructor();
    private setupErrorCapture;
    collectError(error: any): void;
    getCollectedErrors(): any[];
    getErrorsByType(type: string): any[];
    getErrorCount(): number;
    hasErrorOfType(errorType: typeof SkerError): boolean;
    hasErrorWithCode(code: string): boolean;
    reset(): void;
    cleanup(): void;
}
declare class MockErrorProvider {
    static createSystemError(options?: Partial<{
        code: string;
        message: string;
        context: Record<string, any>;
    }>): SystemError;
    static createBusinessError(options?: Partial<{
        code: string;
        message: string;
        context: Record<string, any>;
    }>): BusinessError;
    static createIntegrationError(options?: Partial<{
        code: string;
        message: string;
        context: Record<string, any>;
    }>): IntegrationError;
    static createSecurityError(options?: Partial<{
        code: string;
        message: string;
        context: Record<string, any>;
    }>): SecurityError;
    static createGenericError(message?: string): Error;
    static createAsyncError(delay?: number, error?: Error): Promise<never>;
}
interface ErrorAssertions {
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
declare function extendExpect(expect: any): void;
declare function createTestError(type?: 'system' | 'business' | 'integration' | 'security'): SkerError;
declare function expectAsyncError(asyncFn: () => Promise<any>, expectedErrorType?: typeof SkerError, expectedCode?: string): Promise<void>;
declare function mockAsyncOperation<T>(result: T, delay?: number, shouldFail?: boolean, error?: Error): () => Promise<T>;

interface ErrorHandlingConfig {
    global?: {
        includeStackTrace?: boolean;
        maxContextDepth?: number;
        sensitiveFields?: string[];
        httpStatusMapping?: Record<ErrorCategory, number>;
    };
    retry?: {
        defaultMaxAttempts?: number;
        defaultInitialDelay?: number;
        defaultBackoffMultiplier?: number;
        defaultMaxDelay?: number;
    };
    circuitBreaker?: {
        defaultFailureThreshold?: number;
        defaultResetTimeout?: number;
        defaultMonitoringPeriod?: number;
    };
    collection?: {
        enabled?: boolean;
        samplingRate?: number;
        batchSize?: number;
        flushInterval?: number;
    };
    monitoring?: {
        enabled?: boolean;
        metricsInterval?: number;
        alertingEnabled?: boolean;
    };
}
declare function configureErrorHandling(config: ErrorHandlingConfig): void;
declare function getErrorHandlingConfig(): ErrorHandlingConfig;
declare function resetErrorHandlingConfig(): void;
declare function configureFromEnvironment(): void;
declare const DEVELOPMENT_CONFIG: ErrorHandlingConfig;
declare const PRODUCTION_CONFIG: ErrorHandlingConfig;
declare const TESTING_CONFIG: ErrorHandlingConfig;

declare function withErrorContext<T>(context: ErrorContext, fn: () => Promise<T>): Promise<T>;
declare function getCurrentErrorContext(): ErrorContext | null;
declare class ErrorPropagator {
    private options;
    constructor(options?: {
        includeStackTrace?: boolean;
        includeContext?: boolean;
        maxContextDepth?: number;
    });
    propagate(error: any, additionalContext?: Record<string, any>): SkerError;
}
declare const VERSION = "1.0.0";

export { AGGRESSIVE_CIRCUIT_BREAKER, AGGRESSIVE_RETRY_STRATEGY, type AlertingRule, AlternativeServiceFallbackStrategy, ApiErrorFormatter, BUSINESS_ERROR_CODES, type BackoffStrategy, BusinessError, CONSERVATIVE_CIRCUIT_BREAKER, CONSERVATIVE_RETRY_STRATEGY, CacheFallbackStrategy, CircuitBreaker, CircuitBreakerBuilder, type CircuitBreakerOptions$1 as CircuitBreakerOptions, type CircuitBreakerState, CircuitBreakerStrategy, DEFAULT_CIRCUIT_BREAKER, DEFAULT_RETRY_STRATEGY, DEVELOPMENT_CONFIG, DefaultValueFallbackStrategy, ERROR_CODES, ErrorAlerting, type ErrorAssertions, type ErrorCategory, type ErrorCode, ErrorCollector, type ErrorCollectorOptions, type ErrorContext, type ErrorDetail, type ErrorHandlingConfig, type ErrorMetric, ErrorMetrics, type ErrorOptions, ErrorPropagator, ErrorRecoveryStrategy, type ErrorReporter, type ErrorResponse, ErrorTestHelper, ExponentialBackoffStrategy, FallbackOnError, type FallbackOptions, FallbackStrategy, FixedBackoffStrategy, GlobalErrorHandler, HTTP_STATUS_MAPPING, HandleErrors, INTEGRATION_ERROR_CODES, IntegrationError, LinearBackoffStrategy, MockErrorProvider, PRODUCTION_CONFIG, RetryBuilder, RetryOnError, type RetryOptions, RetryStrategy, RetryWithTimeout, SECURITY_ERROR_CODES, SYSTEM_ERROR_CODES, SecurityError, SkerError, SystemError, TESTING_CONFIG, VERSION, ValidateParam, ValidateParams, type ValidationDetail, ValidationError, collectError, configureErrorHandling, configureFromEnvironment, createAlternativeServiceFallback, createBusinessError, createCacheFallback, createCircuitBreaker, createDefaultValueFallback, createErrorFromCode, createErrorResponse, createFallbackStrategy, createIntegrationError, createRetryStrategy, createSecurityError, createSystemError, createTestError, createValidationError, developmentFormatter, errorToResponse, expectAsyncError, extendExpect, extractErrorInfo, formatErrorForApi, formatErrorForClient, formatErrorForDevelopment, getCurrentErrorContext, getErrorCategory, getErrorHandlingConfig, getGlobalErrorCollector, getHttpStatusForCategory, getHttpStatusForErrorCode, isBusinessError, isErrorOfCategory, isIntegrationError, isSecurityError, isSkerError, isSystemError, mockAsyncOperation, productionFormatter, resetErrorHandlingConfig, retryWithExponentialBackoff, retryWithLinearBackoff, sanitizeErrorForLogging, setGlobalErrorCollector, setupGlobalErrorHandling, testingFormatter, withErrorContext, wrapError };
