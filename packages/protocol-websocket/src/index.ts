/**
 * @sker/protocol-websocket - WebSocket协议实现
 * 
 * 提供实时双向通信能力
 */

// 核心WebSocket实现
export * from './core/websocket-server';
export * from './core/websocket-client';
export * from './core/connection-manager';

// 房间管理
export * from './rooms/room-manager';
export * from './rooms/namespace-manager';
export * from './rooms/broadcast-manager';

// 事件处理
export * from './events/event-emitter';
export * from './events/message-handler';
export * from './events/lifecycle-handler';

// 中间件
export * from './middleware/auth-middleware';
export * from './middleware/compression-middleware';
export * from './middleware/heartbeat-middleware';

// 工具函数
export * from './utils/websocket-utils';
export * from './utils/message-utils';

// 常量和类型
export * from './constants/websocket-constants';
export * from './types/websocket-types';

// 默认导出
export { WebSocketServer } from './core/websocket-server';
export { WebSocketClient } from './core/websocket-client';