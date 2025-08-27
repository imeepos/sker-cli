import { EventEmitter } from 'events';
import { ProtocolType } from '../interfaces/protocol.js';
import { PerformanceMetrics } from '../types/ucp-types.js';

/**
 * 性能监控器配置
 */
export interface PerformanceMonitorConfig {
  enabled: boolean;
  collectInterval: number;
  metricsRetention: number;
  alerting?: {
    enabled: boolean;
    rules: AlertRule[];
  };
  exporters?: MetricsExporter[];
}

/**
 * 告警规则
 */
export interface AlertRule {
  name: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration: number;
  action: 'log' | 'alert' | 'callback';
  callback?: (alert: Alert) => void;
}

/**
 * 告警信息
 */
export interface Alert {
  id: string;
  rule: string;
  metric: string;
  value: number;
  threshold: number;
  timestamp: number;
  message: string;
}

/**
 * 指标导出器接口
 */
export interface MetricsExporter {
  name: string;
  export(metrics: PerformanceMetrics[]): Promise<void>;
}

/**
 * 指标统计信息
 */
interface MetricStats {
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  values: number[];
}

/**
 * 性能监控器实现
 */
export class PerformanceMonitor extends EventEmitter {
  private readonly config: PerformanceMonitorConfig;
  private metrics: Map<string, PerformanceMetrics[]> = new Map();
  private stats: Map<string, MetricStats> = new Map();
  private alerts: Map<string, Alert[]> = new Map();
  private collectTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  
  // 实时统计计数器
  private requestCounts: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();
  private latencies: Map<string, number[]> = new Map();
  private throughputCounters: Map<string, { bytes: number; timestamp: number }[]> = new Map();
  
  constructor(config: PerformanceMonitorConfig) {
    super();
    this.config = config;
    
    if (config.enabled) {
      this.startCollection();
      this.startCleanup();
    }
  }
  
  /**
   * 记录请求指标
   */
  recordRequest(
    protocol: ProtocolType,
    service: string,
    method: string,
    latency: number,
    success: boolean,
    requestSize?: number,
    responseSize?: number
  ): void {
    if (!this.config.enabled) return;
    
    const key = `${protocol}:${service}:${method}`;
    
    // 更新请求计数
    this.incrementCounter(this.requestCounts, key);
    
    // 更新错误计数
    if (!success) {
      this.incrementCounter(this.errorCounts, key);
    }
    
    // 记录延迟
    this.addLatency(key, latency);
    
    // 记录吞吐量
    if (requestSize || responseSize) {
      this.recordThroughput(key, (requestSize || 0) + (responseSize || 0));
    }
    
    this.emit('request_recorded', {
      protocol,
      service,
      method,
      latency,
      success,
      requestSize,
      responseSize
    });
  }
  
  /**
   * 记录连接指标
   */
  recordConnection(protocol: ProtocolType, active: number, total: number): void {
    if (!this.config.enabled) return;
    
    const key = `${protocol}:connections`;
    
    // 存储连接信息用于下次收集
    this.stats.set(`${key}:active`, {
      count: 1,
      sum: active,
      min: active,
      max: active,
      avg: active,
      values: [active]
    });
    
    this.stats.set(`${key}:total`, {
      count: 1,
      sum: total,
      min: total,
      max: total,
      avg: total,
      values: [total]
    });
    
    this.emit('connection_recorded', { protocol, active, total });
  }
  
