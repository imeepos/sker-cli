/**
 * @sker/protocol-websocket - WebSocket常量定义
 */

import { 
  ServerConfig, 
  ClientConfig, 
  RoomConfig,
  NamespaceConfig,
  HeartbeatConfig,
  MessageConfig,
  RateLimitConfig,
  CompressionAlgorithm,
  RoleType
} from '../types/websocket-types.js';

// WebSocket状态码
export const WebSocketCloseCode = {
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
  TLS_HANDSHAKE: 1015,
  
  // 自定义状态码
  AUTHENTICATION_FAILED: 4001,
  AUTHORIZATION_FAILED: 4002,
  RATE_LIMITED: 4003,
  USER_BANNED: 4004,
  ROOM_FULL: 4005,
  INVALID_MESSAGE: 4006,
  DUPLICATE_CONNECTION: 4007,
  SERVER_MAINTENANCE: 4008
} as const;

// 消息类型常量
export const MessageTypes = {
  // 系统消息
  PING: 'ping',
  PONG: 'pong',
  WELCOME: 'welcome',
  ERROR: 'error',
  
  // 认证消息
  AUTH: 'auth',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',
  
  // 房间消息
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_MESSAGE: 'room_message',
  ROOM_BROADCAST: 'room_broadcast',
  
  // 用户消息
  USER_MESSAGE: 'user_message',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  USER_TYPING: 'user_typing',
  USER_STATUS: 'user_status',
  
  // 管理消息
  BAN_USER: 'ban_user',
  UNBAN_USER: 'unban_user',
  MUTE_USER: 'mute_user',
  UNMUTE_USER: 'unmute_user',
  KICK_USER: 'kick_user',
  
  // 系统通知
  SYSTEM_MESSAGE: 'system_message',
  MAINTENANCE: 'maintenance',
  SHUTDOWN: 'shutdown'
} as const;

// 事件常量
export const WebSocketEvent = {
  // 连接事件
  CONNECTION: 'connection',
  DISCONNECT: 'disconnect',
  CONNECT: 'connect',
  RECONNECT: 'reconnect',
  RECONNECTING: 'reconnecting',
  RECONNECT_FAILED: 'reconnect_failed',
  
  // 消息事件
  MESSAGE: 'message',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_FAILED: 'message_failed',
  
  // 房间事件
  ROOM_CREATED: 'room_created',
  ROOM_DELETED: 'room_deleted',
  ROOM_UPDATED: 'room_updated',
  
  // 错误事件
  ERROR: 'error',
  CONNECTION_ERROR: 'connection_error',
  MESSAGE_ERROR: 'message_error',
  
  // 状态事件
  STATE_CHANGED: 'state_changed',
  READY: 'ready'
} as const;

// 默认配置
export const DEFAULT_HEARTBEAT_CONFIG: HeartbeatConfig = {
  enabled: true,
  interval: 30000,
  timeout: 10000,
  maxMissed: 3,
  pingMessage: { type: MessageTypes.PING },
  pongMessage: { type: MessageTypes.PONG }
};

export const DEFAULT_MESSAGE_CONFIG: MessageConfig = {
  maxSize: 1024 * 1024, // 1MB
  encoding: 'utf8',
  compression: {
    enabled: true,
    threshold: 1024,
    algorithm: 'deflate'
  },
  queue: {
    enabled: true,
    maxSize: 1000,
    retryOnReconnect: true
  }
};

export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  enabled: true,
  connection: {
    maxPerIP: 100,
    maxPerUser: 10,
    windowMs: 60000
  },
  message: {
    maxPerMinute: 60,
    maxPerSecond: 10,
    burstSize: 20
  }
};

