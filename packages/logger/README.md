# @sker/logger

Sker统一日志系统包，提供结构化日志记录和分布式追踪支持。

## 概述

`@sker/logger` 是Sker通信框架的统一日志系统，实现了跨语言跨进程跨端通信标准中定义的统一监控和日志规范。该包提供结构化日志记录、分布式追踪、性能监控和多种输出格式支持。

## 功能特性

### 📝 结构化日志
- **统一格式**: 基于UDEF标准的JSON结构化日志格式
- **多级别支持**: TRACE、DEBUG、INFO、WARN、ERROR、FATAL六个级别
- **上下文传播**: 自动传播请求ID、追踪ID等上下文信息
- **字段扩展**: 支持自定义字段和元数据

### 🔗 分布式追踪
- **追踪集成**: 内置OpenTelemetry兼容的分布式追踪
- **跨度管理**: 自动创建和管理调用链跨度
- **追踪传播**: 支持跨进程和跨服务的追踪上下文传播
- **采样策略**: 灵活的采样配置和策略

### 📊 性能监控
- **性能指标**: 自动记录响应时间、CPU使用率、内存使用量
- **业务指标**: 支持自定义业务指标和计数器
- **聚合统计**: 实时统计和聚合分析
- **告警支持**: 基于阈值的自动告警

### 🎯 多输出支持
- **控制台输出**: 开发环境友好的彩色控制台输出
- **文件输出**: 支持日志轮转的文件输出
- **远程输出**: 支持Elasticsearch、Fluentd等远程日志系统
- **多路输出**: 同时输出到多个目标

## 安装

```bash
npm install @sker/logger
# 或者
pnpm add @sker/logger
# 或者
yarn add @sker/logger
```

## 基础用法

### 创建日志器

```typescript
import { createLogger, LogLevel } from '@sker/logger';

// 创建基础日志器
const logger = createLogger({
  name: 'user-service',
  level: LogLevel.INFO,
  version: '1.0.0'
});

// 基础日志记录
logger.info('用户登录成功', { userId: '12345' });
logger.warn('用户登录失败', { userId: '12345', reason: 'invalid_password' });
logger.error('数据库连接失败', { error: 'connection_timeout' });
```

### 结构化日志

```typescript
import { Logger } from '@sker/logger';

const logger = new Logger({
  service: {
    name: 'user-service',
    version: '1.0.0',
    instance_id: 'user-service-abc123'
  },
  format: 'json'
});

// 结构化日志记录
logger.info('User authentication', {
  user_id: '12345',
  username: 'alice',
  ip_address: '192.168.1.100',
  user_agent: 'Mozilla/5.0...',
  auth_method: 'password',
  success: true,
  duration_ms: 150
});

// 输出格式:
// {
//   "timestamp": "2023-12-25T10:30:00.123Z",
//   "level": "INFO", 
//   "service": {
//     "name": "user-service",
//     "version": "1.0.0",
//     "instance_id": "user-service-abc123"
//   },
//   "message": "User authentication",
//   "context": {
//     "user_id": "12345",
//     "username": "alice",
//     "ip_address": "192.168.1.100",
//     "auth_method": "password",
//     "success": true,
//     "duration_ms": 150
//   },
//   "metadata": {
//     "source_file": "auth.ts",
//     "function_name": "authenticateUser",
//     "line_number": 42
//   }
// }
```

### 分布式追踪

```typescript
import { TracingLogger, createTraceContext } from '@sker/logger';

const logger = new TracingLogger({
  name: 'order-service',
  tracing: {
    enabled: true,
    sampling: 0.1  // 10% 采样率
  }
});

// 创建追踪上下文
const traceContext = createTraceContext({
  traceId: 'a1b2c3d4e5f67890abcdef1234567890',
  spanId: 'abcdef1234567890'
});

// 在追踪上下文中记录日志
await traceContext.run(async () => {
  logger.info('开始处理订单', { orderId: 'order-123' });
  
  // 创建子跨度
  const span = logger.startSpan('validate_order');
  try {
    await validateOrder(orderId);
    logger.info('订单验证成功', { orderId: 'order-123' });
  } catch (error) {
    span.recordException(error);
    logger.error('订单验证失败', { orderId: 'order-123', error });
  } finally {
    span.end();
  }
  
  logger.info('订单处理完成', { orderId: 'order-123' });
});
```

### 性能监控

```typescript
import { PerformanceLogger } from '@sker/logger';

const logger = new PerformanceLogger({
  name: 'api-service',
  performance: {
    enabled: true,
    includeSystemMetrics: true,
    customMetrics: ['request_count', 'response_time']
  }
});

// 性能监控装饰器
class UserController {
  @logger.monitor('get_user')
  async getUser(userId: string) {
    // 自动记录执行时间和资源使用情况
    const user = await userService.findById(userId);
    
    // 记录业务指标
    logger.incrementCounter('user_requests_total', {
      method: 'get',
      status: 'success'
    });
    
    return user;
  }
  
  @logger.monitor('create_user')
  async createUser(userData: CreateUserDto) {
    const startTime = Date.now();
    
    try {
      const user = await userService.create(userData);
      
      // 记录成功指标
      logger.recordHistogram('user_creation_duration', Date.now() - startTime, {
        status: 'success'
      });
      
      logger.info('用户创建成功', {
        user_id: user.id,
        username: user.username,
        duration_ms: Date.now() - startTime
      });
      
      return user;
    } catch (error) {
      // 记录失败指标
      logger.recordHistogram('user_creation_duration', Date.now() - startTime, {
        status: 'error',
        error_type: error.constructor.name
      });
      
      logger.error('用户创建失败', {
        error: error.message,
        user_data: userData,
        duration_ms: Date.now() - startTime
      });
      
      throw error;
    }
  }
}
```

