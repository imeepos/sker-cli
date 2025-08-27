# @sker/utils

Sker通用工具函数包，提供跨平台通用工具和辅助函数。

## 概述

`@sker/utils` 是Sker通信框架的通用工具包，提供了一系列跨平台的工具函数和辅助类。这些工具函数经过精心设计，确保在不同运行环境和编程语言中保持一致的行为。

## 功能特性

### 🛠️ 核心工具
- **字符串处理**: Unicode安全的字符串操作函数
- **数据验证**: 通用数据验证和清理工具
- **对象操作**: 深拷贝、合并、路径访问等对象工具
- **数组处理**: 数组操作和函数式编程工具

### 🔄 异步工具
- **Promise工具**: 超时、重试、并发控制等Promise辅助函数
- **延迟执行**: 防抖、节流、延迟执行等工具
- **流控制**: 异步流程控制和管道处理
- **事件工具**: 事件处理和生命周期管理

### 🌐 跨平台工具
- **环境检测**: 运行环境和平台特性检测
- **路径处理**: 跨平台路径操作和文件系统工具
- **编码转换**: Base64、URL编码、哈希等编码工具
- **时间处理**: 时区安全的时间操作和格式化

### 🔐 安全工具
- **数据脱敏**: 敏感数据脱敏和掩码处理
- **输入清理**: 防止注入攻击的输入清理
- **加密辅助**: 常用加密和哈希算法包装
- **随机生成**: 安全的随机数和UUID生成

## 安装

```bash
npm install @sker/utils
# 或者
pnpm add @sker/utils
# 或者
yarn add @sker/utils
```

## 基础用法

### 字符串工具

```typescript
import { 
  camelCase, 
  snakeCase, 
  kebabCase,
  truncate,
  maskString,
  isValidEmail,
  isValidUrl 
} from '@sker/utils';

// 命名转换
const userName = camelCase('user_name');     // 'userName'
const user_name = snakeCase('userName');     // 'user_name'
const userUrl = kebabCase('userUrl');        // 'user-url'

// 字符串处理
const shortText = truncate('很长的文本...', 10);           // '很长的文本...'
const maskedEmail = maskString('user@example.com', 3, 3); // 'use***com'

// 验证工具
const isEmail = isValidEmail('user@example.com');    // true
const isUrl = isValidUrl('https://example.com');     // true
```

### 对象工具

```typescript
import { 
  deepClone, 
  deepMerge, 
  getPath, 
  setPath,
  omit,
  pick,
  isEmpty,
  isEqual 
} from '@sker/utils';

const obj = { user: { name: 'Alice', age: 30 } };

// 深拷贝
const cloned = deepClone(obj);

// 深度合并
const merged = deepMerge(obj, { user: { email: 'alice@example.com' } });
// 结果: { user: { name: 'Alice', age: 30, email: 'alice@example.com' } }

// 路径访问
const name = getPath(obj, 'user.name');        // 'Alice'
const updatedObj = setPath(obj, 'user.age', 31);

// 对象过滤
const withoutAge = omit(obj, ['user.age']);
const onlyName = pick(obj, ['user.name']);

// 对象检查
const empty = isEmpty({});                     // true
const equal = isEqual(obj1, obj2);            // boolean
```

### 数组工具

```typescript
import { 
  chunk, 
  flatten, 
  uniq, 
  groupBy,
  sortBy,
  partition,
  sample,
  shuffle 
} from '@sker/utils';

const numbers = [1, 2, 3, 4, 5, 6];
const users = [
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
  { name: 'Charlie', age: 30 }
];

// 数组分块
const chunks = chunk(numbers, 3);              // [[1, 2, 3], [4, 5, 6]]

// 数组扁平化
const nested = [[1, 2], [3, 4], [5, 6]];
const flat = flatten(nested);                  // [1, 2, 3, 4, 5, 6]

// 去重
const unique = uniq([1, 2, 2, 3, 3, 4]);      // [1, 2, 3, 4]

// 分组
const grouped = groupBy(users, 'age');
// { '25': [{ name: 'Bob', age: 25 }], '30': [{ name: 'Alice', age: 30 }, { name: 'Charlie', age: 30 }] }

// 排序
const sorted = sortBy(users, 'name');          // 按名称排序

// 分区
const [adults, minors] = partition(users, user => user.age >= 18);

// 随机采样
const randomUser = sample(users);              // 随机返回一个用户
const shuffled = shuffle([...numbers]);        // 打乱数组顺序
```

### 异步工具

