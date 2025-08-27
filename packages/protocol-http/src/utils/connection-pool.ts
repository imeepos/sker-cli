/**
 * @fileoverview HTTP连接池实现
 */

import http from 'http';
import https from 'https';
import { EventEmitter } from 'events';
import { ConnectionPoolConfig } from '../types/http-types.js';

export interface ConnectionInfo {
  agent: http.Agent | https.Agent;
  host: string;
  port: number;
  secure: boolean;
  activeConnections: number;
  idleConnections: number;
  totalRequests: number;
  createdAt: Date;
  lastUsed: Date;
}

/**
 * HTTP连接池类
 */
export class ConnectionPool extends EventEmitter {
  private config: ConnectionPoolConfig;
  private agents = new Map<string, ConnectionInfo>();
  private healthCheckInterval?: NodeJS.Timeout;

  constructor(config: ConnectionPoolConfig) {
    super();
    this.config = {
      warmup: { enabled: false, connections: 10, hosts: [] },
      ...config
    };
    
    if (this.config.healthCheck?.enabled) {
      this.startHealthCheck();
    }

    if (this.config.warmup?.enabled) {
      this.warmupConnections();
    }
  }

  /**
   * 获取代理实例
   */
  getAgent(url: string): http.Agent | https.Agent {
    const urlObj = new URL(url);
    const key = this.getAgentKey(urlObj.hostname, Number(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80), urlObj.protocol === 'https:');
    
    let connectionInfo = this.agents.get(key);
    
    if (!connectionInfo) {
      connectionInfo = this.createConnection(
        urlObj.hostname,
        Number(urlObj.port) || (urlObj.protocol === 'https:' ? 443 : 80),
        urlObj.protocol === 'https:'
      );
      this.agents.set(key, connectionInfo);
      this.emit('connection-created', connectionInfo);
    }
    
    connectionInfo.lastUsed = new Date();
    connectionInfo.totalRequests++;
    
    return connectionInfo.agent;
  }

  /**
   * 创建连接
   */
  private createConnection(host: string, port: number, secure: boolean): ConnectionInfo {
    const AgentClass = secure ? https.Agent : http.Agent;
    
    const agent = new AgentClass({
      keepAlive: this.config.keepAlive,
      keepAliveMsecs: this.config.keepAliveMsecs,
      maxSockets: this.config.maxConnectionsPerHost,
      maxFreeSockets: Math.floor(this.config.maxConnectionsPerHost / 2),
      timeout: this.config.connectTimeout
    });

    const connectionInfo: ConnectionInfo = {
      agent,
      host,
      port,
      secure,
      activeConnections: 0,
      idleConnections: 0,
      totalRequests: 0,
      createdAt: new Date(),
      lastUsed: new Date()
    };

    // 监听socket事件
    this.setupAgentListeners(agent, connectionInfo);
    
    return connectionInfo;
  }

  /**
   * 设置代理监听器
   */
  private setupAgentListeners(agent: http.Agent | https.Agent, connectionInfo: ConnectionInfo): void {
    agent.on('socket', (socket) => {
      connectionInfo.activeConnections++;
      this.emit('connection-active', connectionInfo);
      
      socket.on('close', () => {
        connectionInfo.activeConnections--;
        this.emit('connection-closed', connectionInfo);
      });
    });

    agent.on('free', (socket) => {
      connectionInfo.idleConnections++;
      this.emit('connection-idle', connectionInfo);
    });
  }

  /**
   * 生成代理键
   */
  private getAgentKey(host: string, port: number, secure: boolean): string {
    return `${secure ? 'https' : 'http'}://${host}:${port}`;
  }

  /**
   * 预热连接
   */
  private async warmupConnections(): Promise<void> {
    if (!this.config.warmup?.enabled || !this.config.warmup.hosts) {
      return;
    }

    const promises = this.config.warmup.hosts.map(async (host) => {
      try {
        const url = new URL(host);
        const agent = this.getAgent(host);
        
        // 创建预热连接
        for (let i = 0; i < (this.config.warmup?.connections || 10); i++) {
          const req = (url.protocol === 'https:' ? https : http).request({
            hostname: url.hostname,
            port: url.port || (url.protocol === 'https:' ? 443 : 80),
            path: '/',
            method: 'HEAD',
            agent
          });
          
          req.on('error', () => {
            // 忽略预热错误
          });
          
          req.end();
        }
      } catch (error) {
        this.emit('warmup-error', { host, error });
      }
    });

    await Promise.allSettled(promises);
    this.emit('warmup-complete');
  }

