/**
 * gRPC流处理器
 */

import { EventEmitter } from 'events';
import { StreamOptimizerConfig } from '../types/grpc-types.js';

export interface StreamMessage<T = any> {
  data: T;
  metadata?: Record<string, any>;
  timestamp: Date;
  sequenceNumber?: number;
}

export interface StreamOptions {
  bufferSize?: number;
  timeout?: number;
  maxMessages?: number;
  enableBackpressure?: boolean;
  compressionEnabled?: boolean;
}

/**
 * 基础流处理器
 */
export abstract class BaseStreamHandler<T = any> extends EventEmitter {
  protected buffer: StreamMessage<T>[] = [];
  protected options: Required<StreamOptions>;
  protected isActive = false;
  protected messageCount = 0;
  protected sequenceNumber = 0;

  constructor(options: StreamOptions = {}) {
    super();
    this.options = {
      bufferSize: options.bufferSize || 1000,
      timeout: options.timeout || 30000,
      maxMessages: options.maxMessages || Number.MAX_SAFE_INTEGER,
      enableBackpressure: options.enableBackpressure ?? true,
      compressionEnabled: options.compressionEnabled ?? false
    };
  }

  /**
   * 启动流处理
   */
  abstract start(): Promise<void>;

  /**
   * 停止流处理
   */
  abstract stop(): Promise<void>;

  /**
   * 发送消息
   */
  abstract send(data: T, metadata?: Record<string, any>): Promise<void>;

  /**
   * 接收消息
   */
  abstract receive(): AsyncGenerator<StreamMessage<T>>;

  /**
   * 获取流状态
   */
  getStatus(): {
    isActive: boolean;
    bufferSize: number;
    messageCount: number;
    sequenceNumber: number;
  } {
    return {
      isActive: this.isActive,
      bufferSize: this.buffer.length,
      messageCount: this.messageCount,
      sequenceNumber: this.sequenceNumber
    };
  }

  /**
   * 创建流消息
   */
  protected createMessage(data: T, metadata?: Record<string, any>): StreamMessage<T> {
    return {
      data,
      metadata,
      timestamp: new Date(),
      sequenceNumber: ++this.sequenceNumber
    };
  }

  /**
   * 检查背压
   */
  protected checkBackpressure(): boolean {
    if (!this.options.enableBackpressure) {
      return false;
    }

    return this.buffer.length >= this.options.bufferSize;
  }