```typescript
import { 
  delay, 
  timeout, 
  retry, 
  debounce,
  throttle,
  promiseAll,
  promiseAllSettled,
  race 
} from '@sker/utils';

// 延迟执行
await delay(1000); // 延迟1秒

// 超时控制
const result = await timeout(fetchData(), 5000); // 5秒超时

// 重试机制
const data = await retry(
  () => fetchUserData(),
  {
    maxAttempts: 3,
    delay: 1000,
    backoff: 'exponential'
  }
);

// 防抖函数
const debouncedSearch = debounce(
  (query: string) => searchUsers(query),
  300
);

// 节流函数
const throttledSave = throttle(
  (data: any) => saveData(data),
  1000
);

// Promise工具
const results = await promiseAll([
  fetchUser('1'),
  fetchUser('2'),
  fetchUser('3')
], { concurrency: 2 }); // 最大并发数为2

// 批量处理结果
const settled = await promiseAllSettled([
  promise1,
  promise2,
  promise3
]);

// 竞态处理
const fastest = await race([
  fetchFromCache(),
  fetchFromApi()
]);
```

### 验证工具

```typescript
import { 
  isValidUUID, 
  isValidJSON,
  isValidDate,
  isValidPhoneNumber,
  validateSchema,
  sanitizeInput 
} from '@sker/utils';

// UUID验证
const isUuid = isValidUUID('123e4567-e89b-12d3-a456-426614174000'); // true

// JSON验证
const isJson = isValidJSON('{"name": "Alice"}');                    // true

// 日期验证
const isDate = isValidDate('2023-12-25');                          // true

// 手机号验证
const isPhone = isValidPhoneNumber('+86-138-0000-0000');           // true

// Schema验证
const userSchema = {
  name: { type: 'string', required: true },
  age: { type: 'number', min: 0, max: 150 },
  email: { type: 'string', format: 'email' }
};

const validation = validateSchema(userData, userSchema);
if (validation.valid) {
  // 数据有效
  processUser(userData);
} else {
  // 处理验证错误
  console.log(validation.errors);
}

// 输入清理
const cleanInput = sanitizeInput('<script>alert("xss")</script>'); // 清理XSS攻击
```

### 加密和哈希工具

```typescript
import { 
  generateUUID, 
  generateNonce,
  hashString,
  encodeBase64,
  decodeBase64,
  encodeUrl,
  decodeUrl 
} from '@sker/utils';

// 生成UUID
const uuid = generateUUID();                   // '123e4567-e89b-12d3-a456-426614174000'

// 生成随机字符串
const nonce = generateNonce(16);               // 16位随机字符串

// 哈希
const hash = hashString('password', 'sha256'); // SHA256哈希

// Base64编码
const encoded = encodeBase64('Hello World');   // 'SGVsbG8gV29ybGQ='
const decoded = decodeBase64(encoded);         // 'Hello World'

// URL编码
const urlEncoded = encodeUrl('hello world');   // 'hello%20world'
const urlDecoded = decodeUrl(urlEncoded);      // 'hello world'
```

### 时间工具

```typescript
import { 
  formatDate, 
  parseDate, 
  addTime,
  diffTime,
  isExpired,
  getTimezone,
  convertTimezone 
} from '@sker/utils';

const now = new Date();

// 日期格式化
const formatted = formatDate(now, 'yyyy-MM-dd HH:mm:ss'); // '2023-12-25 10:30:00'

// 日期解析
const parsed = parseDate('2023-12-25', 'yyyy-MM-dd');

// 时间计算
const future = addTime(now, { days: 7, hours: 2 });      // 7天2小时后
const diff = diffTime(future, now);                      // { days: 7, hours: 2, ... }

// 过期检查
const expired = isExpired(someTimestamp, 3600);          // 检查是否超过1小时

// 时区处理
const timezone = getTimezone();                          // 'Asia/Shanghai'
const utcTime = convertTimezone(now, 'Asia/Shanghai', 'UTC');
```

### 环境检测工具

```typescript
import { 
  isBrowser, 
  isNode, 
  isDeno,
  isWindows,
  isMac,
  isLinux,
  getEnvironment,
  getPlatform 
} from '@sker/utils';

// 运行环境检测
if (isBrowser()) {
  // 浏览器环境特定逻辑
  console.log('Running in browser');
}

if (isNode()) {
  // Node.js环境特定逻辑
  const fs = require('fs');
}

// 平台检测
if (isWindows()) {
  // Windows特定逻辑
  console.log('Running on Windows');
}

// 环境信息
const env = getEnvironment();
// { 
//   runtime: 'node', 
//   version: '18.17.0', 
//   platform: 'win32', 
//   arch: 'x64' 
// }

const platform = getPlatform();
// {
//   os: 'windows',
//   arch: 'x64',
//   endianness: 'LE'
// }
```

## 高级用法

### 自定义工具链

```typescript
import { createUtilChain } from '@sker/utils';

// 创建工具链
const userProcessor = createUtilChain()
  .use(validateInput)
  .use(sanitizeData)
  .use(transformData)
  .use(saveToDatabase);

// 使用工具链
const result = await userProcessor.execute(inputData);
```

