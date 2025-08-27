/**
 * 异步JSON序列化器实现
 */

import { EventEmitter } from 'events';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import { promisify } from 'util';
import * as path from 'path';

import { JSONSerializer } from './json-serializer.js';
import {
  IAsyncSerializer,
  AsyncSerializerConfig,
  SerializerConfig,
  BatchSerializationOptions
} from '../types/serializer-types.js';

import { DEFAULT_CONFIG } from '../constants/json-constants.js';

/**
 * 工作线程池
 */
class WorkerPool extends EventEmitter {
  private workers: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: Array<{ task: any; resolve: Function; reject: Function }> = [];
  private workerScript: string;

  constructor(size: number, workerScript: string) {
    super();
    this.workerScript = workerScript;
    this.initializeWorkers(size);
  }

  private initializeWorkers(size: number): void {
    for (let i = 0; i < size; i++) {
      this.createWorker();
    }
  }

  private createWorker(): void {
    const worker = new Worker(this.workerScript);
    
    worker.on('message', (result) => {
      this.availableWorkers.push(worker);
      this.processNextTask();
    });

    worker.on('error', (error) => {
      this.emit('workerError', { worker, error });
      this.replaceWorker(worker);
    });

    worker.on('exit', (code) => {
      if (code !== 0) {
        this.emit('workerExit', { worker, code });
        this.replaceWorker(worker);
      }
    });

    this.workers.push(worker);
    this.availableWorkers.push(worker);
  }

  private replaceWorker(oldWorker: Worker): void {
    const index = this.workers.indexOf(oldWorker);
    if (index !== -1) {
      this.workers.splice(index, 1);
      const availableIndex = this.availableWorkers.indexOf(oldWorker);
      if (availableIndex !== -1) {
        this.availableWorkers.splice(availableIndex, 1);
      }
      this.createWorker();
    }
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0 || this.availableWorkers.length === 0) {
      return;
    }

    const worker = this.availableWorkers.shift()!;
    const { task, resolve, reject } = this.taskQueue.shift()!;

    const timeout = setTimeout(() => {
      reject(new Error('Worker task timeout'));
      this.replaceWorker(worker);
    }, 30000); // 30秒超时

    worker.once('message', (result) => {
      clearTimeout(timeout);
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result.data);
      }
      this.availableWorkers.push(worker);
      this.processNextTask();
    });

    worker.postMessage(task);
  }

  execute<T>(task: any): Promise<T> {
    return new Promise((resolve, reject) => {
      this.taskQueue.push({ task, resolve, reject });
      this.processNextTask();
    });
  }

  getStats() {
    return {
      totalWorkers: this.workers.length,
      availableWorkers: this.availableWorkers.length,
      queuedTasks: this.taskQueue.length
    };
  }

  dispose(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.availableWorkers = [];
    this.taskQueue = [];
  }
}

/**
 * 任务队列管理器
 */
class TaskQueue extends EventEmitter {
  private queue: Array<{
    id: string;
    data: any;
    options?: any;
    resolve: Function;
    reject: Function;
    priority?: number;
  }> = [];
  private processing = false;
  private maxSize: number;
  private concurrency: number;
  private activeTasks = 0;

  constructor(maxSize: number, concurrency: number) {
    super();
    this.maxSize = maxSize;
    this.concurrency = concurrency;
  }