## 高级配置

### 完整配置示例

```typescript
import { Logger, LogLevel, LogFormat } from '@sker/logger';

const logger = new Logger({
  // 服务信息
  service: {
    name: 'user-service',
    version: '1.2.3',
    instance_id: process.env.HOSTNAME || 'unknown',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // 日志级别
  level: process.env.LOG_LEVEL || LogLevel.INFO,
  
  // 输出格式
  format: LogFormat.JSON,
  
  // 输出配置
  outputs: [
    {
      type: 'console',
      enabled: process.env.NODE_ENV !== 'production',
      format: 'pretty'  // 开发环境使用易读格式
    },
    {
      type: 'file',
      enabled: true,
      config: {
        filename: './logs/app.log',
        maxSize: '10MB',
        maxFiles: 10,
        compress: true
      }
    },
    {
      type: 'elasticsearch',
      enabled: process.env.NODE_ENV === 'production',
      config: {
        host: process.env.ELASTICSEARCH_HOST,
        index: 'app-logs',
        type: '_doc'
      }
    }
  ],
  
  // 分布式追踪
  tracing: {
    enabled: true,
    sampling: process.env.TRACE_SAMPLING || 0.1,
    exporters: ['jaeger', 'console']
  },
  
  // 性能监控
  performance: {
    enabled: true,
    includeSystemMetrics: true,
    metricsInterval: 30000  // 30秒收集一次系统指标
  },
  
  // 上下文配置
  context: {
    autoInjectTraceId: true,
    autoInjectRequestId: true,
    includeSourceInfo: process.env.NODE_ENV === 'development'
  },
  
  // 过滤器
  filters: [
    // 过滤敏感信息
    (logEntry) => {
      if (logEntry.context?.password) {
        logEntry.context.password = '[REDACTED]';
      }
      if (logEntry.context?.creditCard) {
        logEntry.context.creditCard = '[REDACTED]';
      }
      return logEntry;
    }
  ],
  
  // 错误处理
  onError: (error) => {
    console.error('Logger error:', error);
  }
});
```

### 中间件集成

```typescript
import { createLoggerMiddleware } from '@sker/logger';

// Express中间件
const loggerMiddleware = createLoggerMiddleware({
  logger,
  includeRequest: true,
  includeResponse: true,
  sensitiveFields: ['password', 'token', 'authorization']
});

app.use(loggerMiddleware);

// Koa中间件
const koaLoggerMiddleware = createKoaLoggerMiddleware({
  logger,
  logRequests: true,
  logResponses: true,
  logErrors: true
});

app.use(koaLoggerMiddleware);

// gRPC拦截器
const grpcInterceptor = createGrpcLoggerInterceptor({
  logger,
  logCalls: true,
  logResults: true,
  logErrors: true
});

server.addService(UserService, userServiceImpl, grpcInterceptor);
```

## 日志级别和过滤

### 动态日志级别

```typescript
import { Logger, LogLevel } from '@sker/logger';

const logger = new Logger({ name: 'dynamic-logger' });

// 动态设置日志级别
logger.setLevel(LogLevel.DEBUG);

// 检查日志级别
if (logger.isLevelEnabled(LogLevel.DEBUG)) {
  logger.debug('调试信息', { details: expensiveDebuggingInfo() });
}

// 为特定模块设置不同级别
logger.setLevel(LogLevel.WARN, 'database');  // 数据库相关日志只记录警告以上
logger.setLevel(LogLevel.DEBUG, 'auth');     // 认证相关日志记录调试信息

// 使用模块化日志记录
const dbLogger = logger.child({ module: 'database' });
const authLogger = logger.child({ module: 'auth' });

dbLogger.debug('数据库查询');  // 不会输出 (级别为WARN)
authLogger.debug('认证检查'); // 会输出 (级别为DEBUG)
```

### 条件日志和过滤

```typescript
import { Logger, createFilter } from '@sker/logger';

// 创建条件过滤器
const sensitiveDataFilter = createFilter({
  condition: (entry) => entry.level >= LogLevel.WARN,
  transform: (entry) => {
    // 只在警告级别以上才记录敏感信息
    if (entry.context?.userId) {
      entry.context.userId = '[FILTERED]';
    }
    return entry;
  }
});

const logger = new Logger({
  name: 'filtered-logger',
  filters: [sensitiveDataFilter]
});

// 环境特定过滤
const productionFilter = createFilter({
  condition: () => process.env.NODE_ENV === 'production',
  transform: (entry) => {
    // 生产环境移除调试信息
    delete entry.metadata?.source_file;
    delete entry.metadata?.line_number;
    return entry;
  }
});
```

