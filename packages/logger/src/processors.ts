import { 
  LogLevel, 
  LogContext, 
  StructuredLogData, 
  TracingProcessor,
  PerformanceProcessor,
  SecurityProcessor 
} from './types.js';

/**
 * 性能监控处理器
 */
export class PerformanceLogProcessor implements PerformanceProcessor {
  public readonly name = 'performance';
  private measurements = new Map<string, { startTime: bigint; startMemory: number }>();

  async process(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<StructuredLogData | undefined> {
    const enhancedData = { ...data };

    // 添加系统性能指标
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    enhancedData.performance = {
      ...enhancedData.performance,
      memory: memoryUsage.heapUsed,
      cpu: cpuUsage.user + cpuUsage.system
    };

    // Add additional performance data as metadata
    if (!enhancedData.metadata) {
      enhancedData.metadata = {};
    }
    
    enhancedData.metadata.performance = {
      memoryTotal: memoryUsage.heapTotal,
      memoryExternal: memoryUsage.external,
      cpuUser: cpuUsage.user,
      cpuSystem: cpuUsage.system,
      uptime: process.uptime(),
      timestamp: Date.now()
    };

    return enhancedData;
  }

  startMeasurement(operation: string): string {
    const measurementId = `${operation}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.measurements.set(measurementId, {
      startTime: process.hrtime.bigint(),
      startMemory: process.memoryUsage().heapUsed
    });
    return measurementId;
  }

  endMeasurement(measurementId: string): { duration: number; memory: number } {
    const measurement = this.measurements.get(measurementId);
    if (!measurement) {
      return { duration: 0, memory: 0 };
    }

    const endTime = process.hrtime.bigint();
    const endMemory = process.memoryUsage().heapUsed;
    
    const duration = Number(endTime - measurement.startTime) / 1000000; // Convert to milliseconds
    const memoryDelta = endMemory - measurement.startMemory;

    this.measurements.delete(measurementId);

    return { duration, memory: memoryDelta };
  }
}

/**
 * 链路追踪处理器
 */
export class TracingLogProcessor implements TracingProcessor {
  public readonly name = 'tracing';
  private spans = new Map<string, { startTime: number; operation: string; context?: LogContext }>();

  async process(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<StructuredLogData | undefined> {
    const enhancedData = { ...data };

    // 从上下文中提取追踪信息
    if (context?.trace_id || context?.span_id) {
      enhancedData.tracing = {
        ...enhancedData.tracing,
        traceId: context.trace_id,
        spanId: context.span_id,
        parentSpanId: context.parent_span_id
      };
    }

    // 如果没有 trace_id，生成一个
    if (!enhancedData.tracing?.traceId) {
      enhancedData.tracing = {
        ...enhancedData.tracing,
        traceId: this.generateTraceId()
      };
    }

    return enhancedData;
  }

  startSpan(operation: string, context?: LogContext): string {
    const spanId = this.generateSpanId();
    this.spans.set(spanId, {
      startTime: Date.now(),
      operation,
      context
    });
    return spanId;
  }

  endSpan(spanId: string, result?: 'success' | 'error'): void {
    const span = this.spans.get(spanId);
    if (!span) return;

    const duration = Date.now() - span.startTime;
    this.spans.delete(spanId);

    // 这里可以发送追踪数据到外部系统
    console.log(`Span ended: ${span.operation}, duration: ${duration}ms, result: ${result || 'success'}`);
  }

  private generateTraceId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 16)}`;
  }

  private generateSpanId(): string {
    return Math.random().toString(36).substr(2, 16);
  }
}

/**
 * 安全处理器 - 清理敏感数据
 */
export class SecurityLogProcessor implements SecurityProcessor {
  public readonly name = 'security';
  private sensitiveFields = new Set([
    'password',
    'token',
    'secret',
    'key',
    'authorization',
    'credit_card',
    'ssn',
    'email',
    'phone',
    'address',
    'api_key',
    'access_token',
    'refresh_token'
  ]);

