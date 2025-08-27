import * as os from 'os';
import { performance } from 'perf_hooks';
import { TracingLogger } from './tracing.js';
import { 
  LoggerConfig, 
  PerformanceConfig, 
  PerformanceMetrics,
  MonitoringDecorator 
} from './types.js';

export class PerformanceLogger extends TracingLogger {
  private performanceConfig: PerformanceConfig;
  private counters = new Map<string, number>();
  private histograms = new Map<string, number[]>();
  private gauges = new Map<string, number>();
  private metricsTimer?: NodeJS.Timeout;

  constructor(config: LoggerConfig = {}) {
    super(config);
    this.performanceConfig = config.performance || {
      enabled: true,
      includeSystemMetrics: false,
      metricsInterval: 30000
    };

    if (this.performanceConfig.enabled && this.performanceConfig.includeSystemMetrics) {
      this.startSystemMetricsCollection();
    }
  }

  private startSystemMetricsCollection(): void {
    this.metricsTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.performanceConfig.metricsInterval || 30000);
  }

  private collectSystemMetrics(): void {
    const metrics: PerformanceMetrics = {
      cpu_usage_percent: this.getCpuUsage(),
      memory_usage_bytes: process.memoryUsage().heapUsed,
      memory_total_bytes: os.totalmem(),
      memory_free_bytes: os.freemem(),
      uptime_seconds: process.uptime(),
      load_average: os.loadavg()
    };

    this.info('System metrics collected', { metrics });

    this.recordGauge('system_cpu_usage_percent', metrics.cpu_usage_percent || 0);
    this.recordGauge('system_memory_usage_bytes', metrics.memory_usage_bytes || 0);
    this.recordGauge('system_memory_free_bytes', metrics.memory_free_bytes);
    this.recordGauge('system_uptime_seconds', metrics.uptime_seconds);
  }

  private getCpuUsage(): number {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;

    cpus.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    return 100 - ~~(100 * totalIdle / totalTick);
  }

  public incrementCounter(name: string, tags: Record<string, string> = {}): void {
    const key = this.createMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    
    this.debug('Counter incremented', {
      metric: name,
      value: current + 1,
      tags
    });
  }

  public recordHistogram(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.createMetricKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    this.debug('Histogram recorded', {
      metric: name,
      value,
      tags,
      count: values.length
    });
  }

  public recordGauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.createMetricKey(name, tags);
    this.gauges.set(key, value);
    
    this.debug('Gauge recorded', {
      metric: name,
      value,
      tags
    });
  }

  public getMetricsSummary(): {
    counters: Record<string, number>;
    histograms: Record<string, { count: number; min: number; max: number; avg: number; p95: number }>;
    gauges: Record<string, number>;
  } {
    const summary = {
      counters: Object.fromEntries(this.counters),
      histograms: {} as any,
      gauges: Object.fromEntries(this.gauges)
    };

    for (const [key, values] of this.histograms) {
      const sorted = [...values].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const p95Index = Math.floor(count * 0.95);

      summary.histograms[key] = {
        count,
        min: sorted[0] || 0,
        max: sorted[count - 1] || 0,
        avg: count > 0 ? sum / count : 0,
        p95: sorted[p95Index] || 0
      };
    }

    return summary;
  }

  public monitor(operationName: string): MonitoringDecorator {
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (this: any, ...args: any[]) {
        const logger = this.logger || new PerformanceLogger();
        const startTime = performance.now();
        const span = logger.startSpan(operationName);
        
        try {
          span.setTag('method', propertyKey);
          span.setTag('class', target.constructor.name);
          
          const result = await originalMethod.apply(this, args);
          
          const duration = performance.now() - startTime;
          
          logger.recordHistogram(`${operationName}_duration_ms`, duration, {
            method: propertyKey,
            status: 'success'
          });
          
          logger.incrementCounter(`${operationName}_total`, {
            method: propertyKey,
            status: 'success'
          });

          logger.info(`Operation completed: ${operationName}`, {
            method: propertyKey,
            duration_ms: duration,
            success: true
          });

          span.setTag('success', true);
          span.setTag('duration_ms', duration);
          span.end();

          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          
          logger.recordHistogram(`${operationName}_duration_ms`, duration, {
            method: propertyKey,
            status: 'error',
            error_type: (error as Error).constructor.name
          });
          
          logger.incrementCounter(`${operationName}_total`, {
            method: propertyKey,
            status: 'error',
            error_type: (error as Error).constructor.name
          });

          logger.error(`Operation failed: ${operationName}`, {
            method: propertyKey,
            duration_ms: duration,
            error: (error as Error).message
          }, error as Error);

          span.recordException(error as Error);
          span.setTag('success', false);
          span.setTag('duration_ms', duration);
          span.end();

          throw error;
        }
      };

      return descriptor;
    };
  }

  public async measureAsync<T>(
    operationName: string, 
    operation: () => Promise<T>,
    tags: Record<string, string> = {}
  ): Promise<T> {
    const startTime = performance.now();
    const span = this.startSpan(operationName);
    
    try {
      Object.entries(tags).forEach(([key, value]) => {
        span.setTag(key, value);
      });
      
      const result = await operation();
      const duration = performance.now() - startTime;
      
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: 'success'
      });
      
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: 'success'
      });

      span.setTag('success', true);
      span.setTag('duration_ms', duration);
      span.end();

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: 'error',
        error_type: (error as Error).constructor.name
      });
      
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: 'error',
        error_type: (error as Error).constructor.name
      });

      span.recordException(error as Error);
      span.setTag('success', false);
      span.setTag('duration_ms', duration);
      span.end();

      throw error;
    }
  }

  public measure<T>(
    operationName: string, 
    operation: () => T,
    tags: Record<string, string> = {}
  ): T {
    const startTime = performance.now();
    
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: 'success'
      });
      
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: 'success'
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: 'error',
        error_type: (error as Error).constructor.name
      });
      
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: 'error',
        error_type: (error as Error).constructor.name
      });

      throw error;
    }
  }

  private createMetricKey(name: string, tags: Record<string, string>): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return tagString ? `${name}{${tagString}}` : name;
  }

  public override async close(): Promise<void> {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    
    await super.close();
  }
}