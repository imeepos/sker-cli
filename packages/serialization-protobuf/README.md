# @sker/serialization-protobuf

Sker Protocol Buffers序列化器实现包，提供高性能二进制序列化功能。

## 概述

`@sker/serialization-protobuf` 是Sker通信框架的Protocol Buffers序列化包，提供了高性能、跨语言兼容的二进制序列化解决方案。该包实现了Google Protocol Buffers标准，支持Schema管理、代码生成、优化压缩等企业级功能，是微服务架构中数据交换的理想选择。

## 功能特性

### 🚀 高性能二进制序列化
- **极致性能**: 比JSON快5-10倍的序列化速度
- **紧凑格式**: 比JSON小60-80%的数据体积
- **零拷贝**: 支持零拷贝反序列化优化
- **流式处理**: 大数据流式序列化支持

### 🌍 跨语言兼容
- **多语言支持**: Java、Python、Go、Rust、C#等
- **版本兼容**: 向前向后兼容的Schema演进
- **标准协议**: 完全兼容Google Protocol Buffers
- **互操作性**: 与gRPC、Apache Kafka等生态无缝集成

### 📋 Schema管理
- **Schema注册表**: 集中式Schema版本管理
- **自动验证**: 数据结构自动验证
- **Schema演进**: 安全的Schema版本升级
- **冲突检测**: Schema兼容性自动检测

### 🔧 代码生成
- **TypeScript生成**: 自动生成强类型定义
- **类型安全**: 编译时类型检查
- **智能提示**: IDE智能代码补全
- **文档生成**: 自动生成API文档

### 🗜️ 压缩优化
- **多种算法**: 支持gzip、lz4、snappy等
- **自适应压缩**: 根据数据特征选择最优算法
- **增量压缩**: 支持增量数据压缩
- **字典压缩**: 自定义压缩字典支持

## 安装

```bash
npm install @sker/serialization-protobuf
# 或者
pnpm add @sker/serialization-protobuf
# 或者
yarn add @sker/serialization-protobuf
```

## 基础用法

### 定义Protocol Buffers Schema

```protobuf
// user.proto
syntax = "proto3";

package sker.example;

message User {
  int64 id = 1;
  string name = 2;
  string email = 3;
  repeated string tags = 4;
  UserProfile profile = 5;
  google.protobuf.Timestamp created_at = 6;
}

message UserProfile {
  string first_name = 1;
  string last_name = 2;
  int32 age = 3;
  string bio = 4;
  map<string, string> metadata = 5;
}

service UserService {
  rpc GetUser(GetUserRequest) returns (User);
  rpc ListUsers(ListUsersRequest) returns (ListUsersResponse);
  rpc CreateUser(CreateUserRequest) returns (User);
  rpc UpdateUser(UpdateUserRequest) returns (User);
}
```

### 基本序列化操作

```typescript
import { ProtobufSerializer, SchemaRegistry } from '@sker/serialization-protobuf';

// 创建Schema注册表
const schemaRegistry = new SchemaRegistry({
  // 注册表后端
  backend: 'file',  // 'file' | 'redis' | 'http'
  
  // 文件后端配置
  file: {
    schemaDir: './schemas',
    autoLoad: true,
    watchChanges: true
  },
  
  // 版本策略
  versionStrategy: 'semantic',
  compatibility: 'backward'
});

// 注册Schema
await schemaRegistry.registerFromFile('user.proto', {
  package: 'sker.example',
  version: '1.0.0'
});

// 创建序列化器
const protobufSerializer = new ProtobufSerializer({
  schemaRegistry,
  
  // 性能配置
  enableCache: true,
  cacheSize: 10000,
  
  // 压缩配置
  compression: {
    algorithm: 'gzip',
    level: 6,
    threshold: 1024  // 大于1KB才压缩
  },
  
  // 验证配置
  validation: {
    strict: true,
    validateOnSerialize: true,
    validateOnDeserialize: true
  }
});

// 创建用户数据
const userData = {
  id: '12345',
  name: 'John Doe',
  email: 'john@example.com',
  tags: ['developer', 'typescript'],
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    age: 28,
    bio: 'Software Engineer',
    metadata: {
      'department': 'Engineering',
      'level': 'Senior'
    }
  },
  createdAt: new Date()
};

try {
  // 序列化
  const serialized = await protobufSerializer.serialize('sker.example.User', userData);
  console.log('序列化成功，大小:', serialized.length, 'bytes');
  
  // 反序列化
  const deserialized = await protobufSerializer.deserialize('sker.example.User', serialized);
  console.log('反序列化结果:', deserialized);
} catch (error) {
  console.error('序列化错误:', error);
}
```

