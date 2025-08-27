# @sker/protocol-http

Sker HTTP/REST协议实现包，提供灵活RESTful API通信能力。

## 概述

`@sker/protocol-http` 是Sker通信框架的HTTP/REST协议包，提供了全功能的HTTP客户端和服务端实现。该包支持RESTful API设计模式，提供了丰富的中间件系统、自动化路由管理、请求/响应处理、缓存优化等企业级特性，是构建现代Web API和微服务的完美选择。

## 功能特性

### 🌐 完整的HTTP支持
- **HTTP/1.1 & HTTP/2**: 支持现代HTTP协议版本
- **RESTful设计**: 完整的REST API设计模式支持
- **内容协商**: 自动内容类型协商和转换
- **多种数据格式**: JSON、XML、FormData、文件上传等

### 🚀 高性能服务端
- **异步处理**: 基于Node.js事件循环的高并发处理
- **中间件链**: 灵活的中间件系统
- **路由管理**: 智能路由匹配和参数提取
- **静态文件服务**: 高效的静态资源服务

### 💻 强大的客户端
- **连接池**: 智能HTTP连接复用
- **重试机制**: 可配置的请求重试策略
- **拦截器**: 请求/响应拦截和转换
- **缓存支持**: 多级缓存机制

### 🔧 开发友好
- **TypeScript支持**: 完整的类型定义和智能提示
- **装饰器支持**: 基于装饰器的路由和验证
- **自动文档**: 自动生成API文档
- **调试工具**: 内置调试和日志工具

### 🛡️ 企业级特性
- **认证授权**: 多种认证机制支持
- **CORS支持**: 跨域资源共享配置
- **限流防护**: API限流和防护机制
- **监控指标**: 完整的性能监控

## 安装

```bash
npm install @sker/protocol-http
# 或者
pnpm add @sker/protocol-http
# 或者
yarn add @sker/protocol-http
```

## 基础用法

### 创建HTTP服务器

```typescript
import { HTTPServer, Router, ServerConfig } from '@sker/protocol-http';
import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@sker/protocol-http/decorators';

// 用户数据模型
interface User {
  id: number;
  name: string;
  email: string;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  bio: string;
}

// 使用装饰器定义控制器
@Controller('/api/v1/users')
class UserController {
  private users: Map<number, User> = new Map();
  private nextId = 1;

  @Get('/')
  async getAllUsers(@Query('page') page = 1, @Query('limit') limit = 10) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const allUsers = Array.from(this.users.values());
    
    return {
      data: allUsers.slice(start, end),
      pagination: {
        page,
        limit,
        total: allUsers.length,
        pages: Math.ceil(allUsers.length / limit)
      }
    };
  }

  @Get('/:id')
  async getUserById(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    const user = this.users.get(userId);
    
    if (!user) {
      throw new HTTPError(404, `User not found: ${id}`);
    }
    
    return { data: user };
  }

  @Post('/')
  async createUser(@Body() userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const user: User = {
      id: this.nextId++,
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.users.set(user.id, user);
    return { data: user };
  }

  @Put('/:id')
  async updateUser(@Param('id') id: string, @Body() updateData: Partial<User>) {
    const userId = parseInt(id, 10);
    const user = this.users.get(userId);
    
    if (!user) {
      throw new HTTPError(404, `User not found: ${id}`);
    }
    
    const updatedUser = {
      ...user,
      ...updateData,
      id: userId, // 防止ID被修改
      updatedAt: new Date()
    };
    
    this.users.set(userId, updatedUser);
    return { data: updatedUser };
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: string) {
    const userId = parseInt(id, 10);
    const deleted = this.users.delete(userId);
    
    if (!deleted) {
      throw new HTTPError(404, `User not found: ${id}`);
    }
    
    return { message: 'User deleted successfully' };
  }
}

// 服务器配置
const serverConfig: ServerConfig = {
  // 基础配置
  host: '0.0.0.0',
  port: 3000,
  
  // HTTPS配置
  https: {
    enabled: false,  // 开发环境使用HTTP
    keyFile: './certs/server.key',
    certFile: './certs/server.crt'
  },
  
  // CORS配置
  cors: {
    enabled: true,
    origin: ['http://localhost:3000', 'https://app.example.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['X-Total-Count'],
    credentials: true,
    maxAge: 86400  // 24小时预检缓存
  },
  
  // 压缩配置
  compression: {
    enabled: true,
    algorithm: 'gzip',
    level: 6,
    threshold: 1024  // 大于1KB才压缩
  },
  
  // 限流配置
  rateLimit: {
    enabled: true,
    windowMs: 60000,        // 1分钟窗口
    maxRequests: 1000,      // 最大1000请求
    message: 'Too many requests, please try again later',
    
    // 按IP限流
    keyGenerator: (req) => req.ip,
    
    // 跳过特定路径
    skip: (req) => req.path.startsWith('/health')
  },
  
  // 请求解析配置
  parsing: {
    json: {
      limit: '10mb',
      strict: true
    },
    urlencoded: {
      limit: '10mb',
      extended: true
    },
    multipart: {
      limit: '50mb',
      maxFiles: 10
    }
  },
  
  // 静态文件服务
  static: {
    enabled: true,
    root: './public',
    maxAge: 86400000,  // 1天缓存
    index: ['index.html']
  }
};

// 创建HTTP服务器
const server = new HTTPServer(serverConfig);

// 注册控制器
server.registerController(UserController);

// 添加全局中间件
server.use([
  'cors',           // CORS中间件
  'compression',    // 压缩中间件
  'rateLimit',      // 限流中间件
  'logging',        // 日志中间件
  'errorHandler'    // 错误处理中间件
]);

// 启动服务器
await server.start();
console.log(`HTTP服务器运行在 http://${serverConfig.host}:${serverConfig.port}`);

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭HTTP服务器...');
  await server.gracefulShutdown(5000);
  process.exit(0);
});
```

### 使用HTTP客户端

```typescript
import { HTTPClient, ClientConfig, RequestConfig } from '@sker/protocol-http';

