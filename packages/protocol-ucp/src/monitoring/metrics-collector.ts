import { EventEmitter } from 'events';

/**
 * 指标类型枚举
 */
export enum MetricType {
  COUNTER = 'counter',
  GAUGE = 'gauge',
  HISTOGRAM = 'histogram',
  SUMMARY = 'summary'
}

/**
 * 指标标签接口
 */
export interface MetricLabels {
  [key: string]: string;
}

/**
 * 指标值接口
 */
export interface MetricValue {
  value: number;
  timestamp: number;
  labels?: MetricLabels;
}

/**
 * 指标定义接口
 */
export interface MetricDefinition {
  name: string;
  type: MetricType;
  help: string;
  labels?: string[];
  buckets?: number[]; // 用于直方图
  quantiles?: number[]; // 用于摘要
}

/**
 * 指标数据接口
 */
export interface Metric {
  name: string;
  type: MetricType;
  help: string;
  values: MetricValue[];
  labels?: string[];
}

/**
 * 直方图桶接口
 */
export interface HistogramBucket {
  le: number; // less than or equal to
  count: number;
}

/**
 * 直方图数据接口
 */
export interface HistogramData {
  count: number;
  sum: number;
  buckets: HistogramBucket[];
}

/**
 * 指标收集器实现
 */
export class MetricsCollector extends EventEmitter {
  private metrics: Map<string, Metric> = new Map();
  private counters: Map<string, Map<string, number>> = new Map();
  private gauges: Map<string, Map<string, number>> = new Map();
  private histograms: Map<string, Map<string, HistogramData>> = new Map();
  private summaries: Map<string, Map<string, number[]>> = new Map();
  
  private definitions: Map<string, MetricDefinition> = new Map();
  
  constructor() {
    super();
    this.registerDefaultMetrics();
  }
  
  /**
   * 注册指标定义
   */
  register(definition: MetricDefinition): void {
    this.definitions.set(definition.name, definition);
    
    // 初始化存储
    switch (definition.type) {
      case MetricType.COUNTER:
        this.counters.set(definition.name, new Map());
        break;
      case MetricType.GAUGE:
        this.gauges.set(definition.name, new Map());
        break;
      case MetricType.HISTOGRAM:
        this.histograms.set(definition.name, new Map());
        break;
      case MetricType.SUMMARY:
        this.summaries.set(definition.name, new Map());
        break;
    }
    
    this.emit('metric_registered', definition);
  }
  
  /**
   * 增加计数器
   */
  incrementCounter(name: string, labels?: MetricLabels, delta: number = 1): void {
    const definition = this.definitions.get(name);
    if (!definition || definition.type !== MetricType.COUNTER) {
      throw new Error(`Counter metric '${name}' not found or wrong type`);
    }
    
    const labelKey = this.serializeLabels(labels);
    const counters = this.counters.get(name)!;
    const currentValue = counters.get(labelKey) || 0;
    counters.set(labelKey, currentValue + delta);
    
    this.emit('counter_incremented', { name, labels, delta, value: currentValue + delta });
  }
  
  /**
   * 设置计量器值
   */
  setGauge(name: string, value: number, labels?: MetricLabels): void {
    const definition = this.definitions.get(name);
    if (!definition || definition.type !== MetricType.GAUGE) {
      throw new Error(`Gauge metric '${name}' not found or wrong type`);
    }
    
    const labelKey = this.serializeLabels(labels);
    const gauges = this.gauges.get(name)!;
    gauges.set(labelKey, value);
    
    this.emit('gauge_set', { name, labels, value });
  }
  
  /**
   * 增加计量器值
   */
  incrementGauge(name: string, delta: number, labels?: MetricLabels): void {
    const definition = this.definitions.get(name);
    if (!definition || definition.type !== MetricType.GAUGE) {
      throw new Error(`Gauge metric '${name}' not found or wrong type`);
    }
    
    const labelKey = this.serializeLabels(labels);
    const gauges = this.gauges.get(name)!;
    const currentValue = gauges.get(labelKey) || 0;
    gauges.set(labelKey, currentValue + delta);
    
    this.emit('gauge_incremented', { name, labels, delta, value: currentValue + delta });
  }
  
