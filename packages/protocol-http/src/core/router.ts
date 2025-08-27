/**
 * @fileoverview HTTP路由器实现
 */

import { EventEmitter } from 'events';
import {
  HTTPMethod,
  RouteHandler,
  Middleware,
  MiddlewareContext,
  RouterConfig,
  RouteConfig
} from '../types/http-types.js';
import { normalizePath, extractPathParams, matchURLPattern } from '../utils/url-utils.js';

interface RouteEntry {
  method: HTTPMethod;
  pattern: string;
  originalPath: string;
  handler: RouteHandler;
  middleware: Middleware[];
  params: string[];
}

export class Router extends EventEmitter {
  private config: RouterConfig;
  private routes: RouteEntry[] = [];
  private middleware: Middleware[] = [];

  constructor(config: RouterConfig = {}) {
    super();
    this.config = {
      prefix: '',
      caseSensitive: false,
      strictSlash: true,
      ...config
    };
  }

  /**
   * 添加中间件
   */
  use(middleware: Middleware): this;
  use(path: string, middleware: Middleware): this;
  use(path: string, router: Router): this;
  use(pathOrMiddleware: string | Middleware | Router, middlewareOrRouter?: Middleware | Router): this {
    if (typeof pathOrMiddleware === 'function') {
      // use(middleware)
      this.middleware.push(pathOrMiddleware);
    } else if (typeof pathOrMiddleware === 'string') {
      if (middlewareOrRouter instanceof Router) {
        // use(path, router)
        this.mountRouter(pathOrMiddleware, middlewareOrRouter);
      } else if (typeof middlewareOrRouter === 'function') {
        // use(path, middleware)
        this.addPathMiddleware(pathOrMiddleware, middlewareOrRouter);
      }
    }
    
    return this;
  }

  /**
   * 添加路径中间件
   */
  private addPathMiddleware(path: string, middleware: Middleware): void {
    const normalizedPath = this.normalizePath(path);
    const pathMiddleware: Middleware = async (ctx, next) => {
      if (ctx.request.path.startsWith(normalizedPath)) {
        await middleware(ctx, next);
      } else {
        await next();
      }
    };
    
    this.middleware.push(pathMiddleware);
  }

  /**
   * 挂载子路由器
   */
  private mountRouter(path: string, router: Router): void {
    const normalizedPath = this.normalizePath(path);
    
    // 获取子路由器的所有路由
    for (const route of router.routes) {
      const fullPath = this.joinPaths(normalizedPath, route.originalPath);
      this.addRoute(route.method, fullPath, route.handler, route.middleware);
    }
    
    // 添加子路由器的中间件
    for (const middleware of router.middleware) {
      this.addPathMiddleware(normalizedPath, middleware);
    }
  }

  /**
   * 注册路由
   */
  route(config: RouteConfig): this {
    this.addRoute(config.method, config.path, config.handler, config.middleware || []);
    return this;
  }

  /**
   * GET路由
   */
  get(path: string, handler: RouteHandler): this;
  get(path: string, middleware: Middleware, handler: RouteHandler): this;
  get(path: string, middleware: Middleware[], handler: RouteHandler): this;
  get(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('GET', path, middlewareOrHandler, handler);
  }

  /**
   * POST路由
   */
  post(path: string, handler: RouteHandler): this;
  post(path: string, middleware: Middleware, handler: RouteHandler): this;
  post(path: string, middleware: Middleware[], handler: RouteHandler): this;
  post(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('POST', path, middlewareOrHandler, handler);
  }

  /**
   * PUT路由
   */
  put(path: string, handler: RouteHandler): this;
  put(path: string, middleware: Middleware, handler: RouteHandler): this;
  put(path: string, middleware: Middleware[], handler: RouteHandler): this;
  put(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('PUT', path, middlewareOrHandler, handler);
  }

  /**
   * DELETE路由
   */
  delete(path: string, handler: RouteHandler): this;
  delete(path: string, middleware: Middleware, handler: RouteHandler): this;
  delete(path: string, middleware: Middleware[], handler: RouteHandler): this;
  delete(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('DELETE', path, middlewareOrHandler, handler);
  }

  /**
   * PATCH路由
   */
  patch(path: string, handler: RouteHandler): this;
  patch(path: string, middleware: Middleware, handler: RouteHandler): this;
  patch(path: string, middleware: Middleware[], handler: RouteHandler): this;
  patch(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('PATCH', path, middlewareOrHandler, handler);
  }

  /**
   * HEAD路由
   */
  head(path: string, handler: RouteHandler): this;
  head(path: string, middleware: Middleware, handler: RouteHandler): this;
  head(path: string, middleware: Middleware[], handler: RouteHandler): this;
  head(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('HEAD', path, middlewareOrHandler, handler);
  }

  /**
   * OPTIONS路由
   */
  options(path: string, handler: RouteHandler): this;
  options(path: string, middleware: Middleware, handler: RouteHandler): this;
  options(path: string, middleware: Middleware[], handler: RouteHandler): this;
  options(path: string, middlewareOrHandler: Middleware | Middleware[] | RouteHandler, handler?: RouteHandler): this {
    return this.addRouteMethod('OPTIONS', path, middlewareOrHandler, handler);
  }

