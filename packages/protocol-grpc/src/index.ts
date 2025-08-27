/**
 * @sker/protocol-grpc - gRPC协议实现
 * 
 * 提供高性能双向流式RPC通信
 */

// 核心gRPC实现
export * from './core/grpc-server.js';
export * from './core/grpc-client.js';
export { ServiceRegistry } from './core/service-registry.js';
export { ServiceDiscovery } from './core/service-discovery.js';
export type { ServiceInstance } from './core/service-discovery.js';
export * from './core/connection-pool.js';

// 流处理
export * from './streaming/stream-handler.js';
export * from './streaming/bidirectional-stream.js';
export * from './streaming/client-stream.js';
export * from './streaming/server-stream.js';

// 中间件
export * from './middleware/auth-middleware.js';
export * from './middleware/logging-middleware.js';
export * from './middleware/metrics-middleware.js';

// 负载均衡
export * from './balancer/load-balancer.js';
export * from './balancer/health-checker.js';

// 工具函数
export * from './utils/grpc-utils.js';
export * from './utils/metadata-utils.js';

// 常量和类型
export * from './constants/grpc-constants.js';
export * from './types/grpc-types.js';

// 主要导出（避免重复，这些已在上面导出）
// export { GRPCServer } from './core/grpc-server';
// export { GRPCClient } from './core/grpc-client';
// export { ServiceDiscovery } from './core/service-discovery';
// export { LoadBalancer } from './balancer/load-balancer';
// export { HealthChecker } from './balancer/health-checker';
export { MetadataManager } from './utils/metadata-utils.js';