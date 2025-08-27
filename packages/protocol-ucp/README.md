# @sker/protocol-ucp

Sker统一通信协议(UCP)实现包，提供跨语言跨进程跨端通信的统一协议抽象层。

## 概述

`@sker/protocol-ucp` 是Sker通信框架的核心协议包，实现了跨语言跨进程跨端通信标准中定义的统一通信协议(Unified Communication Protocol, UCP)。该包提供了一个统一的协议抽象层，支持多种通信模式和传输协议的无缝切换。

## 功能特性

### 🔄 统一协议抽象
- **协议无关性**: 统一的API接口，支持多种底层协议
- **动态协议选择**: 根据场景自动选择最优协议
- **协议热切换**: 运行时动态切换通信协议
- **协议兼容性**: 向后兼容的协议版本管理

### 📡 多协议支持
- **同步通信**: gRPC、HTTP/REST、JSON-RPC
- **异步消息**: Kafka、RabbitMQ、Pulsar、Redis Streams
- **实时流**: WebSocket、SSE、gRPC Streaming
- **P2P通信**: WebRTC、UDP、TCP直连

### 🚀 高性能传输
- **连接池管理**: 智能连接复用和负载均衡
- **多路复用**: 单连接多请求并发处理
- **压缩传输**: 多种数据压缩算法支持
- **流量控制**: 自适应流量控制和背压处理

### 🛡️ 可靠性保证
- **重试机制**: 指数退避重试策略
- **熔断保护**: 自动熔断和服务降级
- **健康检查**: 连接健康状态监控
- **故障转移**: 自动故障检测和切换

### 🔐 安全通信
- **端到端加密**: TLS/SSL加密传输
- **身份认证**: 多种认证机制支持
- **访问控制**: 基于角色的访问控制
- **审计日志**: 完整的通信审计记录

## 安装

```bash
npm install @sker/protocol-ucp
# 或者
pnpm add @sker/protocol-ucp
# 或者
yarn add @sker/protocol-ucp
```

## 基础用法

### 初始化UCP管理器

```typescript
import { UCPManager, ProtocolType } from '@sker/protocol-ucp';

// 创建UCP管理器
const ucpManager = new UCPManager({
  // 服务配置
  service: {
    name: 'user-service',
    version: '1.0.0',
    instance: 'user-service-001'
  },
  
  // 协议配置
  protocols: {
    // gRPC配置
    grpc: {
      enabled: true,
      host: '0.0.0.0',
      port: 50051,
      maxConnections: 100,
      keepAlive: true
    },
    
    // HTTP配置
    http: {
      enabled: true,
      host: '0.0.0.0',
      port: 3000,
      cors: true,
      compression: 'gzip'
    },
    
    // WebSocket配置
    websocket: {
      enabled: true,
      port: 8080,
      heartbeat: 30000
    }
  },
  
  // 负载均衡配置
  loadBalancer: {
    strategy: 'round_robin',
    healthCheck: {
      enabled: true,
      interval: 5000
    }
  }
});

// 启动UCP管理器
await ucpManager.start();
```

### 客户端通信

```typescript
import { UCPClient, createProtocolClient } from '@sker/protocol-ucp';

// 创建协议客户端
const client = createProtocolClient({
  protocol: ProtocolType.GRPC,
  target: 'localhost:50051',
  options: {
    retry: {
      maxAttempts: 3,
      backoff: 'exponential'
    },
    timeout: 30000
  }
});

// 同步RPC调用
const result = await client.call('UserService', 'GetUser', {
  userId: '12345'
});

console.log('用户信息:', result);

// 流式调用
const stream = client.stream('UserService', 'GetUserEvents', {
  userId: '12345'
});

stream.on('data', (event) => {
  console.log('用户事件:', event);
});

stream.on('end', () => {
  console.log('流结束');
});
```

### 服务端实现

