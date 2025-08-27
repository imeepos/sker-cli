/**
 * gRPC协议相关常量
 */

export const GRPC_STATUS_CODES = {
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

export const GRPC_STATUS_NAMES = {
  [GRPC_STATUS_CODES.OK]: 'OK',
  [GRPC_STATUS_CODES.CANCELLED]: 'CANCELLED',
  [GRPC_STATUS_CODES.UNKNOWN]: 'UNKNOWN',
  [GRPC_STATUS_CODES.INVALID_ARGUMENT]: 'INVALID_ARGUMENT',
  [GRPC_STATUS_CODES.DEADLINE_EXCEEDED]: 'DEADLINE_EXCEEDED',
  [GRPC_STATUS_CODES.NOT_FOUND]: 'NOT_FOUND',
  [GRPC_STATUS_CODES.ALREADY_EXISTS]: 'ALREADY_EXISTS',
  [GRPC_STATUS_CODES.PERMISSION_DENIED]: 'PERMISSION_DENIED',
  [GRPC_STATUS_CODES.RESOURCE_EXHAUSTED]: 'RESOURCE_EXHAUSTED',
  [GRPC_STATUS_CODES.FAILED_PRECONDITION]: 'FAILED_PRECONDITION',
  [GRPC_STATUS_CODES.ABORTED]: 'ABORTED',
  [GRPC_STATUS_CODES.OUT_OF_RANGE]: 'OUT_OF_RANGE',
  [GRPC_STATUS_CODES.UNIMPLEMENTED]: 'UNIMPLEMENTED',
  [GRPC_STATUS_CODES.INTERNAL]: 'INTERNAL',
  [GRPC_STATUS_CODES.UNAVAILABLE]: 'UNAVAILABLE',
  [GRPC_STATUS_CODES.DATA_LOSS]: 'DATA_LOSS',
  [GRPC_STATUS_CODES.UNAUTHENTICATED]: 'UNAUTHENTICATED'
} as const;

export const DEFAULT_SERVER_CONFIG = {
  host: '0.0.0.0',
  port: 50051,
  maxConnections: 1000,
  maxReceiveMessageSize: 4 * 1024 * 1024, // 4MB
  maxSendMessageSize: 4 * 1024 * 1024,    // 4MB
  keepAlive: {
    enabled: true,
    time: 7200000,      // 2小时
    timeout: 20000,     // 20秒
    permitWithoutStream: true
  },
  compression: {
    enabled: true,
    algorithms: ['gzip', 'deflate']
  }
} as const;

export const DEFAULT_CLIENT_CONFIG = {
  defaultTimeout: 30000,              // 30秒
  maxReceiveMessageSize: 4 * 1024 * 1024,
  maxSendMessageSize: 4 * 1024 * 1024,
  keepAlive: {
    enabled: true,
    time: 30000,        // 30秒
    timeout: 5000,      // 5秒
    permitWithoutStream: false
  },
  retry: {
    maxAttempts: 3,
    initialBackoff: 1000,     // 1秒
    maxBackoff: 10000,        // 10秒
    backoffMultiplier: 2,
    retryableStatusCodes: ['UNAVAILABLE', 'DEADLINE_EXCEEDED'] as string[]
  }
} as const;

export const COMPRESSION_ALGORITHMS = {
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  IDENTITY: 'identity'
} as const;

export const LOAD_BALANCING_POLICIES = {
  ROUND_ROBIN: 'round_robin',
  PICK_FIRST: 'pick_first',
  GRPCLB: 'grpclb',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  LEAST_REQUESTS: 'least_requests'
} as const;

export const METADATA_HEADERS = {
  AUTHORIZATION: 'authorization',
  USER_AGENT: 'user-agent',
  CONTENT_TYPE: 'content-type',
  ACCEPT_ENCODING: 'accept-encoding',
  GRPC_ENCODING: 'grpc-encoding',
  GRPC_ACCEPT_ENCODING: 'grpc-accept-encoding',
  GRPC_TIMEOUT: 'grpc-timeout',
  GRPC_STATUS: 'grpc-status',
  GRPC_MESSAGE: 'grpc-message'
} as const;

export const HEALTH_CHECK_SERVICE = 'grpc.health.v1.Health';

export const DEFAULT_STREAM_CONFIG = {
  bufferSize: 1024 * 1024,      // 1MB
  maxBufferedMessages: 1000,
  batchSize: 100,
  batchTimeout: 100,
  backpressure: {
    enabled: true,
    highWaterMark: 10000,
    lowWaterMark: 5000,
    strategy: 'drop_oldest' as const
  }
} as const;