# @sker/data-udef

Sker统一数据交换格式(UDEF)实现包，提供跨语言数据序列化和标准消息格式。

## 概述

`@sker/data-udef` 是Sker通信框架的数据格式包，实现了跨语言跨进程跨端通信标准中定义的统一数据交换格式(Unified Data Exchange Format, UDEF)。该包提供了标准化的消息结构、跨语言类型映射和多种序列化方案，确保不同语言和平台之间的数据交换兼容性。

## 功能特性

### 📋 标准消息格式
- **统一消息结构**: Header + Payload 的标准化消息格式
- **元数据管理**: 丰富的消息元数据和上下文信息
- **版本控制**: 向后兼容的消息版本管理
- **消息追踪**: 分布式链路追踪支持

### 🔄 跨语言类型映射
- **基础类型**: string、number、boolean、null 的统一映射
- **复合类型**: object、array、map 的跨语言支持  
- **特殊类型**: date、binary、decimal 的标准化处理
- **自定义类型**: 用户定义类型的扩展支持

### 🔧 多格式序列化
- **JSON**: 人类可读的文本格式
- **Protocol Buffers**: 高性能二进制格式
- **MessagePack**: 紧凑的二进制格式
- **Avro**: Schema演进友好的格式

### ✅ 数据验证
- **Schema验证**: 基于JSON Schema的数据验证
- **类型检查**: 严格的类型约束检查
- **约束验证**: 自定义业务规则验证
- **错误报告**: 详细的验证错误信息

### 🛠️ 数据转换
- **格式转换**: 不同序列化格式间的转换
- **版本迁移**: 消息版本间的自动迁移
- **压缩处理**: 数据压缩和解压缩
- **编码转换**: 字符编码的统一处理

## 安装

```bash
npm install @sker/data-udef
# 或者
pnpm add @sker/data-udef
# 或者
yarn add @sker/data-udef
```

## 基础用法

### 创建UDEF消息

```typescript
import { UDEFMessage, MessageHeader, MessagePayload } from '@sker/data-udef';

// 创建消息头
const header: MessageHeader = {
  // 消息标识
  messageId: '12345678-1234-1234-1234-123456789abc',
  
  // 消息类型
  messageType: 'USER_CREATED',
  
  // 版本信息
  version: '1.0.0',
  
  // 时间戳
  timestamp: new Date().toISOString(),
  
  // 发送者信息
  sender: {
    serviceId: 'user-service',
    instanceId: 'user-service-001',
    version: '1.2.0'
  },
  
  // 接收者信息
  receiver: {
    serviceId: 'notification-service',
    topic: 'user.events'
  },
  
  // 链路追踪
  tracing: {
    traceId: 'trace-12345',
    spanId: 'span-67890',
    parentSpanId: 'span-54321'
  },
  
  // 元数据
  metadata: {
    priority: 'high',
    retry_count: 0,
    ttl: 300000  // 5分钟TTL
  }
};

// 创建消息载荷
const payload: MessagePayload = {
  data: {
    userId: '12345',
    userName: 'john_doe',
    email: 'john@example.com',
    profile: {
      firstName: 'John',
      lastName: 'Doe',
      age: 28,
      tags: ['developer', 'typescript']
    }
  },
  
  // 数据Schema
  schema: {
    type: 'object',
    properties: {
      userId: { type: 'string' },
      userName: { type: 'string' },
      email: { type: 'string', format: 'email' },
      profile: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          age: { type: 'number', minimum: 0 },
          tags: { type: 'array', items: { type: 'string' } }
        }
      }
    },
    required: ['userId', 'userName', 'email']
  }
};

// 创建UDEF消息
const message = new UDEFMessage(header, payload);

console.log('UDEF消息:', message.toObject());
```

### 消息序列化

