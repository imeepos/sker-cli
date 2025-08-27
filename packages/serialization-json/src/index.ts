/**
 * @sker/serialization-json - JSON序列化器实现
 * 
 * 提供高性能JSON序列化和反序列化功能
 */

// 核心序列化器
export * from './core/json-serializer';
export * from './core/streaming-serializer';
export * from './core/async-serializer';

// 优化器和处理器
export * from './optimizers/performance-optimizer';
export * from './processors/compression-processor';
export * from './processors/validation-processor';

// 转换器
export * from './transformers/bigint-transformer';
export * from './transformers/date-transformer';
export * from './transformers/buffer-transformer';

// 工具函数
export * from './utils/json-utils';
export * from './utils/stream-utils';

// 常量和类型
export * from './constants/json-constants';
export * from './types/serializer-types';

// 默认导出
export { JSONSerializer } from './core/json-serializer';