  /**
   * 处理背压
   */
  protected async handleBackpressure(): Promise<void> {
    if (this.checkBackpressure()) {
      this.emit('backpressure', { bufferSize: this.buffer.length });
      
      // 等待缓冲区空间
      while (this.buffer.length >= this.options.bufferSize * 0.8) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  /**
   * 验证消息限制
   */
  protected validateMessageLimit(): void {
    if (this.messageCount >= this.options.maxMessages) {
      throw new Error(`Message limit exceeded: ${this.options.maxMessages}`);
    }
  }
}

/**
 * 服务端流处理器
 */
export class ServerStreamHandler<T = any> extends BaseStreamHandler<T> {
  private responseStream?: AsyncGenerator<StreamMessage<T>>;

  async start(): Promise<void> {
    this.isActive = true;
    this.emit('stream:started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    this.buffer.length = 0;
    this.emit('stream:stopped');
  }

  async send(data: T, metadata?: Record<string, any>): Promise<void> {
    if (!this.isActive) {
      throw new Error('Stream is not active');
    }

    this.validateMessageLimit();
    await this.handleBackpressure();

    const message = this.createMessage(data, metadata);
    this.buffer.push(message);
    this.messageCount++;

    this.emit('message:sent', message);
  }

  async *receive(): AsyncGenerator<StreamMessage<T>> {
    while (this.isActive || this.buffer.length > 0) {
      if (this.buffer.length > 0) {
        const message = this.buffer.shift()!;
        this.emit('message:received', message);
        yield message;
      } else {
        // 等待新消息
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }
}

/**
 * 客户端流处理器
 */
export class ClientStreamHandler<T = any> extends BaseStreamHandler<T> {
  private requestGenerator?: AsyncGenerator<T>;

  constructor(options: StreamOptions = {}) {
    super(options);
  }

  async start(): Promise<void> {
    this.isActive = true;
    this.emit('stream:started');
  }

  async stop(): Promise<void> {
    this.isActive = false;
    this.emit('stream:stopped');
  }

  async send(data: T, metadata?: Record<string, any>): Promise<void> {
    if (!this.isActive) {
      throw new Error('Stream is not active');
    }

    this.validateMessageLimit();
    const message = this.createMessage(data, metadata);
    this.messageCount++;

    this.emit('message:sent', message);
  }

  async *receive(): AsyncGenerator<StreamMessage<T>> {
    // 客户端流通常不接收单个消息，而是在流结束时接收响应
    throw new Error('Client stream does not support individual message reception');
  }

  /**
   * 设置请求生成器
   */
  setRequestGenerator(generator: AsyncGenerator<T>): void {
    this.requestGenerator = generator;
  }

  /**
   * 获取请求生成器
   */
  getRequestGenerator(): AsyncGenerator<T> | undefined {
    return this.requestGenerator;
  }
}

/**
 * 双向流处理器
 */
export class BidirectionalStreamHandler<TReq = any, TRes = any> extends EventEmitter {
  private requestHandler: ClientStreamHandler<TReq>;
  private responseHandler: ServerStreamHandler<TRes>;
  private options: StreamOptions;

  constructor(options: StreamOptions = {}) {
    super();
    this.options = options;
    this.requestHandler = new ClientStreamHandler<TReq>(options);
    this.responseHandler = new ServerStreamHandler<TRes>(options);

    // 转发事件
    this.requestHandler.on('message:sent', (message) => {
      this.emit('request:sent', message);
    });

    this.responseHandler.on('message:received', (message) => {
      this.emit('response:received', message);
    });
  }

  /**
   * 启动双向流
   */
  async start(): Promise<void> {
    await Promise.all([
      this.requestHandler.start(),
      this.responseHandler.start()
    ]);
    this.emit('stream:started');
  }

  /**
   * 停止双向流
   */
  async stop(): Promise<void> {
    await Promise.all([
      this.requestHandler.stop(),
      this.responseHandler.stop()
    ]);
    this.emit('stream:stopped');
  }

  /**
   * 发送请求
   */
  async sendRequest(data: TReq, metadata?: Record<string, any>): Promise<void> {
    return this.requestHandler.send(data, metadata);
  }

  /**
   * 发送响应
   */
  async sendResponse(data: TRes, metadata?: Record<string, any>): Promise<void> {
    return this.responseHandler.send(data, metadata);
  }

  /**
   * 接收响应流
   */
  receiveResponses(): AsyncGenerator<StreamMessage<TRes>> {
    return this.responseHandler.receive();
  }

  /**
   * 获取请求处理器
   */
  getRequestHandler(): ClientStreamHandler<TReq> {
    return this.requestHandler;
  }

  /**
   * 获取响应处理器
   */
  getResponseHandler(): ServerStreamHandler<TRes> {
    return this.responseHandler;
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      request: this.requestHandler.getStatus(),
      response: this.responseHandler.getStatus()
    };
  }
}

/**
 * 流优化器
 */
export class StreamOptimizer {
  private config: StreamOptimizerConfig;

  constructor(config: StreamOptimizerConfig) {
    this.config = config;
  }

  /**
   * 优化消息批处理
   */
  async *optimizeBatching<T>(
    stream: AsyncGenerator<T>, 
    batchSize: number = this.config.batchSize
  ): AsyncGenerator<T[]> {
    let batch: T[] = [];
    const timeout = this.config.batchTimeout;
    let lastBatchTime = Date.now();

    for await (const message of stream) {
      batch.push(message);

      const shouldFlush = 
        batch.length >= batchSize || 
        (Date.now() - lastBatchTime) >= timeout;

      if (shouldFlush) {
        if (batch.length > 0) {
          yield [...batch];
          batch = [];
          lastBatchTime = Date.now();
        }
      }
    }

    // 发送剩余的批次
    if (batch.length > 0) {
      yield batch;
    }
  }

  /**
   * 优化背压控制
   */
  createBackpressureController<T>(): {
    controller: (stream: AsyncGenerator<T>) => AsyncGenerator<T>;
    metrics: () => { dropped: number; buffered: number };
  } {
    let droppedCount = 0;
    let buffer: T[] = [];
    const { highWaterMark, lowWaterMark, strategy } = this.config.backpressure;

    const controller = async function* (stream: AsyncGenerator<T>): AsyncGenerator<T> {
      for await (const message of stream) {
        if (buffer.length >= highWaterMark) {
          switch (strategy) {
            case 'drop_oldest':
              buffer.shift();
              droppedCount++;
              break;
            case 'drop_newest':
              droppedCount++;
              continue;
            case 'block':
              while (buffer.length >= lowWaterMark) {
                await new Promise(resolve => setTimeout(resolve, 1));
              }
              break;
          }
        }

        buffer.push(message);

        // 输出缓冲区中的消息
        while (buffer.length > 0) {
          yield buffer.shift()!;
        }
      }

      // 输出剩余消息
      while (buffer.length > 0) {
        yield buffer.shift()!;
      }
    };

    const metrics = () => ({
      dropped: droppedCount,
      buffered: buffer.length
    });

    return { controller, metrics };
  }

  /**
   * 压缩优化
   */
  async compressMessage(message: any): Promise<Buffer> {
    if (!this.config.compression.enabled) {
      return Buffer.from(JSON.stringify(message));
    }

    const jsonString = JSON.stringify(message);
    if (jsonString.length < this.config.compression.threshold!) {
      return Buffer.from(jsonString);
    }

    // 模拟压缩（实际应使用zlib等库）
    const compressed = Buffer.from(jsonString).toString('base64');
    return Buffer.from(compressed);
  }

  /**
   * 解压缩优化
   */
  async decompressMessage(buffer: Buffer): Promise<any> {
    if (!this.config.compression.enabled) {
      return JSON.parse(buffer.toString());
    }

    // 模拟解压缩
    try {
      const decompressed = Buffer.from(buffer.toString(), 'base64').toString();
      return JSON.parse(decompressed);
    } catch {
      // 如果解压缩失败，尝试直接解析
      return JSON.parse(buffer.toString());
    }
  }
}