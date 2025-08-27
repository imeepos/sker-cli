/**
 * @fileoverview HTTP服务器核心实现
 */
import "reflect-metadata"
import http from 'http';
import https from 'https';
import fs from 'fs/promises';
import { EventEmitter } from 'events';
import { 
  ServerConfig, 
  HTTPRequest, 
  HTTPResponse,
  Middleware, 
  MiddlewareContext,
  RouteHandler,
  HTTPMethod,
  ControllerMetadata
} from '../types/http-types.js';
import { 
  parseQuery, 
  parseParams, 
  parseHeaders, 
  getClientIP, 
  parseRequestBody,
  sendJSON,
  sendError,
  generateRequestId
} from '../utils/http-utils.js';
import { normalizePath } from '../utils/url-utils.js';
import { HTTP_STATUS, DEFAULT_CONFIG } from '../constants/http-constants.js';

export class HTTPServer extends EventEmitter {
  private config: ServerConfig;
  private server?: http.Server | https.Server;
  private middleware: Middleware[] = [];
  private routes = new Map<string, Map<string, RouteHandler>>();
  private controllers = new Map<string, any>();

  constructor(config: Partial<ServerConfig> = {}) {
    super();
    this.config = this.mergeConfig(config);
  }

  /**
   * 合并配置
   */
  private mergeConfig(userConfig: Partial<ServerConfig>): ServerConfig {
    return {
      host: userConfig.host || DEFAULT_CONFIG.SERVER.HOST,
      port: userConfig.port || DEFAULT_CONFIG.SERVER.PORT,
      https: {
        enabled: false,
        ...userConfig.https
      },
      cors: {
        enabled: true,
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
        credentials: false,
        maxAge: 86400,
        ...userConfig.cors
      },
      compression: {
        enabled: true,
        algorithm: 'gzip',
        level: 6,
        threshold: 1024,
        ...userConfig.compression
      },
      rateLimit: {
        enabled: false,
        windowMs: DEFAULT_CONFIG.RATE_LIMIT.WINDOW_MS,
        maxRequests: DEFAULT_CONFIG.RATE_LIMIT.MAX_REQUESTS,
        message: 'Too many requests',
        keyGenerator: (req) => req.ip,
        skip: () => false,
        ...userConfig.rateLimit
      },
      parsing: {
        json: {
          limit: '10mb',
          strict: true
        },
        urlencoded: {
          limit: '10mb',
          extended: true
        },
        multipart: {
          limit: '50mb',
          maxFiles: 10
        },
        ...userConfig.parsing
      },
      static: {
        enabled: false,
        root: './public',
        maxAge: 86400000,
        index: ['index.html'],
        ...userConfig.static
      },
      performance: {
        maxConnections: DEFAULT_CONFIG.SERVER.MAX_CONNECTIONS,
        keepAliveTimeout: DEFAULT_CONFIG.SERVER.KEEP_ALIVE_TIMEOUT,
        headersTimeout: 60000,
        requestTimeout: DEFAULT_CONFIG.SERVER.TIMEOUT,
        maxHeaderSize: 8192,
        maxRequestSize: '50MB',
        ...userConfig.performance
      },
      ...userConfig
    };
  }

  /**
   * 添加中间件
   */
  use(middleware: Middleware | Middleware[] | string | string[]): this {
    if (Array.isArray(middleware)) {
      for (const m of middleware) {
        this.use(m);
      }
    } else if (typeof middleware === 'string') {
      // 内置中间件
      const builtinMiddleware = this.getBuiltinMiddleware(middleware);
      if (builtinMiddleware) {
        this.middleware.push(builtinMiddleware);
      }
    } else {
      this.middleware.push(middleware);
    }
    return this;
  }

  /**
   * 获取内置中间件
   */
  private getBuiltinMiddleware(name: string): Middleware | null {
    switch (name) {
      case 'cors':
        return this.createCorsMiddleware();
      case 'compression':
        return this.createCompressionMiddleware();
      case 'rateLimit':
        return this.createRateLimitMiddleware();
      case 'logging':
        return this.createLoggingMiddleware();
      case 'errorHandler':
        return this.createErrorHandlerMiddleware();
      default:
        return null;
    }
  }

