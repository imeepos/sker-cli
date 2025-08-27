/**
 * gRPC连接池实现
 */

import { EventEmitter } from 'events';
import { PoolConfig } from '../types/grpc-types.js';

export interface Connection {
  id: string;
  target: string;
  isHealthy: boolean;
  isIdle: boolean;
  createdAt: Date;
  lastUsedAt: Date;
  requestCount: number;
  close(): Promise<void>;
  call(service: string, method: string, request: any): Promise<any>;
}

class GRPCConnection implements Connection {
  id: string;
  target: string;
  isHealthy = true;
  isIdle = true;
  createdAt: Date;
  lastUsedAt: Date;
  requestCount = 0;

  constructor(id: string, target: string) {
    this.id = id;
    this.target = target;
    this.createdAt = new Date();
    this.lastUsedAt = new Date();
  }

  async close(): Promise<void> {
    this.isHealthy = false;
    // 实现连接关闭逻辑
  }

  async call(service: string, method: string, request: any): Promise<any> {
    this.isIdle = false;
    this.lastUsedAt = new Date();
    this.requestCount++;

    try {
      // 模拟gRPC调用
      const response = await this.performCall(service, method, request);
      return response;
    } finally {
      this.isIdle = true;
    }
  }

  private async performCall(service: string, method: string, request: any): Promise<any> {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 50));
    
    return {
      success: true,
      service,
      method,
      data: request,
      connectionId: this.id
    };
  }
}

