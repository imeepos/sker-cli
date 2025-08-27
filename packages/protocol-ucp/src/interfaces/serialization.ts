/**
 * 序列化格式枚举
 */
export enum SerializationFormat {
  JSON = 'json',
  PROTOBUF = 'protobuf',
  AVRO = 'avro',
  MSGPACK = 'msgpack',
  CBOR = 'cbor',
  BINARY = 'binary'
}

/**
 * 序列化配置接口
 */
export interface SerializationConfig {
  format: SerializationFormat;
  options?: {
    compression?: 'gzip' | 'brotli' | 'lz4';
    encryption?: boolean;
    schema?: any;
    validateSchema?: boolean;
    preserveUndefined?: boolean;
    [key: string]: any;
  };
}

/**
 * 序列化器接口
 */
export interface Serializer {
  readonly format: SerializationFormat;
  readonly name: string;
  readonly version: string;
  
  serialize(data: any, config?: SerializationConfig): Promise<Buffer>;
  deserialize(buffer: Buffer, config?: SerializationConfig): Promise<any>;
  
  getSchema?(): any;
  validateSchema?(data: any): boolean;
  estimateSize?(data: any): number;
}

/**
 * 序列化器工厂接口
 */
export interface SerializerFactory {
  createSerializer(format: SerializationFormat, config?: SerializationConfig): Serializer;
  supportedFormats(): SerializationFormat[];
  getDefaultConfig(format: SerializationFormat): SerializationConfig;
}

/**
 * 序列化管理器接口
 */
export interface SerializationManager {
  serialize(data: any, config: SerializationConfig): Promise<Buffer>;
  deserialize(buffer: Buffer, config: SerializationConfig): Promise<any>;
  
  registerSerializer(format: SerializationFormat, serializer: Serializer): void;
  unregisterSerializer(format: SerializationFormat): void;
  getSerializer(format: SerializationFormat): Serializer | undefined;
  
  detectFormat(buffer: Buffer): SerializationFormat | undefined;
  getBestFormat(data: any): SerializationFormat;
}

/**
 * 数据压缩接口
 */
export interface DataCompressor {
  readonly algorithm: string;
  
  compress(data: Buffer): Promise<Buffer>;
  decompress(data: Buffer): Promise<Buffer>;
  estimateCompressionRatio(data: Buffer): number;
}

/**
 * 数据加密接口
 */
export interface DataEncryptor {
  readonly algorithm: string;
  
  encrypt(data: Buffer, key: Buffer): Promise<Buffer>;
  decrypt(data: Buffer, key: Buffer): Promise<Buffer>;
  generateKey(): Promise<Buffer>;
}