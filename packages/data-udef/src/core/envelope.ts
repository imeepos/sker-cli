/**
 * UDEF消息信封实现
 * UDEF message envelope implementation
 */

import type { 
  MessageHeader, 
  MessageMetadata, 
  MessageEnvelope,
  ServiceInfo,
  ContentType,
  MessageType,
  MessagePriority,
  UUID,
  SkerTimestamp,
  SkerString
} from '@sker/types';
import { BasicTypes } from '@sker/types';

export class UDEFEnvelope implements MessageEnvelope {
  public readonly header: MessageHeader;
  public readonly metadata: MessageMetadata;

  constructor(
    header: Partial<MessageHeader>,
    metadata: MessageMetadata = {}
  ) {
    this.header = {
      message_id: header.message_id || BasicTypes.createUUID(),
      timestamp: header.timestamp || BasicTypes.createTimestamp(),
      content_type: header.content_type || 'application/json' as ContentType,
      message_type: header.message_type || 'event' as MessageType,
      source: header.source || {
        service_name: 'unknown',
        service_version: '1.0.0',
        service_id: 'unknown'
      },
      correlation_id: header.correlation_id,
      destination: header.destination,
      version: header.version || '1.0.0'
    };
    
    this.metadata = {
      trace_id: metadata.trace_id,
      span_id: metadata.span_id,
      parent_span_id: metadata.parent_span_id,
      priority: metadata.priority,
      ttl: metadata.ttl,
      retry_count: metadata.retry_count || 0,
      max_retries: metadata.max_retries || 3,
      delay_until: metadata.delay_until,
      tags: metadata.tags,
      routing_key: metadata.routing_key,
      partition_key: metadata.partition_key,
      custom_properties: metadata.custom_properties || {}
    };
  }

  /**
   * 设置关联消息ID
   * Set correlation message ID
   */
  setCorrelationId(correlationId: UUID): UDEFEnvelope {
    return new UDEFEnvelope({
      ...this.header,
      correlation_id: correlationId
    }, this.metadata);
  }

  /**
   * 设置目标服务
   * Set destination service
   */
  setDestination(destination: ServiceInfo): UDEFEnvelope {
    return new UDEFEnvelope({
      ...this.header,
      destination
    }, this.metadata);
  }

  /**
   * 添加标签
   * Add tag
   */
  addTag(tag: SkerString): UDEFEnvelope {
    const tags = [...(this.metadata.tags || []), tag];
    return new UDEFEnvelope(this.header, {
      ...this.metadata,
      tags
    });
  }

  /**
   * 设置优先级
   * Set priority
   */
  setPriority(priority: MessagePriority): UDEFEnvelope {
    return new UDEFEnvelope(this.header, {
      ...this.metadata,
      priority
    });
  }

  /**
   * 设置TTL
   * Set TTL
   */
  setTTL(ttl: number): UDEFEnvelope {
    return new UDEFEnvelope(this.header, {
      ...this.metadata,
      ttl
    });
  }

  /**
   * 增加重试次数
   * Increment retry count
   */
  incrementRetryCount(): UDEFEnvelope {
    return new UDEFEnvelope(this.header, {
      ...this.metadata,
      retry_count: (this.metadata.retry_count || 0) + 1
    });
  }

  /**
   * 检查消息是否过期
   * Check if message is expired
   */
  isExpired(): boolean {
    if (!this.metadata.ttl) return false;
    
    const now = Date.now();
    const messageTime = this.header.timestamp.getTime();
    return (now - messageTime) > this.metadata.ttl;
  }

  /**
   * 检查是否可以重试
   * Check if message can be retried
   */
  canRetry(): boolean {
    const retryCount = this.metadata.retry_count || 0;
    const maxRetries = this.metadata.max_retries || 3;
    return retryCount < maxRetries;
  }

  /**
   * 转换为普通对象
   * Convert to plain object
   */
  toObject(): MessageEnvelope {
    return {
      header: {
        ...this.header,
        timestamp: this.header.timestamp
      },
      metadata: this.metadata
    };
  }

  /**
   * 克隆信封
   * Clone envelope
   */
  clone(): UDEFEnvelope {
    return new UDEFEnvelope(
      JSON.parse(JSON.stringify(this.header)),
      JSON.parse(JSON.stringify(this.metadata))
    );
  }
}

/**
 * 信封构建器
 * Envelope builder
 */
export class EnvelopeBuilder {
  private header: Partial<MessageHeader> = {};
  private metadata: MessageMetadata = {};

  /**
   * 设置消息ID
   */
  messageId(messageId: UUID): this {
    this.header.message_id = messageId;
    return this;
  }

  /**
   * 设置消息类型
   */
  messageType(messageType: MessageType): this {
    this.header.message_type = messageType;
    return this;
  }

  /**
   * 设置内容类型
   */
  contentType(contentType: ContentType): this {
    this.header.content_type = contentType;
    return this;
  }

  /**
   * 设置发送方
   */
  source(source: ServiceInfo): this {
    this.header.source = source;
    return this;
  }

  /**
   * 设置接收方
   */
  destination(destination: ServiceInfo): this {
    this.header.destination = destination;
    return this;
  }

  /**
   * 设置版本
   */
  version(version: SkerString): this {
    this.header.version = version;
    return this;
  }

  /**
   * 设置追踪ID
   */
  traceId(traceId: SkerString): this {
    this.metadata.trace_id = traceId;
    return this;
  }

  /**
   * 设置跨度ID
   */
  spanId(spanId: SkerString): this {
    this.metadata.span_id = spanId;
    return this;
  }

  /**
   * 设置优先级
   */
  priority(priority: MessagePriority): this {
    this.metadata.priority = priority;
    return this;
  }

  /**
   * 设置TTL
   */
  ttl(ttl: number): this {
    this.metadata.ttl = ttl;
    return this;
  }

  /**
   * 添加标签
   */
  addTag(tag: SkerString): this {
    if (!this.metadata.tags) {
      this.metadata.tags = [];
    }
    this.metadata.tags.push(tag);
    return this;
  }

  /**
   * 设置路由键
   */
  routingKey(routingKey: SkerString): this {
    this.metadata.routing_key = routingKey;
    return this;
  }

  /**
   * 构建信封
   */
  build(): UDEFEnvelope {
    return new UDEFEnvelope(this.header, this.metadata);
  }
}