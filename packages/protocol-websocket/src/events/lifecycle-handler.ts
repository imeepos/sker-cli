/**
 * @sker/protocol-websocket - 生命周期处理器
 */

import { Logger } from '@sker/core';
import { WebSocketConnection, User } from '../types/websocket-types.js';
import { WebSocketEvent, MessageTypes, WebSocketCloseCode } from '../constants/websocket-constants.js';
import { WebSocketEventEmitter } from './event-emitter.js';
import { MessageFactory } from '../utils/message-utils.js';
import { formatConnectionInfo, formatUserInfo } from '../utils/websocket-utils.js';

export class LifecycleHandler {
  private logger: Logger;
  private eventEmitter: WebSocketEventEmitter;

  constructor(logger?: Logger, eventEmitter?: WebSocketEventEmitter) {
    this.logger = logger || new Logger({ name: 'LifecycleHandler' });
    this.eventEmitter = eventEmitter || new WebSocketEventEmitter(this.logger);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // 监听连接建立事件
    this.eventEmitter.on(WebSocketEvent.CONNECTION, this.handleConnection.bind(this));
    
    // 监听连接断开事件
    this.eventEmitter.on(WebSocketEvent.DISCONNECT, this.handleDisconnect.bind(this));
    
    // 监听认证事件
    this.eventEmitter.on('auth', this.handleAuthentication.bind(this));
    
    // 监听连接错误事件
    this.eventEmitter.on(WebSocketEvent.CONNECTION_ERROR, this.handleConnectionError.bind(this));
    
    // 监听重连事件
    this.eventEmitter.on(WebSocketEvent.RECONNECT, this.handleReconnect.bind(this));
    this.eventEmitter.on(WebSocketEvent.RECONNECTING, this.handleReconnecting.bind(this));
    this.eventEmitter.on(WebSocketEvent.RECONNECT_FAILED, this.handleReconnectFailed.bind(this));
  }