```typescript
import { JSONSerializer, ProtobufSerializer, MessagePackSerializer } from '@sker/data-udef';

// JSON序列化
const jsonSerializer = new JSONSerializer({
  pretty: true,        // 格式化输出
  compression: true,   // 启用压缩
  validate: true      // 启用验证
});

// 序列化为JSON
const jsonBytes = await jsonSerializer.serialize(message);
console.log('JSON大小:', jsonBytes.length);

// 反序列化
const deserializedMessage = await jsonSerializer.deserialize(jsonBytes);
console.log('反序列化成功:', deserializedMessage.header.messageId);

// Protocol Buffers序列化
const protobufSerializer = new ProtobufSerializer({
  schemaRegistry: 'http://schema-registry:8081',
  compression: 'gzip'
});

const protobufBytes = await protobufSerializer.serialize(message);
console.log('Protobuf大小:', protobufBytes.length);

// MessagePack序列化
const msgpackSerializer = new MessagePackSerializer({
  useTypedArrays: true
});

const msgpackBytes = await msgpackSerializer.serialize(message);
console.log('MessagePack大小:', msgpackBytes.length);
```

### Schema注册和验证

```typescript
import { SchemaRegistry, SchemaValidator } from '@sker/data-udef';

// 创建Schema注册表
const schemaRegistry = new SchemaRegistry({
  backend: 'redis',
  connection: {
    host: 'localhost',
    port: 6379
  },
  
  // Schema版本策略
  versionStrategy: 'semantic',
  
  // 兼容性检查
  compatibility: 'backward'
});

// 注册消息Schema
const schemaId = await schemaRegistry.register('user.created', {
  version: '1.0.0',
  schema: {
    type: 'object',
    properties: {
      userId: { type: 'string', pattern: '^[0-9]+$' },
      userName: { type: 'string', minLength: 3, maxLength: 50 },
      email: { type: 'string', format: 'email' },
      profile: {
        type: 'object',
        properties: {
          firstName: { type: 'string', minLength: 1 },
          lastName: { type: 'string', minLength: 1 },
          age: { type: 'number', minimum: 0, maximum: 150 }
        },
        required: ['firstName', 'lastName']
      }
    },
    required: ['userId', 'userName', 'email']
  }
});

// 创建验证器
const validator = new SchemaValidator(schemaRegistry);

// 验证消息
try {
  const validationResult = await validator.validate(message);
  console.log('验证通过:', validationResult.valid);
} catch (error) {
  console.error('验证失败:', error.details);
}
```

### 跨语言类型映射

```typescript
import { CrossLanguageTransformer, TypeMapper } from '@sker/data-udef';

// 创建类型映射器
const typeMapper = new TypeMapper({
  // 目标语言
  targetLanguage: 'java',
  
  // 自定义类型映射
  customMappings: {
    'timestamp': 'java.time.Instant',
    'decimal': 'java.math.BigDecimal',
    'uuid': 'java.util.UUID'
  },
  
  // 命名约定
  namingConvention: {
    property: 'camelCase',    // 属性命名
    class: 'PascalCase',      // 类命名
    constant: 'UPPER_SNAKE'   // 常量命名
  }
});

// 创建跨语言转换器
const transformer = new CrossLanguageTransformer([typeMapper]);

// 转换数据
const javaObject = await transformer.transform(message.payload.data, {
  from: 'typescript',
  to: 'java'
});

console.log('Java对象:', javaObject);

// 生成类型定义
const javaClass = await transformer.generateTypeDefinition(message.payload.schema, {
  language: 'java',
  className: 'UserCreatedEvent',
  package: 'com.example.events'
});

console.log('Java类定义:', javaClass);
```

### 版本管理

