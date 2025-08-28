/**
 * 序列化测试专用设置
 * Serialization test specific setup
 */

import { vi } from 'vitest';

// 测试数据生成器
export const testDataGenerator = {
  // 生成简单对象
  simpleObject: () => ({
    id: 1,
    name: 'Test Object',
    active: true,
    timestamp: new Date('2023-01-01T00:00:00.000Z')
  }),
  
  // 生成复杂嵌套对象
  complexObject: () => ({
    user: {
      id: 12345,
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        preferences: {
          theme: 'dark',
          notifications: {
            email: true,
            push: false,
            sms: true
          }
        }
      },
      metadata: {
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-12-01T00:00:00.000Z'),
        tags: ['user', 'premium', 'verified'],
        scores: [95, 87, 92, 88]
      }
    },
    settings: {
      version: '1.0.0',
      features: {
        analytics: true,
        debugging: false,
        experimental: {
          newUI: true,
          betaFeatures: false
        }
      }
    }
  }),
  
  // 生成大型数组
  largeArray: (size: number = 1000) => 
    Array.from({ length: size }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      value: Math.random() * 100,
      active: i % 2 === 0
    })),
  
  // 生成特殊类型数据
  specialTypes: () => ({
    bigint: BigInt('9007199254740991'),
    buffer: Buffer.from('Hello World', 'utf8'),
    date: new Date('2023-01-01T00:00:00.000Z'),
    regex: /test-pattern/gi,
    undefined: undefined,
    null: null,
    symbol: Symbol('test'),
    function: () => 'test function'
  }),
  
  // 生成循环引用对象（用于错误测试）
  circularObject: () => {
    const obj: any = { name: 'circular' };
    obj.self = obj;
    return obj;
  }
};

// 性能测试工具
export const performanceUtils = {
  // 测量序列化性能
  measureSerialization: async (serializer: any, data: any, iterations: number = 100) => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await serializer.serialize(data);
    }
    
    const end = performance.now();
    return {
      totalTime: end - start,
      averageTime: (end - start) / iterations,
      iterations
    };
  },
  
  // 测量反序列化性能
  measureDeserialization: async (serializer: any, serializedData: any, iterations: number = 100) => {
    const start = performance.now();
    
    for (let i = 0; i < iterations; i++) {
      await serializer.deserialize(serializedData);
    }
    
    const end = performance.now();
    return {
      totalTime: end - start,
      averageTime: (end - start) / iterations,
      iterations
    };
  }
};

// Schema注册表Mock
export const mockSchemaRegistry = {
  schemas: new Map(),
  
  register(name: string, schema: any) {
    this.schemas.set(name, schema);
  },
  
  get(name: string) {
    return this.schemas.get(name);
  },
  
  has(name: string) {
    return this.schemas.has(name);
  },
  
  clear() {
    this.schemas.clear();
  }
};

// 序列化测试前置设置
beforeEach(() => {
  mockSchemaRegistry.clear();
});

// 序列化测试后置清理
afterEach(() => {
  vi.clearAllMocks();
});
