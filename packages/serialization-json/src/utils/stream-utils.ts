/**
 * 流处理工具函数
 */

import { Readable, Writable, Transform, pipeline } from 'stream';
import { promisify } from 'util';
import { EventEmitter } from 'events';

const pipelineAsync = promisify(pipeline);

/**
 * 流错误处理器
 */
export class StreamErrorHandler extends EventEmitter {
  private errorCount = 0;
  private maxErrors: number;

  constructor(maxErrors = 10) {
    super();
    this.maxErrors = maxErrors;
  }

  handleError(error: Error, source?: string): void {
    this.errorCount++;
    this.emit('error', { error, source, count: this.errorCount });

    if (this.errorCount >= this.maxErrors) {
      this.emit('maxErrors', { maxErrors: this.maxErrors, totalErrors: this.errorCount });
    }
  }

  getErrorCount(): number {
    return this.errorCount;
  }

  reset(): void {
    this.errorCount = 0;
  }
}

/**
 * 背压控制器
 */
export class BackpressureController extends EventEmitter {
  private bufferSize = 0;
  private threshold: number;
  private timeout: number;
  private drainTimer?: NodeJS.Timeout;

  constructor(threshold = 100 * 1024, timeout = 5000) {
    super();
    this.threshold = threshold;
    this.timeout = timeout;
  }

  checkBackpressure(stream: Writable): boolean {
    const writableLength = (stream as any)._writableState?.length || 0;
    const isBackpressured = writableLength >= this.threshold;

    if (isBackpressured) {
      this.emit('backpressure', { bufferSize: writableLength, threshold: this.threshold });
      this.startDrainTimer(stream);
    }

    return isBackpressured;
  }

  private startDrainTimer(stream: Writable): void {
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
    }

    this.drainTimer = setTimeout(() => {
      this.emit('drainTimeout', { timeout: this.timeout });
    }, this.timeout);

    stream.once('drain', () => {
      if (this.drainTimer) {
        clearTimeout(this.drainTimer);
        this.drainTimer = undefined;
      }
      this.emit('drained');
    });
  }

  dispose(): void {
    if (this.drainTimer) {
      clearTimeout(this.drainTimer);
    }
    this.removeAllListeners();
  }
}

/**
 * 流统计收集器
 */
export class StreamStatsCollector extends EventEmitter {
  private stats = {
    bytesRead: 0,
    bytesWritten: 0,
    chunksProcessed: 0,
    errorsCount: 0,
    startTime: 0,
    endTime: 0,
    averageChunkSize: 0,
    throughput: 0
  };

  start(): void {
    this.stats.startTime = Date.now();
  }

  recordChunk(size: number, isRead = true): void {
    this.stats.chunksProcessed++;
    
    if (isRead) {
      this.stats.bytesRead += size;
    } else {
      this.stats.bytesWritten += size;
    }

    this.updateAverages();
    this.emit('chunk', { size, isRead, stats: this.getStats() });
  }

  recordError(): void {
    this.stats.errorsCount++;
    this.emit('error', { count: this.stats.errorsCount });
  }

  finish(): void {
    this.stats.endTime = Date.now();
    this.updateAverages();
    this.emit('finish', this.getStats());
  }

  private updateAverages(): void {
    if (this.stats.chunksProcessed > 0) {
      this.stats.averageChunkSize = 
        (this.stats.bytesRead + this.stats.bytesWritten) / this.stats.chunksProcessed;
    }

    const duration = this.stats.endTime ? 
      this.stats.endTime - this.stats.startTime : 
      Date.now() - this.stats.startTime;

    if (duration > 0) {
      this.stats.throughput = 
        (this.stats.bytesRead + this.stats.bytesWritten) / (duration / 1000); // bytes per second
    }
  }

  getStats() {
    return { ...this.stats };
  }

  reset(): void {
    this.stats = {
      bytesRead: 0,
      bytesWritten: 0,
      chunksProcessed: 0,
      errorsCount: 0,
      startTime: 0,
      endTime: 0,
      averageChunkSize: 0,
      throughput: 0
    };
  }
}

/**
 * 创建批处理转换流
 */
export class BatchTransform extends Transform {
  private batch: any[] = [];
  private batchSize: number;
  private timeout: number;
  private timer?: NodeJS.Timeout;

  constructor(batchSize = 100, timeout = 1000, options: any = {}) {
    super({ objectMode: true, ...options });
    this.batchSize = batchSize;
    this.timeout = timeout;
  }