  /**
   * 记录直方图观测值
   */
  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const definition = this.definitions.get(name);
    if (!definition || definition.type !== MetricType.HISTOGRAM) {
      throw new Error(`Histogram metric '${name}' not found or wrong type`);
    }
    
    const labelKey = this.serializeLabels(labels);
    const histograms = this.histograms.get(name)!;
    let histogram = histograms.get(labelKey);
    
    if (!histogram) {
      const buckets = definition.buckets || [0.005, 0.01, 0.025, 0.05, 0.075, 0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10];
      histogram = {
        count: 0,
        sum: 0,
        buckets: buckets.map(le => ({ le, count: 0 }))
      };
      histograms.set(labelKey, histogram);
    }
    
    histogram.count++;
    histogram.sum += value;
    
    // 更新桶计数
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }
    
    this.emit('histogram_recorded', { name, labels, value });
  }
  
  /**
   * 记录摘要观测值
   */
  recordSummary(name: string, value: number, labels?: MetricLabels): void {
    const definition = this.definitions.get(name);
    if (!definition || definition.type !== MetricType.SUMMARY) {
      throw new Error(`Summary metric '${name}' not found or wrong type`);
    }
    
    const labelKey = this.serializeLabels(labels);
    const summaries = this.summaries.get(name)!;
    let values = summaries.get(labelKey);
    
    if (!values) {
      values = [];
      summaries.set(labelKey, values);
    }
    
    values.push(value);
    
    // 保持最近的1000个值
    if (values.length > 1000) {
      values.splice(0, values.length - 1000);
    }
    
    this.emit('summary_recorded', { name, labels, value });
  }
  
  /**
   * 获取所有指标
   */
  getMetrics(): Metric[] {
    const metrics: Metric[] = [];
    const timestamp = Date.now();
    
    // 计数器
    for (const [name, counters] of this.counters) {
      const definition = this.definitions.get(name)!;
      const values: MetricValue[] = [];
      
      for (const [labelKey, value] of counters) {
        values.push({
          value,
          timestamp,
          labels: this.deserializeLabels(labelKey)
        });
      }
      
      metrics.push({
        name,
        type: MetricType.COUNTER,
        help: definition.help,
        values,
        labels: definition.labels
      });
    }
    
    // 计量器
    for (const [name, gauges] of this.gauges) {
      const definition = this.definitions.get(name)!;
      const values: MetricValue[] = [];
      
      for (const [labelKey, value] of gauges) {
        values.push({
          value,
          timestamp,
          labels: this.deserializeLabels(labelKey)
        });
      }
      
      metrics.push({
        name,
        type: MetricType.GAUGE,
        help: definition.help,
        values,
        labels: definition.labels
      });
    }
    
    // 直方图
    for (const [name, histograms] of this.histograms) {
      const definition = this.definitions.get(name)!;
      const values: MetricValue[] = [];
      
      for (const [labelKey, histogram] of histograms) {
        const baseLabels = this.deserializeLabels(labelKey);
        
        // 添加总计数
        values.push({
          value: histogram.count,
          timestamp,
          labels: { ...baseLabels, __type: 'count' }
        });
        
        // 添加总和
        values.push({
          value: histogram.sum,
          timestamp,
          labels: { ...baseLabels, __type: 'sum' }
        });
        
        // 添加桶
        for (const bucket of histogram.buckets) {
          values.push({
            value: bucket.count,
            timestamp,
            labels: { ...baseLabels, __type: 'bucket', le: bucket.le.toString() }
          });
        }
      }
      
      metrics.push({
        name,
        type: MetricType.HISTOGRAM,
        help: definition.help,
        values,
        labels: definition.labels
      });
    }
    
    // 摘要
    for (const [name, summaries] of this.summaries) {
      const definition = this.definitions.get(name)!;
      const values: MetricValue[] = [];
      const quantiles = definition.quantiles || [0.5, 0.9, 0.95, 0.99];
      
      for (const [labelKey, summaryValues] of summaries) {
        const baseLabels = this.deserializeLabels(labelKey);
        const sortedValues = [...summaryValues].sort((a, b) => a - b);
        
        // 添加总计数
        values.push({
          value: summaryValues.length,
          timestamp,
          labels: { ...baseLabels, __type: 'count' }
        });
        
        // 添加总和
        const sum = summaryValues.reduce((acc, val) => acc + val, 0);
        values.push({
          value: sum,
          timestamp,
          labels: { ...baseLabels, __type: 'sum' }
        });
        
        // 添加分位数
        for (const quantile of quantiles) {
          const value = this.calculateQuantile(sortedValues, quantile);
          values.push({
            value,
            timestamp,
            labels: { ...baseLabels, __type: 'quantile', quantile: quantile.toString() }
          });
        }
      }
      
      metrics.push({
        name,
        type: MetricType.SUMMARY,
        help: definition.help,
        values,
        labels: definition.labels
      });
    }
    
    return metrics;
  }
  
  /**
   * 获取特定指标
   */
  getMetric(name: string): Metric | undefined {
    const allMetrics = this.getMetrics();
    return allMetrics.find(m => m.name === name);
  }
  
  /**
   * 重置所有指标
   */
  reset(): void {
    for (const counters of this.counters.values()) {
      counters.clear();
    }
    
    for (const gauges of this.gauges.values()) {
      gauges.clear();
    }
    
    for (const histograms of this.histograms.values()) {
      histograms.clear();
    }
    
    for (const summaries of this.summaries.values()) {
      summaries.clear();
    }
    
    this.emit('metrics_reset');
  }
  
  /**
   * 重置特定指标
   */
  resetMetric(name: string): void {
    const definition = this.definitions.get(name);
    if (!definition) return;
    
    switch (definition.type) {
      case MetricType.COUNTER:
        this.counters.get(name)?.clear();
        break;
      case MetricType.GAUGE:
        this.gauges.get(name)?.clear();
        break;
      case MetricType.HISTOGRAM:
        this.histograms.get(name)?.clear();
        break;
      case MetricType.SUMMARY:
        this.summaries.get(name)?.clear();
        break;
    }
    
    this.emit('metric_reset', { name });
  }
  
  private registerDefaultMetrics(): void {
    // 默认的协议指标
    this.register({
      name: 'ucp_requests_total',
      type: MetricType.COUNTER,
      help: 'Total number of requests',
      labels: ['protocol', 'service', 'method', 'status']
    });
    
    this.register({
      name: 'ucp_request_duration_seconds',
      type: MetricType.HISTOGRAM,
      help: 'Request duration in seconds',
      labels: ['protocol', 'service', 'method'],
      buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2.5, 5, 10]
    });
    
    this.register({
      name: 'ucp_active_connections',
      type: MetricType.GAUGE,
      help: 'Number of active connections',
      labels: ['protocol']
    });
    
    this.register({
      name: 'ucp_connection_pool_size',
      type: MetricType.GAUGE,
      help: 'Connection pool size',
      labels: ['protocol', 'target']
    });
    
    this.register({
      name: 'ucp_errors_total',
      type: MetricType.COUNTER,
      help: 'Total number of errors',
      labels: ['protocol', 'service', 'method', 'error_code']
    });
    
    this.register({
      name: 'ucp_bytes_sent_total',
      type: MetricType.COUNTER,
      help: 'Total bytes sent',
      labels: ['protocol', 'service']
    });
    
    this.register({
      name: 'ucp_bytes_received_total',
      type: MetricType.COUNTER,
      help: 'Total bytes received',
      labels: ['protocol', 'service']
    });
  }
  
  private serializeLabels(labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return '';
    }
    
    const sortedKeys = Object.keys(labels).sort();
    const pairs = sortedKeys.map(key => `${key}=${labels[key]}`);
    return pairs.join(',');
  }
  
  private deserializeLabels(labelKey: string): MetricLabels | undefined {
    if (!labelKey) return undefined;
    
    const labels: MetricLabels = {};
    const pairs = labelKey.split(',');
    
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key && value) {
        labels[key] = value;
      }
    }
    
    return Object.keys(labels).length > 0 ? labels : undefined;
  }
  
  private calculateQuantile(sortedValues: number[], quantile: number): number {
    if (sortedValues.length === 0) return 0;
    
    const index = quantile * (sortedValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    
    if (lower === upper) {
      return sortedValues[lower]!;
    }
    
    const weight = index - lower;
    return sortedValues[lower]! * (1 - weight) + sortedValues[upper]! * weight;
  }
}