// 客户端配置
const clientConfig: ClientConfig = {
  // 基础URL
  baseURL: 'https://api.example.com',
  
  // 默认headers
  defaultHeaders: {
    'Content-Type': 'application/json',
    'User-Agent': 'Sker-HTTP-Client/1.0.0'
  },
  
  // 认证配置
  auth: {
    type: 'bearer',
    token: 'your-access-token'
  },
  
  // 超时配置
  timeout: {
    connect: 10000,    // 10秒连接超时
    request: 30000,    // 30秒请求超时
    response: 60000    // 60秒响应超时
  },
  
  // 重试配置
  retry: {
    maxAttempts: 3,
    backoff: 'exponential',
    initialDelay: 1000,
    maxDelay: 10000,
    retryCondition: (error) => {
      // 重试5xx错误和网络错误
      return error.code >= 500 || error.code === 'NETWORK_ERROR';
    }
  },
  
  // 连接池配置
  connectionPool: {
    maxConnections: 100,
    maxConnectionsPerHost: 10,
    keepAlive: true,
    keepAliveMsecs: 30000
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    storage: 'memory',    // 'memory' | 'redis' | 'file'
    ttl: 300000,         // 5分钟默认TTL
    maxSize: 100 * 1024 * 1024  // 100MB最大缓存
  }
};

// 创建HTTP客户端
const client = new HTTPClient(clientConfig);

// 基础HTTP操作
async function basicHttpOperations() {
  try {
    // GET请求
    const users = await client.get('/api/v1/users', {
      params: {
        page: 1,
        limit: 10,
        filter: 'active'
      }
    });
    console.log('用户列表:', users.data);

    // POST请求
    const newUser = await client.post('/api/v1/users', {
      name: 'John Doe',
      email: 'john@example.com',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        age: 28,
        bio: 'Software Developer'
      }
    });
    console.log('新用户:', newUser.data);

    // PUT请求
    const updatedUser = await client.put(`/api/v1/users/${newUser.data.id}`, {
      profile: {
        ...newUser.data.profile,
        bio: 'Senior Software Developer'
      }
    });
    console.log('更新用户:', updatedUser.data);

    // DELETE请求
    await client.delete(`/api/v1/users/${newUser.data.id}`);
    console.log('用户已删除');

  } catch (error) {
    console.error('HTTP请求错误:', error);
  }
}

