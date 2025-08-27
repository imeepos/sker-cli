# @sker/constants

Sker全局常量定义包，提供跨语言跨进程通信的标准常量定义。

## 概述

`@sker/constants` 包含了Sker通信框架中使用的所有标准常量定义，确保跨语言跨进程跨端通信的一致性。这些常量遵循跨语言跨进程跨端通信标准工作流程规范，为整个生态系统提供统一的标准。

## 功能特性

### 📋 通信协议常量
- **协议类型**: HTTP、gRPC、WebSocket等协议标识
- **消息类型**: 请求、响应、事件、命令等消息类型
- **内容类型**: JSON、Protocol Buffers、MessagePack等格式
- **传输模式**: 同步、异步、流式传输模式

### 🔢 标准错误码
- **系统级错误**: 1xx-xxx格式的系统错误码
- **业务级错误**: 2xx-xxx格式的业务错误码  
- **集成级错误**: 3xx-xxx格式的集成错误码
- **安全级错误**: 4xx-xxx格式的安全错误码

### 🌐 服务发现常量
- **服务状态**: 健康、不健康、维护等状态常量
- **负载均衡**: 轮询、随机、最少连接等策略常量
- **协议端口**: 标准协议的默认端口定义
- **健康检查**: 健康检查间隔和超时常量

### 🔐 安全认证常量
- **认证方式**: API密钥、OAuth2、JWT、mTLS等认证类型
- **权限级别**: 读取、写入、管理等权限常量
- **加密算法**: 支持的加密和哈希算法常量
- **令牌类型**: 访问令牌、刷新令牌等类型定义

## 安装

```bash
npm install @sker/constants
# 或者
pnpm add @sker/constants
# 或者
yarn add @sker/constants
```

## 通信协议常量

### 协议类型

```typescript
import { 
  PROTOCOL_TYPES,
  HTTP_METHODS,
  MESSAGE_TYPES,
  CONTENT_TYPES 
} from '@sker/constants';

// 协议类型
export const PROTOCOL_TYPES = {
  UNKNOWN: 'unknown',
  HTTP: 'http',
  HTTPS: 'https',
  GRPC: 'grpc',
  WEBSOCKET: 'websocket',
  TCP: 'tcp',
  UDP: 'udp'
} as const;

// HTTP方法
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const;

// 消息类型
export const MESSAGE_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response',
  EVENT: 'event',
  COMMAND: 'command',
  NOTIFICATION: 'notification'
} as const;

// 内容类型
export const CONTENT_TYPES = {
  JSON: 'application/json',
  PROTOBUF: 'application/protobuf',
  MSGPACK: 'application/msgpack',
  XML: 'application/xml',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded'
} as const;
```

### 使用示例

```typescript
import { PROTOCOL_TYPES, HTTP_METHODS, CONTENT_TYPES } from '@sker/constants';

// 创建HTTP请求配置
const requestConfig = {
  protocol: PROTOCOL_TYPES.HTTPS,
  method: HTTP_METHODS.POST,
  contentType: CONTENT_TYPES.JSON,
  url: '/api/v1/users'
};

// 检查协议类型
if (config.protocol === PROTOCOL_TYPES.GRPC) {
  // gRPC特定逻辑
  setupGrpcClient();
}
```

## 错误码常量

### 标准错误码体系

