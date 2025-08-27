/**
 * 工厂函数（简化版） - 用于创建标准化的类型实例
 * Factory functions (simplified version) - for creating standardized type instances
 */

import { BasicTypes } from './basic-types.js';
import type { UUID, SkerString } from './basic-types.js';
import type { UDEFMessage, MessageEnvelope, MessagePayload, MessageHeader, MessageMetadata } from './message-types.js';
import type { ErrorResponse, ErrorDetail, SuccessResponse } from './error-types.js';
import type { ServiceInfo } from './service-types.js';

/**
 * 消息创建选项接口
 * Message creation options interface
 */
export interface CreateMessageOptions {
  message_type: string;
  service_name: SkerString;
  service_version?: SkerString;
  service_id?: UUID;
  content_type?: string;
  priority?: number;
  ttl?: number;
  correlation_id?: UUID;
  trace_id?: SkerString;
}

/**
 * 错误响应创建选项接口
 * Error response creation options interface
 */
export interface CreateErrorResponseOptions {
  code: SkerString;
  message: SkerString;
  level?: string;
  severity?: number;
  http_status?: number;
  details?: ErrorDetail[];
  help_url?: SkerString;
  retryable?: boolean;
  retry_after_ms?: number;
  api_version?: SkerString;
  request_id?: UUID;
}

/**
 * 服务信息创建选项接口
 * Service info creation options interface
 */
export interface CreateServiceInfoOptions {
  service_name: SkerString;
  service_version: SkerString;
  host: SkerString;
  port: number;
  protocol?: string;
  description?: SkerString;
  tags?: SkerString[];
}

/**
 * JWT令牌创建选项接口
 * JWT token creation options interface
 */
export interface CreateJWTTokenOptions {
  user_id: SkerString;
  issuer: SkerString;
  audience?: SkerString;
  expires_in_seconds?: number;
  roles?: SkerString[];
  permissions?: SkerString[];
}

/**
 * 消息工厂
 * Message factory
 */
export const MessageFactory = {
  /**
   * 创建标准消息
   * Create standard message
   */
  createMessage<TData = unknown>(
    data: TData,
    options: CreateMessageOptions
  ): UDEFMessage {
    const now = BasicTypes.createTimestamp();
    const messageId = BasicTypes.createUUID();
    const serviceId = options.service_id || BasicTypes.createUUID();

    const header: MessageHeader = {
      message_id: messageId,
      correlation_id: options.correlation_id,
      timestamp: now,
      source: {
        service_name: options.service_name,
        service_version: options.service_version || '1.0.0',
        service_id: serviceId
      },
      content_type: 'application/json' as any,
      message_type: options.message_type as any,
      version: '1.0'
    };

    const metadata: MessageMetadata = {
      trace_id: options.trace_id,
      priority: options.priority || 5,
      ttl: options.ttl
    };

    const envelope: MessageEnvelope = {
      header,
      metadata
    };

    const payload: MessagePayload = {
      data,
      schema_version: '1.0.0'
    };

    return {
      envelope,
      payload
    };
  }
};

/**
 * 错误工厂
 * Error factory
 */
export const ErrorFactory = {
  /**
   * 创建错误响应
   * Create error response
   */
  createErrorResponse(options: CreateErrorResponseOptions): ErrorResponse {
    const now = BasicTypes.createTimestamp();
    
    return {
      success: false,
      error: {
        code: options.code,
        message: options.message,
        level: options.level || 'business' as any,
        severity: options.severity || 2 as any,
        http_status: options.http_status as any,
        details: options.details,
        timestamp: now,
        help_url: options.help_url,
        retryable: options.retryable || false,
        retry_after_ms: options.retry_after_ms
      },
      metadata: {
        request_id: options.request_id,
        api_version: options.api_version || '1.0.0',
        processing_time_ms: 0
      }
    };
  },

  /**
   * 创建成功响应
   * Create success response
   */
  createSuccessResponse<TData = unknown>(
    data: TData,
    options?: {
      api_version?: SkerString;
      request_id?: UUID;
    }
  ): SuccessResponse<TData> {
    return {
      success: true,
      data,
      metadata: {
        api_version: options?.api_version || '1.0.0',
        processing_time_ms: 0,
        request_id: options?.request_id,
        timestamp: BasicTypes.createTimestamp()
      }
    };
  }
};

/**
 * 服务工厂
 * Service factory
 */
export const ServiceFactory = {
  /**
   * 创建服务信息
   * Create service info
   */
  createServiceInfo(options: CreateServiceInfoOptions): ServiceInfo {
    const now = BasicTypes.createTimestamp();
    const serviceId = BasicTypes.createUUID();

    return {
      service_name: options.service_name,
      service_version: options.service_version,
      service_id: serviceId,
      network_info: {
        host: options.host,
        port: options.port,
        protocol: options.protocol || 'http' as any
      },
      health_status: 0 as any, // UNKNOWN
      service_state: 'initializing' as any,
      description: options.description,
      tags: options.tags || [],
      capabilities: [],
      supported_api_versions: ['1.0.0'],
      metadata: {},
      registered_at: now,
      last_updated: now
    };
  }
};

/**
 * 认证工厂
 * Auth factory
 */
export const AuthFactory = {
  /**
   * 创建JWT令牌（简化版）
   * Create JWT token (simplified version)
   */
  createJWTToken(options: CreateJWTTokenOptions): any {
    const now = BasicTypes.createTimestamp();
    const expiresInSeconds = options.expires_in_seconds || 3600;
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1000);
    
    return {
      token: `jwt.${Math.random().toString(36).substring(2)}`,
      token_type: 'access_token',
      issued_at: now,
      expires_at: expiresAt,
      issuer: options.issuer,
      subject: options.user_id,
      scopes: options.roles
    };
  }
};

/**
 * 导出工厂函数集合
 * Export factory functions collection
 */
export const Factories = {
  MessageFactory,
  ErrorFactory,
  ServiceFactory,
  AuthFactory
};