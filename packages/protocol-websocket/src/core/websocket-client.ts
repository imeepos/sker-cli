/**
 * @sker/protocol-websocket - WebSocket客户端实现
 */

import { EventEmitter } from 'events';
import { Logger } from '@sker/logger';
import { 
  ClientConfig, 
  WebSocketState, 
  Message,
  ReconnectConfig 
} from '../types/websocket-types.js';
import { 
  DEFAULT_CLIENT_CONFIG, 
  WebSocketEvent, 
  MessageTypes,
  ERROR_MESSAGES 
} from '../constants/websocket-constants.js';
import { ClientEventEmitter } from '../events/event-emitter.js';
import { MessageQueue, MessageFactory } from '../utils/message-utils.js';
import { 
  calculateReconnectDelay, 
  deepMerge,
  generateMessageId 
} from '../utils/websocket-utils.js';

export class WebSocketClient extends EventEmitter {
  private config: ClientConfig;
  private logger: Logger;
  private ws?: any; // Browser WebSocket or Node.js ws
  private state: WebSocketState = 'CLOSED';
  private eventEmitter: ClientEventEmitter;
  private messageQueue: MessageQueue;
  private reconnectAttempt: number = 0;
  private reconnectTimer?: NodeJS.Timeout;
  private heartbeatTimer?: NodeJS.Timeout;
  private connectionId?: string;

  constructor(config: Partial<ClientConfig>) {
    super();
    
    if (!config.url) {
      throw new Error('WebSocket URL is required');
    }

    this.config = deepMerge(DEFAULT_CLIENT_CONFIG as ClientConfig, config);
    this.logger = new Logger({ 
      name: 'WebSocketClient',
      level: (this.config.debug?.logLevel as any) || 'info'
    });
    
    this.eventEmitter = new ClientEventEmitter(this.logger);
    this.messageQueue = new MessageQueue(this.config.message?.queue?.maxSize || 1000);
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // 内部事件处理
    this.on('open', this.handleOpen.bind(this));
    this.on('close', this.handleClose.bind(this));
    this.on('error', this.handleError.bind(this));
    this.on('message', this.handleMessage.bind(this));
  }

  async connect(): Promise<void> {
    if (this.state === 'CONNECTING' || this.state === 'OPEN') {
      this.logger.warn('Already connected or connecting');
      return;
    }

    try {
      this.logger.info('Connecting to WebSocket server', { url: this.config.url });
      this.state = 'CONNECTING';
      
      // 清除之前的重连定时器
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = undefined;
      }

      // 创建WebSocket连接
      await this.createConnection();
      
    } catch (error) {
      this.logger.error('Failed to connect', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.state = 'CLOSED';
      this.emit('error', error);
      
      // 尝试重连
      this.scheduleReconnect();
    }
  }

  async disconnect(): Promise<void> {
    this.logger.info('Disconnecting WebSocket client');
    
    // 清除重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
    }

    // 清除心跳定时器
    this.stopHeartbeat();

    // 重置重连计数
    this.reconnectAttempt = 0;

    // 关闭连接
    if (this.ws && this.state !== 'CLOSED') {
      this.state = 'CLOSING';
      this.ws.close(1000, 'Client disconnect');
    } else {
      this.state = 'CLOSED';
    }

