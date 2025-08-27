import { AlertingRule } from '../types/index.js';

export interface ErrorMetric {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export class ErrorMetrics {
  private metrics: ErrorMetric[] = [];
  private counters: Record<string, number> = {};
  private timers: Record<string, number[]> = {};

  constructor(
    private options: {
      collectionInterval?: number;
      dimensions?: string[];
      metrics?: string[];
    } = {}
  ) {
    if (options.collectionInterval) {
      this.startCollection();
    }
  }

  private startCollection(): void {
    const interval = this.options.collectionInterval || 60000;
    
    setInterval(() => {
      this.collectMetrics();
    }, interval);
  }

  private collectMetrics(): void {
    const timestamp = new Date();
    
    // 收集错误计数指标
    Object.entries(this.counters).forEach(([key, value]) => {
      this.addMetric({
        name: 'error_count',
        value,
        labels: this.parseLabelsFromKey(key),
        timestamp
      });
    });

    // 收集错误率指标
    this.calculateErrorRates(timestamp);
    
    // 收集平均恢复时间指标
    this.calculateRecoveryTimes(timestamp);
  }

  private parseLabelsFromKey(key: string): Record<string, string> {
    const parts = key.split(':');
    const labels: Record<string, string> = {};
    
    parts.forEach(part => {
      const [name, value] = part.split('=');
      if (name && value) {
        labels[name] = value;
      }
    });
    
    return labels;
  }

  private calculateErrorRates(timestamp: Date): void {
    // 简化的错误率计算
    const totalRequests = this.counters['total_requests'] || 1;
    const totalErrors = Object.values(this.counters).reduce((sum, count) => sum + count, 0);
    const errorRate = totalErrors / totalRequests;
    
    this.addMetric({
      name: 'error_rate',
      value: errorRate,
      labels: {},
      timestamp
    });
  }

  private calculateRecoveryTimes(timestamp: Date): void {
    Object.entries(this.timers).forEach(([key, times]) => {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        
        this.addMetric({
          name: 'avg_error_recovery_time',
          value: avgTime,
          labels: this.parseLabelsFromKey(key),
          timestamp
        });
      }
    });
  }

  addMetric(metric: ErrorMetric): void {
    this.metrics.push(metric);
    
    // 保持最近的指标数据
    const maxMetrics = 10000;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }

  incrementCounter(key: string, labels?: Record<string, string>, value: number = 1): void {
    const metricKey = this.buildMetricKey(key, labels);
    this.counters[metricKey] = (this.counters[metricKey] || 0) + value;
  }

  recordTime(key: string, labels: Record<string, string>, duration: number): void {
    const metricKey = this.buildMetricKey(key, labels);
    if (!this.timers[metricKey]) {
      this.timers[metricKey] = [];
    }
    this.timers[metricKey].push(duration);
  }

  private buildMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    
    const labelParts = Object.entries(labels).map(([key, value]) => `${key}=${value}`);
    return `${name}:${labelParts.join(':')}`;
  }

  getMetrics(filter?: {
    name?: string;
    startTime?: Date;
    endTime?: Date;
    labels?: Record<string, string>;
  }): ErrorMetric[] {
    let filtered = this.metrics;
    
    if (filter) {
      if (filter.name) {
        filtered = filtered.filter(m => m.name === filter.name);
      }
      
      if (filter.startTime) {
        filtered = filtered.filter(m => m.timestamp >= filter.startTime!);
      }
      
      if (filter.endTime) {
        filtered = filtered.filter(m => m.timestamp <= filter.endTime!);
      }
      
      if (filter.labels) {
        filtered = filtered.filter(m => {
          return Object.entries(filter.labels!).every(([key, value]) => 
            m.labels[key] === value
          );
        });
      }
    }
    
    return filtered;
  }

  getCounters(): Record<string, number> {
    return { ...this.counters };
  }

  resetMetrics(): void {
    this.metrics = [];
    this.counters = {};
    this.timers = {};
  }
}

export class ErrorAlerting {
  private rules: AlertingRule[] = [];
  private alertHistory: Array<{
    rule: AlertingRule;
    timestamp: Date;
    value: number;
  }> = [];

