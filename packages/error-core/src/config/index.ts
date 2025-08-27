import { ErrorCategory } from '../types/index.js';
import { ErrorCollector, setupGlobalErrorHandling } from '../monitoring/index.js';
import { DEFAULT_RETRY_STRATEGY, DEFAULT_CIRCUIT_BREAKER } from '../strategies/index.js';

export interface ErrorHandlingConfig {
  global?: {
    includeStackTrace?: boolean;
    maxContextDepth?: number;
    sensitiveFields?: string[];
    httpStatusMapping?: Record<ErrorCategory, number>;
  };
  retry?: {
    defaultMaxAttempts?: number;
    defaultInitialDelay?: number;
    defaultBackoffMultiplier?: number;
    defaultMaxDelay?: number;
  };
  circuitBreaker?: {
    defaultFailureThreshold?: number;
    defaultResetTimeout?: number;
    defaultMonitoringPeriod?: number;
  };
  collection?: {
    enabled?: boolean;
    samplingRate?: number;
    batchSize?: number;
    flushInterval?: number;
  };
  monitoring?: {
    enabled?: boolean;
    metricsInterval?: number;
    alertingEnabled?: boolean;
  };
}

let globalConfig: ErrorHandlingConfig = {
  global: {
    includeStackTrace: process.env.NODE_ENV !== 'production',
    maxContextDepth: 5,
    sensitiveFields: ['password', 'token', 'creditCard', 'ssn'],
    httpStatusMapping: {
      business: 400,
      system: 500,
      integration: 502,
      security: 401
    }
  },
  retry: {
    defaultMaxAttempts: 3,
    defaultInitialDelay: 1000,
    defaultBackoffMultiplier: 2,
    defaultMaxDelay: 30000
  },
  circuitBreaker: {
    defaultFailureThreshold: 5,
    defaultResetTimeout: 60000,
    defaultMonitoringPeriod: 10000
  },
  collection: {
    enabled: true,
    samplingRate: 1.0,
    batchSize: 100,
    flushInterval: 5000
  },
  monitoring: {
    enabled: true,
    metricsInterval: 30000,
    alertingEnabled: process.env.NODE_ENV === 'production'
  }
};

export function configureErrorHandling(config: ErrorHandlingConfig): void {
  // 深度合并配置
  globalConfig = deepMerge(globalConfig, config);

  // 应用全局配置
  if (globalConfig.collection?.enabled) {
    const collector = new ErrorCollector({
      samplingRate: globalConfig.collection.samplingRate
    });
    
    setupGlobalErrorHandling(collector);
  }

  // 配置默认策略
  if (globalConfig.retry) {
    Object.assign(DEFAULT_RETRY_STRATEGY, {
      maxAttempts: globalConfig.retry.defaultMaxAttempts,
      initialDelay: globalConfig.retry.defaultInitialDelay,
      backoffMultiplier: globalConfig.retry.defaultBackoffMultiplier,
      maxDelay: globalConfig.retry.defaultMaxDelay
    });
  }

  if (globalConfig.circuitBreaker) {
    Object.assign(DEFAULT_CIRCUIT_BREAKER, {
      failureThreshold: globalConfig.circuitBreaker.defaultFailureThreshold,
      resetTimeout: globalConfig.circuitBreaker.defaultResetTimeout,
      monitoringPeriod: globalConfig.circuitBreaker.defaultMonitoringPeriod
    });
  }
}

export function getErrorHandlingConfig(): ErrorHandlingConfig {
  return JSON.parse(JSON.stringify(globalConfig));
}

export function resetErrorHandlingConfig(): void {
  globalConfig = {
    global: {
      includeStackTrace: process.env.NODE_ENV !== 'production',
      maxContextDepth: 5,
      sensitiveFields: ['password', 'token', 'creditCard', 'ssn'],
      httpStatusMapping: {
        business: 400,
        system: 500,
        integration: 502,
        security: 401
      }
    },
    retry: {
      defaultMaxAttempts: 3,
      defaultInitialDelay: 1000,
      defaultBackoffMultiplier: 2,
      defaultMaxDelay: 30000
    },
    circuitBreaker: {
      defaultFailureThreshold: 5,
      defaultResetTimeout: 60000,
      defaultMonitoringPeriod: 10000
    },
    collection: {
      enabled: true,
      samplingRate: 1.0,
      batchSize: 100,
      flushInterval: 5000
    },
    monitoring: {
      enabled: true,
      metricsInterval: 30000,
      alertingEnabled: process.env.NODE_ENV === 'production'
    }
  };
}