```typescript
import { UCPServer, ProtocolHandler } from '@sker/protocol-ucp';

// 创建协议处理器
const userHandler: ProtocolHandler = {
  // 处理GetUser请求
  async GetUser(request, context) {
    const { userId } = request;
    
    // 业务逻辑
    const user = await userService.findById(userId);
    
    if (!user) {
      throw new BusinessError({
        code: 'USER_NOT_FOUND',
        message: `用户不存在: ${userId}`
      });
    }
    
    return {
      success: true,
      data: user
    };
  },
  
  // 处理流式请求
  async *GetUserEvents(request, context) {
    const { userId } = request;
    
    // 订阅用户事件
    const eventStream = await userEventService.subscribe(userId);
    
    for await (const event of eventStream) {
      yield {
        event_type: event.type,
        event_data: event.data,
        timestamp: event.timestamp
      };
    }
  }
};

// 注册处理器
ucpManager.registerHandler('UserService', userHandler);
```

## 高级用法

### 协议选择策略

```typescript
import { ProtocolSelector, SelectionStrategy } from '@sker/protocol-ucp';

// 自定义协议选择策略
const selector = new ProtocolSelector({
  strategy: SelectionStrategy.ADAPTIVE,
  
  // 协议优先级
  priorities: [
    {
      protocol: ProtocolType.GRPC,
      conditions: ['high_performance', 'streaming'],
      weight: 0.8
    },
    {
      protocol: ProtocolType.HTTP,
      conditions: ['web_client', 'rest_api'],
      weight: 0.6
    },
    {
      protocol: ProtocolType.WEBSOCKET,
      conditions: ['real_time', 'bidirectional'],
      weight: 0.7
    }
  ],
  
  // 性能指标权重
  metrics: {
    latency: 0.4,
    throughput: 0.3,
    reliability: 0.3
  }
});

// 根据上下文选择最优协议
const bestProtocol = await selector.selectProtocol({
  service: 'UserService',
  method: 'GetUser',
  clientType: 'web',
  payloadSize: 1024,
  requiresStreaming: false
});

console.log('选择的协议:', bestProtocol);
```

### 连接池管理

```typescript
import { ConnectionPoolManager, PoolConfig } from '@sker/protocol-ucp';

// 连接池配置
const poolConfig: PoolConfig = {
  // 每个目标的最大连接数
  maxConnectionsPerTarget: 10,
  
  // 连接空闲超时
  idleTimeout: 60000,
  
  // 连接验证
  validation: {
    enabled: true,
    interval: 30000
  },
  
  // 负载均衡
  loadBalancing: {
    strategy: 'least_connections',
    healthCheck: true
  }
};

const poolManager = new ConnectionPoolManager(poolConfig);

// 获取连接
const connection = await poolManager.getConnection({
  protocol: ProtocolType.GRPC,
  target: 'user-service:50051'
});

// 使用连接
try {
  const result = await connection.call('GetUser', { userId: '12345' });
  console.log(result);
} finally {
  // 归还连接到池
  poolManager.returnConnection(connection);
}
```

### 协议适配器

```typescript
import { ProtocolAdapter, AdapterConfig } from '@sker/protocol-ucp';

// 创建HTTP协议适配器
class HttpProtocolAdapter extends ProtocolAdapter {
  constructor(config: AdapterConfig) {
    super(config);
  }
  
  async connect(target: string): Promise<Connection> {
    // HTTP连接实现
    const connection = new HttpConnection({
      baseURL: target,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Sker-UCP/1.0'
      }
    });
    
    await connection.initialize();
    return connection;
  }
  
  async call(connection: Connection, service: string, method: string, data: any): Promise<any> {
    const endpoint = `/${service}/${method}`;
    
    try {
      const response = await connection.post(endpoint, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }
  
  async stream(connection: Connection, service: string, method: string, data: any): AsyncIterableIterator<any> {
    const endpoint = `/${service}/${method}/stream`;
    
    const stream = connection.postStream(endpoint, data);
    
    for await (const chunk of stream) {
      yield JSON.parse(chunk);
    }
  }
}

// 注册自定义适配器
ucpManager.registerAdapter(ProtocolType.HTTP, new HttpProtocolAdapter({
  timeout: 30000,
  retries: 3
}));
```

### 中间件支持

