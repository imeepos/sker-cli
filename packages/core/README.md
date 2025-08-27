# @sker/core

Sker核心基础功能包，提供跨语言跨进程跨端通信的核心基础设施。

## 概述

`@sker/core` 是Sker通信框架的核心基础包，实现了跨语言跨进程跨端通信标准工作流程中定义的核心基础设施。该包提供了统一的基础架构、通信原语和核心抽象，是整个Sker生态系统的基石。

## 功能特性

### 🚀 核心功能
- **统一通信原语**: 提供跨平台的通信基础抽象
- **生命周期管理**: 统一的资源和服务生命周期管理
- **事件系统**: 基于事件驱动的通信模式
- **上下文传播**: 支持跨进程的上下文传递

### 🔧 基础设施
- **配置管理**: 统一的配置加载和管理机制
- **资源管理**: 自动资源回收和内存管理
- **插件系统**: 可扩展的插件架构
- **中间件支持**: 通用的中间件处理机制

### 🌐 跨平台支持
- **多运行时**: 支持Node.js、Browser、Deno等多种运行环境
- **多协议**: 统一的协议抽象层
- **多序列化**: 支持多种序列化格式
- **多传输**: 支持多种传输协议

## 安装

```bash
npm install @sker/core
# 或者
pnpm add @sker/core
# 或者
yarn add @sker/core
```

## 基础用法

### 创建基础服务

```typescript
import { SkerCore, ServiceOptions } from '@sker/core';

// 创建核心实例
const core = new SkerCore({
  serviceName: 'my-service',
  version: '1.0.0',
  environment: 'development'
});

// 启动服务
await core.start();

// 关闭服务
await core.stop();
```

### 事件系统

```typescript
import { EventBus } from '@sker/core';

const eventBus = new EventBus();

// 监听事件
eventBus.on('user:created', (data) => {
  console.log('User created:', data);
});

// 发射事件
eventBus.emit('user:created', { id: 1, name: 'Alice' });

// 异步事件处理
await eventBus.emitAsync('user:created', userData);
```

### 配置管理

```typescript
import { ConfigManager } from '@sker/core';

const config = new ConfigManager({
  sources: ['env', 'file', 'remote'],
  defaultConfig: {
    port: 3000,
    host: 'localhost'
  }
});

// 获取配置
const port = config.get('port');
const dbConfig = config.get('database');

// 监听配置变更
config.onChange('database.url', (newUrl) => {
  // 重新连接数据库
});
```

### 生命周期管理

```typescript
import { LifecycleManager } from '@sker/core';

const lifecycle = new LifecycleManager();

// 注册启动钩子
lifecycle.onStart(async () => {
  console.log('Service starting...');
  // 初始化数据库连接等
});

// 注册关闭钩子
lifecycle.onStop(async () => {
  console.log('Service stopping...');
  // 清理资源
});

// 启动生命周期
await lifecycle.start();
```

## 高级用法

### 插件系统

```typescript
import { PluginManager } from '@sker/core';

const pluginManager = new PluginManager();

// 注册插件
pluginManager.register('logger', {
  name: 'logger',
  version: '1.0.0',
  initialize: async (context) => {
    // 插件初始化逻辑
  },
  destroy: async () => {
    // 插件清理逻辑
  }
});

// 获取插件
const loggerPlugin = pluginManager.get('logger');
```

### 中间件系统

```typescript
import { MiddlewareManager } from '@sker/core';

const middleware = new MiddlewareManager();

// 添加中间件
middleware.use(async (context, next) => {
  console.log('Before processing');
  await next();
  console.log('After processing');
});

// 执行中间件链
await middleware.execute(context);
```

### 上下文传播

```typescript
import { Context } from '@sker/core';

// 创建上下文
const context = new Context({
  requestId: 'req-123',
  userId: 'user-456',
  traceId: 'trace-789'
});

// 在上下文中执行
await context.run(async () => {
  // 在这里可以获取当前上下文
  const currentContext = Context.current();
  console.log(currentContext.requestId); // req-123
  
  // 传播到子进程或远程调用
  await someRemoteCall(currentContext.serialize());
});
```

## API 参考

### SkerCore

