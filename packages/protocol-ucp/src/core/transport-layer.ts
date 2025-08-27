import { EventEmitter } from 'events';
import { WebSocket } from 'ws';
import {
  Transport,
  TransportType,
  TransportStatus,
  TransportConfig,
  TransportMessage,
  TransportFactory,
  TransportManager,
  TransportListener,
  ConnectionPool
} from '../interfaces/transport.js';

/**
 * 基础传输层实现
 */
export abstract class BaseTransport extends EventEmitter implements Transport {
  public readonly id: string;
  public readonly type: TransportType;
  public readonly endpoint: string;
  public readonly config: TransportConfig;
  
  protected _status: TransportStatus = TransportStatus.IDLE;
  protected reconnectAttempts = 0;
  protected reconnectTimer?: NodeJS.Timeout;
  
  constructor(config: TransportConfig) {
    super();
    this.id = this.generateId();
    this.type = config.type;
    this.endpoint = config.endpoint;
    this.config = config;
  }
  
  get status(): TransportStatus {
    return this._status;
  }
  
  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract send(message: TransportMessage): Promise<void>;
  abstract request(message: TransportMessage): Promise<TransportMessage>;
  
  protected setStatus(status: TransportStatus): void {
    if (this._status !== status) {
      this._status = status;
      this.emit('status', status);
    }
  }
  
  protected generateId(): string {
    return `${this.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  protected async handleReconnect(): Promise<void> {
    const maxAttempts = this.config.options?.maxReconnectAttempts || 5;
    const interval = this.config.options?.reconnectInterval || 1000;
    
    if (!this.config.options?.reconnect || this.reconnectAttempts >= maxAttempts) {
      return;
    }
    
    this.reconnectAttempts++;
    this.setStatus(TransportStatus.CONNECTING);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.reconnectAttempts = 0;
      } catch (error) {
        this.emit('error', error);
        await this.handleReconnect();
      }
    }, interval * Math.pow(2, this.reconnectAttempts - 1)); // 指数退避
  }
  
  protected clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }
  }
}

/**
 * HTTP传输实现
 */
export class HttpTransport extends BaseTransport {
  private responseHandlers: Map<string, (response: TransportMessage) => void> = new Map();
  
  constructor(config: TransportConfig) {
    super(config);
  }
  
  async connect(): Promise<void> {
    this.setStatus(TransportStatus.CONNECTING);
    
    try {
      // HTTP是无状态的，这里主要是验证端点可达性
      const response = await fetch(`${this.endpoint}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.options?.timeout || 5000)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP transport connection failed: ${response.status}`);
      }
      
      this.setStatus(TransportStatus.CONNECTED);
      this.emit('connect');
      
    } catch (error) {
      this.setStatus(TransportStatus.ERROR);
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.setStatus(TransportStatus.DISCONNECTED);
    this.emit('disconnect');
  }
  
  async send(message: TransportMessage): Promise<void> {
    if (this.status !== TransportStatus.CONNECTED) {
      throw new Error('Transport not connected');
    }
    
    try {
      const endpoint = `${this.endpoint}${message.service ? `/${message.service}` : ''}${message.method ? `/${message.method}` : ''}`;
      
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...message.headers
        },
        body: JSON.stringify(message.payload),
        signal: message.timeout ? AbortSignal.timeout(message.timeout) : undefined
      });
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async request(message: TransportMessage): Promise<TransportMessage> {
    if (this.status !== TransportStatus.CONNECTED) {
      throw new Error('Transport not connected');
    }
    
    try {
      const endpoint = `${this.endpoint}${message.service ? `/${message.service}` : ''}${message.method ? `/${message.method}` : ''}`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...message.headers
        },
        body: JSON.stringify(message.payload),
        signal: message.timeout ? AbortSignal.timeout(message.timeout) : undefined
      });
      
      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.status} ${response.statusText}`);
      }
      
      const responseData = await response.json();
      
      return {
        id: this.generateId(),
        type: 'response',
        headers: Object.fromEntries(response.headers.entries()),
        payload: responseData,
        timestamp: Date.now()
      };
      
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
}

/**
 * WebSocket传输实现
 */
export class WebSocketTransport extends BaseTransport {
  private ws: WebSocket | undefined;
  private heartbeatTimer?: NodeJS.Timeout;
  private responseHandlers: Map<string, (response: TransportMessage) => void> = new Map();
  
  constructor(config: TransportConfig) {
    super(config);
  }
  
  async connect(): Promise<void> {
    this.setStatus(TransportStatus.CONNECTING);
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.endpoint);
        