```typescript
import { ProtocolMiddleware, MiddlewareContext } from '@sker/protocol-ucp';

// 认证中间件
const authMiddleware: ProtocolMiddleware = async (context: MiddlewareContext, next) => {
  // 检查认证
  const token = context.headers['authorization'];
  if (!token) {
    throw new SecurityError({
      code: 'AUTHENTICATION_REQUIRED',
      message: '需要认证'
    });
  }
  
  try {
    const user = await authService.validateToken(token);
    context.user = user;
  } catch (error) {
    throw new SecurityError({
      code: 'INVALID_TOKEN',
      message: '无效的认证令牌'
    });
  }
  
  return await next();
};

// 日志中间件
const loggingMiddleware: ProtocolMiddleware = async (context: MiddlewareContext, next) => {
  const startTime = Date.now();
  
  logger.info('请求开始', {
    service: context.service,
    method: context.method,
    protocol: context.protocol,
    clientId: context.clientId
  });
  
  try {
    const result = await next();
    
    logger.info('请求完成', {
      service: context.service,
      method: context.method,
      duration: Date.now() - startTime,
      success: true
    });
    
    return result;
  } catch (error) {
    logger.error('请求失败', {
      service: context.service,
      method: context.method,
      duration: Date.now() - startTime,
      error: error.message
    });
    
    throw error;
  }
};

// 应用中间件
ucpManager.use(authMiddleware);
ucpManager.use(loggingMiddleware);
```

### 服务发现集成

```typescript
import { ServiceDiscovery, RegistryConfig } from '@sker/protocol-ucp';

// 服务注册配置
const registryConfig: RegistryConfig = {
  type: 'consul',
  address: 'localhost:8500',
  
  // 服务信息
  service: {
    name: 'user-service',
    version: '1.0.0',
    tags: ['user', 'auth', 'profile'],
    meta: {
      protocol: 'grpc',
      health_check: '/health'
    }
  },
  
  // 健康检查
  healthCheck: {
    http: 'http://localhost:3000/health',
    interval: '10s',
    timeout: '3s'
  }
};

const serviceDiscovery = new ServiceDiscovery(registryConfig);

// 服务注册
await serviceDiscovery.register({
  id: 'user-service-001',
  name: 'user-service',
  address: 'localhost',
  port: 50051,
  protocols: ['grpc', 'http']
});

// 服务发现
const services = await serviceDiscovery.discover('user-service');
console.log('发现的服务:', services);

// 集成到UCP管理器
ucpManager.setServiceDiscovery(serviceDiscovery);
```

### 性能监控

```typescript
import { PerformanceMonitor, MetricsCollector } from '@sker/protocol-ucp';

// 性能监控配置
const monitor = new PerformanceMonitor({
  // 指标收集间隔
  collectInterval: 10000,
  
  // 启用的指标
  metrics: [
    'request_count',
    'request_duration',
    'error_rate',
    'connection_count',
    'throughput'
  ],
  
  // 告警规则
  alerts: [
    {
      metric: 'error_rate',
      threshold: 0.05,  // 5%错误率
      duration: '5m',
      action: 'log'
    },
    {
      metric: 'request_duration_p99',
      threshold: 1000,  // 1秒
      duration: '2m',
      action: 'alert'
    }
  ]
});

// 启动监控
ucpManager.setPerformanceMonitor(monitor);

// 自定义指标
const metricsCollector = new MetricsCollector();

metricsCollector.incrementCounter('custom_business_metric', {
  service: 'user-service',
  operation: 'create_user'
});

metricsCollector.recordHistogram('business_process_time', processingTime, {
  process_type: 'user_validation'
});
```

## 协议配置

### gRPC协议配置

```typescript
const grpcConfig = {
  // 服务器配置
  server: {
    host: '0.0.0.0',
    port: 50051,
    
    // 连接配置
    maxConnections: 1000,
    keepAlive: {
      enabled: true,
      time: 7200000,      // 2小时
      timeout: 20000,     // 20秒
      permitWithoutStream: true
    },
    
    // 消息限制
    maxReceiveMessageSize: 4 * 1024 * 1024,  // 4MB
    maxSendMessageSize: 4 * 1024 * 1024,     // 4MB
    
    // 压缩
    compression: 'gzip'
  },
  
  // 客户端配置
  client: {
    // 重试配置
    retry: {
      maxAttempts: 3,
      initialBackoff: '1s',
      maxBackoff: '10s',
      backoffMultiplier: 2
    },
    
    // 超时配置
    timeout: {
      request: 30000,     // 30秒
      connection: 5000    // 5秒
    }
  }
};
```

### HTTP协议配置