### Schema编译和代码生成

```typescript
import { SchemaCompiler, TypeScriptGenerator } from '@sker/serialization-protobuf';

// 创建Schema编译器
const compiler = new SchemaCompiler({
  // 输入配置
  input: {
    files: ['./schemas/*.proto'],
    importPaths: ['./schemas', './third_party']
  },
  
  // 输出配置
  output: {
    directory: './generated',
    typescript: {
      enabled: true,
      generateInterfaces: true,
      generateClasses: true,
      generateServices: true
    }
  },
  
  // 编译选项
  options: {
    optimizeFor: 'SPEED',        // 'SPEED' | 'CODE_SIZE' | 'LITE_RUNTIME'
    generateDescriptors: true,    // 生成描述符
    includeImports: true         // 包含导入的proto文件
  }
});

// 编译Schema
const compilationResult = await compiler.compile();

if (compilationResult.success) {
  console.log('Schema编译成功');
  console.log('生成的文件:', compilationResult.generatedFiles);
  
  // TypeScript代码生成
  const tsGenerator = new TypeScriptGenerator({
    outputDir: './src/generated',
    
    // 生成选项
    options: {
      useInterfaces: true,          // 使用interface而不是class
      generateValidators: true,     // 生成验证器
      generateConverters: true,     // 生成转换器
      exportStyle: 'named',         // 'named' | 'default' | 'namespace'
      
      // 命名约定
      naming: {
        interface: 'PascalCase',
        property: 'camelCase',
        enum: 'PascalCase'
      }
    }
  });
  
  await tsGenerator.generate(compilationResult.descriptors);
  console.log('TypeScript代码生成完成');
} else {
  console.error('Schema编译失败:', compilationResult.errors);
}
```

### 使用生成的TypeScript代码

```typescript
// 导入生成的类型和序列化器
import { User, UserProfile, UserServiceClient } from './generated/user';
import { ProtobufMessage } from '@sker/serialization-protobuf';

// 创建强类型的用户对象
const user: User = {
  id: 12345n,  // 注意：proto int64映射为JavaScript BigInt
  name: 'John Doe',
  email: 'john@example.com',
  tags: ['developer', 'typescript'],
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    age: 28,
    bio: 'Software Engineer',
    metadata: new Map([
      ['department', 'Engineering'],
      ['level', 'Senior']
    ])
  },
  createdAt: {
    seconds: Math.floor(Date.now() / 1000),
    nanos: (Date.now() % 1000) * 1000000
  }
};

// 使用生成的序列化方法
const message = ProtobufMessage.create(User, user);
const bytes = message.serialize();
console.log('序列化大小:', bytes.length);

// 反序列化
const parsed = ProtobufMessage.parse(User, bytes);
console.log('解析结果:', parsed);

// 验证数据
const validation = message.validate();
if (!validation.valid) {
  console.error('验证失败:', validation.errors);
}
```

### 流式处理大数据

```typescript
import { ProtobufStreamSerializer, StreamingMode } from '@sker/serialization-protobuf';
import { Readable, Writable } from 'stream';

// 创建流式序列化器
const streamSerializer = new ProtobufStreamSerializer({
  schemaRegistry,
  messageType: 'sker.example.User',
  
  // 流配置
  streaming: {
    mode: StreamingMode.DELIMITED,   // 'DELIMITED' | 'LENGTH_PREFIXED' | 'RAW'
    batchSize: 1000,                 // 批处理大小
    compression: 'lz4',              // 流压缩
    
    // 背压控制
    backpressure: {
      highWaterMark: 16 * 1024,      // 16KB
      maxPendingWrites: 10
    }
  }
});

// 序列化流
const users = generateLargeUserDataset(100000);  // 10万用户数据
const sourceStream = Readable.from(users);

const serializeTransform = streamSerializer.createSerializeStream();
const targetStream = new Writable({
  write(chunk, encoding, callback) {
    // 处理序列化后的数据块
    console.log('接收到数据块:', chunk.length, 'bytes');
    callback();
  }
});

// 管道处理
sourceStream
  .pipe(serializeTransform)
  .pipe(targetStream)
  .on('finish', () => {
    console.log('流式序列化完成');
  })
  .on('error', (error) => {
    console.error('流式序列化错误:', error);
  });

// 反序列化流
const deserializeTransform = streamSerializer.createDeserializeStream();

inputStream
  .pipe(deserializeTransform)
  .on('data', (user: User) => {
    console.log('解析到用户:', user.id, user.name);
  })
  .on('end', () => {
    console.log('流式反序列化完成');
  });
```

