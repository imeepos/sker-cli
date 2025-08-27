/**
 * @sker/protocol-http - HTTP/REST协议实现
 * 
 * 提供灵活RESTful API通信能力
 */

// 核心HTTP实现
export * from './core/http-server.js';
export * from './core/http-client.js';
export * from './core/router.js';

// 装饰器
export * from './decorators/controller-decorators.js';

// 中间件
export * from './middleware/cors-middleware.js';
export * from './middleware/compression-middleware.js';
export * from './middleware/rate-limit-middleware.js';
export * from './middleware/validation-middleware.js';

// 客户端支持
export * from './client/request-builder.js';
export * from './client/response-parser.js';
export * from './client/retry-handler.js';

// 工具函数
export * from './utils/http-utils.js';
export * from './utils/url-utils.js';
export * from './utils/connection-pool.js';
export * from './utils/cache-manager.js';

// 常量和类型
export * from './constants/http-constants.js';
export * from './types/http-types.js';

// 主要类的默认导出
export { HTTPServer } from './core/http-server.js';
export { HTTPClient } from './core/http-client.js';
export { Router } from './core/router.js';
export { RequestBuilder } from './client/request-builder.js';
export { ResponseParser } from './client/response-parser.js';
export { RetryHandler } from './client/retry-handler.js';
export { ConnectionPool } from './utils/connection-pool.js';
export { CacheManager } from './utils/cache-manager.js';