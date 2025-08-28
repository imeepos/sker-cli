/**
 * 断言辅助函数
 * Assertion helper functions
 */

import { expect } from 'vitest';

// 协议客户端接口断言
export const assertProtocolClient = (client: any) => {
  describe('ProtocolClient接口断言', () => {
    it('应该有protocol属性', () => {
      expect(client).toHaveProperty('protocol');
      expect(typeof client.protocol).toBe('string');
    });

    it('应该有target属性', () => {
      expect(client).toHaveProperty('target');
      expect(typeof client.target).toBe('string');
    });

    it('应该有call方法', () => {
      expect(client).toHaveProperty('call');
      expect(typeof client.call).toBe('function');
    });

    it('应该有stream方法', () => {
      expect(client).toHaveProperty('stream');
      expect(typeof client.stream).toBe('function');
    });

    it('应该有close方法', () => {
      expect(client).toHaveProperty('close');
      expect(typeof client.close).toBe('function');
    });
  });
};

// 协议服务端接口断言
export const assertProtocolServer = (server: any) => {
  describe('ProtocolServer接口断言', () => {
    it('应该有protocol属性', () => {
      expect(server).toHaveProperty('protocol');
      expect(typeof server.protocol).toBe('string');
    });

    it('应该有address属性', () => {
      expect(server).toHaveProperty('address');
      expect(typeof server.address).toBe('string');
    });

    it('应该有port属性', () => {
      expect(server).toHaveProperty('port');
      expect(typeof server.port).toBe('number');
    });

    it('应该有start方法', () => {
      expect(server).toHaveProperty('start');
      expect(typeof server.start).toBe('function');
    });

    it('应该有stop方法', () => {
      expect(server).toHaveProperty('stop');
      expect(typeof server.stop).toBe('function');
    });

    it('应该有registerHandler方法', () => {
      expect(server).toHaveProperty('registerHandler');
      expect(typeof server.registerHandler).toBe('function');
    });

    it('应该有unregisterHandler方法', () => {
      expect(server).toHaveProperty('unregisterHandler');
      expect(typeof server.unregisterHandler).toBe('function');
    });
  });
};

// 序列化器接口断言
export const assertSerializer = (serializer: any) => {
  describe('ISerializer接口断言', () => {
    it('应该有serialize方法', () => {
      expect(serializer).toHaveProperty('serialize');
      expect(typeof serializer.serialize).toBe('function');
    });

    it('应该有deserialize方法', () => {
      expect(serializer).toHaveProperty('deserialize');
      expect(typeof serializer.deserialize).toBe('function');
    });

    it('serialize方法应该返回Promise', async () => {
      const result = serializer.serialize({ test: true });
      expect(result).toBeInstanceOf(Promise);
    });

    it('deserialize方法应该返回Promise', async () => {
      const result = serializer.deserialize('{"test":true}');
      expect(result).toBeInstanceOf(Promise);
    });
  });
};

// 连接接口断言
export const assertConnection = (connection: any) => {
  describe('Connection接口断言', () => {
    it('应该有id属性', () => {
      expect(connection).toHaveProperty('id');
      expect(typeof connection.id).toBe('string');
    });

    it('应该有protocol属性', () => {
      expect(connection).toHaveProperty('protocol');
      expect(typeof connection.protocol).toBe('string');
    });

    it('应该有status属性', () => {
      expect(connection).toHaveProperty('status');
      expect(typeof connection.status).toBe('string');
    });

    it('应该有config属性', () => {
      expect(connection).toHaveProperty('config');
      expect(typeof connection.config).toBe('object');
    });

    it('应该有connect方法', () => {
      expect(connection).toHaveProperty('connect');
      expect(typeof connection.connect).toBe('function');
    });

    it('应该有disconnect方法', () => {
      expect(connection).toHaveProperty('disconnect');
      expect(typeof connection.disconnect).toBe('function');
    });

    it('应该有isConnected方法', () => {
      expect(connection).toHaveProperty('isConnected');
      expect(typeof connection.isConnected).toBe('function');
    });

    it('应该有ping方法', () => {
      expect(connection).toHaveProperty('ping');
      expect(typeof connection.ping).toBe('function');
    });

    it('应该有send方法', () => {
      expect(connection).toHaveProperty('send');
      expect(typeof connection.send).toBe('function');
    });

    it('应该有request方法', () => {
      expect(connection).toHaveProperty('request');
      expect(typeof connection.request).toBe('function');
    });

    it('应该有stream方法', () => {
      expect(connection).toHaveProperty('stream');
      expect(typeof connection.stream).toBe('function');
    });
  });
};

