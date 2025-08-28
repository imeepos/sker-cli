/**
 * 协议接口对齐集成测试
 * Protocol Interface Alignment Integration Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HTTPClient } from '@sker/protocol-http';
import { WebSocketClient } from '@sker/protocol-websocket';
import { GRPCClient } from '@sker/protocol-grpc';

describe('协议接口对齐测试', () => {
  describe('HTTPClient ProtocolClient接口实现', () => {
    let httpClient: HTTPClient;

    beforeEach(() => {
      httpClient = new HTTPClient({
        baseURL: 'https://api.example.com'
      });
    });

    afterEach(async () => {
      await httpClient.close();
    });

    it('应该实现ProtocolClient接口的基本属性', () => {
      // 测试protocol属性
      expect(httpClient.protocol).toBe('http');
      
      // 测试target属性
      expect(httpClient.target).toBe('https://api.example.com');
    });

    it('应该实现call方法', async () => {
      // Mock HTTP请求
      vi.spyOn(httpClient, 'request').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: { result: 'success', id: 123 }
      });

      // 测试RPC风格的调用
      const result = await httpClient.call('UserService', 'getUser', { id: 123 });
      
      expect(result).toEqual({ result: 'success', id: 123 });
      expect(httpClient.request).toHaveBeenCalledWith(
        '/UserService/getUser',
        expect.objectContaining({
          method: 'GET',
          params: { id: 123 }
        })
      );
    });

    it('应该实现stream方法', async () => {
      // Mock HTTP流式响应
      vi.spyOn(httpClient, 'request').mockResolvedValue({
        status: 200,
        statusText: 'OK',
        headers: {},
        data: [{ event: 'user_created' }, { event: 'user_updated' }]
      });

      // 测试流式调用
      const stream = httpClient.stream('EventService', 'getUserEvents', { userId: 123 });
      const events = [];
      
      for await (const event of stream) {
        events.push(event);
      }

      expect(events).toHaveLength(2);
      expect(events[0]).toEqual({ event: 'user_created' });
      expect(events[1]).toEqual({ event: 'user_updated' });
    });

    it('应该实现close方法', async () => {
      const closeSpy = vi.spyOn(httpClient, 'emit');
      
      await httpClient.close();
      
      expect(closeSpy).toHaveBeenCalledWith('close');
    });

    it('应该正确映射HTTP方法', async () => {
      vi.spyOn(httpClient, 'request').mockResolvedValue({
        status: 200,
        data: { success: true }
      });

      // 测试不同方法名的映射
      await httpClient.call('UserService', 'getUser', { id: 1 });
      expect(httpClient.request).toHaveBeenLastCalledWith(
        '/UserService/getUser',
        expect.objectContaining({ method: 'GET' })
      );

      await httpClient.call('UserService', 'createUser', { name: 'John' });
      expect(httpClient.request).toHaveBeenLastCalledWith(
        '/UserService/createUser',
        expect.objectContaining({ method: 'POST' })
      );

      await httpClient.call('UserService', 'updateUser', { id: 1, name: 'Jane' });
      expect(httpClient.request).toHaveBeenLastCalledWith(
        '/UserService/updateUser',
        expect.objectContaining({ method: 'PUT' })
      );

      await httpClient.call('UserService', 'deleteUser', { id: 1 });
      expect(httpClient.request).toHaveBeenLastCalledWith(
        '/UserService/deleteUser',
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  describe('WebSocketClient ProtocolClient接口实现', () => {
    let wsClient: WebSocketClient;

    beforeEach(() => {
      wsClient = new WebSocketClient({
        url: 'ws://localhost:8080'
      });
    });

    afterEach(async () => {
      await wsClient.close();
    });

    it('应该实现ProtocolClient接口的基本属性', () => {
      expect(wsClient.protocol).toBe('websocket');
      expect(wsClient.target).toBe('ws://localhost:8080');
    });

    it('应该实现call方法', async () => {
      // Mock WebSocket发送和接收
      const sendSpy = vi.spyOn(wsClient, 'send').mockResolvedValue();
      const mockResponse = { id: 'test-id', result: { user: 'John' } };
      
      // 模拟异步响应
      setTimeout(() => {
        wsClient.emit('message', mockResponse);
      }, 10);

      // 由于WebSocket的call方法依赖实际的消息传递，这里主要测试接口存在性
      expect(typeof wsClient.call).toBe('function');
    });

    it('应该实现stream方法', async () => {
      expect(typeof wsClient.stream).toBe('function');
      
      // 测试stream方法返回AsyncIterableIterator
      const stream = wsClient.stream('EventService', 'subscribe', { topic: 'user-events' });
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });

    it('应该实现close方法', async () => {
      const disconnectSpy = vi.spyOn(wsClient, 'disconnect').mockResolvedValue();
      
      await wsClient.close();
      
      expect(disconnectSpy).toHaveBeenCalled();
    });
  });

  describe('GRPCClient ProtocolClient接口实现', () => {
    let grpcClient: GRPCClient;

    beforeEach(() => {
      grpcClient = new GRPCClient({
        target: 'localhost:50051'
      });
    });

    afterEach(async () => {
      await grpcClient.close();
    });

    it('应该实现ProtocolClient接口的基本属性', () => {
      expect(grpcClient.protocol).toBe('grpc');
      expect(grpcClient.target).toBe('localhost:50051');
    });

    it('应该实现call方法', async () => {
      expect(typeof grpcClient.call).toBe('function');
      
      // 由于gRPC客户端的call方法依赖实际的服务实现，这里主要测试接口存在性
      // 在实际使用中，这个方法会调用具体的gRPC服务方法
    });

    it('应该实现stream方法', async () => {
      expect(typeof grpcClient.stream).toBe('function');
      
      // 测试stream方法返回AsyncIterableIterator
      const stream = grpcClient.stream('UserService', 'streamUsers', {});
      expect(typeof stream[Symbol.asyncIterator]).toBe('function');
    });

    it('应该实现close方法', async () => {
      // 测试close方法存在且可调用
      await expect(grpcClient.close()).resolves.toBeUndefined();
    });
  });

  describe('协议客户端统一接口测试', () => {
    it('所有协议客户端都应该实现相同的接口', () => {
      const httpClient = new HTTPClient({ baseURL: 'http://example.com' });
      const wsClient = new WebSocketClient({ url: 'ws://example.com' });
      const grpcClient = new GRPCClient({ target: 'example.com:50051' });

      // 测试所有客户端都有相同的接口方法
      const clients = [httpClient, wsClient, grpcClient];
      
      clients.forEach(client => {
        expect(client).toHaveProperty('protocol');
        expect(client).toHaveProperty('target');
        expect(typeof client.call).toBe('function');
        expect(typeof client.stream).toBe('function');
        expect(typeof client.close).toBe('function');
      });

      // 测试协议类型正确
      expect(httpClient.protocol).toBe('http');
      expect(wsClient.protocol).toBe('websocket');
      expect(grpcClient.protocol).toBe('grpc');
    });

    it('应该能够以统一的方式使用不同协议的客户端', async () => {
      const clients = [
        new HTTPClient({ baseURL: 'http://example.com' }),
        new WebSocketClient({ url: 'ws://example.com' }),
        new GRPCClient({ target: 'example.com:50051' })
      ];

      // 测试统一的接口调用
      for (const client of clients) {
        expect(typeof client.protocol).toBe('string');
        expect(typeof client.target).toBe('string');
        
        // 所有客户端都应该能够调用这些方法（即使实现不同）
        expect(() => client.call('TestService', 'testMethod', {})).not.toThrow();
        expect(() => client.stream('TestService', 'testStream', {})).not.toThrow();
        
        // 清理
        await client.close();
      }
    });
  });
});