主要的核心类，负责整个服务的生命周期管理。

#### 构造函数

```typescript
new SkerCore(options: CoreOptions)
```

#### 方法

- `start(): Promise<void>` - 启动服务
- `stop(): Promise<void>` - 停止服务
- `getPlugin<T>(name: string): T` - 获取插件实例
- `getConfig(): ConfigManager` - 获取配置管理器

### EventBus

事件总线，用于组件间通信。

#### 方法

- `on(event: string, handler: Function): void` - 监听事件
- `off(event: string, handler?: Function): void` - 取消监听
- `emit(event: string, data?: any): void` - 发射事件
- `emitAsync(event: string, data?: any): Promise<void>` - 异步发射事件

### ConfigManager

配置管理器，统一管理应用配置。

#### 方法

- `get(key: string): any` - 获取配置值
- `set(key: string, value: any): void` - 设置配置值
- `onChange(key: string, handler: Function): void` - 监听配置变更

## 配置选项

### CoreOptions

```typescript
interface CoreOptions {
  serviceName: string;           // 服务名称
  version: string;              // 服务版本
  environment?: string;         // 运行环境
  plugins?: PluginConfig[];     // 插件配置
  config?: ConfigOptions;       // 配置选项
  lifecycle?: LifecycleOptions; // 生命周期选项
}
```

### PluginConfig

```typescript
interface PluginConfig {
  name: string;                 // 插件名称
  package?: string;             // 插件包名
  options?: Record<string, any>; // 插件选项
  enabled?: boolean;            // 是否启用
}
```

## 错误处理

```typescript
import { SkerError, ErrorCodes } from '@sker/core';

try {
  await core.start();
} catch (error) {
  if (error instanceof SkerError) {
    console.log(`错误码: ${error.code}`);
    console.log(`错误信息: ${error.message}`);
    console.log(`错误详情: ${error.details}`);
  }
}
```

## 最佳实践

### 1. 服务初始化

```typescript
// 推荐的服务初始化模式
const core = new SkerCore({
  serviceName: 'user-service',
  version: process.env.SERVICE_VERSION || '1.0.0',
  environment: process.env.NODE_ENV || 'development',
  plugins: [
    { name: 'logger', options: { level: 'info' } },
    { name: 'metrics', options: { enabled: true } }
  ]
});

// 优雅关闭处理
process.on('SIGTERM', async () => {
  await core.stop();
  process.exit(0);
});
```

### 2. 错误处理

```typescript
// 统一错误处理
core.on('error', (error) => {
  console.error('Service error:', error);
  // 发送错误报告
});

// 未捕获异常处理
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  await core.stop();
  process.exit(1);
});
```

### 3. 配置管理

```typescript
// 分层配置管理
const config = new ConfigManager({
  sources: [
    { type: 'env', prefix: 'SKER_' },
    { type: 'file', path: './config.json' },
    { type: 'remote', url: 'http://config-service/config' }
  ],
  schema: configSchema // 使用配置schema验证
});
```

## 性能优化

### 1. 内存管理

```typescript
// 启用内存监控
core.enableMemoryMonitoring({
  interval: 30000, // 30秒检查一次
  threshold: 0.8   // 80%内存使用率告警
});
```

### 2. 事件优化

```typescript
// 使用事件池避免内存泄漏
eventBus.setMaxListeners(100);

// 及时清理事件监听器
const cleanup = () => {
  eventBus.removeAllListeners('user:created');
};
```

## 调试

### 启用调试日志

```bash
DEBUG=sker:core npm start
```

### 内存使用分析

```typescript
import { MemoryProfiler } from '@sker/core';

const profiler = new MemoryProfiler();
profiler.start();

// 执行操作
await someOperation();

const report = profiler.getReport();
console.log('Memory usage:', report);
```

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

## 支持

- 📚 [文档](https://sker.dev/docs)
- 🐛 [问题报告](https://github.com/sker-ai/sker-cli/issues)
- 💬 [讨论](https://github.com/sker-ai/sker-cli/discussions)
- 📧 [邮件支持](mailto:support@sker.dev)

---

> 这是Sker通信框架的核心包。更多信息请访问 [Sker官网](https://sker.dev)