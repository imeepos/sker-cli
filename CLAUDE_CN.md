# CLAUDE_CN.md

此文件为 Claude Code (claude.ai/code) 在此仓库中工作时提供中文指导。

## 项目概述

这是 `sker-cli` 项目，基于"跨语言跨进程跨端通信标准工作流程"的跨语言/跨进程/跨平台通信标准实现。项目采用 monorepo 结构，以 TypeScript 为主要开发语言，使用 pnpm 进行包管理。

## 开发命令

- `npm test` - 目前未实现（显示"Error: no test specified"并退出）
- `npm run claude` - 使用 `--dangerously-skip-permissions` 标志启动 Claude

## 构建系统

项目使用：
- **包管理器**: pnpm@10.15.0（在 packageManager 字段中指定）
- **构建工具**: tsup（TypeScript 通用打包工具）
- **运行时**: tsx 用于 TypeScript 执行
- **TypeScript**: 版本 5.9.2 配合 Node.js 类型定义

## 项目结构

```
sker-cli/
├── apps/           # 应用程序包（目前为空）
├── packages/       # 共享包（目前为空）
├── promptx/        # 包含通信标准工作流程文档
├── package.json    # 根包配置
├── pnpm-workspace.yaml  # pnpm 工作空间配置
└── tsconfig.json   # TypeScript 配置
```

## 架构设计

### 通信标准实现

本项目实现了在 `promptx/跨语言跨进程跨端通信标准工作流程.md` 中详细记录的综合性通信标准，定义了：

1. **统一通信协议标准 (UCP)** - 不同通信模式的协议选择矩阵：
   - 同步RPC（gRPC、HTTP/REST、JSON-RPC）
   - 异步消息（Kafka、RabbitMQ、Pulsar）
   - 实时流式（WebSocket、SSE、gRPC Streaming）

2. **统一数据交换格式规范 (UDEF)** - 标准消息结构包含：
   - 信封（header、metadata）
   - 载荷（data、schema版本控制）
   - 跨语言类型映射（基础类型、集合类型、特殊类型）

3. **服务接口设计标准** - 遵循 `{domain}.{subdomain}.{service}.v{version}` 模式的命名约定

4. **错误处理标准** - 分层错误码体系（系统级、业务级、集成级、安全级）

5. **服务发现和注册机制** - 标准元数据和API定义

6. **安全认证标准** - 多方法支持（API密钥、OAuth2、JWT、双向TLS）配合RBAC

7. **监控日志规范** - 结构化JSON日志记录，支持分布式追踪

### TypeScript 配置

- **模块系统**: NodeNext 配合 ESNext 目标
- **严格模式**: 启用并包含额外的严格性检查
- **输出**: 启用源映射、声明文件和声明映射
- **JSX**: React JSX 转换
- **隔离模块**: 强制启用以提升构建性能

### 工作空间结构

项目使用 pnpm 工作空间管理 `apps/**/*` 和 `packages/**/*` 目录下的多个包，虽然这些目录目前为空，但已准备好用于实现。

## 核心实现模式

在使用此代码库时，请遵循从通信标准派生的以下模式：

1. **契约优先开发**: 在实现前先定义API和数据模式
2. **错误处理**: 使用标准化错误码和响应格式
3. **日志记录**: 实现带有追踪关联的结构化JSON日志
4. **版本控制**: 遵循语义化版本控制以确保API兼容性
5. **安全机制**: 实现适当的认证和授权机制

## 开发下一步

基于当前结构，项目似乎处于初始设置阶段。未来开发应专注于：

1. 在 `packages/` 目录中实现核心通信协议
2. 在 `apps/` 目录中创建参考应用程序
3. 建立适当的测试基础设施
4. 向 package.json 添加构建和代码检查脚本