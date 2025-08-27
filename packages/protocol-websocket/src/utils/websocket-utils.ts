/**
 * @sker/protocol-websocket - WebSocket工具函数
 */

import { randomBytes, createHash } from 'crypto';
import { generateUUID } from '@sker/utils';
import { 
  WebSocketConnection, 
  Message, 
  User,
  WebSocketState,
  CompressionAlgorithm 
} from '../types/websocket-types.js';
import { SYSTEM, REGEX } from '../constants/websocket-constants.js';

/**
 * 生成连接ID
 */
export function generateConnectionId(): string {
  return generateUUID().replace(/-/g, '').substring(0, SYSTEM.CONNECTION_ID_LENGTH);
}

/**
 * 生成消息ID
 */
export function generateMessageId(): string {
  return generateUUID().replace(/-/g, '').substring(0, SYSTEM.MESSAGE_ID_LENGTH);
}

/**
 * 生成房间ID
 */
export function generateRoomId(): string {
  return generateUUID().replace(/-/g, '').substring(0, SYSTEM.ROOM_ID_LENGTH);
}

/**
 * 验证房间名称
 */
export function validateRoomName(name: string): boolean {
  return REGEX.ROOM_NAME.test(name) && 
         name.length >= SYSTEM.MIN_ROOM_NAME_LENGTH && 
         name.length <= SYSTEM.MAX_ROOM_NAME_LENGTH;
}

/**
 * 验证用户名
 */
export function validateUsername(username: string): boolean {
  return REGEX.USERNAME.test(username) && 
         username.length >= SYSTEM.MIN_USERNAME_LENGTH && 
         username.length <= SYSTEM.MAX_USERNAME_LENGTH;
}

/**
 * 验证邮箱地址
 */
export function validateEmail(email: string): boolean {
  return REGEX.EMAIL.test(email);
}

/**
 * 验证IP地址
 */
export function validateIPAddress(ip: string): boolean {
  return REGEX.IP_ADDRESS.test(ip);
}

/**
 * 验证UUID
 */
export function validateUUID(uuid: string): boolean {
  return REGEX.UUID.test(uuid);
}

/**
 * 验证消息大小
 */
export function validateMessageSize(message: any, maxSize: number = SYSTEM.MAX_MESSAGE_SIZE): boolean {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  const messageSize = Buffer.byteLength(messageStr, 'utf8');
  return messageSize >= SYSTEM.MIN_MESSAGE_SIZE && messageSize <= maxSize;
}

/**
 * 计算消息大小
 */
export function calculateMessageSize(message: any): number {
  const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
  return Buffer.byteLength(messageStr, 'utf8');
}

/**
 * 序列化消息
 */
export function serializeMessage(message: Message): string {
  try {
    return JSON.stringify({
      ...message,
      timestamp: message.timestamp || new Date().toISOString()
    });
  } catch (error) {
    throw new Error(`Failed to serialize message: ${error}`);
  }
}

/**
 * 反序列化消息
 */
export function deserializeMessage(data: string): Message {
  try {
    const message = JSON.parse(data);
    if (!message.type) {
      throw new Error('Message must have a type');
    }
    return message;
  } catch (error) {
    throw new Error(`Failed to deserialize message: ${error}`);
  }
}

/**
 * 压缩数据
 */
export function compressData(data: string, algorithm: CompressionAlgorithm = 'deflate'): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const zlib = require('zlib');
      const buffer = Buffer.from(data, 'utf8');
      
      switch (algorithm) {
        case 'deflate':
          zlib.deflate(buffer, (err: Error | null, result: Buffer) => {
            if (err) reject(err);
            else resolve(result);
          });
          break;
        case 'gzip':
          zlib.gzip(buffer, (err: Error | null, result: Buffer) => {
            if (err) reject(err);
            else resolve(result);
          });
          break;
        default:
          resolve(buffer);
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 解压缩数据
 */
export function decompressData(data: Buffer, algorithm: CompressionAlgorithm = 'deflate'): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const zlib = require('zlib');
      
      switch (algorithm) {
        case 'deflate':
          zlib.inflate(data, (err: Error | null, result: Buffer) => {
            if (err) reject(err);
            else resolve(result.toString('utf8'));
          });
          break;
        case 'gzip':
          zlib.gunzip(data, (err: Error | null, result: Buffer) => {
            if (err) reject(err);
            else resolve(result.toString('utf8'));
          });
          break;
        default:
          resolve(data.toString('utf8'));
      }
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 计算重连延迟（指数退避算法）
 */
export function calculateReconnectDelay(
  attempt: number,
  initialDelay: number = 1000,
  maxDelay: number = 30000,
  backoffFactor: number = 1.5,
  jitter: number = 0.1
): number {
  // 基础延迟计算
  let delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);
  
  // 添加抖动避免雷群效应
  if (jitter > 0) {
    const jitterAmount = delay * jitter;
    delay += Math.random() * jitterAmount - jitterAmount / 2;
  }
  
  return Math.max(delay, 0);
}

/**
 * 格式化连接信息
 */
export function formatConnectionInfo(connection: WebSocketConnection): object {
  return {
    id: connection.id,
    userId: connection.user?.id,
    username: connection.user?.username,
    ip: connection.info.ip,
    userAgent: connection.info.userAgent,
    protocol: connection.info.protocol,
    state: connection.state,
    connectedAt: connection.info.connectedAt,
    rooms: Array.from(connection.rooms),
    platform: connection.platform,
    clientVersion: connection.clientVersion
  };
}

/**
 * 格式化用户信息
 */
