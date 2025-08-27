/**
 * @sker/serialization-protobuf - Protocol Buffers序列化器实现
 * 
 * 提供高性能二进制序列化功能
 */

// 核心序列化器
export * from './core/protobuf-serializer.js';
export * from './core/schema-compiler.js';
export * from './core/message-factory.js';

// Schema管理
export * from './schema/schema-registry.js';
export * from './schema/schema-validator.js';
export * from './schema/proto-parser.js';

// 工具函数
export * from './utils/protobuf-utils.js';
export * from './utils/binary-utils.js';

// 常量和类型
export * from './constants/protobuf-constants.js';
export * from './types/protobuf-types.js';

// 默认导出
export { ProtobufSerializer } from './core/protobuf-serializer.js';