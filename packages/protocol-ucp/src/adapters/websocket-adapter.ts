import { EventEmitter } from 'events';
import { WebSocket } from 'ws'
import {
  ProtocolType,
  ProtocolStatus,
  ProtocolAdapter,
  Connection,
  ConnectionConfig,
  ProtocolContext
} from '../interfaces/protocol.js';

/**
 * WebSocket连接实现
 */
export class WebSocketConnection extends EventEmitter implements Connection {
  public readonly id: string;
  public readonly protocol = ProtocolType.WEBSOCKET;
  public readonly config: ConnectionConfig;
  
  private _status: ProtocolStatus = ProtocolStatus.DISCONNECTED;
  private ws?: WebSocket;
  private heartbeatTimer?: NodeJS.Timeout;
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private responseHandlers: Map<string, { resolve: (value: any) => void; reject: (error: any) => void }> = new Map();
  
  constructor(config: ConnectionConfig) {
    super();
    this.id = this.generateId();
    this.config = config;
  }
  
  get status(): ProtocolStatus {
    return this._status;
  }
  
  async connect(): Promise<void> {
    if (this._status === ProtocolStatus.CONNECTED || this._status === ProtocolStatus.CONNECTING) {
      return;
    }
    
    this._status = ProtocolStatus.CONNECTING;
    this.emit('status', this._status);
    
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.config.ssl ? 'wss' : 'ws'}://${this.config.host}:${this.config.port}`;
        this.ws = new WebSocket(wsUrl);
        
        const connectTimeout = setTimeout(() => {
          this.ws?.close();
          reject(new Error('WebSocket connection timeout'));
        }, this.config.timeout || 10000);
        
        this.ws.onopen = () => {
          clearTimeout(connectTimeout);
          this._status = ProtocolStatus.CONNECTED;
          this.reconnectAttempts = 0;
          this.emit('status', this._status);
          this.emit('connect');
          this.startHeartbeat();
          resolve();
        };
        