    // 清理消息队列
    this.messageQueue.clear();
  }

  async send(message: any): Promise<void> {
    if (this.state !== 'OPEN') {
      if (this.config.message?.queue?.enabled) {
        // 如果启用了队列，将消息添加到队列
        const queuedMessage: Message = typeof message === 'object' ? message : {
          id: generateMessageId(),
          type: 'message',
          data: message,
          timestamp: new Date().toISOString()
        };
        
        this.messageQueue.enqueue(queuedMessage);
        this.logger.debug('Message queued', { messageId: queuedMessage.id });
        return;
      } else {
        throw new Error('WebSocket is not connected');
      }
    }

    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      this.ws!.send(messageStr);
      
      this.emit('messageSent', message);
      
      if (this.config.debug?.logMessages) {
        this.logger.debug('Message sent', { message });
      }
      
    } catch (error) {
      this.logger.error('Failed to send message', {
        error: error instanceof Error ? error.message : String(error)
      });
      
      this.emit('messageFailed', message, error);
      throw error;
    }
  }

  private async createConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 准备连接URL和协议
        let url = this.config.url;
        
        // 添加认证参数
        if (this.config.auth?.token && this.config.auth.type === 'jwt') {
          const urlObj = new URL(url);
          urlObj.searchParams.set('token', this.config.auth.token);
          url = urlObj.toString();
        }

        // 创建WebSocket连接
        const protocols = this.config.protocols;
        // Use global WebSocket if available (browser) or import ws for Node.js
        const WebSocketImpl = (globalThis as any).WebSocket || require('ws');
        this.ws = new WebSocketImpl(url, protocols);

        // 设置事件监听器
        this.ws.onopen = (event: any) => {
          this.state = 'OPEN';
          this.reconnectAttempt = 0;
          
          this.logger.info('WebSocket connection established');
          this.emit('open', event);
          resolve();
        };

        this.ws.onclose = (event: any) => {
          const wasOpen = this.state === 'OPEN';
          this.state = 'CLOSED';
          
          this.logger.info('WebSocket connection closed', {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          
          this.emit('close', event.code, event.reason, event.wasClean);
          
          if (wasOpen) {
            reject(new Error(`Connection closed: ${event.reason}`));
          }
        };

        this.ws.onerror = (error: any) => {
          this.logger.error('WebSocket error', { error });
          this.emit('error', error);
          reject(error);
        };

        this.ws.onmessage = (event: any) => {
          try {
            const message = typeof event.data === 'string' ? 
              JSON.parse(event.data) : event.data;
            
            this.emit('message', message);
            
            if (this.config.debug?.logMessages) {
              this.logger.debug('Message received', { message });
            }
          } catch (error) {
            this.logger.error('Failed to parse message', {
              error: error instanceof Error ? error.message : String(error)
            });
            this.emit('error', error);
          }
        };

        // 设置连接超时
        setTimeout(() => {
          if (this.state === 'CONNECTING') {
            reject(new Error('Connection timeout'));
            this.ws?.close();
          }
        }, 30000);

      } catch (error) {
        reject(error);
      }
    });
  }

  private handleOpen(): void {
    this.logger.debug('Connection opened, processing queued messages');
    
    // 开始心跳
    this.startHeartbeat();
    
    // 处理队列中的消息
    this.processMessageQueue();
    
    // 发射连接事件
    this.eventEmitter.emitConnectionEvent('connected');
  }

  private handleClose(code: number, reason: string, wasClean: boolean): void {
    this.stopHeartbeat();
    
    // 如果不是正常关闭且启用了重连，尝试重连
    if (!wasClean && this.config.reconnect?.enabled && code !== 1000) {
      this.scheduleReconnect();
    }
    
    this.eventEmitter.emitConnectionEvent('disconnected', { code, reason, wasClean });
  }

  private handleError(error: any): void {
    this.logger.error('WebSocket client error', { error });
    this.eventEmitter.emitConnectionEvent('error', error);
  }

  private handleMessage(message: any): void {
    // 处理特殊消息类型
    switch (message.type) {
      case MessageTypes.WELCOME:
        this.handleWelcomeMessage(message);
        break;
      case MessageTypes.PING:
        this.handlePing(message);
        break;
      case MessageTypes.PONG:
        this.handlePong(message);
        break;
      case MessageTypes.ERROR:
        this.handleErrorMessage(message);
        break;
      default:
        // 发射到用户层
        this.eventEmitter.emitConnectionEvent('message', message);
    }
  }

  private handleWelcomeMessage(message: any): void {
    this.connectionId = message.data?.connectionId;
    this.eventEmitter.setConnection(this.connectionId!);
    
    this.logger.info('Received welcome message', {
      connectionId: this.connectionId,
      serverTime: message.data?.serverTime
    });
    
    this.eventEmitter.emitConnectionEvent('welcome', message.data);
  }

  private handlePing(message: any): void {
    // 响应ping消息
    const pongMessage = MessageFactory.pong();
    this.send(pongMessage).catch(error => {
      this.logger.error('Failed to send pong', { error });
    });
  }

  private handlePong(message: any): void {
    this.logger.debug('Received pong');
  }

  private handleErrorMessage(message: any): void {
    this.logger.error('Server error message', {
      message: message.data?.message,
      code: message.data?.code
    });
    
    this.eventEmitter.emitConnectionEvent('serverError', message.data);
  }

  private scheduleReconnect(): void {
    if (!this.config.reconnect?.enabled) {
      return;
    }

    const maxAttempts = this.config.reconnect.maxAttempts || 10;
    if (this.reconnectAttempt >= maxAttempts) {
      this.logger.error('Max reconnect attempts reached', { attempts: this.reconnectAttempt });
      this.eventEmitter.emitConnectionEvent('reconnectFailed', this.reconnectAttempt);
      return;
    }

    this.reconnectAttempt++;
    
    const delay = calculateReconnectDelay(
      this.reconnectAttempt,
      this.config.reconnect.initialDelay,
      this.config.reconnect.maxDelay,
      this.config.reconnect.backoffFactor,
      this.config.reconnect.jitter
    );

    this.logger.info('Scheduling reconnect', {
      attempt: this.reconnectAttempt,
      delay,
      maxAttempts
    });

    this.eventEmitter.emitConnectionEvent('reconnecting', this.reconnectAttempt);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
        this.eventEmitter.emitConnectionEvent('reconnected');
      } catch (error) {
        this.logger.error('Reconnect failed', {
          attempt: this.reconnectAttempt,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // 递归重连
        this.scheduleReconnect();
      }
    }, delay);
  }

  private startHeartbeat(): void {
    if (!this.config.heartbeat?.enabled) {
      return;
    }

    const interval = this.config.heartbeat.interval || 25000;
    
    this.heartbeatTimer = setInterval(() => {
      if (this.state === 'OPEN') {
        const pingMessage = this.config.heartbeat!.pingMessage || MessageFactory.ping();
        this.send(pingMessage).catch(error => {
          this.logger.error('Heartbeat ping failed', { error });
        });
      }
    }, interval);

    this.logger.debug('Heartbeat started', { interval });
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = undefined;
      this.logger.debug('Heartbeat stopped');
    }
  }

  private async processMessageQueue(): Promise<void> {
    if (!this.config.message?.queue?.enabled) {
      return;
    }

    this.logger.debug('Processing message queue', { size: this.messageQueue.size() });

    await this.messageQueue.processQueue(async (message) => {
      try {
        await this.send(message);
      } catch (error) {
        this.logger.error('Failed to send queued message', {
          messageId: message.id,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

  // 公共方法
  public getState(): WebSocketState {
    return this.state;
  }

  public get isConnected(): boolean {
    return this.state === 'OPEN';
  }

  public get isConnecting(): boolean {
    return this.state === 'CONNECTING';
  }

  public getConnectionId(): string | undefined {
    return this.connectionId;
  }

  public getConfig(): ClientConfig {
    return { ...this.config };
  }

  public getEventEmitter(): ClientEventEmitter {
    return this.eventEmitter;
  }

  public getQueueSize(): number {
    return this.messageQueue.size();
  }

  public clearQueue(): void {
    this.messageQueue.clear();
    this.logger.debug('Message queue cleared');
  }

  public async updateAuth(token: string): Promise<void> {
    this.config.auth = { 
      ...this.config.auth, 
      type: this.config.auth?.type || 'jwt',
      token 
    };
    
    if (this.isConnected) {
      // 发送新的认证信息
      const authMessage = {
        type: MessageTypes.AUTH,
        data: { token }
      };
      
      await this.send(authMessage);
    }
  }

  // 便捷方法
  public async joinRoom(roomId: string, password?: string): Promise<void> {
    const message = {
      type: MessageTypes.JOIN_ROOM,
      data: { roomId, password }
    };
    
    await this.send(message);
  }

  public async leaveRoom(roomId: string): Promise<void> {
    const message = {
      type: MessageTypes.LEAVE_ROOM,
      data: { roomId }
    };
    
    await this.send(message);
  }

  public async sendRoomMessage(roomId: string, content: string, messageType: string = 'text'): Promise<void> {
    const message = {
      type: MessageTypes.ROOM_MESSAGE,
      data: {
        roomId,
        content,
        messageType,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.send(message);
  }

  public async sendUserMessage(targetUserId: string, content: string, messageType: string = 'text'): Promise<void> {
    const message = {
      type: MessageTypes.USER_MESSAGE,
      data: {
        targetUserId,
        content,
        messageType,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.send(message);
  }

  public async sendTyping(roomId: string, isTyping: boolean): Promise<void> {
    const message = {
      type: MessageTypes.USER_TYPING,
      data: {
        roomId,
        isTyping,
        timestamp: new Date().toISOString()
      }
    };
    
    await this.send(message);
  }
}