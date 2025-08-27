/**
 * gRPC元数据工具函数
 */

/**
 * gRPC元数据管理器
 */
export class MetadataManager {
  private metadata = new Map<string, string[]>();

  /**
   * 设置元数据值
   */
  set(key: string, values: string | string[]): void {
    const normalizedKey = key.toLowerCase();
    const valueArray = Array.isArray(values) ? values : [values];
    this.metadata.set(normalizedKey, valueArray);
  }

  /**
   * 获取元数据值
   */
  get(key: string): string[] | undefined {
    return this.metadata.get(key.toLowerCase());
  }

  /**
   * 获取单个元数据值
   */
  getFirst(key: string): string | undefined {
    const values = this.get(key);
    return values?.[0];
  }

  /**
   * 添加元数据值
   */
  add(key: string, value: string): void {
    const normalizedKey = key.toLowerCase();
    const existing = this.metadata.get(normalizedKey) || [];
    this.metadata.set(normalizedKey, [...existing, value]);
  }

  /**
   * 删除元数据
   */
  delete(key: string): boolean {
    return this.metadata.delete(key.toLowerCase());
  }

  /**
   * 检查是否存在元数据
   */
  has(key: string): boolean {
    return this.metadata.has(key.toLowerCase());
  }

  /**
   * 清空所有元数据
   */
  clear(): void {
    this.metadata.clear();
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.metadata.keys());
  }

  /**
   * 获取所有值
   */
  values(): string[][] {
    return Array.from(this.metadata.values());
  }

  /**
   * 获取所有条目
   */
  entries(): [string, string[]][] {
    return Array.from(this.metadata.entries());
  }

  /**
   * 转换为原生Map
   */
  toMap(): Map<string, string[]> {
    return new Map(this.metadata);
  }

  /**
   * 从原生Map创建
   */
  static fromMap(map: Map<string, string[]>): MetadataManager {
    const manager = new MetadataManager();
    for (const [key, values] of map.entries()) {
      manager.set(key, values);
    }
    return manager;
  }

  /**
   * 从对象创建
   */
  static fromObject(obj: Record<string, string | string[]>): MetadataManager {
    const manager = new MetadataManager();
    for (const [key, value] of Object.entries(obj)) {
      manager.set(key, value);
    }
    return manager;
  }

  /**
   * 转换为对象
   */
  toObject(): Record<string, string[]> {
    const obj: Record<string, string[]> = {};
    for (const [key, values] of this.metadata.entries()) {
      obj[key] = values;
    }
    return obj;
  }

  /**
   * 复制元数据
   */
  clone(): MetadataManager {
    return MetadataManager.fromMap(this.metadata);
  }

  /**
   * 合并元数据
   */
  merge(other: MetadataManager): MetadataManager {
    const merged = this.clone();
    for (const [key, values] of other.entries()) {
      for (const value of values) {
        merged.add(key, value);
      }
    }
    return merged;
  }

  /**
   * 获取元数据大小（估算）
   */
  getSize(): number {
    let size = 0;
    for (const [key, values] of this.metadata.entries()) {
      size += key.length;
      for (const value of values) {
        size += value.length;
      }
    }
    return size;
  }
}

/**
 * gRPC元数据工具类
 */
export class MetadataUtils {
  /**
   * 验证元数据键名
   */
  static isValidKey(key: string): boolean {
    // gRPC元数据键名规则：小写字母、数字、破折号、下划线
    const keyRegex = /^[a-z0-9_-]+$/;
    
    // 不能以grpc-开头（保留给gRPC内部使用）
    if (key.startsWith('grpc-')) {
      return false;
    }
    
    return keyRegex.test(key) && key.length > 0;
  }

  /**
   * 验证元数据值
   */
  static isValidValue(value: string): boolean {
    // gRPC元数据值不能包含控制字符
    return !/[\x00-\x1f\x7f]/.test(value);
  }

  /**
   * 规范化键名
   */
  static normalizeKey(key: string): string {
    return key.toLowerCase();
  }

  /**
   * 解析认证令牌
   */
  static parseAuthToken(metadata: MetadataManager): {
    type: string;
    token: string;
  } | null {
    const authHeader = metadata.getFirst('authorization');
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ', 2);
    if (parts.length !== 2) {
      return null;
    }

    return {
      type: parts[0]!.toLowerCase(),
      token: parts[1]!
    };
  }

  /**
   * 设置认证令牌
   */
  static setAuthToken(metadata: MetadataManager, type: string, token: string): void {
    metadata.set('authorization', `${type} ${token}`);
  }

  /**
   * 解析用户代理
   */
  static parseUserAgent(metadata: MetadataManager): {
    name: string;
    version: string;
  } | null {
    const userAgent = metadata.getFirst('user-agent');
    if (!userAgent) {
      return null;
    }

    const match = userAgent.match(/^([^/]+)\/([^/\s]+)/);
    if (!match) {
      return null;
    }

    return {
      name: match[1]!,
      version: match[2]!
    };
  }

  /**
   * 设置用户代理
   */
  static setUserAgent(metadata: MetadataManager, name: string, version: string): void {
    metadata.set('user-agent', `${name}/${version}`);
  }