  override _transform(chunk: any, encoding: BufferEncoding, callback: Function): void {
    this.batch.push(chunk);

    if (this.batch.length >= this.batchSize) {
      this.flushBatch();
    } else if (!this.timer) {
      this.timer = setTimeout(() => {
        this.flushBatch();
      }, this.timeout);
    }

    callback();
  }

  override _flush(callback: Function): void {
    this.flushBatch();
    callback();
  }

  private flushBatch(): void {
    if (this.batch.length > 0) {
      this.push(this.batch);
      this.batch = [];
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
  }
}

/**
 * 创建分块转换流
 */
export class ChunkTransform extends Transform {
  private buffer = Buffer.alloc(0);
  private chunkSize: number;

  constructor(chunkSize = 16 * 1024, options: any = {}) {
    super(options);
    this.chunkSize = chunkSize;
  }

  override _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);

    while (this.buffer.length >= this.chunkSize) {
      const outputChunk = this.buffer.subarray(0, this.chunkSize);
      this.buffer = this.buffer.subarray(this.chunkSize);
      this.push(outputChunk);
    }

    callback();
  }

  override _flush(callback: Function): void {
    if (this.buffer.length > 0) {
      this.push(this.buffer);
    }
    callback();
  }
}

/**
 * 创建限流转换流
 */
export class ThrottleTransform extends Transform {
  private rate: number; // bytes per second
  private bucket = 0;
  private lastTime = Date.now();

  constructor(rate: number, options: any = {}) {
    super(options);
    this.rate = rate;
  }

  override _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function): void {
    const now = Date.now();
    const elapsed = now - this.lastTime;
    
    // 补充令牌桶
    this.bucket += (elapsed * this.rate) / 1000;
    this.bucket = Math.min(this.bucket, this.rate); // 限制桶大小
    
    this.lastTime = now;

    if (this.bucket >= chunk.length) {
      // 有足够的令牌，立即发送
      this.bucket -= chunk.length;
      this.push(chunk);
      callback();
    } else {
      // 令牌不足，延迟发送
      const delay = ((chunk.length - this.bucket) / this.rate) * 1000;
      this.bucket = 0;
      
      setTimeout(() => {
        this.push(chunk);
        callback();
      }, delay);
    }
  }
}

/**
 * 创建JSON行处理流
 */
export class JSONLinesTransform extends Transform {
  private buffer = '';

  constructor(options: any = {}) {
    super({ objectMode: true, ...options });
  }

  override _transform(chunk: Buffer, encoding: BufferEncoding, callback: Function): void {
    this.buffer += chunk.toString();
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || ''; // 保留不完整的行

    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          this.push(json);
        } catch (error) {
          this.emit('error', new Error(`Invalid JSON line: ${line}`));
        }
      }
    }

    callback();
  }

  override _flush(callback: Function): void {
    if (this.buffer.trim()) {
      try {
        const json = JSON.parse(this.buffer);
        this.push(json);
      } catch (error) {
        this.emit('error', new Error(`Invalid JSON line: ${this.buffer}`));
      }
    }
    callback();
  }
}

/**
 * 创建进度报告流
 */
export class ProgressTransform extends Transform {
  private processed = 0;
  private total?: number;
  private interval: number;
  private lastReport = 0;

  constructor(total?: number, interval = 1000, options: any = {}) {
    super({ objectMode: true, ...options });
    this.total = total;
    this.interval = interval;
  }

  override _transform(chunk: any, encoding: BufferEncoding, callback: Function): void {
    this.processed++;
    
    const now = Date.now();
    if (now - this.lastReport >= this.interval) {
      this.emitProgress();
      this.lastReport = now;
    }

    this.push(chunk);
    callback();
  }

  override _flush(callback: Function): void {
    this.emitProgress(); // 最终进度报告
    callback();
  }

  private emitProgress(): void {
    const progress = {
      processed: this.processed,
      total: this.total,
      percentage: this.total ? (this.processed / this.total) * 100 : undefined
    };
    
    this.emit('progress', progress);
  }
}

/**
 * 流管道工具
 */
export class StreamPipeline {
  private streams: NodeJS.ReadWriteStream[] = [];
  private errorHandler?: StreamErrorHandler;
  private statsCollector?: StreamStatsCollector;

  constructor(errorHandler?: StreamErrorHandler) {
    this.errorHandler = errorHandler;
    this.statsCollector = new StreamStatsCollector();
  }

