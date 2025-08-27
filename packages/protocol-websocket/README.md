# @sker/protocol-websocket

Sker WebSocket协议实现包，提供实时双向通信能力。

## 概述

`@sker/protocol-websocket` 是Sker通信框架的WebSocket协议包，提供了完整的WebSocket客户端和服务端实现。该包支持实时双向通信、房间管理、事件系统、连接管理等企业级特性，是构建实时应用如聊天系统、实时协作、游戏服务器、监控系统的理想选择。

## 功能特性

### 🔄 实时双向通信
- **全双工通信**: 客户端和服务端可同时发送和接收消息
- **低延迟**: 基于TCP的持久连接，延迟极低
- **高并发**: 支持数万个并发连接
- **消息队列**: 内置消息缓冲和队列机制

### 🏠 房间管理系统
- **动态房间**: 动态创建和销毁房间
- **权限控制**: 房间级别的权限管理
- **广播机制**: 房间内消息广播
- **用户管理**: 房间用户进出管理

### 🎯 事件驱动架构
- **事件系统**: 完整的事件发布/订阅机制
- **生命周期钩子**: 连接建立、断开等生命周期事件
- **自定义事件**: 支持自定义业务事件
- **事件过滤**: 基于条件的事件过滤和路由

### 💓 连接管理
- **心跳检测**: 自动心跳保持连接活跃
- **重连机制**: 客户端自动重连策略
- **连接池**: 服务端连接池管理
- **优雅关闭**: 优雅的连接关闭处理

### 🛡️ 企业级特性
- **身份认证**: 多种认证机制支持
- **消息加密**: 端到端消息加密
- **限流控制**: 连接和消息级别的限流
- **监控指标**: 完整的性能监控和指标

## 安装

```bash
npm install @sker/protocol-websocket
# 或者
pnpm add @sker/protocol-websocket
# 或者
yarn add @sker/protocol-websocket
```

## 基础用法

### 创建WebSocket服务器

