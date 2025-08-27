/**
 * @sker/protocol-websocket - 消息处理器
 */

import { Logger } from '@sker/logger';
import { 
  MessageHandler, 
  WebSocketConnection, 
  Message,
  MessageEnvelope 
} from '../types/websocket-types.js';
import { MessageTypes, WebSocketEvent, ERROR_MESSAGES } from '../constants/websocket-constants.js';
import { MessageValidator, MessageRouter, MessageFactory } from '../utils/message-utils.js';
import { WebSocketEventEmitter } from './event-emitter.js';

export abstract class BaseMessageHandler implements MessageHandler {
  protected logger: Logger;
  protected eventEmitter: WebSocketEventEmitter;
  protected router: MessageRouter;

  constructor(logger?: Logger, eventEmitter?: WebSocketEventEmitter) {
    this.logger = logger || new Logger({ name: this.constructor.name });
    this.eventEmitter = eventEmitter || new WebSocketEventEmitter(this.logger);
    this.router = new MessageRouter();
    this.setupRoutes();
  }

  protected abstract setupRoutes(): void;

  async handleMessage(connection: WebSocketConnection, message: any): Promise<void> {
    try {
      // 验证消息格式
      const validation = MessageValidator.validate(message);
      if (!validation.valid) {
        this.logger.warn('Invalid message format', {
          connectionId: connection.id,
          error: validation.error
        });
        
        await this.sendError(connection, validation.error!, 'INVALID_MESSAGE_FORMAT');
        return;
      }

      // 创建消息封装
      const envelope: MessageEnvelope = {
        message,
        connection
      };

      // 记录消息处理
      this.logger.debug('Processing message', {
        connectionId: connection.id,
        messageType: message.type,
        messageId: message.id
      });

      // 发射消息接收事件
      this.eventEmitter.safeEmit(WebSocketEvent.MESSAGE, connection, message);

      // 路由消息到对应的处理器
      if (this.router.hasRoute(message.type)) {
        await this.router.route(envelope);
      } else {
        await this.handleUnknownMessage(envelope);
      }

    } catch (error) {
      this.logger.error('Message handling failed', {
        connectionId: connection.id,
        messageType: message?.type,
        error: error instanceof Error ? error.message : String(error)
      });

      this.eventEmitter.safeEmit(WebSocketEvent.MESSAGE_ERROR, connection, error);
      await this.sendError(connection, ERROR_MESSAGES.SERVER_ERROR, 'MESSAGE_PROCESSING_ERROR');
    }
  }

  protected async handleUnknownMessage(envelope: MessageEnvelope): Promise<void> {
    this.logger.warn('Unknown message type', {
      connectionId: envelope.connection.id,
      messageType: envelope.message.type
    });

    await this.sendError(
      envelope.connection,
      `Unknown message type: ${envelope.message.type}`,
      'UNKNOWN_MESSAGE_TYPE'
    );
  }

