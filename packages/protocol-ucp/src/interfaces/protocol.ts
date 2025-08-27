import { EventEmitter } from 'events';

/**
 * 协议类型枚举
 */
export enum ProtocolType {
  GRPC = 'grpc',
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  MESSAGE_QUEUE = 'message_queue',
  TCP = 'tcp',
  UDP = 'udp',
  WEBRTC = 'webrtc'
}

/**
 * 协议状态枚举
 */
export enum ProtocolStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  FAILED = 'failed'
}

/**
 * 连接配置接口
 */
export interface ConnectionConfig {
  host: string;
  port: number;
  timeout?: number;
  retries?: number;
  keepAlive?: boolean;
  compression?: string;
  ssl?: boolean;
  metadata?: Record<string, any>;
}

/**
 * 协议连接接口
 */
export interface Connection extends EventEmitter {
  readonly id: string;
  readonly protocol: ProtocolType;
  readonly status: ProtocolStatus;
  readonly config: ConnectionConfig;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  ping(): Promise<number>;
  
  send(data: any): Promise<void>;
  request(data: any, timeout?: number): Promise<any>;
  stream(data: any): AsyncIterableIterator<any>;
}

/**
 * 协议适配器接口
 */
export interface ProtocolAdapter {
  readonly type: ProtocolType;
  readonly name: string;
  readonly version: string;
  
  createConnection(config: ConnectionConfig): Promise<Connection>;
  validateConfig(config: ConnectionConfig): boolean;
  getDefaultConfig(): Partial<ConnectionConfig>;
}

/**
 * 协议客户端接口
 */
export interface ProtocolClient {
  readonly protocol: ProtocolType;
  readonly target: string;
  
  call(service: string, method: string, data: any, options?: CallOptions): Promise<any>;
  stream(service: string, method: string, data: any, options?: StreamOptions): AsyncIterableIterator<any>;
  close(): Promise<void>;
}

/**
 * 协议服务端接口
 */
export interface ProtocolServer {
  readonly protocol: ProtocolType;
  readonly address: string;
  readonly port: number;
  
  start(): Promise<void>;
  stop(): Promise<void>;
  registerHandler(service: string, handler: ProtocolHandler): void;
  unregisterHandler(service: string): void;
}

/**
 * 协议处理器接口
 */
export interface ProtocolHandler {
  [method: string]: (request: any, context: ProtocolContext) => Promise<any> | AsyncIterableIterator<any>;
}

/**
 * 协议上下文接口
 */
export interface ProtocolContext {
  readonly protocol: ProtocolType;
  readonly service: string;
  readonly method: string;
  readonly clientId: string;
  readonly headers: Record<string, any>;
  readonly metadata: Record<string, any>;
  user?: any;
  
  setHeader(key: string, value: any): void;
  getHeader(key: string): any;
  setMetadata(key: string, value: any): void;
  getMetadata(key: string): any;
}

/**
 * 调用选项接口
 */
export interface CallOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * 流选项接口
 */
export interface StreamOptions extends CallOptions {
  bufferSize?: number;
  backpressure?: boolean;
}

/**
 * 协议错误接口
 */
export interface ProtocolError extends Error {
  readonly code: string;
  readonly protocol?: ProtocolType;
  readonly service?: string;
  readonly method?: string;
  readonly target?: string;
  readonly cause?: Error;
}