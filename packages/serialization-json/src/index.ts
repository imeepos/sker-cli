/**
 * @sker/serialization-json - JSON序列化器实现
 * 
 * 提供高性能JSON序列化和反序列化功能
 */

// 核心序列化器
export * from './core/json-serializer.js';
export * from './core/streaming-serializer.js';
export * from './core/async-serializer.js';

// 优化器和处理器
export * from './optimizers/performance-optimizer.js';
export * from './processors/compression-processor.js';
export * from './processors/validation-processor.js';

// 转换器
export * from './transformers/bigint-transformer.js';
export * from './transformers/date-transformer.js';
export * from './transformers/buffer-transformer.js';

// 工具函数
export * from './utils/json-utils.js';
export * from './utils/stream-utils.js';

// 常量和类型
export * from './constants/json-constants.js';
export * from './types/serializer-types.js';

// 默认导出
export { JSONSerializer } from './core/json-serializer.js';