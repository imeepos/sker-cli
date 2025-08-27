# @sker/types

Sker通用类型定义包，提供跨语言类型映射和统一数据类型定义。

## 概述

`@sker/types` 包含了Sker通信框架中所有核心类型定义，实现了跨语言跨进程跨端通信标准中定义的统一数据类型映射。该包为整个Sker生态系统提供类型安全保障和跨语言互操作性。

## 功能特性

### 🔷 核心类型系统
- **基础类型映射**: 跨语言基础数据类型统一定义
- **复合类型支持**: 数组、对象、映射等复合类型
- **特殊类型处理**: 时间戳、高精度数值等特殊类型
- **类型验证**: 运行时类型检查和验证

### 🌐 跨语言支持
- **多语言映射**: 支持Java、Python、JavaScript、Go、Rust、C#等
- **序列化兼容**: 与Protocol Buffers、JSON、MessagePack兼容
- **版本兼容**: 向前向后兼容的类型演进
- **类型转换**: 自动类型转换和适配

### 📋 通信协议类型
- **消息格式**: UDEF标准消息结构类型
- **错误类型**: 标准化错误响应类型
- **服务元数据**: 服务发现和注册相关类型
- **认证授权**: 安全认证相关类型定义

## 安装

```bash
npm install @sker/types
# 或者
pnpm add @sker/types
# 或者
yarn add @sker/types
```

## 基础类型

### 跨语言基础类型映射

```typescript
import { 
  SkerBoolean, 
  SkerInteger, 
  SkerFloat, 
  SkerString,
  SkerTimestamp,
  SkerDecimal 
} from '@sker/types';

// 布尔类型 - 映射到各语言的布尔类型
type Bool = SkerBoolean; // boolean in JS, bool in Go/Rust, boolean in Java

// 整数类型 - 统一使用64位整数
type Int = SkerInteger; // number in JS, int64 in Go, Long in Java, i64 in Rust

// 浮点数类型 - 统一使用双精度浮点数
type Float = SkerFloat; // number in JS, float64 in Go, Double in Java, f64 in Rust

// 字符串类型 - UTF-8编码字符串
type Str = SkerString; // string in JS/Go/Rust, String in Java/C#

// 时间戳类型 - ISO8601格式时间戳
type Timestamp = SkerTimestamp; // Date in JS, time.Time in Go, Instant in Java

// 高精度数值类型 - 用于货币计算等
type Decimal = SkerDecimal; // string in JS, decimal.Decimal in Go, BigDecimal in Java
```

### 集合类型

```typescript
import { SkerArray, SkerMap, SkerSet } from '@sker/types';

// 数组类型
type UserList = SkerArray<User>; // Array<User> in JS, []User in Go, List<User> in Java

// 映射类型
type UserMap = SkerMap<string, User>; // Map<string, User> in JS, map[string]User in Go

// 集合类型
type UserSet = SkerSet<string>; // Set<string> in JS, map[string]struct{} in Go
```

## 通信协议类型

### UDEF消息格式

```typescript
import { UDEFMessage, MessageEnvelope, MessagePayload } from '@sker/types';

// 标准UDEF消息结构
interface Message extends UDEFMessage {
  envelope: MessageEnvelope;
  payload: MessagePayload;
}

// 消息信封
interface Envelope extends MessageEnvelope {
  header: {
    message_id: string;          // UUID格式消息ID
    correlation_id?: string;     // 关联消息ID
    timestamp: SkerTimestamp;    // 创建时间戳
    source: ServiceInfo;         // 发送方信息
    destination?: ServiceInfo;   // 接收方信息
    content_type: ContentType;   // 内容类型
    message_type: MessageType;   // 消息类型
  };
  metadata: {
    trace_id?: string;           // 分布式追踪ID
    span_id?: string;           // 跨度ID
    priority?: number;          // 消息优先级
    ttl?: number;              // 生存时间
    retry_count?: number;      // 重试次数
    custom_properties?: Record<string, any>; // 自定义属性
  };
}

// 消息载荷
interface Payload extends MessagePayload {
  data: any;                    // 实际业务数据
  schema_version: string;       // 数据模式版本
}
```

### 错误响应类型

