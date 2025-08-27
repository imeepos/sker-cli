import { EventEmitter } from 'events';

/**
 * 传输层类型枚举
 */
export enum TransportType {
  TCP = 'tcp',
  UDP = 'udp',
  HTTP = 'http',
  WEBSOCKET = 'websocket',
  GRPC = 'grpc',
  MESSAGE_QUEUE = 'message_queue'
}

/**
 * 传输状态枚举
 */
export enum TransportStatus {
  IDLE = 'idle',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * 传输配置接口
 */
export interface TransportConfig {
  type: TransportType;
  endpoint: string;
  options?: {
    timeout?: number;
    keepAlive?: boolean;
    reconnect?: boolean;
    maxReconnectAttempts?: number;
    reconnectInterval?: number;
    bufferSize?: number;
    compression?: string;
    encryption?: {
      enabled: boolean;
      certificate?: string;
      privateKey?: string;
      caCertificate?: string;
    };
    [key: string]: any;
  };
}

/**
 * 传输消息接口
 */
export interface TransportMessage {
  id: string;
  type: 'request' | 'response' | 'event' | 'error';
  service?: string;
  method?: string;
  headers: Record<string, any>;
  payload: any;
  timestamp: number;
  timeout?: number;
}

/**
 * 传输层接口
 */
export interface Transport extends EventEmitter {
  readonly id: string;
  readonly type: TransportType;
  readonly status: TransportStatus;
  readonly endpoint: string;
  readonly config: TransportConfig;
  
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(message: TransportMessage): Promise<void>;
  request(message: TransportMessage): Promise<TransportMessage>;
  
  on(event: 'connect', listener: () => void): this;
  on(event: 'disconnect', listener: (reason?: string) => void): this;
  on(event: 'message', listener: (message: TransportMessage) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
  on(event: 'status', listener: (status: TransportStatus) => void): this;
}

/**
 * 传输工厂接口
 */
export interface TransportFactory {
  createTransport(config: TransportConfig): Promise<Transport>;
  supportedTypes(): TransportType[];
  validateConfig(config: TransportConfig): boolean;
}

/**
 * 传输管理器接口
 */
export interface TransportManager {
  createTransport(config: TransportConfig): Promise<Transport>;
  getTransport(id: string): Transport | undefined;
  removeTransport(id: string): Promise<void>;
  listTransports(): Transport[];
  
  registerFactory(type: TransportType, factory: TransportFactory): void;
  unregisterFactory(type: TransportType): void;
}

/**
 * 传输监听器接口
 */
export interface TransportListener {
  readonly type: TransportType;
  readonly endpoint: string;
  readonly isListening: boolean;
  
  start(): Promise<void>;
  stop(): Promise<void>;
  
  on(event: 'connection', listener: (transport: Transport) => void): this;
  on(event: 'error', listener: (error: Error) => void): this;
}

/**
 * 连接池接口
 */
export interface ConnectionPool {
  readonly maxConnections: number;
  readonly activeConnections: number;
  readonly idleConnections: number;
  
  acquire(endpoint: string): Promise<Transport>;
  release(transport: Transport): Promise<void>;
  drain(): Promise<void>;
  clear(): Promise<void>;
  
  on(event: 'acquire', listener: (transport: Transport) => void): this;
  on(event: 'release', listener: (transport: Transport) => void): this;
  on(event: 'timeout', listener: (endpoint: string) => void): this;
}