```typescript
import { VersionTransformer, MigrationRule } from '@sker/data-udef';

// 定义迁移规则
const migrationRules: MigrationRule[] = [
  {
    from: '1.0.0',
    to: '1.1.0',
    rules: [
      {
        type: 'add_field',
        path: 'profile.middleName',
        default: null
      },
      {
        type: 'rename_field',
        from: 'profile.age',
        to: 'profile.birthYear',
        transform: (age: number) => new Date().getFullYear() - age
      }
    ]
  },
  {
    from: '1.1.0',
    to: '2.0.0',
    rules: [
      {
        type: 'remove_field',
        path: 'deprecated_field'
      },
      {
        type: 'restructure',
        transform: (data: any) => ({
          ...data,
          contact: {
            email: data.email,
            phone: data.phone
          }
        })
      }
    ]
  }
];

// 创建版本转换器
const versionTransformer = new VersionTransformer(migrationRules);

// 升级消息版本
const upgradedMessage = await versionTransformer.upgrade(message, '2.0.0');
console.log('升级后的消息:', upgradedMessage);

// 降级消息版本
const downgradedMessage = await versionTransformer.downgrade(upgradedMessage, '1.0.0');
console.log('降级后的消息:', downgradedMessage);
```

## 高级用法

### 自定义序列化器

```typescript
import { BaseSerializer, SerializationOptions } from '@sker/data-udef';

class CustomSerializer extends BaseSerializer {
  constructor(options?: SerializationOptions) {
    super('custom', options);
  }
  
  async serialize(message: UDEFMessage): Promise<Uint8Array> {
    // 自定义序列化逻辑
    const data = {
      header: message.header,
      payload: message.payload
    };
    
    // 应用压缩
    const jsonString = JSON.stringify(data);
    const compressed = await this.compress(jsonString);
    
    // 添加魔数和版本
    const result = new Uint8Array(compressed.length + 8);
    const view = new DataView(result.buffer);
    
    view.setUint32(0, 0x534B4552);  // 'SKER'魔数
    view.setUint32(4, 1);           // 版本号
    result.set(compressed, 8);
    
    return result;
  }
  
  async deserialize(data: Uint8Array): Promise<UDEFMessage> {
    // 验证魔数
    const view = new DataView(data.buffer);
    const magic = view.getUint32(0);
    const version = view.getUint32(4);
    
    if (magic !== 0x534B4552) {
      throw new Error('无效的数据格式');
    }
    
    // 解压缩数据
    const compressed = data.slice(8);
    const jsonString = await this.decompress(compressed);
    const parsed = JSON.parse(jsonString);
    
    return new UDEFMessage(parsed.header, parsed.payload);
  }
}

// 使用自定义序列化器
const customSerializer = new CustomSerializer({
  compression: 'brotli',
  validate: true
});
```

### 消息中间件集成

```typescript
import { MessageMiddleware, MiddlewareContext } from '@sker/data-udef';

// 加密中间件
const encryptionMiddleware: MessageMiddleware = async (
  message: UDEFMessage, 
  context: MiddlewareContext,
  next: Function
) => {
  // 加密敏感数据
  if (message.header.metadata?.encrypted) {
    const encryptedPayload = await encryptPayload(message.payload);
    message.payload = encryptedPayload;
    
    // 添加加密标记
    message.header.metadata.encryptionAlgorithm = 'AES-256-GCM';
  }
  
  return await next();
};

// 压缩中间件
const compressionMiddleware: MessageMiddleware = async (
  message: UDEFMessage,
  context: MiddlewareContext,
  next: Function
) => {
  const originalSize = JSON.stringify(message.payload).length;
  
  if (originalSize > 1024) {  // 大于1KB才压缩
    message.payload = await compressPayload(message.payload);
    message.header.metadata.compressed = true;
    message.header.metadata.originalSize = originalSize;
  }
  
  return await next();
};

// 应用中间件
const processor = new MessageProcessor([
  encryptionMiddleware,
  compressionMiddleware
]);

const processedMessage = await processor.process(message);
```

### 性能优化

