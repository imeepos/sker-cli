/**
 * 全局测试设置
 * Global test setup
 */

import { vi } from 'vitest';

// 设置测试超时
vi.setConfig({
  testTimeout: 30000,
  hookTimeout: 10000
});

// Mock全局对象
global.console = {
  ...console,
  // 在测试中静默某些日志
  debug: vi.fn(),
  info: process.env.VITEST_VERBOSE ? console.info : vi.fn(),
  warn: console.warn,
  error: console.error,
  log: process.env.VITEST_VERBOSE ? console.log : vi.fn()
};

// Mock WebSocket for browser environment
if (typeof global.WebSocket === 'undefined') {
  (global as any).WebSocket = vi.fn().mockImplementation(() => ({
    readyState: 1,
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onopen: null,
    onclose: null,
    onmessage: null,
    onerror: null
  }));
}

// Mock fetch if not available
if (typeof global.fetch === 'undefined') {
  global.fetch = vi.fn();
}

// 设置环境变量
process.env.NODE_ENV = 'test';
process.env.SKER_LOG_LEVEL = 'error';

// 全局测试工具函数
declare global {
  var testUtils: {
    delay: (ms: number) => Promise<void>;
    mockServer: {
      start: (port: number) => Promise<void>;
      stop: () => Promise<void>;
    };
  };
}

global.testUtils = {
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  mockServer: {
    start: async (port: number) => {
      // Mock server implementation
    },
    stop: async () => {
      // Mock server cleanup
    }
  }
};

// 清理函数
afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  vi.restoreAllMocks();
});
