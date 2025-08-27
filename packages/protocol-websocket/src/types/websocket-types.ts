/**
 * @sker/protocol-websocket - WebSocket类型定义
 */

import { EventEmitter } from 'events';

// 基础类型
export type WebSocketState = 'CONNECTING' | 'OPEN' | 'CLOSING' | 'CLOSED';
export type MessageType = 'text' | 'binary' | 'ping' | 'pong' | 'close';
export type ConnectionEvent = 'open' | 'message' | 'error' | 'close' | 'ping' | 'pong';
export type CompressionAlgorithm = 'deflate' | 'gzip' | 'none';
export type AuthType = 'jwt' | 'apikey' | 'oauth2' | 'custom';
export type RoleType = 'owner' | 'admin' | 'moderator' | 'member' | 'guest';

// 用户相关类型
export interface User {
  id: string;
  username: string;
  email?: string;
  roles: RoleType[];
  permissions: string[];
  metadata: Record<string, any>;
  createdAt: Date;
  lastActiveAt: Date;
}

// 连接相关类型
export interface ConnectionInfo {
  id: string;
  ip: string;
  userAgent?: string;
  origin?: string;
  protocol?: string;
  connectedAt: Date;
  lastPingAt?: Date;
  lastPongAt?: Date;
}

export interface WebSocketConnection extends EventEmitter {
  id: string;
  user?: User;
  info: ConnectionInfo;
  rooms: Set<string>;
  state: WebSocketState;
  clientVersion?: string;
  platform?: string;
  send(message: any): Promise<void>;
  close(code?: number, reason?: string): void;
  ping(): void;
  isAlive(): boolean;
}

// 消息相关类型
export interface Message {
  id?: string;
  type: string;
  data?: any;
  timestamp?: string;
  correlation?: string;
  metadata?: Record<string, any>;
}

export interface MessageEnvelope {
  message: Message;
  connection: WebSocketConnection;
  room?: string;
  namespace?: string;
}

export interface MessageHandler {
  handleMessage(connection: WebSocketConnection, message: any): Promise<void>;
}

// 认证相关类型
export interface AuthConfig {
  enabled: boolean;
  tokenHeader?: string;
  tokenParam?: string;
  jwt?: JWTConfig;
  apiKey?: APIKeyConfig;
  oauth2?: OAuth2Config;
  authenticate?: (token: string) => Promise<User>;
}

export interface JWTConfig {
  secret: string;
  algorithms: string[];
  issuer?: string;
  audience?: string;
  expiresIn?: string;
}

export interface APIKeyConfig {
  headerName: string;
  validateKey: (key: string) => Promise<User>;
}

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  tokenUrl: string;
  validateToken: (token: string) => Promise<User>;
}

// 心跳配置
export interface HeartbeatConfig {
  enabled: boolean;
  interval: number;
  timeout: number;
  maxMissed?: number;
  pingMessage?: any;
  pongMessage?: any;
}

// 消息配置
export interface MessageConfig {
  maxSize: number;
  encoding?: string;
  compression?: CompressionConfig;
  queue?: MessageQueueConfig;
}

export interface CompressionConfig {
  enabled: boolean;
  threshold?: number;
  algorithm?: CompressionAlgorithm;
}

export interface MessageQueueConfig {
  enabled: boolean;
  maxSize: number;
  retryOnReconnect?: boolean;
}

// 连接配置
export interface ConnectionConfig {
  maxConnections?: number;
  maxConnectionsPerIP?: number;
  maxConnectionsPerUser?: number;
  idleTimeout?: number;
  maxBacklog?: number;
  windowMs?: number;
}

// CORS配置
export interface CORSConfig {
  enabled: boolean;
  origin?: string | string[];
  methods?: string[];
  allowedHeaders?: string[];
  credentials?: boolean;
}

// 限流配置
export interface RateLimitConfig {
  enabled: boolean;
  connection?: {
    maxPerIP: number;
    maxPerUser: number;
    windowMs: number;
  };
  message?: {
    maxPerMinute: number;
    maxPerSecond: number;
    burstSize?: number;
  };
}

