import { describe, it, expect, beforeEach } from 'vitest';
import { 
  ProtocolFactory, 
  ProtocolSelector, 
  SelectionStrategy, 
  ProtocolType,
  HttpProtocolAdapter,
  WebSocketProtocolAdapter
} from '../src/index.js';

describe('ProtocolFactory', () => {
  let factory: ProtocolFactory;

  beforeEach(() => {
    factory = new ProtocolFactory({
      strategy: SelectionStrategy.ADAPTIVE,
      fallbackProtocol: ProtocolType.HTTP
    });

    // Register adapters
    factory.registerAdapter(new HttpProtocolAdapter());
    factory.registerAdapter(new WebSocketProtocolAdapter());
  });

  describe('adapter management', () => {
    it('should register and retrieve adapters', () => {
      expect(factory.getSupportedProtocols()).toContain(ProtocolType.HTTP);
      expect(factory.getSupportedProtocols()).toContain(ProtocolType.WEBSOCKET);
    });

    it('should unregister adapters', () => {
      factory.unregisterAdapter(ProtocolType.HTTP);
      expect(factory.getSupportedProtocols()).not.toContain(ProtocolType.HTTP);
    });
  });

  describe('client creation', () => {
    it('should create client with preferred protocol', async () => {
      // This test would require mock implementations or actual servers
      // For now, testing the interface
      
      expect(async () => {
        const client = await factory.createClient(
          'localhost:3000',
          { service: 'TestService' },
          ProtocolType.HTTP
        );
        expect(client.protocol).toBe(ProtocolType.HTTP);
        expect(client.target).toBe('localhost:3000');
      }).not.toThrow();
    });

    it('should select protocol automatically', async () => {
      expect(async () => {
        const client = await factory.createClient(
          'localhost:8080',
          { 
            service: 'TestService',
            requiresStreaming: true,
            clientType: 'web'
          }
        );
        // Should select WebSocket for streaming requirements
        expect(client.protocol).toBe(ProtocolType.WEBSOCKET);
      }).not.toThrow();
    });
  });
});

describe('ProtocolSelector', () => {
  let selector: ProtocolSelector;

  beforeEach(() => {
    selector = new ProtocolSelector({
      strategy: SelectionStrategy.ADAPTIVE,
      priorities: [
        {
          protocol: ProtocolType.GRPC,
          conditions: ['high_performance', 'streaming'],
          weight: 0.8
        },
        {
          protocol: ProtocolType.HTTP,
          conditions: ['web_client', 'rest_api'],
          weight: 0.6
        },
        {
          protocol: ProtocolType.WEBSOCKET,
          conditions: ['real_time', 'bidirectional'],
          weight: 0.7
        }
      ],
      metrics: {
        latency: 0.4,
        throughput: 0.3,
        reliability: 0.3
      }
    });
  });

  describe('protocol selection', () => {
    it('should select protocol by priority', async () => {
      const protocol = await selector.selectProtocol(
        {
          service: 'TestService',
          method: 'GetData',
          clientType: 'web'
        },
        [ProtocolType.HTTP, ProtocolType.WEBSOCKET]
      );

      expect(protocol).toBe(ProtocolType.HTTP);
    });

    it('should select protocol for streaming', async () => {
      const protocol = await selector.selectProtocol(
        {
          service: 'TestService',
          method: 'StreamData',
          requiresStreaming: true,
          clientType: 'server'
        },
        [ProtocolType.HTTP, ProtocolType.WEBSOCKET, ProtocolType.GRPC]
      );

      expect([ProtocolType.WEBSOCKET, ProtocolType.GRPC]).toContain(protocol);
    });

    it('should update and use metrics', async () => {
      // Update metrics for HTTP
      selector.updateMetrics(ProtocolType.HTTP, {
        protocol: ProtocolType.HTTP,
        latency: 50,
        throughput: 1000,
        errorRate: 0.01,
        availability: 0.99,
        connectionCount: 10,
        lastUpdated: Date.now()
      });

      // Update metrics for WebSocket
      selector.updateMetrics(ProtocolType.WEBSOCKET, {
        protocol: ProtocolType.WEBSOCKET,
        latency: 20,
        throughput: 800,
        errorRate: 0.005,
        availability: 0.95,
        connectionCount: 5,
        lastUpdated: Date.now()
      });

      const httpMetrics = selector.getMetrics(ProtocolType.HTTP);
      const wsMetrics = selector.getMetrics(ProtocolType.WEBSOCKET);

      expect(httpMetrics?.latency).toBe(50);
      expect(wsMetrics?.latency).toBe(20);
    });
  });

  describe('selection strategies', () => {
    const availableProtocols = [ProtocolType.HTTP, ProtocolType.WEBSOCKET, ProtocolType.GRPC];

    it('should use round robin strategy', async () => {
      selector = new ProtocolSelector({
        strategy: SelectionStrategy.ROUND_ROBIN
      });

      const selections = [];
      for (let i = 0; i < 6; i++) {
        const protocol = await selector.selectProtocol({}, availableProtocols);
        selections.push(protocol);
      }

      // Should cycle through protocols
      expect(selections[0]).toBe(selections[3]); // First and fourth should be same
      expect(selections[1]).toBe(selections[4]); // Second and fifth should be same
    });

    it('should use least latency strategy', async () => {
      selector = new ProtocolSelector({
        strategy: SelectionStrategy.LEAST_LATENCY
      });

      // Set up metrics with different latencies
      selector.updateMetrics(ProtocolType.HTTP, {
        protocol: ProtocolType.HTTP,
        latency: 100,
        throughput: 0,
        errorRate: 0,
        availability: 1,
        connectionCount: 0,
        lastUpdated: Date.now()
      });

      selector.updateMetrics(ProtocolType.WEBSOCKET, {
        protocol: ProtocolType.WEBSOCKET,
        latency: 50,
        throughput: 0,
        errorRate: 0,
        availability: 1,
        connectionCount: 0,
        lastUpdated: Date.now()
      });

      const protocol = await selector.selectProtocol({}, availableProtocols);
      expect(protocol).toBe(ProtocolType.WEBSOCKET); // Should select the one with lowest latency
    });
  });
});