        this.ws.onopen = () => {
          this.setStatus(TransportStatus.CONNECTED);
          this.setupHeartbeat();
          this.emit('connect');
          resolve();
        };
        
        this.ws.onclose = (event) => {
          this.setStatus(TransportStatus.DISCONNECTED);
          this.clearHeartbeat();
          this.emit('disconnect', event.reason);
          
          if (event.code !== 1000 && this.config.options?.reconnect) {
            this.handleReconnect();
          }
        };
        
        this.ws.onerror = (error) => {
          this.setStatus(TransportStatus.ERROR);
          this.emit('error', error);
          reject(error);
        };
        
        this.ws.onmessage = (event) => {
          try {
            const message: TransportMessage = JSON.parse(event.data.toString());
            
            if (message.type === 'response') {
              const handler = this.responseHandlers.get(message.id);
              if (handler) {
                this.responseHandlers.delete(message.id);
                handler(message);
              }
            } else {
              this.emit('message', message);
            }
          } catch (error) {
            this.emit('error', error);
          }
        };
        
      } catch (error) {
        this.setStatus(TransportStatus.ERROR);
        reject(error);
      }
    });
  }
  
  async disconnect(): Promise<void> {
    this.clearReconnectTimer();
    this.clearHeartbeat();
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.close(1000, 'Normal closure');
    }
    
    this.setStatus(TransportStatus.DISCONNECTED);
  }
  
  async send(message: TransportMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }
  
  async request(message: TransportMessage): Promise<TransportMessage> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }
    
    return new Promise((resolve, reject) => {
      const timeout = message.timeout || 30000;
      
      const timer = setTimeout(() => {
        this.responseHandlers.delete(message.id);
        reject(new Error('Request timeout'));
      }, timeout);
      
      this.responseHandlers.set(message.id, (response) => {
        clearTimeout(timer);
        resolve(response);
      });
      
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        this.responseHandlers.delete(message.id);
        clearTimeout(timer);
        reject(error);
      }
    });
  }
  
  private setupHeartbeat(): void {
    const interval = this.config.options?.heartbeat || 30000;
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        const heartbeat: TransportMessage = {
          id: this.generateId(),
          type: 'event',
          headers: {},
          payload: { type: 'heartbeat' },
          timestamp: Date.now()
        };
        
        this.ws.send(JSON.stringify(heartbeat));
      }
    }, interval);
  }
  
  private clearHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
    }
  }
}

/**
 * 传输工厂实现
 */
export class DefaultTransportFactory implements TransportFactory {
  async createTransport(config: TransportConfig): Promise<Transport> {
    switch (config.type) {
      case TransportType.HTTP:
        return new HttpTransport(config);
      case TransportType.WEBSOCKET:
        return new WebSocketTransport(config);
      default:
        throw new Error(`Unsupported transport type: ${config.type}`);
    }
  }
  
  supportedTypes(): TransportType[] {
    return [TransportType.HTTP, TransportType.WEBSOCKET];
  }
  
  validateConfig(config: TransportConfig): boolean {
    if (!config.endpoint || !config.type) {
      return false;
    }
    
    return this.supportedTypes().includes(config.type);
  }
}

/**
 * 传输管理器实现
 */
export class DefaultTransportManager implements TransportManager {
  private transports: Map<string, Transport> = new Map();
  private factories: Map<TransportType, TransportFactory> = new Map();
  
  constructor() {
    // 注册默认工厂
    const defaultFactory = new DefaultTransportFactory();
    for (const type of defaultFactory.supportedTypes()) {
      this.factories.set(type, defaultFactory);
    }
  }
  
  async createTransport(config: TransportConfig): Promise<Transport> {
    const factory = this.factories.get(config.type);
    if (!factory) {
      throw new Error(`No factory registered for transport type: ${config.type}`);
    }
    
    if (!factory.validateConfig(config)) {
      throw new Error(`Invalid config for transport type: ${config.type}`);
    }
    
    const transport = await factory.createTransport(config);
    this.transports.set(transport.id, transport);
    
    // 监听传输状态变化
    transport.on('disconnect', () => {
      this.transports.delete(transport.id);
    });
    
    return transport;
  }
  
  getTransport(id: string): Transport | undefined {
    return this.transports.get(id);
  }
  
  async removeTransport(id: string): Promise<void> {
    const transport = this.transports.get(id);
    if (transport) {
      await transport.disconnect();
      this.transports.delete(id);
    }
  }
  
  listTransports(): Transport[] {
    return Array.from(this.transports.values());
  }
  
  registerFactory(type: TransportType, factory: TransportFactory): void {
    this.factories.set(type, factory);
  }
  
  unregisterFactory(type: TransportType): void {
    this.factories.delete(type);
  }
}