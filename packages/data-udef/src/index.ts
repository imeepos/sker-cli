/**
 * @sker/data-udef - 统一数据交换格式(UDEF)实现
 * 
 * 提供跨语言数据序列化和标准消息格式
 */

// 基础类型定义
export interface UDEFEnvelope {
  header: {
    messageId: string;
    timestamp: number;
    version: string;
    source: string;
    target?: string;
  };
  metadata?: Record<string, unknown>;
}

export interface UDEFPayload<T = unknown> {
  data: T;
  schema?: {
    type: string;
    version: string;
  };
}

export interface UDEFMessage<T = unknown> {
  envelope: UDEFEnvelope;
  payload: UDEFPayload<T>;
}

// 基础实现类
export class UDEFMessageBuilder<T = unknown> {
  private envelope: Partial<UDEFEnvelope> = {};
  private payload: Partial<UDEFPayload<T>> = {};

  constructor(messageId?: string) {
    this.envelope = {
      header: {
        messageId: messageId || this.generateMessageId(),
        timestamp: Date.now(),
        version: '1.0.0',
        source: 'unknown'
      }
    };
  }

  setSource(source: string): this {
    this.envelope.header!.source = source;
    return this;
  }

  setTarget(target: string): this {
    this.envelope.header!.target = target;
    return this;
  }

  setData(data: T): this {
    this.payload.data = data;
    return this;
  }

  setSchema(type: string, version: string): this {
    this.payload.schema = { type, version };
    return this;
  }

  setMetadata(metadata: Record<string, unknown>): this {
    this.envelope.metadata = metadata;
    return this;
  }

  build(): UDEFMessage<T> {
    if (!this.payload.data) {
      throw new Error('Data is required for UDEF message');
    }

    return {
      envelope: this.envelope as UDEFEnvelope,
      payload: this.payload as UDEFPayload<T>
    };
  }

  private generateMessageId(): string {
    return `udef-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
}

// 工具函数
export function createUDEFMessage<T>(
  data: T,
  options?: {
    messageId?: string;
    source?: string;
    target?: string;
    schema?: { type: string; version: string };
    metadata?: Record<string, unknown>;
  }
): UDEFMessage<T> {
  const builder = new UDEFMessageBuilder<T>(options?.messageId);
  
  if (options?.source) builder.setSource(options.source);
  if (options?.target) builder.setTarget(options.target);
  if (options?.schema) builder.setSchema(options.schema.type, options.schema.version);
  if (options?.metadata) builder.setMetadata(options.metadata);
  
  return builder.setData(data).build();
}

export function isValidUDEFMessage(obj: unknown): obj is UDEFMessage {
  if (!obj || typeof obj !== 'object') return false;
  
  const message = obj as any;
  return (
    message.envelope &&
    message.envelope.header &&
    typeof message.envelope.header.messageId === 'string' &&
    typeof message.envelope.header.timestamp === 'number' &&
    typeof message.envelope.header.version === 'string' &&
    typeof message.envelope.header.source === 'string' &&
    message.payload &&
    message.payload.data !== undefined
  );
}

// 默认导出已在上面定义
export default UDEFMessageBuilder;