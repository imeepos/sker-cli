# @sker/serialization-json

Sker JSON序列化器实现包，提供高性能JSON序列化和反序列化功能。

## 概述

`@sker/serialization-json` 是Sker通信框架的JSON序列化包，提供了高性能、功能丰富的JSON序列化和反序列化实现。该包不仅支持标准JSON格式，还提供了流式处理、数据压缩、类型转换、性能优化等高级功能，满足企业级应用的各种需求。

## 功能特性

### 🚀 高性能序列化
- **优化算法**: 使用高效的序列化算法，性能优于标准JSON
- **内存优化**: 智能内存管理，减少GC压力
- **并行处理**: 支持多线程并行序列化大型对象
- **缓存机制**: 智能缓存常用数据结构

### 📊 流式处理
- **流式序列化**: 支持大型数据的流式序列化
- **流式反序列化**: 实时解析JSON流数据
- **背压控制**: 自动流量控制和背压处理
- **内存安全**: 恒定内存使用，不受数据大小影响

### 🔧 数据转换
- **类型转换**: 自动处理JavaScript特殊类型
- **BigInt支持**: 完整的大整数序列化支持
- **Date处理**: 智能日期时间格式转换
- **Buffer支持**: 二进制数据的安全序列化

### 📦 数据压缩
- **多种算法**: 支持gzip、brotli、deflate等压缩算法
- **自适应压缩**: 根据数据特征选择最优压缩策略
- **压缩比优化**: 平衡压缩比与性能的最优配置
- **透明压缩**: 对应用层透明的压缩处理

### ✅ 数据验证
- **Schema验证**: 基于JSON Schema的严格验证
- **类型检查**: 运行时类型安全检查
- **格式验证**: 数据格式和约束验证
- **自定义规则**: 支持自定义验证规则

## 安装

```bash
npm install @sker/serialization-json
# 或者
pnpm add @sker/serialization-json
# 或者
yarn add @sker/serialization-json
```

## 基础用法

### 基本序列化

```typescript
import { JSONSerializer } from '@sker/serialization-json';

// 创建序列化器
const serializer = new JSONSerializer({
  // 基础配置
  pretty: false,           // 是否格式化输出
  compression: 'gzip',     // 压缩算法
  validate: true,          // 是否验证数据
  
  // 性能配置
  enableCache: true,       // 启用缓存
  cacheSize: 1000,        // 缓存大小
  parallel: true,         // 并行处理
  
  // 类型转换配置
  transformers: {
    bigint: true,         // BigInt转换
    date: 'iso',          // 日期格式: 'iso' | 'timestamp' | 'custom'
    buffer: 'base64',     // Buffer格式: 'base64' | 'hex' | 'binary'
    undefined: 'null'     // undefined处理: 'null' | 'skip'
  }
});

// 序列化数据
const data = {
  id: 12345n,                    // BigInt
  name: 'John Doe',
  createdAt: new Date(),         // Date
  avatar: Buffer.from('...'),    // Buffer
  metadata: {
    tags: ['user', 'premium'],
    score: 95.5
  }
};

try {
  const serialized = await serializer.serialize(data);
  console.log('序列化成功，大小:', serialized.length);
  
  // 反序列化
  const deserialized = await serializer.deserialize(serialized);
  console.log('反序列化结果:', deserialized);
} catch (error) {
  console.error('序列化错误:', error);
}
```

### 流式处理

```typescript
import { StreamingJSONSerializer } from '@sker/serialization-json';
import { Readable, Writable } from 'stream';

// 创建流式序列化器
const streamSerializer = new StreamingJSONSerializer({
  highWaterMark: 16 * 1024,    // 16KB buffer
  objectMode: false,
  compression: 'gzip',
  
  // 流控制配置
  backpressure: {
    enabled: true,
    threshold: 100 * 1024,     // 100KB
    drainTimeout: 5000         // 5秒超时
  }
});

// 序列化流
const sourceData = [
  { id: 1, name: 'User 1', data: generateLargeObject() },
  { id: 2, name: 'User 2', data: generateLargeObject() },
  { id: 3, name: 'User 3', data: generateLargeObject() }
  // ... 更多数据
];

// 创建可读流
const sourceStream = Readable.from(sourceData);

// 创建序列化转换流
const serializeStream = streamSerializer.createSerializeStream();

// 创建目标写入流
const targetStream = new Writable({
  write(chunk, encoding, callback) {
    console.log('接收到序列化数据块:', chunk.length, 'bytes');
    callback();
  }
});

// 管道连接
sourceStream
  .pipe(serializeStream)
  .pipe(targetStream)
  .on('finish', () => {
    console.log('流式序列化完成');
  })
  .on('error', (error) => {
    console.error('流式序列化错误:', error);
  });

// 反序列化流
const deserializeStream = streamSerializer.createDeserializeStream();

inputStream
  .pipe(deserializeStream)
  .on('data', (obj) => {
    console.log('解析到对象:', obj.id, obj.name);
  })
  .on('end', () => {
    console.log('流式反序列化完成');
  });
```

