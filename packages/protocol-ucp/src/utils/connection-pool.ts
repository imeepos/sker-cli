import { EventEmitter } from 'events';
/**
 * 连接池配置接口
 */
export interface PoolConfig {
  maxConnectionsPerTarget: number;
  minConnections?: number;
  idleTimeout: number;
  acquireTimeout?: number;
  retryInterval?: number;
  maxRetries?: number;
  validation?: {
    enabled: boolean;
    interval: number;
    timeout?: number;
  };
  loadBalancing?: {
    strategy: 'round_robin' | 'least_connections' | 'random' | 'least_latency';
    healthCheck?: boolean;
  };
}

/**
 * 连接池统计信息
 */
export interface PoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  pendingAcquisitions: number;
  acquisitionsSucceeded: number;
  acquisitionsFailed: number;
  connectionsCreated: number;
  connectionsDestroyed: number;
  validationErrors: number;
}

/**
 * 可池化的连接接口
 */
interface PoolableConnection {
  disconnect(): Promise<void>;
  ping?(): Promise<number>;
}

/**
 * 连接包装器
 */
interface PooledConnection {
  connection: PoolableConnection;
  endpoint: string;
  created: number;
  lastUsed: number;
  inUse: boolean;
  validated: number;
  useCount: number;
}

/**
 * 连接池实现
 */
export class ConnectionPoolManager extends EventEmitter {
  public readonly maxConnections: number;
  private readonly config: PoolConfig;
  private readonly pools: Map<string, PooledConnection[]> = new Map();
  private readonly pendingAcquisitions: Map<string, Array<{
    resolve: (connection: any) => void;
    reject: (error: Error) => void;
    timeout: NodeJS.Timeout;
  }>> = new Map();
  