  /**
   * 创建CORS中间件
   */
  private createCorsMiddleware(): Middleware {
    const corsConfig = this.config.cors!;
    
    return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const { request, response } = ctx;
      const origin = request.headers.origin as string;

      // 检查origin是否被允许
      let allowedOrigin = '';
      if (typeof corsConfig.origin === 'string') {
        allowedOrigin = corsConfig.origin;
      } else if (Array.isArray(corsConfig.origin)) {
        if (corsConfig.origin.includes(origin)) {
          allowedOrigin = origin;
        }
      } else if (corsConfig.origin instanceof RegExp) {
        if (corsConfig.origin.test(origin)) {
          allowedOrigin = origin;
        }
      } else if (typeof corsConfig.origin === 'function') {
        if (corsConfig.origin(origin)) {
          allowedOrigin = origin;
        }
      }

      response.setHeader('Access-Control-Allow-Origin', allowedOrigin || corsConfig.origin as string);
      
      if (corsConfig.credentials) {
        response.setHeader('Access-Control-Allow-Credentials', 'true');
      }

      response.setHeader('Access-Control-Allow-Methods', corsConfig.methods.join(', '));
      response.setHeader('Access-Control-Allow-Headers', corsConfig.allowedHeaders.join(', '));
      
      if (corsConfig.exposedHeaders) {
        response.setHeader('Access-Control-Expose-Headers', corsConfig.exposedHeaders.join(', '));
      }

      response.setHeader('Access-Control-Max-Age', corsConfig.maxAge.toString());

      // 处理预检请求
      if (request.method === 'OPTIONS') {
        response.statusCode = HTTP_STATUS.NO_CONTENT;
        response.end();
        return;
      }

      await next();
    };
  }

  /**
   * 创建压缩中间件
   */
  private createCompressionMiddleware(): Middleware {
    return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      await next();
      
      const acceptEncoding = ctx.request.headers['accept-encoding'] as string || '';
      const compressionConfig = this.config.compression!;
      
      if (!compressionConfig.enabled) return;

      // 检查是否支持压缩
      if (acceptEncoding.includes(compressionConfig.algorithm)) {
        ctx.response.setHeader('Content-Encoding', compressionConfig.algorithm);
        ctx.response.setHeader('Vary', 'Accept-Encoding');
      }
    };
  }

  /**
   * 创建限流中间件
   */
  private createRateLimitMiddleware(): Middleware {
    const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
    const rateLimitConfig = this.config.rateLimit!;

    return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      if (!rateLimitConfig.enabled || rateLimitConfig.skip(ctx.request)) {
        await next();
        return;
      }

      const key = rateLimitConfig.keyGenerator(ctx.request);
      const now = Date.now();
      const windowMs = rateLimitConfig.windowMs;
      
      let entry = rateLimitStore.get(key);
      
      if (!entry || now > entry.resetTime) {
        entry = { count: 1, resetTime: now + windowMs };
        rateLimitStore.set(key, entry);
      } else {
        entry.count++;
      }

      if (entry.count > rateLimitConfig.maxRequests) {
        ctx.response.statusCode = HTTP_STATUS.TOO_MANY_REQUESTS;
        ctx.response.setHeader('Retry-After', Math.ceil((entry.resetTime - now) / 1000).toString());
        ctx.json({ error: rateLimitConfig.message });
        return;
      }

      ctx.response.setHeader('X-RateLimit-Limit', rateLimitConfig.maxRequests.toString());
      ctx.response.setHeader('X-RateLimit-Remaining', (rateLimitConfig.maxRequests - entry.count).toString());
      ctx.response.setHeader('X-RateLimit-Reset', entry.resetTime.toString());

      await next();
    };
  }

  /**
   * 创建日志中间件
   */
  private createLoggingMiddleware(): Middleware {
    return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      const startTime = Date.now();
      const { method, url, ip } = ctx.request;
      const requestId = generateRequestId();
      
      ctx.state.requestId = requestId;
      ctx.response.setHeader('X-Request-ID', requestId);

      console.log(`[${new Date().toISOString()}] ${requestId} ${method} ${url} - ${ip}`);

      try {
        await next();
        const duration = Date.now() - startTime;
        console.log(`[${new Date().toISOString()}] ${requestId} ${method} ${url} - ${ctx.response.statusCode} - ${duration}ms`);
      } catch (error) {
        const duration = Date.now() - startTime;
        const statusCode = (error as any).statusCode || 500;
        console.error(`[${new Date().toISOString()}] ${requestId} ${method} ${url} - ${statusCode} - ${duration}ms - ${(error as Error).message}`);
        throw error;
      }
    };
  }

  /**
   * 创建错误处理中间件
   */
  private createErrorHandlerMiddleware(): Middleware {
    return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
      try {
        await next();
      } catch (error) {
        const err = error as any;
        const statusCode = err.statusCode || HTTP_STATUS.INTERNAL_SERVER_ERROR;
        const message = err.message || 'Internal Server Error';

        console.error('HTTP Error:', {
          requestId: ctx.state.requestId,
          statusCode,
          message,
          stack: err.stack,
          request: {
            method: ctx.request.method,
            url: ctx.request.url,
            headers: ctx.request.headers
          }
        });

        ctx.response.statusCode = statusCode;
        ctx.json({
          success: false,
          error: {
            code: statusCode,
            message: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : message
          },
          timestamp: new Date().toISOString(),
          requestId: ctx.state.requestId
        });
      }
    };
  }

  /**
   * 注册路由
   */
  route(method: HTTPMethod, path: string, handler: RouteHandler): this {
    const normalizedPath = normalizePath(path);
    
    if (!this.routes.has(normalizedPath)) {
      this.routes.set(normalizedPath, new Map());
    }
    
    this.routes.get(normalizedPath)!.set(method, handler);
    return this;
  }

  /**
   * GET路由
   */
  get(path: string, handler: RouteHandler): this {
    return this.route('GET', path, handler);
  }

  /**
   * POST路由
   */
  post(path: string, handler: RouteHandler): this {
    return this.route('POST', path, handler);
  }

  /**
   * PUT路由
   */
  put(path: string, handler: RouteHandler): this {
    return this.route('PUT', path, handler);
  }

  /**
   * DELETE路由
   */
  delete(path: string, handler: RouteHandler): this {
    return this.route('DELETE', path, handler);
  }

  /**
   * PATCH路由
   */
  patch(path: string, handler: RouteHandler): this {
    return this.route('PATCH', path, handler);
  }

  /**
   * 注册控制器
   */
  registerController(ControllerClass: any): this {
    const instance = new ControllerClass();
    const metadata: ControllerMetadata = Reflect.getMetadata('controller', ControllerClass) || { path: '', routes: [] };
    
    for (const route of metadata.routes) {
      const fullPath = metadata.path + route.path;
      this.route(route.method, fullPath, instance[route.propertyKey].bind(instance));
    }

    this.controllers.set(ControllerClass.name, instance);
    return this;
  }

  /**
   * 启动服务器
   */
  async start(): Promise<void> {
    await this.createServer();
    
    return new Promise((resolve, reject) => {
      if (!this.server) {
        reject(new Error('Server not created'));
        return;
      }

      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`HTTP服务器运行在 ${this.config.https?.enabled ? 'https' : 'http'}://${this.config.host}:${this.config.port}`);
        this.emit('listening');
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('Server error:', error);
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * 创建服务器实例
   */
  private async createServer(): Promise<void> {
    const requestHandler = this.createRequestHandler();

    if (this.config.https?.enabled) {
      const options = await this.loadHTTPSOptions();
      this.server = https.createServer(options, requestHandler);
    } else {
      this.server = http.createServer(requestHandler);
    }

    // 设置性能参数
    if (this.config.performance) {
      const perf = this.config.performance;
      this.server.maxConnections = perf.maxConnections;
      this.server.keepAliveTimeout = perf.keepAliveTimeout;
      this.server.headersTimeout = perf.headersTimeout;
      this.server.requestTimeout = perf.requestTimeout;
    }
  }

  /**
   * 加载HTTPS选项
   */
  private async loadHTTPSOptions(): Promise<https.ServerOptions> {
    const httpsConfig = this.config.https!;
    const options: https.ServerOptions = {};

    if (httpsConfig.keyFile) {
      options.key = await fs.readFile(httpsConfig.keyFile);
    }

    if (httpsConfig.certFile) {
      options.cert = await fs.readFile(httpsConfig.certFile);
    }

    if (httpsConfig.caFile) {
      options.ca = await fs.readFile(httpsConfig.caFile);
    }

    return options;
  }

  /**
   * 创建请求处理器
   */
  private createRequestHandler() {
    return async (req: http.IncomingMessage, res: http.ServerResponse) => {
      try {
        const context = await this.createMiddlewareContext(req, res);
        await this.executeMiddleware(context);
      } catch (error) {
        console.error('Request handler error:', error);
        if (!res.headersSent) {
          sendError(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, 'Internal Server Error');
        }
      }
    };
  }

  /**
   * 创建中间件上下文
   */
  private async createMiddlewareContext(req: http.IncomingMessage, res: http.ServerResponse): Promise<MiddlewareContext> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const query = parseQuery(url.search.slice(1));
    const params = {}; // 将在路由匹配时填充
    const headers = parseHeaders(req.headers);
    const body = req.method !== 'GET' && req.method !== 'HEAD' ? await parseRequestBody(req) : undefined;

    const request: HTTPRequest = {
      method: req.method as HTTPMethod,
      url: req.url || '/',
      path: url.pathname,
      query,
      params,
      headers,
      body,
      raw: req,
      ip: getClientIP(req),
      socket: req.socket
    };

    const response: HTTPResponse = {
      statusCode: HTTP_STATUS.OK,
      headers: {},
      raw: res,
      
      status: (code: number) => {
        response.statusCode = code;
        return response;
      },
      
      header: (name: string, value: string) => {
        response.headers[name] = value;
        return response;
      },
      
      setHeader: (name: string, value: string) => {
        response.headers[name] = value;
        res.setHeader(name, value);
        return response;
      },
      
      json: (data: any) => {
        sendJSON(res, data, response.statusCode);
      },
      
      send: (data: any) => {
        res.statusCode = response.statusCode;
        res.end(data);
      },
      
      end: () => {
        res.end();
      }
    };

    return {
      request,
      response,
      params,
      query,
      state: {},
      
      throw: (status: number, message?: string): never => {
        const error: any = new Error(message);
        error.statusCode = status;
        throw error;
      },
      
      json: (data: any) => response.json(data),
      send: (data: any) => response.send(data)
    };
  }

  /**
   * 执行中间件链
   */
  private async executeMiddleware(ctx: MiddlewareContext): Promise<void> {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index < this.middleware.length) {
        const middleware = this.middleware[index++]!;
        await middleware(ctx, next);
      } else {
        // 执行路由处理
        await this.executeRoute(ctx);
      }
    };

    await next();
  }

  /**
   * 执行路由处理
   */
  private async executeRoute(ctx: MiddlewareContext): Promise<void> {
    const { method, path } = ctx.request;
    
    // 查找匹配的路由
    for (const [routePath, handlers] of this.routes) {
      if (this.matchRoute(routePath, path)) {
        const handler = handlers.get(method);
        if (handler) {
          // 提取路径参数
          ctx.params = parseParams(routePath, path);
          ctx.request.params = ctx.params;
          
          await handler(ctx);
          return;
        }
      }
    }

    // 没找到路由，返回404
    ctx.throw(HTTP_STATUS.NOT_FOUND, 'Route not found');
  }

  /**
   * 匹配路由
   */
  private matchRoute(pattern: string, path: string): boolean {
    if (pattern === path) return true;
    
    // 简单的参数匹配
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) return false;
    
    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i]!;
      const pathPart = pathParts[i];
      
      if (patternPart.startsWith(':')) continue; // 参数匹配
      if (patternPart !== pathPart) return false;
    }
    
    return true;
  }

  /**
   * 优雅关闭
   */
  async gracefulShutdown(timeout = 5000): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.server) {
        resolve();
        return;
      }

      const timer = setTimeout(() => {
        reject(new Error('Graceful shutdown timeout'));
      }, timeout);

      this.server.close((error) => {
        clearTimeout(timer);
        if (error) {
          reject(error);
        } else {
          console.log('HTTP服务器已关闭');
          this.emit('close');
          resolve();
        }
      });
    });
  }
}