// 错误类型断言
export const assertSkerError = (error: any) => {
  expect(error).toBeInstanceOf(Error);
  expect(error).toHaveProperty('code');
  expect(error).toHaveProperty('message');
  expect(error).toHaveProperty('context');
  expect(typeof error.code).toBe('string');
  expect(typeof error.message).toBe('string');
};

// 配置对象断言
export const assertConfig = (config: any, requiredFields: string[]) => {
  expect(config).toBeDefined();
  expect(typeof config).toBe('object');
  
  requiredFields.forEach(field => {
    expect(config).toHaveProperty(field);
  });
};

// 性能断言
export const assertPerformance = (
  actualTime: number,
  expectedMaxTime: number,
  operation: string = 'operation'
) => {
  expect(actualTime).toBeLessThanOrEqual(expectedMaxTime);
  if (actualTime > expectedMaxTime) {
    throw new Error(
      `Performance assertion failed: ${operation} took ${actualTime}ms, expected <= ${expectedMaxTime}ms`
    );
  }
};

// 内存使用断言
export const assertMemoryUsage = (
  beforeMemory: any,
  afterMemory: any,
  maxIncreaseMB: number = 50
) => {
  if (!beforeMemory || !afterMemory) {
    console.warn('Memory usage data not available');
    return;
  }
  
  const beforeHeap = beforeMemory.heapUsed || beforeMemory.usedJSHeapSize || 0;
  const afterHeap = afterMemory.heapUsed || afterMemory.usedJSHeapSize || 0;
  const increaseMB = (afterHeap - beforeHeap) / 1024 / 1024;
  
  expect(increaseMB).toBeLessThanOrEqual(maxIncreaseMB);
};

// 数据完整性断言
export const assertDataIntegrity = (original: any, processed: any) => {
  // 基本类型检查
  expect(typeof processed).toBe(typeof original);
  
  // 如果是对象，检查关键属性
  if (typeof original === 'object' && original !== null) {
    if (Array.isArray(original)) {
      expect(Array.isArray(processed)).toBe(true);
      expect(processed.length).toBe(original.length);
    } else {
      const originalKeys = Object.keys(original);
      const processedKeys = Object.keys(processed);
      
      // 检查关键属性是否存在
      originalKeys.forEach(key => {
        if (original[key] !== undefined) {
          expect(processed).toHaveProperty(key);
        }
      });
    }
  }
};

// 异步操作断言
export const assertAsyncOperation = async (
  operation: () => Promise<any>,
  timeoutMs: number = 5000
) => {
  const start = Date.now();
  
  try {
    const result = await Promise.race([
      operation(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timeout after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(timeoutMs);
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new Error(`Async operation failed: timeout after ${duration}ms`);
    }
    
    throw error;
  }
};

// 事件发射断言
export const assertEventEmission = async (
  emitter: any,
  eventName: string,
  trigger: () => Promise<void> | void,
  timeoutMs: number = 1000
) => {
  return new Promise<any>((resolve, reject) => {
    const timeout = setTimeout(() => {
      emitter.off(eventName, listener);
      reject(new Error(`Event '${eventName}' was not emitted within ${timeoutMs}ms`));
    }, timeoutMs);
    
    const listener = (data: any) => {
      clearTimeout(timeout);
      emitter.off(eventName, listener);
      resolve(data);
    };
    
    emitter.on(eventName, listener);
    
    try {
      const result = trigger();
      if (result instanceof Promise) {
        result.catch(error => {
          clearTimeout(timeout);
          emitter.off(eventName, listener);
          reject(error);
        });
      }
    } catch (error) {
      clearTimeout(timeout);
      emitter.off(eventName, listener);
      reject(error);
    }
  });
};

// 批量断言工具
export const assertBatch = (assertions: Array<() => void>) => {
  const errors: Error[] = [];
  
  assertions.forEach((assertion, index) => {
    try {
      assertion();
    } catch (error) {
      errors.push(new Error(`Assertion ${index + 1} failed: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
  
  if (errors.length > 0) {
    const errorMessage = errors.map(e => e.message).join('\n');
    throw new Error(`Batch assertion failed:\n${errorMessage}`);
  }
};