// 性能配置
export interface PerformanceConfig {
  maxConnections: number;
  maxConnectionsPerIP: number;
  connectionTimeout: number;
  idleTimeout: number;
  memory?: {
    maxHeapUsage: string;
    gcInterval: number;
    connectionPoolSize: number;
  };
  message?: {
    maxConcurrentMessages: number;
    messageQueueSize: number;
    processingTimeout: number;
    batchSize: number;
  };
}

// 安全配置
export interface SecurityConfig {
  tls?: TLSConfig;
  ddosProtection?: DDoSProtectionConfig;
  accessControl?: AccessControlConfig;
}

export interface TLSConfig {
  enabled: boolean;
  keyFile?: string;
  certFile?: string;
  caFile?: string;
  secureProtocol?: string;
  ciphers?: string;
  honorCipherOrder?: boolean;
}

export interface DDoSProtectionConfig {
  enabled: boolean;
  maxConnectionsPerIP: number;
  maxRequestsPerMinute: number;
  banDuration: number;
  anomalyDetection?: {
    enabled: boolean;
    threshold: number;
    windowSize: number;
  };
}

export interface AccessControlConfig {
  enabled: boolean;
  whitelist?: string[];
  blacklist?: string[];
  geoBlocking?: {
    enabled: boolean;
    blockedCountries: string[];
  };
}

// 监控配置
export interface MonitoringConfig {
  enabled: boolean;
  metrics?: MetricsConfig;
  health?: HealthConfig;
  logging?: LoggingConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  interval: number;
  retention: number;
  prometheus?: {
    enabled: boolean;
    port: number;
    path: string;
  };
}

export interface HealthConfig {
  enabled: boolean;
  port: number;
  path: string;
  checks: string[];
}

export interface LoggingConfig {
  level: string;
  format: string;
  outputs: string[];
  file?: {
    path: string;
    maxSize: string;
    maxFiles: number;
    compress: boolean;
  };
  structured?: {
    enabled: boolean;
    fields: string[];
  };
}

// 集群配置
export interface ClusterConfig {
  enabled: boolean;
  workers?: number | 'auto';
  strategy?: 'round-robin' | 'least-connections' | 'ip-hash';
  redis?: {
    host: string;
    port: number;
    password?: string;
    keyPrefix?: string;
  };
}

// 服务器配置
export interface ServerConfig {
  port: number;
  host: string;
  protocols?: string[];
  websocket?: {
    heartbeat?: HeartbeatConfig;
    message?: MessageConfig;
    connection?: ConnectionConfig;
  };
  auth?: AuthConfig;
  cors?: CORSConfig;
  rateLimit?: RateLimitConfig;
  cluster?: ClusterConfig;
  performance?: PerformanceConfig;
  security?: SecurityConfig;
  monitoring?: MonitoringConfig;
}

// 重连配置
export interface ReconnectConfig {
  enabled: boolean;
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  jitter?: number;
}

// 传输配置
export interface TransportConfig {
  websocket?: {
    maxPayload: number;
    compression?: CompressionConfig;
    frames?: {
      maxFrameSize: number;
      autoFragment: boolean;
    };
  };
  polling?: {
    enabled: boolean;
    interval: number;
    maxInterval: number;
    timeout: number;
  };
}

// 缓冲区配置
export interface BufferConfig {
  send?: {
    maxSize: number;
    flushInterval: number;
    priority?: boolean;
  };
  receive?: {
    maxSize: number;
    processInterval: number;
    batchSize: number;
  };
}

// 状态管理配置
export interface StateConfig {
  persistence?: {
    enabled: boolean;
    storage: 'localStorage' | 'sessionStorage' | 'memory';
    key: string;
    sync?: {
      enabled: boolean;
      interval: number;
      conflictResolution: 'client-wins' | 'server-wins';
    };
  };
  offline?: {
    enabled: boolean;
    queueSize: number;
    syncOnReconnect: boolean;
    storage?: {
      type: 'indexeddb' | 'websql' | 'memory';
      maxSize: string;
      ttl: number;
    };
  };
}

