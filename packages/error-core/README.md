# @sker/error-core

Sker错误处理核心包，提供统一错误处理机制和标准错误码体系。

## 概述

`@sker/error-core` 是Sker通信框架的错误处理核心包，实现了跨语言跨进程跨端通信标准中定义的统一错误处理和状态管理标准。该包提供标准化的错误码体系、异常处理机制、错误传播和恢复策略。

## 功能特性

### 🔢 标准错误码体系
- **分层错误码**: 系统级、业务级、集成级、安全级四层错误分类
- **错误码格式**: {Category}{SubCategory}{SpecificError} 6位数字格式
- **跨语言兼容**: 支持多种编程语言的错误码映射
- **版本兼容**: 向后兼容的错误码演进机制

### ⚡ 异常处理机制
- **统一异常类**: 标准化的异常类定义和继承体系
- **错误包装**: 原始错误的包装和上下文增强
- **异常链**: 支持异常传播链和因果关系追踪
- **堆栈跟踪**: 详细的调用栈信息记录

### 🔄 错误恢复策略
- **重试机制**: 指数退避、线性退避等多种重试策略
- **熔断器**: 自动熔断和恢复机制
- **降级处理**: 服务降级和fallback策略
- **错误转换**: 错误类型转换和适配

### 📊 错误监控集成
- **错误收集**: 自动错误收集和上报
- **指标统计**: 错误频率、类型等统计分析
- **告警通知**: 基于规则的错误告警
- **可视化**: 错误趋势和分布可视化

## 安装

```bash
npm install @sker/error-core
# 或者
pnpm add @sker/error-core
# 或者
yarn add @sker/error-core
```

## 基础用法

### 标准错误类

```typescript
import { 
  SkerError, 
  BusinessError, 
  SystemError,
  IntegrationError,
  SecurityError 
} from '@sker/error-core';

// 创建业务错误
const userError = new BusinessError({
  code: '201001',
  message: '用户不存在',
  details: [
    {
      field: 'userId',
      error_code: 'INVALID_VALUE',
      error_message: '提供的用户ID无效',
      context: { provided_value: 'invalid_123' }
    }
  ],
  context: {
    userId: 'invalid_123',
    operation: 'getUserById'
  }
});

// 创建系统错误
const systemError = new SystemError({
  code: '100002',
  message: '服务不可用',
  originalError: connectionError,
  context: {
    service: 'database',
    timeout: 30000
  }
});

// 创建安全错误
const securityError = new SecurityError({
  code: '400001',
  message: '认证失败',
  context: {
    userId: 'user123',
    ipAddress: '192.168.1.100',
    userAgent: 'Mozilla/5.0...'
  }
});
```

### 错误码常量

```typescript
import { 
  ERROR_CODES,
  isBusinessError,
  isSystemError,
  getErrorCategory 
} from '@sker/error-core';

// 使用预定义错误码
throw new BusinessError({
  code: ERROR_CODES.USER_NOT_FOUND,
  message: '用户不存在',
  context: { userId }
});

// 错误分类检查
function handleError(error: SkerError) {
  if (isBusinessError(error)) {
    // 业务错误处理
    return handleBusinessError(error);
  }
  
  if (isSystemError(error)) {
    // 系统错误处理
    return handleSystemError(error);
  }
  
  // 获取错误分类
  const category = getErrorCategory(error.code);
  logger.error(`${category} error occurred`, { error });
}
```

### 错误响应格式

```typescript
import { createErrorResponse, ErrorResponse } from '@sker/error-core';

// 创建标准错误响应
const errorResponse: ErrorResponse = createErrorResponse({
  code: '201001',
  message: '用户不存在',
  details: [
    {
      field: 'userId',
      error_code: 'INVALID_VALUE',
      error_message: '用户ID格式错误'
    }
  ],
  traceId: 'trace-123',
  requestId: 'req-456'
});

// API响应使用
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  if (error instanceof SkerError) {
    const errorResponse = error.toResponse();
    res.status(error.httpStatusCode).json(errorResponse);
  } else {
    // 包装未知错误
    const wrappedError = new SystemError({
      code: '100001',
      message: '系统内部错误',
      originalError: error
    });
    
    res.status(500).json(wrappedError.toResponse());
  }
});
```

## 高级用法

### 错误处理装饰器