export class ConnectionPool extends EventEmitter {
  private config: PoolConfig;
  private connections = new Map<string, Connection>();
  private availableConnections: Connection[] = [];
  private isInitialized = false;
  private healthCheckInterval?: NodeJS.Timeout;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: PoolConfig) {
    super();
    this.config = config;
  }

  /**
   * 初始化连接池
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // 预热连接
      await this.warmupConnections();
      
      // 启动健康检查
      this.startHealthCheck();
      
      // 启动清理任务
      this.startCleanup();
      
      this.isInitialized = true;
      this.emit('pool:initialized');
    } catch (error) {
      this.emit('pool:error', error);
      throw error;
    }
  }

  /**
   * 获取连接
   */
  async getConnection(target?: string): Promise<Connection> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    // 尝试获取可用连接
    let connection = this.getAvailableConnection(target);
    
    if (!connection) {
      // 如果没有可用连接且未达到最大连接数，创建新连接
      if (this.connections.size < this.config.maxConnections) {
        connection = await this.createConnection(target || 'localhost:50051');
      } else {
        // 等待连接可用
        connection = await this.waitForConnection(target);
      }
    }

    this.emit('connection:acquired', { connectionId: connection.id, target: connection.target });
    return connection;
  }

  /**
   * 释放连接
   */
  releaseConnection(connection: Connection): void {
    if (connection.isHealthy) {
      this.availableConnections.push(connection);
      this.emit('connection:released', { connectionId: connection.id });
    } else {
      this.removeConnection(connection.id);
    }
  }

  /**
   * 关闭连接池
   */
  async close(): Promise<void> {
    if (!this.isInitialized) {
      return;
    }

    try {
      // 停止定时任务
      this.stopHealthCheck();
      this.stopCleanup();
      
      // 关闭所有连接
      await this.closeAllConnections();
      
      this.isInitialized = false;
      this.emit('pool:closed');
    } catch (error) {
      this.emit('pool:error', error);
      throw error;
    }
  }

  /**
   * 获取连接池状态
   */
  getStatus(): {
    totalConnections: number;
    availableConnections: number;
    activeConnections: number;
    healthyConnections: number;
  } {
    const total = this.connections.size;
    const available = this.availableConnections.length;
    const active = total - available;
    const healthy = Array.from(this.connections.values()).filter(c => c.isHealthy).length;

    return {
      totalConnections: total,
      availableConnections: available,
      activeConnections: active,
      healthyConnections: healthy
    };
  }

  /**
   * 获取活跃连接数
   */
  getActiveConnectionCount(): number {
    return this.connections.size - this.availableConnections.length;
  }

  /**
   * 预热连接
   */
  private async warmupConnections(): Promise<void> {
    const warmupPromises: Promise<Connection>[] = [];
    
    for (let i = 0; i < this.config.warmupConnections; i++) {
      warmupPromises.push(this.createConnection('localhost:50051'));
    }

    const connections = await Promise.all(warmupPromises);
    this.availableConnections.push(...connections);
  }

  /**
   * 创建新连接
   */
  private async createConnection(target: string): Promise<Connection> {
    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      const connection = new GRPCConnection(connectionId, target);
      
      // 模拟连接建立时间
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.connections.set(connectionId, connection);
      this.emit('connection:created', { connectionId, target });
      
      return connection;
    } catch (error) {
      this.emit('connection:error', { connectionId, target, error });
      throw error;
    }
  }

  /**
   * 获取可用连接
   */
  private getAvailableConnection(target?: string): Connection | null {
    if (this.availableConnections.length === 0) {
      return null;
    }

    // 如果指定了目标，尝试找到匹配的连接
    if (target) {
      const targetConnection = this.availableConnections.find(conn => conn.target === target);
      if (targetConnection) {
        this.availableConnections.splice(this.availableConnections.indexOf(targetConnection), 1);
        return targetConnection;
      }
    }

    // 根据负载均衡策略选择连接
    const connection = this.selectConnectionByPolicy();
    if (connection) {
      this.availableConnections.splice(this.availableConnections.indexOf(connection), 1);
    }
    
    return connection;
  }

  /**
   * 根据策略选择连接
   */
  private selectConnectionByPolicy(): Connection | null {
    if (this.availableConnections.length === 0) {
      return null;
    }

    switch (this.config.balancingPolicy) {
      case 'least_requests':
        return this.availableConnections.reduce((prev, current) => 
          prev.requestCount < current.requestCount ? prev : current
        );
      
      case 'round_robin':
      default:
        return this.availableConnections[0] || null;
    }
  }

  /**
   * 等待连接可用
   */
  private async waitForConnection(target?: string): Promise<Connection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection pool timeout'));
      }, this.config.connectionTimeout);

      const checkConnection = () => {
        const connection = this.getAvailableConnection(target);
        if (connection) {
          clearTimeout(timeout);
          resolve(connection);
        } else {
          setTimeout(checkConnection, 10);
        }
      };

      checkConnection();
    });
  }

  /**
   * 移除连接
   */
  private removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.close();
      this.connections.delete(connectionId);
      
      // 从可用连接列表中移除
      const index = this.availableConnections.indexOf(connection);
      if (index >= 0) {
        this.availableConnections.splice(index, 1);
      }
      
      this.emit('connection:removed', { connectionId });
    }
  }

  /**
   * 启动健康检查
   */
  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }

  /**
   * 停止健康检查
   */
  private stopHealthCheck(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = undefined;
    }
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const healthCheckPromises = Array.from(this.connections.values()).map(async (connection) => {
      try {
        // 简单的健康检查：检查连接是否响应
        await connection.call('grpc.health.v1.Health', 'Check', {});
        connection.isHealthy = true;
      } catch (error) {
        connection.isHealthy = false;
        this.emit('connection:unhealthy', { connectionId: connection.id, error });
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * 启动清理任务
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.performCleanup();
    }, 60000); // 每分钟清理一次
  }

  /**
   * 停止清理任务
   */
  private stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
  }

  /**
   * 执行清理
   */
  private performCleanup(): void {
    const now = Date.now();
    const connectionsToRemove: string[] = [];

    for (const [id, connection] of this.connections.entries()) {
      // 清理不健康的连接
      if (!connection.isHealthy) {
        connectionsToRemove.push(id);
        continue;
      }

      // 清理过期连接
      if (now - connection.createdAt.getTime() > this.config.maxConnectionAge) {
        connectionsToRemove.push(id);
        continue;
      }

      // 清理长时间空闲的连接
      if (connection.isIdle && now - connection.lastUsedAt.getTime() > this.config.maxConnectionIdle) {
        // 保持最小连接数
        if (this.connections.size > this.config.minConnections) {
          connectionsToRemove.push(id);
        }
      }
    }

    // 移除需要清理的连接
    connectionsToRemove.forEach(id => this.removeConnection(id));

    if (connectionsToRemove.length > 0) {
      this.emit('connections:cleaned', { count: connectionsToRemove.length });
    }
  }

  /**
   * 关闭所有连接
   */
  private async closeAllConnections(): Promise<void> {
    const closePromises = Array.from(this.connections.values()).map(connection => 
      connection.close()
    );

    await Promise.allSettled(closePromises);
    
    this.connections.clear();
    this.availableConnections.length = 0;
  }
}