// 客户端配置
export interface ClientConfig {
  url: string;
  protocols?: string[];
  auth?: {
    type: AuthType;
    token?: string;
    getToken?: () => Promise<string>;
    refreshToken?: () => Promise<string>;
  };
  reconnect?: ReconnectConfig;
  heartbeat?: HeartbeatConfig;
  message?: MessageConfig;
  transport?: TransportConfig;
  buffer?: BufferConfig;
  state?: StateConfig;
  debug?: {
    enabled: boolean;
    logLevel: string;
    logMessages?: boolean;
  };
}

// 房间相关类型
export interface RoomPermission {
  canSendMessage?: boolean;
  canInviteUsers?: boolean;
  canKickUsers?: boolean;
  canManageRoom?: boolean;
  canDeleteRoom?: boolean;
  canModerateContent?: boolean;
}

export interface RoomConfig {
  maxUsers: number;
  persistent: boolean;
  password?: string;
  permissions: {
    defaultRole: RoleType;
    roles: Record<RoleType, RoomPermission>;
  };
  message?: {
    maxLength: number;
    allowEmojis: boolean;
    allowFiles: boolean;
    allowImages: boolean;
    historySize: number;
    rateLimitPerMinute: number;
  };
  behavior?: {
    autoDeleteWhenEmpty?: boolean;
    emptyTimeout?: number;
    welcomeMessage?: string;
    moderation?: {
      enabled: boolean;
      bannedWords?: string[];
      maxWarnings?: number;
      autoMute?: boolean;
    };
  };
}

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  config: RoomConfig;
  users: Map<string, RoleType>;
  bannedUsers: Set<string>;
  mutedUsers: Map<string, Date>;
  userWarnings: Map<string, number>;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  
  addUser(userId: string, role?: RoleType): void;
  removeUser(userId: string): void;
  getUserRole(userId: string): RoleType;
  hasPermission(userId: string, permission: keyof RoomPermission): boolean;
  addMessage(message: Message): void;
  getMessages(limit?: number, offset?: number): Message[];
}

// 命名空间相关类型
export interface NamespaceConfig {
  auth?: {
    required: boolean;
    roles?: RoleType[];
  };
  rateLimit?: {
    messagesPerMinute: number;
    connectionsPerIP: number;
  };
  features?: string[];
}

export interface Namespace {
  path: string;
  config: NamespaceConfig;
  connections: Map<string, WebSocketConnection>;
  rooms: Map<string, Room>;
  
  addConnection(connection: WebSocketConnection): void;
  removeConnection(connectionId: string): void;
  broadcast(message: any, exclude?: string[]): void;
  broadcastToRoom(roomId: string, message: any, exclude?: string[]): void;
}

// 事件相关类型
export interface EventFilter {
  name: string;
  condition: (connection: WebSocketConnection, event: any) => boolean;
  action: 'allow' | 'reject' | 'modify';
  message?: string;
  modifier?: (event: any) => any;
}

export interface EventRoute {
  namespace: string;
  event: string;
  handler: (connection: WebSocketConnection, data: any) => Promise<void>;
}

// 中间件类型
export interface Middleware {
  name: string;
  execute(connection: WebSocketConnection, message: any, next: () => void): Promise<void>;
}

// 错误类型
export interface WebSocketError extends Error {
  code?: string;
  statusCode?: number;
  connection?: WebSocketConnection;
  data?: any;
}

// 指标类型
export interface ConnectionMetrics {
  totalConnections: number;
  activeConnections: number;
  connectionsByNamespace: Map<string, number>;
  connectionsByRoom: Map<string, number>;
  messagesPerSecond: number;
  bytesTransferred: number;
  errorCount: number;
}

export interface PerformanceMetrics {
  cpu: number;
  memory: number;
  eventLoopLag: number;
  avgResponseTime: number;
  throughput: number;
}