  add<T>(data: any, options?: any, priority = 0): Promise<T> {
    if (this.queue.length >= this.maxSize) {
      return Promise.reject(new Error('Task queue is full'));
    }

    return new Promise((resolve, reject) => {
      const task = {
        id: `task-${Date.now()}-${Math.random()}`,
        data,
        options,
        resolve,
        reject,
        priority
      };

      // 按优先级插入
      const insertIndex = this.queue.findIndex(t => (t.priority || 0) < priority);
      if (insertIndex === -1) {
        this.queue.push(task);
      } else {
        this.queue.splice(insertIndex, 0, task);
      }

      this.emit('taskAdded', { taskId: task.id, queueSize: this.queue.length });
      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
    if (this.processing || this.activeTasks >= this.concurrency) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && this.activeTasks < this.concurrency) {
      const task = this.queue.shift()!;
      this.activeTasks++;
      
      this.emit('taskStarted', { taskId: task.id, activeTasks: this.activeTasks });
      
      // 异步处理任务
      setImmediate(async () => {
        try {
          const result = await this.executeTask(task);
          task.resolve(result);
          this.emit('taskCompleted', { taskId: task.id, success: true });
        } catch (error) {
          task.reject(error);
          this.emit('taskCompleted', { taskId: task.id, success: false, error });
        } finally {
          this.activeTasks--;
          this.processQueue(); // 继续处理队列
        }
      });
    }

    this.processing = false;
  }

  protected async executeTask(task: any): Promise<any> {
    // 这里应该调用实际的序列化逻辑
    // 这个方法会被子类重写
    throw new Error('executeTask must be implemented by subclass');
  }

  getStats() {
    return {
      queueSize: this.queue.length,
      activeTasks: this.activeTasks,
      maxSize: this.maxSize,
      concurrency: this.concurrency
    };
  }

  clear(): void {
    this.queue.forEach(task => {
      task.reject(new Error('Task cancelled'));
    });
    this.queue = [];
  }
}

/**
 * 序列化任务队列
 */
class SerializationTaskQueue extends TaskQueue {
  constructor(
    private serializer: JSONSerializer,
    maxSize: number,
    concurrency: number
  ) {
    super(maxSize, concurrency);
  }

  protected override async executeTask(task: any): Promise<string> {
    return this.serializer.serialize(task.data, task.options);
  }
}

/**
 * 反序列化任务队列
 */
class DeserializationTaskQueue extends TaskQueue {
  constructor(
    private serializer: JSONSerializer,
    maxSize: number,
    concurrency: number
  ) {
    super(maxSize, concurrency);
  }

  protected override async executeTask(task: any): Promise<any> {
    return this.serializer.deserialize(task.data, task.options);
  }
}

/**
 * 异步JSON序列化器
 */
export class AsyncJSONSerializer extends EventEmitter implements IAsyncSerializer {
  private baseSerializer: JSONSerializer;
  private config: Required<AsyncSerializerConfig>;
  private serializationQueue: SerializationTaskQueue;
  private deserializationQueue: DeserializationTaskQueue;
  private workerPool?: WorkerPool;

  constructor(config: Partial<AsyncSerializerConfig> = {}) {
    super();

    this.config = {
      ...config,
      concurrency: config.concurrency ?? DEFAULT_CONFIG.CONCURRENCY,
      chunkSize: config.chunkSize ?? DEFAULT_CONFIG.CHUNK_SIZE,
      maxQueueSize: config.maxQueueSize ?? DEFAULT_CONFIG.MAX_QUEUE_SIZE,
      serializeTimeout: config.serializeTimeout ?? DEFAULT_CONFIG.SERIALIZE_TIMEOUT,
      deserializeTimeout: config.deserializeTimeout ?? DEFAULT_CONFIG.DESERIALIZE_TIMEOUT,
      retryAttempts: config.retryAttempts ?? DEFAULT_CONFIG.RETRY_ATTEMPTS,
      retryDelay: config.retryDelay ?? DEFAULT_CONFIG.RETRY_DELAY
    } as Required<AsyncSerializerConfig>;

    this.baseSerializer = new JSONSerializer(this.config);
    
    this.serializationQueue = new SerializationTaskQueue(
      this.baseSerializer,
      this.config.maxQueueSize,
      this.config.concurrency
    );

    this.deserializationQueue = new DeserializationTaskQueue(
      this.baseSerializer,
      this.config.maxQueueSize,
      this.config.concurrency
    );

    this.setupEventHandlers();
    this.initializeWorkerPool();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.serializationQueue.on('taskAdded', (info) => {
      this.emit('serializationQueued', info);
    });

    this.serializationQueue.on('taskCompleted', (info) => {
      this.emit('serializationCompleted', info);
    });

    this.deserializationQueue.on('taskAdded', (info) => {
      this.emit('deserializationQueued', info);
    });

    this.deserializationQueue.on('taskCompleted', (info) => {
      this.emit('deserializationCompleted', info);
    });
  }