```typescript
const httpConfig = {
  // 服务器配置
  server: {
    host: '0.0.0.0',
    port: 3000,
    
    // 中间件
    cors: {
      enabled: true,
      origins: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      headers: ['Content-Type', 'Authorization']
    },
    
    // 压缩
    compression: {
      enabled: true,
      algorithm: 'gzip',
      level: 6
    },
    
    // 限流
    rateLimit: {
      enabled: true,
      windowMs: 60000,    // 1分钟
      maxRequests: 100    // 最大100个请求
    }
  },
  
  // 路由配置
  routing: {
    prefix: '/api/v1',
    caseSensitive: false,
    strictSlash: true
  }
};
```

### WebSocket配置

```typescript
const websocketConfig = {
  // 服务器配置
  server: {
    port: 8080,
    
    // 心跳配置
    heartbeat: {
      enabled: true,
      interval: 30000,    // 30秒
      timeout: 10000      // 10秒超时
    },
    
    // 连接限制
    maxConnections: 10000,
    maxMessageSize: 1024 * 1024,  // 1MB
    
    // 压缩
    compression: {
      enabled: true,
      threshold: 1024     // 大于1KB才压缩
    }
  },
  
  // 认证配置
  auth: {
    enabled: true,
    tokenHeader: 'Authorization',
    validateOnConnect: true
  }
};
```

## 错误处理

```typescript
import { ProtocolError, ErrorCode } from '@sker/protocol-ucp';

try {
  const result = await client.call('UserService', 'GetUser', {
    userId: 'invalid-id'
  });
} catch (error) {
  if (error instanceof ProtocolError) {
    switch (error.code) {
      case ErrorCode.CONNECTION_FAILED:
        logger.error('连接失败', { target: error.target, cause: error.cause });
        // 尝试备用服务
        break;
        
      case ErrorCode.TIMEOUT:
        logger.warn('请求超时', { service: error.service, method: error.method });
        // 重试逻辑
        break;
        
      case ErrorCode.SERVICE_UNAVAILABLE:
        logger.error('服务不可用', { service: error.service });
        // 熔断处理
        break;
        
      default:
        logger.error('协议错误', { error });
        break;
    }
  } else {
    logger.error('未知错误', { error });
  }
}
```

## 最佳实践

### 1. 协议选择建议

```typescript
// 根据使用场景选择合适的协议

// 高性能RPC - 推荐gRPC
const grpcClient = createProtocolClient({
  protocol: ProtocolType.GRPC,
  target: 'service:50051'
});

// Web API - 推荐HTTP
const httpClient = createProtocolClient({
  protocol: ProtocolType.HTTP,
  target: 'https://api.example.com'
});

// 实时通信 - 推荐WebSocket
const wsClient = createProtocolClient({
  protocol: ProtocolType.WEBSOCKET,
  target: 'wss://api.example.com/ws'
});

// 异步消息 - 推荐消息队列
const mqClient = createProtocolClient({
  protocol: ProtocolType.MESSAGE_QUEUE,
  target: 'amqp://localhost:5672'
});
```

### 2. 连接管理

```typescript
// 推荐：使用连接池管理连接
const poolManager = new ConnectionPoolManager({
  maxConnectionsPerTarget: 10,
  idleTimeout: 300000,  // 5分钟
  healthCheckInterval: 30000
});

// 推荐：优雅关闭
process.on('SIGTERM', async () => {
  logger.info('收到终止信号，开始优雅关闭...');
  
  // 停止接受新请求
  await ucpManager.stopAcceptingRequests();
  
  // 等待现有请求完成
  await ucpManager.drainConnections(30000);  // 30秒超时
  
  // 关闭所有连接
  await ucpManager.close();
  
  logger.info('服务已优雅关闭');
  process.exit(0);
});
```

### 3. 错误处理和重试

```typescript
// 推荐：实现智能重试策略
const retryableClient = createProtocolClient({
  protocol: ProtocolType.GRPC,
  target: 'service:50051',
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    retryCondition: (error) => {
      // 只对临时错误进行重试
      return error.code === ErrorCode.CONNECTION_FAILED ||
             error.code === ErrorCode.TIMEOUT ||
             error.code === ErrorCode.SERVICE_UNAVAILABLE;
    }
  }
});
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/protocol-ucp)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的统一通信协议包。更多信息请访问 [Sker官网](https://sker.dev)