```typescript
import { WebSocketServer, ServerConfig, MessageHandler, ConnectionManager } from '@sker/protocol-websocket';

// 消息处理器
class ChatMessageHandler implements MessageHandler {
  private connectionManager: ConnectionManager;
  
  constructor(connectionManager: ConnectionManager) {
    this.connectionManager = connectionManager;
  }

  async handleMessage(connection: WebSocketConnection, message: any) {
    const { type, data } = message;

    switch (type) {
      case 'chat_message':
        await this.handleChatMessage(connection, data);
        break;
      case 'join_room':
        await this.handleJoinRoom(connection, data);
        break;
      case 'leave_room':
        await this.handleLeaveRoom(connection, data);
        break;
      case 'typing':
        await this.handleTyping(connection, data);
        break;
      default:
        console.log('Unknown message type:', type);
    }
  }

  private async handleChatMessage(connection: WebSocketConnection, data: any) {
    const { roomId, content } = data;
    
    // 验证用户是否在房间中
    if (!connection.rooms.has(roomId)) {
      connection.send({
        type: 'error',
        message: 'You are not in this room'
      });
      return;
    }

    // 构造消息
    const message = {
      type: 'chat_message',
      data: {
        id: generateMessageId(),
        userId: connection.user.id,
        username: connection.user.username,
        content: content,
        roomId: roomId,
        timestamp: new Date().toISOString()
      }
    };

    // 向房间内所有用户广播消息
    this.connectionManager.broadcastToRoom(roomId, message, connection.id);
    
    // 记录消息到数据库
    await messageService.saveMessage(message.data);
  }

  private async handleJoinRoom(connection: WebSocketConnection, data: any) {
    const { roomId } = data;
    
    try {
      // 检查房间是否存在
      const room = await roomService.findRoom(roomId);
      if (!room) {
        connection.send({
          type: 'error',
          message: 'Room not found'
        });
        return;
      }

      // 检查权限
      if (!await roomService.canUserJoinRoom(connection.user.id, roomId)) {
        connection.send({
          type: 'error',
          message: 'Permission denied'
        });
        return;
      }

      // 加入房间
      await this.connectionManager.joinRoom(connection.id, roomId);
      
      // 通知用户加入成功
      connection.send({
        type: 'room_joined',
        data: {
          roomId: roomId,
          roomInfo: room
        }
      });

      // 通知房间内其他用户
      this.connectionManager.broadcastToRoom(roomId, {
        type: 'user_joined',
        data: {
          userId: connection.user.id,
          username: connection.user.username,
          roomId: roomId
        }
      }, connection.id);

    } catch (error) {
      connection.send({
        type: 'error',
        message: 'Failed to join room'
      });
    }
  }

  private async handleLeaveRoom(connection: WebSocketConnection, data: any) {
    const { roomId } = data;
    
    if (connection.rooms.has(roomId)) {
      await this.connectionManager.leaveRoom(connection.id, roomId);
      
      // 通知房间内其他用户
      this.connectionManager.broadcastToRoom(roomId, {
        type: 'user_left',
        data: {
          userId: connection.user.id,
          username: connection.user.username,
          roomId: roomId
        }
      });
    }
  }

  private async handleTyping(connection: WebSocketConnection, data: any) {
    const { roomId, isTyping } = data;
    
    if (connection.rooms.has(roomId)) {
      // 向房间内其他用户发送打字状态
      this.connectionManager.broadcastToRoom(roomId, {
        type: 'user_typing',
        data: {
          userId: connection.user.id,
          username: connection.user.username,
          roomId: roomId,
          isTyping: isTyping
        }
      }, connection.id);
    }
  }
}

// 服务器配置
const serverConfig: ServerConfig = {
  // 基础配置
  port: 8080,
  host: '0.0.0.0',
  
  // WebSocket配置
  websocket: {
    // 心跳配置
    heartbeat: {
      enabled: true,
      interval: 30000,          // 30秒心跳间隔
      timeout: 10000,           // 10秒心跳超时
      maxMissed: 3              // 最大错过3次心跳
    },
    
    // 消息配置
    message: {
      maxSize: 1024 * 1024,     // 最大1MB消息
      encoding: 'utf8',         // 消息编码
      compression: {
        enabled: true,
        threshold: 1024,        // 大于1KB启用压缩
        algorithm: 'deflate'    // 压缩算法
      }
    },
    
    // 连接配置
    connection: {
      maxConnections: 10000,    // 最大连接数
      idleTimeout: 300000,      // 5分钟空闲超时
      maxBacklog: 1000         // 最大待处理连接
    }
  },
  
  // 认证配置
  auth: {
    enabled: true,
    tokenHeader: 'Authorization',
    tokenParam: 'token',
    
    // JWT验证
    jwt: {
      secret: 'your-jwt-secret',
      algorithms: ['HS256'],
      issuer: 'sker-chat',
      audience: 'chat-users'
    },
    
    // 认证回调
    authenticate: async (token: string) => {
      try {
        const payload = jwt.verify(token, 'your-jwt-secret');
        const user = await userService.findById(payload.userId);
        return user;
      } catch (error) {
        throw new Error('Invalid token');
      }
    }
  },
  
  // CORS配置
  cors: {
    enabled: true,
    origin: ['http://localhost:3000', 'https://chat.example.com'],
    methods: ['GET', 'POST'],
    credentials: true
  },
  
  // 限流配置
  rateLimit: {
    enabled: true,
    
    // 连接限流
    connection: {
      maxPerIP: 100,            // 每IP最大连接数
      maxPerUser: 10,           // 每用户最大连接数
      windowMs: 60000           // 1分钟窗口
    },
    
    // 消息限流
    message: {
      maxPerMinute: 60,         // 每分钟最大消息数
      maxPerSecond: 10,         // 每秒最大消息数
      burstSize: 20             // 突发大小
    }
  }
};

// 创建服务器
const server = new WebSocketServer(serverConfig);

// 注册消息处理器
const connectionManager = server.getConnectionManager();
const messageHandler = new ChatMessageHandler(connectionManager);
server.setMessageHandler(messageHandler);

// 添加中间件
server.use([
  'auth',               // 认证中间件
  'rateLimit',          // 限流中间件
  'logging',            // 日志中间件
  'compression',        // 压缩中间件
  'errorHandler'        // 错误处理中间件
]);

// 连接事件处理
server.on('connection', (connection: WebSocketConnection) => {
  console.log(`New connection: ${connection.id} from ${connection.ip}`);
  console.log(`User: ${connection.user?.username || 'Anonymous'}`);
  
  // 发送欢迎消息
  connection.send({
    type: 'welcome',
    data: {
      connectionId: connection.id,
      serverTime: new Date().toISOString(),
      supportedFeatures: ['rooms', 'typing', 'file_upload']
    }
  });
});

server.on('disconnect', (connection: WebSocketConnection, reason: string) => {
  console.log(`Connection closed: ${connection.id}, reason: ${reason}`);
  
  // 清理用户相关资源
  connectionManager.cleanup(connection.id);
});

server.on('error', (error: Error) => {
  console.error('WebSocket server error:', error);
});

// 启动服务器
await server.start();
console.log(`WebSocket服务器运行在 ws://${serverConfig.host}:${serverConfig.port}`);

// 优雅关闭
process.on('SIGTERM', async () => {
  console.log('正在关闭WebSocket服务器...');
  await server.gracefulShutdown(5000);
  process.exit(0);
});
```

### 创建WebSocket客户端

```typescript
import { WebSocketClient, ClientConfig, ClientEventEmitter } from '@sker/protocol-websocket';