### 异步序列化

```typescript
import { AsyncJSONSerializer } from '@sker/serialization-json';

// 创建异步序列化器
const asyncSerializer = new AsyncJSONSerializer({
  // 并发配置
  concurrency: 4,              // 4个并发worker
  chunkSize: 1000,            // 每个chunk的大小
  maxQueueSize: 10000,        // 最大队列长度
  
  // 超时配置
  serializeTimeout: 30000,    // 30秒序列化超时
  deserializeTimeout: 30000,  // 30秒反序列化超时
  
  // 错误处理
  retryAttempts: 3,
  retryDelay: 1000           // 1秒重试延迟
});

// 批量序列化
const largeDataArray = generateLargeDataSet(10000);  // 1万条记录

try {
  // 异步批量序列化
  const results = await asyncSerializer.serializeBatch(largeDataArray, {
    onProgress: (completed, total) => {
      console.log(`序列化进度: ${completed}/${total} (${(completed/total*100).toFixed(1)}%)`);
    },
    onError: (error, index) => {
      console.error(`第${index}条记录序列化失败:`, error.message);
    }
  });
  
  console.log('批量序列化完成，结果数量:', results.length);
  
  // 异步批量反序列化
  const deserializedData = await asyncSerializer.deserializeBatch(results, {
    onProgress: (completed, total) => {
      console.log(`反序列化进度: ${completed}/${total}`);
    }
  });
  
  console.log('批量反序列化完成');
} catch (error) {
  console.error('批量处理错误:', error);
}
```

### 性能优化

```typescript
import { PerformanceOptimizer, OptimizationStrategy } from '@sker/serialization-json';

// 创建性能优化器
const optimizer = new PerformanceOptimizer({
  // 优化策略
  strategy: OptimizationStrategy.BALANCED,  // 'speed' | 'size' | 'balanced'
  
  // 缓存配置
  cache: {
    enabled: true,
    type: 'lru',              // 'lru' | 'lfu' | 'ttl'
    maxSize: 10000,          // 最大缓存条目
    maxMemory: 100 * 1024 * 1024,  // 最大100MB内存
    ttl: 300000              // 5分钟TTL
  },
  
  // 预编译优化
  precompile: {
    enabled: true,
    schemas: ['user', 'product', 'order'],  // 预编译的schema
    warmup: true            // 启动时预热
  },
  
  // 内存管理
  memory: {
    pooling: true,          // 对象池
    recycling: true,        // 对象回收
    gcOptimization: true    // GC优化
  }
});

// 应用优化器到序列化器
const optimizedSerializer = new JSONSerializer({
  optimizer: optimizer,
  
  // 特定优化配置
  fastPath: {
    enabled: true,
    knownTypes: ['string', 'number', 'boolean'],
    primitiveOnly: false
  }
});

// 性能监控
optimizer.on('stats', (stats) => {
  console.log('性能统计:', {
    cacheHitRate: stats.cacheHitRate,
    avgSerializeTime: stats.avgSerializeTime,
    memoryUsage: stats.memoryUsage,
    throughput: stats.throughput
  });
});

// 序列化性能测试
const testData = generateTestData(1000);
console.time('优化序列化');
const result = await optimizedSerializer.serialize(testData);
console.timeEnd('优化序列化');
```

### 数据验证

