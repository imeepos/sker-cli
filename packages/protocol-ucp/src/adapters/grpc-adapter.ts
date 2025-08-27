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
 * gRPC连接实现
 * 注意: 这是一个基础实现框架，实际使用需要安装和配置gRPC相关依赖
 */
export class GrpcConnection extends EventEmitter implements Connection {
  public readonly id: string;
  public readonly protocol = ProtocolType.GRPC;
  public readonly config: ConnectionConfig;
  
  private _status: ProtocolStatus = ProtocolStatus.DISCONNECTED;
  private client?: any; // grpc客户端实例
  
  constructor(config: ConnectionConfig) {
    super();
    this.id = this.generateId();
    this.config = config;
  }
  
  get status(): ProtocolStatus {
    return this._status;
  }
  
  async connect(): Promise<void> {
    this._status = ProtocolStatus.CONNECTING;
    this.emit('status', this._status);
    
    try {
      // 这里需要实际的gRPC客户端初始化逻辑
      // 由于gRPC依赖较重，此处仅提供接口框架
      
      // 示例代码结构:
      // const grpc = require('@grpc/grpc-js');
      // const protoLoader = require('@grpc/proto-loader');
      // 
      // const packageDefinition = protoLoader.loadSync(this.config.protoPath);
      // const protoDescriptor = grpc.loadPackageDefinition(packageDefinition);
      // 
      // this.client = new protoDescriptor.ServiceName(
      //   `${this.config.host}:${this.config.port}`,
      //   this.config.ssl ? grpc.credentials.createSsl() : grpc.credentials.createInsecure()
      // );
      
      // 模拟连接过程
      await new Promise((resolve) => setTimeout(resolve, 100));
      
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
    if (this.client) {
      // 实际的gRPC客户端关闭逻辑
      // this.client.close();
    }
    
    this._status = ProtocolStatus.DISCONNECTED;
    this.emit('status', this._status);
    this.emit('disconnect');
  }
  
  isConnected(): boolean {
    return this._status === ProtocolStatus.CONNECTED;
  }
  
  async ping(): Promise<number> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    const startTime = Date.now();
    
    // 实际的gRPC ping实现
    // const deadline = new Date(Date.now() + 5000);
    // return new Promise((resolve, reject) => {
    //   this.client.ping({}, { deadline }, (error, response) => {
    //     if (error) {
    //       reject(error);
    //     } else {
    //       resolve(Date.now() - startTime);
    //     }
    //   });
    // });
    
    // 模拟ping延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    return Date.now() - startTime;
  }
  
  async send(data: any): Promise<void> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    // gRPC通常不使用单向发送，而是RPC调用
    throw new Error('gRPC does not support send operation, use request instead');
  }
  
  async request(data: any, timeout?: number): Promise<any> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    return new Promise((resolve, reject) => {
      const deadline = new Date(Date.now() + (timeout || this.config.timeout || 30000));
      
      // 实际的gRPC调用实现
      // this.client[data.method](data.request, { deadline }, (error, response) => {
      //   if (error) {
      //     reject(new Error(`gRPC call failed: ${error.message}`));
      //   } else {
      //     resolve(response);
      //   }
      // });
      
      // 模拟gRPC响应
      setTimeout(() => {
        resolve({
          success: true,
          data: `Simulated gRPC response for ${data.method}`,
          timestamp: Date.now()
        });
      }, 10);
    });
  }
  
  async *stream(data: any): AsyncIterableIterator<any> {
    if (!this.isConnected()) {
      throw new Error('Connection not established');
    }
    
    // 实际的gRPC流实现
    // const call = this.client[data.method](data.request);
    // 
    // call.on('data', (response) => {
    //   // 处理流数据
    // });
    // 
    // call.on('end', () => {
    //   // 流结束
    // });
    // 
    // call.on('error', (error) => {
    //   throw error;
    // });
    
    // 模拟gRPC流
    for (let i = 0; i < 5; i++) {
      yield {
        index: i,
        data: `Simulated gRPC stream data ${i}`,
        timestamp: Date.now()
      };
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  private generateId(): string {
    return `grpc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * gRPC协议适配器
 */
export class GrpcProtocolAdapter implements ProtocolAdapter {
  public readonly type = ProtocolType.GRPC;
  public readonly name = 'gRPC Adapter';
  public readonly version = '1.0.0';
  
  async createConnection(config: ConnectionConfig): Promise<Connection> {
    if (!this.validateConfig(config)) {
      throw new Error('Invalid gRPC configuration');
    }
    
    const connection = new GrpcConnection(config);
    
    // 自动连接
    await connection.connect();
    
    return connection;
  }
  
  validateConfig(config: ConnectionConfig): boolean {
    if (!config.host || !config.port) {
      return false;
    }
    
    if (config.port <= 0 || config.port >= 65536) {
      return false;
    }
    
    // 检查是否有proto文件路径或服务定义
    if (!config.metadata?.protoPath && !config.metadata?.serviceDefinition) {
      console.warn('gRPC config missing protoPath or serviceDefinition');
    }
    
    return true;
  }
  
  getDefaultConfig(): Partial<ConnectionConfig> {
    return {
      port: 50051,
      timeout: 30000,
      ssl: false,
      keepAlive: true,
      compression: 'gzip',
      metadata: {
        'grpc.keepalive_time_ms': 30000,
        'grpc.keepalive_timeout_ms': 5000,
        'grpc.keepalive_permit_without_stream': true,
        'grpc.max_receive_message_length': 4 * 1024 * 1024, // 4MB
        'grpc.max_send_message_length': 4 * 1024 * 1024     // 4MB
      }
    };
  }
}

/**
 * gRPC协议上下文实现
 */
export class GrpcProtocolContext implements ProtocolContext {
  public readonly protocol = ProtocolType.GRPC;
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
  
  /**
   * 获取gRPC调用的deadline
   */
  getDeadline(timeoutMs?: number): Date {
    const timeout = timeoutMs || this.getMetadata('timeout') || 30000;
    return new Date(Date.now() + timeout);
  }
  
  /**
   * 设置gRPC调用选项
   */
  getCallOptions(): any {
    return {
      deadline: this.getDeadline(),
      ...this.getAllMetadata()
    };
  }
}