function deepMerge(target: any, source: any): any {
  const result = { ...target };
  
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}

// 环境变量配置
export function configureFromEnvironment(): void {
  const envConfig: ErrorHandlingConfig = {};

  // 全局配置
  if (process.env.SKER_ERROR_INCLUDE_STACK_TRACE) {
    envConfig.global = envConfig.global || {};
    envConfig.global.includeStackTrace = process.env.SKER_ERROR_INCLUDE_STACK_TRACE === 'true';
  }

  if (process.env.SKER_ERROR_MAX_CONTEXT_DEPTH) {
    envConfig.global = envConfig.global || {};
    envConfig.global.maxContextDepth = parseInt(process.env.SKER_ERROR_MAX_CONTEXT_DEPTH, 10);
  }

  if (process.env.SKER_ERROR_SENSITIVE_FIELDS) {
    envConfig.global = envConfig.global || {};
    envConfig.global.sensitiveFields = process.env.SKER_ERROR_SENSITIVE_FIELDS.split(',');
  }

  // 重试配置
  if (process.env.SKER_RETRY_MAX_ATTEMPTS) {
    envConfig.retry = envConfig.retry || {};
    envConfig.retry.defaultMaxAttempts = parseInt(process.env.SKER_RETRY_MAX_ATTEMPTS, 10);
  }

  if (process.env.SKER_RETRY_INITIAL_DELAY) {
    envConfig.retry = envConfig.retry || {};
    envConfig.retry.defaultInitialDelay = parseInt(process.env.SKER_RETRY_INITIAL_DELAY, 10);
  }

  // 熔断器配置
  if (process.env.SKER_CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
    envConfig.circuitBreaker = envConfig.circuitBreaker || {};
    envConfig.circuitBreaker.defaultFailureThreshold = parseInt(process.env.SKER_CIRCUIT_BREAKER_FAILURE_THRESHOLD, 10);
  }

  if (process.env.SKER_CIRCUIT_BREAKER_RESET_TIMEOUT) {
    envConfig.circuitBreaker = envConfig.circuitBreaker || {};
    envConfig.circuitBreaker.defaultResetTimeout = parseInt(process.env.SKER_CIRCUIT_BREAKER_RESET_TIMEOUT, 10);
  }

  // 收集配置
  if (process.env.SKER_ERROR_COLLECTION_ENABLED) {
    envConfig.collection = envConfig.collection || {};
    envConfig.collection.enabled = process.env.SKER_ERROR_COLLECTION_ENABLED === 'true';
  }

  if (process.env.SKER_ERROR_SAMPLING_RATE) {
    envConfig.collection = envConfig.collection || {};
    envConfig.collection.samplingRate = parseFloat(process.env.SKER_ERROR_SAMPLING_RATE);
  }

  // 监控配置
  if (process.env.SKER_MONITORING_ENABLED) {
    envConfig.monitoring = envConfig.monitoring || {};
    envConfig.monitoring.enabled = process.env.SKER_MONITORING_ENABLED === 'true';
  }

  if (process.env.SKER_MONITORING_METRICS_INTERVAL) {
    envConfig.monitoring = envConfig.monitoring || {};
    envConfig.monitoring.metricsInterval = parseInt(process.env.SKER_MONITORING_METRICS_INTERVAL, 10);
  }

  if (Object.keys(envConfig).length > 0) {
    configureErrorHandling(envConfig);
  }
}

// 预设配置
export const DEVELOPMENT_CONFIG: ErrorHandlingConfig = {
  global: {
    includeStackTrace: true,
    maxContextDepth: 10
  },
  collection: {
    enabled: true,
    samplingRate: 1.0
  },
  monitoring: {
    enabled: true,
    alertingEnabled: false
  }
};

export const PRODUCTION_CONFIG: ErrorHandlingConfig = {
  global: {
    includeStackTrace: false,
    maxContextDepth: 3
  },
  collection: {
    enabled: true,
    samplingRate: 0.1
  },
  monitoring: {
    enabled: true,
    alertingEnabled: true
  }
};

export const TESTING_CONFIG: ErrorHandlingConfig = {
  global: {
    includeStackTrace: true,
    maxContextDepth: 5
  },
  collection: {
    enabled: false
  },
  monitoring: {
    enabled: false,
    alertingEnabled: false
  }
};