  /**
   * 初始化工作线程池
   */
  private initializeWorkerPool(): void {
    if (this.config.concurrency > 1) {
      // 这里应该指向实际的worker脚本文件
      const workerScript = path.resolve(__dirname, 'serialization-worker.js');
      this.workerPool = new WorkerPool(this.config.concurrency, workerScript);

      this.workerPool.on('workerError', (info) => {
        this.emit('workerError', info);
      });
    }
  }

  /**
   * 序列化数据
   */
  async serialize(data: any, options?: Partial<SerializerConfig>): Promise<string> {
    return this.withTimeout(
      this.baseSerializer.serialize(data, options),
      this.config.serializeTimeout
    );
  }

  /**
   * 反序列化数据
   */
  async deserialize<T = any>(data: string, options?: Partial<SerializerConfig>): Promise<T> {
    return this.withTimeout(
      this.baseSerializer.deserialize<T>(data, options),
      this.config.deserializeTimeout
    );
  }

  /**
   * 序列化为Buffer
   */
  async serializeToBuffer(data: any, options?: Partial<SerializerConfig>): Promise<Buffer> {
    const jsonString = await this.serialize(data, options);
    return Buffer.from(jsonString, this.config.encoding || 'utf8');
  }

  /**
   * 从Buffer反序列化
   */
  async deserializeFromBuffer<T = any>(buffer: Buffer, options?: Partial<SerializerConfig>): Promise<T> {
    const jsonString = buffer.toString(this.config.encoding || 'utf8');
    return this.deserialize<T>(jsonString, options);
  }

  /**
   * 异步序列化（使用队列）
   */
  async serializeAsync(data: any, options?: Partial<AsyncSerializerConfig>): Promise<string> {
    const mergedOptions = { ...this.config, ...options };
    
    if (this.workerPool && this.shouldUseWorker(data)) {
      return this.workerPool.execute({
        type: 'serialize',
        data,
        options: mergedOptions
      });
    }

    return this.serializationQueue.add(data, mergedOptions);
  }

  /**
   * 异步反序列化（使用队列）
   */
  async deserializeAsync<T = any>(data: string, options?: Partial<AsyncSerializerConfig>): Promise<T> {
    const mergedOptions = { ...this.config, ...options };
    
    if (this.workerPool && this.shouldUseWorker(data)) {
      return this.workerPool.execute({
        type: 'deserialize',
        data,
        options: mergedOptions
      });
    }

    return this.deserializationQueue.add(data, mergedOptions);
  }

  /**
   * 批量序列化
   */
  async serializeBatch(data: any[], options?: BatchSerializationOptions): Promise<string[]> {
    const results: string[] = [];
    const errors: Array<{ index: number; error: Error }> = [];
    let completed = 0;

    const chunks = this.chunkArray(data, this.config.chunkSize);
    
    this.emit('batchSerializationStarted', { 
      totalItems: data.length, 
      chunks: chunks.length 
    });

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      if (!chunk) continue;
      
      const chunkPromises = chunk.map(async (item, itemIndex) => {
        const globalIndex = chunkIndex * this.config.chunkSize + itemIndex;
        
        try {
          const result = await this.retryOperation(
            () => this.serializeAsync(item),
            this.config.retryAttempts,
            this.config.retryDelay
          );
          
          results[globalIndex] = result;
          completed++;
          
          if (options?.onProgress) {
            options.onProgress(completed, data.length);
          }

          return result;
        } catch (error) {
          const err = error as Error;
          errors.push({ index: globalIndex, error: err });
          
          if (options?.onError) {
            options.onError(err, globalIndex);
          }
          
          if (!options?.continueOnError) {
            throw err;
          }

          completed++;
          if (options?.onProgress) {
            options.onProgress(completed, data.length);
          }

          return null;
        }
      });

      await Promise.all(chunkPromises);
    }