// 高级请求配置
async function advancedRequestOptions() {
  const requestConfig: RequestConfig = {
    // 请求头
    headers: {
      'X-Custom-Header': 'custom-value',
      'Accept': 'application/json'
    },
    
    // 查询参数
    params: {
      include: ['profile', 'permissions'],
      sort: 'created_at:desc'
    },
    
    // 请求体
    data: {
      name: 'Jane Doe',
      email: 'jane@example.com'
    },
    
    // 超时设置
    timeout: 15000,
    
    // 响应类型
    responseType: 'json',  // 'json' | 'text' | 'blob' | 'stream'
    
    // 缓存控制
    cache: {
      enabled: true,
      key: 'custom-cache-key',
      ttl: 600000  // 10分钟
    },
    
    // 重试配置
    retry: {
      maxAttempts: 5,
      backoff: 'linear',
      retryDelay: 2000
    },
    
    // 验证器
    validateStatus: (status) => status >= 200 && status < 300,
    
    // 响应转换器
    transformResponse: (data) => {
      if (typeof data === 'string') {
        try {
          return JSON.parse(data);
        } catch (e) {
          return data;
        }
      }
      return data;
    }
  };

  const response = await client.request('/api/v1/users', requestConfig);
  console.log('高级请求响应:', response);
}

// 文件上传
async function fileUploadExample() {
  const formData = new FormData();
  formData.append('file', fileBlob, 'avatar.jpg');
  formData.append('userId', '12345');
  formData.append('description', 'User avatar');

  const uploadResponse = await client.post('/api/v1/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    },
    
    // 上传进度回调
    onUploadProgress: (progress) => {
      console.log(`上传进度: ${(progress.percent * 100).toFixed(2)}%`);
    },
    
    // 超时配置（文件上传通常需要更长时间）
    timeout: 300000  // 5分钟
  });

  console.log('文件上传成功:', uploadResponse.data);
}

// 流式下载
async function streamDownloadExample() {
  const response = await client.get('/api/v1/files/large-file.zip', {
    responseType: 'stream',
    
    // 下载进度回调
    onDownloadProgress: (progress) => {
      console.log(`下载进度: ${(progress.percent * 100).toFixed(2)}%`);
    }
  });

  // 保存到文件
  const fileStream = fs.createWriteStream('./downloads/large-file.zip');
  response.data.pipe(fileStream);

  return new Promise((resolve, reject) => {
    fileStream.on('finish', resolve);
    fileStream.on('error', reject);
  });
}
```

### 中间件系统

```typescript
import { Middleware, MiddlewareContext } from '@sker/protocol-http';

// 认证中间件
const authMiddleware: Middleware = async (ctx: MiddlewareContext, next) => {
  const token = ctx.request.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    throw new HTTPError(401, 'Authentication required');
  }
  
  try {
    const payload = await verifyJWT(token);
    ctx.user = payload;
  } catch (error) {
    throw new HTTPError(401, 'Invalid token');
  }
  
  await next();
};

// 日志中间件
const loggingMiddleware: Middleware = async (ctx: MiddlewareContext, next) => {
  const startTime = Date.now();
  const { method, url, ip } = ctx.request;
  
  console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ip}`);
  
  try {
    await next();
    const duration = Date.now() - startTime;
    console.log(`[${new Date().toISOString()}] ${method} ${url} - ${ctx.response.statusCode} - ${duration}ms`);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`[${new Date().toISOString()}] ${method} ${url} - ${error.statusCode || 500} - ${duration}ms - ${error.message}`);
    throw error;
  }
};

// 缓存中间件
const cacheMiddleware = (options: { ttl?: number, keyGenerator?: (ctx: MiddlewareContext) => string } = {}) => {
  const { ttl = 300000, keyGenerator = (ctx) => `${ctx.request.method}:${ctx.request.url}` } = options;
  
  return async (ctx: MiddlewareContext, next) => {
    // 只缓存GET请求
    if (ctx.request.method !== 'GET') {
      return await next();
    }
    
    const cacheKey = keyGenerator(ctx);
    const cachedResponse = await cache.get(cacheKey);
    
    if (cachedResponse) {
      ctx.response.setHeader('X-Cache', 'HIT');
      ctx.response.json(cachedResponse);
      return;
    }
    
    // 执行后续中间件
    await next();
    
    // 缓存响应
    if (ctx.response.statusCode === 200) {
      await cache.set(cacheKey, ctx.response.body, ttl);
      ctx.response.setHeader('X-Cache', 'MISS');
    }
  };
};

// 数据验证中间件
const validationMiddleware = (schema: any) => {
  return async (ctx: MiddlewareContext, next) => {
    try {
      // 验证请求体
      if (ctx.request.body) {
        const validatedBody = await schema.validateAsync(ctx.request.body);
        ctx.request.body = validatedBody;
      }
      
      await next();
    } catch (error) {
      throw new HTTPError(400, `Validation error: ${error.message}`, {
        details: error.details
      });
    }
  };
};

// 应用中间件
server.use([
  loggingMiddleware,
  authMiddleware,
  cacheMiddleware({ ttl: 600000 }),  // 10分钟缓存
  validationMiddleware(userSchema)
]);
```

