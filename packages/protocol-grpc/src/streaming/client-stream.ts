/**
 * 客户端流实现
 */

import { EventEmitter } from 'events';
import { ClientStreamHandler, StreamOptions } from './stream-handler.js';

export interface ClientStreamOptions extends StreamOptions {
  batchSize?: number;
  flushInterval?: number;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * 客户端流包装器
 */
export class ClientStream<TReq = any, TRes = any> extends EventEmitter {
  private handler: ClientStreamHandler<TReq>;
  private options: Required<ClientStreamOptions>;
  private buffer: TReq[] = [];
  private flushTimer?: NodeJS.Timeout;
  private isActive = false;
  private retryCount = 0;

  constructor(options: ClientStreamOptions = {}) {
    super();
    
    this.options = {
      bufferSize: options.bufferSize || 1000,
      timeout: options.timeout || 30000,
      maxMessages: options.maxMessages || Number.MAX_SAFE_INTEGER,
      enableBackpressure: options.enableBackpressure ?? true,
      compressionEnabled: options.compressionEnabled ?? false,
      batchSize: options.batchSize || 100,
      flushInterval: options.flushInterval || 1000, // 1秒
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000
    };

    this.handler = new ClientStreamHandler<TReq>(this.options);
    this.setupHandlerEvents();
  }

  /**
   * 开始流传输
   */
  async start(): Promise<void> {
    if (this.isActive) {
      return;
    }

    try {
      await this.handler.start();
      this.isActive = true;
      this.startFlushTimer();
      this.emit('stream:started');
    } catch (error) {
      this.emit('error', { type: 'start', error });
      throw error;
    }
  }

  /**
   * 结束流传输并获取响应
   */
  async end(): Promise<TRes> {
    if (!this.isActive) {
      throw new Error('Stream is not active');
    }

    try {
      // 刷新缓冲区
      await this.flush();
      
      // 停止定时器
      this.stopFlushTimer();
      
      // 结束流
      await this.handler.stop();
      this.isActive = false;

      // 模拟获取最终响应
      const response = await this.getFinalResponse();
      
      this.emit('stream:ended', { response });
      return response;
    } catch (error) {
      this.emit('error', { type: 'end', error });
      throw error;
    }
  }

  /**
   * 写入数据到流
   */
  async write(data: TReq, metadata?: Record<string, any>): Promise<void> {
    if (!this.isActive) {
      throw new Error('Stream is not active');
    }

    this.buffer.push(data);
    this.emit('data:buffered', { data, bufferSize: this.buffer.length });

    // 检查是否需要立即刷新
    if (this.buffer.length >= this.options.batchSize) {
      await this.flush();
    }
  }

  /**
   * 批量写入数据
   */
  async writeBatch(items: TReq[]): Promise<void> {
    for (const item of items) {
      await this.write(item);
    }
  }

  /**
   * 从生成器写入数据流
   */
  async writeFromGenerator(generator: AsyncGenerator<TReq>): Promise<void> {
    this.handler.setRequestGenerator(generator);
    
    for await (const data of generator) {
      await this.write(data);
    }
  }

  /**
   * 刷新缓冲区
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) {
      return;
    }

    const batch = [...this.buffer];
    this.buffer = [];

    try {
      await this.sendBatch(batch);
      this.emit('batch:flushed', { count: batch.length });
    } catch (error) {
      // 重试机制
      if (this.retryCount < this.options.maxRetries) {
        this.retryCount++;
        this.buffer.unshift(...batch); // 将数据放回缓冲区
        
        setTimeout(async () => {
          await this.flush();
        }, this.options.retryDelay * this.retryCount);
        
        this.emit('batch:retry', { 
          attempt: this.retryCount, 
          count: batch.length,
          error 
        });
      } else {
        this.emit('error', { type: 'flush', error, lostData: batch });
        throw error;
      }
    }
  }

  /**
   * 获取流状态
   */
  getStatus(): {
    isActive: boolean;
    bufferSize: number;
    retryCount: number;
    handlerStatus: any;
  } {
    return {
      isActive: this.isActive,
      bufferSize: this.buffer.length,
      retryCount: this.retryCount,
      handlerStatus: this.handler.getStatus()
    };
  }

  /**
   * 取消流传输
   */
  async cancel(reason?: string): Promise<void> {
    try {
      this.stopFlushTimer();
      await this.handler.stop();
      this.isActive = false;
      this.buffer = [];
      this.emit('stream:cancelled', { reason });
    } catch (error) {
      this.emit('error', { type: 'cancel', error });
      throw error;
    }
  }