  /**
   * 开始健康检查
   */
  private startHealthCheck(): void {
    if (!this.config.healthCheck?.enabled) {
      return;
    }

    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheck.interval);
  }

  /**
   * 执行健康检查
   */
  private async performHealthCheck(): Promise<void> {
    const healthCheckPromises = Array.from(this.agents.entries()).map(async ([key, connectionInfo]) => {
      try {
        await this.checkConnection(connectionInfo);
        this.emit('health-check-success', connectionInfo);
      } catch (error) {
        this.emit('health-check-failure', { connectionInfo, error });
        // 可以选择移除不健康的连接
        // this.agents.delete(key);
      }
    });

    await Promise.allSettled(healthCheckPromises);
  }

  /**
   * 检查连接健康状态
   */
  private async checkConnection(connectionInfo: ConnectionInfo): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = this.config.healthCheck?.timeout || 5000;
      const path = this.config.healthCheck?.path || '/';
      
      const requestModule = connectionInfo.secure ? https : http;
      const req = requestModule.request({
        hostname: connectionInfo.host,
        port: connectionInfo.port,
        path,
        method: 'HEAD',
        agent: connectionInfo.agent,
        timeout
      });

      req.on('response', () => {
        resolve();
      });

      req.on('error', reject);
      req.on('timeout', () => {
        reject(new Error('Health check timeout'));
      });

      req.end();
    });
  }

  /**
   * 清理空闲连接
   */
  cleanupIdleConnections(): void {
    const now = Date.now();
    const maxIdleTime = this.config.maxIdleTime;

    for (const [key, connectionInfo] of this.agents.entries()) {
      const idleTime = now - connectionInfo.lastUsed.getTime();
      
      if (idleTime > maxIdleTime && connectionInfo.activeConnections === 0) {
        connectionInfo.agent.destroy();
        this.agents.delete(key);
        this.emit('connection-cleanup', connectionInfo);
      }
    }
  }

  /**
   * 获取连接池统计信息
   */
  getStats(): ConnectionPoolStats {
    const stats: ConnectionPoolStats = {
      totalConnections: this.agents.size,
      activeConnections: 0,
      idleConnections: 0,
      totalRequests: 0,
      connections: []
    };

    for (const connectionInfo of this.agents.values()) {
      stats.activeConnections += connectionInfo.activeConnections;
      stats.idleConnections += connectionInfo.idleConnections;
      stats.totalRequests += connectionInfo.totalRequests;
      
      stats.connections.push({
        host: connectionInfo.host,
        port: connectionInfo.port,
        secure: connectionInfo.secure,
        activeConnections: connectionInfo.activeConnections,
        idleConnections: connectionInfo.idleConnections,
        totalRequests: connectionInfo.totalRequests,
        createdAt: connectionInfo.createdAt,
        lastUsed: connectionInfo.lastUsed
      });
    }

    return stats;
  }

  /**
   * 销毁连接池
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    for (const connectionInfo of this.agents.values()) {
      connectionInfo.agent.destroy();
    }

    this.agents.clear();
    this.emit('destroyed');
  }

  /**
   * 获取特定主机的连接信息
   */
  getConnectionInfo(host: string, port: number, secure: boolean): ConnectionInfo | undefined {
    const key = this.getAgentKey(host, port, secure);
    return this.agents.get(key);
  }

  /**
   * 强制关闭连接
   */
  closeConnection(host: string, port: number, secure: boolean): boolean {
    const key = this.getAgentKey(host, port, secure);
    const connectionInfo = this.agents.get(key);
    
    if (connectionInfo) {
      connectionInfo.agent.destroy();
      this.agents.delete(key);
      this.emit('connection-forced-close', connectionInfo);
      return true;
    }
    
    return false;
  }
}

/**
 * 连接池统计信息
 */
export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalRequests: number;
  connections: Array<{
    host: string;
    port: number;
    secure: boolean;
    activeConnections: number;
    idleConnections: number;
    totalRequests: number;
    createdAt: Date;
    lastUsed: Date;
  }>;
}

/**
 * 全局连接池实例
 */
let globalConnectionPool: ConnectionPool | null = null;

/**
 * 获取全局连接池
 */
export function getGlobalConnectionPool(): ConnectionPool {
  if (!globalConnectionPool) {
    globalConnectionPool = new ConnectionPool({
      maxConnections: 200,
      maxConnectionsPerHost: 50,
      keepAlive: true,
      keepAliveMsecs: 30000,
      maxIdleTime: 60000,
      connectTimeout: 10000,
      socketTimeout: 30000,
      reuseConnections: true,
      healthCheck: {
        enabled: true,
        interval: 30000,
        timeout: 5000,
        path: '/health'
      }
    });
  }
  
  return globalConnectionPool;
}

/**
 * 设置全局连接池
 */
export function setGlobalConnectionPool(pool: ConnectionPool): void {
  if (globalConnectionPool) {
    globalConnectionPool.destroy();
  }
  globalConnectionPool = pool;
}