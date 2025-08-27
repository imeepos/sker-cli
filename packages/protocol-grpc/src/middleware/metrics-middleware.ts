/**
 * gRPC指标收集中间件
 */

import { ServerMiddleware, ClientMiddleware, MiddlewareContext } from '../types/grpc-types.js';

export interface MetricsCollector {
  increment(name: string, tags?: Record<string, string>): void;
  histogram(name: string, value: number, tags?: Record<string, string>): void;
  gauge(name: string, value: number, tags?: Record<string, string>): void;
  timing(name: string, value: number, tags?: Record<string, string>): void;
}

export interface MetricsOptions {
  collector?: MetricsCollector;
  enableRequestCount: boolean;
  enableRequestDuration: boolean;
  enableActiveRequests: boolean;
  enableErrorRate: boolean;
  enableRequestSize: boolean;
  enableResponseSize: boolean;
  histogramBuckets?: number[];
}

/**
 * 默认指标收集器（简单实现）
 */
class DefaultMetricsCollector implements MetricsCollector {
  private metrics = new Map<string, any>();

  increment(name: string, tags: Record<string, string> = {}): void {
    const key = this.createKey(name, tags);
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
  }

  histogram(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.createKey(name, tags);
    const current = this.metrics.get(key) || [];
    current.push(value);
    this.metrics.set(key, current);
  }

  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.createKey(name, tags);
    this.metrics.set(key, value);
  }

  timing(name: string, value: number, tags: Record<string, string> = {}): void {
    this.histogram(name, value, tags);
  }

  private createKey(name: string, tags: Record<string, string>): string {
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return tagStr ? `${name}[${tagStr}]` : name;
  }

  /**
   * 获取所有指标数据
   */
  getAllMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics);
  }

  /**
   * 清空指标数据
   */
  clear(): void {
    this.metrics.clear();
  }
}

// 全局指标收集器实例
const globalMetricsCollector = new DefaultMetricsCollector();

/**
 * 服务端指标收集中间件
 */
export function createServerMetricsMiddleware(options: Partial<MetricsOptions> = {}): ServerMiddleware {
  const {
    collector = globalMetricsCollector,
    enableRequestCount = true,
    enableRequestDuration = true,
    enableActiveRequests = true,
    enableErrorRate = true,
    enableRequestSize = false,
    enableResponseSize = false
  } = options;

  const activeRequests = new Map<string, number>();

  return async (context: MiddlewareContext, next) => {
    const startTime = process.hrtime.bigint();
    const { service, method, peer } = context;
    const tags = { service, method };
    const requestKey = `${service}.${method}`;

    // 记录活跃请求数
    if (enableActiveRequests) {
      const current = activeRequests.get(requestKey) || 0;
      activeRequests.set(requestKey, current + 1);
      collector.gauge('grpc.server.active_requests', current + 1, tags);
    }

    // 增加请求总数
    if (enableRequestCount) {
      collector.increment('grpc.server.requests_total', tags);
    }

    try {
      const result = await next();
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // 转换为毫秒

      // 记录成功请求
      if (enableRequestCount) {
        collector.increment('grpc.server.requests_total', { ...tags, status: 'success' });
      }

      // 记录请求持续时间
      if (enableRequestDuration) {
        collector.histogram('grpc.server.request_duration_ms', duration, tags);
        collector.timing('grpc.server.request_timing', duration, tags);
      }

      // 记录响应大小
      if (enableResponseSize) {
        const responseSize = estimateObjectSize(result);
        collector.histogram('grpc.server.response_size_bytes', responseSize, tags);
      }

      return result;
    } catch (error) {
      const duration = Number(process.hrtime.bigint() - startTime) / 1000000;

      // 记录错误请求
      if (enableRequestCount) {
        collector.increment('grpc.server.requests_total', { ...tags, status: 'error' });
      }

      // 记录错误率
      if (enableErrorRate) {
        collector.increment('grpc.server.errors_total', {
          ...tags,
          error_code: getErrorCode(error)
        });
      }

      // 记录错误请求持续时间
      if (enableRequestDuration) {
        collector.histogram('grpc.server.request_duration_ms', duration, { ...tags, status: 'error' });
      }

      throw error;
    } finally {
      // 减少活跃请求数
      if (enableActiveRequests) {
        const current = activeRequests.get(requestKey) || 1;
        const newCount = Math.max(0, current - 1);
        activeRequests.set(requestKey, newCount);
        collector.gauge('grpc.server.active_requests', newCount, tags);
      }
    }
  };
}

/**
 * 客户端指标收集中间件
 */