  /**
   * 解析超时时间
   */
  static parseTimeout(metadata: MetadataManager): number | null {
    const timeout = metadata.getFirst('grpc-timeout');
    if (!timeout) {
      return null;
    }

    const match = timeout.match(/^(\d+)([HMSmun])$/);
    if (!match) {
      return null;
    }

    const value = parseInt(match[1]!, 10);
    const unit = match[2];

    switch (unit) {
      case 'H': return value * 60 * 60 * 1000; // 小时
      case 'M': return value * 60 * 1000;      // 分钟
      case 'S': return value * 1000;           // 秒
      case 'm': return value;                  // 毫秒
      case 'u': return value / 1000;           // 微秒
      case 'n': return value / 1000000;        // 纳秒
      default: return null;
    }
  }

  /**
   * 设置超时时间
   */
  static setTimeout(metadata: MetadataManager, timeoutMs: number): void {
    let value: number;
    let unit: string;

    if (timeoutMs >= 60 * 60 * 1000) {
      value = Math.ceil(timeoutMs / (60 * 60 * 1000));
      unit = 'H';
    } else if (timeoutMs >= 60 * 1000) {
      value = Math.ceil(timeoutMs / (60 * 1000));
      unit = 'M';
    } else if (timeoutMs >= 1000) {
      value = Math.ceil(timeoutMs / 1000);
      unit = 'S';
    } else {
      value = timeoutMs;
      unit = 'm';
    }

    metadata.set('grpc-timeout', `${value}${unit}`);
  }

  /**
   * 提取追踪ID
   */
  static getTraceId(metadata: MetadataManager): string | null {
    return metadata.getFirst('x-trace-id') || 
           metadata.getFirst('trace-id') ||
           metadata.getFirst('traceparent') || null;
  }

  /**
   * 设置追踪ID
   */
  static setTraceId(metadata: MetadataManager, traceId: string): void {
    metadata.set('x-trace-id', traceId);
  }

  /**
   * 提取请求ID
   */
  static getRequestId(metadata: MetadataManager): string | null {
    return metadata.getFirst('x-request-id') ||
           metadata.getFirst('request-id') || null;
  }

  /**
   * 设置请求ID
   */
  static setRequestId(metadata: MetadataManager, requestId: string): void {
    metadata.set('x-request-id', requestId);
  }

  /**
   * 过滤敏感信息
   */
  static filterSensitive(metadata: MetadataManager, sensitiveKeys: string[] = ['authorization', 'cookie', 'x-api-key']): MetadataManager {
    const filtered = metadata.clone();
    
    for (const key of sensitiveKeys) {
      if (filtered.has(key)) {
        filtered.set(key, ['***FILTERED***']);
      }
    }
    
    return filtered;
  }

  /**
   * 提取客户端IP
   */
  static getClientIP(metadata: MetadataManager): string | null {
    return metadata.getFirst('x-forwarded-for')?.split(',')[0]?.trim() ||
           metadata.getFirst('x-real-ip') ||
           metadata.getFirst('x-client-ip') || null;
  }

  /**
   * 设置客户端IP
   */
  static setClientIP(metadata: MetadataManager, ip: string): void {
    metadata.set('x-client-ip', ip);
  }

  /**
   * 检查是否为二进制元数据
   */
  static isBinaryKey(key: string): boolean {
    return key.endsWith('-bin');
  }

  /**
   * 编码二进制值
   */
  static encodeBinaryValue(value: Buffer): string {
    return value.toString('base64');
  }

  /**
   * 解码二进制值
   */
  static decodeBinaryValue(value: string): Buffer {
    return Buffer.from(value, 'base64');
  }

  /**
   * 合并多个元数据对象
   */
  static merge(...metadataObjects: MetadataManager[]): MetadataManager {
    const result = new MetadataManager();
    
    for (const metadata of metadataObjects) {
      for (const [key, values] of metadata.entries()) {
        for (const value of values) {
          result.add(key, value);
        }
      }
    }
    
    return result;
  }

  /**
   * 创建基本元数据
   */
  static createBasicMetadata(options: {
    userAgent?: string;
    timeout?: number;
    traceId?: string;
    requestId?: string;
    authorization?: string;
  } = {}): MetadataManager {
    const metadata = new MetadataManager();
    
    if (options.userAgent) {
      metadata.set('user-agent', options.userAgent);
    }
    
    if (options.timeout) {
      this.setTimeout(metadata, options.timeout);
    }
    
    if (options.traceId) {
      this.setTraceId(metadata, options.traceId);
    }
    
    if (options.requestId) {
      this.setRequestId(metadata, options.requestId);
    }
    
    if (options.authorization) {
      metadata.set('authorization', options.authorization);
    }
    
    return metadata;
  }

  /**
   * 转换为HTTP头格式
   */
  static toHttpHeaders(metadata: MetadataManager): Record<string, string | string[]> {
    const headers: Record<string, string | string[]> = {};
    
    for (const [key, values] of metadata.entries()) {
      if (values.length === 1) {
        headers[key] = values[0]!;
      } else {
        headers[key] = values;
      }
    }
    
    return headers;
  }

  /**
   * 从HTTP头创建
   */
  static fromHttpHeaders(headers: Record<string, string | string[] | undefined>): MetadataManager {
    const metadata = new MetadataManager();
    
    for (const [key, value] of Object.entries(headers)) {
      if (value !== undefined) {
        metadata.set(key, Array.isArray(value) ? value : [value]);
      }
    }
    
    return metadata;
  }
}