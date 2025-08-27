/**
 * @fileoverview 控制器装饰器实现
 */

import 'reflect-metadata';
import { HTTPMethod, Middleware, ControllerMetadata, RouteMetadata, ParameterMetadata } from '../types/http-types.js';

// 元数据键常量
const CONTROLLER_METADATA_KEY = 'controller';
const ROUTE_METADATA_KEY = 'routes';
const PARAMETER_METADATA_KEY = 'parameters';

/**
 * Controller 装饰器
 */
export function Controller(path = ''): ClassDecorator {
  return function (target: any) {
    const existingMetadata: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {
      path: '',
      routes: []
    };

    const updatedMetadata: ControllerMetadata = {
      ...existingMetadata,
      path: path.startsWith('/') ? path : `/${path}`
    };

    Reflect.defineMetadata(CONTROLLER_METADATA_KEY, updatedMetadata, target);
  };
}

/**
 * 路由方法装饰器工厂
 */
function createMethodDecorator(method: HTTPMethod) {
  return function (path = ''): MethodDecorator {
    return function (target: any, propertyKey: string | symbol) {
      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
      
      // 获取参数元数据
      const parameterMetadata: ParameterMetadata[] = Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];
      
      const routeMetadata: RouteMetadata = {
        method,
        path: path.startsWith('/') ? path : `/${path}`,
        propertyKey: propertyKey as string,
        parameters: parameterMetadata
      };

      routes.push(routeMetadata);
      Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);

      // 更新控制器元数据
      const controllerMetadata: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target.constructor) || {
        path: '',
        routes: []
      };
      
      controllerMetadata.routes = routes;
      Reflect.defineMetadata(CONTROLLER_METADATA_KEY, controllerMetadata, target.constructor);
    };
  };
}

/**
 * GET 装饰器
 */
export const Get = createMethodDecorator('GET');

/**
 * POST 装饰器
 */
export const Post = createMethodDecorator('POST');

/**
 * PUT 装饰器
 */
export const Put = createMethodDecorator('PUT');

/**
 * DELETE 装饰器
 */
export const Delete = createMethodDecorator('DELETE');

/**
 * PATCH 装饰器
 */
export const Patch = createMethodDecorator('PATCH');

/**
 * HEAD 装饰器
 */
export const Head = createMethodDecorator('HEAD');

/**
 * OPTIONS 装饰器
 */
export const Options = createMethodDecorator('OPTIONS');

/**
 * 参数装饰器工厂
 */
function createParameterDecorator(type: 'body' | 'param' | 'query' | 'header') {
  return function (key?: string): ParameterDecorator {
    return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
      if (!propertyKey) return;

      const existingParameters: ParameterMetadata[] = Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];
      
      const parameterMetadata: ParameterMetadata = {
        index: parameterIndex,
        type,
        key
      };

      existingParameters[parameterIndex] = parameterMetadata;
      Reflect.defineMetadata(PARAMETER_METADATA_KEY, existingParameters, target, propertyKey);
    };
  };
}

/**
 * Body 装饰器 - 获取请求体
 */
export const Body = createParameterDecorator('body');

/**
 * Param 装饰器 - 获取路径参数
 */
export const Param = createParameterDecorator('param');

/**
 * Query 装饰器 - 获取查询参数
 */
export const Query = createParameterDecorator('query');

/**
 * Header 装饰器 - 获取请求头
 */
export const Header = createParameterDecorator('header');

/**
 * 中间件装饰器
 */
export function UseMiddleware(...middleware: Middleware[]): ClassDecorator | MethodDecorator {
  return function (target: any, propertyKey?: string | symbol) {
    if (propertyKey) {
      // 方法级中间件
      const routes: RouteMetadata[] = Reflect.getMetadata(ROUTE_METADATA_KEY, target.constructor) || [];
      const route = routes.find(r => r.propertyKey === propertyKey.toString());
      
      if (route) {
        route.middleware = [...(route.middleware || []), ...middleware];
        Reflect.defineMetadata(ROUTE_METADATA_KEY, routes, target.constructor);
      }
    } else {
      // 类级中间件
      const controllerMetadata: ControllerMetadata = Reflect.getMetadata(CONTROLLER_METADATA_KEY, target) || {
        path: '',
        routes: []
      };
      
      controllerMetadata.middleware = [...(controllerMetadata.middleware || []), ...middleware];
      Reflect.defineMetadata(CONTROLLER_METADATA_KEY, controllerMetadata, target);
    }
  };
}

/**
 * 缓存装饰器
 */
export function Cache(options: { ttl?: number; key?: string | ((ctx: any) => string) } = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const cacheMiddleware: Middleware = async (ctx, next) => {
      const cacheKey = typeof options.key === 'function' 
        ? options.key(ctx) 
        : options.key || `${ctx.request.method}:${ctx.request.url}`;
      
      // 简单的内存缓存实现
      const cache = (global as any).__httpCache || ((global as any).__httpCache = new Map());
      const ttl = options.ttl || 300000; // 默认5分钟
      
      if (ctx.request.method === 'GET') {
        const cached = cache.get(cacheKey) as { data: any; expires: number } | undefined;
        if (cached && cached.expires > Date.now()) {
          ctx.response.setHeader('X-Cache', 'HIT');
          ctx.json(cached.data);
          return;
        }
      }
      
      // 保存原始的 json 方法
      const originalJson = ctx.json;
      
      // 重写 json 方法以缓存响应
      ctx.json = (data: any) => {
        if (ctx.request.method === 'GET' && ctx.response.statusCode === 200) {
          cache.set(cacheKey, {
            data,
            expires: Date.now() + ttl
          });
          ctx.response.setHeader('X-Cache', 'MISS');
        }
        return originalJson.call(ctx, data);
      };
      
      await next();
    };
    
    (UseMiddleware(cacheMiddleware) as MethodDecorator)(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
  };
}

