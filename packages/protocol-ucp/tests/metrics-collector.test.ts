import { describe, it, expect, beforeEach } from 'vitest';
import { MetricsCollector, MetricType } from '../src/index.js';

describe('MetricsCollector', () => {
  let collector: MetricsCollector;

  beforeEach(() => {
    collector = new MetricsCollector();
  });

  describe('metric registration', () => {
    it('should register counter metrics', () => {
      collector.register({
        name: 'test_counter',
        type: MetricType.COUNTER,
        help: 'Test counter metric',
        labels: ['method', 'status']
      });

      expect(() => {
        collector.incrementCounter('test_counter', { method: 'GET', status: '200' }, 1);
      }).not.toThrow();
    });

    it('should register gauge metrics', () => {
      collector.register({
        name: 'test_gauge',
        type: MetricType.GAUGE,
        help: 'Test gauge metric',
        labels: ['instance']
      });

      expect(() => {
        collector.setGauge('test_gauge', 42, { instance: 'server-1' });
      }).not.toThrow();
    });

    it('should register histogram metrics', () => {
      collector.register({
        name: 'test_histogram',
        type: MetricType.HISTOGRAM,
        help: 'Test histogram metric',
        labels: ['endpoint'],
        buckets: [0.1, 0.5, 1, 5, 10]
      });

      expect(() => {
        collector.recordHistogram('test_histogram', 2.5, { endpoint: '/api/users' });
      }).not.toThrow();
    });

    it('should register summary metrics', () => {
      collector.register({
        name: 'test_summary',
        type: MetricType.SUMMARY,
        help: 'Test summary metric',
        labels: ['service'],
        quantiles: [0.5, 0.9, 0.95, 0.99]
      });

      expect(() => {
        collector.recordSummary('test_summary', 1.23, { service: 'user-api' });
      }).not.toThrow();
    });
  });

  describe('counter operations', () => {
    beforeEach(() => {
      collector.register({
        name: 'requests_total',
        type: MetricType.COUNTER,
        help: 'Total requests',
        labels: ['method', 'status']
      });
    });

    it('should increment counter', () => {
      collector.incrementCounter('requests_total', { method: 'GET', status: '200' }, 1);
      collector.incrementCounter('requests_total', { method: 'GET', status: '200' }, 2);

      const metrics = collector.getMetrics();
      const counterMetric = metrics.find(m => m.name === 'requests_total');
      
      expect(counterMetric).toBeDefined();
      expect(counterMetric?.values[0]?.value).toBe(3);
    });

    it('should handle different label combinations', () => {
      collector.incrementCounter('requests_total', { method: 'GET', status: '200' }, 1);
      collector.incrementCounter('requests_total', { method: 'POST', status: '201' }, 1);
      collector.incrementCounter('requests_total', { method: 'GET', status: '404' }, 1);

      const metrics = collector.getMetrics();
      const counterMetric = metrics.find(m => m.name === 'requests_total');
      
      expect(counterMetric?.values).toHaveLength(3);
    });
  });

  describe('gauge operations', () => {
    beforeEach(() => {
      collector.register({
        name: 'active_connections',
        type: MetricType.GAUGE,
        help: 'Active connections',
        labels: ['server']
      });
    });

    it('should set gauge value', () => {
      collector.setGauge('active_connections', 10, { server: 'web-1' });
      collector.setGauge('active_connections', 15, { server: 'web-2' });

      const metrics = collector.getMetrics();
      const gaugeMetric = metrics.find(m => m.name === 'active_connections');
      
      expect(gaugeMetric?.values).toHaveLength(2);
      expect(gaugeMetric?.values.find(v => v.labels?.server === 'web-1')?.value).toBe(10);
      expect(gaugeMetric?.values.find(v => v.labels?.server === 'web-2')?.value).toBe(15);
    });

    it('should increment gauge value', () => {
      collector.setGauge('active_connections', 10, { server: 'web-1' });
      collector.incrementGauge('active_connections', 5, { server: 'web-1' });

      const metrics = collector.getMetrics();
      const gaugeMetric = metrics.find(m => m.name === 'active_connections');
      
      expect(gaugeMetric?.values[0]?.value).toBe(15);
    });
  });

  describe('histogram operations', () => {
    beforeEach(() => {
      collector.register({
        name: 'request_duration',
        type: MetricType.HISTOGRAM,
        help: 'Request duration in seconds',
        labels: ['endpoint'],
        buckets: [0.1, 0.5, 1, 2, 5]
      });
    });

    it('should record histogram values', () => {
      collector.recordHistogram('request_duration', 0.3, { endpoint: '/api/users' });
      collector.recordHistogram('request_duration', 0.7, { endpoint: '/api/users' });
      collector.recordHistogram('request_duration', 1.5, { endpoint: '/api/users' });

      const metrics = collector.getMetrics();
      const histogramMetric = metrics.find(m => m.name === 'request_duration');
      
      expect(histogramMetric).toBeDefined();
      
      // Should have count, sum, and bucket entries
      const countValue = histogramMetric?.values.find(v => v.labels?.__type === 'count');
      const sumValue = histogramMetric?.values.find(v => v.labels?.__type === 'sum');
      
      expect(countValue?.value).toBe(3);
      expect(sumValue?.value).toBe(2.5); // 0.3 + 0.7 + 1.5
      
      // Check bucket counts
      const bucket_0_5 = histogramMetric?.values.find(v => v.labels?.__type === 'bucket' && v.labels?.le === '0.5');
      const bucket_1 = histogramMetric?.values.find(v => v.labels?.__type === 'bucket' && v.labels?.le === '1');
      const bucket_2 = histogramMetric?.values.find(v => v.labels?.__type === 'bucket' && v.labels?.le === '2');
      
      expect(bucket_0_5?.value).toBe(1); // Only 0.3 <= 0.5
      expect(bucket_1?.value).toBe(2); // 0.3 and 0.7 <= 1
      expect(bucket_2?.value).toBe(3); // All values <= 2
    });
  });

  describe('summary operations', () => {
    beforeEach(() => {
      collector.register({
        name: 'response_size',
        type: MetricType.SUMMARY,
        help: 'Response size in bytes',
        labels: ['service'],
        quantiles: [0.5, 0.9, 0.95, 0.99]
      });
    });

    it('should record summary values', () => {
      const values = [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];
      
      for (const value of values) {
        collector.recordSummary('response_size', value, { service: 'api' });
      }

      const metrics = collector.getMetrics();
      const summaryMetric = metrics.find(m => m.name === 'response_size');
      
      expect(summaryMetric).toBeDefined();
      
      // Should have count, sum, and quantile entries
      const countValue = summaryMetric?.values.find(v => v.labels?.__type === 'count');
      const sumValue = summaryMetric?.values.find(v => v.labels?.__type === 'sum');
      
      expect(countValue?.value).toBe(10);
      expect(sumValue?.value).toBe(5500); // Sum of 100-1000
      
      // Check quantiles
      const p50 = summaryMetric?.values.find(v => v.labels?.__type === 'quantile' && v.labels?.quantile === '0.5');
      const p90 = summaryMetric?.values.find(v => v.labels?.__type === 'quantile' && v.labels?.quantile === '0.9');
      
      expect(p50?.value).toBe(550); // Median
      expect(p90?.value).toBe(950); // 90th percentile
    });
  });

  describe('metric retrieval', () => {
    it('should get all metrics', () => {
      collector.register({
        name: 'test_counter',
        type: MetricType.COUNTER,
        help: 'Test counter'
      });
      
      collector.register({
        name: 'test_gauge',
        type: MetricType.GAUGE,
        help: 'Test gauge'
      });

      collector.incrementCounter('test_counter');
      collector.setGauge('test_gauge', 42);

      const metrics = collector.getMetrics();
      expect(metrics).toHaveLength(2);
      expect(metrics.map(m => m.name)).toContain('test_counter');
      expect(metrics.map(m => m.name)).toContain('test_gauge');
    });

    it('should get specific metric', () => {
      collector.register({
        name: 'specific_metric',
        type: MetricType.COUNTER,
        help: 'Specific metric'
      });

      collector.incrementCounter('specific_metric', {}, 5);

      const metric = collector.getMetric('specific_metric');
      expect(metric).toBeDefined();
      expect(metric?.name).toBe('specific_metric');
      expect(metric?.values[0]?.value).toBe(5);
    });
  });

  describe('metric reset', () => {
    beforeEach(() => {
      collector.register({
        name: 'reset_counter',
        type: MetricType.COUNTER,
        help: 'Reset counter'
      });

      collector.register({
        name: 'reset_gauge',
        type: MetricType.GAUGE,
        help: 'Reset gauge'
      });

      collector.incrementCounter('reset_counter', {}, 10);
      collector.setGauge('reset_gauge', 20);
    });

    it('should reset specific metric', () => {
      collector.resetMetric('reset_counter');

      const metrics = collector.getMetrics();
      const counterMetric = metrics.find(m => m.name === 'reset_counter');
      const gaugeMetric = metrics.find(m => m.name === 'reset_gauge');

      expect(counterMetric?.values).toHaveLength(0);
      expect(gaugeMetric?.values).toHaveLength(1); // Should still have gauge value
    });

    it('should reset all metrics', () => {
      collector.reset();

      const metrics = collector.getMetrics();
      for (const metric of metrics) {
        expect(metric.values).toHaveLength(0);
      }
    });
  });
});