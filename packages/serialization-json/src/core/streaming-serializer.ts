/**
 * 流式JSON序列化器实现
 */

import { Transform, Readable, Writable, pipeline } from 'stream';
import { promisify } from 'util';
import { EventEmitter } from 'events';

import { JSONSerializer } from './json-serializer.js';
import {
  IStreamingSerializer,
  StreamingSerializerConfig,
  SerializerConfig
} from '../types/serializer-types.js';

import {
  BackpressureController,
  StreamStatsCollector,
  JSONLinesTransform,
  ChunkTransform,
  BatchTransform
} from '../utils/stream-utils.js';

import { DEFAULT_CONFIG } from '../constants/json-constants.js';

const pipelineAsync = promisify(pipeline);

/**
 * 流式JSON序列化器
 */
export class StreamingJSONSerializer extends EventEmitter implements IStreamingSerializer {
  private baseSerializer: JSONSerializer;
  private config: StreamingSerializerConfig;
  private backpressureController: BackpressureController;
  private statsCollector: StreamStatsCollector;

  constructor(config: Partial<StreamingSerializerConfig> = {}) {
    super();
    
    this.config = {
      ...config,
      highWaterMark: config.highWaterMark ?? DEFAULT_CONFIG.HIGH_WATER_MARK,
      objectMode: config.objectMode ?? false,
      backpressure: {
        enabled: config.backpressure?.enabled ?? true,
        threshold: config.backpressure?.threshold ?? DEFAULT_CONFIG.BACKPRESSURE_THRESHOLD,
        timeout: config.backpressure?.timeout ?? DEFAULT_CONFIG.BACKPRESSURE_TIMEOUT
      }
    };

    this.baseSerializer = new JSONSerializer(this.config);
    this.backpressureController = new BackpressureController(
      this.config.backpressure?.threshold ?? DEFAULT_CONFIG.BACKPRESSURE_THRESHOLD,
      this.config.backpressure?.timeout ?? DEFAULT_CONFIG.BACKPRESSURE_TIMEOUT
    );
    this.statsCollector = new StreamStatsCollector();

    this.setupEventHandlers();
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    this.backpressureController.on('backpressure', (info) => {
      this.emit('backpressure', info);
    });

    this.backpressureController.on('drained', () => {
      this.emit('drained');
    });

    this.backpressureController.on('drainTimeout', (info) => {
      this.emit('drainTimeout', info);
    });

    this.statsCollector.on('chunk', (info) => {
      this.emit('chunkProcessed', info);
    });

    this.statsCollector.on('finish', (stats) => {
      this.emit('streamingComplete', stats);
    });
  }

  /**
   * 序列化数据
   */
  async serialize(data: any, options?: Partial<SerializerConfig>): Promise<string> {
    return this.baseSerializer.serialize(data, options);
  }

  /**
   * 反序列化数据
   */
  async deserialize<T = any>(data: string, options?: Partial<SerializerConfig>): Promise<T> {
    return this.baseSerializer.deserialize<T>(data, options);
  }

  /**
   * 序列化为Buffer
   */
  async serializeToBuffer(data: any, options?: Partial<SerializerConfig>): Promise<Buffer> {
    return this.baseSerializer.serializeToBuffer(data, options);
  }

  /**
   * 从Buffer反序列化
   */
  async deserializeFromBuffer<T = any>(buffer: Buffer, options?: Partial<SerializerConfig>): Promise<T> {
    return this.baseSerializer.deserializeFromBuffer<T>(buffer, options);
  }

  /**
   * 创建序列化转换流
   */
  createSerializeStream(options?: Partial<StreamingSerializerConfig>): Transform {
    const config = { ...this.config, ...options };

    return new Transform({
      objectMode: config.objectMode,
      highWaterMark: config.highWaterMark,
      
      transform: async (chunk: any, encoding: BufferEncoding, callback: Function) => {
        try {
          this.statsCollector.recordChunk(
            Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(JSON.stringify(chunk)),
            true
          );

          const serialized = await this.baseSerializer.serialize(chunk, config);
          const buffer = Buffer.from(serialized + '\n', 'utf8');

          this.statsCollector.recordChunk(buffer.length, false);
          callback(null, buffer);
        } catch (error) {
          this.statsCollector.recordError();
          callback(error);
        }
      }
    });
  }

  /**
   * 创建反序列化转换流
   */
  createDeserializeStream(options?: Partial<StreamingSerializerConfig>): Transform {
    const config = { ...this.config, ...options };

    return new Transform({
      objectMode: true,
      highWaterMark: config.highWaterMark,

      transform: async (chunk: Buffer, encoding: BufferEncoding, callback: Function) => {
        try {
          this.statsCollector.recordChunk(chunk.length, true);

          const jsonString = chunk.toString('utf8').trim();
          if (jsonString) {
            const deserialized = await this.baseSerializer.deserialize(jsonString, config);
            this.statsCollector.recordChunk(
              Buffer.byteLength(JSON.stringify(deserialized)),
              false
            );
            callback(null, deserialized);
          } else {
            callback();
          }
        } catch (error) {
          this.statsCollector.recordError();
          callback(error);
        }
      }
    });
  }

