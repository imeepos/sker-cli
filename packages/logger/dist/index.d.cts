import { EventEmitter } from 'events';
import { SkerCore } from '@sker/core';

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
interface CoreLoggerOptions {
    serviceName?: string;
    version?: string;
    environment?: string;
    config?: Record<string, any>;
    plugins?: any[];
    lifecycle?: any;
    logger?: LoggerConfig;
}
interface StructuredLogData {
    [key: string]: any;
    error?: {
        name: string;
        message: string;
        stack?: string;
        code?: string | number;
    };
    performance?: {
        duration?: number;
        memory?: number;
        cpu?: number;
    };
    tracing?: {
        traceId?: string;
        spanId?: string;
        parentSpanId?: string;
    };
}
interface LogProcessor {
    name: string;
    process(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<StructuredLogData | undefined>;
}
interface TracingProcessor extends LogProcessor {
    startSpan(operation: string, context?: LogContext): string;
    endSpan(spanId: string, result?: 'success' | 'error'): void;
}
interface PerformanceProcessor extends LogProcessor {
    startMeasurement(operation: string): string;
    endMeasurement(measurementId: string): {
        duration: number;
        memory: number;
    };
}
interface SecurityProcessor extends LogProcessor {
    sanitizeData(data: StructuredLogData): StructuredLogData;
    checkSensitiveFields(data: StructuredLogData): boolean;
}
interface ElasticsearchOutputConfig {
    type: 'elasticsearch';
    enabled: boolean;
    config: {
        host: string;
        port?: number;
        index: string;
        indexPattern?: string;
        username?: string;
        password?: string;
        apiKey?: string;
        ssl?: boolean;
        maxRetries?: number;
        requestTimeout?: number;
        batchSize?: number;
        flushInterval?: number;
    };
}
interface FileOutputConfig {
    type: 'file';
    enabled: boolean;
    config: {
        filename: string;
        maxSize: string;
        maxFiles: number;
        compress?: boolean;
        datePattern?: string;
        createSymlink?: boolean;
        symlinkName?: string;
    };
}
interface SyslogOutputConfig {
    type: 'syslog';
    enabled: boolean;
    config: {
        host: string;
        port: number;
        protocol: 'tcp' | 'udp';
        facility?: number;
        appName?: string;
        hostname?: string;
    };
}
type EnhancedOutputConfig = OutputConfig | ElasticsearchOutputConfig | FileOutputConfig | SyslogOutputConfig;

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

/**
 * Core-integrated Logger that extends SkerCore functionality
 */
declare class CoreLogger extends SkerCore {
    private logger;
    private processors;
    constructor(options: CoreLoggerOptions);
    /**
     * 设置核心集成
     */
    private setupCoreIntegration;
    /**
     * 处理配置变更
     */
    private handleConfigChange;
    /**
     * 注册日志处理器
     */
    registerProcessor(name: string, processor: LogProcessor): void;
    /**
     * 移除日志处理器
     */
    unregisterProcessor(name: string): boolean;
    /**
     * 获取所有处理器
     */
    getProcessors(): string[];
    /**
     * 增强的日志方法，支持结构化数据和处理器
     */
    logStructured(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<void>;
    /**
     * 创建子日志记录器，继承当前配置
     */
    createChildLogger(context: LogContext): Logger;
    /**
     * 获取内部Logger实例
     */
    getLogger(): Logger;
    /**
     * 便捷方法
     */
    trace(message: string, data?: StructuredLogData, context?: LogContext): Promise<void>;
    debug(message: string, data?: StructuredLogData, context?: LogContext): Promise<void>;
    info(message: string, data?: StructuredLogData, context?: LogContext): Promise<void>;
    warn(message: string, data?: StructuredLogData, context?: LogContext): Promise<void>;
    error(message: string, data?: StructuredLogData, context?: LogContext, error?: Error): Promise<void>;
    fatal(message: string, data?: StructuredLogData, context?: LogContext, error?: Error): Promise<void>;
    /**
     * 链路追踪集成
     */
    startTrace(operation: string, context?: LogContext): string;
    endTrace(traceId: string, result?: 'success' | 'error', context?: LogContext): void;
    /**
     * 性能监控
     */
    measurePerformance<T>(operation: string, fn: () => Promise<T>, context?: LogContext): Promise<T>;
    private generateTraceId;
}

/**
 * 性能监控处理器
 */
declare class PerformanceLogProcessor implements PerformanceProcessor {
    readonly name = "performance";
    private measurements;
    process(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<StructuredLogData | undefined>;
    startMeasurement(operation: string): string;
    endMeasurement(measurementId: string): {
        duration: number;
        memory: number;
    };
}
/**
 * 链路追踪处理器
 */
declare class TracingLogProcessor implements TracingProcessor {
    readonly name = "tracing";
    private spans;
    process(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<StructuredLogData | undefined>;
    startSpan(operation: string, context?: LogContext): string;
    endSpan(spanId: string, result?: 'success' | 'error'): void;
    private generateTraceId;
    private generateSpanId;
}
/**
 * 安全处理器 - 清理敏感数据
 */
declare class SecurityLogProcessor implements SecurityProcessor {
    readonly name = "security";
    private sensitiveFields;
    process(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<StructuredLogData | undefined>;
    sanitizeData(data: StructuredLogData): StructuredLogData;
    checkSensitiveFields(data: StructuredLogData): boolean;
    private isSensitiveField;
    private maskValue;
    addSensitiveField(field: string): void;
    removeSensitiveField(field: string): void;
}
/**
 * 错误增强处理器
 */
declare class ErrorEnhancementProcessor {
    readonly name = "error-enhancement";
    process(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<StructuredLogData | undefined>;
    private generateErrorFingerprint;
}
/**
 * 聚合处理器 - 统计日志指标
 */
declare class AggregationProcessor {
    readonly name = "aggregation";
    private stats;
    process(level: LogLevel, message: string, data?: StructuredLogData, context?: LogContext): Promise<StructuredLogData | undefined>;
    private updateStats;
    getStatistics(): {
        levelCounts: {
            [k: string]: number;
        };
        errorFingerprints: {
            [k: string]: number;
        };
        totalLogs: number;
        lastReset: number;
    };
    resetStatistics(): void;
    private generateErrorFingerprint;
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

export { AggregationProcessor, BatchElasticsearchOutputAdapter, type BatchOutputAdapter, ConsoleOutputAdapter, type ContextProvider, CoreLogger, type CoreLoggerOptions, ElasticsearchOutputAdapter, type EnhancedOutputConfig, ErrorEnhancementProcessor, type ErrorReportingConfig, FileOutputAdapter, type LogContext, type LogEntry, type LogFilter, LogFormat, LogLevel, type LogMetadata, type LogProcessor, Logger, type LoggerConfig, type LoggerMiddlewareConfig, type MetricValue, type MonitoringDecorator, MultiOutputAdapter, type OutputAdapter, type OutputConfig, type PerformanceConfig, PerformanceLogProcessor, PerformanceLogger, type PerformanceMetrics, type PerformanceProcessor, SecurityLogProcessor, type SecurityProcessor, type ServiceInfo, type Span, type StructuredLogData, type TraceContext, type TracingConfig, TracingLogProcessor, TracingLogger, type TracingProcessor, createConsoleLogger, createDevelopmentLogger, createElasticsearchLogger, createFastifyPlugin, createFileLogger, createFilter, createGrpcLoggerInterceptor, createKoaLoggerMiddleware, createLogger, createLoggerMiddleware, createOutputAdapter, createProductionLogger, createStructuredLogger, createTestLogger, createTraceContext };
