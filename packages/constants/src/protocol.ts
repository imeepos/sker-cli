// 协议类型
export const PROTOCOL_TYPES = {
  UNKNOWN: 'unknown',
  HTTP: 'http',
  HTTPS: 'https',
  GRPC: 'grpc',
  WEBSOCKET: 'websocket',
  TCP: 'tcp',
  UDP: 'udp'
} as const;

// HTTP方法
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
  OPTIONS: 'OPTIONS',
  HEAD: 'HEAD'
} as const;

// 消息类型
export const MESSAGE_TYPES = {
  REQUEST: 'request',
  RESPONSE: 'response',
  EVENT: 'event',
  COMMAND: 'command',
  NOTIFICATION: 'notification'
} as const;

// 内容类型
export const CONTENT_TYPES = {
  JSON: 'application/json',
  PROTOBUF: 'application/protobuf',
  MSGPACK: 'application/msgpack',
  XML: 'application/xml',
  FORM_DATA: 'multipart/form-data',
  FORM_URLENCODED: 'application/x-www-form-urlencoded'
} as const;

// 类型定义
export type ProtocolType = typeof PROTOCOL_TYPES[keyof typeof PROTOCOL_TYPES];
export type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
export type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
export type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];