```typescript
import { ValidationProcessor, JSONSchema } from '@sker/serialization-json';

// 定义数据Schema
const userSchema: JSONSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', minimum: 1 },
    name: { type: 'string', minLength: 1, maxLength: 100 },
    email: { type: 'string', format: 'email' },
    age: { type: 'integer', minimum: 0, maximum: 150 },
    roles: {
      type: 'array',
      items: { type: 'string', enum: ['admin', 'user', 'guest'] },
      minItems: 1
    },
    profile: {
      type: 'object',
      properties: {
        bio: { type: 'string', maxLength: 500 },
        avatar: { type: 'string', format: 'uri' },
        settings: {
          type: 'object',
          additionalProperties: true
        }
      }
    }
  },
  required: ['id', 'name', 'email'],
  additionalProperties: false
};

// 创建验证处理器
const validator = new ValidationProcessor({
  schemas: {
    'user': userSchema
  },
  
  // 验证选项
  options: {
    strict: true,                    // 严格模式
    removeAdditional: false,         // 不移除额外属性
    useDefaults: true,              // 使用默认值
    coerceTypes: false,             // 不强制类型转换
    allErrors: true,                // 返回所有错误
    verbose: true                   // 详细错误信息
  },
  
  // 自定义验证器
  customValidators: {
    'strongPassword': (password: string) => {
      return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
    },
    'uniqueUsername': async (username: string) => {
      // 异步验证用户名唯一性
      return await checkUsernameUniqueness(username);
    }
  }
});

// 创建带验证的序列化器
const validatingSerializer = new JSONSerializer({
  validation: {
    enabled: true,
    processor: validator,
    onSerialize: true,      // 序列化时验证
    onDeserialize: true,    // 反序列化时验证
    schema: 'user'          // 使用的schema
  }
});

// 序列化带验证
const userData = {
  id: 12345,
  name: 'John Doe',
  email: 'john@example.com',
  age: 28,
  roles: ['user'],
  profile: {
    bio: 'Software developer',
    avatar: 'https://example.com/avatar.jpg'
  }
};

try {
  const validated = await validatingSerializer.serialize(userData);
  console.log('验证通过，序列化成功');
} catch (error) {
  if (error.name === 'ValidationError') {
    console.error('验证失败:', error.errors);
    error.errors.forEach(err => {
      console.error(`- ${err.instancePath}: ${err.message}`);
    });
  }
}
```

### 自定义转换器

```typescript
import { Transformer, TransformContext } from '@sker/serialization-json';

// 创建自定义BigInt转换器
class CustomBigIntTransformer implements Transformer<bigint, string> {
  readonly type = 'bigint';
  
  serialize(value: bigint, context: TransformContext): string {
    // 序列化时添加前缀标识
    return `bigint:${value.toString()}`;
  }
  
  deserialize(value: string, context: TransformContext): bigint {
    // 反序列化时检查前缀
    if (typeof value === 'string' && value.startsWith('bigint:')) {
      return BigInt(value.slice(7));
    }
    throw new Error('Invalid BigInt format');
  }
  
  canTransform(value: any): value is bigint {
    return typeof value === 'bigint';
  }
}

// 创建自定义Date转换器
class CustomDateTransformer implements Transformer<Date, object> {
  readonly type = 'date';
  
  serialize(value: Date, context: TransformContext): object {
    return {
      __type: 'Date',
      iso: value.toISOString(),
      timestamp: value.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  }
  
  deserialize(value: any, context: TransformContext): Date {
    if (value && value.__type === 'Date') {
      return new Date(value.iso);
    }
    throw new Error('Invalid Date format');
  }
  
  canTransform(value: any): value is Date {
    return value instanceof Date;
  }
}

// 注册自定义转换器
const serializer = new JSONSerializer({
  transformers: {
    custom: [
      new CustomBigIntTransformer(),
      new CustomDateTransformer()
    ]
  }
});

// 测试自定义转换器
const testData = {
  id: 9007199254740991n,        // BigInt
  createdAt: new Date(),        // Date
  name: 'Test Object'
};

const serialized = await serializer.serialize(testData);
console.log('序列化结果:', serialized);

const deserialized = await serializer.deserialize(serialized);
console.log('反序列化结果:', deserialized);
console.log('BigInt类型正确:', typeof deserialized.id === 'bigint');
console.log('Date类型正确:', deserialized.createdAt instanceof Date);
```

## 高级配置

### 序列化器配置