  constructor(
    private options: {
      rules?: AlertingRule[];
      notifiers?: Array<{
        type: string;
        config: Record<string, any>;
      }>;
    } = {}
  ) {
    if (options.rules) {
      this.rules = options.rules;
    }
  }

  addRule(rule: AlertingRule): void {
    this.rules.push(rule);
  }

  removeRule(name: string): void {
    this.rules = this.rules.filter(rule => rule.name !== name);
  }

  checkAlerts(metrics: ErrorMetrics): void {
    this.rules.forEach(rule => {
      const shouldAlert = this.evaluateRule(rule, metrics);
      
      if (shouldAlert) {
        this.triggerAlert(rule, metrics);
      }
    });
  }

  private evaluateRule(rule: AlertingRule, metrics: ErrorMetrics): boolean {
    // 简化的规则评估
    // 实际实现应该支持更复杂的查询语法
    
    if (rule.condition.includes('error_rate >')) {
      const threshold = parseFloat(rule.condition.split('>')[1]!.trim());
      const currentMetrics = metrics.getMetrics({ name: 'error_rate' });
      
      if (currentMetrics.length > 0) {
        const latestMetric = currentMetrics[currentMetrics.length - 1]!;
        return latestMetric.value > threshold;
      }
    }
    
    if (rule.condition.includes('error_count >')) {
      const threshold = parseFloat(rule.condition.split('>')[1]!.trim());
      const currentMetrics = metrics.getMetrics({ name: 'error_count' });
      
      if (currentMetrics.length > 0) {
        const latestMetric = currentMetrics[currentMetrics.length - 1]!;
        return latestMetric.value > threshold;
      }
    }
    
    return false;
  }

  private triggerAlert(rule: AlertingRule, metrics: ErrorMetrics): void {
    const alertInfo = {
      rule,
      timestamp: new Date(),
      value: this.getCurrentMetricValue(rule, metrics)
    };
    
    this.alertHistory.push(alertInfo);
    
    // 发送通知
    this.sendNotifications(alertInfo);
  }

  private getCurrentMetricValue(rule: AlertingRule, metrics: ErrorMetrics): number {
    // 获取当前指标值用于告警信息
    const metricName = rule.condition.includes('error_rate') ? 'error_rate' : 'error_count';
    const currentMetrics = metrics.getMetrics({ name: metricName });
    
    if (currentMetrics.length > 0) {
      return currentMetrics[currentMetrics.length - 1]!.value;
    }
    
    return 0;
  }

  private sendNotifications(alertInfo: any): void {
    const notifiers = this.options.notifiers || [];
    
    notifiers.forEach(notifier => {
      try {
        this.sendNotification(notifier, alertInfo);
      } catch (error) {
        console.error(`Failed to send notification via ${notifier.type}:`, error);
      }
    });
  }

  private sendNotification(notifier: any, alertInfo: any): void {
    const message = this.formatAlertMessage(alertInfo);
    
    switch (notifier.type) {
      case 'console':
        console.warn('🚨 ALERT:', message);
        break;
      case 'slack':
        if (notifier.config.webhook) {
          console.log(`Sending Slack alert to ${notifier.config.webhook}:`, message);
        }
        break;
      case 'email':
        if (notifier.config.recipients) {
          console.log(`Sending email alert to ${notifier.config.recipients.join(', ')}:`, message);
        }
        break;
      default:
        console.warn(`Unknown notifier type: ${notifier.type}`);
    }
  }

  private formatAlertMessage(alertInfo: any): string {
    const { rule, timestamp, value } = alertInfo;
    
    return `Alert: ${rule.name}
Condition: ${rule.condition}
Current Value: ${value}
Time: ${timestamp.toISOString()}
Description: ${rule.annotations.description || 'No description'}`;
  }

  getAlertHistory(): Array<{
    rule: AlertingRule;
    timestamp: Date;
    value: number;
  }> {
    return [...this.alertHistory];
  }

  clearAlertHistory(): void {
    this.alertHistory = [];
  }
}