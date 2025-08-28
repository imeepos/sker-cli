/**
 * @fileoverview HTTP客户端核心实现
 */

import http from 'http';
import https from 'https';
import { EventEmitter } from 'events';
import { 
  ClientConfig, 
  RequestConfig, 
  HTTPResponseData, 
  RequestInterceptor, 
  ResponseInterceptor,
  HTTPMethod,
  HTTPHeaders,
  HTTPQuery,
  ProgressEvent
} from '../types/http-types.js';
import {
  addQueryToURL,
  resolveURL,
  isAbsoluteURL,
  validateURL
} from '../utils/url-utils.js';
import { DEFAULT_CONFIG, HTTP_STATUS } from '../constants/http-constants.js';

// 定义协议类型以实现接口对齐
type ProtocolType = 'http' | 'grpc' | 'websocket' | 'ucp';

export class HTTPClient extends EventEmitter {
  private config: ClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];
  private cache = new Map<string, { data: any; expires: number }>();

  constructor(config: Partial<ClientConfig> = {}) {
    super();
    this.config = this.mergeConfig(config);
  }

  /**
   * 合并配置
   */
  private mergeConfig(userConfig: Partial<ClientConfig>): ClientConfig {
    return {
      baseURL: userConfig.baseURL || '',
      defaultHeaders: {
        'User-Agent': 'Sker-HTTP-Client/1.0.0',
        'Accept': 'application/json',
        ...userConfig.defaultHeaders
      },
      timeout: {
        connect: 10000,
        request: 30000,
        response: 60000,
        ...userConfig.timeout
      },
      retry: {
        maxAttempts: 3,
        backoff: 'exponential',
        initialDelay: 1000,
        maxDelay: 10000,
        retryCondition: (error) => error.statusCode >= 500,
        ...userConfig.retry
      },
      connectionPool: {
        maxConnections: DEFAULT_CONFIG.CLIENT.MAX_CONNECTIONS,
        maxConnectionsPerHost: DEFAULT_CONFIG.CLIENT.MAX_CONNECTIONS_PER_HOST,
        keepAlive: true,
        keepAliveMsecs: 30000,
        ...userConfig.connectionPool
      },
      cache: {
        enabled: false,
        storage: 'memory',
        ttl: DEFAULT_CONFIG.CACHE.TTL,
        maxSize: DEFAULT_CONFIG.CACHE.MAX_SIZE,
        ...userConfig.cache
      },
      ...userConfig
    };
  }

  /**
   * 拦截器对象
   */
  get interceptors() {
    return {
      request: {
        use: (interceptor: RequestInterceptor) => {
          this.requestInterceptors.push(interceptor);
          return this.requestInterceptors.length - 1;
        },
        eject: (id: number) => {
          this.requestInterceptors.splice(id, 1);
        }
      },
      response: {
        use: (interceptor: ResponseInterceptor) => {
          this.responseInterceptors.push(interceptor);
          return this.responseInterceptors.length - 1;
        },
        eject: (id: number) => {
          this.responseInterceptors.splice(id, 1);
        }
      }
    };
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(url: string, config?: RequestConfig): Promise<HTTPResponseData<T>>;
  async request<T = any>(config: RequestConfig): Promise<HTTPResponseData<T>>;
  async request<T = any>(urlOrConfig: string | RequestConfig, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    let finalConfig: RequestConfig;

    if (typeof urlOrConfig === 'string') {
      finalConfig = { ...config, url: urlOrConfig };
    } else {
      finalConfig = urlOrConfig;
    }

    // 应用请求拦截器
    for (const interceptor of this.requestInterceptors) {
      finalConfig = await interceptor(finalConfig);
    }

    // 构建最终配置
    const requestConfig = this.buildRequestConfig(finalConfig);

    // 检查缓存
    if (this.config.cache?.enabled && requestConfig.method === 'GET') {
      const cacheKey = this.buildCacheKey(requestConfig);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }
    }

    let response: HTTPResponseData<T>;

    // 执行请求（带重试）
    if (this.config.retry && this.config.retry.maxAttempts > 1) {
      response = await this.requestWithRetry(requestConfig);
    } else {
      response = await this.executeRequest(requestConfig);
    }

    // 应用响应拦截器
    for (const interceptor of this.responseInterceptors) {
      response = await interceptor(response);
    }

    // 存储到缓存
    if (this.config.cache?.enabled && requestConfig.method === 'GET' && response.status < 400) {
      const cacheKey = this.buildCacheKey(requestConfig);
      this.setToCache(cacheKey, response);
    }

    return response;
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'GET' });
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'POST', data });
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'PUT', data });
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'PATCH', data });
  }

  /**
   * HEAD请求
   */
  async head<T = any>(url: string, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'HEAD' });
  }

  /**
   * OPTIONS请求
   */
  async options<T = any>(url: string, config: RequestConfig = {}): Promise<HTTPResponseData<T>> {
    return this.request<T>(url, { ...config, method: 'OPTIONS' });
  }

  /**
   * 构建请求配置
   */
  private buildRequestConfig(config: RequestConfig): Required<RequestConfig> {
    let url = config.url || '';
    
    // 解析绝对URL或相对URL
    if (!isAbsoluteURL(url) && this.config.baseURL) {
      url = resolveURL(this.config.baseURL, url);
    }

    // 添加查询参数
    if (config.params) {
      url = addQueryToURL(url, config.params);
    }

    // 验证URL
    const validation = validateURL(url);
    if (!validation.valid) {
      throw new Error(`Invalid URL: ${validation.error}`);
    }

    return {
      method: config.method || 'GET',
      url,
      headers: {
        ...this.config.defaultHeaders,
        ...config.headers
      },
      data: config.data,
      timeout: config.timeout || this.config.timeout?.request || DEFAULT_CONFIG.CLIENT.TIMEOUT,
      responseType: config.responseType || 'json',
      validateStatus: config.validateStatus || ((status) => status >= 200 && status < 300),
      transformResponse: config.transformResponse!,
      onUploadProgress: config.onUploadProgress!,
      onDownloadProgress: config.onDownloadProgress!,
      cache: config.cache || { enabled: false },
      retry: config.retry || { maxAttempts: 1, backoff: 'linear' },
      params: config.params!,
      metadata: config.metadata || {},
      compress: config.compress !== false
    };
  }

  /**
   * 带重试的请求执行
   */
  private async requestWithRetry<T = any>(config: Required<RequestConfig>): Promise<HTTPResponseData<T>> {
    const retryConfig = this.config.retry!;
    let lastError: any;
    let attempt = 0;

    while (attempt < retryConfig.maxAttempts) {
      try {
        return await this.executeRequest(config);
      } catch (error: any) {
        lastError = error;
        attempt++;

        // 检查是否应该重试
        if (attempt >= retryConfig.maxAttempts || !retryConfig.retryCondition(error)) {
          break;
        }

        // 计算延迟时间
        const delay = this.calculateRetryDelay(attempt, retryConfig);
        
        this.emit('retry', {
          attempt,
          error,
          delay,
          config
        });

        // 等待延迟
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * 计算重试延迟
   */
  private calculateRetryDelay(attempt: number, retryConfig: NonNullable<ClientConfig['retry']>): number {
    const { backoff, initialDelay, maxDelay } = retryConfig;
    let delay = initialDelay;

    switch (backoff) {
      case 'exponential':
        delay = initialDelay * Math.pow(2, attempt - 1);
        break;
      case 'linear':
        delay = initialDelay * attempt;
        break;
      case 'fixed':
      default:
        delay = initialDelay;
        break;
    }

    return Math.min(delay, maxDelay);
  }

  /**
   * 执行HTTP请求
   */
  private async executeRequest<T = any>(config: Required<RequestConfig>): Promise<HTTPResponseData<T>> {
    return new Promise((resolve, reject) => {
      const url = new URL(config.url);
      const isSecure = url.protocol === 'https:';
      const httpModule = isSecure ? https : http;
      
      const options: http.RequestOptions = {
        hostname: url.hostname,
        port: url.port || (isSecure ? 443 : 80),
        path: url.pathname + url.search,
        method: config.method,
        headers: this.prepareHeaders(config),
        timeout: config.timeout
      };

      // 添加HTTP Agent配置
      if (this.config.httpAgent) {
        const AgentClass = isSecure ? https.Agent : http.Agent;
        options.agent = new AgentClass(this.config.httpAgent);
      }

      let requestData: string | Buffer | undefined;
      
      // 准备请求体
      if (config.data && ['POST', 'PUT', 'PATCH'].includes(config.method)) {
        if (typeof config.data === 'object') {
          requestData = JSON.stringify(config.data);
          (options.headers as any)['Content-Type'] = 'application/json';
        } else {
          requestData = config.data;
        }
        
        if (requestData) {
          (options.headers as any)['Content-Length'] = Buffer.byteLength(requestData);
        }
      }

      const request = httpModule.request(options, (response) => {
        let data = Buffer.alloc(0);
        const totalSize = parseInt(response.headers['content-length'] || '0', 10);
        let loadedSize = 0;

        response.on('data', (chunk: Buffer) => {
          data = Buffer.concat([data, chunk]);
          loadedSize += chunk.length;
          
          // 触发下载进度事件
          if (config.onDownloadProgress && totalSize > 0) {
            config.onDownloadProgress({
              loaded: loadedSize,
              total: totalSize,
              percent: loadedSize / totalSize
            });
          }
        });

        response.on('end', () => {
          try {
            const responseData = this.parseResponse(data, config.responseType, response.headers);
            const httpResponse: HTTPResponseData<T> = {
              status: response.statusCode || 0,
              statusText: response.statusMessage || '',
              headers: response.headers as HTTPHeaders,
              data: config.transformResponse ? config.transformResponse(responseData) : responseData,
              config
            };

            // 验证状态码
            if (!config.validateStatus(httpResponse.status)) {
              const error: any = new Error(`Request failed with status code ${httpResponse.status}`);
              error.statusCode = httpResponse.status;
              error.response = httpResponse;
              reject(error);
              return;
            }

            resolve(httpResponse);
          } catch (error) {
            reject(error);
          }
        });
      });

      request.on('error', (error: any) => {
        error.code = 'NETWORK_ERROR';
        reject(error);
      });

      request.on('timeout', () => {
        request.destroy();
        const error: any = new Error('Request timeout');
        error.code = 'TIMEOUT_ERROR';
        reject(error);
      });

      // 发送请求体
      if (requestData) {
        // 触发上传进度事件
        if (config.onUploadProgress) {
          const totalSize = Buffer.byteLength(requestData);
          config.onUploadProgress({
            loaded: totalSize,
            total: totalSize,
            percent: 1
          });
        }
        
        request.write(requestData);
      }

      request.end();
    });
  }

  /**
   * 准备请求头
   */
  private prepareHeaders(config: Required<RequestConfig>): HTTPHeaders {
    const headers = { ...config.headers };

    // 添加认证头
    if (this.config.auth) {
      const { type, token, username, password } = this.config.auth;
      
      switch (type) {
        case 'bearer':
          if (token) {
            headers.Authorization = `Bearer ${token}`;
          }
          break;
        case 'basic':
          if (username && password) {
            const credentials = Buffer.from(`${username}:${password}`).toString('base64');
            headers.Authorization = `Basic ${credentials}`;
          }
          break;
      }
    }

    return headers;
  }

  /**
   * 解析响应数据
   */
  private parseResponse(data: Buffer, responseType: string, headers: http.IncomingHttpHeaders): any {
    const contentType = headers['content-type'] || '';
    
    switch (responseType) {
      case 'json':
        try {
          return JSON.parse(data.toString());
        } catch {
          return data.toString();
        }
      case 'text':
        return data.toString();
      case 'blob':
        return data;
      case 'stream':
        return data;
      default:
        // 根据Content-Type自动判断
        if (contentType.includes('application/json')) {
          try {
            return JSON.parse(data.toString());
          } catch {
            return data.toString();
          }
        } else if (contentType.includes('text/')) {
          return data.toString();
        } else {
          return data;
        }
    }
  }

  /**
   * 构建缓存键
   */
  private buildCacheKey(config: Required<RequestConfig>): string {
    const key = config.cache?.key || `${config.method}:${config.url}`;
    return `http_cache:${key}`;
  }

  /**
   * 从缓存获取数据
   */
  private getFromCache<T = any>(key: string): HTTPResponseData<T> | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached.data;
    }
    
    if (cached) {
      this.cache.delete(key);
    }
    
    return null;
  }

  /**
   * 存储到缓存
   */
  private setToCache<T = any>(key: string, data: HTTPResponseData<T>): void {
    if (!this.config.cache?.enabled) return;

    const ttl = this.config.cache.ttl;
    const expires = Date.now() + ttl;
    
    this.cache.set(key, {
      data: { ...data },
      expires
    });

    // 清理过期缓存
    this.cleanExpiredCache();
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ========================================
  // ProtocolClient接口实现 - 接口对齐
  // ========================================

  /**
   * 协议类型 - ProtocolClient接口要求
   */
  get protocol(): ProtocolType {
    return 'http' as ProtocolType;
  }

  /**
   * 目标地址 - ProtocolClient接口要求
   */
  get target(): string {
    return this.config.baseURL || '';
  }

  /**
   * 统一的RPC调用方法 - ProtocolClient接口实现
   * 将HTTP请求映射为RPC调用
   *
   * @param service 服务名称（映射为URL路径的一部分）
   * @param method 方法名称（映射为HTTP方法或URL路径）
   * @param data 请求数据
   * @param options 调用选项
   */
  async call(service: string, method: string, data: any, options?: any): Promise<any> {
    // 构建URL路径：/{service}/{method}
    const url = `/${service}/${method}`;

    // 从options中提取HTTP相关配置
    const httpConfig: RequestConfig = {
      method: this.mapMethodToHTTP(method),
      headers: options?.headers || {},
      timeout: options?.timeout,
      ...options
    };

    // 根据HTTP方法决定如何传递数据
    if (httpConfig.method === 'GET' || httpConfig.method === 'DELETE') {
      // GET和DELETE请求将数据作为查询参数
      httpConfig.params = data;
    } else {
      // POST、PUT、PATCH请求将数据作为请求体
      httpConfig.data = data;
    }

    try {
      const response = await this.request(url, httpConfig);
      return response.data;
    } catch (error) {
      // 转换HTTP错误为统一的协议错误
      throw this.convertToProtocolError(error);
    }
  }

  /**
   * 流式调用方法 - ProtocolClient接口实现
   * HTTP协议的流式实现（使用Server-Sent Events或分块传输）
   *
   * @param service 服务名称
   * @param method 方法名称
   * @param data 请求数据
   * @param options 流选项
   */
  async *stream(service: string, method: string, data: any, options?: any): AsyncIterableIterator<any> {
    const url = `/${service}/${method}`;

    // 设置流式请求的特殊头部
    const streamConfig: RequestConfig = {
      method: 'POST',
      data,
      headers: {
        'Accept': 'text/event-stream',
        'Cache-Control': 'no-cache',
        ...options?.headers
      },
      timeout: options?.timeout || 0, // 流请求通常不设置超时
      responseType: 'stream',
      ...options
    };

    try {
      // 注意：这里需要实现实际的流处理逻辑
      // 当前是一个简化的实现，实际应该处理Server-Sent Events
      const response = await this.request(url, streamConfig);

      // 模拟流式数据返回
      if (response.data) {
        // 如果响应是数组，逐个yield
        if (Array.isArray(response.data)) {
          for (const item of response.data) {
            yield item;
          }
        } else {
          // 单个响应
          yield response.data;
        }
      }
    } catch (error) {
      throw this.convertToProtocolError(error);
    }
  }

  /**
   * 关闭连接 - ProtocolClient接口实现
   */
  async close(): Promise<void> {
    // HTTP是无状态协议，这里主要是清理资源
    this.removeAllListeners();
    this.cache.clear();

    // 触发关闭事件
    this.emit('close');
  }

  /**
   * 将方法名映射为HTTP方法
   * 这是一个启发式映射，可以根据实际需要调整
   */
  private mapMethodToHTTP(method: string): HTTPMethod {
    const methodLower = method.toLowerCase();

    // 常见的映射规则
    if (methodLower.startsWith('get') || methodLower.startsWith('list') || methodLower.startsWith('find')) {
      return 'GET';
    } else if (methodLower.startsWith('create') || methodLower.startsWith('add')) {
      return 'POST';
    } else if (methodLower.startsWith('update') || methodLower.startsWith('modify')) {
      return 'PUT';
    } else if (methodLower.startsWith('patch')) {
      return 'PATCH';
    } else if (methodLower.startsWith('delete') || methodLower.startsWith('remove')) {
      return 'DELETE';
    }

    // 默认使用POST
    return 'POST';
  }

  /**
   * 将HTTP错误转换为协议错误
   */
  private convertToProtocolError(error: any): Error {
    if (error.response) {
      // HTTP响应错误
      const protocolError = new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      (protocolError as any).code = `HTTP_${error.response.status}`;
      (protocolError as any).status = error.response.status;
      (protocolError as any).data = error.response.data;
      return protocolError;
    } else if (error.request) {
      // 网络错误
      const protocolError = new Error('Network error: Request failed');
      (protocolError as any).code = 'NETWORK_ERROR';
      return protocolError;
    } else {
      // 其他错误
      return error;
    }
  }
}