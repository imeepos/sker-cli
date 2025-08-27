# @sker/protocol-grpc

Sker gRPC协议实现包，提供高性能双向流式RPC通信。

## 概述

`@sker/protocol-grpc` 是Sker通信框架的gRPC协议包，基于HTTP/2协议提供高性能、类型安全的远程过程调用(RPC)通信。该包实现了完整的gRPC规范，支持一元调用、服务端流、客户端流、双向流等多种通信模式，是构建现代微服务架构的理想选择。

## 功能特性

### 🚀 高性能通信
- **HTTP/2协议**: 基于HTTP/2的多路复用和流控制
- **二进制协议**: Protocol Buffers高效二进制序列化
- **连接复用**: 单连接多请求并发处理
- **流式处理**: 支持大数据流式传输

### 🔄 多种调用模式
- **一元RPC**: 传统请求-响应模式
- **服务端流**: 服务端向客户端推送数据流
- **客户端流**: 客户端向服务端发送数据流
- **双向流**: 客户端与服务端双向实时通信

### 🛡️ 企业级特性
- **负载均衡**: 多种负载均衡算法支持
- **健康检查**: 自动服务健康状态监控
- **熔断保护**: 自动故障检测和恢复
- **链路追踪**: 分布式调用链路追踪

### 🔐 安全通信
- **TLS加密**: 端到端传输层安全
- **身份认证**: 多种认证机制支持
- **访问控制**: 细粒度权限控制
- **审计日志**: 完整的调用审计记录

### 🔧 开发友好
- **自动代码生成**: 基于.proto文件生成客户端和服务端代码
- **类型安全**: 强类型接口定义
- **IDE支持**: 完整的智能提示和调试支持
- **测试工具**: 内置测试和mock工具

## 安装

```bash
npm install @sker/protocol-grpc
# 或者
pnpm add @sker/protocol-grpc
# 或者
yarn add @sker/protocol-grpc
```

## 基础用法

### 定义gRPC服务

```protobuf
// user_service.proto
syntax = "proto3";

package sker.example.user;

import "google/protobuf/timestamp.proto";
import "google/protobuf/empty.proto";

// 用户服务定义
service UserService {
  // 一元RPC：获取单个用户
  rpc GetUser(GetUserRequest) returns (User);
  
  // 一元RPC：创建用户
  rpc CreateUser(CreateUserRequest) returns (User);
  
  // 服务端流：获取用户列表
  rpc ListUsers(ListUsersRequest) returns (stream User);
  
  // 客户端流：批量创建用户
  rpc BatchCreateUsers(stream CreateUserRequest) returns (BatchCreateUsersResponse);
  
  // 双向流：用户消息聊天
  rpc UserChat(stream ChatMessage) returns (stream ChatMessage);
  
  // 服务端流：订阅用户事件
  rpc SubscribeUserEvents(SubscribeRequest) returns (stream UserEvent);
}

// 消息定义
message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
  UserProfile profile = 4;
  google.protobuf.Timestamp created_at = 5;
  google.protobuf.Timestamp updated_at = 6;
}

message UserProfile {
  string first_name = 1;
  string last_name = 2;
  int32 age = 3;
  string bio = 4;
  repeated string tags = 5;
}

message GetUserRequest {
  int64 user_id = 1;
}

message CreateUserRequest {
  string name = 1;
  string email = 2;
  UserProfile profile = 3;
}

message ListUsersRequest {
  int32 page_size = 1;
  string page_token = 2;
  string filter = 3;
}

message BatchCreateUsersResponse {
  repeated User users = 1;
  repeated string errors = 2;
}

message ChatMessage {
  int64 user_id = 1;
  string content = 2;
  google.protobuf.Timestamp timestamp = 3;
}

message UserEvent {
  string event_type = 1;
  int64 user_id = 2;
  string data = 3;
  google.protobuf.Timestamp timestamp = 4;
}

message SubscribeRequest {
  repeated int64 user_ids = 1;
  repeated string event_types = 2;
}
```

