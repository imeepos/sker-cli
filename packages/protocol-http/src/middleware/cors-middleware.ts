/**
 * @fileoverview CORS中间件实现
 */

import { Middleware, MiddlewareContext } from '../types/http-types.js';
import { HTTP_STATUS } from '../constants/http-constants.js';

export interface CorsOptions {
  origin?: string | string[] | RegExp | ((origin: string) => boolean);
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
}

/**
 * 创建CORS中间件
 */
export function cors(options: CorsOptions = {}): Middleware {
  const {
    origin = '*',
    methods = ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
    allowedHeaders = ['Content-Type', 'Authorization'],
    exposedHeaders = [],
    credentials = false,
    maxAge = 86400, // 24小时
    preflightContinue = false,
    optionsSuccessStatus = HTTP_STATUS.NO_CONTENT
  } = options;

  return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
    const requestOrigin = ctx.request.headers.origin as string;
    const requestMethod = ctx.request.method;

    // 设置允许的源
    let allowedOrigin = '';
    if (typeof origin === 'string') {
      allowedOrigin = origin;
    } else if (Array.isArray(origin)) {
      allowedOrigin = origin.includes(requestOrigin) ? requestOrigin : '';
    } else if (origin instanceof RegExp) {
      allowedOrigin = origin.test(requestOrigin) ? requestOrigin : '';
    } else if (typeof origin === 'function') {
      allowedOrigin = origin(requestOrigin) ? requestOrigin : '';
    }

    // 设置CORS头部
    if (allowedOrigin) {
      ctx.response.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }

    if (credentials) {
      ctx.response.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (exposedHeaders.length > 0) {
      ctx.response.setHeader('Access-Control-Expose-Headers', exposedHeaders.join(', '));
    }

    // 处理预检请求
    if (requestMethod === 'OPTIONS') {
      ctx.response.setHeader('Access-Control-Allow-Methods', methods.join(', '));
      ctx.response.setHeader('Access-Control-Allow-Headers', allowedHeaders.join(', '));
      ctx.response.setHeader('Access-Control-Max-Age', maxAge.toString());

      if (!preflightContinue) {
        ctx.response.status(optionsSuccessStatus);
        ctx.response.end();
        return;
      }
    }

    await next();
  };
}

/**
 * 检查是否为预检请求
 */
function isPreflight(ctx: MiddlewareContext): boolean {
  return (
    ctx.request.method === 'OPTIONS' &&
    !!ctx.request.headers['access-control-request-method']
  );
}

/**
 * 获取请求头列表
 */
function getAccessControlRequestHeaders(ctx: MiddlewareContext): string[] {
  const header = ctx.request.headers['access-control-request-headers'];
  if (!header) return [];
  
  return Array.isArray(header) ? header : [header];
}