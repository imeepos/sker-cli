/**
 * 集成测试专用设置
 * Integration test specific setup
 */

import { vi } from 'vitest';

// 集成测试环境配置
export const integrationConfig = {
  http: {
    baseUrl: 'http://localhost:3001',
    timeout: 30000
  },
  grpc: {
    address: 'localhost:50051',
    timeout: 30000
  },
  websocket: {
    url: 'ws://localhost:8080',
    timeout: 30000
  },
  database: {
    url: 'memory://test.db'
  }
};

// 测试服务管理器
export class TestServiceManager {
  private services = new Map<string, any>();
  
  async startService(name: string, config: any) {
    if (this.services.has(name)) {
      console.log(`Service ${name} already running`);
      return;
    }
    
    console.log(`Starting service: ${name}`);
    
    // 根据服务类型启动不同的Mock服务
    switch (name) {
      case 'http':
        await this.startHttpService(config);
        break;
      case 'grpc':
        await this.startGrpcService(config);
        break;
      case 'websocket':
        await this.startWebSocketService(config);
        break;
      default:
        throw new Error(`Unknown service: ${name}`);
    }
    
    this.services.set(name, { name, config, status: 'running' });
  }
  
  async stopService(name: string) {
    const service = this.services.get(name);
    if (!service) {
      console.log(`Service ${name} not running`);
      return;
    }
    
    console.log(`Stopping service: ${name}`);
    
    // 停止服务的具体实现
    switch (name) {
      case 'http':
        await this.stopHttpService();
        break;
      case 'grpc':
        await this.stopGrpcService();
        break;
      case 'websocket':
        await this.stopWebSocketService();
        break;
    }
    
    this.services.delete(name);
  }
  
  async stopAllServices() {
    const serviceNames = Array.from(this.services.keys());
    await Promise.all(serviceNames.map(name => this.stopService(name)));
  }
  
  private async startHttpService(config: any) {
    // Mock HTTP服务启动逻辑
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  private async stopHttpService() {
    // Mock HTTP服务停止逻辑
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  private async startGrpcService(config: any) {
    // Mock gRPC服务启动逻辑
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  private async stopGrpcService() {
    // Mock gRPC服务停止逻辑
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  private async startWebSocketService(config: any) {
    // Mock WebSocket服务启动逻辑
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  private async stopWebSocketService() {
    // Mock WebSocket服务停止逻辑
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}

// 全局服务管理器实例
export const serviceManager = new TestServiceManager();

// 集成测试工具函数
export const integrationUtils = {
  // 等待服务就绪
  waitForService: async (name: string, timeout: number = 10000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        // 检查服务是否就绪的逻辑
        await new Promise(resolve => setTimeout(resolve, 100));
        return true;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    throw new Error(`Service ${name} not ready within ${timeout}ms`);
  },
  
  // 创建测试客户端
  createTestClient: (protocol: string, config: any) => {
    // 根据协议类型创建测试客户端
    return {
      protocol,
      config,
      async call(method: string, data: any) {
        // Mock调用实现
        return { success: true, data: `Mock response for ${method}` };
      },
      async close() {
        // Mock关闭实现
      }
    };
  }
};

// 集成测试前置设置
beforeAll(async () => {
  console.log('🚀 Starting integration test services...');
  
  await Promise.all([
    serviceManager.startService('http', integrationConfig.http),
    serviceManager.startService('grpc', integrationConfig.grpc),
    serviceManager.startService('websocket', integrationConfig.websocket)
  ]);
  
  console.log('✅ Integration test services started');
}, 30000);

// 集成测试后置清理
afterAll(async () => {
  console.log('🧹 Stopping integration test services...');
  
  await serviceManager.stopAllServices();
  
  console.log('✅ Integration test services stopped');
}, 15000);