```typescript
import { 
  HandleErrors, 
  RetryOnError,
  CircuitBreaker 
} from '@sker/error-core';

class UserService {
  // 错误处理装饰器
  @HandleErrors({
    onError: (error) => logger.error('User operation failed', { error }),
    rethrow: true
  })
  async getUser(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new BusinessError({
        code: ERROR_CODES.USER_NOT_FOUND,
        message: `用户不存在: ${userId}`,
        context: { userId }
      });
    }
    return user;
  }
  
  // 重试装饰器
  @RetryOnError({
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential',
    retryCondition: (error) => error instanceof IntegrationError
  })
  async syncUserWithExternalService(user: User): Promise<void> {
    try {
      await externalApiClient.syncUser(user);
    } catch (error) {
      throw new IntegrationError({
        code: ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE,
        message: '外部服务同步失败',
        originalError: error,
        context: { userId: user.id }
      });
    }
  }
  
  // 熔断器装饰器
  @CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 60000,
    monitoringPeriod: 10000
  })
  async callExternalAPI(data: any): Promise<any> {
    return await externalApiClient.call(data);
  }
}
```

### 错误恢复策略

```typescript
import { 
  ErrorRecoveryStrategy,
  RetryStrategy,
  FallbackStrategy,
  CircuitBreakerStrategy 
} from '@sker/error-core';

// 重试策略
const retryStrategy = new RetryStrategy({
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  jitter: true,
  retryCondition: (error, attempt) => {
    // 只对临时错误进行重试
    return error instanceof IntegrationError && attempt < 3;
  }
});

// 降级策略
const fallbackStrategy = new FallbackStrategy({
  fallback: async (error, context) => {
    // 返回缓存数据或默认值
    logger.warn('使用降级策略', { error, context });
    return await getCachedData(context.key);
  },
  condition: (error) => error instanceof IntegrationError
});

// 熔断器策略
const circuitBreakerStrategy = new CircuitBreakerStrategy({
  failureThreshold: 5,
  resetTimeout: 60000,
  halfOpenMaxCalls: 3,
  onStateChange: (state) => {
    logger.info('熔断器状态变更', { state });
  }
});

// 组合策略
const recoveryStrategy = new ErrorRecoveryStrategy([
  retryStrategy,
  fallbackStrategy,
  circuitBreakerStrategy
]);

// 应用恢复策略
async function robustOperation(data: any) {
  return await recoveryStrategy.execute(async () => {
    return await riskyOperation(data);
  });
}
```

### 错误传播和上下文

```typescript
import { 
  ErrorContext,
  ErrorPropagator,
  withErrorContext 
} from '@sker/error-core';

// 错误上下文传播
const errorPropagator = new ErrorPropagator({
  includeStackTrace: true,
  includeContext: true,
  maxContextDepth: 5
});

// 在错误上下文中执行
async function processOrder(orderId: string) {
  return await withErrorContext({
    operation: 'process_order',
    orderId: orderId,
    userId: getCurrentUserId(),
    traceId: getCurrentTraceId()
  }, async () => {
    try {
      // 验证订单
      const order = await validateOrder(orderId);
      
      // 处理支付
      const payment = await processPayment(order);
      
      // 更新库存
      await updateInventory(order);
      
      return { order, payment };
    } catch (error) {
      // 错误自动包含上下文信息
      throw errorPropagator.propagate(error, {
        step: 'order_processing',
        additionalContext: { orderTotal: order?.total }
      });
    }
  });
}
```

### 自定义错误类

```typescript
import { SkerError, ErrorOptions } from '@sker/error-core';

// 创建自定义错误类
class ValidationError extends SkerError {
  public readonly validationErrors: ValidationDetail[];
  
  constructor(options: ErrorOptions & { validationErrors: ValidationDetail[] }) {
    super({
      ...options,
      code: options.code || '200001',
      httpStatusCode: 400
    });
    
    this.validationErrors = options.validationErrors;
    this.name = 'ValidationError';
  }
  
  toResponse() {
    const baseResponse = super.toResponse();
    return {
      ...baseResponse,
      error: {
        ...baseResponse.error,
        validation_errors: this.validationErrors
      }
    };
  }
}

interface ValidationDetail {
  field: string;
  rule: string;
  message: string;
  value?: any;
}

// 使用自定义错误类
function validateUserData(userData: any) {
  const errors: ValidationDetail[] = [];
  
  if (!userData.email) {
    errors.push({
      field: 'email',
      rule: 'required',
      message: '邮箱地址必填'
    });
  } else if (!isValidEmail(userData.email)) {
    errors.push({
      field: 'email',
      rule: 'format',
      message: '邮箱格式不正确',
      value: userData.email
    });
  }
  
  if (errors.length > 0) {
    throw new ValidationError({
      message: '用户数据验证失败',
      validationErrors: errors,
      context: { userData }
    });
  }
}
```

## 错误监控和告警

### 错误收集器