  protected async sendError(connection: WebSocketConnection, message: string, code?: string): Promise<void> {
    try {
      const errorMessage = MessageFactory.error(message, code);
      await connection.send(errorMessage);
    } catch (error) {
      this.logger.error('Failed to send error message', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  protected async sendAck(connection: WebSocketConnection, originalMessage: Message): Promise<void> {
    try {
      const ackMessage = {
        type: 'ack',
        data: {
          originalId: originalMessage.id,
          originalType: originalMessage.type
        },
        correlation: originalMessage.correlation,
        timestamp: new Date().toISOString()
      };
      
      await connection.send(ackMessage);
    } catch (error) {
      this.logger.error('Failed to send ack message', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export class DefaultMessageHandler extends BaseMessageHandler {
  protected setupRoutes(): void {
    // 系统消息处理
    this.router.addRoute(MessageTypes.PING, this.handlePing.bind(this));
    this.router.addRoute(MessageTypes.PONG, this.handlePong.bind(this));
    
    // 认证消息处理
    this.router.addRoute(MessageTypes.AUTH, this.handleAuth.bind(this));
    
    // 房间消息处理
    this.router.addRoute(MessageTypes.JOIN_ROOM, this.handleJoinRoom.bind(this));
    this.router.addRoute(MessageTypes.LEAVE_ROOM, this.handleLeaveRoom.bind(this));
    this.router.addRoute(MessageTypes.ROOM_MESSAGE, this.handleRoomMessage.bind(this));
    
    // 用户消息处理
    this.router.addRoute(MessageTypes.USER_MESSAGE, this.handleUserMessage.bind(this));
    this.router.addRoute(MessageTypes.USER_TYPING, this.handleUserTyping.bind(this));
    
    // 添加中间件
    this.router.use(this.loggingMiddleware.bind(this));
    this.router.use(this.rateLimitMiddleware.bind(this));
  }

  private async handlePing(envelope: MessageEnvelope): Promise<void> {
    const { connection } = envelope;
    
    this.logger.debug('Received ping', { connectionId: connection.id });
    
    // 更新最后ping时间
    connection.info.lastPingAt = new Date();
    
    // 发送pong响应
    const pongMessage = MessageFactory.pong();
    await connection.send(pongMessage);
    
    // 发射ping事件
    this.eventEmitter.safeEmit('ping', connection);
  }

  private async handlePong(envelope: MessageEnvelope): Promise<void> {
    const { connection } = envelope;
    
    this.logger.debug('Received pong', { connectionId: connection.id });
    
    // 更新最后pong时间
    connection.info.lastPongAt = new Date();
    
    // 发射pong事件
    this.eventEmitter.safeEmit('pong', connection);
  }

  private async handleAuth(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    
    this.logger.debug('Processing auth message', { 
      connectionId: connection.id,
      hasToken: !!message.data?.token 
    });

    // 认证逻辑应该由认证中间件处理
    // 这里只是发射认证事件
    this.eventEmitter.safeEmit('auth', connection, message.data);
  }

  private async handleJoinRoom(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    const { roomId, password } = message.data || {};
    
    if (!roomId) {
      await this.sendError(connection, 'Room ID is required', 'MISSING_ROOM_ID');
      return;
    }

    this.logger.debug('User joining room', {
      connectionId: connection.id,
      userId: connection.user?.id,
      roomId
    });

    // 发射加入房间事件 - 实际的房间管理由房间管理器处理
    this.eventEmitter.safeEmit('joinRoom', connection, { roomId, password });
  }

  private async handleLeaveRoom(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    const { roomId } = message.data || {};
    
    if (!roomId) {
      await this.sendError(connection, 'Room ID is required', 'MISSING_ROOM_ID');
      return;
    }

    this.logger.debug('User leaving room', {
      connectionId: connection.id,
      userId: connection.user?.id,
      roomId
    });

    // 发射离开房间事件
    this.eventEmitter.safeEmit('leaveRoom', connection, { roomId });
  }

  private async handleRoomMessage(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    const { roomId, content, messageType = 'text' } = message.data || {};
    
    if (!roomId || !content) {
      await this.sendError(connection, 'Room ID and content are required', 'MISSING_REQUIRED_FIELDS');
      return;
    }

    // 检查用户是否在房间中
    if (!connection.rooms.has(roomId)) {
      await this.sendError(connection, 'You are not in this room', 'NOT_IN_ROOM');
      return;
    }

    this.logger.debug('Room message received', {
      connectionId: connection.id,
      userId: connection.user?.id,
      roomId,
      messageType,
      contentLength: content.length
    });

    // 发射房间消息事件
    this.eventEmitter.safeEmit('roomMessage', connection, {
      roomId,
      content,
      messageType,
      originalMessage: message
    });
  }

  private async handleUserMessage(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    const { targetUserId, content, messageType = 'text' } = message.data || {};
    
    if (!targetUserId || !content) {
      await this.sendError(connection, 'Target user ID and content are required', 'MISSING_REQUIRED_FIELDS');
      return;
    }

    this.logger.debug('User message received', {
      connectionId: connection.id,
      senderId: connection.user?.id,
      targetUserId,
      messageType,
      contentLength: content.length
    });

    // 发射用户消息事件
    this.eventEmitter.safeEmit('userMessage', connection, {
      targetUserId,
      content,
      messageType,
      originalMessage: message
    });
  }

  private async handleUserTyping(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    const { roomId, isTyping } = message.data || {};
    
    if (!roomId || typeof isTyping !== 'boolean') {
      await this.sendError(connection, 'Room ID and typing status are required', 'MISSING_REQUIRED_FIELDS');
      return;
    }

    // 检查用户是否在房间中
    if (!connection.rooms.has(roomId)) {
      await this.sendError(connection, 'You are not in this room', 'NOT_IN_ROOM');
      return;
    }

    this.logger.debug('User typing status', {
      connectionId: connection.id,
      userId: connection.user?.id,
      roomId,
      isTyping
    });

    // 发射用户打字事件
    this.eventEmitter.safeEmit('userTyping', connection, {
      roomId,
      isTyping,
      userId: connection.user?.id,
      username: connection.user?.username
    });
  }

  private loggingMiddleware(envelope: MessageEnvelope, next: () => void): void {
    const start = Date.now();
    
    this.logger.debug('Message processing started', {
      connectionId: envelope.connection.id,
      messageType: envelope.message.type,
      messageId: envelope.message.id
    });

    try {
      next();
      
      const duration = Date.now() - start;
      this.logger.debug('Message processing completed', {
        connectionId: envelope.connection.id,
        messageType: envelope.message.type,
        messageId: envelope.message.id,
        duration
      });
    } catch (error) {
      const duration = Date.now() - start;
      this.logger.error('Message processing failed', {
        connectionId: envelope.connection.id,
        messageType: envelope.message.type,
        messageId: envelope.message.id,
        duration,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private rateLimitMiddleware(envelope: MessageEnvelope, next: () => void): void {
    // 简单的限流检查 - 实际实现应该更复杂
    const { connection, message } = envelope;
    
    // 这里可以实现基于连接的限流逻辑
    // 例如：检查最近一分钟内的消息数量
    
    next();
  }
}

export class RoomMessageHandler extends BaseMessageHandler {
  protected setupRoutes(): void {
    this.router.addRoute('chat_message', this.handleChatMessage.bind(this));
    this.router.addRoute('room_info', this.handleRoomInfo.bind(this));
    this.router.addRoute('user_list', this.handleUserList.bind(this));
    this.router.addRoute('room_history', this.handleRoomHistory.bind(this));
  }

  private async handleChatMessage(envelope: MessageEnvelope): Promise<void> {
    // 聊天消息处理逻辑
    const { connection, message } = envelope;
    
    // 发射聊天消息事件供房间管理器处理
    this.eventEmitter.safeEmit('chatMessage', connection, message.data);
  }

  private async handleRoomInfo(envelope: MessageEnvelope): Promise<void> {
    // 房间信息请求处理
    this.eventEmitter.safeEmit('roomInfoRequest', envelope.connection, envelope.message.data);
  }

  private async handleUserList(envelope: MessageEnvelope): Promise<void> {
    // 用户列表请求处理
    this.eventEmitter.safeEmit('userListRequest', envelope.connection, envelope.message.data);
  }

  private async handleRoomHistory(envelope: MessageEnvelope): Promise<void> {
    // 房间历史消息请求处理
    this.eventEmitter.safeEmit('roomHistoryRequest', envelope.connection, envelope.message.data);
  }
}

export class AdminMessageHandler extends BaseMessageHandler {
  protected setupRoutes(): void {
    this.router.addRoute('ban_user', this.handleBanUser.bind(this));
    this.router.addRoute('unban_user', this.handleUnbanUser.bind(this));
    this.router.addRoute('mute_user', this.handleMuteUser.bind(this));
    this.router.addRoute('kick_user', this.handleKickUser.bind(this));
    this.router.addRoute('system_stats', this.handleSystemStats.bind(this));
    this.router.addRoute('moderate_content', this.handleModerateContent.bind(this));
  }

  private async handleBanUser(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    
    // 检查管理员权限
    if (!this.hasAdminPermission(connection)) {
      await this.sendError(connection, 'Insufficient permissions', 'PERMISSION_DENIED');
      return;
    }

    this.eventEmitter.safeEmit('banUser', connection, message.data);
  }

  private async handleUnbanUser(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    
    if (!this.hasAdminPermission(connection)) {
      await this.sendError(connection, 'Insufficient permissions', 'PERMISSION_DENIED');
      return;
    }

    this.eventEmitter.safeEmit('unbanUser', connection, message.data);
  }

  private async handleMuteUser(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    
    if (!this.hasModeratorPermission(connection)) {
      await this.sendError(connection, 'Insufficient permissions', 'PERMISSION_DENIED');
      return;
    }

    this.eventEmitter.safeEmit('muteUser', connection, message.data);
  }

  private async handleKickUser(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    
    if (!this.hasModeratorPermission(connection)) {
      await this.sendError(connection, 'Insufficient permissions', 'PERMISSION_DENIED');
      return;
    }

    this.eventEmitter.safeEmit('kickUser', connection, message.data);
  }

  private async handleSystemStats(envelope: MessageEnvelope): Promise<void> {
    const { connection } = envelope;
    
    if (!this.hasAdminPermission(connection)) {
      await this.sendError(connection, 'Insufficient permissions', 'PERMISSION_DENIED');
      return;
    }

    this.eventEmitter.safeEmit('systemStatsRequest', connection);
  }

  private async handleModerateContent(envelope: MessageEnvelope): Promise<void> {
    const { connection, message } = envelope;
    
    if (!this.hasModeratorPermission(connection)) {
      await this.sendError(connection, 'Insufficient permissions', 'PERMISSION_DENIED');
      return;
    }

    this.eventEmitter.safeEmit('moderateContent', connection, message.data);
  }

  private hasAdminPermission(connection: WebSocketConnection): boolean {
    return connection.user?.roles.includes('admin') || false;
  }

  private hasModeratorPermission(connection: WebSocketConnection): boolean {
    return connection.user?.roles.includes('admin') || 
           connection.user?.roles.includes('moderator') || false;
  }
}