import { SkerCore } from '@sker/core';
import { Logger } from './logger.js';
import { 
  LogLevel, 
  LogFormat, 
  LogEntry, 
  LoggerConfig, 
  OutputAdapter, 
  LogContext, 
  LogProcessor,
  CoreLoggerOptions,
  StructuredLogData
} from './types.js';

/**
 * Core-integrated Logger that extends SkerCore functionality
 */
export class CoreLogger extends SkerCore {
  private logger: Logger;
  private processors: Map<string, LogProcessor> = new Map();

  constructor(options: CoreLoggerOptions) {
    super({
      serviceName: options.serviceName || 'sker-logger',
      version: options.version || '1.0.0',
      environment: options.environment || 'development',
      config: options.config,
      plugins: options.plugins,
      lifecycle: options.lifecycle
    });

    const loggerConfig: LoggerConfig = {
      name: this.serviceName,
      service: {
        name: this.serviceName,
        version: this.version,
        environment: this.environment
      },
      ...options.logger
    };

    this.logger = new Logger(loggerConfig);
    this.setupCoreIntegration();
  }

  /**
   * 设置核心集成
   */
  private setupCoreIntegration(): void {
    // 监听配置变更
    this.getConfig().on('change', ({ key, newValue }) => {
      if (key.startsWith('logger.')) {
        this.handleConfigChange(key, newValue);
      }
    });

    // 监听生命周期事件
    this.getLifecycle().onStart(async () => {
      this.logger.info('Logger service starting', {
        service: this.serviceName,
        version: this.version
      });
    });

    this.getLifecycle().onStop(async () => {
      this.logger.info('Logger service stopping');
      await this.logger.close();
    });

    // 集成插件系统
    this.on('CORE_PLUGIN_ERROR', ({ error, plugin }) => {
      this.logger.error('Plugin error occurred', {
        plugin,
        error: error.message
      }, error);
    });

    this.on('CORE_MIDDLEWARE_ERROR', ({ error, middleware }) => {
      this.logger.error('Middleware error occurred', {
        middleware,
        error: error.message
      }, error);
    });
  }

  /**
   * 处理配置变更
   */
  private handleConfigChange(key: string, value: any): void {
    const configKey = key.replace('logger.', '');
    
    switch (configKey) {
      case 'level':
        this.logger.setLevel(value);
        this.logger.info('Log level changed', { newLevel: value });
        break;
      default:
        this.logger.debug('Logger configuration updated', { key, value });
        break;
    }
  }

  /**
   * 注册日志处理器
   */
  public registerProcessor(name: string, processor: LogProcessor): void {
    this.processors.set(name, processor);
    this.logger.info('Log processor registered', { processor: name });
  }

  /**
   * 移除日志处理器
   */
  public unregisterProcessor(name: string): boolean {
    const removed = this.processors.delete(name);
    if (removed) {
      this.logger.info('Log processor unregistered', { processor: name });
    }
    return removed;
  }

  /**
   * 获取所有处理器
   */
  public getProcessors(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * 增强的日志方法，支持结构化数据和处理器
   */
  public async logStructured(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<void> {
    // 应用处理器
    let processedData = data;
    for (const [name, processor] of this.processors) {
      try {
        processedData = await processor.process(level, message, processedData, context);
      } catch (error) {
        this.logger.warn('Log processor failed', {
          processor: name,
          error: (error as Error).message
        });
      }
    }

    // 添加核心上下文信息
    const enrichedContext = {
      ...context,
      serviceName: this.serviceName,
      version: this.version,
      environment: this.environment,
      uptime: this.uptime,
      ...processedData
    };

    // 根据级别调用对应的日志方法
    switch (level) {
      case LogLevel.TRACE:
        this.logger.trace(message, enrichedContext);
        break;
      case LogLevel.DEBUG:
        this.logger.debug(message, enrichedContext);
        break;
      case LogLevel.INFO:
        this.logger.info(message, enrichedContext);
        break;
      case LogLevel.WARN:
        this.logger.warn(message, enrichedContext);
        break;
      case LogLevel.ERROR:
        this.logger.error(message, enrichedContext);
        break;
      case LogLevel.FATAL:
        this.logger.fatal(message, enrichedContext);
        break;
    }
  }

  /**
   * 创建子日志记录器，继承当前配置
   */
  public createChildLogger(context: LogContext): Logger {
    return this.logger.child({
      ...context,
      parentService: this.serviceName,
      parentVersion: this.version
    });
  }

  /**
   * 获取内部Logger实例
   */
  public getLogger(): Logger {
    return this.logger;
  }

  /**
   * 便捷方法
   */
  public trace(message: string, data?: StructuredLogData, context?: LogContext): Promise<void> {
    return this.logStructured(LogLevel.TRACE, message, data, context);
  }

  public debug(message: string, data?: StructuredLogData, context?: LogContext): Promise<void> {
    return this.logStructured(LogLevel.DEBUG, message, data, context);
  }

  public info(message: string, data?: StructuredLogData, context?: LogContext): Promise<void> {
    return this.logStructured(LogLevel.INFO, message, data, context);
  }

  public warn(message: string, data?: StructuredLogData, context?: LogContext): Promise<void> {
    return this.logStructured(LogLevel.WARN, message, data, context);
  }

  public error(message: string, data?: StructuredLogData, context?: LogContext, error?: Error): Promise<void> {
    const errorData = error ? {
      ...data,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : data;

    return this.logStructured(LogLevel.ERROR, message, errorData, context);
  }

  public fatal(message: string, data?: StructuredLogData, context?: LogContext, error?: Error): Promise<void> {
    const errorData = error ? {
      ...data,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    } : data;

    return this.logStructured(LogLevel.FATAL, message, errorData, context);
  }

  /**
   * 链路追踪集成
   */
  public startTrace(operation: string, context?: LogContext): string {
    const traceId = this.generateTraceId();
    const startTime = Date.now();

    this.info('Trace started', {
      traceId,
      operation,
      startTime,
      ...context
    });

    return traceId;
  }

  public endTrace(traceId: string, result?: 'success' | 'error', context?: LogContext): void {
    const endTime = Date.now();
    
    this.info('Trace ended', {
      traceId,
      result: result || 'success',
      endTime,
      ...context
    });
  }

  /**
   * 性能监控
   */
  public async measurePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const startTime = process.hrtime.bigint();
    const traceId = this.startTrace(operation, context);

    try {
      const result = await fn();
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

      this.info('Performance measurement', {
        traceId,
        operation,
        duration,
        status: 'success',
        ...context
      });

      this.endTrace(traceId, 'success');
      return result;
    } catch (error) {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000;

      this.error('Performance measurement failed', {
        traceId,
        operation,
        duration,
        status: 'error',
        ...context
      }, error as Error);

      this.endTrace(traceId, 'error');
      throw error;
    }
  }

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}