```typescript
import { MessagePool, SerializationCache } from '@sker/data-udef';

// 对象池，避免频繁创建对象
const messagePool = new MessagePool({
  initialSize: 100,
  maxSize: 1000,
  factory: () => new UDEFMessage()
});

// 从对象池获取消息实例
const message = messagePool.acquire();
message.initialize(header, payload);

// 使用完毕后归还
messagePool.release(message);

// 序列化缓存
const cache = new SerializationCache({
  maxSize: 1000,
  ttl: 300000,  // 5分钟TTL
  algorithm: 'lru'
});

// 带缓存的序列化
const cachedSerializer = new JSONSerializer({
  cache: cache
});

const serializedData = await cachedSerializer.serialize(message);
```

## 配置选项

### 序列化配置

```typescript
const serializationConfig = {
  // JSON配置
  json: {
    pretty: false,           // 是否格式化输出
    compression: 'gzip',     // 压缩算法: 'gzip' | 'brotli' | 'deflate'
    validate: true,          // 是否验证Schema
    maxDepth: 32,           // 最大嵌套深度
    maxSize: 10 * 1024 * 1024  // 最大10MB
  },
  
  // Protocol Buffers配置
  protobuf: {
    schemaRegistry: 'http://localhost:8081',
    compression: 'snappy',
    useReflection: false,
    keepFieldNames: true
  },
  
  // MessagePack配置
  messagepack: {
    useTypedArrays: true,
    useBinaryString: false,
    extensionCodec: customExtensionCodec
  }
};
```

### 验证配置

```typescript
const validationConfig = {
  // 严格模式
  strict: true,
  
  // 允许的额外属性
  allowAdditionalProperties: false,
  
  // 自定义验证器
  customValidators: {
    'email': (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'phone': (value: string) => /^\+?[\d\s-()]+$/.test(value)
  },
  
  // 错误格式
  errorFormat: 'detailed',  // 'simple' | 'detailed' | 'json-schema'
  
  // 异步验证超时
  asyncTimeout: 5000
};
```

## 最佳实践

### 1. 消息设计原则

```typescript
// ✅ 推荐：使用明确的消息类型
const goodMessage = new UDEFMessage({
  messageType: 'USER_PROFILE_UPDATED',
  version: '1.0.0',
  // ...
}, {
  data: {
    userId: '12345',
    updatedFields: ['email', 'profile.firstName'],
    newValues: {
      email: 'new@example.com',
      'profile.firstName': 'Jane'
    }
  }
});

// ❌ 避免：模糊的消息类型
const badMessage = new UDEFMessage({
  messageType: 'DATA_CHANGED',  // 太模糊
  // ...
}, {
  data: {
    // 结构不清晰
    stuff: { /* ... */ }
  }
});
```

### 2. Schema版本管理

```typescript
// ✅ 推荐：语义化版本控制
const schemaVersioning = {
  // 主版本：不兼容的API更改
  major: {
    version: '2.0.0',
    breaking_changes: ['removed_field', 'changed_type']
  },
  
  // 次版本：向后兼容的功能性新增
  minor: {
    version: '1.1.0',
    new_features: ['optional_field', 'new_enum_value']
  },
  
  // 修订版本：向后兼容的问题修正
  patch: {
    version: '1.0.1',
    bug_fixes: ['validation_fix', 'default_value_fix']
  }
};
```

### 3. 性能优化建议

```typescript
// ✅ 推荐：合理使用压缩
const compressionStrategy = {
  // 小消息不压缩
  threshold: 1024,  // 1KB
  
  // 根据数据类型选择算法
  algorithm: (data: any) => {
    if (typeof data === 'string') return 'gzip';
    if (data instanceof Uint8Array) return 'lz4';
    return 'brotli';  // 默认
  }
};

// ✅ 推荐：使用批处理
const batchProcessor = new MessageBatchProcessor({
  batchSize: 100,
  flushInterval: 1000,  // 1秒
  
  processor: async (messages: UDEFMessage[]) => {
    // 批量处理消息
    return await processBatch(messages);
  }
});
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/data-udef)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的统一数据交换格式包。更多信息请访问 [Sker官网](https://sker.dev)