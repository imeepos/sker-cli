/**
 * UDEF消息主类实现
 * UDEF main message class implementation
 */

import type { 
  UDEFMessage, 
  TypedUDEFMessage,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  CommandMessage,
  NotificationMessage,
  HeartbeatMessage,
  MessageHeader,
  MessageMetadata,
  ServiceInfo,
  ContentType,
  MessageType
} from '@sker/types';
import { BasicTypes, type UUID, type SkerString } from '@sker/types';
import { UDEFEnvelope, EnvelopeBuilder } from './envelope.js';
import { UDEFPayload, PayloadBuilder } from './payload.js';

export class UDEFMessageImpl implements UDEFMessage {
  public readonly envelope: UDEFEnvelope;
  public readonly payload: UDEFPayload;

  constructor(envelope: UDEFEnvelope, payload: UDEFPayload) {
    this.envelope = envelope;
    this.payload = payload;
  }

  /**
   * 获取消息ID
   * Get message ID
   */
  get messageId(): UUID {
    return this.envelope.header.message_id;
  }

  /**
   * 获取消息类型
   * Get message type
   */
  get messageType(): MessageType {
    return this.envelope.header.message_type;
  }

  /**
   * 获取内容类型
   * Get content type
   */
  get contentType(): ContentType {
    return this.envelope.header.content_type;
  }

  /**
   * 获取消息数据
   * Get message data
   */
  getData<T = unknown>(): T {
    return this.payload.getData<T>();
  }

  /**
   * 检查消息是否过期
   * Check if message is expired
   */
  isExpired(): boolean {
    return this.envelope.isExpired();
  }

  /**
   * 检查消息是否可以重试
   * Check if message can be retried
   */
  canRetry(): boolean {
    return this.envelope.canRetry();
  }

  /**
   * 验证消息完整性
   * Verify message integrity
   */
  verifyIntegrity(): boolean {
    return this.payload.verifyIntegrity();
  }

  /**
   * 创建响应消息
   * Create response message
   */
  createResponse<T = unknown>(
    responseData: T,
    options: {
      contentType?: ContentType;
      version?: SkerString;
    } = {}
  ): UDEFMessageImpl {
    const responseEnvelope = new EnvelopeBuilder()
      .messageType('response' as MessageType)
      .contentType(options.contentType || this.envelope.header.content_type)
      .source(this.envelope.header.destination || this.envelope.header.source)
      .destination(this.envelope.header.source)
      .version(options.version || this.envelope.header.version || '')
      .traceId(this.envelope.metadata.trace_id || ``)
      .build()
      .setCorrelationId(this.envelope.header.message_id);

    const responsePayload = new PayloadBuilder()
      .setData(responseData)
      .setSchemaVersion(this.payload.schema_version)
      .build();

    return new UDEFMessageImpl(responseEnvelope, responsePayload);
  }

  /**
   * 创建错误响应
   * Create error response
   */
  createErrorResponse(
    error: Error,
    options: {
      contentType?: ContentType;
      version?: SkerString;
    } = {}
  ): UDEFMessageImpl {
    const errorData = {
      error_type: error.constructor.name,
      error_message: error.message,
      error_code: (error as any).code || 'UNKNOWN_ERROR',
      timestamp: new Date().toISOString()
    };

    return this.createResponse(errorData, options);
  }

  /**
   * 更新消息数据
   * Update message data
   */
  updateData<T = unknown>(data: T): UDEFMessageImpl {
    const newPayload = this.payload.updateData(data);
    return new UDEFMessageImpl(this.envelope, newPayload);
  }

  /**
   * 添加标签
   * Add tag
   */
  addTag(tag: SkerString): UDEFMessageImpl {
    const newEnvelope = this.envelope.addTag(tag);
    return new UDEFMessageImpl(newEnvelope, this.payload);
  }

  /**
   * 增加重试次数
   * Increment retry count
   */
  incrementRetryCount(): UDEFMessageImpl {
    const newEnvelope = this.envelope.incrementRetryCount();
    return new UDEFMessageImpl(newEnvelope, this.payload);
  }

  /**
   * 转换为普通对象
   * Convert to plain object
   */
  toObject(): UDEFMessage {
    return {
      envelope: this.envelope.toObject(),
      payload: this.payload.toObject()
    };
  }

  /**
   * 克隆消息
   * Clone message
   */
  clone(): UDEFMessageImpl {
    return new UDEFMessageImpl(
      this.envelope.clone(),
      this.payload.clone()
    );
  }

  /**
   * 转换为JSON字符串
   * Convert to JSON string
   */
  toJSON(): string {
    return JSON.stringify(this.toObject());
  }

  /**
   * 获取消息大小
   * Get message size
   */
  getSize(): number {
    const headerSize = JSON.stringify(this.envelope.toObject()).length;
    const payloadSize = this.payload.getDataSize();
    return headerSize + payloadSize;
  }
}

/**
 * UDEF消息构建器
 * UDEF message builder
 */
export class UDEFMessageBuilder {
  private envelopeBuilder = new EnvelopeBuilder();
  private payloadBuilder = new PayloadBuilder();

  /**
   * 设置消息类型
   */
  messageType(type: MessageType): this {
    this.envelopeBuilder.messageType(type);
    return this;
  }

  /**
   * 设置内容类型
   */
  contentType(type: ContentType): this {
    this.envelopeBuilder.contentType(type);
    return this;
  }