  /**
   * 获取性能指标
   */
  getMetrics(protocol?: ProtocolType, service?: string): PerformanceMetrics[] {
    const filter = this.buildMetricsFilter(protocol, service);
    const allMetrics: PerformanceMetrics[] = [];
    
    for (const [key, metricsList] of this.metrics) {
      if (!filter || filter(key)) {
        allMetrics.push(...metricsList);
      }
    }
    
    return allMetrics.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * 获取统计信息
   */
  getStats(protocol?: ProtocolType, service?: string): Map<string, MetricStats> {
    const filter = this.buildMetricsFilter(protocol, service);
    const filteredStats = new Map<string, MetricStats>();
    
    for (const [key, stat] of this.stats) {
      if (!filter || filter(key)) {
        filteredStats.set(key, { ...stat });
      }
    }
    
    return filteredStats;
  }
  
  /**
   * 获取告警信息
   */
  getAlerts(): Alert[] {
    const allAlerts: Alert[] = [];
    for (const alerts of this.alerts.values()) {
      allAlerts.push(...alerts);
    }
    return allAlerts.sort((a, b) => b.timestamp - a.timestamp);
  }
  
  /**
   * 清除指标数据
   */
  clearMetrics(): void {
    this.metrics.clear();
    this.stats.clear();
    this.requestCounts.clear();
    this.errorCounts.clear();
    this.latencies.clear();
    this.throughputCounters.clear();
    this.emit('metrics_cleared');
  }
  
  /**
   * 停止监控
   */
  stop(): void {
    if (this.collectTimer) {
      clearInterval(this.collectTimer);
      this.collectTimer = undefined;
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }
    
    this.emit('monitor_stopped');
  }
  
  private startCollection(): void {
    this.collectTimer = setInterval(() => {
      this.collectMetrics();
    }, this.config.collectInterval);
  }
  
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupOldMetrics();
    }, 60000); // 每分钟清理一次
  }
  
  private collectMetrics(): void {
    const timestamp = Date.now();
    
    // 收集每个协议和服务的指标
    const collectedKeys = new Set<string>();
    
    // 从请求计数中收集
    for (const [key, count] of this.requestCounts) {
      collectedKeys.add(key);
    }
    
    // 从延迟记录中收集
    for (const key of this.latencies.keys()) {
      collectedKeys.add(key);
    }
    
    for (const key of collectedKeys) {
      const [protocol, service, method] = key.split(':');
      if (!protocol) continue;
      
      const metrics = this.buildMetrics(
        timestamp,
        protocol as ProtocolType,
        service,
        method,
        key
      );
      
      if (metrics) {
        this.storeMetrics(key, metrics);
        this.checkAlerts(metrics);
        this.exportMetrics([metrics]);
      }
    }
    
    // 重置计数器
    this.resetCounters();
    
    this.emit('metrics_collected', timestamp);
  }
  
  private buildMetrics(
    timestamp: number,
    protocol: ProtocolType,
    service?: string,
    method?: string,
    key?: string
  ): PerformanceMetrics | null {
    if (!key) return null;
    
    const requestCount = this.requestCounts.get(key) || 0;
    const errorCount = this.errorCounts.get(key) || 0;
    const latencyValues = this.latencies.get(key) || [];
    const throughputData = this.throughputCounters.get(key) || [];
    
    // 计算延迟百分位数
    const sortedLatencies = [...latencyValues].sort((a, b) => a - b);
    const latencyP50 = this.calculatePercentile(sortedLatencies, 50);
    const latencyP95 = this.calculatePercentile(sortedLatencies, 95);
    const latencyP99 = this.calculatePercentile(sortedLatencies, 99);
    const averageLatency = latencyValues.length > 0 
      ? latencyValues.reduce((sum, lat) => sum + lat, 0) / latencyValues.length 
      : 0;
    
    // 计算吞吐量
    const totalBytes = throughputData.reduce((sum, data) => sum + data.bytes, 0);
    const timeSpan = this.config.collectInterval / 1000; // 转换为秒
    const throughput = totalBytes / timeSpan;
    
    // 计算请求速率
    const requestRate = requestCount / timeSpan;
    
    // 计算错误率
    const errorRate = requestCount > 0 ? errorCount / requestCount : 0;
    
    // 获取连接指标
    const activeConnStats = this.stats.get(`${protocol}:connections:active`);
    const connectionCount = activeConnStats ? activeConnStats.avg : 0;
    const activeConnections = connectionCount;
    
    return {
      timestamp,
      protocol,
      service,
      method,
      requestCount,
      requestRate,
      latencyP50,
      latencyP95,
      latencyP99,
      averageLatency,
      errorCount,
      errorRate,
      throughput,
      connectionCount,
      activeConnections
    };
  }
  
  private calculatePercentile(sortedValues: number[], percentile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = (percentile / 100) * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower]!;
    }
    
    const weight = index - lower;
    return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
  }
  
  private incrementCounter(counter: Map<string, number>, key: string): void {
    counter.set(key, (counter.get(key) || 0) + 1);
  }
  
  private addLatency(key: string, latency: number): void {
    const latencies = this.latencies.get(key) || [];
    latencies.push(latency);
    this.latencies.set(key, latencies);
  }
  
  private recordThroughput(key: string, bytes: number): void {
    const throughput = this.throughputCounters.get(key) || [];
    throughput.push({ bytes, timestamp: Date.now() });
    this.throughputCounters.set(key, throughput);
  }
  
  private resetCounters(): void {
    this.requestCounts.clear();
    this.errorCounts.clear();
    this.latencies.clear();
    this.throughputCounters.clear();
  }
  
  private storeMetrics(key: string, metrics: PerformanceMetrics): void {
    const metricsList = this.metrics.get(key) || [];
    metricsList.push(metrics);
    this.metrics.set(key, metricsList);
    
    // 更新统计信息
    this.updateStats(key, metrics);
  }
  
  private updateStats(key: string, metrics: PerformanceMetrics): void {
    const statKey = `${key}:latency`;
    const currentStat = this.stats.get(statKey) || {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0,
      values: []
    };
    
    currentStat.count++;
    currentStat.sum += metrics.averageLatency;
    currentStat.min = Math.min(currentStat.min, metrics.averageLatency);
    currentStat.max = Math.max(currentStat.max, metrics.averageLatency);
    currentStat.avg = currentStat.sum / currentStat.count;
    currentStat.values.push(metrics.averageLatency);
    
    // 保持最近1000个值
    if (currentStat.values.length > 1000) {
      currentStat.values = currentStat.values.slice(-1000);
    }
    
    this.stats.set(statKey, currentStat);
  }
  
  private checkAlerts(metrics: PerformanceMetrics): void {
    if (!this.config.alerting?.enabled) return;
    
    for (const rule of this.config.alerting.rules) {
      const value = this.getMetricValue(metrics, rule.metric);
      if (value !== undefined && this.evaluateCondition(value, rule.condition, rule.threshold)) {
        this.triggerAlert(rule, value, metrics);
      }
    }
  }
  
  private getMetricValue(metrics: PerformanceMetrics, metricName: string): number | undefined {
    switch (metricName) {
      case 'latency_p99': return metrics.latencyP99;
      case 'latency_p95': return metrics.latencyP95;
      case 'latency_p50': return metrics.latencyP50;
      case 'error_rate': return metrics.errorRate;
      case 'request_rate': return metrics.requestRate;
      case 'throughput': return metrics.throughput;
      case 'connection_count': return metrics.connectionCount;
      default: return undefined;
    }
  }
  
  private evaluateCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      default: return false;
    }
  }
  
  private triggerAlert(rule: AlertRule, value: number, metrics: PerformanceMetrics): void {
    const alert: Alert = {
      id: this.generateAlertId(),
      rule: rule.name,
      metric: rule.metric,
      value,
      threshold: rule.threshold,
      timestamp: Date.now(),
      message: `Alert: ${rule.metric} (${value}) ${rule.condition} ${rule.threshold} for ${metrics.protocol}:${metrics.service}:${metrics.method}`
    };
    
    const alertKey = `${metrics.protocol}:${metrics.service}:${metrics.method}`;
    const alerts = this.alerts.get(alertKey) || [];
    alerts.push(alert);
    this.alerts.set(alertKey, alerts);
    
    // 执行告警动作
    switch (rule.action) {
      case 'log':
        console.warn(alert.message);
        break;
      case 'alert':
        console.error(alert.message);
        break;
      case 'callback':
        if (rule.callback) {
          rule.callback(alert);
        }
        break;
    }
    
    this.emit('alert_triggered', alert);
  }
  
  private async exportMetrics(metrics: PerformanceMetrics[]): Promise<void> {
    if (!this.config.exporters) return;
    
    const exportPromises = this.config.exporters.map(async (exporter) => {
      try {
        await exporter.export(metrics);
      } catch (error) {
        console.error(`Failed to export metrics via ${exporter.name}:`, error);
      }
    });
    
    await Promise.all(exportPromises);
  }
  
  private cleanupOldMetrics(): void {
    const cutoffTime = Date.now() - this.config.metricsRetention;
    
    for (const [key, metricsList] of this.metrics) {
      const filteredMetrics = metricsList.filter(m => m.timestamp > cutoffTime);
      if (filteredMetrics.length !== metricsList.length) {
        this.metrics.set(key, filteredMetrics);
      }
    }
    
    // 清理旧告警
    for (const [key, alertsList] of this.alerts) {
      const filteredAlerts = alertsList.filter(a => a.timestamp > cutoffTime);
      if (filteredAlerts.length !== alertsList.length) {
        this.alerts.set(key, filteredAlerts);
      }
    }
  }
  
  private buildMetricsFilter(protocol?: ProtocolType, service?: string): ((key: string) => boolean) | null {
    if (!protocol && !service) return null;
    
    return (key: string) => {
      const [keyProtocol, keyService] = key.split(':');
      
      if (protocol && keyProtocol !== protocol) {
        return false;
      }
      
      if (service && keyService !== service) {
        return false;
      }
      
      return true;
    };
  }
  
  private generateAlertId(): string {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}