// 客户端配置
const clientConfig: ClientConfig = {
  // 连接配置
  url: 'ws://localhost:8080',
  
  // 认证配置
  auth: {
    type: 'jwt',
    token: 'your-jwt-token',
    
    // 或者使用回调获取token
    getToken: async () => {
      return await authService.getAccessToken();
    },
    
    // token刷新
    refreshToken: async () => {
      return await authService.refreshToken();
    }
  },
  
  // 重连配置
  reconnect: {
    enabled: true,
    maxAttempts: 10,          // 最大重连次数
    initialDelay: 1000,       // 初始延迟1秒
    maxDelay: 30000,          // 最大延迟30秒
    backoffFactor: 1.5,       // 退避因子
    jitter: 0.1               // 10%抖动
  },
  
  // 心跳配置
  heartbeat: {
    enabled: true,
    interval: 25000,          // 25秒（略小于服务端）
    timeout: 10000,           // 10秒超时
    pingMessage: { type: 'ping' },
    pongMessage: { type: 'pong' }
  },
  
  // 消息配置
  message: {
    maxSize: 1024 * 1024,     // 最大1MB
    compression: true,        // 启用压缩
    
    // 消息队列配置
    queue: {
      enabled: true,
      maxSize: 1000,          // 最大1000条待发送消息
      retryOnReconnect: true  // 重连时重试发送
    }
  },
  
  // 调试配置
  debug: {
    enabled: process.env.NODE_ENV === 'development',
    logLevel: 'info',         // 'debug' | 'info' | 'warn' | 'error'
    logMessages: true         // 记录消息内容
  }
};

// 创建客户端
const client = new WebSocketClient(clientConfig);

// 事件处理
class ChatClient extends ClientEventEmitter {
  private client: WebSocketClient;
  private currentRooms: Set<string> = new Set();
  
  constructor(client: WebSocketClient) {
    super();
    this.client = client;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    // 连接建立
    this.client.on('open', () => {
      console.log('Connected to chat server');
      this.emit('connected');
    });

    // 连接关闭
    this.client.on('close', (code: number, reason: string) => {
      console.log(`Connection closed: ${code} - ${reason}`);
      this.emit('disconnected', { code, reason });
    });

    // 连接错误
    this.client.on('error', (error: Error) => {
      console.error('Connection error:', error);
      this.emit('error', error);
    });

    // 重连事件
    this.client.on('reconnecting', (attempt: number) => {
      console.log(`Reconnecting... attempt ${attempt}`);
      this.emit('reconnecting', attempt);
    });

    this.client.on('reconnected', () => {
      console.log('Reconnected successfully');
      
      // 重连后重新加入房间
      this.rejoinRooms();
      this.emit('reconnected');
    });

    // 消息处理
    this.client.on('message', (message: any) => {
      this.handleMessage(message);
    });
  }

  private handleMessage(message: any) {
    const { type, data } = message;

    switch (type) {
      case 'welcome':
        this.handleWelcome(data);
        break;
      case 'chat_message':
        this.handleChatMessage(data);
        break;
      case 'user_joined':
        this.handleUserJoined(data);
        break;
      case 'user_left':
        this.handleUserLeft(data);
        break;
      case 'user_typing':
        this.handleUserTyping(data);
        break;
      case 'room_joined':
        this.handleRoomJoined(data);
        break;
      case 'error':
        this.handleError(data);
        break;
      default:
        console.log('Unknown message type:', type, data);
    }
  }

  private handleWelcome(data: any) {
    console.log('Welcome message:', data);
    this.emit('welcome', data);
  }

  private handleChatMessage(data: any) {
    console.log(`[${data.roomId}] ${data.username}: ${data.content}`);
    this.emit('message', data);
  }

  private handleUserJoined(data: any) {
    console.log(`${data.username} joined room ${data.roomId}`);
    this.emit('userJoined', data);
  }

  private handleUserLeft(data: any) {
    console.log(`${data.username} left room ${data.roomId}`);
    this.emit('userLeft', data);
  }

  private handleUserTyping(data: any) {
    this.emit('userTyping', data);
  }

  private handleRoomJoined(data: any) {
    this.currentRooms.add(data.roomId);
    this.emit('roomJoined', data);
  }

  private handleError(data: any) {
    console.error('Server error:', data);
    this.emit('serverError', data);
  }

  private async rejoinRooms() {
    // 重连后重新加入之前的房间
    for (const roomId of this.currentRooms) {
      await this.joinRoom(roomId);
    }
  }

  // 公共API方法
  async connect() {
    return await this.client.connect();
  }

  async disconnect() {
    this.currentRooms.clear();
    return await this.client.disconnect();
  }

  async joinRoom(roomId: string) {
    return await this.client.send({
      type: 'join_room',
      data: { roomId }
    });
  }

  async leaveRoom(roomId: string) {
    this.currentRooms.delete(roomId);
    return await this.client.send({
      type: 'leave_room',
      data: { roomId }
    });
  }

  async sendMessage(roomId: string, content: string) {
    return await this.client.send({
      type: 'chat_message',
      data: {
        roomId,
        content,
        timestamp: new Date().toISOString()
      }
    });
  }

  async sendTyping(roomId: string, isTyping: boolean) {
    return await this.client.send({
      type: 'typing',
      data: {
        roomId,
        isTyping
      }
    });
  }

  // 获取连接状态
  get isConnected() {
    return this.client.isConnected;
  }

  get isConnecting() {
    return this.client.isConnecting;
  }

  get connectionState() {
    return this.client.getState();
  }
}

// 使用客户端
const chatClient = new ChatClient(client);