export const DEFAULT_SERVER_CONFIG: Partial<ServerConfig> = {
  host: '0.0.0.0',
  port: 8080,
  websocket: {
    heartbeat: DEFAULT_HEARTBEAT_CONFIG,
    message: DEFAULT_MESSAGE_CONFIG,
    connection: {
      maxConnections: 10000,
      idleTimeout: 300000,
      maxBacklog: 1000
    }
  },
  auth: {
    enabled: false,
    tokenHeader: 'Authorization',
    tokenParam: 'token'
  },
  cors: {
    enabled: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true
  },
  rateLimit: DEFAULT_RATE_LIMIT_CONFIG,
  performance: {
    maxConnections: 50000,
    maxConnectionsPerIP: 100,
    connectionTimeout: 30000,
    idleTimeout: 300000,
    memory: {
      maxHeapUsage: '2GB',
      gcInterval: 60000,
      connectionPoolSize: 10000
    },
    message: {
      maxConcurrentMessages: 10000,
      messageQueueSize: 100000,
      processingTimeout: 30000,
      batchSize: 100
    }
  },
  security: {
    ddosProtection: {
      enabled: true,
      maxConnectionsPerIP: 50,
      maxRequestsPerMinute: 1000,
      banDuration: 3600000
    },
    accessControl: {
      enabled: false
    }
  },
  monitoring: {
    enabled: true,
    metrics: {
      enabled: true,
      interval: 10000,
      retention: 86400000
    },
    health: {
      enabled: true,
      port: 8081,
      path: '/health',
      checks: ['memory', 'connections', 'message-queue']
    },
    logging: {
      level: 'info',
      format: 'json',
      outputs: ['console'],
      structured: {
        enabled: true,
        fields: ['timestamp', 'level', 'message', 'connectionId', 'userId']
      }
    }
  }
};

export const DEFAULT_CLIENT_CONFIG: Partial<ClientConfig> = {
  reconnect: {
    enabled: true,
    maxAttempts: 10,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffFactor: 1.5,
    jitter: 0.1
  },
  heartbeat: {
    enabled: true,
    interval: 25000,
    timeout: 10000,
    pingMessage: { type: MessageTypes.PING },
    pongMessage: { type: MessageTypes.PONG }
  },
  message: {
    maxSize: 1024 * 1024,
    compression: {
      enabled: true
    },
    queue: {
      enabled: true,
      maxSize: 1000,
      retryOnReconnect: true
    }
  },
  transport: {
    websocket: {
      maxPayload: 1024 * 1024,
      compression: {
        enabled: true,
        threshold: 1024,
        algorithm: 'deflate' as CompressionAlgorithm
      },
      frames: {
        maxFrameSize: 65536,
        autoFragment: true
      }
    },
    polling: {
      enabled: true,
      interval: 1000,
      maxInterval: 30000,
      timeout: 60000
    }
  },
  buffer: {
    send: {
      maxSize: 1000,
      flushInterval: 100,
      priority: true
    },
    receive: {
      maxSize: 5000,
      processInterval: 10,
      batchSize: 50
    }
  },
  debug: {
    enabled: false,
    logLevel: 'info',
    logMessages: false
  }
};

export const DEFAULT_ROOM_CONFIG: RoomConfig = {
  maxUsers: 100,
  persistent: false,
  permissions: {
    defaultRole: 'member',
    roles: {
      owner: {
        canSendMessage: true,
        canInviteUsers: true,
        canKickUsers: true,
        canManageRoom: true,
        canDeleteRoom: true,
        canModerateContent: true
      },
      admin: {
        canSendMessage: true,
        canInviteUsers: true,
        canKickUsers: true,
        canManageRoom: true,
        canDeleteRoom: false,
        canModerateContent: true
      },
      moderator: {
        canSendMessage: true,
        canInviteUsers: false,
        canKickUsers: true,
        canManageRoom: false,
        canDeleteRoom: false,
        canModerateContent: true
      },
      member: {
        canSendMessage: true,
        canInviteUsers: false,
        canKickUsers: false,
        canManageRoom: false,
        canDeleteRoom: false,
        canModerateContent: false
      },
      guest: {
        canSendMessage: false,
        canInviteUsers: false,
        canKickUsers: false,
        canManageRoom: false,
        canDeleteRoom: false,
        canModerateContent: false
      }
    }
  },
  message: {
    maxLength: 2000,
    allowEmojis: true,
    allowFiles: true,
    allowImages: true,
    historySize: 1000,
    rateLimitPerMinute: 60
  },
  behavior: {
    autoDeleteWhenEmpty: false,
    emptyTimeout: 300000,
    moderation: {
      enabled: false,
      bannedWords: [],
      maxWarnings: 3,
      autoMute: false
    }
  }
};

