export {
  ErrorCollector,
  getGlobalErrorCollector,
  setGlobalErrorCollector,
  collectError,
  setupGlobalErrorHandling
} from './collector.js';

export {
  ErrorMetrics,
  ErrorAlerting,
  type ErrorMetric
} from './metrics.js';