### 实现gRPC服务端

```typescript
import { GRPCServer, ServiceHandler, ServerConfig } from '@sker/protocol-grpc';
import { User, UserService, CreateUserRequest, GetUserRequest } from './generated/user_service';

// 实现用户服务
class UserServiceImpl implements ServiceHandler<UserService> {
  private users: Map<number, User> = new Map();
  private userIdCounter = 1;

  // 一元RPC：获取用户
  async GetUser(request: GetUserRequest): Promise<User> {
    const user = this.users.get(Number(request.userId));
    if (!user) {
      throw new Error(`User not found: ${request.userId}`);
    }
    return user;
  }

  // 一元RPC：创建用户
  async CreateUser(request: CreateUserRequest): Promise<User> {
    const user: User = {
      id: BigInt(this.userIdCounter++),
      name: request.name,
      email: request.email,
      profile: request.profile,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(Number(user.id), user);
    return user;
  }

  // 服务端流：列出用户
  async *ListUsers(request: ListUsersRequest): AsyncGenerator<User> {
    const pageSize = request.pageSize || 10;
    let count = 0;
    
    for (const user of this.users.values()) {
      if (count >= pageSize) break;
      
      // 应用过滤器
      if (request.filter && !user.name.includes(request.filter)) {
        continue;
      }
      
      yield user;
      count++;
    }
  }

  // 客户端流：批量创建用户
  async BatchCreateUsers(requestStream: AsyncIterable<CreateUserRequest>) {
    const createdUsers: User[] = [];
    const errors: string[] = [];

    for await (const request of requestStream) {
      try {
        const user = await this.CreateUser(request);
        createdUsers.push(user);
      } catch (error) {
        errors.push(`Failed to create user ${request.name}: ${error.message}`);
      }
    }

    return {
      users: createdUsers,
      errors
    };
  }

  // 双向流：用户聊天
  async *UserChat(messageStream: AsyncIterable<ChatMessage>): AsyncGenerator<ChatMessage> {
    // 简单的回声聊天实现
    for await (const message of messageStream) {
      // 处理消息（这里简单回显）
      const response: ChatMessage = {
        userId: message.userId,
        content: `Echo: ${message.content}`,
        timestamp: new Date()
      };
      
      yield response;
    }
  }

  // 服务端流：订阅用户事件
  async *SubscribeUserEvents(request: SubscribeRequest): AsyncGenerator<UserEvent> {
    // 实现事件订阅逻辑
    const eventEmitter = this.getEventEmitter();
    
    for (const userId of request.userIds) {
      eventEmitter.on(`user:${userId}`, (eventData) => {
        // 这里需要使用实际的事件流实现
        // 为了示例简化，直接yield事件
      });
    }
    
    // 发送初始事件
    yield {
      eventType: 'subscription_started',
      userId: request.userIds[0] || 0n,
      data: 'Subscription started',
      timestamp: new Date()
    };
  }

  private getEventEmitter() {
    // 返回事件发射器实例
    return globalEventEmitter;
  }
}

// 创建gRPC服务器
const serverConfig: ServerConfig = {
  // 服务器配置
  host: '0.0.0.0',
  port: 50051,
  
  // TLS配置
  tls: {
    enabled: true,
    keyFile: './certs/server.key',
    certFile: './certs/server.crt',
    caFile: './certs/ca.crt'
  },
  
  // 连接配置
  maxConnections: 1000,
  keepAlive: {
    enabled: true,
    time: 7200000,      // 2小时
    timeout: 20000,     // 20秒
    permitWithoutStream: true
  },
  
  // 消息大小限制
  maxReceiveMessageSize: 4 * 1024 * 1024,  // 4MB
  maxSendMessageSize: 4 * 1024 * 1024,     // 4MB
  
  // 压缩配置
  compression: {
    enabled: true,
    algorithms: ['gzip', 'deflate']
  },
  
  // 健康检查
  healthCheck: {
    enabled: true,
    services: ['UserService']
  }
};

// 启动服务器
const server = new GRPCServer(serverConfig);

// 注册服务实现
server.addService('UserService', new UserServiceImpl(), {
  // 中间件配置
  middleware: [
    'auth',           // 认证中间件
    'logging',        // 日志中间件  
    'metrics',        // 指标中间件
    'ratelimit'       // 限流中间件
  ],
  
  // 方法级配置
  methods: {
    GetUser: {
      timeout: 5000,          // 5秒超时
      retries: 3,             // 3次重试
      cache: { ttl: 60000 }   // 1分钟缓存
    },
    ListUsers: {
      timeout: 30000,         // 30秒超时
      streamingTimeout: 300000 // 5分钟流超时
    }
  }
});

// 启动服务器
await server.start();
console.log(`gRPC服务器运行在 ${serverConfig.host}:${serverConfig.port}`);

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭gRPC服务器...');
  await server.gracefulShutdown(5000);  // 5秒优雅关闭
  process.exit(0);
});
```