export function createClientMetricsMiddleware(options: Partial<MetricsOptions> = {}): ClientMiddleware {
  const {
    collector = globalMetricsCollector,
    enableRequestCount = true,
    enableRequestDuration = true,
    enableActiveRequests = true,
    enableErrorRate = true,
    enableRequestSize = false,
    enableResponseSize = false
  } = options;

  const activeRequests = new Map<string, number>();

  return () => {
    return async (context: MiddlewareContext, next) => {
      const startTime = process.hrtime.bigint();
      const { service, method, peer } = context;
      const tags = { service, method, target: peer };
      const requestKey = `${service}.${method}`;

      // 记录活跃请求数
      if (enableActiveRequests) {
        const current = activeRequests.get(requestKey) || 0;
        activeRequests.set(requestKey, current + 1);
        collector.gauge('grpc.client.active_requests', current + 1, tags);
      }

      // 增加请求总数
      if (enableRequestCount) {
        collector.increment('grpc.client.requests_total', tags);
      }

      try {
        const result = await next();
        const duration = Number(process.hrtime.bigint() - startTime) / 1000000;

        // 记录成功请求
        if (enableRequestCount) {
          collector.increment('grpc.client.requests_total', { ...tags, status: 'success' });
        }

        // 记录请求持续时间
        if (enableRequestDuration) {
          collector.histogram('grpc.client.request_duration_ms', duration, tags);
          collector.timing('grpc.client.request_timing', duration, tags);
        }

        // 记录响应大小
        if (enableResponseSize) {
          const responseSize = estimateObjectSize(result);
          collector.histogram('grpc.client.response_size_bytes', responseSize, tags);
        }

        return result;
      } catch (error) {
        const duration = Number(process.hrtime.bigint() - startTime) / 1000000;

        // 记录错误请求
        if (enableRequestCount) {
          collector.increment('grpc.client.requests_total', { ...tags, status: 'error' });
        }

        // 记录错误率
        if (enableErrorRate) {
          collector.increment('grpc.client.errors_total', {
            ...tags,
            error_code: getErrorCode(error)
          });
        }

        // 记录错误请求持续时间
        if (enableRequestDuration) {
          collector.histogram('grpc.client.request_duration_ms', duration, { ...tags, status: 'error' });
        }

        throw error;
      } finally {
        // 减少活跃请求数
        if (enableActiveRequests) {
          const current = activeRequests.get(requestKey) || 1;
          const newCount = Math.max(0, current - 1);
          activeRequests.set(requestKey, newCount);
          collector.gauge('grpc.client.active_requests', newCount, tags);
        }
      }
    };
  };
}

/**
 * 创建连接指标中间件
 */
export function createConnectionMetricsMiddleware(collector: MetricsCollector = globalMetricsCollector): ServerMiddleware {
  const connectionCount = new Map<string, number>();

  return async (context: MiddlewareContext, next) => {
    const { peer } = context;
    const connectionKey = peer;

    // 记录连接数
    const current = connectionCount.get(connectionKey) || 0;
    connectionCount.set(connectionKey, current + 1);
    collector.gauge('grpc.server.connections_active', current + 1, { peer });

    try {
      return await next();
    } finally {
      // 连接处理完成，减少连接数
      const current = connectionCount.get(connectionKey) || 1;
      const newCount = Math.max(0, current - 1);
      connectionCount.set(connectionKey, newCount);
      collector.gauge('grpc.server.connections_active', newCount, { peer });
    }
  };
}

/**
 * 创建吞吐量指标中间件
 */
export function createThroughputMetricsMiddleware(
  collector: MetricsCollector = globalMetricsCollector,
  windowSizeMs: number = 60000 // 1分钟窗口
): ServerMiddleware {
  const requestWindows = new Map<string, number[]>();

  return async (context: MiddlewareContext, next) => {
    const { service, method } = context;
    const key = `${service}.${method}`;
    const now = Date.now();

    // 清理过期的请求记录
    const window = requestWindows.get(key) || [];
    const validRequests = window.filter(timestamp => now - timestamp < windowSizeMs);
    validRequests.push(now);
    requestWindows.set(key, validRequests);

    // 计算吞吐量 (请求数/分钟)
    const throughput = validRequests.length;
    collector.gauge('grpc.server.throughput_rpm', throughput, { service, method });

    return await next();
  };
}

/**
 * 获取错误代码
 */
function getErrorCode(error: any): string {
  if (error && typeof error === 'object') {
    return error.code || error.name || 'UNKNOWN';
  }
  return 'UNKNOWN';
}

/**
 * 估算对象大小（字节）
 */
function estimateObjectSize(obj: any): number {
  if (obj === null || obj === undefined) {
    return 0;
  }

  if (typeof obj === 'string') {
    return obj.length * 2; // 假设UTF-16编码
  }

  if (typeof obj === 'number') {
    return 8; // 64位数字
  }

  if (typeof obj === 'boolean') {
    return 1;
  }

  if (Array.isArray(obj)) {
    return obj.reduce((sum, item) => sum + estimateObjectSize(item), 0);
  }

  if (typeof obj === 'object') {
    return Object.entries(obj).reduce((sum, [key, value]) => {
      return sum + estimateObjectSize(key) + estimateObjectSize(value);
    }, 0);
  }

  return 0;
}

/**
 * 创建Prometheus指标导出器
 */
export function createPrometheusExporter(collector: MetricsCollector = globalMetricsCollector) {
  return {
    /**
     * 导出Prometheus格式的指标
     */
    export(): string {
      if (!(collector instanceof DefaultMetricsCollector)) {
        throw new Error('Prometheus export only supported with DefaultMetricsCollector');
      }

      const metrics = collector.getAllMetrics();
      const lines: string[] = [];

      Object.entries(metrics).forEach(([key, value]) => {
        const [name, tagsStr] = key.includes('[') ? key.split('[') : [key, ''];
        const tags = tagsStr ? tagsStr.replace(']', '') : '';

        if (Array.isArray(value)) {
          // 直方图数据
          const sum = value.reduce((a, b) => a + b, 0);
          const count = value.length;
          const avg = count > 0 ? sum / count : 0;

          lines.push(`# TYPE ${name} histogram`);
          lines.push(`${name}_sum{${tags}} ${sum}`);
          lines.push(`${name}_count{${tags}} ${count}`);
          lines.push(`${name}_avg{${tags}} ${avg}`);
        } else if (typeof value === 'number') {
          lines.push(`# TYPE ${name} gauge`);
          lines.push(`${name}{${tags}} ${value}`);
        }
      });

      return lines.join('\n');
    }
  };
}

/**
 * 获取全局指标收集器
 */
export function getGlobalMetricsCollector(): DefaultMetricsCollector {
  return globalMetricsCollector;
}