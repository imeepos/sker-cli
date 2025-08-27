import { Logger } from './logger.js';
import { TracingLogger } from './tracing.js';
import { PerformanceLogger } from './performance.js';
import { 
  ConsoleOutputAdapter, 
  FileOutputAdapter, 
  ElasticsearchOutputAdapter
} from './outputs.js';
import { 
  LoggerConfig, 
  LogLevel, 
  LogFormat, 
  OutputConfig,
  OutputAdapter
} from './types.js';

export function createLogger(config: LoggerConfig = {}): Logger {
  const mergedConfig = mergeWithDefaults(config);
  
  if (config.performance?.enabled && config.tracing?.enabled) {
    return new PerformanceLogger(mergedConfig);
  }
  
  if (config.tracing?.enabled) {
    return new TracingLogger(mergedConfig);
  }
  
  return new Logger(mergedConfig);
}

export function createConsoleLogger(config: Partial<LoggerConfig> = {}): Logger {
  return createLogger({
    ...config,
    outputs: [{
      type: 'console',
      enabled: true,
      format: config.format || LogFormat.PRETTY
    }]
  });
}

export function createFileLogger(filename: string, config: Partial<LoggerConfig> = {}): Logger {
  return createLogger({
    ...config,
    outputs: [{
      type: 'file',
      enabled: true,
      config: {
        filename,
        maxSize: '10MB',
        maxFiles: 5,
        compress: true,
        ...config.outputs?.[0]?.config
      }
    }]
  });
}

export function createElasticsearchLogger(
  elasticsearchConfig: {
    host: string;
    index: string;
    type?: string;
    username?: string;
    password?: string;
  }, 
  config: Partial<LoggerConfig> = {}
): Logger {
  return createLogger({
    ...config,
    outputs: [{
      type: 'elasticsearch',
      enabled: true,
      config: elasticsearchConfig
    }]
  });
}

export function createProductionLogger(config: Partial<LoggerConfig> = {}): Logger {
  const productionConfig: LoggerConfig = {
    level: LogLevel.INFO,
    format: LogFormat.JSON,
    async: true,
    bufferSize: 1000,
    flushInterval: 5000,
    outputs: [
      {
        type: 'console',
        enabled: true,
        format: LogFormat.JSON
      },
      {
        type: 'file',
        enabled: true,
        config: {
          filename: './logs/app.log',
          maxSize: '50MB',
          maxFiles: 10,
          compress: true
        }
      }
    ],
    tracing: {
      enabled: true,
      sampling: 0.1
    },
    performance: {
      enabled: true,
      includeSystemMetrics: true,
      metricsInterval: 60000
    },
    context: {
      autoInjectTraceId: true,
      autoInjectRequestId: true,
      includeSourceInfo: false
    },
    filters: [
      (entry) => {
        if (entry.context?.password) {
          entry.context.password = '[REDACTED]';
        }
        if (entry.context?.token) {
          entry.context.token = '[REDACTED]';
        }
        if (entry.context?.authorization) {
          entry.context.authorization = '[REDACTED]';
        }
        return entry;
      }
    ],
    ...config
  };

  return createLogger(productionConfig);
}

export function createDevelopmentLogger(config: Partial<LoggerConfig> = {}): Logger {
  const developmentConfig: LoggerConfig = {
    level: LogLevel.DEBUG,
    format: LogFormat.PRETTY,
    async: false,
    outputs: [{
      type: 'console',
      enabled: true,
      format: LogFormat.PRETTY
    }],
    tracing: {
      enabled: true,
      sampling: 1.0
    },
    performance: {
      enabled: true,
      includeSystemMetrics: false
    },
    context: {
      autoInjectTraceId: true,
      autoInjectRequestId: true,
      includeSourceInfo: true
    },
    ...config
  };

  return createLogger(developmentConfig);
}