```typescript
import { 
  ErrorCollector,
  ErrorMetrics,
  ErrorAlerting 
} from '@sker/error-core';

// 配置错误收集器
const errorCollector = new ErrorCollector({
  // 错误采样率
  samplingRate: 1.0,
  
  // 过滤器
  filters: [
    // 过滤掉预期的业务错误
    (error) => !(error instanceof BusinessError && error.code === '201001')
  ],
  
  // 上报器
  reporters: [
    {
      type: 'sentry',
      config: {
        dsn: process.env.SENTRY_DSN
      }
    },
    {
      type: 'elasticsearch',
      config: {
        host: process.env.ES_HOST,
        index: 'error-logs'
      }
    }
  ],
  
  // 错误增强
  enrichers: [
    (error, context) => {
      // 添加用户信息
      if (context.userId) {
        error.context.user = await getUserInfo(context.userId);
      }
      return error;
    }
  ]
});

// 全局错误处理
process.on('uncaughtException', (error) => {
  errorCollector.collect(error, {
    source: 'uncaughtException',
    fatal: true
  });
});

process.on('unhandledRejection', (reason, promise) => {
  errorCollector.collect(reason, {
    source: 'unhandledRejection',
    promise: promise.toString()
  });
});
```

### 错误指标和告警

```typescript
import { ErrorMetrics, AlertingRule } from '@sker/error-core';

// 错误指标收集
const errorMetrics = new ErrorMetrics({
  // 指标收集间隔
  collectionInterval: 60000, // 1分钟
  
  // 指标维度
  dimensions: ['service', 'operation', 'error_code', 'error_category'],
  
  // 指标计算
  metrics: [
    'error_count',
    'error_rate',
    'error_distribution',
    'avg_error_recovery_time'
  ]
});

// 告警规则
const alertingRules: AlertingRule[] = [
  {
    name: 'high_error_rate',
    condition: 'error_rate > 0.05', // 错误率超过5%
    duration: '5m',
    labels: { severity: 'warning' },
    annotations: {
      summary: '服务错误率过高',
      description: '{{ $labels.service }} 服务在过去5分钟内错误率超过5%'
    }
  },
  {
    name: 'critical_error_spike',
    condition: 'increase(error_count[1m]) > 100', // 1分钟内错误数增加100+
    duration: '1m',
    labels: { severity: 'critical' },
    annotations: {
      summary: '严重错误激增',
      description: '{{ $labels.service }} 服务出现严重错误激增'
    }
  }
];

// 告警通知
const alerting = new ErrorAlerting({
  rules: alertingRules,
  notifiers: [
    {
      type: 'slack',
      webhook: process.env.SLACK_WEBHOOK,
      channel: '#alerts'
    },
    {
      type: 'email',
      smtp: process.env.SMTP_CONFIG,
      recipients: ['ops@company.com']
    }
  ]
});
```

## 测试工具

### 错误测试辅助

```typescript
import { 
  ErrorTestHelper,
  MockErrorProvider,
  ErrorAssertions 
} from '@sker/error-core';

describe('UserService', () => {
  const errorTestHelper = new ErrorTestHelper();
  
  beforeEach(() => {
    errorTestHelper.reset();
  });
  
  it('should handle user not found error', async () => {
    // 模拟错误
    const mockError = new BusinessError({
      code: ERROR_CODES.USER_NOT_FOUND,
      message: '用户不存在'
    });
    
    jest.spyOn(userRepository, 'findById')
        .mockRejectedValue(mockError);
    
    // 测试错误处理
    await expect(userService.getUser('invalid-id'))
      .rejects
      .toThrowSkerError(ERROR_CODES.USER_NOT_FOUND);
    
    // 验证错误收集
    expect(errorTestHelper.getCollectedErrors()).toHaveLength(1);
    expect(errorTestHelper.getCollectedErrors()[0])
      .toMatchErrorPattern({
        code: ERROR_CODES.USER_NOT_FOUND,
        category: 'business'
      });
  });
  
  it('should retry on integration error', async () => {
    const retryError = new IntegrationError({
      code: ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE,
      message: '外部服务不可用'
    });
    
    jest.spyOn(externalClient, 'call')
        .mockRejectedValueOnce(retryError)
        .mockRejectedValueOnce(retryError)
        .mockResolvedValue({ success: true });
    
    const result = await userService.syncWithExternal(userData);
    
    expect(result).toEqual({ success: true });
    expect(externalClient.call).toHaveBeenCalledTimes(3);
  });
});

// 自定义错误断言
expect.extend({
  toThrowSkerError(received, expectedCode) {
    const error = received instanceof SkerError;
    const codeMatch = error && received.code === expectedCode;
    
    return {
      message: () => 
        `Expected ${received} to be SkerError with code ${expectedCode}`,
      pass: error && codeMatch
    };
  }
});
```