```typescript
const advancedConfig = {
  // 基础配置
  encoding: 'utf8',                    // 字符编码
  pretty: false,                       // 格式化输出
  space: 2,                           // 缩进空格数
  
  // 性能配置
  parallel: {
    enabled: true,
    workers: 4,                       // 工作线程数
    threshold: 10000,                 // 并行处理阈值
    chunkSize: 1000                   // 分块大小
  },
  
  // 压缩配置
  compression: {
    algorithm: 'gzip',                // 压缩算法
    level: 6,                         // 压缩级别 (1-9)
    threshold: 1024,                  // 压缩阈值 (bytes)
    dictionary: customDictionary      // 自定义压缩字典
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    strategy: 'lru',                  // 缓存策略
    maxSize: 10000,                   // 最大条目数
    maxMemory: 100 * 1024 * 1024,     // 最大内存使用
    ttl: 300000,                      // 生存时间 (ms)
    keyGenerator: (data) => hash(data) // 自定义key生成器
  },
  
  // 验证配置
  validation: {
    enabled: true,
    strict: true,                     // 严格模式
    schemas: schemaRegistry,          // Schema注册表
    customValidators: validators,     // 自定义验证器
    errorFormat: 'detailed'           // 错误格式
  },
  
  // 类型转换配置
  transformers: {
    bigint: {
      format: 'string',               // 'string' | 'number'
      prefix: 'n'                     // 前缀标识
    },
    date: {
      format: 'iso',                  // 'iso' | 'timestamp' | 'custom'
      timezone: 'UTC'                 // 时区处理
    },
    buffer: {
      encoding: 'base64',             // 编码格式
      maxSize: 10 * 1024 * 1024      // 最大大小
    },
    undefined: 'omit',                // undefined处理
    function: 'omit',                 // 函数处理
    symbol: 'string'                  // Symbol处理
  },
  
  // 错误处理
  errorHandling: {
    continueOnError: false,           // 出错时是否继续
    maxErrors: 100,                   // 最大错误数
    errorCallback: (error) => {       // 错误回调
      logger.error('序列化错误:', error);
    }
  },
  
  // 流配置
  streaming: {
    highWaterMark: 16 * 1024,        // 流缓冲区大小
    objectMode: false,                // 对象模式
    backpressure: {
      enabled: true,
      threshold: 100 * 1024,          // 背压阈值
      timeout: 5000                   // 排空超时
    }
  }
};
```

## 性能基准

### 序列化性能对比

```typescript
import { benchmark } from '@sker/serialization-json';

// 性能基准测试
const testData = generateLargeObject(10000);  // 生成1万条记录

const results = await benchmark({
  serializers: {
    'Native JSON': JSON,
    'Sker JSON': new JSONSerializer(),
    'Sker JSON (Optimized)': new JSONSerializer({
      optimizer: new PerformanceOptimizer(),
      parallel: true,
      cache: { enabled: true }
    }),
    'Sker JSON (Streaming)': new StreamingJSONSerializer()
  },
  
  data: testData,
  iterations: 1000,
  warmup: 100
});

console.log('序列化性能基准:');
results.serialize.forEach(result => {
  console.log(`${result.name}: ${result.opsPerSec.toFixed(0)} ops/sec`);
});

console.log('反序列化性能基准:');
results.deserialize.forEach(result => {
  console.log(`${result.name}: ${result.opsPerSec.toFixed(0)} ops/sec`);
});
```

## 最佳实践

### 1. 选择合适的序列化器

```typescript
// ✅ 小数据量 - 使用标准序列化器
const standardSerializer = new JSONSerializer({
  compression: 'none',
  cache: { enabled: false }
});

// ✅ 大数据量 - 使用流式序列化器
const streamingSerializer = new StreamingJSONSerializer({
  compression: 'gzip',
  backpressure: { enabled: true }
});

// ✅ 高频调用 - 使用优化序列化器
const optimizedSerializer = new JSONSerializer({
  optimizer: new PerformanceOptimizer(),
  cache: { enabled: true, maxSize: 10000 },
  parallel: true
});
```

### 2. 合理配置压缩

```typescript
// ✅ 根据数据特征选择压缩策略
const compressionStrategy = (data: any) => {
  const size = JSON.stringify(data).length;
  
  if (size < 1024) {
    return 'none';        // 小数据不压缩
  } else if (size < 100 * 1024) {
    return 'gzip';        // 中等数据用gzip
  } else {
    return 'brotli';      // 大数据用brotli
  }
};
```

### 3. 内存管理

```typescript
// ✅ 使用对象池避免频繁GC
const serializer = new JSONSerializer({
  memory: {
    pooling: true,
    recycling: true,
    maxPoolSize: 1000
  }
});

// ✅ 及时释放大对象
async function processLargeData(data: any[]) {
  for (let i = 0; i < data.length; i += 1000) {
    const chunk = data.slice(i, i + 1000);
    await serializer.serialize(chunk);
    
    // 手动垃圾回收大块数据
    if (i % 10000 === 0 && global.gc) {
      global.gc();
    }
  }
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/serialization-json)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的JSON序列化器包。更多信息请访问 [Sker官网](https://sker.dev)