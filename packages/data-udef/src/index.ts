/**
 * @sker/data-udef - 统一数据交换格式(UDEF)实现
 * 
 * 提供跨语言数据序列化和标准消息格式
 */

// 核心格式接口
export * from './interfaces/message-format';
export * from './interfaces/schema';
export * from './interfaces/serializer';

// UDEF实现
export * from './core/udef-message';
export * from './core/schema-registry';
export * from './core/type-mapper';

// 序列化器
export * from './serializers/json-serializer';
export * from './serializers/protobuf-serializer';
export * from './serializers/msgpack-serializer';

// 验证器
export * from './validators/schema-validator';
export * from './validators/type-validator';

// 转换器
export * from './transformers/cross-language-transformer';
export * from './transformers/version-transformer';

// 工具函数
export * from './utils/format-utils';
export * from './utils/compression';

// 常量和类型
export * from './constants/format-types';
export * from './types/udef-types';

// 默认导出
export { UDEFMessage } from './core/udef-message';