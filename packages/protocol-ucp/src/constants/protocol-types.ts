/**
 * 协议常量定义
 */

/**
 * 默认端口配置
 */
export const DEFAULT_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  WEBSOCKET: 8080,
  WEBSOCKET_SECURE: 8443,
  GRPC: 50051,
  TCP: 9000,
  UDP: 9001,
  RABBITMQ: 5672,
  KAFKA: 9092,
  REDIS: 6379,
  PULSAR: 6650
} as const;

/**
 * 默认超时配置
 */
export const DEFAULT_TIMEOUTS = {
  CONNECTION: 10000,      // 连接超时 10秒
  REQUEST: 30000,         // 请求超时 30秒
  STREAM: 0,              // 流无超时
  HEARTBEAT: 30000,       // 心跳间隔 30秒
  PING: 5000,             // ping超时 5秒
  VALIDATION: 5000,       // 连接验证超时 5秒
  IDLE: 300000,           // 连接空闲超时 5分钟
  ACQUIRE: 30000          // 连接获取超时 30秒
} as const;

/**
 * 重试策略配置
 */
export const DEFAULT_RETRY = {
  MAX_ATTEMPTS: 3,
  BASE_DELAY: 1000,       // 基础延迟 1秒
  MAX_DELAY: 30000,       // 最大延迟 30秒
  BACKOFF_MULTIPLIER: 2,  // 指数退避倍数
  JITTER: true            // 启用抖动
} as const;

/**
 * 连接池配置
 */
export const DEFAULT_POOL = {
  MAX_CONNECTIONS_PER_TARGET: 10,
  MIN_CONNECTIONS: 1,
  IDLE_TIMEOUT: 300000,           // 5分钟
  ACQUIRE_TIMEOUT: 30000,         // 30秒
  VALIDATION_INTERVAL: 300000,    // 5分钟
  CLEANUP_INTERVAL: 60000         // 1分钟
} as const;

/**
 * 消息限制
 */
export const MESSAGE_LIMITS = {
  HTTP: {
    MAX_HEADERS_SIZE: 8192,         // 8KB
    MAX_URL_LENGTH: 2048,           // 2KB
    MAX_BODY_SIZE: 10 * 1024 * 1024 // 10MB
  },
  WEBSOCKET: {
    MAX_FRAME_SIZE: 1024 * 1024,    // 1MB
    MAX_MESSAGE_SIZE: 10 * 1024 * 1024 // 10MB
  },
  GRPC: {
    MAX_RECEIVE_MESSAGE_SIZE: 4 * 1024 * 1024, // 4MB
    MAX_SEND_MESSAGE_SIZE: 4 * 1024 * 1024,    // 4MB
    MAX_METADATA_SIZE: 8192                     // 8KB
  },
  MESSAGE_QUEUE: {
    MAX_MESSAGE_SIZE: 256 * 1024,   // 256KB
    MAX_QUEUE_SIZE: 10000           // 10K messages
  }
} as const;

/**
 * 协议特性支持矩阵
 */
export const PROTOCOL_FEATURES = {
  HTTP: {
    synchronous: true,
    asynchronous: false,
    streaming: true,      // SSE
    bidirectional: false,
    connectionless: true,
    reliable: true,
    ordered: true,
    compression: true,
    encryption: true
  },
  WEBSOCKET: {
    synchronous: false,
    asynchronous: true,
    streaming: true,
    bidirectional: true,
    connectionless: false,
    reliable: true,
    ordered: true,
    compression: true,
    encryption: true
  },
  GRPC: {
    synchronous: true,
    asynchronous: true,
    streaming: true,
    bidirectional: true,
    connectionless: false,
    reliable: true,
    ordered: true,
    compression: true,
    encryption: true
  },
  TCP: {
    synchronous: true,
    asynchronous: true,
    streaming: true,
    bidirectional: true,
    connectionless: false,
    reliable: true,
    ordered: true,
    compression: false,
    encryption: false
  },
  UDP: {
    synchronous: false,
    asynchronous: true,
    streaming: false,
    bidirectional: true,
    connectionless: true,
    reliable: false,
    ordered: false,
    compression: false,
    encryption: false
  },
  MESSAGE_QUEUE: {
    synchronous: false,
    asynchronous: true,
    streaming: true,
    bidirectional: false,
    connectionless: true,
    reliable: true,
    ordered: false,  // 取决于具体实现
    compression: true,
    encryption: true
  }
} as const;

/**
 * 协议优先级权重
 */
export const PROTOCOL_WEIGHTS = {
  LATENCY: {
    UDP: 1.0,
    TCP: 0.9,
    GRPC: 0.8,
    WEBSOCKET: 0.7,
    HTTP: 0.6,
    MESSAGE_QUEUE: 0.3
  },
  THROUGHPUT: {
    GRPC: 1.0,
    TCP: 0.9,
    WEBSOCKET: 0.8,
    HTTP: 0.7,
    UDP: 0.6,
    MESSAGE_QUEUE: 0.5
  },
  RELIABILITY: {
    GRPC: 1.0,
    HTTP: 0.95,
    TCP: 0.9,
    WEBSOCKET: 0.85,
    MESSAGE_QUEUE: 0.8,
    UDP: 0.3
  }
} as const;

/**
 * 错误重试配置
 */
