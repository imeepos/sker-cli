import { EventEmitter } from 'events';

declare enum LogLevel {
    TRACE = 0,
    DEBUG = 1,
    INFO = 2,
    WARN = 3,
    ERROR = 4,
    FATAL = 5
}
declare enum LogFormat {
    JSON = "json",
    PRETTY = "pretty",
    TEXT = "text"
}
interface ServiceInfo {
    name: string;
    version: string;
    instance_id?: string;
    environment?: string;
}
interface LogMetadata {
    source_file?: string;
    function_name?: string;
    line_number?: number;
    [key: string]: any;
}
interface LogContext {
    request_id?: string;
    trace_id?: string;
    span_id?: string;
    user_id?: string;
    correlation_id?: string;
    [key: string]: any;
}
interface LogEntry {
    timestamp: string;
    level: LogLevel;
    message: string;
    service: ServiceInfo;
    context?: LogContext;
    metadata?: LogMetadata;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string | number;
    };
}
interface TraceContext {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    flags?: number;
    baggage?: Record<string, string>;
}
interface Span {
    spanId: string;
    traceId: string;
    operationName: string;
    startTime: number;
    endTime?: number;
    tags: Record<string, any>;
    logs: Array<{
        timestamp: number;
        fields: Record<string, any>;
    }>;
    references: Array<{
        type: 'childOf' | 'followsFrom';
        spanContext: TraceContext;
    }>;
    setTag(key: string, value: any): Span;
    log(fields: Record<string, any>): Span;
    recordException(error: Error): Span;
    end(): void;
}
interface TracingConfig {
    enabled: boolean;
    sampling: number;
    exporters?: string[];
    serviceName?: string;
}
interface PerformanceConfig {
    enabled: boolean;
    includeSystemMetrics: boolean;
    customMetrics?: string[];
    metricsInterval?: number;
}
interface OutputConfig {
    type: 'console' | 'file' | 'elasticsearch' | 'custom';
    enabled: boolean;
    format?: LogFormat;
    config?: {
        filename?: string;
        maxSize?: string;
        maxFiles?: number;
        compress?: boolean;
        host?: string;
        index?: string;
        [key: string]: any;
    };
}
interface LoggerConfig {
    name?: string;
    service?: ServiceInfo;
    level?: LogLevel;
    format?: LogFormat;
    outputs?: OutputConfig[];
    tracing?: TracingConfig;
    performance?: PerformanceConfig;
    context?: {
        autoInjectTraceId?: boolean;
        autoInjectRequestId?: boolean;
        includeSourceInfo?: boolean;
    };
    filters?: Array<(entry: LogEntry) => LogEntry | null>;
    async?: boolean;
    bufferSize?: number;
    flushInterval?: number;
    onError?: (error: Error) => void;
}
interface OutputAdapter {
    write(entry: LogEntry): Promise<void> | void;
    close?(): Promise<void> | void;
    flush?(): Promise<void> | void;
}
interface BatchOutputAdapter extends OutputAdapter {
    writeBatch(entries: LogEntry[]): Promise<void> | void;
}
interface LogFilter {
    condition: (entry: LogEntry) => boolean;
    transform: (entry: LogEntry) => LogEntry | null;
}
interface ContextProvider {
    getContext(): LogContext;
}
interface MetricValue {
    name: string;
    value: number;
    tags?: Record<string, string>;
    timestamp?: number;
}
interface PerformanceMetrics {
    cpu_usage_percent?: number;
    memory_usage_bytes?: number;
    response_time_ms?: number;
    request_count?: number;
    error_count?: number;
    [key: string]: any;
}
interface MonitoringDecorator {
    (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
}
interface ErrorReportingConfig {
    enabled: boolean;
    service?: string;
    config?: Record<string, any>;
}
interface LoggerMiddlewareConfig {
    logger: any;
    includeRequest?: boolean;
    includeResponse?: boolean;
    sensitiveFields?: string[];
    logRequests?: boolean;
    logResponses?: boolean;
    logErrors?: boolean;
    logCalls?: boolean;
    logResults?: boolean;
}

declare class Logger extends EventEmitter {
    private config;
    private outputs;
    private contextStorage;
    private buffer;
    private flushTimer?;
    private contextProvider?;
    constructor(config?: LoggerConfig);
    private initializeOutputs;
    private createOutputAdapter;
    private startFlushTimer;
    protected getCurrentContext(): LogContext;
    private getSourceInfo;
    private createLogEntry;
    private applyFilters;
    private writeEntry;
    private writeToOutputs;
    isLevelEnabled(level: LogLevel): boolean;
    setLevel(level: LogLevel): void;
    child(context: LogContext): Logger;
    trace(message: string, context?: LogContext): void;
    debug(message: string, context?: LogContext): void;
    info(message: string, context?: LogContext): void;
    warn(message: string, context?: LogContext): void;
    error(message: string, context?: LogContext, error?: Error): void;
    fatal(message: string, context?: LogContext, error?: Error): void;
    flush(): Promise<void>;
    close(): Promise<void>;
    runInContext<T>(context: LogContext, fn: () => T): T;
    private generateUUID;
    private generateTraceId;
}

declare class TracingLogger extends Logger {
    private traceStorage;
    private activeSpans;
    private tracingConfig;
    constructor(config?: LoggerConfig);
    startSpan(operationName: string, parentSpan?: Span): Span;
    getCurrentTraceContext(): TraceContext | undefined;
    runInTrace<T>(traceContext: TraceContext, fn: () => T): T;
    runInTraceAsync<T>(traceContext: TraceContext, fn: () => Promise<T>): Promise<T>;
    protected getCurrentContext(): LogContext;
    private createTraceId;
    private createSpanId;
}
declare function createTraceContext(data: {
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
    flags?: number;
    baggage?: Record<string, string>;
}): TraceContext;

declare class PerformanceLogger extends TracingLogger {
    private performanceConfig;
    private counters;
    private histograms;
    private gauges;
    private metricsTimer?;
    constructor(config?: LoggerConfig);
    private startSystemMetricsCollection;
    private collectSystemMetrics;
    private getCpuUsage;
    incrementCounter(name: string, tags?: Record<string, string>): void;
    recordHistogram(name: string, value: number, tags?: Record<string, string>): void;
    recordGauge(name: string, value: number, tags?: Record<string, string>): void;
    getMetricsSummary(): {
        counters: Record<string, number>;
        histograms: Record<string, {
            count: number;
            min: number;
            max: number;
            avg: number;
            p95: number;
        }>;
        gauges: Record<string, number>;
    };
    monitor(operationName: string): MonitoringDecorator;
    measureAsync<T>(operationName: string, operation: () => Promise<T>, tags?: Record<string, string>): Promise<T>;
    measure<T>(operationName: string, operation: () => T, tags?: Record<string, string>): T;
    private createMetricKey;
    close(): Promise<void>;
}

declare class FileOutputAdapter implements OutputAdapter {
    private config;
    private writeStream?;
    private currentSize;
    constructor(config: {
        filename: string;
        maxSize?: string;
        maxFiles?: number;
        compress?: boolean;
    });
    write(entry: LogEntry): Promise<void>;
    private openFile;
    private shouldRotate;
    private parseSize;
    private rotateFile;
    private compressFile;
    flush(): Promise<void>;
    close(): Promise<void>;
}
declare class ElasticsearchOutputAdapter implements OutputAdapter {
    private config;
    private readonly baseUrl;
    constructor(config: {
        host: string;
        index: string;
        type?: string;
        username?: string;
        password?: string;
    });
    write(entry: LogEntry): Promise<void>;
    private getAuthHeaders;
}
declare class BatchElasticsearchOutputAdapter implements BatchOutputAdapter {
    private config;
    private options;
    private buffer;
    private timer?;
    constructor(config: {
        host: string;
        index: string;
        type?: string;
        username?: string;
        password?: string;
    }, options?: {
        batchSize: number;
        flushInterval: number;
        maxRetries: number;
    });
    write(entry: LogEntry): Promise<void>;
    writeBatch(entries: LogEntry[]): Promise<void>;
    flush(): Promise<void>;
    private startFlushTimer;
    private getAuthHeaders;
    close(): Promise<void>;
}
declare class ConsoleOutputAdapter implements OutputAdapter {
    private format;
    constructor(format?: LogFormat);
    write(entry: LogEntry): void;
    private getLogFunction;
    private formatPretty;
}
declare class MultiOutputAdapter implements OutputAdapter {
    private outputs;
    constructor(outputs: OutputAdapter[]);
    write(entry: LogEntry): Promise<void>;
    flush(): Promise<void>;
    close(): Promise<void>;
}
declare function createFilter(options: {
    condition: (entry: LogEntry) => boolean;
    transform: (entry: LogEntry) => LogEntry | null;
}): (entry: LogEntry) => LogEntry | null;

declare function createLogger(config?: LoggerConfig): Logger;
declare function createConsoleLogger(config?: Partial<LoggerConfig>): Logger;
declare function createFileLogger(filename: string, config?: Partial<LoggerConfig>): Logger;
declare function createElasticsearchLogger(elasticsearchConfig: {
    host: string;
    index: string;
    type?: string;
    username?: string;
    password?: string;
}, config?: Partial<LoggerConfig>): Logger;
declare function createProductionLogger(config?: Partial<LoggerConfig>): Logger;
declare function createDevelopmentLogger(config?: Partial<LoggerConfig>): Logger;
declare function createTestLogger(config?: Partial<LoggerConfig>): Logger;
declare function createStructuredLogger(serviceName: string, version: string, config?: Partial<LoggerConfig>): Logger;
declare function createOutputAdapter(config: OutputConfig): OutputAdapter;

declare function createLoggerMiddleware(config: LoggerMiddlewareConfig): (req: any, res: any, next: any) => void;
declare function createKoaLoggerMiddleware(config: LoggerMiddlewareConfig): (ctx: any, next: any) => Promise<void>;
declare function createGrpcLoggerInterceptor(config: LoggerMiddlewareConfig): (call: any, callback: any) => void;
declare function createFastifyPlugin(logger: Logger): (fastify: any) => Promise<void>;

export { BatchElasticsearchOutputAdapter, type BatchOutputAdapter, ConsoleOutputAdapter, type ContextProvider, ElasticsearchOutputAdapter, type ErrorReportingConfig, FileOutputAdapter, type LogContext, type LogEntry, type LogFilter, LogFormat, LogLevel, type LogMetadata, Logger, type LoggerConfig, type LoggerMiddlewareConfig, type MetricValue, type MonitoringDecorator, MultiOutputAdapter, type OutputAdapter, type OutputConfig, type PerformanceConfig, PerformanceLogger, type PerformanceMetrics, type ServiceInfo, type Span, type TraceContext, type TracingConfig, TracingLogger, createConsoleLogger, createDevelopmentLogger, createElasticsearchLogger, createFastifyPlugin, createFileLogger, createFilter, createGrpcLoggerInterceptor, createKoaLoggerMiddleware, createLogger, createLoggerMiddleware, createOutputAdapter, createProductionLogger, createStructuredLogger, createTestLogger, createTraceContext };