### 路由系统

```typescript
import { Router, RouteHandler } from '@sker/protocol-http';

// 创建路由器
const router = new Router({
  prefix: '/api/v1',
  caseSensitive: false,
  strictSlash: true
});

// 路由参数和处理器
const getUserHandler: RouteHandler = async (ctx) => {
  const { id } = ctx.params;
  const { include } = ctx.query;
  
  const user = await userService.findById(parseInt(id));
  
  if (!user) {
    ctx.throw(404, 'User not found');
  }
  
  // 根据include参数决定返回的字段
  if (include) {
    const fields = include.split(',');
    const filteredUser = pick(user, fields);
    ctx.json({ data: filteredUser });
  } else {
    ctx.json({ data: user });
  }
};

// 路由定义
router.get('/users/:id', getUserHandler);

// 路由组
const adminRouter = new Router({ prefix: '/admin' });

adminRouter.use(adminAuthMiddleware);  // 管理员认证

adminRouter.get('/stats', async (ctx) => {
  const stats = await adminService.getSystemStats();
  ctx.json({ data: stats });
});

adminRouter.post('/users/:id/ban', async (ctx) => {
  const { id } = ctx.params;
  const { reason } = ctx.request.body;
  
  await adminService.banUser(parseInt(id), reason);
  ctx.json({ message: 'User banned successfully' });
});

// 嵌套路由
router.use('/admin', adminRouter);

// 路由参数验证
router.get('/users/:id(\\d+)', getUserHandler);  // id必须是数字

// 可选参数
router.get('/posts/:id?', async (ctx) => {
  const { id } = ctx.params;
  
  if (id) {
    const post = await postService.findById(parseInt(id));
    ctx.json({ data: post });
  } else {
    const posts = await postService.findAll();
    ctx.json({ data: posts });
  }
});

// 通配符路由
router.get('/files/*', async (ctx) => {
  const filePath = ctx.params[0];  // 捕获通配符匹配的内容
  const fileContent = await fileService.readFile(filePath);
  ctx.send(fileContent);
});

// 应用路由到服务器
server.use('/api/v1', router);
```

### 请求/响应拦截器

```typescript
import { RequestInterceptor, ResponseInterceptor } from '@sker/protocol-http';

// 请求拦截器
const requestInterceptors: RequestInterceptor[] = [
  // 添加认证头
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`
      };
    }
    return config;
  },
  
  // 添加请求ID用于链路追踪
  async (config) => {
    const requestId = generateRequestId();
    config.headers = {
      ...config.headers,
      'X-Request-ID': requestId
    };
    
    // 记录请求开始
    console.log(`[REQUEST] ${requestId} ${config.method?.toUpperCase()} ${config.url}`);
    config.metadata = { requestId, startTime: Date.now() };
    
    return config;
  },
  
  // 请求体压缩
  async (config) => {
    if (config.data && config.compress !== false) {
      const dataSize = JSON.stringify(config.data).length;
      
      if (dataSize > 1024) {  // 大于1KB才压缩
        config.data = await compressData(config.data);
        config.headers = {
          ...config.headers,
          'Content-Encoding': 'gzip'
        };
      }
    }
    
    return config;
  }
];

