import { ErrorCollectorOptions, ErrorReporter } from '../types/index.js';
import { SkerError, sanitizeErrorForLogging } from '../errors/index.js';

export class ErrorCollector {
  private collectedErrors: any[] = [];
  private reporters: ErrorReporter[] = [];

  constructor(private options: ErrorCollectorOptions = {}) {
    this.reporters = options.reporters || [];
  }

  async collect(error: any, context?: Record<string, any>): Promise<void> {
    // 采样过滤
    if (this.options.samplingRate && Math.random() > this.options.samplingRate) {
      return;
    }

    // 应用过滤器
    if (this.options.filters) {
      const shouldSkip = this.options.filters.some(filter => !filter(error));
      if (shouldSkip) {
        return;
      }
    }

    // 错误增强
    let enrichedError = error;
    if (this.options.enrichers) {
      for (const enricher of this.options.enrichers) {
        try {
          enrichedError = await enricher(enrichedError, context || {});
        } catch (enrichError) {
          console.warn('Error enricher failed:', enrichError);
        }
      }
    }

    // 添加到本地收集
    const errorInfo = {
      error: enrichedError instanceof SkerError 
        ? sanitizeErrorForLogging(enrichedError)
        : this.sanitizeGenericError(enrichedError),
      context: context || {},
      timestamp: new Date(),
      id: this.generateErrorId()
    };

    this.collectedErrors.push(errorInfo);

    // 上报到外部系统
    await this.reportError(errorInfo);
  }

  private sanitizeGenericError(error: any): any {
    return {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
      stack: error?.stack,
      code: error?.code || 'UNKNOWN',
      category: 'system'
    };
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async reportError(errorInfo: any): Promise<void> {
    const reportPromises = this.reporters.map(async reporter => {
      try {
        await this.reportToReporter(reporter, errorInfo);
      } catch (reportError) {
        console.error(`Failed to report error to ${reporter.type}:`, reportError);
      }
    });

    await Promise.allSettled(reportPromises);
  }

  private async reportToReporter(reporter: ErrorReporter, errorInfo: any): Promise<void> {
    switch (reporter.type) {
      case 'console':
        console.error('Error collected:', errorInfo);
        break;
      case 'sentry':
        // 模拟 Sentry 上报
        if (reporter.config.dsn) {
          console.log(`Reporting to Sentry (${reporter.config.dsn}):`, errorInfo);
        }
        break;
      case 'elasticsearch':
        // 模拟 Elasticsearch 上报
        if (reporter.config.host) {
          console.log(`Reporting to Elasticsearch (${reporter.config.host}):`, errorInfo);
        }
        break;
      case 'webhook':
        // 模拟 Webhook 上报
        if (reporter.config.url) {
          console.log(`Reporting to Webhook (${reporter.config.url}):`, errorInfo);
        }
        break;
      default:
        console.warn(`Unknown reporter type: ${reporter.type}`);
    }
  }

  getCollectedErrors(): any[] {
    return [...this.collectedErrors];
  }

  getErrorCount(): number {
    return this.collectedErrors.length;
  }

  getErrorsByCategory(): Record<string, number> {
    const categories: Record<string, number> = {};
    
    this.collectedErrors.forEach(errorInfo => {
      const category = errorInfo.error.category || 'unknown';
      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }

  getErrorsByTimeRange(startTime: Date, endTime: Date): any[] {
    return this.collectedErrors.filter(errorInfo => {
      const timestamp = errorInfo.timestamp;
      return timestamp >= startTime && timestamp <= endTime;
    });
  }

  clear(): void {
    this.collectedErrors = [];
  }

  addReporter(reporter: ErrorReporter): void {
    this.reporters.push(reporter);
  }

  removeReporter(type: string): void {
    this.reporters = this.reporters.filter(reporter => reporter.type !== type);
  }
}

// 全局错误收集器实例
let globalErrorCollector: ErrorCollector | null = null;

export function getGlobalErrorCollector(): ErrorCollector {
  if (!globalErrorCollector) {
    globalErrorCollector = new ErrorCollector();
  }
  return globalErrorCollector;
}

export function setGlobalErrorCollector(collector: ErrorCollector): void {
  globalErrorCollector = collector;
}

export function collectError(error: any, context?: Record<string, any>): Promise<void> {
  return getGlobalErrorCollector().collect(error, context);
}

// 自动错误收集设置
export function setupGlobalErrorHandling(collector?: ErrorCollector): void {
  const errorCollector = collector || getGlobalErrorCollector();

  // 捕获未处理的 Promise 拒绝
  process.on('unhandledRejection', (reason, promise) => {
    errorCollector.collect(reason, {
      source: 'unhandledRejection',
      promise: promise.toString()
    }).catch(console.error);
  });

  // 捕获未处理的异常
  process.on('uncaughtException', (error) => {
    errorCollector.collect(error, {
      source: 'uncaughtException',
      fatal: true
    }).catch(console.error);
  });

  // 捕获 warning 事件
  process.on('warning', (warning) => {
    if (warning.name === 'DeprecationWarning') {
      errorCollector.collect(warning, {
        source: 'warning',
        type: 'deprecation'
      }).catch(console.error);
    }
  });
}