### 实现gRPC客户端

```typescript
import { GRPCClient, ClientConfig, LoadBalancer } from '@sker/protocol-grpc';
import { UserServiceClient } from './generated/user_service_grpc';

// 客户端配置
const clientConfig: ClientConfig = {
  // 目标服务器
  target: 'localhost:50051',
  
  // TLS配置
  tls: {
    enabled: true,
    caFile: './certs/ca.crt',
    verifyServerCert: true
  },
  
  // 连接配置
  keepAlive: {
    enabled: true,
    time: 30000,        // 30秒
    timeout: 5000,      // 5秒超时
    permitWithoutStream: false
  },
  
  // 重试配置
  retry: {
    maxAttempts: 3,
    initialBackoff: 1000,     // 1秒
    maxBackoff: 10000,        // 10秒
    backoffMultiplier: 2,
    retryableStatusCodes: ['UNAVAILABLE', 'DEADLINE_EXCEEDED']
  },
  
  // 负载均衡
  loadBalancer: {
    policy: 'round_robin',    // 'round_robin' | 'pick_first' | 'grpclb'
    targets: [
      'server1:50051',
      'server2:50051', 
      'server3:50051'
    ],
    
    // 健康检查
    healthCheck: {
      enabled: true,
      interval: 30000,        // 30秒检查间隔
      timeout: 5000          // 5秒超时
    }
  },
  
  // 请求配置
  defaultTimeout: 30000,      // 默认30秒超时
  maxReceiveMessageSize: 4 * 1024 * 1024,
  maxSendMessageSize: 4 * 1024 * 1024
};

// 创建客户端
const client = new GRPCClient(clientConfig);
const userService = client.getService<UserServiceClient>('UserService');

// 使用客户端进行各种类型的调用

// 1. 一元RPC调用
async function getUserExample() {
  try {
    const user = await userService.GetUser({
      userId: 12345n
    });
    console.log('获取用户成功:', user);
  } catch (error) {
    console.error('获取用户失败:', error);
  }
}

// 2. 创建用户
async function createUserExample() {
  const newUser = await userService.CreateUser({
    name: 'John Doe',
    email: 'john@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      age: 28,
      bio: 'Software Engineer',
      tags: ['developer', 'typescript']
    }
  });
  console.log('创建用户成功:', newUser);
}

// 3. 服务端流调用
async function listUsersExample() {
  const stream = userService.ListUsers({
    pageSize: 100,
    filter: 'engineer'
  });

  for await (const user of stream) {
    console.log('用户:', user.name, user.email);
  }
  console.log('用户列表获取完成');
}

// 4. 客户端流调用
async function batchCreateUsersExample() {
  const requests = [
    {
      name: 'Alice',
      email: 'alice@example.com',
      profile: { firstName: 'Alice', lastName: 'Smith', age: 25 }
    },
    {
      name: 'Bob', 
      email: 'bob@example.com',
      profile: { firstName: 'Bob', lastName: 'Johnson', age: 30 }
    }
  ];

  const response = await userService.BatchCreateUsers(async function* () {
    for (const request of requests) {
      yield request;
    }
  });

  console.log('批量创建结果:', {
    created: response.users.length,
    errors: response.errors.length
  });
}

// 5. 双向流调用
async function userChatExample() {
  const chatStream = userService.UserChat(async function* () {
    // 发送消息流
    yield {
      userId: 12345n,
      content: 'Hello, server!',
      timestamp: new Date()
    };
    
    yield {
      userId: 12345n,
      content: 'How are you?',
      timestamp: new Date()
    };
  });

  // 接收响应流
  for await (const response of chatStream) {
    console.log('收到消息:', response.content);
  }
}

// 6. 长连接事件订阅
async function subscribeUserEventsExample() {
  const eventStream = userService.SubscribeUserEvents({
    userIds: [12345n, 67890n],
    eventTypes: ['user_updated', 'user_deleted']
  });

  try {
    for await (const event of eventStream) {
      console.log('收到用户事件:', {
        type: event.eventType,
        userId: event.userId,
        data: event.data,
        timestamp: event.timestamp
      });
    }
  } catch (error) {
    console.error('事件订阅出错:', error);
  }
}

// 执行示例
async function runExamples() {
  await getUserExample();
  await createUserExample();
  await listUsersExample();
  await batchCreateUsersExample();
  await userChatExample();
  await subscribeUserEventsExample();
  
  // 关闭客户端
  await client.close();
}

runExamples().catch(console.error);
```