// 响应拦截器
const responseInterceptors: ResponseInterceptor[] = [
  // 记录响应完成
  async (response) => {
    const { requestId, startTime } = response.config.metadata || {};
    const duration = Date.now() - (startTime || 0);
    
    console.log(`[RESPONSE] ${requestId} ${response.status} - ${duration}ms`);
    
    return response;
  },
  
  // 自动重试过期token
  async (response) => {
    if (response.status === 401 && response.data?.error === 'token_expired') {
      try {
        const newToken = await refreshAuthToken();
        
        // 更新原请求的token
        const originalRequest = response.config;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // 重新发起请求
        return await client.request(originalRequest);
      } catch (refreshError) {
        // 刷新失败，跳转到登录页
        redirectToLogin();
        throw refreshError;
      }
    }
    
    return response;
  },
  
  // 响应体解压缩
  async (response) => {
    const contentEncoding = response.headers['content-encoding'];
    
    if (contentEncoding === 'gzip' && response.data) {
      response.data = await decompressData(response.data);
    }
    
    return response;
  },
  
  // 数据格式标准化
  async (response) => {
    // 确保API响应格式一致
    if (response.data && !response.data.data && !response.data.error) {
      response.data = {
        data: response.data,
        status: 'success',
        timestamp: new Date().toISOString()
      };
    }
    
    return response;
  }
];

// 应用拦截器到客户端
client.interceptors.request.use(requestInterceptors);
client.interceptors.response.use(responseInterceptors);
```

## 高级配置

### 服务器高级配置

```typescript
const advancedServerConfig: ServerConfig = {
  // 基础配置
  host: '0.0.0.0',
  port: 3000,
  
  // 集群配置
  cluster: {
    enabled: true,
    workers: 'auto',      // 'auto' | number
    maxMemory: '1GB',     // 内存限制
    gracefulShutdown: 5000 // 优雅关闭时间
  },
  
  // HTTPS/HTTP2配置
  https: {
    enabled: true,
    keyFile: './certs/server.key',
    certFile: './certs/server.crt',
    caFile: './certs/ca.crt',
    
    // HTTP/2配置
    http2: {
      enabled: true,
      allowHTTP1: true,
      maxConcurrentStreams: 1000,
      maxFrameSize: 16384,
      initialWindowSize: 65535
    },
    
    // 安全配置
    security: {
      hsts: {
        enabled: true,
        maxAge: 31536000,     // 1年
        includeSubDomains: true,
        preload: true
      },
      csp: {
        enabled: true,
        policy: "default-src 'self'; script-src 'self' 'unsafe-inline';"
      }
    }
  },
  
  // 性能配置
  performance: {
    // 连接配置
    maxConnections: 10000,
    keepAliveTimeout: 5000,
    headersTimeout: 60000,
    requestTimeout: 30000,
    
    // 缓冲区配置
    maxHeaderSize: 8192,
    maxRequestSize: '50MB',
    
    // 连接池
    connectionPool: {
      enabled: true,
      maxIdle: 100,
      maxActive: 1000,
      idleTimeout: 30000
    }
  },
  
  // 监控配置
  monitoring: {
    enabled: true,
    
    // 健康检查端点
    health: {
      enabled: true,
      path: '/health',
      checks: [
        'database',
        'redis',
        'external-api'
      ]
    },
    
    // 指标端点
    metrics: {
      enabled: true,
      path: '/metrics',
      format: 'prometheus'    // 'prometheus' | 'json'
    },
    
    // 链路追踪
    tracing: {
      enabled: true,
      serviceName: 'user-service',
      jaegerEndpoint: 'http://jaeger:14268/api/traces'
    }
  },
  
  // 安全配置
  security: {
    // 请求头安全
    helmet: {
      enabled: true,
      contentSecurityPolicy: true,
      crossOriginEmbedderPolicy: true,
      dnsPrefetchControl: true,
      frameguard: true,
      hidePoweredBy: true,
      hsts: true,
      ieNoOpen: true,
      noSniff: true,
      originAgentCluster: true,
      permittedCrossDomainPolicies: false,
      referrerPolicy: true,
      xssFilter: true
    },
    
    // 限流配置
    rateLimit: {
      global: {
        windowMs: 60000,
        maxRequests: 1000
      },
      
      // 按路径限流
      paths: {
        '/api/auth/login': {
          windowMs: 60000,
          maxRequests: 5
        },
        '/api/upload': {
          windowMs: 60000,
          maxRequests: 10
        }
      }
    }
  }
};
```

### 客户端高级配置

```typescript
const advancedClientConfig: ClientConfig = {
  // 基础配置
  baseURL: 'https://api.example.com',
  
  // HTTP Agent配置
  httpAgent: {
    keepAlive: true,
    keepAliveMsecs: 30000,
    maxSockets: 100,
    maxFreeSockets: 10,
    timeout: 60000,
    freeSocketTimeout: 30000
  },
  
  // 代理配置
  proxy: {
    enabled: true,
    protocol: 'http',
    host: 'proxy.example.com',
    port: 8080,
    auth: {
      username: 'proxy-user',
      password: 'proxy-pass'
    },
    
    // 代理规则
    rules: [
      {
        match: '/api/external/*',
        proxy: 'http://external-proxy:8080'
      }
    ]
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    storage: 'redis',
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'redis-password',
      keyPrefix: 'http-cache:'
    },
    
    // 缓存策略
    strategies: {
      'GET /api/config': { ttl: 3600000 },      // 1小时
      'GET /api/users': { ttl: 300000 },        // 5分钟
      'GET /api/posts/*': { ttl: 600000 }       // 10分钟
    },
    
    // 缓存控制
    respectCacheHeaders: true,
    staleWhileRevalidate: true
  },
  
  // 断路器配置
  circuitBreaker: {
    enabled: true,
    failureThreshold: 5,        // 失败阈值
    recoveryTimeout: 30000,     // 恢复超时
    monitoringPeriod: 10000,    // 监控周期
    
    // 按服务配置
    services: {
      'external-api': {
        failureThreshold: 3,
        recoveryTimeout: 60000
      }
    }
  },
  
  // 负载均衡配置
  loadBalancing: {
    enabled: true,
    strategy: 'round_robin',    // 'round_robin' | 'least_connections' | 'weighted'
    
    // 服务器列表
    servers: [
      { url: 'https://api1.example.com', weight: 1 },
      { url: 'https://api2.example.com', weight: 2 },
      { url: 'https://api3.example.com', weight: 1 }
    ],
    
    // 健康检查
    healthCheck: {
      enabled: true,
      interval: 30000,
      timeout: 5000,
      path: '/health'
    }
  }
};
```

## 性能优化

### 连接池优化

```typescript
import { ConnectionPool } from '@sker/protocol-http';

