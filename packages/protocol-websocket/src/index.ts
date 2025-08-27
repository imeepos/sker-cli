/**
 * @sker/protocol-websocket - WebSocket协议实现
 * 
 * 提供实时双向通信能力
 */

// 核心WebSocket实现
export * from './core/websocket-server.js';
export * from './core/websocket-client.js';
export * from './core/connection-manager.js';

// 事件处理
export * from './events/event-emitter.js';
export * from './events/message-handler.js';
export * from './events/lifecycle-handler.js';

// 工具函数
export * from './utils/websocket-utils.js';
export * from './utils/message-utils.js';

// 常量和类型
export * from './constants/websocket-constants.js';
export * from './types/websocket-types.js';

// 默认导出
export { WebSocketServer } from './core/websocket-server.js';
export { WebSocketClient } from './core/websocket-client.js';