### 中间件系统

```typescript
import { ServerMiddleware, ClientMiddleware, MiddlewareContext } from '@sker/protocol-grpc';

// 服务端认证中间件
const authMiddleware: ServerMiddleware = async (context: MiddlewareContext, next) => {
  // 获取元数据中的认证信息
  const metadata = context.getMetadata();
  const token = metadata.get('authorization')?.[0];
  
  if (!token) {
    throw new Error('UNAUTHENTICATED: Missing authorization token');
  }
  
  try {
    // 验证JWT令牌
    const payload = await verifyJWT(token);
    context.setUser(payload);
  } catch (error) {
    throw new Error('UNAUTHENTICATED: Invalid token');
  }
  
  return await next();
};

// 服务端日志中间件
const loggingMiddleware: ServerMiddleware = async (context: MiddlewareContext, next) => {
  const startTime = Date.now();
  const { service, method, peer } = context;
  
  console.log(`[${new Date().toISOString()}] ${service}.${method} called by ${peer}`);
  
  try {
    const result = await next();
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${service}.${method} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ${service}.${method} failed in ${duration}ms:`, error);
    throw error;
  }
};

// 服务端指标中间件
const metricsMiddleware: ServerMiddleware = async (context: MiddlewareContext, next) => {
  const { service, method } = context;
  const startTime = process.hrtime.bigint();
  
  // 增加请求计数
  metrics.increment(`grpc.requests.total`, {
    service,
    method
  });
  
  try {
    const result = await next();
    
    // 记录成功指标
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000; // 转换为毫秒
    metrics.histogram(`grpc.request.duration`, duration, {
      service,
      method,
      status: 'success'
    });
    
    return result;
  } catch (error) {
    // 记录错误指标
    const duration = Number(process.hrtime.bigint() - startTime) / 1000000;
    metrics.histogram(`grpc.request.duration`, duration, {
      service,
      method,
      status: 'error'
    });
    
    metrics.increment(`grpc.errors.total`, {
      service,
      method,
      code: error.code || 'UNKNOWN'
    });
    
    throw error;
  }
};

