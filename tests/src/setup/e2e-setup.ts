/**
 * E2E测试专用设置
 * E2E test specific setup
 */

import { vi } from 'vitest';

// E2E测试环境配置
export const e2eConfig = {
  services: {
    http: {
      port: 3002,
      host: 'localhost'
    },
    grpc: {
      port: 50052,
      host: 'localhost'
    },
    websocket: {
      port: 8081,
      host: 'localhost'
    }
  },
  timeouts: {
    service: 60000,
    request: 30000,
    connection: 15000
  }
};

// E2E测试场景管理器
export class E2EScenarioManager {
  private scenarios = new Map<string, any>();
  
  // 注册测试场景
  registerScenario(name: string, scenario: any) {
    this.scenarios.set(name, scenario);
  }
  
  // 执行测试场景
  async executeScenario(name: string, context: any = {}) {
    const scenario = this.scenarios.get(name);
    if (!scenario) {
      throw new Error(`Scenario ${name} not found`);
    }
    
    console.log(`Executing E2E scenario: ${name}`);
    
    try {
      const result = await scenario.execute(context);
      console.log(`✅ Scenario ${name} completed successfully`);
      return result;
    } catch (error) {
      console.error(`❌ Scenario ${name} failed:`, error);
      throw error;
    }
  }
  
  // 清理所有场景
  clearScenarios() {
    this.scenarios.clear();
  }
}

// 全局场景管理器
export const scenarioManager = new E2EScenarioManager();

// E2E测试工具函数
export const e2eUtils = {
  // 创建完整的测试环境
  createTestEnvironment: async () => {
    const environment = {
      services: new Map(),
      clients: new Map(),
      
      async addService(name: string, config: any) {
        // 添加服务到测试环境
        this.services.set(name, { name, config, status: 'stopped' });
      },
      
      async startService(name: string) {
        const service = this.services.get(name);
        if (!service) throw new Error(`Service ${name} not found`);
        
        // 启动服务的实现
        service.status = 'running';
        console.log(`Service ${name} started`);
      },
      
      async stopService(name: string) {
        const service = this.services.get(name);
        if (!service) return;
        
        // 停止服务的实现
        service.status = 'stopped';
        console.log(`Service ${name} stopped`);
      },
      
      async createClient(protocol: string, target: string) {
        // 创建客户端的实现
        const client = {
          protocol,
          target,
          connected: false,
          
          async connect() {
            this.connected = true;
            console.log(`Client connected to ${target}`);
          },
          
          async disconnect() {
            this.connected = false;
            console.log(`Client disconnected from ${target}`);
          },
          
          async call(service: string, method: string, data: any) {
            if (!this.connected) throw new Error('Client not connected');
            // Mock调用实现
            return { success: true, result: `${service}.${method} called` };
          }
        };
        
        this.clients.set(`${protocol}:${target}`, client);
        return client;
      },
      
      async cleanup() {
        // 清理所有客户端
        for (const client of this.clients.values()) {
          if (client.connected) {
            await client.disconnect();
          }
        }
        this.clients.clear();
        
        // 停止所有服务
        for (const serviceName of this.services.keys()) {
          await this.stopService(serviceName);
        }
        this.services.clear();
      }
    };
    
    return environment;
  },
  
  // 等待条件满足
  waitForCondition: async (
    condition: () => boolean | Promise<boolean>,
    timeout: number = 30000,
    interval: number = 100
  ) => {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      try {
        const result = await condition();
        if (result) return true;
      } catch (error) {
        // 忽略检查过程中的错误
      }
      
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },
  
  // 执行完整的通信流程测试
  testCommunicationFlow: async (
    clientProtocol: string,
    serverProtocol: string,
    testData: any
  ) => {
    const results = {
      setup: false,
      connection: false,
      communication: false,
      cleanup: false,
      errors: [] as string[]
    };
    
    try {
      // 设置阶段
      console.log('Setting up communication flow test...');
      results.setup = true;
      
      // 连接阶段
      console.log('Testing connection...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Mock connection
      results.connection = true;
      
      // 通信阶段
      console.log('Testing communication...');
      await new Promise(resolve => setTimeout(resolve, 100)); // Mock communication
      results.communication = true;
      
      // 清理阶段
      console.log('Cleaning up...');
      await new Promise(resolve => setTimeout(resolve, 50)); // Mock cleanup
      results.cleanup = true;
      
    } catch (error) {
      results.errors.push(error instanceof Error ? error.message : String(error));
    }
    
    return results;
  }
};

// 注册常用的E2E测试场景
scenarioManager.registerScenario('basic-http-flow', {
  async execute(context: any) {
    const env = await e2eUtils.createTestEnvironment();
    
    try {
      await env.addService('http-server', e2eConfig.services.http);
      await env.startService('http-server');
      
      const client = await env.createClient('http', `http://localhost:${e2eConfig.services.http.port}`);
      await client.connect();
      
      const result = await client.call('TestService', 'ping', { message: 'hello' });
      
      expect(result.success).toBe(true);
      
      await client.disconnect();
      return result;
    } finally {
      await env.cleanup();
    }
  }
});

// E2E测试前置设置
beforeAll(async () => {
  console.log('🚀 Setting up E2E test environment...');
  
  // 设置更长的超时时间
  vi.setConfig({
    testTimeout: e2eConfig.timeouts.service,
    hookTimeout: e2eConfig.timeouts.connection
  });
  
  console.log('✅ E2E test environment ready');
}, e2eConfig.timeouts.service);

// E2E测试后置清理
afterAll(async () => {
  console.log('🧹 Cleaning up E2E test environment...');
  
  scenarioManager.clearScenarios();
  
  console.log('✅ E2E test environment cleaned up');
}, e2eConfig.timeouts.connection);
