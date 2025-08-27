import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConnectionPoolManager, PoolConfig } from '../src/index.js';

describe('ConnectionPoolManager', () => {
  let poolManager: ConnectionPoolManager;
  let config: PoolConfig;

  beforeEach(() => {
    config = {
      maxConnectionsPerTarget: 5,
      minConnections: 1,
      idleTimeout: 30000,
      acquireTimeout: 10000,
      validation: {
        enabled: true,
        interval: 60000,
        timeout: 5000
      },
      loadBalancing: {
        strategy: 'round_robin',
        healthCheck: true
      }
    };

    poolManager = new ConnectionPoolManager(config);
  });

  afterEach(async () => {
    if (poolManager) {
      await poolManager.clear();
      poolManager.destroy();
    }
  });

  describe('initialization', () => {
    it('should create pool manager with correct config', () => {
      expect(poolManager.maxConnections).toBe(5);
      expect(poolManager.activeConnections).toBe(0);
      expect(poolManager.idleConnections).toBe(0);
    });

    it('should provide initial stats', () => {
      const stats = poolManager.getStats();
      expect(stats.totalConnections).toBe(0);
      expect(stats.activeConnections).toBe(0);
      expect(stats.idleConnections).toBe(0);
      expect(stats.pendingAcquisitions).toBe(0);
    });
  });

  describe('connection acquisition', () => {
    it('should acquire and release connections', async () => {
      const endpoint = 'http://localhost:3000';
      
      // Mock connection creation for testing
      vi.spyOn(poolManager as any, 'createConnection').mockResolvedValue({
        id: 'mock-conn-1',
        endpoint,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: () => true,
        ping: vi.fn().mockResolvedValue(10)
      });

      const connection = await poolManager.acquire(endpoint);
      expect(connection).toBeDefined();
      expect(connection.endpoint).toBe(endpoint);
      expect(poolManager.activeConnections).toBe(1);

      await poolManager.release(connection);
      expect(poolManager.activeConnections).toBe(0);
      expect(poolManager.idleConnections).toBe(1);
    });

    it('should reuse idle connections', async () => {
      const endpoint = 'http://localhost:3000';
      
      const mockConnection = {
        id: 'mock-conn-1',
        endpoint,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: () => true,
        ping: vi.fn().mockResolvedValue(10)
      };

      vi.spyOn(poolManager as any, 'createConnection').mockResolvedValue(mockConnection);

      // Acquire and release connection
      const connection1 = await poolManager.acquire(endpoint);
      await poolManager.release(connection1);

      // Acquire again - should reuse the same connection
      const connection2 = await poolManager.acquire(endpoint);
      expect(connection2).toBe(connection1);

      await poolManager.release(connection2);
    });

    it('should handle connection pool limits', async () => {
      const endpoint = 'http://localhost:3000';
      const mockConnections: any[] = [];

      vi.spyOn(poolManager as any, 'createConnection').mockImplementation(() => {
        const conn = {
          id: `mock-conn-${mockConnections.length + 1}`,
          endpoint,
          connect: vi.fn(),
          disconnect: vi.fn(),
          isConnected: () => true,
          ping: vi.fn().mockResolvedValue(10)
        };
        mockConnections.push(conn);
        return Promise.resolve(conn);
      });

      // Acquire maximum connections
      const connections = [];
      for (let i = 0; i < config.maxConnectionsPerTarget; i++) {
        connections.push(await poolManager.acquire(endpoint));
      }

      expect(poolManager.activeConnections).toBe(config.maxConnectionsPerTarget);

      // Clean up
      for (const conn of connections) {
        await poolManager.release(conn);
      }
    });

    it('should timeout acquisition when pool is exhausted', async () => {
      const endpoint = 'http://localhost:3000';
      const fastConfig = { ...config, acquireTimeout: 100 };
      const fastPool = new ConnectionPoolManager(fastConfig);

      try {
        vi.spyOn(fastPool as any, 'createConnection').mockImplementation(() => 
          new Promise(resolve => setTimeout(resolve, 200)) // Delay longer than timeout
        );

        await expect(fastPool.acquire(endpoint)).rejects.toThrow('Connection acquisition timeout');
      } finally {
        await fastPool.clear();
        fastPool.destroy();
      }
    });
  });

  describe('load balancing', () => {
    it('should distribute connections using round robin', async () => {
      const endpoint = 'http://localhost:3000';
      const mockConnections: any[] = [];

      vi.spyOn(poolManager as any, 'createConnection').mockImplementation(() => {
        const conn = {
          id: `mock-conn-${mockConnections.length + 1}`,
          endpoint,
          connect: vi.fn(),
          disconnect: vi.fn(),
          isConnected: () => true,
          ping: vi.fn().mockResolvedValue(10)
        };
        mockConnections.push(conn);
        return Promise.resolve(conn);
      });

      // Create multiple connections and release them
      const connections = [];
      for (let i = 0; i < 3; i++) {
        connections.push(await poolManager.acquire(endpoint));
      }

      for (const conn of connections) {
        await poolManager.release(conn);
      }

      // Now acquire again - should use round robin
      const conn1 = await poolManager.acquire(endpoint);
      await poolManager.release(conn1);
      
      const conn2 = await poolManager.acquire(endpoint);
      await poolManager.release(conn2);

      // Connections should be different (round robin)
      expect(conn1.id).not.toBe(conn2.id);
    });
  });

  describe('pool management', () => {
    it('should provide pool information', () => {
      const endpoint = 'http://localhost:3000';
      const poolInfo = poolManager.getPoolInfo(endpoint);
      
      expect(poolInfo.endpoint).toBe(endpoint);
      expect(poolInfo.total).toBe(0);
      expect(poolInfo.active).toBe(0);
      expect(poolInfo.idle).toBe(0);
    });

    it('should list all pools', async () => {
      const endpoint1 = 'http://localhost:3000';
      const endpoint2 = 'http://localhost:4000';

      vi.spyOn(poolManager as any, 'createConnection').mockImplementation((ep: string) => 
        Promise.resolve({
          id: `mock-conn-${ep}`,
          endpoint: ep,
          connect: vi.fn(),
          disconnect: vi.fn(),
          isConnected: () => true,
          ping: vi.fn().mockResolvedValue(10)
        })
      );

      const conn1 = await poolManager.acquire(endpoint1);
      const conn2 = await poolManager.acquire(endpoint2);

      const allPools = poolManager.getPoolInfo();
      expect(allPools).toHaveLength(2);
      expect(allPools.map((p: any) => p.endpoint)).toContain(endpoint1);
      expect(allPools.map((p: any) => p.endpoint)).toContain(endpoint2);

      await poolManager.release(conn1);
      await poolManager.release(conn2);
    });

    it('should drain all connections', async () => {
      const endpoint = 'http://localhost:3000';

      vi.spyOn(poolManager as any, 'createConnection').mockResolvedValue({
        id: 'mock-conn-1',
        endpoint,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: () => true,
        ping: vi.fn().mockResolvedValue(10)
      });

      const connection = await poolManager.acquire(endpoint);
      await poolManager.release(connection);

      expect(poolManager.idleConnections).toBe(1);

      await poolManager.drain();
      // Drain should wait for active connections to be released
      // Idle connections should remain until clear is called
    });

    it('should clear all connections', async () => {
      const endpoint = 'http://localhost:3000';

      vi.spyOn(poolManager as any, 'createConnection').mockResolvedValue({
        id: 'mock-conn-1',
        endpoint,
        connect: vi.fn(),
        disconnect: vi.fn(),
        isConnected: () => true,
        ping: vi.fn().mockResolvedValue(10)
      });

      const connection = await poolManager.acquire(endpoint);
      await poolManager.release(connection);

      expect(poolManager.idleConnections).toBe(1);

      await poolManager.clear();
      expect(poolManager.idleConnections).toBe(0);
      expect(poolManager.activeConnections).toBe(0);
    });
  });
});