// 客户端重试中间件
const retryMiddleware: ClientMiddleware = (options) => {
  const { maxAttempts = 3, backoffMultiplier = 2, initialBackoff = 1000 } = options;
  
  return async (context: MiddlewareContext, next) => {
    let lastError: Error;
    let backoff = initialBackoff;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error;
        
        // 检查是否应该重试
        if (attempt === maxAttempts || !isRetryableError(error)) {
          throw error;
        }
        
        // 等待退避时间
        await sleep(backoff);
        backoff *= backoffMultiplier;
        
        console.log(`Retry attempt ${attempt + 1}/${maxAttempts} for ${context.service}.${context.method}`);
      }
    }
    
    throw lastError;
  };
};

// 应用中间件到服务器
server.use([
  authMiddleware,
  loggingMiddleware,
  metricsMiddleware
]);

// 应用中间件到客户端
client.use([
  retryMiddleware({ maxAttempts: 3, initialBackoff: 1000 })
]);
```

### 服务发现和负载均衡

```typescript
import { ServiceDiscovery, LoadBalancer, HealthChecker } from '@sker/protocol-grpc';

// 配置服务发现
const serviceDiscovery = new ServiceDiscovery({
  // 使用Consul作为服务注册中心
  provider: 'consul',
  consul: {
    host: 'localhost',
    port: 8500,
    
    // 服务注册配置
    registration: {
      name: 'user-service',
      id: 'user-service-001',
      tags: ['grpc', 'user', 'v1'],
      address: 'localhost',
      port: 50051,
      
      // 健康检查配置
      check: {
        grpc: 'localhost:50051/health',
        interval: '10s',
        timeout: '3s'
      }
    }
  }
});

// 创建负载均衡器
const loadBalancer = new LoadBalancer({
  // 负载均衡策略
  policy: 'weighted_round_robin',
  
  // 健康检查
  healthChecker: new HealthChecker({
    interval: 30000,      // 30秒检查间隔
    timeout: 5000,        // 5秒超时
    unhealthyThreshold: 3, // 连续3次失败标记为不健康
    healthyThreshold: 2    // 连续2次成功标记为健康
  }),
  
  // 熔断器配置
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,    // 失败阈值
    recoveryTimeout: 30000, // 30秒恢复时间
    monitoringPeriod: 10000 // 10秒监控窗口
  }
});

// 集成到gRPC客户端
const client = new GRPCClient({
  serviceDiscovery,
  loadBalancer,
  
  // 服务配置
  services: {
    'UserService': {
      discovery: {
        serviceName: 'user-service',
        tags: ['grpc', 'v1']
      }
    }
  }
});

