/**
 * Mock工厂函数
 * Mock factory functions
 */

import { vi } from 'vitest';

// HTTP Mock工厂
export const createHttpMocks = () => {
  const mockFetch = vi.fn();
  
  const mockResponse = (data: any, status: number = 200, headers: Record<string, string> = {}) => {
    return Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      statusText: status === 200 ? 'OK' : 'Error',
      headers: new Map(Object.entries(headers)),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
      blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0))
    });
  };
  
  const mockError = (message: string = 'Network Error') => {
    return Promise.reject(new Error(message));
  };
  
  return {
    fetch: mockFetch,
    response: mockResponse,
    error: mockError,
    
    // 设置成功响应
    mockSuccess: (data: any, status: number = 200) => {
      mockFetch.mockResolvedValue(mockResponse(data, status));
    },
    
    // 设置错误响应
    mockError: (message: string = 'Network Error') => {
      mockFetch.mockRejectedValue(new Error(message));
    },
    
    // 设置多个响应（按顺序）
    mockSequence: (responses: Array<{ data: any; status?: number } | Error>) => {
      responses.forEach((response) => {
        if (response instanceof Error) {
          mockFetch.mockRejectedValueOnce(response);
        } else {
          mockFetch.mockResolvedValueOnce(mockResponse(response.data, response.status));
        }
      });
    },
    
    // 重置Mock
    reset: () => {
      mockFetch.mockReset();
    }
  };
};

// WebSocket Mock工厂
export const createWebSocketMocks = () => {
  const mockWebSocket = {
    readyState: 1, // OPEN
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    onopen: null as ((event: Event) => void) | null,
    onclose: null as ((event: CloseEvent) => void) | null,
    onmessage: null as ((event: MessageEvent) => void) | null,
    onerror: null as ((event: Event) => void) | null,
    
    // 模拟事件触发
    triggerOpen: () => {
      if (mockWebSocket.onopen) {
        mockWebSocket.onopen({} as Event);
      }
    },
    
    triggerMessage: (data: any) => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage({ data: JSON.stringify(data) } as MessageEvent);
      }
    },
    
    triggerClose: (code: number = 1000, reason: string = 'Normal closure') => {
      if (mockWebSocket.onclose) {
        mockWebSocket.onclose({ code, reason } as CloseEvent);
      }
    },
    
    triggerError: (error: Error = new Error('WebSocket error')) => {
      if (mockWebSocket.onerror) {
        mockWebSocket.onerror(error as any);
      }
    }
  };
  
  const MockWebSocketConstructor = vi.fn(() => mockWebSocket);
  
  return {
    WebSocket: MockWebSocketConstructor,
    instance: mockWebSocket,
    
    // 设置全局WebSocket Mock
    mockGlobal: () => {
      global.WebSocket = MockWebSocketConstructor as any;
    },
    
    // 重置Mock
    reset: () => {
      MockWebSocketConstructor.mockReset();
      mockWebSocket.send.mockReset();
      mockWebSocket.close.mockReset();
      mockWebSocket.addEventListener.mockReset();
      mockWebSocket.removeEventListener.mockReset();
    }
  };
};

// gRPC Mock工厂
export const createGrpcMocks = () => {
  const mockClient = {
    call: vi.fn(),
    stream: vi.fn(),
    close: vi.fn(),
    getConnectionState: vi.fn(() => 'READY'),
    waitForReady: vi.fn(() => Promise.resolve())
  };
  
  const mockServer = {
    start: vi.fn(() => Promise.resolve()),
    stop: vi.fn(() => Promise.resolve()),
    addService: vi.fn(),
    bind: vi.fn(),
    bindAsync: vi.fn()
  };
  
  const mockCall = {
    on: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    cancel: vi.fn(),
    getPeer: vi.fn(() => 'localhost:50051'),
    getDeadline: vi.fn(() => new Date(Date.now() + 30000))
  };
  
  return {
    client: mockClient,
    server: mockServer,
    call: mockCall,
    
    // 模拟成功调用
    mockSuccessCall: (result: any) => {
      mockClient.call.mockResolvedValue(result);
    },
    
    // 模拟错误调用
    mockErrorCall: (error: Error) => {
      mockClient.call.mockRejectedValue(error);
    },
    
    // 模拟流式响应
    mockStream: function* (data: any[]) {
      for (const item of data) {
        yield item;
      }
    },
    
    // 重置Mock
    reset: () => {
      Object.values(mockClient).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
      Object.values(mockServer).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
      Object.values(mockCall).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
    }
  };
};

