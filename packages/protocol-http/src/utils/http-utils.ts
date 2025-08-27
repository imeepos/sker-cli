/**
 * @fileoverview HTTP协议工具函数
 */

import { IncomingMessage, ServerResponse } from 'http';
import { HTTPHeaders, HTTPQuery, HTTPParams } from '../types/http-types.js';
import { HTTP_STATUS_TEXT, CONTENT_TYPES } from '../constants/http-constants.js';

/**
 * 解析查询字符串为对象
 */
export function parseQuery(queryString: string): HTTPQuery {
  if (!queryString) return {};

  const query: HTTPQuery = {};
  const pairs = queryString.split('&');

  for (const pair of pairs) {
    const [key, value] = pair.split('=').map(decodeURIComponent);
    const k = key!;
    if (query[k]) {
      // 如果已存在，转换为数组
      if (Array.isArray(query[k])) {
        (query[k] as string[]).push(value!);
      } else {
        query[k] = [query[k] as string, value!];
      }
    } else {
      query[k] = value;
    }
  }

  return query;
}

/**
 * 解析路径参数
 */
export function parseParams(pattern: string, path: string): HTTPParams {
  const params: HTTPParams = {};

  // 简单的参数匹配实现
  const patternParts = pattern.split('/');
  const pathParts = path.split('/');

  for (let i = 0; i < patternParts.length; i++) {
    const patternPart = patternParts[i]!;
    const pathPart = pathParts[i]!;

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      params[paramName] = pathPart;
    }
  }

  return params;
}

/**
 * 解析HTTP头部
 */
export function parseHeaders(headers: IncomingMessage['headers']): HTTPHeaders {
  const result: HTTPHeaders = {};

  for (const [key, value] of Object.entries(headers)) {
    result[key] = value;
  }

  return result;
}

/**
 * 获取客户端IP地址
 */
export function getClientIP(req: IncomingMessage): string {
  const headers = req.headers;

  return (
    (headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    (headers['x-real-ip'] as string) ||
    req.socket.remoteAddress ||
    '127.0.0.1'
  );
}

/**
 * 解析请求体
 */
export async function parseRequestBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';

    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      try {
        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
          resolve(JSON.parse(body));
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          resolve(parseQuery(body));
        } else {
          resolve(body);
        }
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

/**
 * 设置响应头部
 */
export function setResponseHeaders(res: ServerResponse, headers: HTTPHeaders): void {
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) {
      res.setHeader(key, value);
    }
  }
}

/**
 * 发送JSON响应
 */
export function sendJSON(res: ServerResponse, data: any, statusCode = 200): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', CONTENT_TYPES.JSON);
  res.end(JSON.stringify(data));
}

/**
 * 发送文本响应
 */
export function sendText(res: ServerResponse, text: string, statusCode = 200): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', CONTENT_TYPES.PLAIN);
  res.end(text);
}

/**
 * 发送错误响应
 */
export function sendError(res: ServerResponse, statusCode: number, message?: string): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', CONTENT_TYPES.JSON);
  res.end(JSON.stringify({
    success: false,
    error: {
      code: statusCode,
      message: message || HTTP_STATUS_TEXT[statusCode as keyof typeof HTTP_STATUS_TEXT] || 'Unknown Error'
    },
    timestamp: new Date().toISOString()
  }));
}

/**
 * 匹配路径模式
 */
export function matchPath(pattern: string, path: string): boolean {
  // 简单的路径匹配实现
  const regexPattern = pattern
    .replace(/:\w+/g, '([^/]+)')  // 参数匹配
    .replace(/\*/g, '(.*)');      // 通配符匹配

  const regex = new RegExp(`^${regexPattern}$`);
  return regex.test(path);
}

/**
 * 检查是否为安全方法
 */
export function isSafeMethod(method: string): boolean {
  return ['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());
}

/**
 * 检查是否为幂等方法
 */
export function isIdempotentMethod(method: string): boolean {
  return ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS', 'TRACE'].includes(method.toUpperCase());
}

/**
 * 生成请求ID
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 解析Content-Type
 */
export function parseContentType(contentType: string): { type: string; charset?: BufferEncoding } {
  const [type, ...params] = contentType.split(';').map(s => s.trim());
  const charset = params.find(p => p.startsWith('charset='))?.split('=')[1] as BufferEncoding;

  return { type: type!, charset };
}

/**
 * 格式化HTTP头部名称
 */
export function formatHeaderName(name: string): string {
  return name
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('-');
}

/**
 * 检查Accept头部是否匹配
 */
export function acceptsType(acceptHeader: string, contentType: string): boolean {
  if (!acceptHeader) return true;

  const acceptedTypes = acceptHeader
    .split(',')
    .map(type => type.trim().split(';')[0])
    .map(type => type === '*/*' ? '.*' : type!.replace('*', '.*'));

  return acceptedTypes.some(type => new RegExp(type).test(contentType));
}

/**
 * 解析Range头部
 */
export function parseRange(rangeHeader: string, totalSize: number): { start: number; end: number } | null {
  const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
  if (!match) return null;

  const start = parseInt(match[1]!, 10);
  const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

  if (start >= totalSize || end >= totalSize || start > end) {
    return null;
  }

  return { start, end };
}

/**
 * 计算ETag
 */
export function calculateETag(data: string | Buffer): string {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(data).digest('hex');
  return `"${hash}"`;
}

/**
 * 检查If-None-Match条件
 */
export function checkIfNoneMatch(ifNoneMatch: string, etag: string): boolean {
  if (!ifNoneMatch) return false;

  const tags = ifNoneMatch.split(',').map(tag => tag.trim());
  return tags.includes('*') || tags.includes(etag);
}

/**
 * 检查If-Modified-Since条件
 */
export function checkIfModifiedSince(ifModifiedSince: string, lastModified: Date): boolean {
  if (!ifModifiedSince) return true;

  const ifModifiedSinceDate = new Date(ifModifiedSince);
  return lastModified > ifModifiedSinceDate;
}

/**
 * 压缩数据
 */
export async function compressData(data: string | Buffer, algorithm: 'gzip' | 'deflate' | 'br'): Promise<Buffer> {
  const zlib = require('zlib');

  return new Promise((resolve, reject) => {
    const callback = (error: Error | null, result: Buffer) => {
      if (error) reject(error);
      else resolve(result);
    };

    switch (algorithm) {
      case 'gzip':
        zlib.gzip(data, callback);
        break;
      case 'deflate':
        zlib.deflate(data, callback);
        break;
      case 'br':
        zlib.brotliCompress(data, callback);
        break;
      default:
        reject(new Error(`Unsupported compression algorithm: ${algorithm}`));
    }
  });
}

/**
 * 解压数据
 */
export async function decompressData(data: Buffer, algorithm: 'gzip' | 'deflate' | 'br'): Promise<Buffer> {
  const zlib = require('zlib');

  return new Promise((resolve, reject) => {
    const callback = (error: Error | null, result: Buffer) => {
      if (error) reject(error);
      else resolve(result);
    };

    switch (algorithm) {
      case 'gzip':
        zlib.gunzip(data, callback);
        break;
      case 'deflate':
        zlib.inflate(data, callback);
        break;
      case 'br':
        zlib.brotliDecompress(data, callback);
        break;
      default:
        reject(new Error(`Unsupported decompression algorithm: ${algorithm}`));
    }
  });
}