// 监听事件
chatClient.on('connected', () => {
  console.log('Chat client connected');
});

chatClient.on('message', (message) => {
  displayMessage(message);
});

chatClient.on('userJoined', (data) => {
  showNotification(`${data.username} joined the room`);
});

chatClient.on('userTyping', (data) => {
  updateTypingIndicator(data.userId, data.isTyping);
});

// 连接到服务器
await chatClient.connect();

// 加入房间
await chatClient.joinRoom('general');

// 发送消息
await chatClient.sendMessage('general', 'Hello everyone!');

// 发送打字状态
await chatClient.sendTyping('general', true);
setTimeout(() => chatClient.sendTyping('general', false), 3000);
```

### 房间管理系统

```typescript
import { RoomManager, Room, RoomConfig, Permission } from '@sker/protocol-websocket';

// 房间配置
const roomConfig: RoomConfig = {
  // 房间基础配置
  maxUsers: 100,              // 最大用户数
  persistent: true,           // 是否持久化
  password: 'room-password',  // 房间密码（可选）
  
  // 权限配置
  permissions: {
    defaultRole: 'member',    // 默认角色
    roles: {
      'owner': {
        canSendMessage: true,
        canInviteUsers: true,
        canKickUsers: true,
        canManageRoom: true,
        canDeleteRoom: true
      },
      'admin': {
        canSendMessage: true,
        canInviteUsers: true,
        canKickUsers: true,
        canManageRoom: false,
        canDeleteRoom: false
      },
      'member': {
        canSendMessage: true,
        canInviteUsers: false,
        canKickUsers: false,
        canManageRoom: false,
        canDeleteRoom: false
      },
      'guest': {
        canSendMessage: false,
        canInviteUsers: false,
        canKickUsers: false,
        canManageRoom: false,
        canDeleteRoom: false
      }
    }
  },
  
  // 消息配置
  message: {
    maxLength: 2000,          // 最大消息长度
    allowEmojis: true,        // 允许表情
    allowFiles: true,         // 允许文件
    allowImages: true,        // 允许图片
    historySize: 1000,        // 历史消息数量
    rateLimitPerMinute: 60    // 每分钟消息限制
  },
  
  // 房间行为配置
  behavior: {
    autoDeleteWhenEmpty: true,    // 空房间自动删除
    emptyTimeout: 300000,         // 空房间超时时间（5分钟）
    welcomeMessage: 'Welcome to the room!',
    
    // 自动审核
    moderation: {
      enabled: true,
      bannedWords: ['spam', 'abuse'],
      maxWarnings: 3,
      autoMute: true
    }
  }
};

// 房间管理器
class CustomRoomManager extends RoomManager {
  
  async createRoom(name: string, ownerId: string, config: RoomConfig): Promise<Room> {
    // 验证房间名称
    if (await this.roomExists(name)) {
      throw new Error('Room already exists');
    }
    
    // 检查用户权限
    const user = await userService.findById(ownerId);
    if (!user || !user.canCreateRooms) {
      throw new Error('Permission denied');
    }
    
    // 创建房间
    const room = await super.createRoom(name, ownerId, config);
    
    // 记录房间创建日志
    await auditLogger.log('room_created', {
      roomId: room.id,
      roomName: name,
      ownerId,
      config
    });
    
    return room;
  }
  
  async joinRoom(roomId: string, userId: string, password?: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // 检查房间密码
    if (room.config.password && room.config.password !== password) {
      throw new Error('Invalid password');
    }
    
    // 检查房间容量
    if (room.users.size >= room.config.maxUsers) {
      throw new Error('Room is full');
    }
    
    // 检查用户是否被禁止
    if (room.bannedUsers.has(userId)) {
      throw new Error('You are banned from this room');
    }
    
    // 加入房间
    await super.joinRoom(roomId, userId);
    
    // 发送欢迎消息
    if (room.config.behavior?.welcomeMessage) {
      const connection = this.connectionManager.getConnection(userId);
      if (connection) {
        connection.send({
          type: 'system_message',
          data: {
            content: room.config.behavior.welcomeMessage,
            roomId: roomId
          }
        });
      }
    }
    
    // 记录加入日志
    await auditLogger.log('user_joined_room', {
      roomId,
      userId,
      timestamp: new Date()
    });
  }
  
  async leaveRoom(roomId: string, userId: string): Promise<void> {
    await super.leaveRoom(roomId, userId);
    
    const room = await this.getRoom(roomId);
    
    // 如果房间为空且配置为自动删除
    if (room && room.users.size === 0 && room.config.behavior?.autoDeleteWhenEmpty) {
      setTimeout(async () => {
        const currentRoom = await this.getRoom(roomId);
        if (currentRoom && currentRoom.users.size === 0) {
          await this.deleteRoom(roomId);
        }
      }, room.config.behavior.emptyTimeout || 300000);
    }
  }
  
  async sendMessageToRoom(roomId: string, senderId: string, content: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) {
      throw new Error('Room not found');
    }
    
    // 检查用户权限
    const userRole = room.getUserRole(senderId);
    if (!room.config.permissions.roles[userRole]?.canSendMessage) {
      throw new Error('Permission denied');
    }
    