export const RETRY_CONDITIONS = {
  CONNECTION_ERRORS: [
    'CONNECTION_FAILED',
    'CONNECTION_TIMEOUT',
    'CONNECTION_LOST',
    'CONNECTION_REFUSED'
  ],
  TEMPORARY_ERRORS: [
    'TIMEOUT',
    'SERVICE_UNAVAILABLE',
    'SERVICE_OVERLOADED',
    'RESOURCE_EXHAUSTED',
    'RATE_LIMITED',
    'INTERNAL_ERROR'
  ],
  FATAL_ERRORS: [
    'AUTHENTICATION_FAILED',
    'AUTHORIZATION_FAILED',
    'INVALID_REQUEST',
    'METHOD_NOT_FOUND',
    'SERVICE_NOT_FOUND',
    'PROTOCOL_NOT_SUPPORTED'
  ]
} as const;

/**
 * 性能监控指标
 */
export const PERFORMANCE_METRICS = {
  REQUEST_COUNT: 'request_count',
  REQUEST_DURATION: 'request_duration',
  REQUEST_SIZE: 'request_size',
  RESPONSE_SIZE: 'response_size',
  ERROR_RATE: 'error_rate',
  CONNECTION_COUNT: 'connection_count',
  CONNECTION_POOL_SIZE: 'connection_pool_size',
  THROUGHPUT: 'throughput',
  LATENCY_P50: 'latency_p50',
  LATENCY_P95: 'latency_p95',
  LATENCY_P99: 'latency_p99'
} as const;

/**
 * 健康检查配置
 */
export const HEALTH_CHECK = {
  INTERVAL: 30000,        // 30秒
  TIMEOUT: 5000,          // 5秒
  RETRIES: 3,
  THRESHOLD: 0.5,         // 50%成功率阈值
  ENDPOINTS: {
    HTTP: '/health',
    GRPC: 'Health.Check',
    WEBSOCKET: 'health',
    MESSAGE_QUEUE: 'health_queue'
  }
} as const;

/**
 * 服务发现配置
 */
export const SERVICE_DISCOVERY = {
  DEFAULT_TTL: 30,        // 30秒
  REFRESH_INTERVAL: 15000, // 15秒
  CACHE_SIZE: 1000,
  RETRY_INTERVAL: 5000    // 5秒
} as const;

/**
 * 负载均衡策略
 */
export const LOAD_BALANCE_STRATEGIES = [
  'round_robin',
  'least_connections',
  'random',
  'weighted_random',
  'least_latency',
  'consistent_hash'
] as const;

/**
 * 中间件执行顺序
 */
export const MIDDLEWARE_ORDER = [
  'logging',
  'tracing',
  'metrics',
  'authentication',
  'authorization',
  'rate_limiting',
  'circuit_breaker',
  'retry',
  'validation',
  'compression',
  'encryption'
] as const;

/**
 * 协议适配器注册表
 */
export const ADAPTER_REGISTRY = {
  HTTP: 'HttpProtocolAdapter',
  WEBSOCKET: 'WebSocketProtocolAdapter',
  GRPC: 'GrpcProtocolAdapter',
  MESSAGE_QUEUE: 'MessageQueueProtocolAdapter',
  TCP: 'TcpProtocolAdapter',
  UDP: 'UdpProtocolAdapter'
} as const;

/**
 * 事件名称常量
 */
export const EVENTS = {
  // 连接事件
  CONNECTION_ESTABLISHED: 'connection.established',
  CONNECTION_LOST: 'connection.lost',
  CONNECTION_FAILED: 'connection.failed',
  CONNECTION_RESTORED: 'connection.restored',
  
  // 请求事件
  REQUEST_STARTED: 'request.started',
  REQUEST_COMPLETED: 'request.completed',
  REQUEST_FAILED: 'request.failed',
  REQUEST_TIMEOUT: 'request.timeout',
  
  // 协议事件
  PROTOCOL_SELECTED: 'protocol.selected',
  PROTOCOL_SWITCHED: 'protocol.switched',
  PROTOCOL_ERROR: 'protocol.error',
  
  // 池事件
  POOL_CONNECTION_ACQUIRED: 'pool.connection.acquired',
  POOL_CONNECTION_RELEASED: 'pool.connection.released',
  POOL_CONNECTION_CREATED: 'pool.connection.created',
  POOL_CONNECTION_DESTROYED: 'pool.connection.destroyed',
  
  // 服务发现事件
  SERVICE_DISCOVERED: 'service.discovered',
  SERVICE_LOST: 'service.lost',
  SERVICE_HEALTH_CHANGED: 'service.health.changed'
} as const;

/**
 * 协议标识符
 */
export const PROTOCOL_IDENTIFIERS = {
  HTTP: {
    schemes: ['http', 'https'],
    defaultPort: 80,
    securePort: 443,
    contentType: 'application/json'
  },
  WEBSOCKET: {
    schemes: ['ws', 'wss'],
    defaultPort: 8080,
    securePort: 8443,
    protocol: 'sker-ucp-v1'
  },
  GRPC: {
    schemes: ['grpc', 'grpcs'],
    defaultPort: 50051,
    securePort: 443,
    contentType: 'application/grpc'
  },
  MESSAGE_QUEUE: {
    schemes: ['amqp', 'kafka', 'redis'],
    defaultPort: 5672,
    exchange: 'sker.ucp',
    routingKey: 'rpc'
  }
} as const;