/**
 * @sker/protocol-http - HTTP/REST协议实现
 * 
 * 提供灵活RESTful API通信能力
 */

// 核心HTTP实现
export * from './core/http-server';
export * from './core/http-client';
export * from './core/router';

// RESTful API
export * from './rest/rest-controller';
export * from './rest/resource-handler';
export * from './rest/crud-operations';

// 中间件
export * from './middleware/cors-middleware';
export * from './middleware/compression-middleware';
export * from './middleware/rate-limit-middleware';
export * from './middleware/validation-middleware';

// 客户端支持
export * from './client/request-builder';
export * from './client/response-parser';
export * from './client/retry-handler';

// 工具函数
export * from './utils/http-utils';
export * from './utils/url-utils';

// 常量和类型
export * from './constants/http-constants';
export * from './types/http-types';

// 默认导出
export { HTTPServer } from './core/http-server';
export { HTTPClient } from './core/http-client';