    // 检查消息长度
    if (content.length > (room.config.message.maxLength || 2000)) {
      throw new Error('Message too long');
    }
    
    // 内容审核
    if (room.config.behavior?.moderation?.enabled) {
      const bannedWords = room.config.behavior.moderation.bannedWords || [];
      for (const word of bannedWords) {
        if (content.toLowerCase().includes(word)) {
          await this.warnUser(roomId, senderId, 'Used banned word');
          throw new Error('Message contains banned content');
        }
      }
    }
    
    // 限流检查
    const rateLimitKey = `${roomId}:${senderId}`;
    const messageCount = await rateLimiter.get(rateLimitKey);
    const rateLimit = room.config.message.rateLimitPerMinute || 60;
    
    if (messageCount >= rateLimit) {
      throw new Error('Rate limit exceeded');
    }
    
    await rateLimiter.increment(rateLimitKey, 60); // 1分钟窗口
    
    // 发送消息
    const message = {
      id: generateMessageId(),
      content,
      senderId,
      roomId,
      timestamp: new Date().toISOString()
    };
    
    // 保存到历史记录
    await room.addMessage(message);
    
    // 广播消息
    this.connectionManager.broadcastToRoom(roomId, {
      type: 'chat_message',
      data: message
    });
  }
  
  async warnUser(roomId: string, userId: string, reason: string): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;
    
    let warnings = room.userWarnings.get(userId) || 0;
    warnings++;
    room.userWarnings.set(userId, warnings);
    
    // 发送警告消息
    const connection = this.connectionManager.getConnection(userId);
    if (connection) {
      connection.send({
        type: 'warning',
        data: {
          reason,
          warningCount: warnings,
          maxWarnings: room.config.behavior?.moderation?.maxWarnings || 3
        }
      });
    }
    
    // 达到最大警告数时自动禁言
    const maxWarnings = room.config.behavior?.moderation?.maxWarnings || 3;
    if (warnings >= maxWarnings && room.config.behavior?.moderation?.autoMute) {
      await this.muteUser(roomId, userId, 3600000); // 禁言1小时
    }
  }
  
  async muteUser(roomId: string, userId: string, duration: number): Promise<void> {
    const room = await this.getRoom(roomId);
    if (!room) return;
    
    const muteUntil = new Date(Date.now() + duration);
    room.mutedUsers.set(userId, muteUntil);
    
    // 通知用户被禁言
    const connection = this.connectionManager.getConnection(userId);
    if (connection) {
      connection.send({
        type: 'muted',
        data: {
          roomId,
          duration,
          until: muteUntil.toISOString(),
          reason: 'Excessive warnings'
        }
      });
    }
    
    // 自动解除禁言
    setTimeout(() => {
      room.mutedUsers.delete(userId);
      
      const connection = this.connectionManager.getConnection(userId);
      if (connection) {
        connection.send({
          type: 'unmuted',
          data: { roomId }
        });
      }
    }, duration);
  }
}

// 使用自定义房间管理器
const roomManager = new CustomRoomManager(connectionManager);

// 创建房间
const gameRoom = await roomManager.createRoom('game-lobby', 'user123', {
  maxUsers: 50,
  persistent: true,
  permissions: {
    defaultRole: 'member',
    roles: {
      'admin': {
        canSendMessage: true,
        canInviteUsers: true,
        canKickUsers: true,
        canManageRoom: true
      },
      'member': {
        canSendMessage: true,
        canInviteUsers: false,
        canKickUsers: false,
        canManageRoom: false
      }
    }
  },
  behavior: {
    welcomeMessage: 'Welcome to the game lobby! Type /help for commands.',
    moderation: {
      enabled: true,
      bannedWords: ['cheat', 'hack'],
      maxWarnings: 2,
      autoMute: true
    }
  }
});

console.log('Game room created:', gameRoom.id);
```

### 命名空间和事件系统

```typescript
import { NamespaceManager, EventRouter, EventFilter } from '@sker/protocol-websocket';

// 命名空间管理
class CustomNamespaceManager extends NamespaceManager {
  
  constructor() {
    super();
    this.setupNamespaces();
  }
  
  private setupNamespaces() {
    // 聊天命名空间
    this.createNamespace('/chat', {
      auth: {
        required: true,
        roles: ['user', 'admin']
      },
      rateLimit: {
        messagesPerMinute: 60,
        connectionsPerIP: 10
      },
      features: ['rooms', 'private-messages', 'file-sharing']
    });
    
    // 游戏命名空间
    this.createNamespace('/game', {
      auth: {
        required: true,
        roles: ['player', 'admin']
      },
      rateLimit: {
        messagesPerMinute: 120, // 游戏需要更高频率
        connectionsPerIP: 5
      },
      features: ['matchmaking', 'spectating', 'tournaments']
    });
    
    // 管理命名空间
    this.createNamespace('/admin', {
      auth: {
        required: true,
        roles: ['admin', 'moderator']
      },
      rateLimit: {
        messagesPerMinute: 100,
        connectionsPerIP: 2
      },
      features: ['monitoring', 'user-management', 'system-controls']
    });
  }
}

