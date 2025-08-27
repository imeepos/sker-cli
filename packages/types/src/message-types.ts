/**
 * UDEF (Unified Data Exchange Format) 消息格式类型定义
 * UDEF message format type definitions
 */

import type { SkerString, SkerTimestamp, UUID } from './basic-types.js';
import type { SkerRecord, SkerArray } from './collection-types.js';

/**
 * 内容类型枚举
 * Content type enumeration
 */
export enum ContentType {
  JSON = 'application/json',
  PROTOBUF = 'application/protobuf',
  MESSAGEPACK = 'application/msgpack',
  AVRO = 'application/avro',
  XML = 'application/xml',
  PLAIN_TEXT = 'text/plain',
  BINARY = 'application/octet-stream'
}

/**
 * 消息类型枚举
 * Message type enumeration
 */
export enum MessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  EVENT = 'event',
  COMMAND = 'command',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

/**
 * 消息优先级枚举
 * Message priority enumeration
 */
export enum MessagePriority {
  LOW = 1,
  NORMAL = 5,
  HIGH = 8,
  CRITICAL = 10
}

/**
 * 服务信息接口
 * Service information interface
 */
export interface ServiceInfo {
  service_name: SkerString;
  service_version: SkerString;
  service_id: SkerString;
  instance_id?: SkerString;
}

/**
 * 消息头部接口
 * Message header interface
 */
export interface MessageHeader {
  /** UUID格式消息ID */
  message_id: UUID;
  
  /** 关联消息ID，用于请求响应匹配 */
  correlation_id?: UUID;
  
  /** 创建时间戳 */
  timestamp: SkerTimestamp;
  
  /** 发送方信息 */
  source: ServiceInfo;
  
  /** 接收方信息 */
  destination?: ServiceInfo;
  
  /** 内容类型 */
  content_type: ContentType;
  
  /** 消息类型 */
  message_type: MessageType;
  
  /** 消息版本 */
  version?: SkerString;
}

/**
 * 消息元数据接口
 * Message metadata interface
 */
export interface MessageMetadata {
  /** 分布式追踪ID */
  trace_id?: SkerString;
  
  /** 跨度ID */
  span_id?: SkerString;
  
  /** 父跨度ID */
  parent_span_id?: SkerString;
  
  /** 消息优先级 */
  priority?: MessagePriority;
  
  /** 生存时间（毫秒） */
  ttl?: number;
  
  /** 重试次数 */
  retry_count?: number;
  
  /** 最大重试次数 */
  max_retries?: number;
  
  /** 延迟发送时间戳 */
  delay_until?: SkerTimestamp;
  
  /** 消息标签 */
  tags?: SkerArray<SkerString>;
  
  /** 消息路由键 */
  routing_key?: SkerString;
  
  /** 消息分区键 */
  partition_key?: SkerString;
  
  /** 自定义属性 */
  custom_properties?: SkerRecord<string, unknown>;
}

/**
 * 消息信封接口
 * Message envelope interface
 */
export interface MessageEnvelope {
  header: MessageHeader;
  metadata: MessageMetadata;
}

/**
 * 消息载荷接口
 * Message payload interface
 */
export interface MessagePayload {
  /** 实际业务数据 */
  data: unknown;
  
  /** 数据模式版本 */
  schema_version: SkerString;
  
  /** 数据校验和 */
  checksum?: SkerString;
  
  /** 数据大小（字节） */
  size_bytes?: number;
  
  /** 数据编码方式 */
  encoding?: SkerString;
  
  /** 数据压缩方式 */
  compression?: SkerString;
}

/**
 * UDEF消息接口
 * UDEF message interface
 */
export interface UDEFMessage {
  envelope: MessageEnvelope;
  payload: MessagePayload;
}

/**
 * 类型化UDEF消息接口
 * Typed UDEF message interface
 */
export interface TypedUDEFMessage<TData = unknown> extends UDEFMessage {
  payload: MessagePayload & {
    data: TData;
  };
}

/**
 * 请求消息接口
 * Request message interface
 */
export interface RequestMessage<TData = unknown> extends TypedUDEFMessage<TData> {
  envelope: MessageEnvelope & {
    header: MessageHeader & {
      message_type: MessageType.REQUEST;
    };
  };
}

/**
 * 响应消息接口
 * Response message interface
 */
export interface ResponseMessage<TData = unknown> extends TypedUDEFMessage<TData> {
  envelope: MessageEnvelope & {
    header: MessageHeader & {
      message_type: MessageType.RESPONSE;
      correlation_id: UUID;
    };
  };
}

/**
 * 事件消息接口
 * Event message interface
 */
export interface EventMessage<TData = unknown> extends TypedUDEFMessage<TData> {
  envelope: MessageEnvelope & {
    header: MessageHeader & {
      message_type: MessageType.EVENT;
    };
  };
}

/**
 * 命令消息接口
 * Command message interface
 */
export interface CommandMessage<TData = unknown> extends TypedUDEFMessage<TData> {
  envelope: MessageEnvelope & {
    header: MessageHeader & {
      message_type: MessageType.COMMAND;
    };
  };
}

/**
 * 通知消息接口
 * Notification message interface
 */
export interface NotificationMessage<TData = unknown> extends TypedUDEFMessage<TData> {
  envelope: MessageEnvelope & {
    header: MessageHeader & {
      message_type: MessageType.NOTIFICATION;
    };
  };
}

/**
 * 心跳消息接口
 * Heartbeat message interface
 */
export interface HeartbeatMessage extends TypedUDEFMessage<{
  status: 'alive' | 'healthy' | 'degraded';
  timestamp: SkerTimestamp;
  metrics?: SkerRecord<string, unknown>;
}> {
  envelope: MessageEnvelope & {
    header: MessageHeader & {
      message_type: MessageType.HEARTBEAT;
    };
  };
}

/**
 * 消息批处理接口
 * Message batch interface
 */
export interface MessageBatch {
  batch_id: UUID;
  messages: SkerArray<UDEFMessage>;
  batch_size: number;
  created_at: SkerTimestamp;
  metadata?: MessageMetadata;
}

/**
 * 消息确认接口
 * Message acknowledgment interface
 */
export interface MessageAck {
  message_id: UUID;
  ack_type: 'positive' | 'negative' | 'reject';
  timestamp: SkerTimestamp;
  reason?: SkerString;
  retry_after?: number;
}

/**
 * 消息统计接口
 * Message statistics interface
 */
export interface MessageStats {
  total_messages: number;
  success_count: number;
  error_count: number;
  average_processing_time_ms: number;
  throughput_per_second: number;
  last_message_timestamp: SkerTimestamp;
}

/**
 * 消息过滤器接口
 * Message filter interface
 */
export interface MessageFilter {
  service_name?: SkerString;
  message_type?: MessageType;
  tags?: SkerArray<SkerString>;
  priority?: MessagePriority;
  timestamp_after?: SkerTimestamp;
  timestamp_before?: SkerTimestamp;
  custom_filter?: (message: UDEFMessage) => boolean;
}

/**
 * 消息路由规则接口
 * Message routing rule interface
 */
export interface MessageRoutingRule {
  rule_id: UUID;
  name: SkerString;
  condition: MessageFilter;
  destination: ServiceInfo;
  transformation?: SkerString;
  enabled: boolean;
}

/**
 * 消息转换接口
 * Message transformation interface
 */
export interface MessageTransformation {
  from_format: ContentType;
  to_format: ContentType;
  schema_mapping?: SkerRecord<string, string>;
  field_mappings?: SkerRecord<string, string>;
  custom_transformer?: SkerString;
}