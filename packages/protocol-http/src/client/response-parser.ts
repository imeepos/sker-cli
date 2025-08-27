/**
 * @fileoverview 响应解析器实现
 */

import { HTTPResponseData, HTTPHeaders } from '../types/http-types.js';
import { parseContentType } from '../utils/http-utils.js';

export class ResponseParser {
  /**
   * 解析响应数据
   */
  static async parse<T = any>(
    data: Buffer | string,
    headers: HTTPHeaders,
    responseType?: 'json' | 'text' | 'blob' | 'stream'
  ): Promise<T> {
    const contentType = headers['content-type'] as string || '';
    const { type: mediaType, charset } = parseContentType(contentType);

    // 如果指定了响应类型，按指定类型解析
    if (responseType) {
      return this.parseByType(data, responseType, charset) as T;
    }

    // 根据Content-Type自动推断解析方式
    if (mediaType.includes('application/json')) {
      return this.parseJSON(data, charset) as T;
    } else if (mediaType.includes('text/')) {
      return this.parseText(data, charset) as T;
    } else if (mediaType.includes('application/xml') || mediaType.includes('text/xml')) {
      return this.parseXML(data, charset) as T;
    } else if (mediaType.includes('application/x-www-form-urlencoded')) {
      return this.parseFormURLEncoded(data, charset) as T;
    } else {
      // 默认返回Buffer
      return data as T;
    }
  }

  /**
   * 按指定类型解析
   */
  private static parseByType(data: Buffer | string, type: string, charset?: BufferEncoding): any {
    switch (type) {
      case 'json':
        return this.parseJSON(data, charset);
      case 'text':
        return this.parseText(data, charset);
      case 'blob':
        return Buffer.isBuffer(data) ? data : Buffer.from(data);
      case 'stream':
        return data;
      default:
        return data;
    }
  }

  /**
   * 解析JSON
   */
  private static parseJSON(data: Buffer | string, charset: BufferEncoding = 'utf8'): any {
    try {
      const text = Buffer.isBuffer(data) ? data.toString(charset) : data;
      return JSON.parse(text);
    } catch (error) {
      throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
    }
  }

  /**
   * 解析文本
   */
  private static parseText(data: Buffer | string, charset: BufferEncoding = 'utf8'): string {
    return Buffer.isBuffer(data) ? data.toString(charset) : data;
  }

  /**
   * 解析XML
   */
  private static parseXML(data: Buffer | string, charset: BufferEncoding = 'utf8'): any {
    const text = Buffer.isBuffer(data) ? data.toString(charset) : data;
    
    // 简单的XML解析实现
    try {
      return this.simpleXMLParse(text);
    } catch (error) {
      throw new Error(`Failed to parse XML: ${(error as Error).message}`);
    }
  }

  /**
   * 解析表单编码数据
   */
  private static parseFormURLEncoded(data: Buffer | string, charset: BufferEncoding = 'utf8'): Record<string, any> {
    const text = Buffer.isBuffer(data) ? data.toString(charset) : data;
    const result: Record<string, any> = {};
    
    const pairs = text.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=').map(decodeURIComponent);
      if (key) {
        result[key] = value || '';
      }
    }
    
