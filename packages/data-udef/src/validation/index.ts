/**
 * 验证模块导出
 * Validation module exports
 */

export * from './schema-registry.js';
export * from './validator.js';

// 便捷导出
export { MemorySchemaRegistry as SchemaRegistry } from './schema-registry.js';
export { UDEFMessageValidator as MessageValidator } from './validator.js';