// 动态服务发现使用
async function useServiceDiscovery() {
  // 自动发现服务实例
  const userService = await client.getService<UserServiceClient>('UserService');
  
  // 调用会自动路由到健康的服务实例
  const user = await userService.GetUser({ userId: 12345n });
  console.log('User:', user);
}
```

## 高级配置

### 服务器高级配置

```typescript
const advancedServerConfig: ServerConfig = {
  // 基础配置
  host: '0.0.0.0',
  port: 50051,
  
  // TLS/SSL配置
  tls: {
    enabled: true,
    keyFile: './certs/server.key',
    certFile: './certs/server.crt',
    caFile: './certs/ca.crt',
    clientCertAuth: true,     // 双向TLS认证
    cipherSuites: [           // 加密套件
      'ECDHE-RSA-AES128-GCM-SHA256',
      'ECDHE-RSA-AES256-GCM-SHA384'
    ]
  },
  
  // HTTP/2配置
  http2: {
    maxConcurrentStreams: 1000,
    maxFrameSize: 16384,
    initialWindowSize: 65535,
    maxHeaderListSize: 8192
  },
  
  // 连接管理
  connection: {
    maxConnections: 10000,
    maxConnectionAge: 1200000,    // 20分钟最大连接时间
    maxConnectionAgeGrace: 5000,  // 5秒优雅关闭时间
    maxConnectionIdle: 300000,    // 5分钟空闲超时
    keepAlive: {
      time: 7200000,              // 2小时
      timeout: 20000,             // 20秒超时
      permitWithoutStream: true
    }
  },
  
  // 消息配置
  message: {
    maxReceiveSize: 4 * 1024 * 1024,  // 4MB
    maxSendSize: 4 * 1024 * 1024,     // 4MB
    maxMetadataSize: 8192,            // 8KB
    compression: {
      enabled: true,
      algorithms: ['gzip', 'deflate'],
      level: 6
    }
  },
  
  // 线程池配置
  threadPool: {
    coreSize: 10,           // 核心线程数
    maxSize: 100,          // 最大线程数
    keepAlive: 60000,      // 线程空闲时间
    queueSize: 1000        // 队列大小
  },
  
  // 监控配置
  monitoring: {
    enabled: true,
    metricsPort: 9090,
    healthCheckPort: 8080,
    
    // 指标配置
    metrics: {
      requestDuration: true,
      requestCount: true,
      activeConnections: true,
      errorRate: true
    }
  }
};
```

### 客户端高级配置

```typescript
const advancedClientConfig: ClientConfig = {
  // 连接配置
  connection: {
    maxReceiveMessageSize: 4 * 1024 * 1024,
    maxSendMessageSize: 4 * 1024 * 1024,
    keepAlive: {
      time: 30000,
      timeout: 5000,
      permitWithoutStream: false
    },
    idleTimeout: 300000,    // 5分钟空闲超时
    connectTimeout: 10000   // 10秒连接超时
  },
  
  // 重试配置
  retry: {
    maxAttempts: 5,
    initialBackoff: 100,    // 100ms
    maxBackoff: 30000,      // 30秒
    backoffMultiplier: 1.6,
    jitter: 0.2,           // 20%抖动
    
    // 重试条件
    retryableStatusCodes: [
      'UNAVAILABLE',
      'DEADLINE_EXCEEDED',
      'RESOURCE_EXHAUSTED'
    ],
    
    // 重试策略
    retryPolicy: {
      hedging: {
        enabled: true,
        hedgingDelay: 100,    // 100ms对冲延迟
        maxAttempts: 3
      }
    }
  },
  
  // 负载均衡配置
  loadBalancing: {
    policy: 'round_robin',
    
    // 子通道配置
    subchannelPoolSize: 10,
    
    // 健康检查
    healthCheck: {
      serviceName: 'grpc.health.v1.Health',
      interval: 30000,
      timeout: 5000
    },
    
    // 局部性配置
    locality: {
      region: 'us-west-2',
      zone: 'us-west-2a',
      subzone: 'rack-1'
    }
  },
  
  // 安全配置
  security: {
    tls: {
      enabled: true,
      caFile: './certs/ca.crt',
      keyFile: './certs/client.key',
      certFile: './certs/client.crt',
      serverName: 'user-service.example.com',
      insecureSkipVerify: false
    },
    
    // 认证配置
    auth: {
      type: 'jwt',
      jwt: {
        tokenProvider: async () => {
          return await getJWTToken();
        },
        refreshThreshold: 300  // 5分钟前刷新
      }
    }
  }
};
```

## 性能优化

### 连接池优化

```typescript
import { ConnectionPool, PoolConfig } from '@sker/protocol-grpc';

const poolConfig: PoolConfig = {
  // 连接池大小
  minConnections: 5,
  maxConnections: 50,
  
  // 连接管理
  maxConnectionAge: 600000,     // 10分钟最大连接年龄
  maxConnectionIdle: 300000,    // 5分钟空闲超时
  connectionTimeout: 10000,     // 10秒连接超时
  
  // 健康检查
  healthCheckInterval: 30000,   // 30秒健康检查
  healthCheckTimeout: 5000,     // 5秒健康检查超时
  
  // 负载均衡
  balancingPolicy: 'least_requests',
  
  // 预热配置
  warmupConnections: 3,         // 预热3个连接
  warmupTimeout: 5000          // 5秒预热超时
};