    return result;
  }

  /**
   * 简单的XML解析器
   */
  private static simpleXMLParse(xml: string): any {
    const result: any = {};
    
    // 移除XML声明和注释
    xml = xml.replace(/<\?xml[^>]*\?>/g, '').replace(/<!--[\s\S]*?-->/g, '');
    
    // 简单的标签匹配
    const tagRegex = /<(\w+)[^>]*>([\s\S]*?)<\/\1>/g;
    let match;
    
    while ((match = tagRegex.exec(xml)) !== null) {
      const tagName = match[1]!;
      const content = match[2]!.trim();
      
      if (content.includes('<')) {
        // 嵌套标签，递归解析
        result[tagName] = this.simpleXMLParse(content);
      } else {
        // 文本内容
        result[tagName] = content;
      }
    }
    
    return result;
  }

  /**
   * 验证响应状态
   */
  static validateStatus(status: number, validateFn?: (status: number) => boolean): boolean {
    if (validateFn) {
      return validateFn(status);
    }
    
    // 默认验证：2xx状态码为成功
    return status >= 200 && status < 300;
  }

  /**
   * 提取响应元数据
   */
  static extractMetadata(headers: HTTPHeaders): ResponseMetadata {
    const metadata: ResponseMetadata = {};
    
    // 提取内容长度
    const contentLength = headers['content-length'];
    if (contentLength) {
      metadata.contentLength = parseInt(contentLength as string, 10);
    }
    
    // 提取内容类型
    const contentType = headers['content-type'];
    if (contentType) {
      const { type, charset } = parseContentType(contentType as string);
      metadata.contentType = type;
      metadata.charset = charset;
    }
    
    // 提取缓存信息
    const cacheControl = headers['cache-control'];
    if (cacheControl) {
      metadata.cacheControl = this.parseCacheControl(cacheControl as string);
    }
    
    // 提取ETag
    const etag = headers['etag'];
    if (etag) {
      metadata.etag = etag as string;
    }
    
    // 提取最后修改时间
    const lastModified = headers['last-modified'];
    if (lastModified) {
      metadata.lastModified = new Date(lastModified as string);
    }
    
    // 提取响应时间
    const responseTime = headers['x-response-time'];
    if (responseTime) {
      metadata.responseTime = responseTime as string;
    }
    
    return metadata;
  }

  /**
   * 解析Cache-Control头部
   */
  private static parseCacheControl(cacheControl: string): CacheControlDirectives {
    const directives: CacheControlDirectives = {};
    const parts = cacheControl.split(',').map(part => part.trim());
    
    for (const part of parts) {
      if (part.includes('=')) {
        const [key, value] = part.split('=');
        directives[key!] = value!;
      } else {
        directives[part] = true;
      }
    }
    
    return directives;
  }

  /**
   * 检查响应是否可缓存
   */
  static isCacheable(headers: HTTPHeaders, method: string): boolean {
    // 只有GET和HEAD请求可缓存
    if (!['GET', 'HEAD'].includes(method.toUpperCase())) {
      return false;
    }
    
    const cacheControl = headers['cache-control'] as string;
    if (cacheControl) {
      const directives = this.parseCacheControl(cacheControl);
      
      // 检查no-cache和no-store指令
      if (directives['no-cache'] || directives['no-store']) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * 计算响应过期时间
   */
  static getExpirationTime(headers: HTTPHeaders): Date | null {
    const cacheControl = headers['cache-control'] as string;
    if (cacheControl) {
      const directives = this.parseCacheControl(cacheControl);
      const maxAge = directives['max-age'];
      
      if (maxAge && typeof maxAge === 'string') {
        const seconds = parseInt(maxAge, 10);
        return new Date(Date.now() + seconds * 1000);
      }
    }
    
    const expires = headers['expires'] as string;
    if (expires) {
      return new Date(expires);
    }
    
    return null;
  }
}

/**
 * 响应元数据接口
 */
export interface ResponseMetadata {
  contentLength?: number;
  contentType?: string;
  charset?: string;
  cacheControl?: CacheControlDirectives;
  etag?: string;
  lastModified?: Date;
  responseTime?: string;
}

/**
 * Cache-Control指令接口
 */
export interface CacheControlDirectives {
  [key: string]: string | boolean;
}

/**
 * 响应处理器接口
 */
export interface ResponseHandler<T = any> {
  canHandle(contentType: string, responseType?: string): boolean;
  handle(data: Buffer | string, headers: HTTPHeaders): Promise<T>;
}

/**
 * 可扩展的响应解析器
 */
export class ExtensibleResponseParser {
  private handlers: ResponseHandler[] = [];

  /**
   * 注册响应处理器
   */
  registerHandler(handler: ResponseHandler): void {
    this.handlers.push(handler);
  }

  /**
   * 解析响应
   */
  async parse<T = any>(
    data: Buffer | string,
    headers: HTTPHeaders,
    responseType?: string
  ): Promise<T> {
    const contentType = headers['content-type'] as string || '';
    
    // 查找匹配的处理器
    for (const handler of this.handlers) {
      if (handler.canHandle(contentType, responseType)) {
        return await handler.handle(data, headers);
      }
    }
    
    // 回退到默认解析器
    return ResponseParser.parse(data, headers, responseType as any);
  }
}