/**
 * 测试常量定义
 * Test constants definition
 */

// 测试超时配置
export const TIMEOUTS = {
  UNIT: 5000,           // 单元测试超时 5秒
  INTEGRATION: 30000,   // 集成测试超时 30秒
  E2E: 120000,         // E2E测试超时 2分钟
  CONNECTION: 10000,    // 连接超时 10秒
  REQUEST: 15000,      // 请求超时 15秒
  STREAM: 60000        // 流操作超时 1分钟
} as const;

// 测试端口配置
export const TEST_PORTS = {
  HTTP: 3001,
  HTTPS: 3443,
  GRPC: 50051,
  WEBSOCKET: 8080,
  WEBSOCKET_SECURE: 8443,
  MOCK_SERVER: 3002
} as const;

// 测试主机配置
export const TEST_HOSTS = {
  LOCAL: 'localhost',
  LOOPBACK: '127.0.0.1',
  ANY: '0.0.0.0'
} as const;

// 测试URL配置
export const TEST_URLS = {
  HTTP: `http://${TEST_HOSTS.LOCAL}:${TEST_PORTS.HTTP}`,
  HTTPS: `https://${TEST_HOSTS.LOCAL}:${TEST_PORTS.HTTPS}`,
  GRPC: `${TEST_HOSTS.LOCAL}:${TEST_PORTS.GRPC}`,
  WEBSOCKET: `ws://${TEST_HOSTS.LOCAL}:${TEST_PORTS.WEBSOCKET}`,
  WEBSOCKET_SECURE: `wss://${TEST_HOSTS.LOCAL}:${TEST_PORTS.WEBSOCKET_SECURE}`
} as const;

// 测试数据大小
export const DATA_SIZES = {
  SMALL: 1024,          // 1KB
  MEDIUM: 1024 * 100,   // 100KB
  LARGE: 1024 * 1024,   // 1MB
  XLARGE: 1024 * 1024 * 10  // 10MB
} as const;

// 性能基准
export const PERFORMANCE_BENCHMARKS = {
  SERIALIZATION: {
    JSON_SMALL: 1,      // 1ms for small JSON
    JSON_LARGE: 50,     // 50ms for large JSON
    PROTOBUF_SMALL: 0.5, // 0.5ms for small protobuf
    PROTOBUF_LARGE: 20   // 20ms for large protobuf
  },
  NETWORK: {
    LOCAL_LATENCY: 1,    // 1ms local latency
    HTTP_REQUEST: 100,   // 100ms HTTP request
    GRPC_CALL: 50,      // 50ms gRPC call
    WEBSOCKET_MESSAGE: 10 // 10ms WebSocket message
  },
  MEMORY: {
    MAX_INCREASE_MB: 50, // 50MB max memory increase
    LEAK_THRESHOLD: 10   // 10MB memory leak threshold
  }
} as const;

// 重试配置
export const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 100,     // 100ms
  MAX_DELAY: 5000,     // 5s
  BACKOFF_MULTIPLIER: 2
} as const;

// 测试数据模板
export const TEST_DATA = {
  USER: {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    active: true,
    createdAt: '2023-01-01T00:00:00.000Z'
  },
  
  MESSAGE: {
    id: 'msg-001',
    type: 'test',
    payload: { content: 'Hello World' },
    timestamp: Date.now()
  },
  
  CONFIG: {
    timeout: 30000,
    retries: 3,
    compression: true,
    keepAlive: true
  },
  
  LARGE_ARRAY: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
    value: Math.random()
  })),
  
  NESTED_OBJECT: {
    level1: {
      level2: {
        level3: {
          data: 'deep nested value',
          array: [1, 2, 3, 4, 5],
          boolean: true,
          null: null,
          undefined: undefined
        }
      }
    }
  }
} as const;

// 错误消息模板
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Connection failed',
  TIMEOUT: 'Operation timed out',
  INVALID_DATA: 'Invalid data format',
  SERIALIZATION_ERROR: 'Serialization failed',
  DESERIALIZATION_ERROR: 'Deserialization failed',
  NETWORK_ERROR: 'Network error occurred',
  AUTHENTICATION_FAILED: 'Authentication failed',
  AUTHORIZATION_FAILED: 'Authorization failed',
  SERVICE_UNAVAILABLE: 'Service unavailable',
  INTERNAL_ERROR: 'Internal server error'
} as const;

// HTTP状态码
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

// gRPC状态码
export const GRPC_STATUS = {
  OK: 0,
  CANCELLED: 1,
  UNKNOWN: 2,
  INVALID_ARGUMENT: 3,
  DEADLINE_EXCEEDED: 4,
  NOT_FOUND: 5,
  ALREADY_EXISTS: 6,
  PERMISSION_DENIED: 7,
  RESOURCE_EXHAUSTED: 8,
  FAILED_PRECONDITION: 9,
  ABORTED: 10,
  OUT_OF_RANGE: 11,
  UNIMPLEMENTED: 12,
  INTERNAL: 13,
  UNAVAILABLE: 14,
  DATA_LOSS: 15,
  UNAUTHENTICATED: 16
} as const;

// WebSocket关闭码
export const WEBSOCKET_CLOSE_CODES = {
  NORMAL_CLOSURE: 1000,
  GOING_AWAY: 1001,
  PROTOCOL_ERROR: 1002,
  UNSUPPORTED_DATA: 1003,
  NO_STATUS_RECEIVED: 1005,
  ABNORMAL_CLOSURE: 1006,
  INVALID_FRAME_PAYLOAD_DATA: 1007,
  POLICY_VIOLATION: 1008,
  MESSAGE_TOO_BIG: 1009,
  MANDATORY_EXTENSION: 1010,
  INTERNAL_ERROR: 1011,
  SERVICE_RESTART: 1012,
  TRY_AGAIN_LATER: 1013,
  BAD_GATEWAY: 1014,
  TLS_HANDSHAKE: 1015
} as const;

// 协议类型
export const PROTOCOL_TYPES = {
  HTTP: 'http',
  GRPC: 'grpc',
  WEBSOCKET: 'websocket',
  UCP: 'ucp',
  TCP: 'tcp',
  UDP: 'udp'
} as const;

// 序列化格式
export const SERIALIZATION_FORMATS = {
  JSON: 'json',
  PROTOBUF: 'protobuf',
  MESSAGEPACK: 'messagepack',
  AVRO: 'avro',
  BINARY: 'binary'
} as const;

// 压缩算法
export const COMPRESSION_ALGORITHMS = {
  NONE: 'none',
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BROTLI: 'brotli',
  LZ4: 'lz4'
} as const;

// 测试环境配置
export const TEST_ENV = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'error',
  DISABLE_COLORS: 'true',
  FORCE_COLOR: '0'
} as const;

// 测试标签
export const TEST_TAGS = {
  UNIT: 'unit',
  INTEGRATION: 'integration',
  E2E: 'e2e',
  PERFORMANCE: 'performance',
  SMOKE: 'smoke',
  REGRESSION: 'regression',
  FLAKY: 'flaky',
  SLOW: 'slow'
} as const;

// 测试优先级
export const TEST_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low'
} as const;