export const DEFAULT_NAMESPACE_CONFIG: NamespaceConfig = {
  auth: {
    required: false,
    roles: ['member', 'admin'] as RoleType[]
  },
  rateLimit: {
    messagesPerMinute: 60,
    connectionsPerIP: 10
  },
  features: []
};

// 正则表达式常量
export const REGEX = {
  ROOM_NAME: /^[a-zA-Z0-9_-]{1,50}$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  IP_ADDRESS: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
} as const;

// 错误消息常量
export const ERROR_MESSAGES = {
  CONNECTION_FAILED: 'Failed to establish WebSocket connection',
  AUTHENTICATION_FAILED: 'Authentication failed',
  AUTHORIZATION_FAILED: 'Authorization failed',
  RATE_LIMITED: 'Rate limit exceeded',
  MESSAGE_TOO_LARGE: 'Message size exceeds limit',
  ROOM_NOT_FOUND: 'Room not found',
  ROOM_FULL: 'Room is full',
  USER_NOT_IN_ROOM: 'User is not in the room',
  INVALID_MESSAGE_FORMAT: 'Invalid message format',
  CONNECTION_TIMEOUT: 'Connection timeout',
  HEARTBEAT_TIMEOUT: 'Heartbeat timeout',
  SERVER_ERROR: 'Internal server error'
} as const;

// 系统常量
export const SYSTEM = {
  MAX_RECONNECT_ATTEMPTS: 10,
  MIN_HEARTBEAT_INTERVAL: 10000, // 10秒
  MAX_HEARTBEAT_INTERVAL: 300000, // 5分钟
  MIN_MESSAGE_SIZE: 1,
  MAX_MESSAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MIN_ROOM_NAME_LENGTH: 1,
  MAX_ROOM_NAME_LENGTH: 50,
  MIN_USERNAME_LENGTH: 3,
  MAX_USERNAME_LENGTH: 30,
  CONNECTION_ID_LENGTH: 16,
  MESSAGE_ID_LENGTH: 16,
  ROOM_ID_LENGTH: 16,
  USER_ID_LENGTH: 16
} as const;

// 度量指标常量
export const METRICS = {
  COUNTER: {
    CONNECTIONS_TOTAL: 'websocket_connections_total',
    CONNECTIONS_ACTIVE: 'websocket_connections_active',
    MESSAGES_SENT: 'websocket_messages_sent_total',
    MESSAGES_RECEIVED: 'websocket_messages_received_total',
    ERRORS_TOTAL: 'websocket_errors_total',
    BYTES_SENT: 'websocket_bytes_sent_total',
    BYTES_RECEIVED: 'websocket_bytes_received_total'
  },
  HISTOGRAM: {
    MESSAGE_SIZE: 'websocket_message_size_bytes',
    CONNECTION_DURATION: 'websocket_connection_duration_seconds',
    MESSAGE_PROCESSING_TIME: 'websocket_message_processing_seconds'
  },
  GAUGE: {
    ACTIVE_CONNECTIONS: 'websocket_active_connections',
    ACTIVE_ROOMS: 'websocket_active_rooms',
    MEMORY_USAGE: 'websocket_memory_usage_bytes',
    CPU_USAGE: 'websocket_cpu_usage_percent'
  }
} as const;