/**
 * 验证装饰器
 */
export function Validate(schema: any): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const validationMiddleware: Middleware = async (ctx, next) => {
      try {
        if (ctx.request.body && schema?.validate) {
          const result = schema.validate(ctx.request.body);
          if (result?.error) {
            ctx.throw(400, `Validation error: ${result.error.message}`);
          }
          if (result?.value !== undefined) {
            ctx.request.body = result.value;
          }
        }
        await next();
      } catch (error) {
        const err = error as any;
        if (err.statusCode) {
          throw error;
        }
        ctx.throw(400, `Validation error: ${(error as Error).message}`);
      }
    };
    
    (UseMiddleware(validationMiddleware) as MethodDecorator)(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
  };
}

/**
 * 认证装饰器
 */
export function Auth(options: { required?: boolean; roles?: string[] } = {}): ClassDecorator | MethodDecorator {
  return function (target: any, propertyKey?: string | symbol) {
    const authMiddleware: Middleware = async (ctx, next) => {
      const authHeader = ctx.request.headers.authorization;
      const token = typeof authHeader === 'string' ? authHeader.replace('Bearer ', '') : undefined;
      
      if (!token && options.required !== false) {
        ctx.throw(401, 'Authentication required');
      }
      
      if (token) {
        try {
          // 简单的JWT验证示例（实际应用中需要使用真实的JWT库）
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            ctx.throw(401, 'Invalid token format');
            return;
          }
          
          const payload = JSON.parse(Buffer.from(tokenParts[1]!, 'base64').toString());
          ctx.user = payload;
          
          // 角色验证
          if (options.roles && options.roles.length > 0) {
            const userRoles = (ctx.user?.roles as string[]) || [];
            const hasRequiredRole = options.roles.some(role => userRoles.includes(role));
            
            if (!hasRequiredRole) {
              ctx.throw(403, 'Insufficient permissions');
            }
          }
        } catch (error) {
          ctx.throw(401, 'Invalid token');
        }
      }
      
      await next();
    };
    
    if (propertyKey) {
      (UseMiddleware(authMiddleware) as MethodDecorator)(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
    } else {
      (UseMiddleware(authMiddleware) as ClassDecorator)(target);
    }
  };
}

/**
 * 限流装饰器
 */
export function RateLimit(options: { windowMs?: number; maxRequests?: number } = {}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
    const windowMs = options.windowMs || 60000; // 默认1分钟
    const maxRequests = options.maxRequests || 100; // 默认100次
    
    const rateLimitMiddleware: Middleware = async (ctx, next) => {
      const key = ctx.request.ip;
      const now = Date.now();
      
      let entry = rateLimitStore.get(key);
      
      if (!entry || now > entry.resetTime) {
        entry = { count: 1, resetTime: now + windowMs };
        rateLimitStore.set(key, entry);
      } else {
        entry.count++;
      }
      
      if (entry.count > maxRequests) {
        ctx.response.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
        ctx.throw(429, 'Too many requests');
      }
      
      ctx.response.setHeader('X-RateLimit-Limit', maxRequests.toString());
      ctx.response.setHeader('X-RateLimit-Remaining', (maxRequests - entry.count).toString());
      ctx.response.setHeader('X-RateLimit-Reset', entry.resetTime.toString());
      
      await next();
    };
    
    (UseMiddleware(rateLimitMiddleware) as MethodDecorator)(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
  };
}

/**
 * 响应时间装饰器
 */
export function ResponseTime(): MethodDecorator {
  return function (target: any, propertyKey: string | symbol) {
    const responseTimeMiddleware: Middleware = async (ctx, next) => {
      const startTime = Date.now();
      
      await next();
      
      const duration = Date.now() - startTime;
      ctx.response.setHeader('X-Response-Time', `${duration}ms`);
    };
    
    (UseMiddleware(responseTimeMiddleware) as MethodDecorator)(target, propertyKey, Object.getOwnPropertyDescriptor(target, propertyKey)!);
  };
}

/**
 * 获取控制器元数据
 */
export function getControllerMetadata(target: any): ControllerMetadata | undefined {
  return Reflect.getMetadata(CONTROLLER_METADATA_KEY, target);
}

/**
 * 获取路由元数据
 */
export function getRouteMetadata(target: any): RouteMetadata[] {
  return Reflect.getMetadata(ROUTE_METADATA_KEY, target) || [];
}

/**
 * 获取参数元数据
 */
export function getParameterMetadata(target: any, propertyKey: string | symbol): ParameterMetadata[] {
  return Reflect.getMetadata(PARAMETER_METADATA_KEY, target, propertyKey) || [];
}