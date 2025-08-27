import { EventEmitter } from 'events';
import { AsyncLocalStorage } from 'async_hooks';
import { 
  LogLevel, 
  LogFormat, 
  LogEntry, 
  LoggerConfig, 
  OutputAdapter, 
  LogContext, 
  LogMetadata,
  ContextProvider 
} from './types.js';
import { ConsoleOutputAdapter } from './outputs.js';

export class Logger extends EventEmitter {
  private config: Required<LoggerConfig>;
  private outputs: OutputAdapter[] = [];
  private contextStorage = new AsyncLocalStorage<LogContext>();
  private buffer: LogEntry[] = [];
  private flushTimer?: NodeJS.Timeout;
  private contextProvider?: ContextProvider;

  constructor(config: LoggerConfig = {}) {
    super();
    
    this.config = {
      name: config.name || 'default',
      service: config.service || { 
        name: config.name || 'unknown', 
        version: '1.0.0' 
      },
      level: config.level || LogLevel.INFO,
      format: config.format || LogFormat.JSON,
      outputs: config.outputs || [{ type: 'console', enabled: true }],
      tracing: config.tracing || { enabled: false, sampling: 0.1 },
      performance: config.performance || { 
        enabled: false, 
        includeSystemMetrics: false 
      },
      context: config.context || {
        autoInjectTraceId: true,
        autoInjectRequestId: true,
        includeSourceInfo: false
      },
      filters: config.filters || [],
      async: config.async || false,
      bufferSize: config.bufferSize || 1000,
      flushInterval: config.flushInterval || 5000,
      onError: config.onError || ((error: Error) => {
        console.error('[Logger Error]:', error);
      })
    };

    this.initializeOutputs();
    
    if (this.config.async) {
      this.startFlushTimer();
    }

    // contextProvider can be set externally if needed
  }

  private initializeOutputs(): void {
    this.outputs = this.config.outputs
      .filter(output => output.enabled)
      .map(outputConfig => this.createOutputAdapter(outputConfig));
  }

  private createOutputAdapter(config: any): OutputAdapter {
    return new ConsoleOutputAdapter(config.format || this.config.format);
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush().catch(this.config.onError);
    }, this.config.flushInterval);
  }

  protected getCurrentContext(): LogContext {
    let context: LogContext = {};

    if (this.contextProvider) {
      context = { ...context, ...this.contextProvider.getContext() };
    }

    const storageContext = this.contextStorage.getStore();
    if (storageContext) {
      context = { ...context, ...storageContext };
    }

    if (this.config.context.autoInjectRequestId && !context.request_id) {
      context.request_id = this.generateUUID();
    }

    if (this.config.context.autoInjectTraceId && !context.trace_id) {
      context.trace_id = this.generateTraceId();
    }

    return context;
  }

  private getSourceInfo(): LogMetadata {
    if (!this.config.context.includeSourceInfo) {
      return {};
    }

    const stack = new Error().stack;
    if (!stack) return {};

    const stackLines = stack.split('\n');
    const callerLine = stackLines[4] || '';
    
    if (callerLine) {
      const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
      if (match) {
        return {
          function_name: match[1],
          source_file: match[2],
          line_number: parseInt(match[3]!, 10)
        };
      }
    }

    return {};
  }

  private createLogEntry(
    level: LogLevel, 
    message: string, 
    context?: LogContext,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      service: this.config.service,
      context: { ...this.getCurrentContext(), ...context },
      metadata: this.getSourceInfo()
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code
      };
    }

    return entry;
  }

  private applyFilters(entry: LogEntry): LogEntry | null {
    let filteredEntry: LogEntry | null = entry;
    
    for (const filter of this.config.filters) {
      filteredEntry = filter(filteredEntry!);
      if (!filteredEntry) {
        return null;
      }
    }
    
    return filteredEntry;
  }

  private async writeEntry(entry: LogEntry): Promise<void> {
    const filteredEntry = this.applyFilters(entry);
    if (!filteredEntry) return;

    if (this.config.async) {
      this.buffer.push(filteredEntry);
      if (this.buffer.length >= this.config.bufferSize) {
        await this.flush();
      }
    } else {
      await this.writeToOutputs(filteredEntry);
    }
  }

  private async writeToOutputs(entry: LogEntry): Promise<void> {
    const promises = this.outputs.map(async output => {
      try {
        await output.write(entry);
      } catch (error) {
        this.config.onError(error as Error);
      }
    });

    await Promise.all(promises);
  }

  public isLevelEnabled(level: LogLevel): boolean {
    return level >= this.config.level;
  }

  public setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  public child(context: LogContext): Logger {
    const childConfig = { ...this.config };
    const childLogger = new Logger(childConfig);
    
    childLogger.contextStorage = this.contextStorage;
    childLogger.contextProvider = {
      getContext: () => ({ ...this.getCurrentContext(), ...context })
    };
    
    return childLogger;
  }

  public trace(message: string, context?: LogContext): void {
    if (this.isLevelEnabled(LogLevel.TRACE)) {
      this.writeEntry(this.createLogEntry(LogLevel.TRACE, message, context));
    }
  }

  public debug(message: string, context?: LogContext): void {
    if (this.isLevelEnabled(LogLevel.DEBUG)) {
      this.writeEntry(this.createLogEntry(LogLevel.DEBUG, message, context));
    }
  }

  public info(message: string, context?: LogContext): void {
    if (this.isLevelEnabled(LogLevel.INFO)) {
      this.writeEntry(this.createLogEntry(LogLevel.INFO, message, context));
    }
  }

  public warn(message: string, context?: LogContext): void {
    if (this.isLevelEnabled(LogLevel.WARN)) {
      this.writeEntry(this.createLogEntry(LogLevel.WARN, message, context));
    }
  }

  public error(message: string, context?: LogContext, error?: Error): void {
    if (this.isLevelEnabled(LogLevel.ERROR)) {
      this.writeEntry(this.createLogEntry(LogLevel.ERROR, message, context, error));
    }
  }

  public fatal(message: string, context?: LogContext, error?: Error): void {
    if (this.isLevelEnabled(LogLevel.FATAL)) {
      this.writeEntry(this.createLogEntry(LogLevel.FATAL, message, context, error));
    }
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entriesToFlush = [...this.buffer];
    this.buffer = [];

    const promises = entriesToFlush.map(entry => this.writeToOutputs(entry));
    await Promise.all(promises);

    const flushPromises = this.outputs
      .filter(output => output.flush)
      .map(output => output.flush!());
    
    await Promise.all(flushPromises);
  }

  public async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    await this.flush();

    const closePromises = this.outputs
      .filter(output => output.close)
      .map(output => output.close!());
    
    await Promise.all(closePromises);
  }

  public runInContext<T>(context: LogContext, fn: () => T): T {
    return this.contextStorage.run(context, fn);
  }

  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  private generateTraceId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}