```typescript
import { 
  SYSTEM_ERROR_CODES,
  BUSINESS_ERROR_CODES,
  INTEGRATION_ERROR_CODES,
  SECURITY_ERROR_CODES 
} from '@sker/constants';

// 系统级错误码 (1xx-xxx)
export const SYSTEM_ERROR_CODES = {
  // 通用系统错误 (100-xxx)
  INTERNAL_ERROR: '100001',
  SERVICE_UNAVAILABLE: '100002',
  SERVICE_TIMEOUT: '100003',
  RESOURCE_EXHAUSTED: '100004',
  CONFIGURATION_ERROR: '100005',
  
  // 网络错误 (101-xxx)
  NETWORK_CONNECTION_FAILED: '101001',
  NETWORK_TIMEOUT: '101002',
  NETWORK_INTERRUPTED: '101003',
  DNS_RESOLUTION_FAILED: '101004',
  
  // 数据错误 (102-xxx)
  SERIALIZATION_FAILED: '102001',
  DESERIALIZATION_FAILED: '102002',
  DATA_FORMAT_ERROR: '102003',
  DATA_SIZE_EXCEEDED: '102004'
} as const;

// 业务级错误码 (2xx-xxx)
export const BUSINESS_ERROR_CODES = {
  // 通用业务错误 (200-xxx)
  BUSINESS_RULE_VIOLATION: '200001',
  BUSINESS_PROCESS_ERROR: '200002',
  BUSINESS_STATE_INVALID: '200003',
  BUSINESS_DATA_INCONSISTENT: '200004',
  
  // 用户相关错误 (201-xxx)
  USER_NOT_FOUND: '201001',
  USER_ALREADY_EXISTS: '201002',
  USER_STATE_INVALID: '201003',
  USER_PERMISSION_DENIED: '201004',
  
  // 订单相关错误 (202-xxx)
  ORDER_NOT_FOUND: '202001',
  ORDER_STATE_INVALID: '202002',
  ORDER_AMOUNT_INVALID: '202003',
  INSUFFICIENT_INVENTORY: '202004'
} as const;

// 集成级错误码 (3xx-xxx)
export const INTEGRATION_ERROR_CODES = {
  // 外部服务错误 (300-xxx)
  EXTERNAL_SERVICE_UNAVAILABLE: '300001',
  EXTERNAL_SERVICE_RESPONSE_INVALID: '300002',
  API_VERSION_INCOMPATIBLE: '300003',
  DATA_MAPPING_FAILED: '300004',
  
  // 数据库错误 (301-xxx)
  DATABASE_CONNECTION_FAILED: '301001',
  QUERY_TIMEOUT: '301002',
  TRANSACTION_ROLLBACK: '301003',
  CONSTRAINT_VIOLATION: '301004'
} as const;

// 安全级错误码 (4xx-xxx)
export const SECURITY_ERROR_CODES = {
  // 认证错误 (400-xxx)
  AUTHENTICATION_FAILED: '400001',
  AUTHORIZATION_FAILED: '400002',
  TOKEN_EXPIRED: '400003',
  SIGNATURE_VERIFICATION_FAILED: '400004',
  IP_RESTRICTED: '400005',
  RATE_LIMITED: '400006',
  
  // 数据安全错误 (401-xxx)
  SENSITIVE_DATA_ACCESS_DENIED: '401001',
  DATA_ENCRYPTION_FAILED: '401002',
  DATA_DECRYPTION_FAILED: '401003'
} as const;
```

### 错误码使用示例

```typescript
import { BUSINESS_ERROR_CODES, createErrorResponse } from '@sker/constants';

// 创建标准错误响应
function handleUserNotFound(userId: string) {
  throw createErrorResponse({
    code: BUSINESS_ERROR_CODES.USER_NOT_FOUND,
    message: `用户不存在: ${userId}`,
    details: [
      {
        field: 'userId',
        error_code: 'INVALID_VALUE',
        error_message: '提供的用户ID无效'
      }
    ]
  });
}

// 错误码检查
function isUserRelatedError(errorCode: string): boolean {
  return errorCode.startsWith('201');
}
```

## 服务发现常量

### 服务状态和配置

```typescript
import { 
  SERVICE_STATUS,
  LOAD_BALANCE_STRATEGIES,
  DEFAULT_PORTS,
  HEALTH_CHECK_CONFIG 
} from '@sker/constants';

// 服务状态
export const SERVICE_STATUS = {
  UNKNOWN: 0,
  HEALTHY: 1,
  UNHEALTHY: 2,
  MAINTENANCE: 3,
  STARTING: 4,
  STOPPING: 5
} as const;

// 负载均衡策略
export const LOAD_BALANCE_STRATEGIES = {
  ROUND_ROBIN: 'round_robin',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  RANDOM: 'random',
  CONSISTENT_HASHING: 'consistent_hashing',
  IP_HASH: 'ip_hash'
} as const;

// 默认端口配置
export const DEFAULT_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  GRPC: 50051,
  WEBSOCKET: 8080,
  WEBSOCKET_SECURE: 8443,
  REDIS: 6379,
  MYSQL: 3306,
  POSTGRESQL: 5432,
  MONGODB: 27017,
  ELASTICSEARCH: 9200
} as const;

// 健康检查配置
export const HEALTH_CHECK_CONFIG = {
  DEFAULT_INTERVAL: 30000,      // 30秒
  DEFAULT_TIMEOUT: 10000,       // 10秒  
  DEFAULT_RETRIES: 3,           // 3次重试
  DEFAULT_THRESHOLD: 3,         // 连续3次失败才标记为不健康
  STARTUP_GRACE_PERIOD: 60000   // 启动宽限期60秒
} as const;
```

### 使用示例

```typescript
import { 
  SERVICE_STATUS, 
  LOAD_BALANCE_STRATEGIES,
  HEALTH_CHECK_CONFIG 
} from '@sker/constants';

// 服务注册
const serviceInfo = {
  name: 'user-service',
  version: '1.0.0',
  host: 'localhost',
  port: 8080,
  status: SERVICE_STATUS.HEALTHY,
  loadBalanceStrategy: LOAD_BALANCE_STRATEGIES.ROUND_ROBIN,
  healthCheck: {
    endpoint: '/health',
    interval: HEALTH_CHECK_CONFIG.DEFAULT_INTERVAL,
    timeout: HEALTH_CHECK_CONFIG.DEFAULT_TIMEOUT
  }
};

// 检查服务状态
if (service.status === SERVICE_STATUS.HEALTHY) {
  // 服务可用，可以路由请求
  routeRequest(service);
}
```

