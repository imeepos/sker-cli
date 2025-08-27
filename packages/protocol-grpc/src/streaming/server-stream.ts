/**
 * 服务端流实现
 */

import { EventEmitter } from 'events';
import { ServerStreamHandler, StreamOptions } from './stream-handler.js';

export interface ServerStreamOptions extends StreamOptions {
  chunkSize?: number;
  throttleMs?: number;
  maxConcurrentStreams?: number;
}

/**
 * 服务端流包装器
 */
export class ServerStream<T = any> extends EventEmitter {
  private handler: ServerStreamHandler<T>;
  private options: Required<ServerStreamOptions>;
  protected isActive = false;
  private sentCount = 0;
  private throttleTimer?: NodeJS.Timeout;

  constructor(options: ServerStreamOptions = {}) {
    super();
    
    this.options = {
      bufferSize: options.bufferSize || 1000,
      timeout: options.timeout || 30000,
      maxMessages: options.maxMessages || Number.MAX_SAFE_INTEGER,
      enableBackpressure: options.enableBackpressure ?? true,
      compressionEnabled: options.compressionEnabled ?? false,
      chunkSize: options.chunkSize || 100,
      throttleMs: options.throttleMs || 0,
      maxConcurrentStreams: options.maxConcurrentStreams || 10
    };

    this.handler = new ServerStreamHandler<T>(this.options);
    this.setupHandlerEvents();
  }

  /**
   * 启动服务端流
   */
  async start(): Promise<void> {
    if (this.isActive) {
      return;
    }

    try {
      await this.handler.start();
      this.isActive = true;
      this.emit('stream:started');
    } catch (error) {
      this.emit('error', { type: 'start', error });
      throw error;
    }
  }

  /**
   * 结束服务端流
   */
  async end(): Promise<void> {
    if (!this.isActive) {
      return;
    }

    try {
      await this.handler.stop();
      this.isActive = false;
      this.clearThrottleTimer();
      this.emit('stream:ended', { sentCount: this.sentCount });
    } catch (error) {
      this.emit('error', { type: 'end', error });
      throw error;
    }
  }

  /**
   * 发送单个数据项
   */
  async send(data: T, metadata?: Record<string, any>): Promise<void> {
    if (!this.isActive) {
      throw new Error('Stream is not active');
    }

    try {
      await this.applyThrottle();
      await this.handler.send(data, metadata);
      this.sentCount++;
      this.emit('data:sent', { data, sentCount: this.sentCount });
    } catch (error) {
      this.emit('error', { type: 'send', error, data });
      throw error;
    }
  }

  /**
   * 批量发送数据
   */
  async sendBatch(items: T[], metadata?: Record<string, any>): Promise<void> {
    for (const item of items) {
      await this.send(item, metadata);
    }
  }

  /**
   * 分块发送大型数据集
   */
  async sendChunked(items: T[], metadata?: Record<string, any>): Promise<void> {
    const chunkSize = this.options.chunkSize;
    
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await this.sendBatch(chunk, metadata);
      
      this.emit('chunk:sent', { 
        chunkIndex: Math.floor(i / chunkSize),
        chunkSize: chunk.length,
        totalSent: Math.min(i + chunkSize, items.length),
        total: items.length
      });
    }
  }

  /**
   * 从生成器发送数据流
   */
  async sendFromGenerator(generator: AsyncGenerator<T>, metadata?: Record<string, any>): Promise<void> {
    try {
      for await (const data of generator) {
        await this.send(data, metadata);
      }
    } catch (error) {
      this.emit('error', { type: 'generator', error });
      throw error;
    }
  }

  /**
   * 从数组创建流
   */
  async sendFromArray(items: T[], metadata?: Record<string, any>): Promise<void> {
    await this.sendChunked(items, metadata);
  }

  /**
   * 获取客户端接收器
   */
  getReceiver(): AsyncGenerator<T> {
    return this.handler.receive() as AsyncGenerator<T>;
  }

  /**
   * 获取流状态
   */
  getStatus(): {
    isActive: boolean;
    sentCount: number;
    handlerStatus: any;
  } {
    return {
      isActive: this.isActive,
      sentCount: this.sentCount,
      handlerStatus: this.handler.getStatus()
    };
  }

  /**
   * 设置处理器事件
   */
  private setupHandlerEvents(): void {
    this.handler.on('message:sent', (message) => {
      this.emit('message:sent', message);
    });

    this.handler.on('stream:started', () => {
      this.emit('handler:started');
    });

    this.handler.on('stream:stopped', () => {
      this.emit('handler:stopped');
    });
  }

  /**
   * 应用限流
   */
  private async applyThrottle(): Promise<void> {
    if (this.options.throttleMs > 0) {
      return new Promise(resolve => {
        this.throttleTimer = setTimeout(resolve, this.options.throttleMs);
      });
    }
  }

  /**
   * 清除限流计时器
   */
  private clearThrottleTimer(): void {
    if (this.throttleTimer) {
      clearTimeout(this.throttleTimer);
      this.throttleTimer = undefined;
    }
  }
}

/**
 * 数据导出流
 */
export class DataExportStream<T = any> extends ServerStream<T> {
  private exportedCount = 0;
  private startTime?: Date;

  constructor(options: ServerStreamOptions = {}) {
    super({
      ...options,
      chunkSize: options.chunkSize || 1000, // 大块适合数据导出
      throttleMs: options.throttleMs || 10   // 轻微限流避免压垮客户端
    });
  }

  /**
   * 开始数据导出
   */
  async startExport(): Promise<void> {
    this.startTime = new Date();
    await this.start();
    this.emit('export:started', { startTime: this.startTime });
  }