// 序列化器Mock工厂
export const createSerializerMocks = () => {
  const mockSerializer = {
    serialize: vi.fn(),
    deserialize: vi.fn(),
    getConfig: vi.fn(() => ({})),
    validateSchema: vi.fn(() => true)
  };
  
  const mockSchemaRegistry = {
    register: vi.fn(),
    get: vi.fn(),
    has: vi.fn(() => true),
    validate: vi.fn(() => ({ valid: true, errors: [] }))
  };
  
  return {
    serializer: mockSerializer,
    schemaRegistry: mockSchemaRegistry,
    
    // 模拟成功序列化
    mockSerializeSuccess: (_input: any, output: any) => {
      mockSerializer.serialize.mockResolvedValue(output);
    },

    // 模拟序列化错误
    mockSerializeError: (error: Error) => {
      mockSerializer.serialize.mockRejectedValue(error);
    },

    // 模拟成功反序列化
    mockDeserializeSuccess: (_input: any, output: any) => {
      mockSerializer.deserialize.mockResolvedValue(output);
    },
    
    // 模拟反序列化错误
    mockDeserializeError: (error: Error) => {
      mockSerializer.deserialize.mockRejectedValue(error);
    },
    
    // 重置Mock
    reset: () => {
      Object.values(mockSerializer).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
      Object.values(mockSchemaRegistry).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
    }
  };
};

// 日志Mock工厂
export const createLoggerMocks = () => {
  const mockLogger: any = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
    setLevel: vi.fn(),
    getLevel: vi.fn(() => 'info'),
    child: vi.fn(() => mockLogger)
  };
  
  return {
    logger: mockLogger,
    
    // 验证日志调用
    expectLog: (level: string, message: string | RegExp): void => {
      const logFn = mockLogger[level as keyof typeof mockLogger];
      if (vi.isMockFunction(logFn)) {
        if (typeof message === 'string') {
          expect(logFn).toHaveBeenCalledWith(expect.stringContaining(message));
        } else {
          expect(logFn).toHaveBeenCalledWith(expect.stringMatching(message));
        }
      }
    },
    
    // 重置Mock
    reset: () => {
      Object.values(mockLogger).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
    }
  };
};

// 事件发射器Mock工厂
export const createEventEmitterMocks = () => {
  const events = new Map<string, Function[]>();
  
  const mockEventEmitter = {
    on: vi.fn((event: string, listener: Function) => {
      if (!events.has(event)) {
        events.set(event, []);
      }
      events.get(event)!.push(listener);
    }),
    
    off: vi.fn((event: string, listener: Function) => {
      const listeners = events.get(event);
      if (listeners) {
        const index = listeners.indexOf(listener);
        if (index > -1) {
          listeners.splice(index, 1);
        }
      }
    }),
    
    emit: vi.fn((event: string, ...args: any[]) => {
      const listeners = events.get(event);
      if (listeners) {
        listeners.forEach(listener => listener(...args));
      }
    }),
    
    once: vi.fn((event: string, listener: Function) => {
      const onceListener = (...args: any[]) => {
        listener(...args);
        mockEventEmitter.off(event, onceListener);
      };
      mockEventEmitter.on(event, onceListener);
    }),
    
    removeAllListeners: vi.fn((event?: string) => {
      if (event) {
        events.delete(event);
      } else {
        events.clear();
      }
    }),
    
    listenerCount: vi.fn((event: string) => {
      return events.get(event)?.length || 0;
    })
  };
  
  return {
    eventEmitter: mockEventEmitter,
    events,
    
    // 触发事件
    trigger: (event: string, ...args: any[]) => {
      mockEventEmitter.emit(event, ...args);
    },
    
    // 验证事件监听
    expectListener: (event: string) => {
      expect(mockEventEmitter.on).toHaveBeenCalledWith(event, expect.any(Function));
    },
    
    // 重置Mock
    reset: () => {
      events.clear();
      Object.values(mockEventEmitter).forEach(mock => {
        if (vi.isMockFunction(mock)) mock.mockReset();
      });
    }
  };
};

// 综合Mock工厂
export const createMockSuite = () => {
  const http = createHttpMocks();
  const websocket = createWebSocketMocks();
  const grpc = createGrpcMocks();
  const serializer = createSerializerMocks();
  const logger = createLoggerMocks();
  const eventEmitter = createEventEmitterMocks();
  
  return {
    http,
    websocket,
    grpc,
    serializer,
    logger,
    eventEmitter,
    
    // 重置所有Mock
    resetAll: () => {
      http.reset();
      websocket.reset();
      grpc.reset();
      serializer.reset();
      logger.reset();
      eventEmitter.reset();
    }
  };
};
