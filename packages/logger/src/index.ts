export { 
  LogLevel, 
  LogFormat
} from './types.js';

export type { 
  LogEntry, 
  LoggerConfig, 
  ServiceInfo,
  LogContext,
  LogMetadata,
  TraceContext,
  Span,
  TracingConfig,
  PerformanceConfig,
  OutputConfig,
  OutputAdapter,
  BatchOutputAdapter,
  LogFilter,
  ContextProvider,
  MetricValue,
  PerformanceMetrics,
  MonitoringDecorator,
  ErrorReportingConfig,
  LoggerMiddlewareConfig,
  // New Core Logger types
  CoreLoggerOptions,
  StructuredLogData,
  LogProcessor,
  TracingProcessor,
  PerformanceProcessor,
  SecurityProcessor,
  EnhancedOutputConfig
} from './types.js';

export { Logger } from './logger.js';
export { TracingLogger, createTraceContext } from './tracing.js';
export { PerformanceLogger } from './performance.js';

// New Core Logger exports
export { CoreLogger } from './core-logger.js';
export { 
  PerformanceLogProcessor,
  TracingLogProcessor,
  SecurityLogProcessor,
  ErrorEnhancementProcessor,
  AggregationProcessor
} from './processors.js';

export { 
  ConsoleOutputAdapter,
  FileOutputAdapter,
  ElasticsearchOutputAdapter,
  BatchElasticsearchOutputAdapter,
  MultiOutputAdapter,
  createFilter
} from './outputs.js';

export {
  createLogger,
  createConsoleLogger,
  createFileLogger,
  createElasticsearchLogger,
  createProductionLogger,
  createDevelopmentLogger,
  createTestLogger,
  createStructuredLogger,
  createOutputAdapter
} from './factory.js';

export {
  createLoggerMiddleware,
  createKoaLoggerMiddleware,
  createGrpcLoggerInterceptor,
  createFastifyPlugin
} from './middleware.js';