  /**
   * 设置发送方
   */
  source(source: ServiceInfo): this {
    this.envelopeBuilder.source(source);
    return this;
  }

  /**
   * 设置接收方
   */
  destination(destination: ServiceInfo): this {
    this.envelopeBuilder.destination(destination);
    return this;
  }

  /**
   * 设置数据
   */
  data<T = unknown>(data: T): this {
    this.payloadBuilder.setData(data);
    return this;
  }

  /**
   * 设置Schema版本
   */
  schemaVersion(version: SkerString): this {
    this.payloadBuilder.setSchemaVersion(version);
    return this;
  }

  /**
   * 设置追踪信息
   */
  tracing(traceId: SkerString, spanId?: SkerString, parentSpanId?: SkerString): this {
    this.envelopeBuilder.traceId(traceId);
    if (spanId) this.envelopeBuilder.spanId(spanId);
    return this;
  }

  /**
   * 构建消息
   */
  build(): UDEFMessageImpl {
    const envelope = this.envelopeBuilder.build();
    const payload = this.payloadBuilder.build();
    
    return new UDEFMessageImpl(envelope, payload);
  }
}

/**
 * 消息工厂类
 * Message factory class
 */
export class MessageFactory {
  /**
   * 创建请求消息
   */
  static createRequest<T = unknown>(
    data: T,
    source: ServiceInfo,
    destination?: ServiceInfo,
    options: {
      contentType?: ContentType;
      version?: SkerString;
      schemaVersion?: SkerString;
    } = {}
  ): UDEFMessageImpl {
    const builder = new UDEFMessageBuilder()
      .messageType('request' as MessageType)
      .contentType(options.contentType || 'application/json' as ContentType)
      .source(source)
      .data(data)
      .schemaVersion(options.schemaVersion || '1.0.0');

    if (destination) {
      builder.destination(destination);
    }

    return builder.build();
  }

  /**
   * 创建事件消息
   */
  static createEvent<T = unknown>(
    data: T,
    source: ServiceInfo,
    options: {
      contentType?: ContentType;
      version?: SkerString;
      schemaVersion?: SkerString;
      tags?: SkerString[];
    } = {}
  ): UDEFMessageImpl {
    let builder = new UDEFMessageBuilder()
      .messageType('event' as MessageType)
      .contentType(options.contentType || 'application/json' as ContentType)
      .source(source)
      .data(data)
      .schemaVersion(options.schemaVersion || '1.0.0');

    const message = builder.build();
    
    // 添加标签
    if (options.tags) {
      return options.tags.reduce((msg, tag) => msg.addTag(tag), message);
    }

    return message;
  }

  /**
   * 创建命令消息
   */
  static createCommand<T = unknown>(
    data: T,
    source: ServiceInfo,
    destination: ServiceInfo,
    options: {
      contentType?: ContentType;
      version?: SkerString;
      schemaVersion?: SkerString;
    } = {}
  ): UDEFMessageImpl {
    return new UDEFMessageBuilder()
      .messageType('command' as MessageType)
      .contentType(options.contentType || 'application/json' as ContentType)
      .source(source)
      .destination(destination)
      .data(data)
      .schemaVersion(options.schemaVersion || '1.0.0')
      .build();
  }

  /**
   * 创建通知消息
   */
  static createNotification<T = unknown>(
    data: T,
    source: ServiceInfo,
    options: {
      contentType?: ContentType;
      version?: SkerString;
      schemaVersion?: SkerString;
    } = {}
  ): UDEFMessageImpl {
    return new UDEFMessageBuilder()
      .messageType('notification' as MessageType)
      .contentType(options.contentType || 'application/json' as ContentType)
      .source(source)
      .data(data)
      .schemaVersion(options.schemaVersion || '1.0.0')
      .build();
  }

  /**
   * 创建心跳消息
   */
  static createHeartbeat(
    source: ServiceInfo,
    status: 'alive' | 'healthy' | 'degraded' = 'alive',
    metrics?: Record<string, unknown>
  ): UDEFMessageImpl {
    const data = {
      status,
      timestamp: new Date(),
      metrics: metrics || {}
    };

    return new UDEFMessageBuilder()
      .messageType('heartbeat' as MessageType)
      .contentType('application/json' as ContentType)
      .source(source)
      .data(data)
      .schemaVersion('1.0.0')
      .build();
  }

  /**
   * 从JSON创建消息
   */
  static fromJSON(json: string): UDEFMessageImpl {
    try {
      const obj = JSON.parse(json);
      if (!obj.envelope || !obj.payload) {
        throw new Error('Invalid UDEF message format');
      }

      const envelope = new UDEFEnvelope(obj.envelope.header, obj.envelope.metadata);
      const payload = new UDEFPayload(obj.payload.data, {
        schema_version: obj.payload.schema_version,
        checksum: obj.payload.checksum,
        size_bytes: obj.payload.size_bytes,
        encoding: obj.payload.encoding,
        compression: obj.payload.compression,
        autoCalculateChecksum: false
      });

      return new UDEFMessageImpl(envelope, payload);
    } catch (error) {
      throw new Error(`Failed to create message from JSON: ${(error as Error).message}`);
    }
  }
}

// 导出主要类和别名
export { UDEFMessageImpl as UDEFMessage };
export type { 
  TypedUDEFMessage,
  RequestMessage,
  ResponseMessage,
  EventMessage,
  CommandMessage,
  NotificationMessage,
  HeartbeatMessage
};