export function formatUserInfo(user: User): object {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    roles: user.roles,
    createdAt: user.createdAt,
    lastActiveAt: user.lastActiveAt,
    metadata: user.metadata
  };
}

/**
 * 检查连接是否活跃
 */
export function isConnectionActive(connection: WebSocketConnection): boolean {
  return connection.state === 'OPEN' && connection.isAlive();
}

/**
 * 检查连接是否空闲
 */
export function isConnectionIdle(connection: WebSocketConnection, idleTimeout: number): boolean {
  const lastActivity = connection.user?.lastActiveAt || connection.info.connectedAt;
  return Date.now() - lastActivity.getTime() > idleTimeout;
}

/**
 * 获取连接的心跳状态
 */
export function getHeartbeatStatus(connection: WebSocketConnection): {
  isHealthy: boolean;
  lastPing?: Date;
  lastPong?: Date;
  missedBeats: number;
} {
  const now = new Date();
  const lastPing = connection.info.lastPingAt;
  const lastPong = connection.info.lastPongAt;
  
  let missedBeats = 0;
  let isHealthy = true;
  
  if (lastPing && (!lastPong || lastPong < lastPing)) {
    // 有ping但没有对应的pong
    missedBeats = 1;
    isHealthy = false;
  }
  
  return {
    isHealthy,
    lastPing,
    lastPong,
    missedBeats
  };
}

/**
 * 创建错误消息
 */
export function createErrorMessage(error: string, code?: string, data?: any): Message {
  return {
    id: generateMessageId(),
    type: 'error',
    data: {
      message: error,
      code,
      ...data
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 创建系统消息
 */
export function createSystemMessage(content: string, type: string = 'system'): Message {
  return {
    id: generateMessageId(),
    type,
    data: {
      content,
      system: true
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 创建用户消息
 */
export function createUserMessage(
  content: string, 
  senderId: string, 
  senderName: string,
  roomId?: string
): Message {
  return {
    id: generateMessageId(),
    type: 'user_message',
    data: {
      content,
      senderId,
      senderName,
      roomId
    },
    timestamp: new Date().toISOString()
  };
}

/**
 * 获取客户端信息
 */
export function parseUserAgent(userAgent: string): {
  browser?: string;
  version?: string;
  os?: string;
  device?: string;
} {
  // 简单的用户代理解析
  const result: any = {};
  
  // 检测浏览器
  if (userAgent.includes('Chrome')) {
    result.browser = 'Chrome';
    const match = userAgent.match(/Chrome\/(\d+)/);
    if (match) result.version = match[1];
  } else if (userAgent.includes('Firefox')) {
    result.browser = 'Firefox';
    const match = userAgent.match(/Firefox\/(\d+)/);
    if (match) result.version = match[1];
  } else if (userAgent.includes('Safari')) {
    result.browser = 'Safari';
    const match = userAgent.match(/Version\/(\d+)/);
    if (match) result.version = match[1];
  }
  
  // 检测操作系统
  if (userAgent.includes('Windows')) {
    result.os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    result.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    result.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    result.os = 'Android';
    result.device = 'mobile';
  } else if (userAgent.includes('iOS')) {
    result.os = 'iOS';
    result.device = 'mobile';
  }
  
  // 检测设备类型
  if (userAgent.includes('Mobile')) {
    result.device = 'mobile';
  } else if (userAgent.includes('Tablet')) {
    result.device = 'tablet';
  }
  
  return result;
}

/**
 * 生成JWT Token (简化版)
 */
export function generateJWT(payload: object, secret: string, expiresIn: number = 3600): string {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };
  
  const now = Math.floor(Date.now() / 1000);
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn
  };
  
  const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadBase64 = Buffer.from(JSON.stringify(jwtPayload)).toString('base64url');
  
  const signature = createHash('sha256')
    .update(`${headerBase64}.${payloadBase64}.${secret}`)
    .digest('base64url');
  
  return `${headerBase64}.${payloadBase64}.${signature}`;
}

/**
 * 验证JWT Token (简化版)
 */
export function verifyJWT(token: string, secret: string): object | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const [headerBase64, payloadBase64, signature] = parts;
    
    if (!headerBase64 || !payloadBase64 || !signature) {
      return null;
    }
    
    // 验证签名
    const expectedSignature = createHash('sha256')
      .update(`${headerBase64}.${payloadBase64}.${secret}`)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    // 解码载荷
    const payload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString());
    
    // 检查过期时间
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }
    
    return payload;
  } catch (error) {
    return null;
  }
}

/**
 * 计算哈希值
 */
export function calculateHash(data: string, algorithm: string = 'sha256'): string {
  return createHash(algorithm).update(data).digest('hex');
}

/**
 * 生成安全随机字符串
 */
export function generateSecureString(length: number = 32): string {
  return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

/**
 * 掩码敏感信息
 */
export function maskSensitiveInfo(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }
  
  const masked = { ...data };
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  
  for (const field of sensitiveFields) {
    if (masked[field]) {
      const value = masked[field];
      if (typeof value === 'string' && value.length > 8) {
        masked[field] = value.substring(0, 4) + '***' + value.substring(value.length - 4);
      } else {
        masked[field] = '***';
      }
    }
  }
  
  return masked;
}

/**
 * 深度合并对象
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target };
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      
      if (
        typeof sourceValue === 'object' && 
        sourceValue !== null && 
        !Array.isArray(sourceValue) &&
        typeof targetValue === 'object' && 
        targetValue !== null && 
        !Array.isArray(targetValue)
      ) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue as any;
      }
    }
  }
  
  return result;
}