  /**
   * 设置处理器事件
   */
  public setupHandlerEvents(): void {
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
   * 启动刷新定时器
   */
  private startFlushTimer(): void {
    this.flushTimer = setInterval(async () => {
      if (this.buffer.length > 0) {
        try {
          await this.flush();
        } catch (error) {
          this.emit('timer:flush_error', error);
        }
      }
    }, this.options.flushInterval);
  }

  /**
   * 停止刷新定时器
   */
  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * 发送批次数据
   */
  private async sendBatch(batch: TReq[]): Promise<void> {
    for (const item of batch) {
      await this.handler.send(item);
    }
    this.retryCount = 0; // 重置重试计数
  }

  /**
   * 获取最终响应（模拟实现）
   */
  private async getFinalResponse(): Promise<TRes> {
    // 模拟获取服务器响应
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          processedCount: this.handler.getStatus().messageCount,
          timestamp: new Date()
        } as TRes);
      }, 100);
    });
  }
}

/**
 * 批量上传流
 */
export class BatchUploadStream<T = any> extends ClientStream<T, { uploaded: number; failed: number }> {
  private uploadedCount = 0;
  private failedCount = 0;

  constructor(options: ClientStreamOptions = {}) {
    super({
      ...options,
      batchSize: options.batchSize || 50, // 适合上传的批次大小
      flushInterval: options.flushInterval || 2000 // 2秒刷新间隔
    });
  }

  /**
   * 上传文件数据
   */
  async uploadFile(fileData: T, fileName: string, metadata?: Record<string, any>): Promise<void> {
    const uploadData = {
      fileName,
      data: fileData,
      timestamp: new Date(),
      ...metadata
    } as T;

    await this.write(uploadData);
  }

  /**
   * 批量上传文件
   */
  async uploadFiles(files: Array<{ name: string; data: T; metadata?: Record<string, any> }>): Promise<void> {
    for (const file of files) {
      await this.uploadFile(file.data, file.name, file.metadata);
    }
  }

  /**
   * 获取上传统计
   */
  getUploadStats(): {
    uploaded: number;
    failed: number;
    total: number;
    progress: number;
  } {
    const total = this.uploadedCount + this.failedCount + this.getStatus().bufferSize;
    const progress = total > 0 ? (this.uploadedCount / total) * 100 : 0;

    return {
      uploaded: this.uploadedCount,
      failed: this.failedCount,
      total,
      progress
    };
  }

  public override setupHandlerEvents(): void {
    super.setupHandlerEvents();

    this.on('batch:flushed', ({ count }) => {
      this.uploadedCount += count;
      this.emit('upload:progress', this.getUploadStats());
    });

    this.on('batch:retry', ({ count }) => {
      this.failedCount += count;
      this.emit('upload:failed', { count, stats: this.getUploadStats() });
    });
  }
}

/**
 * 数据导入流
 */
export class DataImportStream<T = any> extends ClientStream<T, { imported: number; errors: string[] }> {
  private importedCount = 0;
  private errors: string[] = [];

  constructor(options: ClientStreamOptions = {}) {
    super({
      ...options,
      batchSize: options.batchSize || 1000, // 大批次适合数据导入
      flushInterval: options.flushInterval || 5000 // 5秒刷新间隔
    });
  }

  /**
   * 导入记录
   */
  async importRecord(record: T, validation?: (record: T) => boolean): Promise<void> {
    if (validation && !validation(record)) {
      const error = `Invalid record: ${JSON.stringify(record)}`;
      this.errors.push(error);
      this.emit('import:validation_error', { record, error });
      return;
    }

    await this.write(record);
  }

  /**
   * 从CSV导入数据
   */
  async importFromCSV(csvData: string, parser: (row: string) => T): Promise<void> {
    const lines = csvData.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      try {
        const record = parser(line);
        await this.importRecord(record);
      } catch (error) {
        this.errors.push(`Failed to parse line: ${line}, Error: ${(error as Error).message}`);
        this.emit('import:parse_error', { line, error });
      }
    }
  }

  /**
   * 获取导入统计
   */
  getImportStats(): {
    imported: number;
    errors: number;
    pending: number;
    errorList: string[];
  } {
    return {
      imported: this.importedCount,
      errors: this.errors.length,
      pending: this.getStatus().bufferSize,
      errorList: [...this.errors]
    };
  }

  public override setupHandlerEvents(): void {
    super.setupHandlerEvents();

    this.on('batch:flushed', ({ count }) => {
      this.importedCount += count;
      this.emit('import:progress', this.getImportStats());
    });
  }
}