### Schema版本管理

```typescript
import { SchemaVersionManager, MigrationRule } from '@sker/serialization-protobuf';

// 创建版本管理器
const versionManager = new SchemaVersionManager({
  registry: schemaRegistry,
  
  // 迁移策略
  migrationStrategy: 'automatic',  // 'automatic' | 'manual' | 'strict'
  
  // 兼容性检查
  compatibilityChecks: {
    fieldRemoval: 'error',         // 'error' | 'warning' | 'ignore'
    fieldTypeChange: 'error',
    fieldNumberChange: 'error',
    enumValueRemoval: 'warning'
  }
});

// 定义迁移规则
const migrationRules: MigrationRule[] = [
  {
    from: '1.0.0',
    to: '1.1.0',
    transformations: [
      {
        type: 'add_field',
        field: 'middle_name',
        defaultValue: '',
        location: 'UserProfile'
      },
      {
        type: 'deprecate_field',
        field: 'old_field',
        replacement: 'new_field'
      }
    ]
  },
  {
    from: '1.1.0',
    to: '2.0.0',
    transformations: [
      {
        type: 'remove_field',
        field: 'deprecated_field'
      },
      {
        type: 'restructure_message',
        message: 'UserProfile',
        transformation: (oldData: any) => ({
          ...oldData,
          contact: {
            email: oldData.email,
            phone: oldData.phone
          }
        })
      }
    ]
  }
];

// 注册迁移规则
await versionManager.registerMigrations('sker.example.User', migrationRules);

// 自动迁移数据
const oldFormatData = loadOldFormatData();
const migratedData = await versionManager.migrate(
  'sker.example.User',
  oldFormatData,
  '1.0.0',  // 源版本
  '2.0.0'   // 目标版本
);

console.log('数据迁移完成:', migratedData);
```

### 性能优化

```typescript
import { PerformanceOptimizer, OptimizationLevel } from '@sker/serialization-protobuf';

// 创建性能优化器
const optimizer = new PerformanceOptimizer({
  // 优化级别
  level: OptimizationLevel.AGGRESSIVE,  // 'BASIC' | 'STANDARD' | 'AGGRESSIVE'
  
  // 缓存策略
  caching: {
    enabled: true,
    strategy: 'lru',              // 'lru' | 'lfu' | 'ttl'
    maxSize: 50 * 1024 * 1024,    // 最大50MB缓存
    maxEntries: 100000,           // 最大10万条目
    ttl: 300000                   // 5分钟TTL
  },
  
  // 预编译优化
  precompilation: {
    enabled: true,
    schemas: ['sker.example.User', 'sker.example.UserProfile'],
    warmupData: sampleUserData    // 预热数据
  },
  
  // 内存管理
  memory: {
    enablePooling: true,          // 对象池
    poolSize: 1000,              // 池大小
    enableRecycling: true,        // 对象回收
    gcOptimization: true         // GC优化
  }
});

// 应用优化器到序列化器
const optimizedSerializer = new ProtobufSerializer({
  schemaRegistry,
  optimizer,
  
  // 特定优化
  optimizations: {
    skipUnknownFields: true,      // 跳过未知字段
    useUnsafeOperations: true,    // 使用unsafe操作提升性能
    enableFastPath: true,         // 启用快速路径
    preallocateBuffers: true      // 预分配缓冲区
  }
});

// 性能基准测试
const benchmark = async () => {
  const testData = generateTestData(10000);  // 1万条测试数据
  
  console.time('批量序列化');
  const serializedResults = await Promise.all(
    testData.map(data => optimizedSerializer.serialize('sker.example.User', data))
  );
  console.timeEnd('批量序列化');
  
  console.time('批量反序列化');
  const deserializedResults = await Promise.all(
    serializedResults.map(data => optimizedSerializer.deserialize('sker.example.User', data))
  );
  console.timeEnd('批量反序列化');
  
  console.log('序列化性能统计:', optimizer.getStats());
};

await benchmark();
```

## 高级配置

### 序列化器配置

