/**
 * @sker/protocol-grpc 基础使用示例
 */

import {
  GRPCServer,
  GRPCClient,
  ServerConfig,
  ClientConfig,
  ServiceHandler,
  createJWTAuthMiddleware,
  createServerLoggingMiddleware,
  createServerMetricsMiddleware,
  LoadBalancer,
  ServiceDiscovery
} from '@sker/protocol-grpc';

// 定义用户服务接口
interface User {
  id: bigint;
  name: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

interface GetUserRequest {
  userId: bigint;
}

interface CreateUserRequest {
  name: string;
  email: string;
}

interface ListUsersRequest {
  pageSize?: number;
  pageToken?: string;
  filter?: string;
}

// 实现用户服务
class UserServiceImpl implements ServiceHandler {
  private users = new Map<number, User>();
  private userIdCounter = 1;

  async GetUser(request: GetUserRequest): Promise<User> {
    const user = this.users.get(Number(request.userId));
    if (!user) {
      throw new Error(`User not found: ${request.userId}`);
    }
    return user;
  }

  async CreateUser(request: CreateUserRequest): Promise<User> {
    const user: User = {
      id: BigInt(this.userIdCounter++),
      name: request.name,
      email: request.email,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(Number(user.id), user);
    return user;
  }

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
}

// 服务器示例
async function serverExample() {
  console.log('=== gRPC Server Example ===');

  // 服务器配置
  const serverConfig: ServerConfig = {
    host: '0.0.0.0',
    port: 50051,
    tls: {
      enabled: false // 简化示例，实际使用时应启用TLS
    },
    healthCheck: {
      enabled: true,
      services: ['UserService']
    }
  };

  // 创建服务器
  const server = new GRPCServer(serverConfig);

  // 添加中间件
  server.use([
    createServerLoggingMiddleware({ level: 'info', includeMetadata: true }),
    createServerMetricsMiddleware({ enableRequestCount: true, enableRequestDuration: true }),
    createJWTAuthMiddleware({ skipPaths: ['UserService.GetUser'] })
  ]);

  // 注册服务
  server.addService('UserService', new UserServiceImpl(), {
    middleware: ['auth', 'logging', 'metrics'],
    methods: {
      GetUser: {
        timeout: 5000,
        cache: { ttl: 60000 }
      },
      ListUsers: {
        timeout: 30000,
        streamingTimeout: 300000
      }
    }
  });

  // 启动服务器
  try {
    await server.start();
    console.log(`gRPC Server started on ${serverConfig.host}:${serverConfig.port}`);

    // 优雅关闭处理
    process.on('SIGTERM', async () => {
      console.log('正在关闭gRPC服务器...');
      await server.gracefulShutdown(5000);
      process.exit(0);
    });

  } catch (error) {
    console.error('Failed to start gRPC server:', error);
  }
}

// 客户端示例
async function clientExample() {
  console.log('=== gRPC Client Example ===');

  // 客户端配置
  const clientConfig: ClientConfig = {
    target: 'localhost:50051',
    tls: {
      enabled: false
    },
    retry: {
      maxAttempts: 3,
      initialBackoff: 1000,
      maxBackoff: 10000,
      backoffMultiplier: 2,
      retryableStatusCodes: ['UNAVAILABLE', 'DEADLINE_EXCEEDED']
    },
    defaultTimeout: 30000
  };

  // 创建客户端
  const client = new GRPCClient(clientConfig);

  // 连接到服务器
  await client.connect();

  // 获取用户服务客户端
  const userService = client.getService('UserService');

  try {
    // 创建用户
    console.log('Creating user...');
    const newUser = await userService.CreateUser({
      name: 'John Doe',
      email: 'john@example.com'
    });
    console.log('Created user:', newUser);

    // 获取用户
    console.log('Getting user...');
    const user = await userService.GetUser({
      userId: newUser.id
    });
    console.log('Retrieved user:', user);

    // 列出用户（流式）
    console.log('Listing users...');
    const userStream = userService.ListUsers({
      pageSize: 10,
      filter: ''
    });

    for await (const streamUser of userStream) {
      console.log('User from stream:', streamUser);
    }

  } catch (error) {
    console.error('gRPC call failed:', error);
  } finally {
    // 关闭客户端
    await client.close();
    console.log('gRPC client closed');
  }
}

// 服务发现示例
async function serviceDiscoveryExample() {
  console.log('=== Service Discovery Example ===');

  // 创建服务发现
  const serviceDiscovery = new ServiceDiscovery({
    provider: 'consul',
    consul: {
      host: 'localhost',
      port: 8500,
      registration: {
        name: 'user-service',
        id: 'user-service-001',
        tags: ['grpc', 'user', 'v1'],
        address: 'localhost',
        port: 50051,
        check: {
          grpc: 'localhost:50051/health',
          interval: '10s',
          timeout: '3s'
        }
      }
    }
  });

  // 启动服务发现
  await serviceDiscovery.start();

  // 发现服务实例
  const instances = await serviceDiscovery.discover('user-service', ['grpc', 'v1']);
  console.log('Discovered service instances:', instances);

  // 停止服务发现
  await serviceDiscovery.stop();
}

// 负载均衡示例
async function loadBalancerExample() {
  console.log('=== Load Balancer Example ===');

  // 创建负载均衡器
  const loadBalancer = new LoadBalancer({
    policy: 'round_robin',
    healthChecker: {
      interval: 30000,
      timeout: 5000,
      unhealthyThreshold: 3,
      healthyThreshold: 2
    },
    circuitBreaker: {
      enabled: true,
      failureThreshold: 5,
      recoveryTimeout: 30000,
      monitoringPeriod: 10000
    }
  });

  // 添加服务实例
  loadBalancer.addInstance({
    id: 'instance-1',
    address: 'localhost',
    port: 50051,
    weight: 1
  });

  loadBalancer.addInstance({
    id: 'instance-2',
    address: 'localhost',
    port: 50052,
    weight: 2
  });

  // 选择实例
  const selectedInstance = loadBalancer.selectInstance();
  console.log('Selected instance:', selectedInstance);

  // 记录请求结果
  if (selectedInstance) {
    loadBalancer.recordRequestResult(selectedInstance, 150, false); // 150ms, 成功
  }

  // 获取统计信息
  const stats = loadBalancer.getStats();
  console.log('Load balancer stats:', stats);

  // 停止负载均衡器
  await loadBalancer.stop();
}

// 运行示例
async function runExamples() {
  try {
    // 注意：在实际使用中，服务器和客户端通常在不同的进程中运行
    // 这里为了演示，我们并行运行服务器，然后运行客户端示例
    
    console.log('Starting gRPC examples...\n');
    
    // 启动服务器（在后台）
    serverExample().catch(console.error);
    
    // 等待服务器启动
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 运行其他示例
    await clientExample();
    console.log('');
    
    await serviceDiscoveryExample();
    console.log('');
    
    await loadBalancerExample();
    
    console.log('\nAll examples completed!');
    
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// 如果直接运行此文件，执行示例
if (require.main === module) {
  runExamples();
}

export {
  serverExample,
  clientExample,
  serviceDiscoveryExample,
  loadBalancerExample,
  runExamples
};