  add(stream: NodeJS.ReadWriteStream): this {
    this.streams.push(stream);
    return this;
  }

  async run(source: Readable, destination?: Writable): Promise<void> {
    if (this.statsCollector) {
      this.statsCollector.start();
    }

    const allStreams = destination ? 
      [source, ...this.streams, destination] : 
      [source, ...this.streams];

    // 为每个流添加错误处理
    allStreams.forEach((stream, index) => {
      (stream as any).on('error', (error: Error) => {
        if (this.errorHandler) {
          this.errorHandler.handleError(error, `stream-${index}`);
        }
        if (this.statsCollector) {
          this.statsCollector.recordError();
        }
      });

      // 统计数据收集
      if (stream instanceof Transform || stream instanceof Writable) {
        stream.on('pipe', (src) => {
          src.on('data', (chunk) => {
            if (this.statsCollector) {
              this.statsCollector.recordChunk(chunk.length, true);
            }
          });
        });
      }
    });

    try {
      await pipelineAsync(allStreams as [NodeJS.ReadableStream, ...NodeJS.ReadWriteStream[], NodeJS.WritableStream]);
      
      if (this.statsCollector) {
        this.statsCollector.finish();
      }
    } catch (error) {
      if (this.errorHandler) {
        this.errorHandler.handleError(error as Error, 'pipeline');
      }
      throw error;
    }
  }

  getStats() {
    return this.statsCollector?.getStats();
  }
}

/**
 * 流超时装饰器
 */
export function withTimeout<T extends NodeJS.ReadWriteStream>(stream: T, timeout: number): T {
  const timer = setTimeout(() => {
    if ('destroy' in stream && typeof stream.destroy === 'function') {
      stream.destroy(new Error(`Stream timeout after ${timeout}ms`));
    }
  }, timeout);

  stream.on('close', () => clearTimeout(timer));
  stream.on('finish', () => clearTimeout(timer));
  stream.on('end', () => clearTimeout(timer));

  return stream;
}

/**
 * 流重试装饰器
 */
export function withRetry<T extends NodeJS.ReadWriteStream>(
  createStream: () => T,
  maxRetries = 3,
  retryDelay = 1000
): T {
  let retries = 0;
  let currentStream = createStream();

  const retry = () => {
    if (retries < maxRetries) {
      retries++;
      setTimeout(() => {
        currentStream = createStream();
        currentStream.on('error', retry);
      }, retryDelay * retries);
    }
  };

  currentStream.on('error', retry);
  return currentStream;
}

/**
 * 创建内存流
 */
export function createMemoryStream(data?: Buffer | string): Readable {
  const chunks = data ? [typeof data === 'string' ? Buffer.from(data) : data] : [];
  let index = 0;

  return new Readable({
    read() {
      if (index < chunks.length) {
        this.push(chunks[index++]);
      } else {
        this.push(null);
      }
    }
  });
}

/**
 * 流到Buffer转换
 */
export async function streamToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    stream.on('data', (chunk: Buffer) => {
      chunks.push(chunk);
    });
    
    stream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    stream.on('error', reject);
  });
}

/**
 * 流到字符串转换
 */
export async function streamToString(stream: Readable, encoding: BufferEncoding = 'utf8'): Promise<string> {
  const buffer = await streamToBuffer(stream);
  return buffer.toString(encoding);
}

/**
 * 流分割器
 */
export function createSplitStream(delimiter = '\n'): Transform {
  let buffer = '';

  return new Transform({
    transform(chunk: Buffer, encoding, callback) {
      buffer += chunk.toString();
      const parts = buffer.split(delimiter);
      buffer = parts.pop() || '';

      for (const part of parts) {
        if (part) {
          this.push(part + delimiter);
        }
      }

      callback();
    },

    flush(callback) {
      if (buffer) {
        this.push(buffer);
      }
      callback();
    }
  });
}

/**
 * 流合并器
 */
export function createMergeStream(...streams: Readable[]): Readable {
  let activeStreams = streams.length;
  const merged = new Readable({
    read() {
      // 被动读取，由源流推送数据
    }
  });

  streams.forEach(stream => {
    stream.on('data', (chunk) => {
      merged.push(chunk);
    });

    stream.on('end', () => {
      activeStreams--;
      if (activeStreams === 0) {
        merged.push(null);
      }
    });

    stream.on('error', (error) => {
      merged.destroy(error);
    });
  });

  return merged;
}