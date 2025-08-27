/**
 * @sker/protocol-ucp - 统一通信协议(UCP)实现
 * 
 * 提供跨语言跨进程跨端通信的统一协议抽象层
 */

// 协议核心接口
export * from './interfaces/protocol.js';
export * from './interfaces/transport.js';
export * from './interfaces/serialization.js';

// UCP实现
export * from './core/ucp-manager.js';
export * from './core/protocol-factory.js';
export * from './core/transport-layer.js';

// 协议适配器
export * from './adapters/grpc-adapter.js';
export * from './adapters/http-adapter.js';
export * from './adapters/websocket-adapter.js';
export * from './adapters/message-queue-adapter.js';

// 工具函数
export * from './utils/protocol-utils.js';
export * from './utils/connection-pool.js';

// 监控和指标
export * from './monitoring/performance-monitor.js';
export * from './monitoring/metrics-collector.js';

// 服务发现
export * from './discovery/service-discovery.js';

// 常量和类型
export * from './constants/protocol-types.js';
export * from './types/ucp-types.js';

// 默认导出
export { UCPManager } from './core/ucp-manager.js';
export { ProtocolFactory, createProtocolClient } from './core/protocol-factory.js';
export { PerformanceMonitor } from './monitoring/performance-monitor.js';
export { MetricsCollector } from './monitoring/metrics-collector.js';
export { ServiceDiscovery } from './discovery/service-discovery.js';