// 事件路由器
class CustomEventRouter extends EventRouter {
  
  constructor() {
    super();
    this.setupRoutes();
  }
  
  private setupRoutes() {
    // 聊天事件路由
    this.route('/chat', 'message', this.handleChatMessage.bind(this));
    this.route('/chat', 'join-room', this.handleJoinRoom.bind(this));
    this.route('/chat', 'leave-room', this.handleLeaveRoom.bind(this));
    this.route('/chat', 'typing', this.handleTyping.bind(this));
    this.route('/chat', 'file-upload', this.handleFileUpload.bind(this));
    
    // 游戏事件路由
    this.route('/game', 'join-match', this.handleJoinMatch.bind(this));
    this.route('/game', 'game-action', this.handleGameAction.bind(this));
    this.route('/game', 'spectate', this.handleSpectate.bind(this));
    
    // 管理事件路由
    this.route('/admin', 'ban-user', this.handleBanUser.bind(this));
    this.route('/admin', 'system-stats', this.handleSystemStats.bind(this));
    this.route('/admin', 'moderate-room', this.handleModerateRoom.bind(this));
  }
  
  private async handleChatMessage(connection: WebSocketConnection, data: any) {
    const { roomId, content, messageType = 'text' } = data;
    
    // 基础验证
    if (!roomId || !content) {
      throw new Error('Invalid message data');
    }
    
    // 检查用户是否被禁言
    const room = await roomManager.getRoom(roomId);
    if (room?.mutedUsers.has(connection.user.id)) {
      throw new Error('You are muted in this room');
    }
    
    // 根据消息类型处理
    switch (messageType) {
      case 'text':
        await this.handleTextMessage(connection, roomId, content);
        break;
      case 'emoji':
        await this.handleEmojiMessage(connection, roomId, content);
        break;
      case 'command':
        await this.handleCommandMessage(connection, roomId, content);
        break;
      default:
        throw new Error('Unknown message type');
    }
  }
  
  private async handleTextMessage(connection: WebSocketConnection, roomId: string, content: string) {
    // 构造消息
    const message = {
      id: generateMessageId(),
      type: 'text',
      content: content.trim(),
      senderId: connection.user.id,
      senderName: connection.user.username,
      roomId,
      timestamp: new Date().toISOString(),
      metadata: {
        clientVersion: connection.clientVersion,
        platform: connection.platform
      }
    };
    
    // 发送到房间
    await roomManager.sendMessageToRoom(roomId, message);
    
    // 记录消息
    await messageLogger.logMessage(message);
  }
  
  private async handleJoinMatch(connection: WebSocketConnection, data: any) {
    const { gameType, skillLevel, preferredRegion } = data;
    
    // 查找匹配的游戏
    const match = await matchmakingService.findMatch({
      playerId: connection.user.id,
      gameType,
      skillLevel,
      region: preferredRegion
    });
    
    if (match) {
      // 加入现有匹配
      await matchmakingService.joinMatch(match.id, connection.user.id);
      
      connection.send({
        type: 'match-found',
        data: {
          matchId: match.id,
          players: match.players,
          gameType: match.gameType,
          estimatedStartTime: match.estimatedStartTime
        }
      });
    } else {
      // 创建新的匹配请求
      const matchRequest = await matchmakingService.createMatchRequest({
        playerId: connection.user.id,
        gameType,
        skillLevel,
        region: preferredRegion
      });
      
      connection.send({
        type: 'match-searching',
        data: {
          requestId: matchRequest.id,
          estimatedWaitTime: matchRequest.estimatedWaitTime
        }
      });
    }
  }
  
  private async handleBanUser(connection: WebSocketConnection, data: any) {
    const { targetUserId, reason, duration } = data;
    
    // 检查管理员权限
    if (!connection.user.roles.includes('admin')) {
      throw new Error('Insufficient permissions');
    }
    
    // 执行封禁
    await userService.banUser(targetUserId, {
      reason,
      duration,
      bannedBy: connection.user.id,
      timestamp: new Date()
    });
    
    // 断开被封禁用户的连接
    const targetConnection = connectionManager.getConnectionByUserId(targetUserId);
    if (targetConnection) {
      targetConnection.send({
        type: 'banned',
        data: { reason, duration }
      });
      
      setTimeout(() => {
        targetConnection.close(4000, 'User banned');
      }, 5000); // 5秒后断开连接
    }
    
    // 记录管理操作
    await auditLogger.log('user_banned', {
      targetUserId,
      reason,
      duration,
      bannedBy: connection.user.id
    });
  }
}