### 缓存装饰器

```typescript
import { memoize, memoizeAsync } from '@sker/utils';

// 同步函数缓存
const expensiveCalculation = memoize(
  (a: number, b: number) => {
    // 复杂计算
    return a * b;
  },
  { maxSize: 100, ttl: 60000 } // 最大缓存100项，60秒TTL
);

// 异步函数缓存
const cachedFetch = memoizeAsync(
  async (url: string) => {
    const response = await fetch(url);
    return response.json();
  },
  { maxSize: 50, ttl: 30000 }
);
```

### 错误处理工具

```typescript
import { 
  ErrorHandler, 
  createError,
  wrapError,
  isErrorType 
} from '@sker/utils';

// 错误处理器
const errorHandler = new ErrorHandler({
  onError: (error) => {
    console.error('Error occurred:', error);
  },
  retries: 3,
  backoff: 'exponential'
});

// 包装可能出错的函数
const safeFunction = errorHandler.wrap(async () => {
  // 可能抛出异常的代码
  return await riskyOperation();
});

// 创建标准错误
const error = createError('USER_NOT_FOUND', 'User with ID 123 not found', {
  userId: '123',
  timestamp: new Date()
});

// 错误包装
try {
  await someOperation();
} catch (err) {
  throw wrapError(err, 'OPERATION_FAILED', 'Failed to complete operation');
}

// 错误类型检查
if (isErrorType(error, 'ValidationError')) {
  // 处理验证错误
}
```

## 配置选项

### 全局配置

```typescript
import { configureUtils } from '@sker/utils';

configureUtils({
  // 时间格式配置
  dateFormat: {
    default: 'yyyy-MM-dd HH:mm:ss',
    timezone: 'Asia/Shanghai'
  },
  
  // 验证配置
  validation: {
    strict: true,
    throwOnError: false
  },
  
  // 缓存配置
  cache: {
    defaultTTL: 300000, // 5分钟
    maxSize: 1000
  },
  
  // 错误处理配置
  errorHandling: {
    includeStackTrace: true,
    logErrors: true
  }
});
```

## 性能优化

### 批处理工具

```typescript
import { batchProcess, createBatcher } from '@sker/utils';

// 批处理数组
const results = await batchProcess(
  largeDataArray,
  async (batch) => {
    // 处理一批数据
    return await processDataBatch(batch);
  },
  { batchSize: 100, concurrency: 5 }
);

// 创建批处理器
const batcher = createBatcher(
  async (items) => {
    // 批量处理逻辑
    return await saveToDatabaseBatch(items);
  },
  { 
    maxBatchSize: 50,
    maxWaitTime: 1000,
    concurrency: 3
  }
);

// 添加项目到批处理器
batcher.add(item1);
batcher.add(item2);
// 自动批量处理
```

### 内存优化

```typescript
import { 
  createMemoryPool, 
  createObjectPool,
  trackMemoryUsage 
} from '@sker/utils';

// 对象池
const bufferPool = createObjectPool(
  () => Buffer.alloc(1024),        // 创建函数
  (buffer) => buffer.fill(0),      // 重置函数
  { maxSize: 100 }
);

// 使用对象池
const buffer = bufferPool.acquire();
// 使用buffer
bufferPool.release(buffer);

// 内存使用跟踪
const tracker = trackMemoryUsage();
// 执行操作
const memoryUsage = tracker.getUsage();
console.log('Memory used:', memoryUsage.heapUsed);
```

## 最佳实践

### 1. 错误处理

```typescript
// 推荐：使用工具包的错误处理
import { safeAsync, createError } from '@sker/utils';

const [error, result] = await safeAsync(() => riskyOperation());
if (error) {
  // 处理错误
  console.error(error);
  return;
}
// 使用结果
console.log(result);
```

### 2. 类型安全

```typescript
// 推荐：使用类型守卫
import { isString, isNumber, isArray } from '@sker/utils';

function processValue(value: unknown) {
  if (isString(value)) {
    // TypeScript知道value是string类型
    return value.toUpperCase();
  }
  
  if (isNumber(value)) {
    // TypeScript知道value是number类型
    return value * 2;
  }
  
  if (isArray(value)) {
    // TypeScript知道value是数组类型
    return value.length;
  }
}
```

### 3. 性能考虑

```typescript
// 推荐：使用缓存避免重复计算
import { memoize } from '@sker/utils';

const expensiveOperation = memoize(
  (input: string) => {
    // 耗时的计算
    return complexCalculation(input);
  }
);

// 推荐：使用批处理提高效率
import { batchProcess } from '@sker/utils';

const processUsers = async (users: User[]) => {
  return await batchProcess(
    users,
    async (batch) => await processUserBatch(batch),
    { batchSize: 50 }
  );
};
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/utils)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的工具函数包。更多信息请访问 [Sker官网](https://sker.dev)