        this.ws.onclose = (event) => {
          clearTimeout(connectTimeout);
          this.stopHeartbeat();
          this._status = ProtocolStatus.DISCONNECTED;
          this.emit('status', this._status);
          this.emit('disconnect', event.reason);
          
          // 自动重连
          if (event.code !== 1000 && this.config.retries && this.reconnectAttempts < this.config.retries) {
            this.scheduleReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          clearTimeout(connectTimeout);
          this._status = ProtocolStatus.FAILED;
          this.emit('status', this._status);
          this.emit('error', error);
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          this.handleMessage(event.data.toString());
        };
        
      } catch (error) {
        this._status = ProtocolStatus.FAILED;
        this.emit('status', this._status);
        reject(error);
      }
    });
  }
  
  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.stopHeartbeat();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Normal closure');
    }
    
    this._status = ProtocolStatus.DISCONNECTED;
    this.emit('status', this._status);
  }
  
  isConnected(): boolean {
    return this._status === ProtocolStatus.CONNECTED && this.ws?.readyState === WebSocket.OPEN;
  }
  
  async ping(): Promise<number> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    const startTime = Date.now();
    const pingId = this.generateId();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(pingId);
        reject(new Error('Ping timeout'));
      }, 5000);
      
      this.responseHandlers.set(pingId, {
        resolve: () => {
          clearTimeout(timeout);
          resolve(Date.now() - startTime);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        }
      });
      
      this.ws!.send(JSON.stringify({
        id: pingId,
        type: 'ping',
        timestamp: startTime
      }));
    });
  }
  
  async send(data: any): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    try {
      const message = {
        id: this.generateId(),
        type: 'message',
        data,
        timestamp: Date.now()
      };
      
      this.ws!.send(JSON.stringify(message));
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async request(data: any, timeout?: number): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    const requestId = this.generateId();
    const requestTimeout = timeout || this.config.timeout || 30000;
    
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.responseHandlers.delete(requestId);
        reject(new Error('Request timeout'));
      }, requestTimeout);
      
      this.responseHandlers.set(requestId, {
        resolve: (response) => {
          clearTimeout(timer);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timer);
          reject(error);
        }
      });
      
      try {
        const message = {
          id: requestId,
          type: 'request',
          data,
          timestamp: Date.now()
        };
        
        this.ws!.send(JSON.stringify(message));
        
      } catch (error) {
        this.responseHandlers.delete(requestId);
        clearTimeout(timer);
        reject(error);
      }
    });
  }
  
  async *stream(data: any): AsyncIterableIterator<any> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    const streamId = this.generateId();
    const messageQueue: any[] = [];
    let streamEnded = false;
    let streamError: Error | null = null;
    
    // 设置流处理器
    const streamHandler = (message: any) => {
      if (message.streamId === streamId) {
        if (message.type === 'stream_data') {
          messageQueue.push(message.data);
        } else if (message.type === 'stream_end') {
          streamEnded = true;
        } else if (message.type === 'stream_error') {
          streamError = new Error(message.error);
          streamEnded = true;
        }
      }
    };
    
    this.on('stream_message', streamHandler);
    
    try {
      // 发送流请求
      const message = {
        id: this.generateId(),
        type: 'stream',
        streamId,
        data,
        timestamp: Date.now()
      };
      
      this.ws!.send(JSON.stringify(message));
      
      // 生成流数据
      while (!streamEnded) {
        if (streamError) {
          throw streamError;
        }
        
        if (messageQueue.length > 0) {
          yield messageQueue.shift();
        } else {
          // 等待新数据
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
      
      // 处理剩余消息
      while (messageQueue.length > 0) {
        yield messageQueue.shift();
      }
      
    } finally {
      this.off('stream_message', streamHandler);
    }
  }
  
  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      
      if (message.type === 'pong' || message.type === 'response') {
        const handler = this.responseHandlers.get(message.id);
        if (handler) {
          this.responseHandlers.delete(message.id);
          if (message.error) {
            handler.reject(new Error(message.error));
          } else {
            handler.resolve(message.data || message);
          }
        }
      } else if (message.type === 'stream_data' || message.type === 'stream_end' || message.type === 'stream_error') {
        this.emit('stream_message', message);
      } else {
        this.emit('message', message);
      }
      
    } catch (error) {
      this.emit('error', error);
    }
  }
  
  private startHeartbeat(): void {
    if (!this.config.keepAlive) {
      return;
    }
    
    const interval = 30000; // 30秒心跳
    
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const heartbeat = {
          id: this.generateId(),
          type: 'heartbeat',
          timestamp: Date.now()
        };
        
        this.ws!.send(JSON.stringify(heartbeat));
      }
    }, interval);
  }
  
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
  
  private scheduleReconnect(): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect().catch(error => {
        this.emit('error', error);
      });
    }, delay);
  }
  
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }
  
  private generateId(): string {
    return `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * WebSocket协议适配器
 */
export class WebSocketProtocolAdapter implements ProtocolAdapter {
  public readonly type = ProtocolType.WEBSOCKET;
  public readonly name = 'WebSocket Adapter';
  public readonly version = '1.0.0';
  
  async createConnection(config: ConnectionConfig): Promise<Connection> {
    const connection = new WebSocketConnection(config);
    
    // 自动连接
    await connection.connect();
    
    return connection;
  }
  
  validateConfig(config: ConnectionConfig): boolean {
    return !!(config.host && config.port && config.port > 0 && config.port < 65536);
  }
  
  getDefaultConfig(): Partial<ConnectionConfig> {
    return {
      port: 8080,
      timeout: 10000,
      retries: 3,
      keepAlive: true,
      ssl: false
    };
  }
}

/**
 * WebSocket协议上下文实现
 */
export class WebSocketProtocolContext implements ProtocolContext {
  public readonly protocol = ProtocolType.WEBSOCKET;
  public readonly service: string;
  public readonly method: string;
  public readonly clientId: string;
  public readonly headers: Record<string, any>;
  public readonly metadata: Record<string, any>;
  public user?: any;
  
  private additionalHeaders: Record<string, any> = {};
  private additionalMetadata: Record<string, any> = {};
  
  constructor(
    service: string,
    method: string,
    clientId: string,
    headers: Record<string, any> = {},
    metadata: Record<string, any> = {}
  ) {
    this.service = service;
    this.method = method;
    this.clientId = clientId;
    this.headers = { ...headers };
    this.metadata = { ...metadata };
  }
  
  setHeader(key: string, value: any): void {
    this.additionalHeaders[key] = value;
  }
  
  getHeader(key: string): any {
    return this.additionalHeaders[key] || this.headers[key];
  }
  
  setMetadata(key: string, value: any): void {
    this.additionalMetadata[key] = value;
  }
  
  getMetadata(key: string): any {
    return this.additionalMetadata[key] || this.metadata[key];
  }
  
  getAllHeaders(): Record<string, any> {
    return { ...this.headers, ...this.additionalHeaders };
  }
  
  getAllMetadata(): Record<string, any> {
    return { ...this.metadata, ...this.additionalMetadata };
  }
}