  private async handleConnection(connection: WebSocketConnection): Promise<void> {
    try {
      this.logger.info('New connection established', {
        connectionId: connection.id,
        ip: connection.info.ip,
        userAgent: connection.info.userAgent,
        protocol: connection.info.protocol
      });

      // 发送欢迎消息
      const welcomeMessage = MessageFactory.welcome(connection.id, {
        serverTime: new Date().toISOString(),
        supportedFeatures: this.getSupportedFeatures(),
        serverInfo: this.getServerInfo()
      });

      await connection.send(welcomeMessage);

      // 设置连接超时
      this.setupConnectionTimeout(connection);

      // 记录连接指标
      this.recordConnectionMetrics(connection, 'connected');

      // 发射连接就绪事件
      this.eventEmitter.safeEmit(WebSocketEvent.READY, connection);

    } catch (error) {
      this.logger.error('Error handling new connection', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });

      // 关闭有问题的连接
      connection.close(WebSocketCloseCode.INTERNAL_ERROR, 'Connection setup failed');
    }
  }

  private async handleDisconnect(connection: WebSocketConnection, reason?: string): Promise<void> {
    try {
      this.logger.info('Connection disconnected', {
        connectionId: connection.id,
        userId: connection.user?.id,
        reason,
        duration: this.getConnectionDuration(connection)
      });

      // 清理连接资源
      await this.cleanupConnection(connection, reason);

      // 通知用户离开所有房间
      await this.notifyRoomLeave(connection);

      // 记录断连指标
      this.recordConnectionMetrics(connection, 'disconnected', reason);

      // 发射连接清理完成事件
      this.eventEmitter.safeEmit('connectionCleaned', connection, reason);

    } catch (error) {
      this.logger.error('Error handling connection disconnect', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async handleAuthentication(connection: WebSocketConnection, authData: any): Promise<void> {
    try {
      this.logger.debug('Processing authentication', {
        connectionId: connection.id,
        hasToken: !!authData?.token,
        authType: authData?.type
      });

      // 验证认证数据
      if (!authData?.token) {
        await this.sendAuthFailure(connection, 'Token is required');
        return;
      }

      // 这里应该调用认证服务验证token
      // const user = await this.authenticateToken(authData.token);
      
      // 模拟认证成功（实际实现中应该验证token）
      const user: User = {
        id: 'user123',
        username: 'testuser',
        email: 'test@example.com',
        roles: ['member'],
        permissions: ['read', 'write'],
        metadata: {},
        createdAt: new Date(),
        lastActiveAt: new Date()
      };

      // 设置用户信息
      connection.user = user;

      // 发送认证成功消息
      const authSuccessMessage = MessageFactory.authSuccess({
        id: user.id,
        username: user.username,
        roles: user.roles,
        permissions: user.permissions
      });

      await connection.send(authSuccessMessage);

      this.logger.info('User authenticated successfully', {
        connectionId: connection.id,
        userId: user.id,
        username: user.username,
        roles: user.roles
      });

      // 发射认证成功事件
      this.eventEmitter.safeEmit('authenticated', connection, user);

    } catch (error) {
      this.logger.error('Authentication failed', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });

      await this.sendAuthFailure(connection, 'Authentication failed');
    }
  }

  private async handleConnectionError(connection: WebSocketConnection, error: Error): Promise<void> {
    this.logger.error('Connection error occurred', {
      connectionId: connection.id,
      userId: connection.user?.id,
      error: error.message,
      stack: error.stack
    });

    // 记录错误指标
    this.recordErrorMetrics(connection, error);

    // 根据错误类型决定是否关闭连接
    if (this.shouldCloseOnError(error)) {
      connection.close(WebSocketCloseCode.INTERNAL_ERROR, 'Connection error');
    }
  }

  private async handleReconnect(connection: WebSocketConnection): Promise<void> {
    this.logger.info('Connection reconnected', {
      connectionId: connection.id,
      userId: connection.user?.id
    });

    // 恢复用户状态
    await this.restoreConnectionState(connection);

    // 发射重连成功事件
    this.eventEmitter.safeEmit('reconnected', connection);
  }

  private async handleReconnecting(connection: WebSocketConnection, attempt: number): Promise<void> {
    this.logger.debug('Connection reconnecting', {
      connectionId: connection.id,
      userId: connection.user?.id,
      attempt
    });

    // 记录重连尝试
    this.recordReconnectAttempt(connection, attempt);
  }

  private async handleReconnectFailed(connection: WebSocketConnection, attempts: number): Promise<void> {
    this.logger.warn('Connection reconnect failed', {
      connectionId: connection.id,
      userId: connection.user?.id,
      attempts
    });

    // 记录重连失败指标
    this.recordReconnectFailure(connection, attempts);

    // 最终清理连接
    await this.cleanupConnection(connection, 'reconnect_failed');
  }

  private async sendAuthFailure(connection: WebSocketConnection, reason: string): Promise<void> {
    try {
      const authFailedMessage = MessageFactory.authFailed(reason);
      await connection.send(authFailedMessage);
      
      // 延迟关闭连接给客户端时间处理消息
      setTimeout(() => {
        connection.close(WebSocketCloseCode.AUTHENTICATION_FAILED, reason);
      }, 1000);
    } catch (error) {
      this.logger.error('Failed to send auth failure message', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private setupConnectionTimeout(connection: WebSocketConnection): void {
    const timeout = 60000; // 60秒认证超时
    
    const authTimer = setTimeout(() => {
      if (!connection.user) {
        this.logger.warn('Connection authentication timeout', {
          connectionId: connection.id
        });
        
        connection.close(WebSocketCloseCode.AUTHENTICATION_FAILED, 'Authentication timeout');
      }
    }, timeout);

    // 清理定时器当连接关闭时
    connection.once('close', () => {
      clearTimeout(authTimer);
    });

    // 清理定时器当认证成功时
    this.eventEmitter.once('authenticated', (authConnection) => {
      if (authConnection.id === connection.id) {
        clearTimeout(authTimer);
      }
    });
  }

  private async cleanupConnection(connection: WebSocketConnection, reason?: string): Promise<void> {
    try {
      // 清理房间关联
      const rooms = Array.from(connection.rooms);
      for (const roomId of rooms) {
        connection.rooms.delete(roomId);
        
        // 通知房间其他用户
        this.eventEmitter.safeEmit('userLeftRoom', connection, { roomId, reason });
      }

      // 清理用户会话状态
      if (connection.user) {
        await this.cleanupUserSession(connection.user, reason);
      }

      // 移除所有事件监听器
      connection.removeAllListeners();

    } catch (error) {
      this.logger.error('Error during connection cleanup', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async notifyRoomLeave(connection: WebSocketConnection): Promise<void> {
    if (!connection.user) return;

    const rooms = Array.from(connection.rooms);
    for (const roomId of rooms) {
      try {
        // 发射用户离开房间事件
        this.eventEmitter.safeEmit('userLeftRoom', connection, {
          roomId,
          user: connection.user,
          reason: 'disconnect'
        });
      } catch (error) {
        this.logger.error('Error notifying room leave', {
          connectionId: connection.id,
          roomId,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async restoreConnectionState(connection: WebSocketConnection): Promise<void> {
    try {
      // 重新加入之前的房间
      const previousRooms = this.getPreviousRooms(connection);
      
      for (const roomId of previousRooms) {
        this.eventEmitter.safeEmit('rejoinRoom', connection, { roomId });
      }

      // 恢复用户状态
      if (connection.user) {
        connection.user.lastActiveAt = new Date();
      }

    } catch (error) {
      this.logger.error('Error restoring connection state', {
        connectionId: connection.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private async cleanupUserSession(user: User, reason?: string): Promise<void> {
    // 清理用户会话相关的资源
    // 例如：清理缓存、更新数据库状态等
    
    this.logger.debug('Cleaning up user session', {
      userId: user.id,
      username: user.username,
      reason
    });
  }

  private getConnectionDuration(connection: WebSocketConnection): number {
    return Date.now() - connection.info.connectedAt.getTime();
  }

  private shouldCloseOnError(error: Error): boolean {
    // 根据错误类型决定是否关闭连接
    const fatalErrors = ['ECONNRESET', 'EPIPE', 'ETIMEDOUT'];
    return fatalErrors.some(errorType => error.message.includes(errorType));
  }

  private getSupportedFeatures(): string[] {
    return [
      'rooms',
      'private-messages',
      'typing-indicators',
      'file-sharing',
      'message-history',
      'presence',
      'notifications'
    ];
  }

  private getServerInfo(): object {
    return {
      version: '1.0.0',
      name: 'Sker WebSocket Server',
      timestamp: new Date().toISOString(),
      capabilities: {
        maxMessageSize: 1024 * 1024,
        compression: true,
        encryption: true
      }
    };
  }

  private getPreviousRooms(connection: WebSocketConnection): string[] {
    // 在实际实现中，这里应该从持久化存储中获取用户之前加入的房间
    // 这里返回空数组作为示例
    return [];
  }

  private recordConnectionMetrics(connection: WebSocketConnection, event: string, reason?: string): void {
    // 记录连接相关的指标
    this.logger.debug('Recording connection metrics', {
      connectionId: connection.id,
      userId: connection.user?.id,
      event,
      reason,
      timestamp: new Date().toISOString()
    });
  }

  private recordErrorMetrics(connection: WebSocketConnection, error: Error): void {
    // 记录错误指标
    this.logger.debug('Recording error metrics', {
      connectionId: connection.id,
      userId: connection.user?.id,
      errorType: error.name,
      errorMessage: error.message
    });
  }

  private recordReconnectAttempt(connection: WebSocketConnection, attempt: number): void {
    // 记录重连尝试指标
    this.logger.debug('Recording reconnect attempt', {
      connectionId: connection.id,
      userId: connection.user?.id,
      attempt
    });
  }

  private recordReconnectFailure(connection: WebSocketConnection, attempts: number): void {
    // 记录重连失败指标
    this.logger.debug('Recording reconnect failure', {
      connectionId: connection.id,
      userId: connection.user?.id,
      totalAttempts: attempts
    });
  }

  // 公共方法
  public onConnection(callback: (connection: WebSocketConnection) => void): void {
    this.eventEmitter.on(WebSocketEvent.CONNECTION, callback);
  }

  public onDisconnect(callback: (connection: WebSocketConnection, reason?: string) => void): void {
    this.eventEmitter.on(WebSocketEvent.DISCONNECT, callback);
  }

  public onAuthenticated(callback: (connection: WebSocketConnection, user: User) => void): void {
    this.eventEmitter.on('authenticated', callback);
  }

  public onConnectionError(callback: (connection: WebSocketConnection, error: Error) => void): void {
    this.eventEmitter.on(WebSocketEvent.CONNECTION_ERROR, callback);
  }

  public onReconnect(callback: (connection: WebSocketConnection) => void): void {
    this.eventEmitter.on(WebSocketEvent.RECONNECT, callback);
  }

  public getEventEmitter(): WebSocketEventEmitter {
    return this.eventEmitter;
  }
}