## 自定义输出适配器

### 创建自定义输出

```typescript
import { OutputAdapter, LogEntry } from '@sker/logger';

class SlackOutputAdapter implements OutputAdapter {
  private webhookUrl: string;
  
  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }
  
  async write(entry: LogEntry): Promise<void> {
    // 只有错误级别才发送到Slack
    if (entry.level < LogLevel.ERROR) {
      return;
    }
    
    const message = {
      text: `🚨 ${entry.service.name} Error`,
      attachments: [
        {
          color: 'danger',
          fields: [
            {
              title: 'Message',
              value: entry.message,
              short: false
            },
            {
              title: 'Service',
              value: `${entry.service.name}@${entry.service.version}`,
              short: true
            },
            {
              title: 'Time',
              value: entry.timestamp,
              short: true
            }
          ]
        }
      ]
    };
    
    await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    });
  }
  
  async close(): Promise<void> {
    // 清理资源
  }
}

// 使用自定义输出适配器
const logger = new Logger({
  name: 'slack-logger',
  outputs: [
    new SlackOutputAdapter(process.env.SLACK_WEBHOOK_URL)
  ]
});
```

### 批量输出适配器

```typescript
import { BatchOutputAdapter } from '@sker/logger';

class BatchElasticsearchAdapter extends BatchOutputAdapter {
  constructor(config: ElasticsearchConfig) {
    super({
      batchSize: 100,
      flushInterval: 5000,  // 5秒批量发送一次
      maxRetries: 3
    });
  }
  
  protected async writeBatch(entries: LogEntry[]): Promise<void> {
    const bulk = entries.flatMap(entry => [
      { index: { _index: 'app-logs', _type: '_doc' } },
      entry
    ]);
    
    await this.elasticsearch.bulk({ body: bulk });
  }
}
```

## 最佳实践

### 1. 结构化日志设计

```typescript
// 推荐：使用一致的日志结构
const logger = createLogger({ name: 'user-service' });

// 业务操作日志
logger.info('User operation completed', {
  operation: 'create_user',
  user_id: '12345',
  username: 'alice',
  duration_ms: 150,
  success: true
});

// API访问日志
logger.info('API request processed', {
  method: 'POST',
  path: '/api/v1/users',
  status_code: 201,
  response_time_ms: 120,
  user_id: '12345',
  ip_address: '192.168.1.100'
});

// 错误日志
logger.error('Database operation failed', {
  operation: 'insert_user',
  table: 'users',
  error_code: 'connection_timeout',
  error_message: 'Connection timed out after 30 seconds',
  retry_count: 3,
  user_id: '12345'
});
```

### 2. 上下文传播

```typescript
// 推荐：使用上下文传播
import { AsyncLocalStorage } from 'async_hooks';
import { Logger } from '@sker/logger';

const requestContext = new AsyncLocalStorage();
const logger = new Logger({
  name: 'context-logger',
  contextProvider: () => requestContext.getStore()
});

// 在请求处理中设置上下文
app.use((req, res, next) => {
  const context = {
    requestId: req.headers['x-request-id'] || generateUUID(),
    userId: req.user?.id,
    traceId: req.headers['x-trace-id']
  };
  
  requestContext.run(context, () => {
    next();
  });
});

// 后续所有日志都会自动包含上下文信息
logger.info('Processing request');  // 自动包含 requestId, userId, traceId
```

### 3. 性能优化

```typescript
// 推荐：使用异步日志记录
const logger = new Logger({
  name: 'async-logger',
  async: true,              // 异步写入
  bufferSize: 1000,         // 缓冲区大小
  flushInterval: 1000       // 1秒刷新一次
});

// 推荐：避免在高频路径记录详细日志
const isDebugEnabled = logger.isLevelEnabled(LogLevel.DEBUG);

function processHighFrequencyOperation(data: any) {
  if (isDebugEnabled) {
    logger.debug('Processing data', { data });
  }
  
  // 处理逻辑
  const result = process(data);
  
  // 只记录重要事件
  if (result.hasError) {
    logger.warn('Processing completed with warnings', {
      warnings: result.warnings.length,
      data_size: data.length
    });
  }
  
  return result;
}
```

### 4. 错误处理和监控

```typescript
// 推荐：集成错误监控
const logger = new Logger({
  name: 'monitored-logger',
  errorReporting: {
    enabled: true,
    service: 'sentry',  // 或其他错误监控服务
    config: {
      dsn: process.env.SENTRY_DSN
    }
  }
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  logger.fatal('Uncaught exception', {
    error: error.message,
    stack: error.stack,
    pid: process.pid
  });
  
  // 确保日志写入后退出
  logger.flush().then(() => {
    process.exit(1);
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', {
    reason: reason?.toString(),
    promise: promise?.toString()
  });
});
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/logger)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的统一日志系统包。更多信息请访问 [Sker官网](https://sker.dev)