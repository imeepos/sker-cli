/**
 * @sker/protocol-websocket - 连接管理器
 */

import { EventEmitter } from 'events';
import { generateUUID } from '@sker/utils';
import { Logger } from '@sker/logger';
import { 
  WebSocketConnection, 
  ConnectionInfo, 
  User, 
  WebSocketState, 
  ConnectionMetrics,
  ConnectionConfig 
} from '../types/websocket-types.js';
import { WebSocketEvent, WebSocketCloseCode } from '../constants/websocket-constants.js';

export class ConnectionManager extends EventEmitter {
  private connections: Map<string, WebSocketConnection> = new Map();
  private userConnections: Map<string, Set<string>> = new Map();
  private ipConnections: Map<string, Set<string>> = new Map();
  private logger: Logger;
  private config: ConnectionConfig;
  private metrics: ConnectionMetrics;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: ConnectionConfig = {}, logger?: Logger) {
    super();
    this.config = {
      maxConnections: 10000,
      maxConnectionsPerIP: 100,
      maxConnectionsPerUser: 10,
      idleTimeout: 300000,
      maxBacklog: 1000,
      windowMs: 60000,
      ...config
    };
    
    this.logger = logger || new Logger({ name: 'ConnectionManager' });
    this.metrics = this.initializeMetrics();
    this.startCleanupInterval();
  }

  private initializeMetrics(): ConnectionMetrics {
    return {
      totalConnections: 0,
      activeConnections: 0,
      connectionsByNamespace: new Map(),
      connectionsByRoom: new Map(),
      messagesPerSecond: 0,
      bytesTransferred: 0,
      errorCount: 0
    };
  }

  private startCleanupInterval() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupIdleConnections();
    }, this.config.idleTimeout! / 2);
  }

  addConnection(connection: WebSocketConnection): boolean {
    try {
      // 检查最大连接数限制
      if (this.connections.size >= this.config.maxConnections!) {
        this.logger.warn('Max connections reached', {
          current: this.connections.size,
          max: this.config.maxConnections
        });
        connection.close(WebSocketCloseCode.SERVICE_RESTART, 'Server at capacity');
        return false;
      }

      // 检查IP连接数限制
      if (!this.checkIPConnectionLimit(connection.info.ip)) {
        this.logger.warn('IP connection limit exceeded', {
          ip: connection.info.ip,
          limit: this.config.maxConnectionsPerIP
        });
        connection.close(WebSocketCloseCode.POLICY_VIOLATION, 'Too many connections from IP');
        return false;
      }

      // 检查用户连接数限制
      if (connection.user && !this.checkUserConnectionLimit(connection.user.id)) {
        this.logger.warn('User connection limit exceeded', {
          userId: connection.user.id,
          limit: this.config.maxConnectionsPerUser
        });
        connection.close(WebSocketCloseCode.POLICY_VIOLATION, 'Too many connections for user');
        return false;
      }

      // 添加连接
      this.connections.set(connection.id, connection);
      
      // 添加到IP映射
      if (!this.ipConnections.has(connection.info.ip)) {
        this.ipConnections.set(connection.info.ip, new Set());
      }
      this.ipConnections.get(connection.info.ip)!.add(connection.id);

      // 添加到用户映射
      if (connection.user) {
        if (!this.userConnections.has(connection.user.id)) {
          this.userConnections.set(connection.user.id, new Set());
        }
        this.userConnections.get(connection.user.id)!.add(connection.id);
      }

      // 设置连接事件监听
      this.setupConnectionListeners(connection);

      // 更新指标
      this.metrics.totalConnections++;
      this.metrics.activeConnections = this.connections.size;

      this.logger.info('Connection added', {
        connectionId: connection.id,
        userId: connection.user?.id,
        ip: connection.info.ip,
        activeConnections: this.connections.size
      });

      this.emit(WebSocketEvent.CONNECTION, connection);
      return true;

    } catch (error) {
      this.logger.error('Failed to add connection', { error });
      this.metrics.errorCount++;
      return false;
    }
  }

  removeConnection(connectionId: string, reason?: string): boolean {
    try {
      const connection = this.connections.get(connectionId);
      if (!connection) {
        return false;
      }

      // 从IP映射中移除
      const ipConnections = this.ipConnections.get(connection.info.ip);
      if (ipConnections) {
        ipConnections.delete(connectionId);
        if (ipConnections.size === 0) {
          this.ipConnections.delete(connection.info.ip);
        }
      }

      // 从用户映射中移除
      if (connection.user) {
        const userConnections = this.userConnections.get(connection.user.id);
        if (userConnections) {
          userConnections.delete(connectionId);
          if (userConnections.size === 0) {
            this.userConnections.delete(connection.user.id);
          }
        }
      }

      // 移除连接
      this.connections.delete(connectionId);

      // 清理连接资源
      this.cleanupConnection(connection);

      // 更新指标
      this.metrics.activeConnections = this.connections.size;

      this.logger.info('Connection removed', {
        connectionId,
        reason,
        activeConnections: this.connections.size
      });

      this.emit(WebSocketEvent.DISCONNECT, connection, reason);
      return true;

    } catch (error) {
      this.logger.error('Failed to remove connection', { connectionId, error });
      this.metrics.errorCount++;
      return false;
    }
  }

  getConnection(connectionId: string): WebSocketConnection | undefined {
    return this.connections.get(connectionId);
  }

  getUserConnections(userId: string): WebSocketConnection[] {
    const connectionIds = this.userConnections.get(userId) || new Set();
    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(Boolean) as WebSocketConnection[];
  }

  getConnectionsByIP(ip: string): WebSocketConnection[] {
    const connectionIds = this.ipConnections.get(ip) || new Set();
    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(Boolean) as WebSocketConnection[];
  }

  getAllConnections(): WebSocketConnection[] {
    return Array.from(this.connections.values());
  }

  getActiveConnections(): WebSocketConnection[] {
    return this.getAllConnections().filter(conn => conn.state === 'OPEN');
  }

  broadcast(message: any, exclude?: string[]): void {
    const excludeSet = new Set(exclude || []);
    const activeConnections = this.getActiveConnections();
    
    this.logger.debug('Broadcasting message', {
      type: message.type,
      recipients: activeConnections.length - excludeSet.size,
      excluded: excludeSet.size
    });

    const promises = activeConnections
      .filter(conn => !excludeSet.has(conn.id))
      .map(conn => this.sendToConnection(conn, message));

    Promise.allSettled(promises).then(results => {
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        this.logger.warn('Some broadcast messages failed', { failed });
      }
    });
  }

  broadcastToUsers(userIds: string[], message: any, exclude?: string[]): void {
    const excludeSet = new Set(exclude || []);
    const connections = userIds
      .flatMap(userId => this.getUserConnections(userId))
      .filter(conn => conn.state === 'OPEN' && !excludeSet.has(conn.id));

    this.logger.debug('Broadcasting to users', {
      type: message.type,
      userIds: userIds.length,
      connections: connections.length
    });

    const promises = connections.map(conn => this.sendToConnection(conn, message));
    
    Promise.allSettled(promises).then(results => {
      const failed = results.filter(r => r.status === 'rejected').length;
      if (failed > 0) {
        this.logger.warn('Some user broadcast messages failed', { failed });
      }
    });
  }

  private async sendToConnection(connection: WebSocketConnection, message: any): Promise<void> {
    try {
      await connection.send(message);
    } catch (error) {
      this.logger.error('Failed to send message to connection', {
        connectionId: connection.id,
        error
      });
      this.metrics.errorCount++;
      throw error;
    }
  }

  private checkIPConnectionLimit(ip: string): boolean {
    const ipConnections = this.ipConnections.get(ip);
    return !ipConnections || ipConnections.size < this.config.maxConnectionsPerIP!;
  }

  private checkUserConnectionLimit(userId: string): boolean {
    const userConnections = this.userConnections.get(userId);
    return !userConnections || userConnections.size < this.config.maxConnectionsPerUser!;
  }

  private setupConnectionListeners(connection: WebSocketConnection): void {
    // 监听连接状态变化
    connection.on('stateChanged', (oldState: WebSocketState, newState: WebSocketState) => {
      this.logger.debug('Connection state changed', {
        connectionId: connection.id,
        oldState,
        newState
      });
    });

    // 监听连接错误
    connection.on('error', (error: Error) => {
      this.logger.error('Connection error', {
        connectionId: connection.id,
        userId: connection.user?.id,
        error: error.message
      });
      this.metrics.errorCount++;
    });

    // 监听消息
    connection.on('message', (data: any) => {
      this.metrics.messagesPerSecond++;
      this.updateLastActivity(connection);
    });

    // 监听ping/pong
    connection.on('ping', () => {
      this.updateLastActivity(connection);
    });

    connection.on('pong', () => {
      this.updateLastActivity(connection);
      connection.info.lastPongAt = new Date();
    });
  }

  private updateLastActivity(connection: WebSocketConnection): void {
    connection.user!.lastActiveAt = new Date();
  }

  private cleanupConnection(connection: WebSocketConnection): void {
    try {
      // 移除所有事件监听器
      connection.removeAllListeners();
      
      // 确保连接关闭
      if (connection.state === 'OPEN') {
        connection.close(WebSocketCloseCode.NORMAL_CLOSURE, 'Connection cleanup');
      }
    } catch (error) {
      this.logger.error('Error during connection cleanup', {
        connectionId: connection.id,
        error
      });
    }
  }

  private cleanupIdleConnections(): void {
    const now = new Date();
    const idleTimeout = this.config.idleTimeout!;
    const idleConnections: string[] = [];

    for (const [connectionId, connection] of this.connections) {
      const lastActivity = connection.user?.lastActiveAt || connection.info.connectedAt;
      if (now.getTime() - lastActivity.getTime() > idleTimeout) {
        idleConnections.push(connectionId);
      }
    }

    if (idleConnections.length > 0) {
      this.logger.info('Cleaning up idle connections', {
        count: idleConnections.length,
        timeout: idleTimeout
      });

      for (const connectionId of idleConnections) {
        const connection = this.connections.get(connectionId);
        if (connection) {
          connection.close(WebSocketCloseCode.POLICY_VIOLATION, 'Idle timeout');
          this.removeConnection(connectionId, 'idle timeout');
        }
      }
    }
  }

  getMetrics(): ConnectionMetrics {
    return {
      ...this.metrics,
      activeConnections: this.connections.size
    };
  }

  getConnectionCount(): number {
    return this.connections.size;
  }

  getConnectionCountByIP(ip: string): number {
    return this.ipConnections.get(ip)?.size || 0;
  }

  getConnectionCountByUser(userId: string): number {
    return this.userConnections.get(userId)?.size || 0;
  }

  async shutdown(timeout: number = 30000): Promise<void> {
    this.logger.info('Shutting down connection manager', {
      activeConnections: this.connections.size,
      timeout
    });

    // 清理定时器
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    // 关闭所有连接
    const connections = Array.from(this.connections.values());
    const closePromises = connections.map(async (connection) => {
      try {
        connection.close(WebSocketCloseCode.GOING_AWAY, 'Server shutdown');
        this.removeConnection(connection.id, 'server shutdown');
      } catch (error) {
        this.logger.error('Error closing connection during shutdown', {
          connectionId: connection.id,
          error
        });
      }
    });

    // 等待所有连接关闭或超时
    try {
      await Promise.race([
        Promise.allSettled(closePromises),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Shutdown timeout')), timeout)
        )
      ]);
    } catch (error) {
      this.logger.warn('Shutdown timeout reached', { timeout });
    }

    // 清理所有映射
    this.connections.clear();
    this.userConnections.clear();
    this.ipConnections.clear();

    this.logger.info('Connection manager shutdown complete');
  }
}