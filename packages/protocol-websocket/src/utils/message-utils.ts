/**
 * @sker/protocol-websocket - 消息处理工具函数
 */

import { 
  Message, 
  MessageEnvelope, 
  WebSocketConnection,
  MessageType
} from '../types/websocket-types.js';
import { MessageTypes as MsgType, ERROR_MESSAGES } from '../constants/websocket-constants.js';
import { 
  generateMessageId, 
  calculateMessageSize, 
  serializeMessage, 
  deserializeMessage 
} from './websocket-utils.js';

/**
 * 消息验证器
 */
export class MessageValidator {
  static validate(message: any, maxSize: number = 1024 * 1024): { valid: boolean; error?: string } {
    // 检查消息结构
    if (!message || typeof message !== 'object') {
      return { valid: false, error: 'Message must be an object' };
    }

    // 检查必要字段
    if (!message.type || typeof message.type !== 'string') {
      return { valid: false, error: 'Message must have a type field' };
    }

    // 检查消息大小
    const messageSize = calculateMessageSize(message);
    if (messageSize > maxSize) {
      return { valid: false, error: `Message size ${messageSize} exceeds limit ${maxSize}` };
    }

    // 检查消息内容
    if (message.data !== undefined && typeof message.data !== 'object') {
      return { valid: false, error: 'Message data must be an object' };
    }

    return { valid: true };
  }

  static validateRoomMessage(message: any, roomId: string): { valid: boolean; error?: string } {
    const baseValidation = this.validate(message);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // 检查房间消息特定字段
    if (!message.data?.roomId || message.data.roomId !== roomId) {
      return { valid: false, error: 'Invalid or missing roomId' };
    }

    if (message.type === MsgType.ROOM_MESSAGE) {
      if (!message.data.content || typeof message.data.content !== 'string') {
        return { valid: false, error: 'Room message must have content' };
      }

      if (!message.data.senderId || typeof message.data.senderId !== 'string') {
        return { valid: false, error: 'Room message must have senderId' };
      }
    }

    return { valid: true };
  }

  static validateUserMessage(message: any, userId: string): { valid: boolean; error?: string } {
    const baseValidation = this.validate(message);
    if (!baseValidation.valid) {
      return baseValidation;
    }

    // 检查用户消息特定字段
    if (message.data?.senderId && message.data.senderId !== userId) {
      return { valid: false, error: 'Sender ID mismatch' };
    }

    if (message.type === MsgType.USER_MESSAGE) {
      if (!message.data?.content || typeof message.data.content !== 'string') {
        return { valid: false, error: 'User message must have content' };
      }
    }

    return { valid: true };
  }
}

/**
 * 消息构建器
 */
export class MessageBuilder {
  private message: Partial<Message> = {};

  static create(type: string): MessageBuilder {
    return new MessageBuilder().setType(type);
  }

  setType(type: string): MessageBuilder {
    this.message.type = type;
    return this;
  }

  setData(data: any): MessageBuilder {
    this.message.data = data;
    return this;
  }

  setCorrelation(correlationId: string): MessageBuilder {
    this.message.correlation = correlationId;
    return this;
  }

  setMetadata(metadata: Record<string, any>): MessageBuilder {
    this.message.metadata = metadata;
    return this;
  }

  addMetadata(key: string, value: any): MessageBuilder {
    if (!this.message.metadata) {
      this.message.metadata = {};
    }
    this.message.metadata[key] = value;
    return this;
  }

  build(): Message {
    return {
      id: generateMessageId(),
      timestamp: new Date().toISOString(),
      ...this.message
    } as Message;
  }
}

/**
 * 消息过滤器
 */
export class MessageFilter {
  static byType(messages: Message[], type: string): Message[] {
    return messages.filter(msg => msg.type === type);
  }

  static byTypes(messages: Message[], types: string[]): Message[] {
    const typeSet = new Set(types);
    return messages.filter(msg => typeSet.has(msg.type));
  }

  static byTimeRange(messages: Message[], startTime: Date, endTime: Date): Message[] {
    return messages.filter(msg => {
      if (!msg.timestamp) return false;
      const messageTime = new Date(msg.timestamp);
      return messageTime >= startTime && messageTime <= endTime;
    });
  }

  static bySender(messages: Message[], senderId: string): Message[] {
    return messages.filter(msg => msg.data?.senderId === senderId);
  }

  static byRoom(messages: Message[], roomId: string): Message[] {
    return messages.filter(msg => msg.data?.roomId === roomId);
  }