// 事件过滤器
const eventFilters: EventFilter[] = [
  // 频率过滤器
  {
    name: 'rate-limit',
    condition: (connection, event) => {
      const key = `${connection.id}:${event.type}`;
      const count = rateLimiter.get(key);
      return count < getRateLimit(event.type);
    },
    action: 'reject',
    message: 'Rate limit exceeded'
  },
  
  // 内容过滤器
  {
    name: 'content-filter',
    condition: (connection, event) => {
      if (event.type === 'message' && event.data.content) {
        return !containsSpam(event.data.content);
      }
      return true;
    },
    action: 'modify',
    modifier: (event) => {
      if (event.type === 'message') {
        event.data.content = filterProfanity(event.data.content);
      }
      return event;
    }
  },
  
  // 权限过滤器
  {
    name: 'permission-filter',
    condition: (connection, event) => {
      const requiredPermission = getRequiredPermission(event.type);
      return connection.user.permissions.includes(requiredPermission);
    },
    action: 'reject',
    message: 'Insufficient permissions'
  }
];

// 应用事件系统
const namespaceManager = new CustomNamespaceManager();
const eventRouter = new CustomEventRouter();

// 配置事件过滤
eventRouter.addFilters(eventFilters);

// 集成到WebSocket服务器
server.setNamespaceManager(namespaceManager);
server.setEventRouter(eventRouter);
```

## 高级配置

### 服务器高级配置

```typescript
const advancedServerConfig: ServerConfig = {
  // 基础配置
  port: 8080,
  host: '0.0.0.0',
  
  // 集群配置
  cluster: {
    enabled: true,
    workers: 'auto',          // 自动检测CPU核数
    strategy: 'round-robin',  // 负载均衡策略
    
    // Redis集群配置
    redis: {
      host: 'localhost',
      port: 6379,
      password: 'redis-password',
      keyPrefix: 'ws-cluster:'
    }
  },
  
  // 性能配置
  performance: {
    // 连接配置
    maxConnections: 50000,
    maxConnectionsPerIP: 100,
    connectionTimeout: 30000,
    idleTimeout: 300000,
    
    // 内存管理
    memory: {
      maxHeapUsage: '2GB',
      gcInterval: 60000,      // 60秒GC间隔
      connectionPoolSize: 10000
    },
    
    // 消息处理
    message: {
      maxConcurrentMessages: 10000,
      messageQueueSize: 100000,
      processingTimeout: 30000,
      batchSize: 100          // 批处理大小
    }
  },
  
  // 安全配置
  security: {
    // SSL/TLS配置
    tls: {
      enabled: true,
      keyFile: './certs/server.key',
      certFile: './certs/server.crt',
      caFile: './certs/ca.crt',
      
      // 安全选项
      secureProtocol: 'TLSv1_2_method',
      ciphers: 'ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM',
      honorCipherOrder: true
    },
    
    // DDoS防护
    ddosProtection: {
      enabled: true,
      maxConnectionsPerIP: 50,
      maxRequestsPerMinute: 1000,
      banDuration: 3600000,     // 1小时封禁
      
      // 异常检测
      anomalyDetection: {
        enabled: true,
        threshold: 10,          // 异常阈值
        windowSize: 60000       // 检测窗口
      }
    },
    
    // 访问控制
    accessControl: {
      enabled: true,
      whitelist: ['192.168.1.0/24'],
      blacklist: ['10.0.0.1'],
      geoBlocking: {
        enabled: false,
        blockedCountries: ['XX']
      }
    }
  },
  
  // 监控配置
  monitoring: {
    enabled: true,
    
    // 指标收集
    metrics: {
      enabled: true,
      interval: 10000,        // 10秒收集间隔
      retention: 86400000,    // 24小时保留
      
      // Prometheus配置
      prometheus: {
        enabled: true,
        port: 9090,
        path: '/metrics'
      }
    },
    
    // 健康检查
    health: {
      enabled: true,
      port: 8081,
      path: '/health',
      checks: [
        'memory',
        'connections', 
        'message-queue',
        'redis'
      ]
    },
    
    // 日志配置
    logging: {
      level: 'info',
      format: 'json',
      outputs: ['console', 'file'],
      
      // 文件日志配置
      file: {
        path: './logs/websocket.log',
        maxSize: '100MB',
        maxFiles: 10,
        compress: true
      },
      
      // 结构化日志
      structured: {
        enabled: true,
        fields: [
          'timestamp',
          'level',
          'message',
          'connectionId',
          'userId',
          'event',
          'duration'
        ]
      }
    }
  }
};
```

### 客户端高级配置

```typescript
const advancedClientConfig: ClientConfig = {
  // 连接配置
  url: 'wss://chat.example.com/ws',
  
  // 协议配置
  protocols: ['sker-chat-v1', 'sker-chat-v2'],
  
  // 传输配置
  transport: {
    // WebSocket配置
    websocket: {
      maxPayload: 1024 * 1024,    // 1MB最大载荷
      compression: {
        enabled: true,
        threshold: 1024,          // 1KB压缩阈值
        algorithm: 'permessage-deflate'
      },
      
      // 帧配置
      frames: {
        maxFrameSize: 65536,      // 64KB最大帧大小
        autoFragment: true        // 自动分片
      }
    },
    
    // HTTP长轮询回退
    polling: {
      enabled: true,
      interval: 1000,             // 1秒轮询间隔
      maxInterval: 30000,         // 最大30秒间隔
      timeout: 60000              // 60秒超时
    }
  },
  
  // 缓冲区配置
  buffer: {
    // 发送缓冲区
    send: {
      maxSize: 1000,              // 最大1000条消息
      flushInterval: 100,         // 100ms刷新间隔
      priority: true              // 启用优先级队列
    },
    
    // 接收缓冲区
    receive: {
      maxSize: 5000,              // 最大5000条消息
      processInterval: 10,        // 10ms处理间隔
      batchSize: 50               // 批处理50条消息
    }
  },
  
  // 状态管理
  state: {
    // 持久化状态
    persistence: {
      enabled: true,
      storage: 'localStorage',    // 'localStorage' | 'sessionStorage' | 'memory'
      key: 'sker-websocket-state',
      
      // 状态同步
      sync: {
        enabled: true,
        interval: 30000,          // 30秒同步间隔
        conflictResolution: 'server-wins'
      }
    },
    
    // 离线支持
    offline: {
      enabled: true,
      queueSize: 10000,           // 离线消息队列大小
      syncOnReconnect: true,      // 重连时同步
      
      // 离线存储
      storage: {
        type: 'indexeddb',
        maxSize: '50MB',
        ttl: 604800000            // 7天TTL
      }
    }
  }
};
```

## 最佳实践

### 1. 连接管理

```typescript
// ✅ 推荐：实现连接管理器
class ConnectionManager {
  private connections = new Map<string, WebSocketConnection>();
  private userConnections = new Map<string, Set<string>>();
  
