import { EventEmitter } from 'events';
import {
  ProtocolType,
  ProtocolStatus,
  ProtocolAdapter,
  Connection,
  ConnectionConfig,
  ProtocolContext
} from '../interfaces/protocol.js';

/**
 * HTTP连接实现
 */
export class HttpConnection extends EventEmitter implements Connection {
  public readonly id: string;
  public readonly protocol = ProtocolType.HTTP;
  public readonly config: ConnectionConfig;
  
  private _status: ProtocolStatus = ProtocolStatus.DISCONNECTED;
  private baseUrl: string;
  
  constructor(config: ConnectionConfig) {
    super();
    this.id = this.generateId();
    this.config = config;
    this.baseUrl = `${config.ssl ? 'https' : 'http'}://${config.host}:${config.port}`;
  }
  
  get status(): ProtocolStatus {
    return this._status;
  }
  
  async connect(): Promise<void> {
    this._status = ProtocolStatus.CONNECTING;
    this.emit('status', this._status);
    
    try {
      // HTTP健康检查
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeout || 5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP connection failed: ${response.status}`);
      }
      
      this._status = ProtocolStatus.CONNECTED;
      this.emit('status', this._status);
      this.emit('connect');
      
    } catch (error) {
      this._status = ProtocolStatus.FAILED;
      this.emit('status', this._status);
      this.emit('error', error);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    this._status = ProtocolStatus.DISCONNECTED;
    this.emit('status', this._status);
    this.emit('disconnect');
  }
  
  isConnected(): boolean {
    return this._status === ProtocolStatus.CONNECTED;
  }
  
  async ping(): Promise<number> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/ping`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Ping failed: ${response.status}`);
      }
      
      return Date.now() - startTime;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async send(data: any): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    // HTTP是请求-响应模式，send操作不常用
    throw new Error('HTTP transport does not support send operation, use request instead');
  }
  
  async request(data: any, timeout?: number): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    try {
      const requestTimeout = timeout || this.config.timeout || 30000;
      const endpoint = `${this.baseUrl}${data.path || '/'}`;
      
      const response = await fetch(endpoint, {
        method: data.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.config.metadata,
          ...data.headers
        },
        body: data.body ? JSON.stringify(data.body) : undefined,
        signal: AbortSignal.timeout(requestTimeout)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result;
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async *stream(data: any): AsyncIterableIterator<any> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    try {
      const endpoint = `${this.baseUrl}${data.path || '/stream'}`;
      
      const response = await fetch(endpoint, {
        method: data.method || 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...this.config.metadata,
          ...data.headers
        },
        body: data.body ? JSON.stringify(data.body) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP stream failed: ${response.status} ${response.statusText}`);
      }
      
      if (!response.body) {
        throw new Error('No response body for streaming');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          buffer += decoder.decode(value, { stream: true });
          
          // 处理SSE格式的数据
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6);
              if (jsonData === '[DONE]') {
                return;
              }
              
              try {
                const parsed = JSON.parse(jsonData);
                yield parsed;
              } catch {
                // 跳过无效的JSON数据
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  private generateId(): string {
    return `http-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * HTTP协议适配器
 */
export class HttpProtocolAdapter implements ProtocolAdapter {
  public readonly type = ProtocolType.HTTP;
  public readonly name = 'HTTP Adapter';
  public readonly version = '1.0.0';
  
  async createConnection(config: ConnectionConfig): Promise<Connection> {
    const connection = new HttpConnection(config);
    
    // 自动连接
    await connection.connect();
    
    return connection;
  }
  
  validateConfig(config: ConnectionConfig): boolean {
    return !!(config.host && config.port && config.port > 0 && config.port < 65536);
  }
  
  getDefaultConfig(): Partial<ConnectionConfig> {
    return {
      port: 80,
      timeout: 30000,
      ssl: false,
      metadata: {
        'User-Agent': 'Sker-UCP/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
  }
}

/**
 * HTTP协议上下文实现
 */
export class HttpProtocolContext implements ProtocolContext {
  public readonly protocol = ProtocolType.HTTP;
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