  static byContent(messages: Message[], searchTerm: string, caseSensitive: boolean = false): Message[] {
    const search = caseSensitive ? searchTerm : searchTerm.toLowerCase();
    return messages.filter(msg => {
      const content = msg.data?.content || '';
      const target = caseSensitive ? content : content.toLowerCase();
      return target.includes(search);
    });
  }

  static recent(messages: Message[], limit: number): Message[] {
    return messages
      .sort((a, b) => {
        const timeA = new Date(a.timestamp || 0).getTime();
        const timeB = new Date(b.timestamp || 0).getTime();
        return timeB - timeA;
      })
      .slice(0, limit);
  }
}

/**
 * 消息转换器
 */
export class MessageTransformer {
  static toEnvelope(message: Message, connection: WebSocketConnection, room?: string, namespace?: string): MessageEnvelope {
    return {
      message,
      connection,
      room,
      namespace
    };
  }

  static fromEnvelope(envelope: MessageEnvelope): Message {
    return envelope.message;
  }

  static addTimestamp(message: Message): Message {
    return {
      ...message,
      timestamp: new Date().toISOString()
    };
  }

  static addSender(message: Message, connection: WebSocketConnection): Message {
    if (!message.data) {
      message.data = {};
    }

    return {
      ...message,
      data: {
        ...message.data,
        senderId: connection.user?.id,
        senderName: connection.user?.username,
        senderInfo: {
          ip: connection.info.ip,
          userAgent: connection.info.userAgent,
          platform: connection.platform
        }
      }
    };
  }

  static sanitize(message: Message): Message {
    // 移除敏感信息
    const sanitized = { ...message };
    
    if (sanitized.data?.senderInfo) {
      delete sanitized.data.senderInfo.ip;
      delete sanitized.data.senderInfo.userAgent;
    }

    if (sanitized.metadata?.connection) {
      delete sanitized.metadata.connection;
    }

    return sanitized;
  }

  static compress(message: Message): Message {
    // 简单的消息压缩 - 移除不必要的字段
    const compressed = { ...message };
    
    // 移除空值
    Object.keys(compressed).forEach(key => {
      if (compressed[key as keyof Message] === null || compressed[key as keyof Message] === undefined) {
        delete compressed[key as keyof Message];
      }
    });

    // 压缩数据字段
    if (compressed.data) {
      Object.keys(compressed.data).forEach(key => {
        if (compressed.data[key] === null || compressed.data[key] === undefined) {
          delete compressed.data[key];
        }
      });
    }

    return compressed;
  }
}

/**
 * 消息队列管理器
 */
export class MessageQueue {
  private queue: Message[] = [];
  private maxSize: number;
  private processing: boolean = false;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  enqueue(message: Message): boolean {
    if (this.queue.length >= this.maxSize) {
      // 队列满了，移除最老的消息
      this.queue.shift();
    }

    this.queue.push(message);
    return true;
  }

  dequeue(): Message | undefined {
    return this.queue.shift();
  }

  peek(): Message | undefined {
    return this.queue[0];
  }

  size(): number {
    return this.queue.length;
  }

  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  isFull(): boolean {
    return this.queue.length >= this.maxSize;
  }

  clear(): void {
    this.queue = [];
  }

  toArray(): Message[] {
    return [...this.queue];
  }

  async processQueue(processor: (message: Message) => Promise<void>): Promise<void> {
    if (this.processing) {
      return;
    }

    this.processing = true;
    try {
      while (!this.isEmpty()) {
        const message = this.dequeue();
        if (message) {
          await processor(message);
        }
      }
    } finally {
      this.processing = false;
    }
  }
}

/**
 * 消息批处理器
 */
export class MessageBatcher {
  private batches: Map<string, Message[]> = new Map();
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private batchSize: number;
  private flushInterval: number;

  constructor(batchSize: number = 10, flushInterval: number = 50) {
    this.batchSize = batchSize;
    this.flushInterval = flushInterval;
  }

  addMessage(key: string, message: Message): void {
    if (!this.batches.has(key)) {
      this.batches.set(key, []);
    }

    const batch = this.batches.get(key)!;
    batch.push(message);

    // 如果没有定时器，创建一个
    if (!this.timers.has(key)) {
      const timer = setTimeout(() => {
        this.flushBatch(key);
      }, this.flushInterval);
      
      this.timers.set(key, timer);
    }

    // 如果达到批次大小，立即刷新
    if (batch.length >= this.batchSize) {
      this.flushBatch(key);
    }
  }

  private flushBatch(key: string): Message[] | undefined {
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) {
      return undefined;
    }