  /**
   * 序列化流
   */
  serializeStream(source: Readable, options?: Partial<StreamingSerializerConfig>): Readable {
    const config = { ...this.config, ...options };
    const serializeTransform = this.createSerializeStream(config);

    // 创建输出流
    const output = new Readable({
      read() {
        // 被动模式，由上游推送数据
      }
    });

    // 管道连接
    source
      .pipe(serializeTransform)
      .on('data', (chunk) => {
        output.push(chunk);
      })
      .on('end', () => {
        output.push(null);
      })
      .on('error', (error) => {
        output.destroy(error);
      });

    return output;
  }

  /**
   * 反序列化流
   */
  deserializeStream(source: Readable, options?: Partial<StreamingSerializerConfig>): Readable {
    const config = { ...this.config, ...options };
    
    // 创建JSON行处理器
    const jsonLinesTransform = new JSONLinesTransform();
    const deserializeTransform = this.createDeserializeStream(config);

    // 创建输出流
    const output = new Readable({
      objectMode: true,
      read() {
        // 被动模式
      }
    });

    // 管道连接
    source
      .pipe(jsonLinesTransform)
      .pipe(deserializeTransform)
      .on('data', (chunk) => {
        output.push(chunk);
      })
      .on('end', () => {
        output.push(null);
      })
      .on('error', (error) => {
        output.destroy(error);
      });

    return output;
  }

  /**
   * 批量序列化流
   */
  createBatchSerializeStream(batchSize = 100, options?: Partial<StreamingSerializerConfig>): Transform {
    const config = { ...this.config, ...options };
    const batchTransform = new BatchTransform(batchSize);
    const serializeTransform = this.createSerializeStream(config);

    return new Transform({
      objectMode: true,
      highWaterMark: config.highWaterMark,

      transform(chunk: any, encoding: BufferEncoding, callback: Function) {
        batchTransform.write(chunk);
        callback();
      },

      flush: async (callback: Function) => {
        batchTransform.end();
        batchTransform.on('data', async (batch) => {
          try {
            const serialized = await this.baseSerializer.serialize(batch, config);
            // Push to the transform stream
            callback(null, Buffer.from(serialized + '\n', 'utf8'));
          } catch (error) {
            callback(error);
          }
        });
        batchTransform.on('end', () => callback());
      }
    });
  }

  /**
   * 分块序列化流
   */
  createChunkedSerializeStream(chunkSize = 16 * 1024, options?: Partial<StreamingSerializerConfig>): Transform {
    const config = { ...this.config, ...options };
    const chunkTransform = new ChunkTransform(chunkSize);
    const baseSerializer = this.baseSerializer;

    return new Transform({
      highWaterMark: config.highWaterMark,

      transform: async (chunk: any, encoding: BufferEncoding, callback: Function) => {
        try {
          const serialized = await baseSerializer.serialize(chunk, config);
          const buffer = Buffer.from(serialized, 'utf8');
          
          // Use callback to push data instead of this.push
          callback(null, buffer);
        } catch (error) {
          callback(error);
        }
      },

      flush(callback: Function) {
        chunkTransform.end();
        chunkTransform.on('end', () => callback());
      }
    });
  }

  /**
   * 创建压缩序列化流
   */
  createCompressedSerializeStream(options?: Partial<StreamingSerializerConfig>): Transform {
    const config = { 
      ...this.config, 
      ...options,
      compression: {
        algorithm: 'gzip' as const,
        ...this.config.compression,
        ...options?.compression
      }
    };

    return this.createSerializeStream(config);
  }

  /**
   * 管道序列化
   */
  async pipelineSerialize(
    source: Readable, 
    destination: Writable, 
    options?: Partial<StreamingSerializerConfig>
  ): Promise<void> {
    this.statsCollector.start();
    
    const serializeTransform = this.createSerializeStream(options);

    // 背压控制
    if (this.config.backpressure?.enabled) {
      destination.on('drain', () => {
        this.emit('drain');
      });
    }

    try {
      await pipelineAsync(
        source,
        serializeTransform,
        destination
      );

      this.statsCollector.finish();
      this.emit('pipelineComplete', this.statsCollector.getStats());
    } catch (error) {
      this.statsCollector.recordError();
      this.emit('pipelineError', error);
      throw error;
    }
  }

  /**
   * 管道反序列化
   */
  async pipelineDeserialize(
    source: Readable, 
    destination: Writable, 
    options?: Partial<StreamingSerializerConfig>
  ): Promise<void> {
    this.statsCollector.start();
    
    const jsonLinesTransform = new JSONLinesTransform();
    const deserializeTransform = this.createDeserializeStream(options);

    try {
      await pipelineAsync(
        source,
        jsonLinesTransform,
        deserializeTransform,
        destination
      );

      this.statsCollector.finish();
      this.emit('pipelineComplete', this.statsCollector.getStats());
    } catch (error) {
      this.statsCollector.recordError();
      this.emit('pipelineError', error);
      throw error;
    }
  }

  /**
   * 获取统计信息
   */
  getStats() {
    return {
      ...this.baseSerializer.getStats(),
      streaming: this.statsCollector.getStats()
    };
  }

  /**
   * 暂停所有流
   */
  pause(): void {
    this.emit('pause');
  }

  /**
   * 恢复所有流
   */
  resume(): void {
    this.emit('resume');
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.baseSerializer.dispose();
    this.backpressureController.dispose();
    this.statsCollector.removeAllListeners();
    this.removeAllListeners();
  }
}