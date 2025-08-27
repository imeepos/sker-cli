export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

export enum LogFormat {
  JSON = 'json',
  PRETTY = 'pretty',
  TEXT = 'text'
}

export interface ServiceInfo {
  name: string;
  version: string;
  instance_id?: string;
  environment?: string;
}

export interface LogMetadata {
  source_file?: string;
  function_name?: string;
  line_number?: number;
  [key: string]: any;
}

export interface LogContext {
  request_id?: string;
  trace_id?: string;
  span_id?: string;
  user_id?: string;
  correlation_id?: string;
  [key: string]: any;
}

export interface LogEntry {
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

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  flags?: number;
  baggage?: Record<string, string>;
}

export interface Span {
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

export interface TracingConfig {
  enabled: boolean;
  sampling: number;
  exporters?: string[];
  serviceName?: string;
}

export interface PerformanceConfig {
  enabled: boolean;
  includeSystemMetrics: boolean;
  customMetrics?: string[];
  metricsInterval?: number;
}

export interface OutputConfig {
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

export interface LoggerConfig {
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

export interface OutputAdapter {
  write(entry: LogEntry): Promise<void> | void;
  close?(): Promise<void> | void;
  flush?(): Promise<void> | void;
}

export interface BatchOutputAdapter extends OutputAdapter {
  writeBatch(entries: LogEntry[]): Promise<void> | void;
}

export interface LogFilter {
  condition: (entry: LogEntry) => boolean;
  transform: (entry: LogEntry) => LogEntry | null;
}

export interface ContextProvider {
  getContext(): LogContext;
}

export interface MetricValue {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: number;
}

export interface PerformanceMetrics {
  cpu_usage_percent?: number;
  memory_usage_bytes?: number;
  response_time_ms?: number;
  request_count?: number;
  error_count?: number;
  [key: string]: any;
}

export interface MonitoringDecorator {
  (target: any, propertyKey: string, descriptor: PropertyDescriptor): PropertyDescriptor;
}

export interface ErrorReportingConfig {
  enabled: boolean;
  service?: string;
  config?: Record<string, any>;
}

export interface LoggerMiddlewareConfig {
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

// Core Logger Types for @sker/core integration

export interface CoreLoggerOptions {
  serviceName?: string;
  version?: string;
  environment?: string;
  config?: Record<string, any>;
  plugins?: any[];
  lifecycle?: any;
  logger?: LoggerConfig;
}

export interface StructuredLogData {
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

export interface LogProcessor {
  name: string;
  process(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<StructuredLogData | undefined>;
}

export interface TracingProcessor extends LogProcessor {
  startSpan(operation: string, context?: LogContext): string;
  endSpan(spanId: string, result?: 'success' | 'error'): void;
}

export interface PerformanceProcessor extends LogProcessor {
  startMeasurement(operation: string): string;
  endMeasurement(measurementId: string): { duration: number; memory: number };
}

export interface SecurityProcessor extends LogProcessor {
  sanitizeData(data: StructuredLogData): StructuredLogData;
  checkSensitiveFields(data: StructuredLogData): boolean;
}

// Enhanced output adapters for structured logging

export interface ElasticsearchOutputConfig {
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

export interface FileOutputConfig {
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

export interface SyslogOutputConfig {
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

export type EnhancedOutputConfig = 
  | OutputConfig
  | ElasticsearchOutputConfig 
  | FileOutputConfig 
  | SyslogOutputConfig;