    // 清理批次和定时器
    this.batches.delete(key);
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }

    return [...batch];
  }

  flushAll(): Map<string, Message[]> {
    const result = new Map<string, Message[]>();
    
    for (const key of this.batches.keys()) {
      const batch = this.flushBatch(key);
      if (batch && batch.length > 0) {
        result.set(key, batch);
      }
    }

    return result;
  }

  getBatchSize(key: string): number {
    return this.batches.get(key)?.length || 0;
  }

  hasBatch(key: string): boolean {
    return this.batches.has(key) && this.batches.get(key)!.length > 0;
  }

  clear(): void {
    // 清理所有定时器
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.batches.clear();
    this.timers.clear();
  }
}

/**
 * 消息路由器
 */
export class MessageRouter {
  private routes: Map<string, (envelope: MessageEnvelope) => Promise<void>> = new Map();
  private middlewares: Array<(envelope: MessageEnvelope, next: () => void) => void> = [];

  addRoute(messageType: string, handler: (envelope: MessageEnvelope) => Promise<void>): void {
    this.routes.set(messageType, handler);
  }

  removeRoute(messageType: string): void {
    this.routes.delete(messageType);
  }

  use(middleware: (envelope: MessageEnvelope, next: () => void) => void): void {
    this.middlewares.push(middleware);
  }

  async route(envelope: MessageEnvelope): Promise<void> {
    const handler = this.routes.get(envelope.message.type);
    if (!handler) {
      throw new Error(`No handler found for message type: ${envelope.message.type}`);
    }

    // 执行中间件链
    let index = 0;
    const executeMiddleware = () => {
      if (index >= this.middlewares.length) {
        // 执行最终处理器
        return handler(envelope);
      }

      const middleware = this.middlewares[index++]!;
      return new Promise<void>((resolve, reject) => {
        try {
          middleware(envelope, () => {
            executeMiddleware().then(resolve).catch(reject);
          });
        } catch (error) {
          reject(error);
        }
      });
    };

    await executeMiddleware();
  }

  getRoutes(): string[] {
    return Array.from(this.routes.keys());
  }

  hasRoute(messageType: string): boolean {
    return this.routes.has(messageType);
  }
}

/**
 * 预定义消息创建函数
 */
export const MessageFactory = {
  ping(): Message {
    return MessageBuilder.create(MsgType.PING).build();
  },

  pong(): Message {
    return MessageBuilder.create(MsgType.PONG).build();
  },

  welcome(connectionId: string, serverInfo?: any): Message {
    return MessageBuilder.create(MsgType.WELCOME)
      .setData({
        connectionId,
        serverTime: new Date().toISOString(),
        ...serverInfo
      })
      .build();
  },

  error(message: string, code?: string, details?: any): Message {
    return MessageBuilder.create(MsgType.ERROR)
      .setData({
        message,
        code,
        details
      })
      .build();
  },

  authSuccess(user: any): Message {
    return MessageBuilder.create(MsgType.AUTH_SUCCESS)
      .setData({ user })
      .build();
  },

  authFailed(reason: string): Message {
    return MessageBuilder.create(MsgType.AUTH_FAILED)
      .setData({ reason })
      .build();
  },

  roomJoined(roomId: string, roomInfo?: any): Message {
    return MessageBuilder.create(MsgType.ROOM_JOINED)
      .setData({
        roomId,
        roomInfo,
        timestamp: new Date().toISOString()
      })
      .build();
  },

  roomLeft(roomId: string): Message {
    return MessageBuilder.create(MsgType.ROOM_LEFT)
      .setData({
        roomId,
        timestamp: new Date().toISOString()
      })
      .build();
  },

  userJoined(roomId: string, user: any): Message {
    return MessageBuilder.create(MsgType.USER_JOINED)
      .setData({
        roomId,
        user,
        timestamp: new Date().toISOString()
      })
      .build();
  },

  userLeft(roomId: string, user: any): Message {
    return MessageBuilder.create(MsgType.USER_LEFT)
      .setData({
        roomId,
        user,
        timestamp: new Date().toISOString()
      })
      .build();
  },

  userTyping(roomId: string, userId: string, isTyping: boolean): Message {
    return MessageBuilder.create(MsgType.USER_TYPING)
      .setData({
        roomId,
        userId,
        isTyping,
        timestamp: new Date().toISOString()
      })
      .build();
  },

  systemMessage(content: string, level: 'info' | 'warning' | 'error' = 'info'): Message {
    return MessageBuilder.create(MsgType.SYSTEM_MESSAGE)
      .setData({
        content,
        level,
        system: true
      })
      .build();
  }
};