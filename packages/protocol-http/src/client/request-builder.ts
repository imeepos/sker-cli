/**
 * @fileoverview 请求构建器实现
 */

import { RequestConfig, HTTPHeaders, HTTPQuery, HTTPMethod } from '../types/http-types.js';
import { addQueryToURL, resolveURL, isAbsoluteURL } from '../utils/url-utils.js';

export class RequestBuilder {
  private config: RequestConfig = {};

  constructor(baseConfig: Partial<RequestConfig> = {}) {
    this.config = { ...baseConfig };
  }

  /**
   * 设置请求方法
   */
  method(method: HTTPMethod): this {
    this.config.method = method;
    return this;
  }

  /**
   * 设置URL
   */
  url(url: string): this {
    this.config.url = url;
    return this;
  }

  /**
   * 设置请求头
   */
  headers(headers: HTTPHeaders): this {
    this.config.headers = { ...this.config.headers, ...headers };
    return this;
  }

  /**
   * 设置单个请求头
   */
  header(name: string, value: string): this {
    if (!this.config.headers) {
      this.config.headers = {};
    }
    this.config.headers[name] = value;
    return this;
  }

  /**
   * 设置查询参数
   */
  query(params: HTTPQuery): this {
    this.config.params = { ...this.config.params, ...params };
    return this;
  }

  /**
   * 设置单个查询参数
   */
  param(name: string, value: string | string[]): this {
    if (!this.config.params) {
      this.config.params = {};
    }
    this.config.params[name] = value;
    return this;
  }

  /**
   * 设置请求体
   */
  body(data: any): this {
    this.config.data = data;
    return this;
  }

  /**
   * 设置JSON请求体
   */
  json(data: any): this {
    this.config.data = data;
    return this.header('Content-Type', 'application/json');
  }

  /**
   * 设置表单数据
   */
  form(data: Record<string, any>): this {
    this.config.data = data;
    return this.header('Content-Type', 'application/x-www-form-urlencoded');
  }

  /**
   * 设置FormData
   */
  multipart(data: FormData): this {
    this.config.data = data;
    return this.header('Content-Type', 'multipart/form-data');
  }

  /**
   * 设置超时时间
   */
  timeout(ms: number): this {
    this.config.timeout = ms;
    return this;
  }

  /**
   * 设置响应类型
   */
  responseType(type: 'json' | 'text' | 'blob' | 'stream'): this {
    this.config.responseType = type;
    return this;
  }

  /**
   * 设置认证头
   */
  auth(token: string, type: 'bearer' | 'basic' = 'bearer'): this {
    if (type === 'bearer') {
      return this.header('Authorization', `Bearer ${token}`);
    } else if (type === 'basic') {
      return this.header('Authorization', `Basic ${token}`);
    }
    return this;
  }

  /**
   * 设置Bearer Token
   */
  bearer(token: string): this {
    return this.auth(token, 'bearer');
  }

  /**
   * 设置Basic Auth
   */
  basic(username: string, password: string): this {
    const credentials = Buffer.from(`${username}:${password}`).toString('base64');
    return this.auth(credentials, 'basic');
  }

  /**
   * 设置Accept头
   */
  accept(contentType: string): this {
    return this.header('Accept', contentType);
  }

  /**
   * 设置User-Agent
   */
  userAgent(userAgent: string): this {
    return this.header('User-Agent', userAgent);
  }

  /**
   * 设置Referer
   */
  referer(referer: string): this {
    return this.header('Referer', referer);
  }

  /**
   * 设置缓存配置
   */
  cache(options: { enabled: boolean; key?: string; ttl?: number }): this {
    this.config.cache = options;
    return this;
  }

  /**
   * 启用缓存
   */
  enableCache(ttl?: number, key?: string): this {
    this.config.cache = { enabled: true, ttl, key };
    return this;
  }

  /**
   * 禁用缓存
   */
  disableCache(): this {
    this.config.cache = { enabled: false };
    return this;
  }

  /**
   * 设置重试配置
   */
  retry(options: { maxAttempts: number; backoff: 'exponential' | 'linear'; retryDelay?: number }): this {
    this.config.retry = options;
    return this;
  }

  /**
   * 设置状态码验证函数
   */
  validateStatus(fn: (status: number) => boolean): this {
    this.config.validateStatus = fn;
    return this;
  }

  /**
   * 设置响应转换函数
   */
  transformResponse(fn: (data: any) => any): this {
    this.config.transformResponse = fn;
    return this;
  }

  /**
   * 设置上传进度回调
   */
  onUploadProgress(callback: (progress: { loaded: number; total?: number; percent: number }) => void): this {
    this.config.onUploadProgress = callback;
    return this;
  }

  /**
   * 设置下载进度回调
   */
  onDownloadProgress(callback: (progress: { loaded: number; total?: number; percent: number }) => void): this {
    this.config.onDownloadProgress = callback;
    return this;
  }

  /**
   * 设置压缩
   */
  compress(enabled = true): this {
    this.config.compress = enabled;
    return this;
  }

  /**
   * 添加元数据
   */
  metadata(key: string, value: any): this {
    if (!this.config.metadata) {
      this.config.metadata = {};
    }
    this.config.metadata[key] = value;
    return this;
  }

  /**
   * 构建最终的请求配置
   */
  build(): Required<RequestConfig> {
    // 验证必需的配置
    if (!this.config.method) {
      throw new Error('HTTP method is required');
    }

    if (!this.config.url) {
      throw new Error('URL is required');
    }

    return {
      method: this.config.method,
      url: this.config.url,
      headers: this.config.headers || {},
      params: this.config.params || {},
      data: this.config.data,
      timeout: this.config.timeout || 30000,
      responseType: this.config.responseType || 'json',
      cache: this.config.cache || { enabled: false },
      retry: this.config.retry || { maxAttempts: 1, backoff: 'linear' },
      validateStatus: this.config.validateStatus || ((status) => status >= 200 && status < 300),
      transformResponse: this.config.transformResponse || ((data) => data),
      onUploadProgress: this.config.onUploadProgress || (() => {}),
      onDownloadProgress: this.config.onDownloadProgress || (() => {}),
      metadata: this.config.metadata || {},
      compress: this.config.compress !== false
    };
  }

  /**
   * 克隆构建器
   */
  clone(): RequestBuilder {
    const cloned = new RequestBuilder();
    cloned.config = JSON.parse(JSON.stringify(this.config));
    return cloned;
  }

  /**
   * 重置构建器
   */
  reset(): this {
    this.config = {};
    return this;
  }

  /**
   * 快捷方法：GET请求
   */
  static get(url: string): RequestBuilder {
    return new RequestBuilder().method('GET').url(url);
  }

  /**
   * 快捷方法：POST请求
   */
  static post(url: string, data?: any): RequestBuilder {
    const builder = new RequestBuilder().method('POST').url(url);
    if (data !== undefined) {
      builder.json(data);
    }
    return builder;
  }

  /**
   * 快捷方法：PUT请求
   */
  static put(url: string, data?: any): RequestBuilder {
    const builder = new RequestBuilder().method('PUT').url(url);
    if (data !== undefined) {
      builder.json(data);
    }
    return builder;
  }

  /**
   * 快捷方法：DELETE请求
   */
  static delete(url: string): RequestBuilder {
    return new RequestBuilder().method('DELETE').url(url);
  }

  /**
   * 快捷方法：PATCH请求
   */
  static patch(url: string, data?: any): RequestBuilder {
    const builder = new RequestBuilder().method('PATCH').url(url);
    if (data !== undefined) {
      builder.json(data);
    }
    return builder;
  }
}