export function createTestLogger(config: Partial<LoggerConfig> = {}): Logger {
  const testConfig: LoggerConfig = {
    level: LogLevel.ERROR,
    format: LogFormat.JSON,
    async: false,
    outputs: [],
    tracing: {
      enabled: false,
      sampling: 0
    },
    performance: {
      enabled: false,
      includeSystemMetrics: false
    },
    ...config
  };

  return createLogger(testConfig);
}

export function createStructuredLogger(
  serviceName: string, 
  version: string, 
  config: Partial<LoggerConfig> = {}
): Logger {
  return createLogger({
    service: {
      name: serviceName,
      version,
      instance_id: process.env.HOSTNAME || process.env.INSTANCE_ID || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    },
    format: LogFormat.JSON,
    ...config
  });
}

function mergeWithDefaults(config: LoggerConfig): LoggerConfig {
  const defaults: LoggerConfig = {
    name: 'default',
    service: {
      name: config.name || 'unknown',
      version: '1.0.0',
      instance_id: process.env.HOSTNAME || 'unknown',
      environment: process.env.NODE_ENV || 'development'
    },
    level: parseLogLevel(process.env.LOG_LEVEL) || LogLevel.INFO,
    format: LogFormat.JSON,
    outputs: [{
      type: 'console',
      enabled: true
    }],
    tracing: {
      enabled: false,
      sampling: 0.1
    },
    performance: {
      enabled: false,
      includeSystemMetrics: false
    },
    context: {
      autoInjectTraceId: true,
      autoInjectRequestId: true,
      includeSourceInfo: false
    },
    filters: [],
    async: false,
    bufferSize: 1000,
    flushInterval: 5000,
    onError: (error: Error) => {
      console.error('[Logger Error]:', error);
    }
  };

  const merged = {
    ...defaults,
    ...config
  };

  if (config.service || defaults.service) {
    merged.service = {
      ...defaults.service!,
      ...config.service
    };
  }

  if (config.tracing || defaults.tracing) {
    merged.tracing = {
      ...defaults.tracing!,
      ...config.tracing
    };
  }

  if (config.performance || defaults.performance) {
    merged.performance = {
      ...defaults.performance!,
      ...config.performance
    };
  }

  if (config.context || defaults.context) {
    merged.context = {
      ...defaults.context!,
      ...config.context
    };
  }

  if (config.outputs) {
    merged.outputs = config.outputs.map(output => ({
      ...output,
      config: output.config ? {
        ...output.config
      } : undefined
    }));
  } else {
    merged.outputs = defaults.outputs!;
  }

  return merged;
}

function parseLogLevel(levelString?: string): LogLevel | undefined {
  if (!levelString) return undefined;
  
  const upperLevel = levelString.toUpperCase();
  const levelMap: Record<string, LogLevel> = {
    'TRACE': LogLevel.TRACE,
    'DEBUG': LogLevel.DEBUG,
    'INFO': LogLevel.INFO,
    'WARN': LogLevel.WARN,
    'WARNING': LogLevel.WARN,
    'ERROR': LogLevel.ERROR,
    'FATAL': LogLevel.FATAL
  };
  
  return levelMap[upperLevel];
}

export function createOutputAdapter(config: OutputConfig): OutputAdapter {
  switch (config.type) {
    case 'console':
      return new ConsoleOutputAdapter(config.format);
    case 'file':
      if (!config.config?.filename) {
        throw new Error('File output requires filename configuration');
      }
      return new FileOutputAdapter({
        filename: config.config.filename,
        maxSize: config.config.maxSize,
        maxFiles: config.config.maxFiles,
        compress: config.config.compress
      });
    case 'elasticsearch':
      if (!config.config?.host || !config.config?.index) {
        throw new Error('Elasticsearch output requires host and index configuration');
      }
      return new ElasticsearchOutputAdapter({
        host: config.config.host,
        index: config.config.index,
        type: config.config.type,
        username: config.config.username,
        password: config.config.password
      });
    default:
      throw new Error(`Unsupported output type: ${config.type}`);
  }
}