  async process(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<StructuredLogData | undefined> {
    if (!data) return data;

    return this.sanitizeData(data);
  }

  sanitizeData(data: StructuredLogData): StructuredLogData {
    const sanitized = { ...data };

    for (const [key, value] of Object.entries(sanitized)) {
      if (this.isSensitiveField(key)) {
        sanitized[key] = this.maskValue(value);
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeData(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map(item => 
          typeof item === 'object' && item !== null ? this.sanitizeData(item) : item
        );
      }
    }

    return sanitized;
  }

  checkSensitiveFields(data: StructuredLogData): boolean {
    for (const key of Object.keys(data)) {
      if (this.isSensitiveField(key)) {
        return true;
      }
      
      const value = data[key];
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        if (this.checkSensitiveFields(value)) {
          return true;
        }
      }
    }
    return false;
  }

  private isSensitiveField(fieldName: string): boolean {
    const lowerFieldName = fieldName.toLowerCase();
    return Array.from(this.sensitiveFields).some(sensitive => 
      lowerFieldName.includes(sensitive)
    );
  }

  private maskValue(value: any): string {
    if (typeof value === 'string') {
      if (value.length <= 4) return '*'.repeat(value.length);
      return value.substring(0, 2) + '*'.repeat(value.length - 4) + value.substring(value.length - 2);
    }
    return '[REDACTED]';
  }

  addSensitiveField(field: string): void {
    this.sensitiveFields.add(field.toLowerCase());
  }

  removeSensitiveField(field: string): void {
    this.sensitiveFields.delete(field.toLowerCase());
  }
}

/**
 * 错误增强处理器
 */
export class ErrorEnhancementProcessor {
  public readonly name = 'error-enhancement';

  async process(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<StructuredLogData | undefined> {
    if (level !== LogLevel.ERROR && level !== LogLevel.FATAL) {
      return data;
    }

    const enhancedData = { ...data };

    // 增强错误信息
    if (enhancedData.error) {
      enhancedData.error = {
        ...enhancedData.error
      };

      // Add enhanced error information as metadata
      if (!enhancedData.metadata) {
        enhancedData.metadata = {};
      }

      enhancedData.metadata.errorEnhancement = {
        timestamp: new Date().toISOString(),
        severity: level === LogLevel.FATAL ? 'critical' : 'error',
        fingerprint: this.generateErrorFingerprint(enhancedData.error),
        context: {
          ...context,
          process: {
            pid: process.pid,
            title: process.title,
            version: process.version,
            platform: process.platform,
            arch: process.arch
          }
        }
      };
    }

    return enhancedData;
  }

  private generateErrorFingerprint(error: any): string {
    const input = `${error.name || 'Error'}-${error.message || 'Unknown'}`;
    // 简单的哈希函数
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * 聚合处理器 - 统计日志指标
 */
export class AggregationProcessor {
  public readonly name = 'aggregation';
  private stats = {
    totalLogs: 0,
    levelCounts: new Map<LogLevel, number>(),
    errorFingerprints: new Map<string, number>(),
    lastReset: Date.now()
  };

  async process(
    level: LogLevel,
    message: string,
    data?: StructuredLogData,
    context?: LogContext
  ): Promise<StructuredLogData | undefined> {
    this.updateStats(level, data);

    const enhancedData = { ...data };
    enhancedData.statistics = {
      totalLogs: this.stats.totalLogs,
      logsSinceReset: this.stats.totalLogs,
      resetTime: new Date(this.stats.lastReset).toISOString()
    };

    return enhancedData;
  }

  private updateStats(level: LogLevel, data?: StructuredLogData): void {
    this.stats.totalLogs++;
    
    const currentCount = this.stats.levelCounts.get(level) || 0;
    this.stats.levelCounts.set(level, currentCount + 1);

    // 统计错误指纹
    if ((level === LogLevel.ERROR || level === LogLevel.FATAL) && data?.error) {
      const fingerprint = this.generateErrorFingerprint(data.error);
      const errorCount = this.stats.errorFingerprints.get(fingerprint) || 0;
      this.stats.errorFingerprints.set(fingerprint, errorCount + 1);
    }
  }

  getStatistics() {
    return {
      ...this.stats,
      levelCounts: Object.fromEntries(this.stats.levelCounts),
      errorFingerprints: Object.fromEntries(this.stats.errorFingerprints)
    };
  }

  resetStatistics(): void {
    this.stats.totalLogs = 0;
    this.stats.levelCounts.clear();
    this.stats.errorFingerprints.clear();
    this.stats.lastReset = Date.now();
  }

  private generateErrorFingerprint(error: any): string {
    const input = `${error.name || 'Error'}-${error.message || 'Unknown'}`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}