```typescript
const advancedConfig = {
  // Schema配置
  schema: {
    registry: schemaRegistry,
    strictMode: true,             // 严格模式
    allowUnknownFields: false,    // 允许未知字段
    preserveProtoFieldNames: true // 保留proto字段名
  },
  
  // 性能配置
  performance: {
    enableCache: true,
    cacheSize: 10000,
    enableParallelProcessing: true,
    maxConcurrency: 4,
    useWorkerThreads: false       // 是否使用Worker线程
  },
  
  // 压缩配置
  compression: {
    algorithm: 'gzip',            // 'gzip' | 'lz4' | 'snappy' | 'brotli'
    level: 6,                     // 压缩级别 (1-9)
    threshold: 1024,              // 压缩阈值
    dictionary: customDict        // 自定义压缩字典
  },
  
  // 验证配置
  validation: {
    strict: true,
    validateOnSerialize: true,
    validateOnDeserialize: true,
    customValidators: {
      'email': (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
    errorFormat: 'detailed'       // 'simple' | 'detailed'
  },
  
  // 类型转换配置
  typeMapping: {
    int64ToBigInt: true,          // int64映射为BigInt
    timestampToDate: true,        // Timestamp映射为Date
    bytesToUint8Array: true,      // bytes映射为Uint8Array
    mapsToMaps: true             // proto maps映射为JavaScript Map
  },
  
  // 输出配置
  output: {
    format: 'binary',             // 'binary' | 'json' | 'text'
    encoding: 'utf8',            // 字符编码
    prettify: false              // 格式化输出
  }
};
```

### Schema注册表配置

```typescript
const registryConfig = {
  // 后端配置
  backend: 'redis',
  redis: {
    host: 'localhost',
    port: 6379,
    password: 'your-password',
    database: 0,
    keyPrefix: 'sker:schemas:'
  },
  
  // HTTP后端配置
  http: {
    baseURL: 'https://schema-registry.example.com',
    auth: {
      type: 'bearer',
      token: 'your-token'
    },
    timeout: 30000
  },
  
  // 版本管理
  versioning: {
    strategy: 'semantic',         // 'semantic' | 'sequential' | 'timestamp'
    defaultVersion: '1.0.0',
    autoIncrement: true
  },
  
  // 兼容性检查
  compatibility: {
    level: 'backward',            // 'backward' | 'forward' | 'full' | 'none'
    strictChecks: true,
    allowEvolution: true
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 300000,                 // 5分钟TTL
    maxSize: 1000               // 最大1000个Schema
  }
};
```

## 最佳实践

### 1. Schema设计原则

```protobuf
// ✅ 推荐：使用明确的字段编号和类型
message User {
  int64 id = 1;                    // 使用int64而不是int32
  string name = 2;                 // 必需字段使用小编号
  optional string email = 3;       // 可选字段使用optional
  repeated string tags = 4;        // 数组字段使用repeated
  reserved 5 to 10;               // 预留字段编号
  reserved "old_field";           // 预留已删除的字段名
}

// ❌ 避免：使用模糊的类型和编号
message BadUser {
  int32 id = 100;                 // 编号过大
  bytes name = 2;                 // 类型不明确
  string data = 1;                // 字段名模糊
}
```

### 2. 性能优化建议

```typescript
// ✅ 推荐：合理使用缓存和批处理
const batchSerializer = new ProtobufSerializer({
  enableCache: true,
  batchMode: {
    enabled: true,
    batchSize: 1000,
    flushInterval: 1000
  }
});

// ✅ 推荐：针对不同场景选择不同配置
const highPerformanceConfig = {
  compression: { algorithm: 'lz4' },    // 快速压缩
  validation: { strict: false },        // 跳过验证
  optimizations: { enableFastPath: true }
};

const highCompressionConfig = {
  compression: { algorithm: 'brotli', level: 9 },  // 最大压缩
  validation: { strict: true },                    // 严格验证
  optimizations: { enableFastPath: false }
};
```

### 3. Schema演进策略

```typescript
// ✅ 推荐：安全的Schema演进
const safeEvolution = {
  // 添加字段：使用optional或默认值
  addField: 'optional',
  
  // 删除字段：先标记为deprecated，后续版本删除
  removeField: 'deprecate_first',
  
  // 修改类型：使用oneof或新字段
  changeType: 'use_oneof',
  
  // 重命名字段：保留旧字段并添加新字段
  renameField: 'keep_both'
};
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/serialization-protobuf)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的Protocol Buffers序列化器包。更多信息请访问 [Sker官网](https://sker.dev)