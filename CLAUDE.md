# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `sker-cli`, a cross-language/cross-process/cross-platform communication standard implementation based on the "跨语言跨进程跨端通信标准工作流程" (Cross-language/Cross-process/Cross-platform Communication Standard Workflow). The project follows a monorepo structure with TypeScript as the primary language and pnpm for package management.

## Development Commands

- `npm test` - Currently not implemented (shows "Error: no test specified" and exits)
- `npm run claude` - Launches Claude with `--dangerously-skip-permissions` flag

## Build System

The project uses:
- **Package Manager**: pnpm@10.15.0 (specified in packageManager field)
- **Build Tool**: tsup (TypeScript Universal Packager)
- **Runtime**: tsx for TypeScript execution
- **TypeScript**: Version 5.9.2 with Node.js types

## Project Structure

```
sker-cli/
├── apps/           # Application packages (currently empty)
├── packages/       # Shared packages (currently empty) 
├── promptx/        # Contains communication standard workflow documentation
├── package.json    # Root package configuration
├── pnpm-workspace.yaml  # pnpm workspace configuration
└── tsconfig.json   # TypeScript configuration
```

## Architecture

### Communication Standards Implementation

This project implements the comprehensive communication standard documented in `promptx/跨语言跨进程跨端通信标准工作流程.md`, which defines:

1. **Unified Communication Protocol (UCP)** - Protocol selection matrix for different communication patterns:
   - Synchronous RPC (gRPC, HTTP/REST, JSON-RPC)
   - Asynchronous messaging (Kafka, RabbitMQ, Pulsar)
   - Real-time streaming (WebSocket, SSE, gRPC Streaming)

2. **Unified Data Exchange Format (UDEF)** - Standard message structure with:
   - Envelope (header, metadata)
   - Payload (data, schema versioning)
   - Cross-language type mappings for primitives, collections, and special types

3. **Service Interface Design Standards** - Naming conventions following `{domain}.{subdomain}.{service}.v{version}` pattern

4. **Error Handling Standards** - Hierarchical error codes (system, business, integration, security levels)

5. **Service Discovery & Registration** - Standard metadata and API definitions

6. **Security & Authentication** - Multi-method support (API keys, OAuth2, JWT, mTLS) with RBAC

7. **Monitoring & Logging** - Structured JSON logging with distributed tracing support

### TypeScript Configuration

- **Module System**: NodeNext with ESNext target
- **Strict Mode**: Enabled with additional strictness checks
- **Output**: Source maps, declarations, and declaration maps enabled
- **JSX**: React JSX transform
- **Isolated Modules**: Enforced for better build performance

### Workspace Structure

The project uses pnpm workspaces to manage multiple packages under `apps/**/*` and `packages/**/*` directories, though these are currently empty and ready for implementation.

## Key Implementation Patterns

When working with this codebase, follow these patterns derived from the communication standards:

1. **Contract-First Development**: Define APIs and data schemas before implementation
2. **Error Handling**: Use standardized error codes and response formats
3. **Logging**: Implement structured JSON logging with trace correlation
4. **Versioning**: Follow semantic versioning for API compatibility
5. **Security**: Implement proper authentication and authorization mechanisms

## Next Steps for Development

Based on the current structure, the project appears to be in the initial setup phase. Future development should focus on:

1. Implementing the core communication protocols in the `packages/` directory
2. Creating reference applications in the `apps/` directory
3. Setting up proper test infrastructure
4. Adding build and lint scripts to package.json