## 配置示例

### 完整配置

```typescript
import { configureErrorHandling } from '@sker/error-core';

configureErrorHandling({
  // 全局错误处理配置
  global: {
    // 是否包含堆栈跟踪
    includeStackTrace: process.env.NODE_ENV !== 'production',
    
    // 错误上下文深度
    maxContextDepth: 5,
    
    // 敏感字段过滤
    sensitiveFields: ['password', 'token', 'creditCard'],
    
    // 默认HTTP状态码映射
    httpStatusMapping: {
      business: 400,
      system: 500,
      integration: 502,
      security: 401
    }
  },
  
  // 重试配置
  retry: {
    defaultMaxAttempts: 3,
    defaultInitialDelay: 1000,
    defaultBackoffMultiplier: 2,
    defaultMaxDelay: 30000
  },
  
  // 熔断器配置
  circuitBreaker: {
    defaultFailureThreshold: 5,
    defaultResetTimeout: 60000,
    defaultMonitoringPeriod: 10000
  },
  
  // 错误收集配置
  collection: {
    enabled: true,
    samplingRate: 1.0,
    batchSize: 100,
    flushInterval: 5000
  },
  
  // 监控配置
  monitoring: {
    enabled: true,
    metricsInterval: 30000,
    alertingEnabled: process.env.NODE_ENV === 'production'
  }
});
```

## 最佳实践

### 1. 错误分类和编码

```typescript
// 推荐：使用清晰的错误分类
class UserService {
  async getUser(userId: string): Promise<User> {
    // 输入验证错误 - 业务级
    if (!userId || typeof userId !== 'string') {
      throw new BusinessError({
        code: ERROR_CODES.INVALID_INPUT,
        message: '无效的用户ID',
        context: { userId }
      });
    }
    
    try {
      const user = await this.userRepository.findById(userId);
      
      // 业务规则错误 - 业务级
      if (!user) {
        throw new BusinessError({
          code: ERROR_CODES.USER_NOT_FOUND,
          message: '用户不存在',
          context: { userId }
        });
      }
      
      return user;
    } catch (error) {
      // 基础设施错误 - 系统级
      if (error.code === 'ECONNREFUSED') {
        throw new SystemError({
          code: ERROR_CODES.DATABASE_CONNECTION_FAILED,
          message: '数据库连接失败',
          originalError: error,
          context: { userId }
        });
      }
      
      throw error;
    }
  }
}
```

### 2. 错误恢复和降级

```typescript
// 推荐：实现多层错误恢复
class RecommendationService {
  @RetryOnError({ maxAttempts: 3 })
  @FallbackOnError(this.getCachedRecommendations)
  async getRecommendations(userId: string): Promise<Recommendation[]> {
    try {
      // 尝试从ML服务获取推荐
      return await this.mlService.getRecommendations(userId);
    } catch (error) {
      if (error instanceof IntegrationError) {
        // 降级到基于规则的推荐
        logger.warn('ML服务不可用，使用基于规则的推荐', { userId, error });
        return await this.getRuleBasedRecommendations(userId);
      }
      throw error;
    }
  }
  
  private async getCachedRecommendations(userId: string): Promise<Recommendation[]> {
    const cached = await this.cache.get(`recommendations:${userId}`);
    if (cached) {
      return cached;
    }
    
    // 最后的降级策略：返回热门推荐
    return await this.getPopularRecommendations();
  }
}
```

### 3. 错误监控和告警

```typescript
// 推荐：实现细粒度的错误监控
class OrderService {
  private errorCollector = new ErrorCollector({
    context: {
      service: 'order-service',
      version: '1.0.0'
    }
  });
  
  async processOrder(orderData: any): Promise<Order> {
    const startTime = Date.now();
    const orderId = orderData.id;
    
    try {
      const order = await this.createOrder(orderData);
      
      // 记录成功指标
      this.recordMetric('order_processed', 1, {
        status: 'success',
        duration: Date.now() - startTime
      });
      
      return order;
    } catch (error) {
      // 错误分类和上报
      const errorCategory = getErrorCategory(error);
      const errorCode = error instanceof SkerError ? error.code : 'unknown';
      
      this.errorCollector.collect(error, {
        operation: 'process_order',
        orderId,
        duration: Date.now() - startTime,
        category: errorCategory
      });
      
      // 记录错误指标
      this.recordMetric('order_processing_errors', 1, {
        error_code: errorCode,
        error_category: errorCategory
      });
      
      throw error;
    }
  }
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/error-core)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的错误处理核心包。更多信息请访问 [Sker官网](https://sker.dev)