  private stats: PoolStats = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    pendingAcquisitions: 0,
    acquisitionsSucceeded: 0,
    acquisitionsFailed: 0,
    connectionsCreated: 0,
    connectionsDestroyed: 0,
    validationErrors: 0
  };
  
  private validationTimer?: NodeJS.Timeout;
  private cleanupTimer?: NodeJS.Timeout;
  private roundRobinCounters: Map<string, number> = new Map();
  
  constructor(config: PoolConfig) {
    super();
    this.config = config;
    this.maxConnections = config.maxConnectionsPerTarget;
    
    this.startValidationTimer();
    this.startCleanupTimer();
  }
  
  get activeConnections(): number {
    return this.stats.activeConnections;
  }
  
  get idleConnections(): number {
    return this.stats.idleConnections;
  }
  
  async acquire(endpoint: string): Promise<PoolableConnection> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.removePendingAcquisition(endpoint, resolve);
        this.stats.acquisitionsFailed++;
        reject(new Error(`Connection acquisition timeout for ${endpoint}`));
      }, this.config.acquireTimeout || 30000);
      
      this.addPendingAcquisition(endpoint, { resolve, reject, timeout });
      this.processAcquisition(endpoint);
    });
  }
  
  async release(connection: PoolableConnection): Promise<void> {
    const pooledConnection = this.findPooledConnection(connection);
    if (!pooledConnection) {
      throw new Error('Connection not found in pool');
    }
    
    pooledConnection.inUse = false;
    pooledConnection.lastUsed = Date.now();
    pooledConnection.useCount++;
    
    this.updateStats();
    this.emit('release', connection);
    
    // 处理等待的获取请求
    const endpoint = pooledConnection.endpoint;
    this.processAcquisition(endpoint);
  }
  
  async drain(): Promise<void> {
    // 等待所有活动连接返回
    const maxWaitTime = 30000; // 30秒
    const startTime = Date.now();
    
    while (this.stats.activeConnections > 0 && Date.now() - startTime < maxWaitTime) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 强制关闭剩余连接
    for (const pool of this.pools.values()) {
      for (const pooledConnection of pool) {
        if (pooledConnection.inUse) {
          await this.destroyConnection(pooledConnection);
        }
      }
    }
  }
  
  async clear(): Promise<void> {
    // 拒绝所有等待的获取请求
    for (const [endpoint, requests] of this.pendingAcquisitions) {
      for (const request of requests) {
        clearTimeout(request.timeout);
        request.reject(new Error('Pool cleared'));
      }
    }
    this.pendingAcquisitions.clear();
    
    // 关闭所有连接
    const destroyPromises: Promise<void>[] = [];
    for (const pool of this.pools.values()) {
      for (const pooledConnection of pool) {
        destroyPromises.push(this.destroyConnection(pooledConnection));
      }
    }
    
    await Promise.all(destroyPromises);
    this.pools.clear();
    this.updateStats();
  }
  
  getStats(): PoolStats {
    return { ...this.stats };
  }
  
  getPoolInfo(endpoint?: string): any {
    if (endpoint) {
      const pool = this.pools.get(endpoint) || [];
      return {
        endpoint,
        total: pool.length,
        active: pool.filter(c => c.inUse).length,
        idle: pool.filter(c => !c.inUse).length,
        connections: pool.map(c => ({
          created: c.created,
          lastUsed: c.lastUsed,
          inUse: c.inUse,
          useCount: c.useCount
        }))
      };
    }
    
    const pools: any[] = [];
    for (const [endpoint, pool] of this.pools) {
      pools.push({
        endpoint,
        total: pool.length,
        active: pool.filter(c => c.inUse).length,
        idle: pool.filter(c => !c.inUse).length
      });
    }
    
    return pools;
  }
  
  private async processAcquisition(endpoint: string): Promise<void> {
    const pending = this.pendingAcquisitions.get(endpoint);
    if (!pending || pending.length === 0) {
      return;
    }
    
    const pool = this.pools.get(endpoint) || [];
    
    // 尝试获取空闲连接
    const idleConnection = this.getIdleConnection(pool);
    if (idleConnection) {
      const request = pending.shift()!;
      clearTimeout(request.timeout);
      
      idleConnection.inUse = true;
      idleConnection.lastUsed = Date.now();
      
      this.stats.acquisitionsSucceeded++;
      this.updateStats();
      this.emit('acquire', idleConnection.connection);
      
      request.resolve(idleConnection.connection);
      return;
    }
    
    // 如果池未满，创建新连接
    if (pool.length < this.maxConnections) {
      try {
        const connection = await this.createConnection(endpoint);
        const pooledConnection: PooledConnection = {
          connection,
          endpoint,
          created: Date.now(),
          lastUsed: Date.now(),
          inUse: true,
          validated: Date.now(),
          useCount: 0
        };
        
        pool.push(pooledConnection);
        this.pools.set(endpoint, pool);
        
        const request = pending.shift()!;
        clearTimeout(request.timeout);
        
        this.stats.connectionsCreated++;
        this.stats.acquisitionsSucceeded++;
        this.updateStats();
        this.emit('acquire', connection);
        
        request.resolve(connection);
        
      } catch (error) {
        const request = pending.shift()!;
        clearTimeout(request.timeout);
        
        this.stats.acquisitionsFailed++;
        request.reject(error as Error);
      }
    }
  }
  
  private getIdleConnection(pool: PooledConnection[]): PooledConnection | null {
    const idleConnections = pool.filter(c => !c.inUse);
    
    if (idleConnections.length === 0) {
      return null;
    }
    
    // 根据负载均衡策略选择连接
    const strategy = this.config.loadBalancing?.strategy || 'least_connections';
    
    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(idleConnections);
      case 'least_connections':
        return this.selectLeastConnections(idleConnections);
      case 'random':
        return idleConnections[Math.floor(Math.random() * idleConnections.length)]!;
      case 'least_latency':
        return this.selectLeastLatency(idleConnections);
      default:
        return idleConnections[0]!;
    }
  }
  
  private selectRoundRobin(connections: PooledConnection[]): PooledConnection {
    const endpoint = connections[0]!.endpoint;
    const counter = this.roundRobinCounters.get(endpoint) || 0;
    const selected = connections[counter % connections.length]!;
    this.roundRobinCounters.set(endpoint, counter + 1);
    return selected;
  }
  
  private selectLeastConnections(connections: PooledConnection[]): PooledConnection {
    return connections.reduce((least, current) => 
      current.useCount < least.useCount ? current : least
    );
  }
  
  private selectLeastLatency(connections: PooledConnection[]): PooledConnection {
    // 简化实现：选择最近使用的连接（假设它延迟最低）
    return connections.reduce((latest, current) =>
      current.lastUsed > latest.lastUsed ? current : latest
    );
  }
  
  private async createConnection(endpoint: string): Promise<PoolableConnection> {
    // 这里应该根据协议类型创建相应的连接
    // 当前返回一个模拟连接
    return {
      disconnect: async () => {},
      ping: async () => 10
    };
  }
  
  private findPooledConnection(connection: PoolableConnection): PooledConnection | null {
    for (const pool of this.pools.values()) {
      const found = pool.find(pc => pc.connection === connection);
      if (found) {
        return found;
      }
    }
    return null;
  }
  
  private async destroyConnection(pooledConnection: PooledConnection): Promise<void> {
    try {
      await pooledConnection.connection.disconnect();
    } catch (error) {
      // 忽略断开连接时的错误
    }
    
    this.stats.connectionsDestroyed++;
    this.removeFromPool(pooledConnection);
  }
  
  private removeFromPool(pooledConnection: PooledConnection): void {
    const pool = this.pools.get(pooledConnection.endpoint);
    if (pool) {
      const index = pool.indexOf(pooledConnection);
      if (index !== -1) {
        pool.splice(index, 1);
        if (pool.length === 0) {
          this.pools.delete(pooledConnection.endpoint);
        }
      }
    }
  }
  
  private addPendingAcquisition(endpoint: string, request: any): void {
    const pending = this.pendingAcquisitions.get(endpoint) || [];
    pending.push(request);
    this.pendingAcquisitions.set(endpoint, pending);
    this.stats.pendingAcquisitions++;
  }
  
  private removePendingAcquisition(endpoint: string, resolve: Function): void {
    const pending = this.pendingAcquisitions.get(endpoint);
    if (pending) {
      const index = pending.findIndex(r => r.resolve === resolve);
      if (index !== -1) {
        pending.splice(index, 1);
        this.stats.pendingAcquisitions--;
        if (pending.length === 0) {
          this.pendingAcquisitions.delete(endpoint);
        }
      }
    }
  }
  
  private updateStats(): void {
    let totalConnections = 0;
    let activeConnections = 0;
    let idleConnections = 0;
    
    for (const pool of this.pools.values()) {
      totalConnections += pool.length;
      activeConnections += pool.filter(c => c.inUse).length;
      idleConnections += pool.filter(c => !c.inUse).length;
    }
    
    this.stats.totalConnections = totalConnections;
    this.stats.activeConnections = activeConnections;
    this.stats.idleConnections = idleConnections;
  }
  
  private startValidationTimer(): void {
    if (!this.config.validation?.enabled) {
      return;
    }
    
    const interval = this.config.validation.interval;
    this.validationTimer = setInterval(() => {
      this.validateConnections();
    }, interval);
  }
  
  private async validateConnections(): Promise<void> {
    const now = Date.now();
    const validationTimeout = this.config.validation?.timeout || 5000;
    
    for (const [endpoint, pool] of this.pools) {
      const connectionsToValidate = pool.filter(
        pc => !pc.inUse && now - pc.validated > this.config.validation!.interval
      );
      
      for (const pooledConnection of connectionsToValidate) {
        try {
          if (pooledConnection.connection.ping) {
            const startTime = Date.now();
            await Promise.race([
              pooledConnection.connection.ping(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Validation timeout')), validationTimeout)
              )
            ]);
            
            pooledConnection.validated = Date.now();
          }
        } catch (error) {
          this.stats.validationErrors++;
          await this.destroyConnection(pooledConnection);
        }
      }
    }
  }
  
  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupIdleConnections();
    }, 60000); // 每分钟清理一次
  }
  
  private async cleanupIdleConnections(): Promise<void> {
    const now = Date.now();
    const idleTimeout = this.config.idleTimeout;
    const minConnections = this.config.minConnections || 0;
    
    for (const [endpoint, pool] of this.pools) {
      const idleConnections = pool.filter(pc => !pc.inUse);
      const expiredConnections = idleConnections.filter(
        pc => now - pc.lastUsed > idleTimeout
      );
      
      // 保持最小连接数
      const connectionsToRemove = expiredConnections.slice(
        0, Math.max(0, pool.length - minConnections)
      );
      
      for (const pooledConnection of connectionsToRemove) {
        await this.destroyConnection(pooledConnection);
      }
    }
    
    this.updateStats();
  }
  
  private generateId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  destroy(): void {
    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }
    
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.clear();
  }
}