  addConnection(connection: WebSocketConnection) {
    this.connections.set(connection.id, connection);
    
    if (connection.user) {
      if (!this.userConnections.has(connection.user.id)) {
        this.userConnections.set(connection.user.id, new Set());
      }
      this.userConnections.get(connection.user.id)!.add(connection.id);
    }
  }
  
  removeConnection(connectionId: string) {
    const connection = this.connections.get(connectionId);
    if (connection && connection.user) {
      const userConnections = this.userConnections.get(connection.user.id);
      if (userConnections) {
        userConnections.delete(connectionId);
        if (userConnections.size === 0) {
          this.userConnections.delete(connection.user.id);
        }
      }
    }
    
    this.connections.delete(connectionId);
  }
  
  getUserConnections(userId: string): WebSocketConnection[] {
    const connectionIds = this.userConnections.get(userId) || new Set();
    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(Boolean) as WebSocketConnection[];
  }
}
```

### 2. 错误处理

```typescript
// ✅ 推荐：完善的错误处理
class WebSocketErrorHandler {
  
  handleConnectionError(connection: WebSocketConnection, error: Error) {
    logger.error('Connection error:', {
      connectionId: connection.id,
      userId: connection.user?.id,
      error: error.message,
      stack: error.stack
    });
    
    // 根据错误类型采取不同措施
    if (error.name === 'AuthenticationError') {
      connection.send({
        type: 'auth_error',
        message: 'Authentication failed'
      });
      connection.close(4001, 'Authentication failed');
    } else if (error.name === 'RateLimitError') {
      connection.send({
        type: 'rate_limit',
        message: 'Too many requests'
      });
      // 临时限流，不关闭连接
    } else {
      connection.send({
        type: 'error',
        message: 'Internal server error'
      });
    }
  }
  
  handleMessageError(connection: WebSocketConnection, message: any, error: Error) {
    logger.error('Message processing error:', {
      connectionId: connection.id,
      messageType: message.type,
      error: error.message
    });
    
    connection.send({
      type: 'message_error',
      originalMessage: message,
      error: error.message
    });
  }
}
```

### 3. 性能优化

```typescript
// ✅ 推荐：消息批处理
class MessageBatcher {
  private batches = new Map<string, any[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  
  addMessage(roomId: string, message: any) {
    if (!this.batches.has(roomId)) {
      this.batches.set(roomId, []);
    }
    
    this.batches.get(roomId)!.push(message);
    
    // 如果没有定时器，创建一个
    if (!this.timers.has(roomId)) {
      const timer = setTimeout(() => {
        this.flushBatch(roomId);
      }, 50); // 50ms批处理间隔
      
      this.timers.set(roomId, timer);
    }
    
    // 如果批次达到最大大小，立即发送
    if (this.batches.get(roomId)!.length >= 10) {
      this.flushBatch(roomId);
    }
  }
  
  private flushBatch(roomId: string) {
    const batch = this.batches.get(roomId);
    if (batch && batch.length > 0) {
      roomManager.broadcastToRoom(roomId, {
        type: 'message_batch',
        messages: batch
      });
      
      this.batches.delete(roomId);
    }
    
    const timer = this.timers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(roomId);
    }
  }
}
```

## API 参考

详细的API文档请参考[在线文档](https://sker.dev/docs/protocol-websocket)。

## 贡献指南

参考项目根目录的 [CONTRIBUTING.md](../../CONTRIBUTING.md) 文件。

## 许可证

MIT License - 详见 [LICENSE](../../LICENSE) 文件。

---

> 这是Sker通信框架的WebSocket协议包。更多信息请访问 [Sker官网](https://sker.dev)