# Sker CLI

> 跨语言跨进程跨端通信标准

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![pnpm Version](https://img.shields.io/badge/pnpm-%3E%3D8.0.0-blue.svg)](https://pnpm.io/)
[![Build Status](https://github.com/sker-ai/sker-cli/workflows/CI/badge.svg)](https://github.com/sker-ai/sker-cli/actions)

Sker CLI是一个"跨语言跨进程跨端通信标准工作流程"的完整实现框架。

## 核心特性

### 统一通信协议 (UCP)
- **同步通信**: gRPC、HTTP/REST、WebSocket等
- **异步消息**: 消息队列、事件驱动
- **负载均衡**: 智能负载均衡算法

### 统一数据交换格式 (UDEF) 
- **数据封装**: 标准消息格式和元数据
- **跨语言支持**: Java、Python、JavaScript、Go、Rust、C#等
- **序列化**: Protocol Buffers、JSON、MessagePack等

### 服务治理
- **服务发现**: 自动服务发现与注册
- **负载均衡**: 多种负载均衡策略
- **熔断降级**: 自动熔断与降级
- **链路监控**: 分布式链路监控

### 安全与认证
- **多种认证**: API密钥、OAuth2、JWT、mTLS等
- **RBAC权限控制**: 基于角色的访问控制
- **数据加密**: 端到端数据加密保护
- **审计日志**: 完整的审计日志记录

### 监控与日志
- **结构化日志**: 标准JSON格式日志
- **链路追踪**: OpenTelemetry分布式链路追踪
- **性能监控**: 实时性能监控告警
- **健康检查**: 服务健康检查机制

## 项目结构

### Phase 1 - 核心基础

| 包名 | 描述 | 状态 |
|------|------|------|
| [@sker/core](./packages/core) | 核心基础模块 | 计划中 |
| [@sker/types](./packages/types) | 类型定义 | 计划中 |
| [@sker/utils](./packages/utils) | 工具函数 | 计划中 |
| [@sker/constants](./packages/constants) | 常量定义 | 计划中 |
| [@sker/logger](./packages/logger) | 日志组件 | 计划中 |
| [@sker/error-core](./packages/error-core) | 错误处理 | 计划中 |

### Phase 2 - 通信协议 (计划中)

| 包名 | 描述 | 状态 |
|------|------|------|
| @sker/protocol-ucp | 统一通信协议 | 计划中 |
| @sker/protocol-grpc | gRPC通信 | 计划中 |
| @sker/protocol-http | HTTP/REST通信 | 计划中 |
| @sker/protocol-websocket | WebSocket通信 | 计划中 |
| @sker/serialization-protobuf | Protocol Buffers序列化 | 计划中 |
| @sker/serialization-json | JSON序列化 | 计划中 |
| @sker/data-udef | 统一数据交换格式 | 计划中 |

### Phase 3 - 服务治理 (计划中)

| 包名 | 描述 | 状态 |
|------|------|------|
| @sker/service-discovery | 服务发现 | 计划中 |
| @sker/service-registry | 服务注册 | 计划中 |
| @sker/load-balancer | 负载均衡 | 计划中 |
| @sker/circuit-breaker | 断路器 | 计划中 |
| @sker/auth-core | 认证核心 | 计划中 |
| @sker/monitoring-core | 监控核心 | 计划中 |

### Phase 4 - 应用层 (计划中)

| 包名 | 描述 | 状态 |
|------|------|------|
| @sker/cli | 命令行工具 | 计划中 |
| @sker/gateway | API网关 | 计划中 |
| @sker/proxy | 代理 | 计划中 |
| @sker/admin | 管理界面 | 计划中 |

## 快速开始

### 环境要求

- **Node.js**: >=18.0.0
- **pnpm**: >=8.0.0 (推荐使用pnpm作为包管理器)

### 安装

```bash
# 克隆仓库
git clone https://github.com/sker-ai/sker-cli.git
cd sker-cli

# 安装依赖
pnpm install

# 构建项目
pnpm build
```

### 基础用法

```typescript
import { SkerCore, createLogger } from '@sker/core';
import { BusinessError, ERROR_CODES } from '@sker/error-core';

// 初始化核心
const core = new SkerCore({
  serviceName: 'my-service',
  version: '1.0.0',
  environment: 'development'
});

// 创建日志
const logger = createLogger({
  name: 'my-service',
  level: 'info'
});

// 启动服务
async function startService() {
  try {
    await core.start();
    logger.info('服务启动成功');
  } catch (error) {
    if (error instanceof BusinessError) {
      logger.error('业务错误', { code: error.code, message: error.message });
    } else {
      logger.error('系统错误', { error });
    }
    throw error;
  }
}

startService();
```

## 项目结构说明

### 目录结构

```
sker-cli/
├── packages/          # 共享包
│   ├── core/         # 核心
│   ├── types/        # 类型定义
│   ├── utils/        # 工具函数
│   ├── constants/    # 常量定义
│   ├── logger/       # 日志组件
│   └── error-core/   # 错误处理
├── apps/             # 应用程序
├── promptx/          # 文档
├── package.json      # 项目配置
├── tsconfig.json     # TypeScript配置
└── pnpm-workspace.yaml # pnpm工作区配置
```

### 开发命令

```bash
# 开发模式 - 启动热重载开发
pnpm dev

# 构建项目
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 清理缓存
pnpm clean
```

## 项目文档

### 核心标准

- [通信标准工作流程](./promptx/跨语言跨进程跨端通信标准工作流程.md) - 完整技术规范
- [API设计](./promptx/API设计规范.md) - API设计规范

### 包文档

- [@sker/core](./packages/core/README.md) - 核心基础模块
- [@sker/types](./packages/types/README.md) - 类型定义  
- [@sker/utils](./packages/utils/README.md) - 工具函数
- [@sker/constants](./packages/constants/README.md) - 常量定义
- [@sker/logger](./packages/logger/README.md) - 日志组件
- [@sker/error-core](./packages/error-core/README.md) - 错误处理

## 贡献指南

欢迎为项目贡献代码。

### 贡献流程

1. **Fork** 仓库
2. **Clone** 到本地
3. **创建** 特性分支 (`git checkout -b feature/amazing-feature`)
4. **提交** 变更内容
5. **推送** 到分支 (`git commit -m 'Add some amazing feature'`)
6. **推送** 到远程 (`git push origin feature/amazing-feature`)
7. **提交** Pull Request

### 开发规范

```bash
# 代码格式化
pnpm lint:fix

# 提交前检查
pnpm typecheck
pnpm test
pnpm build
```

## 项目许可

本项目基于 [MIT License](./LICENSE) 许可证开源。

## 相关链接

- 官方网站 [官网](https://sker.dev)
- 项目文档 [文档](https://docs.sker.dev)
- NPM包 [NPM组织](https://www.npmjs.com/org/sker)
- GitHub仓库 [GitHub](https://github.com/sker-ai/sker-cli)
- 项目讨论 [讨论区](https://github.com/sker-ai/sker-cli/discussions)

---

<div align="center">

**[返回顶部](#sker-cli)**

Made with ❤️ by [Sker Team](https://github.com/sker-ai)

</div>