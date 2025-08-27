/**
 * @sker/serialization-protobuf - Protocol Buffers序列化器实现
 * 
 * 提供高性能二进制序列化功能
 */

// 核心序列化器
export * from './core/protobuf-serializer';
export * from './core/schema-compiler';
export * from './core/message-factory';

// Schema管理
export * from './schema/schema-registry';
export * from './schema/schema-validator';
export * from './schema/proto-parser';

// 代码生成
export * from './codegen/typescript-generator';
export * from './codegen/proto-generator';

// 优化器
export * from './optimizers/binary-optimizer';
export * from './optimizers/compression-optimizer';

// 工具函数
export * from './utils/protobuf-utils';
export * from './utils/binary-utils';

// 常量和类型
export * from './constants/protobuf-constants';
export * from './types/protobuf-types';

// 默认导出
export { ProtobufSerializer } from './core/protobuf-serializer';