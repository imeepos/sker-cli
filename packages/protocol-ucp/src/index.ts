/**
 * @sker/protocol-ucp - 统一通信协议(UCP)实现
 * 
 * 提供跨语言跨进程跨端通信的统一协议抽象层
 */

// 协议核心接口
export * from './interfaces/protocol';
export * from './interfaces/transport';
export * from './interfaces/serialization';

// UCP实现
export * from './core/ucp-manager';
export * from './core/protocol-factory';
export * from './core/transport-layer';

// 协议适配器
export * from './adapters/grpc-adapter';
export * from './adapters/http-adapter';
export * from './adapters/websocket-adapter';
export * from './adapters/message-queue-adapter';

// 工具函数
export * from './utils/protocol-utils';
export * from './utils/connection-pool';

// 常量和类型
export * from './constants/protocol-types';
export * from './types/ucp-types';

// 默认导出
export { UCPManager } from './core/ucp-manager';