const connectionPool = new ConnectionPool({
  // 连接池大小
  maxConnections: 200,
  maxConnectionsPerHost: 50,
  
  // 连接管理
  keepAlive: true,
  keepAliveMsecs: 30000,
  maxIdleTime: 60000,
  
  // 连接超时
  connectTimeout: 10000,
  socketTimeout: 30000,
  
  // 健康检查
  healthCheck: {
    enabled: true,
    interval: 30000,
    timeout: 5000
  },
  
  // 连接复用
  reuseConnections: true,
  
  // 预热配置
  warmup: {
    enabled: true,
    connections: 10,
    hosts: ['api.example.com', 'upload.example.com']
  }
});

// 使用连接池的客户端
const pooledClient = new HTTPClient({
  connectionPool,
  // 其他配置...
});
```

### 缓存优化

```typescript
import { CacheManager, CacheStrategy } from '@sker/protocol-http';

const cacheManager = new CacheManager({
  // 多级缓存
  levels: [
    {
      name: 'memory',
      type: 'lru',
      maxSize: 100 * 1024 * 1024,  // 100MB
      ttl: 300000                   // 5分钟
    },
    {
      name: 'redis',
      type: 'redis',
      connection: {
        host: 'localhost',
        port: 6379
      },
      ttl: 3600000                  // 1小时
    }
  ],
  
  // 缓存策略
  strategies: {
    'static-content': {
      pattern: /\.(js|css|png|jpg|gif)$/,
      ttl: 86400000,                // 1天
      staleWhileRevalidate: true
    },
    
    'api-response': {
      pattern: /^\/api\//,
      ttl: 300000,                  // 5分钟
      keyGenerator: (req) => `${req.method}:${req.url}:${req.headers.authorization || 'anonymous'}`
    }
  },
  
  // 缓存预热
  preload: {
    enabled: true,
    urls: [
      '/api/config',
      '/api/menu',
      '/api/permissions'
    ]
  }
});
```

## 最佳实践

### 1. RESTful API设计

```typescript
// ✅ 推荐：RESTful URL设计
class ResourceController {
  // 获取资源列表
  @Get('/users')
  async list(@Query() query: ListUsersQuery) { }
  