```typescript
import { ErrorResponse, ErrorDetail, ResultStatus } from '@sker/types';

// 标准错误响应格式
interface StandardErrorResponse extends ErrorResponse {
  success: false;
  error: {
    code: string;               // 错误码
    message: string;            // 错误信息
    details?: ErrorDetail[];    // 错误详情
    trace_id?: string;         // 追踪ID
    timestamp: SkerTimestamp;   // 错误时间
    help_url?: string;         // 帮助链接
  };
  metadata: {
    request_id?: string;        // 请求ID
    api_version: string;        // API版本
    processing_time_ms: number; // 处理时间
  };
}

// 错误详情
interface ErrorDetail {
  field?: string;             // 字段名
  error_code: string;         // 具体错误码
  error_message: string;      // 错误描述
  context?: Record<string, any>; // 错误上下文
}
```

### 服务相关类型

```typescript
import { 
  ServiceInfo, 
  ServiceRegistry, 
  HealthStatus,
  LoadBalanceStrategy 
} from '@sker/types';

// 服务信息
interface Service extends ServiceInfo {
  service_name: string;        // 服务名称
  service_version: string;     // 服务版本
  service_id: string;         // 服务实例ID
  network_info: {
    host: string;             // 主机地址
    port: number;             // 端口号
    protocol: Protocol;       // 协议类型
    base_path?: string;       // 基础路径
  };
  health_status: HealthStatus; // 健康状态
  metadata: Record<string, string>; // 元数据
  tags: string[];             // 标签
  capabilities: string[];     // 能力列表
}

// 健康状态枚举
enum HealthStatus {
  UNKNOWN = 0,
  HEALTHY = 1,
  UNHEALTHY = 2,
  MAINTENANCE = 3
}

// 协议类型枚举
enum Protocol {
  UNKNOWN = 'unknown',
  HTTP = 'http',
  HTTPS = 'https',
  GRPC = 'grpc',
  WEBSOCKET = 'websocket',
  TCP = 'tcp',
  UDP = 'udp'
}
```

## 认证授权类型

```typescript
import { 
  AuthenticationInfo, 
  AuthorizationToken,
  UserPrincipal,
  Permission,
  Role 
} from '@sker/types';

// JWT令牌结构
interface JWTToken extends AuthorizationToken {
  header: {
    alg: string;              // 算法
    typ: 'JWT';              // 类型
  };
  payload: {
    iss: string;              // 颁发者
    sub: string;              // 主体(用户ID)
    aud: string;              // 受众
    exp: number;              // 过期时间
    nbf: number;              // 不早于时间
    iat: number;              // 颁发时间
    jti: string;              // JWT ID
    // 自定义声明
    roles?: string[];         // 用户角色
    permissions?: string[];   // 用户权限
    tenant_id?: string;      // 租户ID
  };
  signature: string;          // 签名
}

// 用户主体
interface User extends UserPrincipal {
  user_id: string;           // 用户ID
  username: string;          // 用户名
  email?: string;           // 邮箱
  roles: Role[];            // 角色列表
  permissions: Permission[]; // 权限列表
  metadata: Record<string, any>; // 用户元数据
}

// 权限定义
interface Permission {
  resource: string;          // 资源
  action: string;           // 操作
  conditions?: Record<string, any>; // 条件
}

// 角色定义
interface Role {
  role_id: string;          // 角色ID
  role_name: string;        // 角色名称
  permissions: Permission[]; // 权限列表
  description?: string;     // 描述
}
```

## 类型工具函数

### 类型检查

```typescript
import { 
  isValidMessage, 
  isValidTimestamp, 
  isValidServiceInfo,
  validateType 
} from '@sker/types';

// 消息格式验证
if (isValidMessage(message)) {
  // 消息格式正确
  processMessage(message);
}

// 时间戳验证
if (isValidTimestamp(timestamp)) {
  // 时间戳格式正确
  processTimestamp(timestamp);
}

// 服务信息验证
if (isValidServiceInfo(serviceInfo)) {
  // 服务信息格式正确
  registerService(serviceInfo);
}

// 通用类型验证
const result = validateType(data, UserSchema);
if (result.valid) {
  // 数据类型正确
  processUser(data as User);
} else {
  // 处理验证错误
  console.error(result.errors);
}
```

### 类型转换