## 安全认证常量

### 认证和授权

```typescript
import { 
  AUTH_TYPES,
  TOKEN_TYPES,
  PERMISSION_LEVELS,
  CRYPTO_ALGORITHMS 
} from '@sker/constants';

// 认证类型
export const AUTH_TYPES = {
  API_KEY: 'api_key',
  BEARER_TOKEN: 'bearer',
  BASIC: 'basic',
  OAUTH2: 'oauth2',
  JWT: 'jwt',
  MUTUAL_TLS: 'mtls',
  DIGEST: 'digest'
} as const;

// 令牌类型
export const TOKEN_TYPES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  ID_TOKEN: 'id_token',
  API_KEY: 'api_key'
} as const;

// 权限级别
export const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin'
} as const;

// 加密算法
export const CRYPTO_ALGORITHMS = {
  // 对称加密
  AES_128_GCM: 'aes-128-gcm',
  AES_256_GCM: 'aes-256-gcm',
  
  // 非对称加密
  RSA_2048: 'rsa-2048',
  RSA_4096: 'rsa-4096',
  ECDSA_P256: 'ecdsa-p256',
  ECDSA_P384: 'ecdsa-p384',
  
  // 哈希算法
  SHA256: 'sha256',
  SHA512: 'sha512',
  BCRYPT: 'bcrypt',
  SCRYPT: 'scrypt'
} as const;
```

### JWT相关常量

```typescript
import { JWT_CLAIMS, JWT_ALGORITHMS } from '@sker/constants';

// JWT标准声明
export const JWT_CLAIMS = {
  ISSUER: 'iss',              // 颁发者
  SUBJECT: 'sub',             // 主题
  AUDIENCE: 'aud',            // 受众
  EXPIRATION: 'exp',          // 过期时间
  NOT_BEFORE: 'nbf',          // 不早于时间
  ISSUED_AT: 'iat',           // 颁发时间
  JWT_ID: 'jti',              // JWT ID
  
  // 自定义声明
  ROLES: 'roles',             // 角色
  PERMISSIONS: 'permissions', // 权限
  TENANT_ID: 'tenant_id',     // 租户ID
  USER_ID: 'user_id',         // 用户ID
  CLIENT_ID: 'client_id'      // 客户端ID
} as const;

// JWT算法
export const JWT_ALGORITHMS = {
  HS256: 'HS256',             // HMAC SHA256
  HS384: 'HS384',             // HMAC SHA384  
  HS512: 'HS512',             // HMAC SHA512
  RS256: 'RS256',             // RSA SHA256
  RS384: 'RS384',             // RSA SHA384
  RS512: 'RS512',             // RSA SHA512
  ES256: 'ES256',             // ECDSA SHA256
  ES384: 'ES384',             // ECDSA SHA384
  ES512: 'ES512'              // ECDSA SHA512
} as const;
```

## 监控和日志常量

### 日志级别和格式

```typescript
import { 
  LOG_LEVELS,
  METRIC_TYPES,
  TRACE_HEADERS 
} from '@sker/constants';

// 日志级别
export const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
} as const;

// 指标类型
export const METRIC_TYPES = {
  COUNTER: 'counter',         // 计数器
  GAUGE: 'gauge',             // 仪表盘
  HISTOGRAM: 'histogram',     // 直方图
  SUMMARY: 'summary',         // 摘要
  TIMER: 'timer'              // 计时器
} as const;

// 追踪头部
export const TRACE_HEADERS = {
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  PARENT_SPAN_ID: 'x-parent-span-id',
  TRACE_FLAGS: 'x-trace-flags',
  BAGGAGE: 'baggage'
} as const;
```

## 时间和重试常量

### 超时和重试配置

```typescript
import { 
  DEFAULT_TIMEOUTS,
  RETRY_STRATEGIES,
  TIME_UNITS 
} from '@sker/constants';

// 默认超时配置
export const DEFAULT_TIMEOUTS = {
  CONNECTION: 5000,           // 连接超时5秒
  REQUEST: 30000,             // 请求超时30秒
  READ: 60000,                // 读取超时60秒
  WRITE: 10000,               // 写入超时10秒
  IDLE: 300000,               // 空闲超时5分钟
  HEALTH_CHECK: 10000         // 健康检查超时10秒
} as const;

// 重试策略
export const RETRY_STRATEGIES = {
  FIXED_DELAY: 'fixed_delay',
  EXPONENTIAL_BACKOFF: 'exponential_backoff',
  LINEAR_BACKOFF: 'linear_backoff',
  RANDOM_JITTER: 'random_jitter'
} as const;

// 时间单位
export const TIME_UNITS = {
  MILLISECOND: 1,
  SECOND: 1000,
  MINUTE: 60000,
  HOUR: 3600000,
  DAY: 86400000,
  WEEK: 604800000
} as const;
```

