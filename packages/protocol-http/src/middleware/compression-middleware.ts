/**
 * @fileoverview 压缩中间件实现
 */

import { Middleware, MiddlewareContext } from '../types/http-types.js';
import { compressData } from '../utils/http-utils.js';

export interface CompressionOptions {
  algorithm?: 'gzip' | 'deflate' | 'br';
  level?: number;
  threshold?: number;
  filter?: (ctx: MiddlewareContext) => boolean;
}

/**
 * 创建压缩中间件
 */
export function compression(options: CompressionOptions = {}): Middleware {
  const {
    algorithm = 'gzip',
    level = 6,
    threshold = 1024,
    filter = () => true
  } = options;

  return async (ctx: MiddlewareContext, next: () => Promise<void>) => {
    // 执行后续中间件
    await next();

    // 检查是否需要压缩
    if (!shouldCompress(ctx, threshold, filter)) {
      return;
    }

    const acceptEncoding = ctx.request.headers['accept-encoding'] as string || '';
    
    // 检查客户端是否支持压缩
    if (!acceptEncoding.includes(algorithm)) {
      return;
    }

    // 获取响应数据
    let data = ctx.response.body;
    if (!data) return;

    // 转换为Buffer或字符串
    if (typeof data === 'object') {
      data = JSON.stringify(data);
    }

    try {
      // 压缩数据
      const compressed = await compressData(data, algorithm);
      
      // 设置压缩头部
      ctx.response.setHeader('Content-Encoding', algorithm);
      ctx.response.setHeader('Vary', 'Accept-Encoding');
      ctx.response.setHeader('Content-Length', compressed.length.toString());
      
      // 更新响应体
      ctx.response.body = compressed;
    } catch (error) {
      console.error('Compression error:', error);
      // 压缩失败时不处理，使用原始数据
    }
  };
}

/**
 * 检查是否应该压缩
 */
function shouldCompress(
  ctx: MiddlewareContext,
  threshold: number,
  filter: (ctx: MiddlewareContext) => boolean
): boolean {
  // 只压缩成功的响应
  if (ctx.response.statusCode >= 400) {
    return false;
  }

  // 检查是否已经有Content-Encoding
  if (ctx.response.headers['content-encoding']) {
    return false;
  }

  // 检查Content-Type
  const contentType = ctx.response.headers['content-type'] as string || '';
  if (!isCompressible(contentType)) {
    return false;
  }

  // 检查内容长度
  const contentLength = getContentLength(ctx);
  if (contentLength !== null && contentLength < threshold) {
    return false;
  }

  // 应用自定义过滤器
  return filter(ctx);
}

/**
 * 检查内容类型是否可压缩
 */
function isCompressible(contentType: string): boolean {
  const compressibleTypes = [
    'text/',
    'application/json',
    'application/javascript',
    'application/xml',
    'application/rss+xml',
    'application/atom+xml',
    'image/svg+xml'
  ];

  return compressibleTypes.some(type => contentType.startsWith(type));
}

/**
 * 获取内容长度
 */
function getContentLength(ctx: MiddlewareContext): number | null {
  const contentLength = ctx.response.headers['content-length'];
  
  if (typeof contentLength === 'string') {
    return parseInt(contentLength, 10);
  }
  
  // 尝试从响应体计算长度
  if (ctx.response.body) {
    if (typeof ctx.response.body === 'string') {
      return Buffer.byteLength(ctx.response.body);
    } else if (Buffer.isBuffer(ctx.response.body)) {
      return ctx.response.body.length;
    } else if (typeof ctx.response.body === 'object') {
      return Buffer.byteLength(JSON.stringify(ctx.response.body));
    }
  }
  
  return null;
}