```typescript
import { 
  convertToProtobuf, 
  convertFromProtobuf,
  convertToJSON,
  serializeMessage,
  deserializeMessage 
} from '@sker/types';

// 转换为Protocol Buffers格式
const pbMessage = convertToProtobuf(message);

// 从Protocol Buffers格式转换
const jsMessage = convertFromProtobuf(pbMessage);

// 序列化消息
const serialized = serializeMessage(message, 'json');

// 反序列化消息
const deserialized = deserializeMessage(serialized, 'json');
```

### 类型工厂

```typescript
import { 
  createMessage, 
  createErrorResponse,
  createServiceInfo,
  createJWTToken 
} from '@sker/types';

// 创建标准消息
const message = createMessage({
  type: 'request',
  service: 'user-service',
  method: 'getUserById',
  data: { userId: '123' }
});

// 创建错误响应
const errorResponse = createErrorResponse({
  code: '404001',
  message: 'User not found',
  details: [{ field: 'userId', error_code: 'INVALID_VALUE' }]
});

// 创建服务信息
const serviceInfo = createServiceInfo({
  name: 'user-service',
  version: '1.0.0',
  host: 'localhost',
  port: 8080,
  protocol: Protocol.HTTP
});
```

## 配置类型

```typescript
import { 
  ConfigSchema, 
  DatabaseConfig,
  ServerConfig,
  SecurityConfig 
} from '@sker/types';

// 配置模式定义
const configSchema: ConfigSchema = {
  server: {
    type: 'object',
    properties: {
      port: { type: 'number', default: 3000 },
      host: { type: 'string', default: '0.0.0.0' }
    }
  },
  database: {
    type: 'object',
    properties: {
      url: { type: 'string', required: true },
      maxConnections: { type: 'number', default: 10 }
    }
  }
};

// 类型安全的配置
interface AppConfig {
  server: ServerConfig;
  database: DatabaseConfig;
  security: SecurityConfig;
}
```

## TypeScript 集成

### 严格类型检查

```typescript
// 启用严格的类型检查
import { StrictTypeChecker } from '@sker/types';

const checker = new StrictTypeChecker();

// 编译时类型检查
type ValidatedUser = StrictTypeChecker.Validate<User, UserSchema>;

// 运行时类型断言
function assertUser(data: unknown): asserts data is User {
  if (!checker.isValid(data, UserSchema)) {
    throw new TypeError('Invalid user data');
  }
}
```

### 泛型支持

```typescript
// 泛型消息类型
interface TypedMessage<T> extends UDEFMessage {
  payload: {
    data: T;
    schema_version: string;
  };
}

// 类型安全的服务调用
interface TypedService<TRequest, TResponse> {
  call(request: TRequest): Promise<TResponse>;
}

// 使用示例
const userService: TypedService<GetUserRequest, GetUserResponse> = createService();
const user = await userService.call({ userId: '123' });
```

## 最佳实践

### 1. 类型定义

```typescript
// 推荐：使用接口定义复杂类型
interface User {
  id: SkerString;
  name: SkerString;
  email: SkerString;
  createdAt: SkerTimestamp;
  metadata?: Record<string, any>;
}

// 避免：使用any类型
// const user: any = getUserData();
```

### 2. 版本兼容

```typescript
// 使用版本化的类型定义
interface UserV1 {
  id: string;
  name: string;
}

interface UserV2 extends UserV1 {
  email: string; // 新增字段
  phone?: string; // 可选字段
}

// 类型迁移函数
function migrateUserV1ToV2(userV1: UserV1): UserV2 {
  return {
    ...userV1,
    email: `${userV1.id}@example.com` // 默认值
  };
}
```

### 3. 错误处理

```typescript
// 使用联合类型处理成功/错误情况
type ServiceResult<T> = 
  | { success: true; data: T }
  | { success: false; error: ErrorResponse };

async function getUserById(id: string): Promise<ServiceResult<User>> {
  try {
    const user = await fetchUser(id);
    return { success: true, data: user };
  } catch (error) {
    return { 
      success: false, 
      error: createErrorResponse({ 
        code: '404001', 
        message: 'User not found' 
      }) 
    };
  }
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/types)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的类型定义包。更多信息请访问 [Sker官网](https://sker.dev)