  // 获取单个资源
  @Get('/users/:id')
  async get(@Param('id') id: string) { }
  
  // 创建资源
  @Post('/users')
  async create(@Body() data: CreateUserData) { }
  
  // 更新资源（完整更新）
  @Put('/users/:id')
  async update(@Param('id') id: string, @Body() data: UpdateUserData) { }
  
  // 部分更新资源
  @Patch('/users/:id')
  async partialUpdate(@Param('id') id: string, @Body() data: Partial<UpdateUserData>) { }
  
  // 删除资源
  @Delete('/users/:id')
  async delete(@Param('id') id: string) { }
  
  // 嵌套资源
  @Get('/users/:userId/posts')
  async getUserPosts(@Param('userId') userId: string) { }
}

// ✅ 推荐：标准化响应格式
const standardResponse = {
  success: true,
  data: { /* 实际数据 */ },
  message: 'Operation successful',
  timestamp: '2023-01-01T00:00:00Z',
  pagination: {  // 分页信息（仅列表接口）
    page: 1,
    limit: 10,
    total: 100,
    pages: 10
  }
};

// ✅ 推荐：标准化错误响应
const errorResponse = {
  success: false,
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Invalid input data',
    details: [
      {
        field: 'email',
        message: 'Invalid email format'
      }
    ]
  },
  timestamp: '2023-01-01T00:00:00Z'
};
```

### 2. 错误处理最佳实践

```typescript
// ✅ 推荐：统一错误处理
class HTTPError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'HTTPError';
  }
}

// 全局错误处理中间件
const errorHandlerMiddleware: Middleware = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details = null;
    
    if (error instanceof HTTPError) {
      statusCode = error.statusCode;
      message = error.message;
      details = error.details;
    } else if (error.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = error.message;
      details = error.details;
    } else if (error.code === 'ENOTFOUND') {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      message = 'External service unavailable';
    }
    
    // 记录错误日志
    logger.error('HTTP Error:', {
      statusCode,
      errorCode,
      message,
      details,
      stack: error.stack,
      request: {
        method: ctx.request.method,
        url: ctx.request.url,
        headers: ctx.request.headers
      }
    });
    
    // 返回错误响应
    ctx.status = statusCode;
    ctx.json({
      success: false,
      error: {
        code: errorCode,
        message,
        details
      },
      timestamp: new Date().toISOString()
    });
  }
};
```

### 3. 性能优化建议

```typescript
// ✅ 推荐：合理使用缓存
@Controller('/api/v1/users')
class UserController {
  
  @Get('/')
  @Cache({ ttl: 300000, key: (req) => `users:list:${JSON.stringify(req.query)}` })
  async list(@Query() query: ListUsersQuery) {
    return await userService.findUsers(query);
  }
  
  @Get('/:id')
  @Cache({ ttl: 600000, key: (req) => `user:${req.params.id}` })
  async get(@Param('id') id: string) {
    return await userService.findById(id);
  }
}

// ✅ 推荐：使用连接池
const client = new HTTPClient({
  connectionPool: {
    maxConnections: 100,
    maxConnectionsPerHost: 20,
    keepAlive: true
  }
});

// ✅ 推荐：实现幂等性
@Post('/api/v1/orders')
async createOrder(
  @Body() orderData: CreateOrderData,
  @Header('Idempotency-Key') idempotencyKey?: string
) {
  if (idempotencyKey) {
    const existingOrder = await orderService.findByIdempotencyKey(idempotencyKey);
    if (existingOrder) {
      return { data: existingOrder };
    }
  }
  
  const order = await orderService.create(orderData, idempotencyKey);
  return { data: order };
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/protocol-http)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的HTTP/REST协议包。更多信息请访问 [Sker官网](https://sker.dev)