    this.emit('batchSerializationCompleted', {
      totalItems: data.length,
      completed,
      errors: errors.length
    });

    if (errors.length > 0 && !options?.continueOnError) {
      throw new Error(`Batch serialization failed with ${errors.length} errors`);
    }

    return results.filter(result => result !== null);
  }

  /**
   * 批量反序列化
   */
  async deserializeBatch<T = any>(data: string[], options?: BatchSerializationOptions): Promise<T[]> {
    const results: T[] = [];
    const errors: Array<{ index: number; error: Error }> = [];
    let completed = 0;

    const chunks = this.chunkArray(data, this.config.chunkSize);
    
    this.emit('batchDeserializationStarted', { 
      totalItems: data.length, 
      chunks: chunks.length 
    });

    for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
      const chunk = chunks[chunkIndex];
      if (!chunk) continue;
      
      const chunkPromises = chunk.map(async (item, itemIndex) => {
        const globalIndex = chunkIndex * this.config.chunkSize + itemIndex;
        
        try {
          const result = await this.retryOperation(
            () => this.deserializeAsync<T>(item),
            this.config.retryAttempts,
            this.config.retryDelay
          );
          
          results[globalIndex] = result;
          completed++;
          
          if (options?.onProgress) {
            options.onProgress(completed, data.length);
          }

          return result;
        } catch (error) {
          const err = error as Error;
          errors.push({ index: globalIndex, error: err });
          
          if (options?.onError) {
            options.onError(err, globalIndex);
          }
          
          if (!options?.continueOnError) {
            throw err;
          }

          completed++;
          if (options?.onProgress) {
            options.onProgress(completed, data.length);
          }

          return null;
        }
      });

      await Promise.all(chunkPromises);
    }

    this.emit('batchDeserializationCompleted', {
      totalItems: data.length,
      completed,
      errors: errors.length
    });

    if (errors.length > 0 && !options?.continueOnError) {
      throw new Error(`Batch deserialization failed with ${errors.length} errors`);
    }

    return results.filter(result => result !== null);
  }

  /**
   * 判断是否应该使用工作线程
   */
  private shouldUseWorker(data: any): boolean {
    if (!this.workerPool) return false;
    
    // 简单的启发式：大对象使用工作线程
    const dataSize = Buffer.byteLength(JSON.stringify(data), 'utf8');
    return dataSize > 100 * 1024; // 100KB
  }

  /**
   * 分块数组
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  /**
   * 超时包装器
   */
  private async withTimeout<T>(promise: Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Operation timeout after ${timeout}ms`));
        }, timeout);
      })
    ]);
  }

  /**
   * 重试操作
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delay: number
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay * (attempt + 1)));
        }
      }
    }
    
    throw lastError!;
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      base: this.baseSerializer.getStats(),
      serialization: this.serializationQueue.getStats(),
      deserialization: this.deserializationQueue.getStats(),
      workers: this.workerPool?.getStats() || null
    };
  }

  /**
   * 暂停处理
   */
  pause(): void {
    this.emit('paused');
  }

  /**
   * 恢复处理
   */
  resume(): void {
    this.emit('resumed');
  }

  /**
   * 清理队列
   */
  clearQueues(): void {
    this.serializationQueue.clear();
    this.deserializationQueue.clear();
    this.emit('queuesCleared');
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.clearQueues();
    this.workerPool?.dispose();
    this.baseSerializer.dispose();
    this.removeAllListeners();
  }
}