/**
 * gRPC认证中间件
 */

import { ServerMiddleware, ClientMiddleware, MiddlewareContext, StatusCode, Status } from '../types/grpc-types.js';

export interface JWTPayload {
  sub: string;
  aud?: string;
  exp?: number;
  iat?: number;
  iss?: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthOptions {
  skipPaths?: string[];
  requiredRoles?: string[];
  requiredPermissions?: string[];
  jwtSecret?: string;
  apiKeyHeader?: string;
  apiKeys?: string[];
}

/**
 * 服务端JWT认证中间件
 */
export function createJWTAuthMiddleware(options: AuthOptions = {}): ServerMiddleware {
  const { skipPaths = [], requiredRoles = [], requiredPermissions = [], jwtSecret } = options;

  return async (context: MiddlewareContext, next) => {
    const { service, method } = context;
    const methodPath = `${service}.${method}`;

    // 检查是否跳过认证
    if (skipPaths.some(path => methodPath.includes(path))) {
      return await next();
    }

    // 获取Authorization头
    const metadata = context.getMetadata();
    const authHeader = metadata.get('authorization')?.[0];

    if (!authHeader) {
      throw new Status(StatusCode.UNAUTHENTICATED, 'Missing authorization header');
    }

    // 验证Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      throw new Status(StatusCode.UNAUTHENTICATED, 'Invalid authorization format');
    }

    const token = authHeader.slice(7);

    try {
      // 验证JWT (这里使用模拟实现)
      const payload = await verifyJWT(token, jwtSecret);
      
      // 检查角色权限
      if (requiredRoles.length > 0 && !hasRequiredRoles(payload, requiredRoles)) {
        throw new Status(StatusCode.PERMISSION_DENIED, 'Insufficient roles');
      }

      // 检查操作权限
      if (requiredPermissions.length > 0 && !hasRequiredPermissions(payload, requiredPermissions)) {
        throw new Status(StatusCode.PERMISSION_DENIED, 'Insufficient permissions');
      }

      // 将用户信息注入上下文
      context.setUser(payload);

      return await next();
    } catch (error) {
      if (error instanceof Status) {
        throw error;
      }
      throw new Status(StatusCode.UNAUTHENTICATED, 'Invalid token');
    }
  };
}

/**
 * 服务端API Key认证中间件
 */
export function createAPIKeyAuthMiddleware(options: AuthOptions = {}): ServerMiddleware {
  const { skipPaths = [], apiKeyHeader = 'x-api-key', apiKeys = [] } = options;

  return async (context: MiddlewareContext, next) => {
    const { service, method } = context;
    const methodPath = `${service}.${method}`;

    // 检查是否跳过认证
    if (skipPaths.some(path => methodPath.includes(path))) {
      return await next();
    }

    // 获取API Key
    const metadata = context.getMetadata();
    const apiKey = metadata.get(apiKeyHeader)?.[0];

    if (!apiKey) {
      throw new Status(StatusCode.UNAUTHENTICATED, `Missing ${apiKeyHeader} header`);
    }

    // 验证API Key
    if (!apiKeys.includes(apiKey)) {
      throw new Status(StatusCode.UNAUTHENTICATED, 'Invalid API key');
    }

    // 设置用户信息
    context.setUser({ apiKey, authenticated: true });

    return await next();
  };
}

/**
 * 客户端JWT认证中间件
 */
export function createClientJWTAuthMiddleware(tokenProvider: () => Promise<string>): ClientMiddleware {
  return () => {
    return async (context: MiddlewareContext, next) => {
      try {
        const token = await tokenProvider();
        
        // 将token添加到元数据
        const metadata = context.getMetadata();
        metadata.set('authorization', [`Bearer ${token}`]);

        return await next();
      } catch (error) {
        throw new Status(StatusCode.UNAUTHENTICATED, 'Failed to obtain authentication token');
      }
    };
  };
}

/**
 * 客户端API Key认证中间件
 */
export function createClientAPIKeyAuthMiddleware(apiKey: string, headerName = 'x-api-key'): ClientMiddleware {
  return () => {
    return async (context: MiddlewareContext, next) => {
      // 将API Key添加到元数据
      const metadata = context.getMetadata();
      metadata.set(headerName, [apiKey]);

      return await next();
    };
  };
}

/**
 * 验证JWT Token (模拟实现)
 */
async function verifyJWT(token: string, secret?: string): Promise<JWTPayload> {
  // 这里应该使用实际的JWT库进行验证
  // 为了示例，返回模拟的payload
  try {
    // 模拟JWT验证过程
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // 模拟解码payload
    const payload: JWTPayload = {
      sub: 'user123',
      aud: 'grpc-service',
      exp: Math.floor(Date.now() / 1000) + 3600, // 1小时后过期
      iat: Math.floor(Date.now() / 1000),
      iss: 'auth-service',
      roles: ['user', 'admin'],
      permissions: ['read', 'write']
    };

    // 检查过期时间
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('Token expired');
    }

    return payload;
  } catch (error) {
    throw new Error(`JWT verification failed: ${(error as Error).message}`);
  }
}

/**
 * 检查用户是否具有所需角色
 */
function hasRequiredRoles(payload: JWTPayload, requiredRoles: string[]): boolean {
  if (!payload.roles || payload.roles.length === 0) {
    return false;
  }

  return requiredRoles.every(role => payload.roles!.includes(role));
}

/**
 * 检查用户是否具有所需权限
 */
function hasRequiredPermissions(payload: JWTPayload, requiredPermissions: string[]): boolean {
  if (!payload.permissions || payload.permissions.length === 0) {
    return false;
  }

  return requiredPermissions.every(permission => payload.permissions!.includes(permission));
}

/**
 * 创建基于角色的访问控制中间件
 */
export function createRBACMiddleware(rolePermissionMap: Record<string, string[]>): ServerMiddleware {
  return async (context: MiddlewareContext, next) => {
    const { service, method } = context;
    const methodPath = `${service}.${method}`;

    // 从上下文获取用户信息
    const metadata = context.getMetadata();
    const userRoles = (metadata.get('user-roles') || [])[0]?.split(',') || [];

    // 检查用户角色对应的权限
    const userPermissions = new Set<string>();
    userRoles.forEach(role => {
      const permissions = rolePermissionMap[role] || [];
      permissions.forEach(permission => userPermissions.add(permission));
    });

    // 检查方法权限
    const requiredPermission = `${service}:${method}`;
    if (!userPermissions.has(requiredPermission) && !userPermissions.has('*')) {
      throw new Status(
        StatusCode.PERMISSION_DENIED,
        `Access denied for ${methodPath}. Required permission: ${requiredPermission}`
      );
    }

    return await next();
  };
}