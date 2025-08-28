/**
 * 测试辅助工具函数
 * Test helper utilities
 */

import { vi } from 'vitest';

// 延迟工具
export const delay = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

// 超时工具
export const timeout = <T>(promise: Promise<T>, ms: number): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
    )
  ]);
};

// 重试工具
export const retry = async <T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 100
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        await delay(delayMs * attempt); // 指数退避
      }
    }
  }
  
  throw lastError!;
};

// 等待条件满足
export const waitFor = async (
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  intervalMs: number = 100
): Promise<void> => {
  const start = Date.now();
  
  while (Date.now() - start < timeoutMs) {
    try {
      const result = await condition();
      if (result) return;
    } catch (error) {
      // 忽略检查过程中的错误
    }
    
    await delay(intervalMs);
  }
  
  throw new Error(`Condition not met within ${timeoutMs}ms`);
};

// Mock工厂
export const createMockFunction = <T extends (...args: any[]) => any>(
  implementation?: T
): any => {
  return implementation ? vi.fn(implementation) : vi.fn();
};

// 事件监听器工具
export const createEventListener = () => {
  const events = new Map<string, any[]>();
  
  return {
    on: (event: string, data: any) => {
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event)!.push(data);
    },
    
    getEvents: (event: string) => events.get(event) || [],
    
    hasEvent: (event: string) => events.has(event) && events.get(event)!.length > 0,
    
    clear: () => events.clear(),
    
    waitForEvent: async (event: string, timeoutMs: number = 5000) => {
      await waitFor(() => events.has(event) && events.get(event)!.length > 0, timeoutMs);
      return events.get(event)![0];
    }
  };
};

// 性能测量工具
export const measurePerformance = async <T>(
  fn: () => Promise<T> | T,
  iterations: number = 1
): Promise<{
  result: T;
  totalTime: number;
  averageTime: number;
  minTime: number;
  maxTime: number;
  iterations: number;
}> => {
  const times: number[] = [];
  let result: T;
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    result = await fn();
    const end = performance.now();
    times.push(end - start);
  }
  
  const totalTime = times.reduce((sum, time) => sum + time, 0);
  const averageTime = totalTime / iterations;
  const minTime = Math.min(...times);
  const maxTime = Math.max(...times);
  
  return {
    result: result!,
    totalTime,
    averageTime,
    minTime,
    maxTime,
    iterations
  };
};

// 内存使用监控
export const measureMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    return process.memoryUsage();
  }
  
  // 浏览器环境的内存监控（如果支持）
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory;
  }
  
  return null;
};

// 随机数据生成器
export const randomData = {
  string: (length: number = 10): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  },
  
  number: (min: number = 0, max: number = 100): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  boolean: (): boolean => Math.random() < 0.5,
  
  array: <T>(generator: () => T, length: number = 5): T[] => {
    return Array.from({ length }, generator);
  },
  
  object: (keys: string[], valueGenerator: () => any): Record<string, any> => {
    const obj: Record<string, any> = {};
    keys.forEach(key => {
      obj[key] = valueGenerator();
    });
    return obj;
  }
};

// 深度比较工具
export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== typeof b) return false;
  
  if (typeof a !== 'object') return a === b;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  return keysA.every(key => keysB.includes(key) && deepEqual(a[key], b[key]));
};

// 测试数据清理工具
export const cleanup = {
  // 清理所有Mock
  mocks: () => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  },
  
  // 清理定时器
  timers: () => {
    vi.clearAllTimers();
  },
  
  // 清理所有
  all: () => {
    cleanup.mocks();
    cleanup.timers();
  }
};

// 断言增强工具
export const assertions = {
  // 断言异步函数抛出特定错误
  rejectsWithMessage: async (
    fn: () => Promise<any>,
    expectedMessage: string | RegExp
  ) => {
    try {
      await fn();
      throw new Error('Expected function to reject, but it resolved');
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      if (typeof expectedMessage === 'string') {
        expect(message).toContain(expectedMessage);
      } else {
        expect(message).toMatch(expectedMessage);
      }
    }
  },
  
  // 断言对象包含特定属性
  hasProperties: (obj: any, properties: string[]) => {
    properties.forEach(prop => {
      expect(obj).toHaveProperty(prop);
    });
  },
  
  // 断言数组包含特定元素
  arrayContains: <T>(array: T[], elements: T[]) => {
    elements.forEach(element => {
      expect(array).toContain(element);
    });
  }
};
