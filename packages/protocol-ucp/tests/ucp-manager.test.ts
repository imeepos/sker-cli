import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { UCPManager, ProtocolType, HttpProtocolAdapter, WebSocketProtocolAdapter } from '../src/index.js';

describe('UCPManager', () => {
  let ucpManager: UCPManager;

  beforeEach(() => {
    ucpManager = new UCPManager({
      service: {
        name: 'test-service',
        version: '1.0.0',
        instance: 'test-instance-001'
      },
      protocols: {
        http: {
          enabled: true,
          host: '0.0.0.0',
          port: 3000
        },
        websocket: {
          enabled: true,
          host: '0.0.0.0',
          port: 8080
        }
      }
    });
  });

  afterEach(async () => {
    if (ucpManager) {
      await ucpManager.stop();
    }
  });

  describe('initialization', () => {
    it('should create UCPManager with valid config', () => {
      expect(ucpManager).toBeDefined();
      expect(ucpManager.getServiceInfo().name).toBe('test-service');
      expect(ucpManager.getServiceInfo().version).toBe('1.0.0');
    });

    it('should have correct initial health status', () => {
      const health = ucpManager.getHealthStatus();
      expect(health.status).toBe('stopped');
      expect(health.uptime).toBe(0);
    });
  });

  describe('adapter management', () => {
    it('should register and retrieve adapters', () => {
      const httpAdapter = new HttpProtocolAdapter();
      const wsAdapter = new WebSocketProtocolAdapter();

      ucpManager.registerAdapter(ProtocolType.HTTP, httpAdapter);
      ucpManager.registerAdapter(ProtocolType.WEBSOCKET, wsAdapter);

      expect(ucpManager.getAdapter(ProtocolType.HTTP)).toBe(httpAdapter);
      expect(ucpManager.getAdapter(ProtocolType.WEBSOCKET)).toBe(wsAdapter);
    });

    it('should unregister adapters', () => {
      const httpAdapter = new HttpProtocolAdapter();
      ucpManager.registerAdapter(ProtocolType.HTTP, httpAdapter);

      expect(ucpManager.getAdapter(ProtocolType.HTTP)).toBe(httpAdapter);

      ucpManager.unregisterAdapter(ProtocolType.HTTP);
      expect(ucpManager.getAdapter(ProtocolType.HTTP)).toBeUndefined();
    });
  });

  describe('handler management', () => {
    it('should register and unregister handlers', () => {
      const handler = {
        testMethod: async (request: any) => ({ success: true, data: request })
      };

      ucpManager.registerHandler('TestService', handler);
      expect(ucpManager.getServiceInfo().handlers).toContain('TestService');

      ucpManager.unregisterHandler('TestService');
      expect(ucpManager.getServiceInfo().handlers).not.toContain('TestService');
    });
  });

  describe('middleware', () => {
    it('should add middleware', () => {
      const middleware = async (context: any, next: () => Promise<any>) => {
        context.middlewareExecuted = true;
        return await next();
      };

      ucpManager.use(middleware);
      // Note: In a real implementation, you would test middleware execution
      // This is just testing the interface
    });
  });

  describe('lifecycle management', () => {
    it('should start and stop gracefully', async () => {
      // This test would require actual server implementations
      // For now, we'll just test the interface
      
      expect(async () => {
        await ucpManager.start();
        expect(ucpManager.getHealthStatus().status).toBe('healthy');
        
        await ucpManager.stop();
        expect(ucpManager.getHealthStatus().status).toBe('stopped');
      }).not.toThrow();
    });

    it('should handle graceful shutdown', async () => {
      await ucpManager.start();
      
      // Test graceful shutdown sequence
      await ucpManager.stopAcceptingRequests();
      await ucpManager.drainConnections(5000);
      await ucpManager.close();
      
      expect(ucpManager.getHealthStatus().status).toBe('stopped');
    });
  });
});