  /**
   * 添加路由方法的通用实现
   */
  private addRouteMethod(
    method: HTTPMethod,
    path: string,
    middlewareOrHandler: Middleware | Middleware[] | RouteHandler,
    handler?: RouteHandler
  ): this {
    let middleware: Middleware[] = [];
    let routeHandler: RouteHandler;

    if (typeof middlewareOrHandler === 'function' && !handler) {
      // 只有处理器
      routeHandler = middlewareOrHandler as RouteHandler;
    } else if (Array.isArray(middlewareOrHandler)) {
      // 中间件数组 + 处理器
      middleware = middlewareOrHandler;
      routeHandler = handler!;
    } else if (typeof middlewareOrHandler === 'function' && handler) {
      // 单个中间件 + 处理器
      middleware = [middlewareOrHandler as Middleware];
      routeHandler = handler;
    } else {
      throw new Error('Invalid route configuration');
    }

    this.addRoute(method, path, routeHandler, middleware);
    return this;
  }

  /**
   * 添加路由
   */
  private addRoute(method: HTTPMethod, path: string, handler: RouteHandler, middleware: Middleware[]): void {
    const normalizedPath = this.normalizePath(path);
    const pattern = this.createPattern(normalizedPath);
    const params = this.extractParamNames(normalizedPath);

    const route: RouteEntry = {
      method,
      pattern,
      originalPath: path,
      handler,
      middleware,
      params
    };

    this.routes.push(route);
    
    this.emit('route-added', {
      method,
      path: normalizedPath,
      originalPath: path
    });
  }

  /**
   * 规范化路径
   */
  private normalizePath(path: string): string {
    let normalized = normalizePath(path);
    
    // 添加前缀
    if (this.config.prefix) {
      const prefix = normalizePath(this.config.prefix);
      normalized = this.joinPaths(prefix, normalized);
    }
    
    // 处理大小写敏感
    if (!this.config.caseSensitive) {
      normalized = normalized.toLowerCase();
    }
    
    return normalized;
  }

  /**
   * 连接路径
   */
  private joinPaths(basePath: string, path: string): string {
    const base = basePath.replace(/\/$/, '');
    const relative = path.replace(/^\//, '');
    
    if (!relative) {
      return base || '/';
    }
    
    return `${base}/${relative}`;
  }

  /**
   * 创建匹配模式
   */
  private createPattern(path: string): string {
    return path
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义特殊字符
      .replace(/:(\w+)(\([^)]+\))?/g, (match, name, constraint) => {
        // 参数匹配，支持约束
        if (constraint) {
          return constraint.slice(1, -1); // 移除括号
        }
        return '([^/]+)';
      })
      .replace(/\\\*/g, '(.*)'); // 通配符
  }

  /**
   * 提取参数名称
   */
  private extractParamNames(path: string): string[] {
    const params: string[] = [];
    const matches = path.matchAll(/:(\w+)/g);
    
    for (const match of matches) {
      params.push(match[1]!);
    }
    
    return params;
  }

  /**
   * 匹配路由
   */
  match(method: HTTPMethod, path: string): { route: RouteEntry; params: Record<string, string> } | null {
    let matchPath = path;
    
    // 处理大小写敏感
    if (!this.config.caseSensitive) {
      matchPath = path.toLowerCase();
    }
    
    // 处理严格斜杠
    if (this.config.strictSlash && matchPath !== '/' && matchPath.endsWith('/')) {
      matchPath = matchPath.slice(0, -1);
    }
    
    for (const route of this.routes) {
      if (route.method === method) {
        const regex = new RegExp(`^${route.pattern}$`);
        const match = regex.exec(matchPath);
        
        if (match) {
          const params: Record<string, string> = {};
          
          // 提取参数值
          for (let i = 0; i < route.params.length; i++) {
            const paramName = route.params[i]!;
            const paramValue = match[i + 1]!;
            params[paramName] = paramValue;
          }
          
          return { route, params };
        }
      }
    }
    
    return null;
  }

  /**
   * 处理请求
   */
  async handle(ctx: MiddlewareContext): Promise<boolean> {
    const { method, path } = ctx.request;
    const matchResult = this.match(method, path);
    
    if (!matchResult) {
      return false; // 没有匹配的路由
    }
    
    const { route, params } = matchResult;
    
    // 设置路径参数
    ctx.params = { ...ctx.params, ...params };
    ctx.request.params = { ...ctx.request.params, ...params };
    
    // 执行中间件链
    const allMiddleware = [...this.middleware, ...route.middleware];
    let index = 0;
    
    const next = async (): Promise<void> => {
      if (index < allMiddleware.length) {
        const middleware = allMiddleware[index++]!;
        await middleware(ctx, next);
      } else {
        // 执行路由处理器
        await route.handler(ctx);
      }
    };
    
    await next();
    return true;
  }

  /**
   * 获取所有路由
   */
  getRoutes(): Array<{ method: HTTPMethod; path: string; originalPath: string }> {
    return this.routes.map(route => ({
      method: route.method,
      path: route.pattern,
      originalPath: route.originalPath
    }));
  }

  /**
   * 生成URL
   */
  url(name: string, params: Record<string, string | number> = {}): string {
    // 简单的URL生成实现
    const route = this.routes.find(r => r.originalPath === name);
    if (!route) {
      throw new Error(`Route not found: ${name}`);
    }
    
    let url = route.originalPath;
    
    // 替换参数
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
    
    return url;
  }

  /**
   * 清除所有路由
   */
  clear(): void {
    this.routes = [];
    this.middleware = [];
    this.emit('routes-cleared');
  }

  /**
   * 获取路由统计信息
   */
  getStats(): {
    routeCount: number;
    middlewareCount: number;
    methodCounts: Record<HTTPMethod, number>;
  } {
    const methodCounts = {} as Record<HTTPMethod, number>;
    
    for (const route of this.routes) {
      methodCounts[route.method] = (methodCounts[route.method] || 0) + 1;
    }
    
    return {
      routeCount: this.routes.length,
      middlewareCount: this.middleware.length,
      methodCounts
    };
  }
}