  /**
   * 导出查询结果
   */
  async exportQueryResults(
    query: () => AsyncGenerator<T> | Promise<T[]>,
    formatter?: (item: T) => T
  ): Promise<void> {
    const results = await query();
    
    if (Array.isArray(results)) {
      await this.exportArray(results, formatter);
    } else {
      await this.exportFromGenerator(results, formatter);
    }
  }

  /**
   * 导出数组数据
   */
  async exportArray(items: T[], formatter?: (item: T) => T): Promise<void> {
    const processedItems = formatter ? items.map(formatter) : items;
    await this.sendFromArray(processedItems);
    this.exportedCount = processedItems.length;
    
    this.emit('export:completed', {
      count: this.exportedCount,
      duration: this.getExportDuration()
    });
  }

  /**
   * 从生成器导出数据
   */
  async exportFromGenerator(generator: AsyncGenerator<T>, formatter?: (item: T) => T): Promise<void> {
    let count = 0;
    
    for await (const item of generator) {
      const processedItem = formatter ? formatter(item) : item;
      await this.send(processedItem);
      count++;
    }
    
    this.exportedCount = count;
    this.emit('export:completed', {
      count: this.exportedCount,
      duration: this.getExportDuration()
    });
  }

  /**
   * 获取导出统计
   */
  getExportStats(): {
    exported: number;
    duration: number;
    rate: number;
    startTime?: Date;
  } {
    const duration = this.getExportDuration();
    const rate = duration > 0 ? this.exportedCount / (duration / 1000) : 0;

    return {
      exported: this.exportedCount,
      duration,
      rate,
      startTime: this.startTime
    };
  }

  /**
   * 获取导出持续时间
   */
  private getExportDuration(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0;
  }
}

/**
 * 实时事件流
 */
export class RealTimeEventStream<T = any> extends ServerStream<T> {
  private subscribers = new Set<string>();
  private eventBuffer: T[] = [];
  private maxBufferSize: number;

  constructor(options: ServerStreamOptions & { maxBufferSize?: number } = {}) {
    super({
      ...options,
      throttleMs: options.throttleMs || 50 // 实时流需要较低延迟
    });
    
    this.maxBufferSize = options.maxBufferSize || 1000;
  }

  /**
   * 添加订阅者
   */
  async addSubscriber(subscriberId: string): Promise<void> {
    this.subscribers.add(subscriberId);
    
    // 发送缓冲的事件
    if (this.eventBuffer.length > 0) {
      await this.sendBatch([...this.eventBuffer]);
    }
    
    this.emit('subscriber:added', { subscriberId, count: this.subscribers.size });
  }

  /**
   * 移除订阅者
   */
  removeSubscriber(subscriberId: string): boolean {
    const removed = this.subscribers.delete(subscriberId);
    if (removed) {
      this.emit('subscriber:removed', { subscriberId, count: this.subscribers.size });
    }
    return removed;
  }

  /**
   * 发布事件
   */
  async publishEvent(event: T, metadata?: Record<string, any>): Promise<void> {
    // 添加到缓冲区
    this.eventBuffer.push(event);
    if (this.eventBuffer.length > this.maxBufferSize) {
      this.eventBuffer.shift(); // 移除最旧的事件
    }

    // 如果有活跃流，立即发送
    if (this.isActive && this.subscribers.size > 0) {
      await this.send(event, metadata);
    }
    
    this.emit('event:published', { event, subscriberCount: this.subscribers.size });
  }

  /**
   * 批量发布事件
   */
  async publishEvents(events: T[], metadata?: Record<string, any>): Promise<void> {
    for (const event of events) {
      await this.publishEvent(event, metadata);
    }
  }

  /**
   * 获取订阅统计
   */
  getSubscriptionStats(): {
    subscriberCount: number;
    subscribers: string[];
    bufferedEvents: number;
    maxBufferSize: number;
  } {
    return {
      subscriberCount: this.subscribers.size,
      subscribers: Array.from(this.subscribers),
      bufferedEvents: this.eventBuffer.length,
      maxBufferSize: this.maxBufferSize
    };
  }

  /**
   * 清空事件缓冲区
   */
  clearEventBuffer(): void {
    const clearedCount = this.eventBuffer.length;
    this.eventBuffer = [];
    this.emit('buffer:cleared', { clearedCount });
  }
}

/**
 * 日志流
 */
export class LogStream extends RealTimeEventStream<{
  level: string;
  message: string;
  timestamp: Date;
  source?: string;
  metadata?: any;
}> {
  constructor(options: ServerStreamOptions = {}) {
    super({
      ...options,
      maxBufferSize: options.maxMessages || 5000, // 更大的日志缓冲区
      throttleMs: options.throttleMs || 20           // 较低延迟
    });
  }

  /**
   * 记录日志
   */
  async log(level: string, message: string, source?: string, metadata?: any): Promise<void> {
    const logEntry = {
      level,
      message,
      timestamp: new Date(),
      source,
      metadata
    };

    await this.publishEvent(logEntry);
  }

  /**
   * 记录信息日志
   */
  async info(message: string, source?: string, metadata?: any): Promise<void> {
    await this.log('info', message, source, metadata);
  }

  /**
   * 记录警告日志
   */
  async warn(message: string, source?: string, metadata?: any): Promise<void> {
    await this.log('warn', message, source, metadata);
  }

  /**
   * 记录错误日志
   */
  async error(message: string, source?: string, metadata?: any): Promise<void> {
    await this.log('error', message, source, metadata);
  }

  /**
   * 记录调试日志
   */
  async debug(message: string, source?: string, metadata?: any): Promise<void> {
    await this.log('debug', message, source, metadata);
  }
}