## 配置和环境常量

### 环境和配置

```typescript
import { 
  ENVIRONMENTS,
  CONFIG_SOURCES,
  DEFAULT_LIMITS 
} from '@sker/constants';

// 环境类型
export const ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  TESTING: 'testing',
  STAGING: 'staging',
  PRODUCTION: 'production'
} as const;

// 配置源
export const CONFIG_SOURCES = {
  ENVIRONMENT: 'env',
  FILE: 'file',
  REMOTE: 'remote',
  DATABASE: 'database',
  CONSUL: 'consul',
  ETCD: 'etcd'
} as const;

// 默认限制
export const DEFAULT_LIMITS = {
  MAX_REQUEST_SIZE: 10485760,     // 10MB
  MAX_RESPONSE_SIZE: 10485760,    // 10MB
  MAX_CONNECTIONS: 1000,          // 最大连接数
  MAX_CONCURRENT_REQUESTS: 100,   // 最大并发请求
  RATE_LIMIT_PER_MINUTE: 1000,    // 每分钟限制数
  MAX_RETRY_ATTEMPTS: 3,          // 最大重试次数
  MAX_BATCH_SIZE: 100             // 最大批处理大小
} as const;
```

## 工具函数

### 常量验证和转换

```typescript
import { 
  isValidProtocol,
  isValidErrorCode,
  getErrorCategory,
  formatErrorCode 
} from '@sker/constants';

// 协议验证
const isValid = isValidProtocol('http');        // true
const isInvalid = isValidProtocol('invalid');   // false

// 错误码验证
const isValidError = isValidErrorCode('201001');  // true
const category = getErrorCategory('201001');      // 'business'

// 错误码格式化
const formatted = formatErrorCode({
  category: 'business',
  subcategory: 'user',
  error: '001'
}); // '201001'
```

### 常量枚举转换

```typescript
import { 
  protocolToString,
  stringToProtocol,
  statusToNumber,
  numberToStatus 
} from '@sker/constants';

// 协议转换
const protocolStr = protocolToString(PROTOCOL_TYPES.GRPC);  // 'grpc'
const protocol = stringToProtocol('grpc');                   // PROTOCOL_TYPES.GRPC

// 状态转换
const statusNum = statusToNumber(SERVICE_STATUS.HEALTHY);    // 1
const status = numberToStatus(1);                            // SERVICE_STATUS.HEALTHY
```

## 最佳实践

### 1. 使用类型安全的常量

```typescript
// 推荐：使用常量而不是魔法字符串
import { PROTOCOL_TYPES, HTTP_METHODS } from '@sker/constants';

const config = {
  protocol: PROTOCOL_TYPES.HTTPS,  // 而不是 'https'
  method: HTTP_METHODS.POST        // 而不是 'POST'
};

// 类型安全检查
function isHttpProtocol(protocol: string): protocol is 'http' | 'https' {
  return protocol === PROTOCOL_TYPES.HTTP || protocol === PROTOCOL_TYPES.HTTPS;
}
```

### 2. 错误处理标准化

```typescript
// 推荐：使用标准错误码
import { BUSINESS_ERROR_CODES } from '@sker/constants';

function validateUser(user: User) {
  if (!user.id) {
    throw new Error(BUSINESS_ERROR_CODES.USER_NOT_FOUND);
  }
  
  if (user.age < 0) {
    throw new Error(BUSINESS_ERROR_CODES.BUSINESS_RULE_VIOLATION);
  }
}
```

### 3. 配置管理

```typescript
// 推荐：使用环境常量
import { ENVIRONMENTS, DEFAULT_TIMEOUTS } from '@sker/constants';

const config = {
  environment: process.env.NODE_ENV || ENVIRONMENTS.DEVELOPMENT,
  timeout: parseInt(process.env.TIMEOUT) || DEFAULT_TIMEOUTS.REQUEST,
  retries: parseInt(process.env.RETRIES) || 3
};

// 环境特定配置
if (config.environment === ENVIRONMENTS.PRODUCTION) {
  // 生产环境特定设置
  config.logLevel = LOG_LEVELS.WARN;
} else {
  // 开发环境设置
  config.logLevel = LOG_LEVELS.DEBUG;
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/constants)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的常量定义包。更多信息请访问 [Sker官网](https://sker.dev)