const connectionPool = new ConnectionPool(poolConfig);

// 使用连接池的客户端
const pooledClient = new GRPCClient({
  connectionPool,
  target: 'user-service'
});
```

### 流式优化

```typescript
import { StreamOptimizer } from '@sker/protocol-grpc';

const streamOptimizer = new StreamOptimizer({
  // 缓冲区配置
  bufferSize: 1024 * 1024,      // 1MB缓冲区
  maxBufferedMessages: 1000,     // 最大缓冲消息数
  
  // 批处理配置
  batchSize: 100,               // 批处理大小
  batchTimeout: 100,            // 100ms批处理超时
  
  // 背压控制
  backpressure: {
    enabled: true,
    highWaterMark: 10000,       // 高水位标记
    lowWaterMark: 5000,         // 低水位标记
    strategy: 'drop_oldest'     // 背压策略
  },
  
  // 压缩优化
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 1,                   // 快速压缩
    threshold: 1024             // 1KB压缩阈值
  }
});

// 应用流式优化
const optimizedServer = new GRPCServer({
  streamOptimizer,
  // 其他配置...
});
```

## 最佳实践

### 1. 服务定义最佳实践

```protobuf
// ✅ 推荐：明确的服务和方法命名
service UserManagementService {
  rpc GetUserById(GetUserByIdRequest) returns (GetUserByIdResponse);
  rpc ListUsersByDepartment(ListUsersByDepartmentRequest) returns (stream User);
}

// ✅ 推荐：使用专门的请求/响应消息
message GetUserByIdRequest {
  int64 user_id = 1 [(validate.rules).int64.gt = 0];
}

message GetUserByIdResponse {
  User user = 1;
  ResponseMetadata metadata = 2;
}

// ❌ 避免：直接使用基础类型作为参数
service BadUserService {
  rpc GetUser(int64) returns (User);  // 不好的做法
}
```

### 2. 错误处理最佳实践

```typescript
import { Status, StatusCode } from '@sker/protocol-grpc';

// ✅ 推荐：使用标准gRPC状态码
class UserService {
  async GetUser(request: GetUserRequest): Promise<User> {
    // 参数验证
    if (!request.userId || request.userId <= 0) {
      throw new Status(StatusCode.INVALID_ARGUMENT, 'User ID must be positive');
    }
    
    try {
      const user = await this.userRepository.findById(request.userId);
      
      if (!user) {
        throw new Status(StatusCode.NOT_FOUND, `User not found: ${request.userId}`);
      }
      
      return user;
    } catch (error) {
      if (error instanceof Status) {
        throw error;
      }
      
      // 内部错误
      throw new Status(StatusCode.INTERNAL, 'Internal server error', {
        originalError: error.message
      });
    }
  }
}
```

### 3. 流式处理最佳实践

```typescript
// ✅ 推荐：合理的流式处理
async function* listUsersStream(request: ListUsersRequest): AsyncGenerator<User> {
  const batchSize = Math.min(request.pageSize || 100, 1000); // 限制批处理大小
  let offset = 0;
  
  while (true) {
    const users = await userRepository.findUsers({
      filter: request.filter,
      limit: batchSize,
      offset
    });
    
    if (users.length === 0) break;
    
    for (const user of users) {
      yield user;
    }
    
    if (users.length < batchSize) break;
    offset += batchSize;
    
    // 给其他操作让出执行机会
    await new Promise(resolve => setImmediate(resolve));
  }
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/protocol-grpc)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的gRPC协议包。更多信息请访问 [Sker官网](https://sker.dev)