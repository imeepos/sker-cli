import * as fs from 'fs/promises';
import * as path from 'path';
import { Root, Type } from 'protobufjs';
import {
  SchemaRegistryConfig,
  SchemaMetadata,
  SchemaRegistration,
  CompiledSchema,
  CompatibilityConfig
} from '../types/protobuf-types.js';
import { PROTOBUF_CONSTANTS } from '../constants/protobuf-constants.js';
import { 
  generateSchemaHash, 
  validateSchemaVersion, 
  compareSchemaVersions,
  generateId
} from '../utils/protobuf-utils.js';

/**
 * Schema注册表实现
 * 负责管理Protocol Buffers Schema的注册、版本控制和缓存
 */
export class SchemaRegistry {
  private schemas = new Map<string, SchemaRegistration>();
  private compiledCache = new Map<string, CompiledSchema>();
  private config: Required<SchemaRegistryConfig>;

  constructor(config: SchemaRegistryConfig = {}) {
    this.config = this.mergeConfig(config);
    this.initialize();
  }

  private mergeConfig(config: SchemaRegistryConfig): Required<SchemaRegistryConfig> {
    return {
      backend: config.backend || PROTOBUF_CONSTANTS.BACKEND_TYPES.MEMORY,
      file: {
        schemaDir: './schemas',
        autoLoad: true,
        watchChanges: false,
        ...config.file
      },
      redis: {
        host: 'localhost',
        port: 6379,
        database: 0,
        keyPrefix: 'sker:schemas:',
        ...config.redis
      },
      http: {
        baseURL: 'http://localhost:8081',
        timeout: 30000,
        ...config.http
      },
      versioning: {
        strategy: PROTOBUF_CONSTANTS.VERSION_STRATEGIES.SEMANTIC,
        defaultVersion: PROTOBUF_CONSTANTS.SCHEMA_VERSION.DEFAULT,
        autoIncrement: false,
        ...config.versioning
      },
      compatibility: {
        level: PROTOBUF_CONSTANTS.COMPATIBILITY_LEVELS.BACKWARD,
        strictChecks: true,
        allowEvolution: true,
        ...config.compatibility
      },
      cache: {
        enabled: true,
        ttl: PROTOBUF_CONSTANTS.DEFAULT_TTL,
        maxSize: PROTOBUF_CONSTANTS.DEFAULT_CACHE_SIZE,
        ...config.cache
      }
    };
  }

  private async initialize(): Promise<void> {
    if (this.config.backend === PROTOBUF_CONSTANTS.BACKEND_TYPES.FILE && 
        this.config.file.autoLoad) {
      await this.loadSchemasFromDirectory();
    }
  }

  /**
   * 从.proto文件注册Schema
   */
  async registerFromFile(filePath: string, options: {
    package?: string;
    version?: string;
    tags?: Record<string, string>;
  } = {}): Promise<SchemaMetadata> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const name = path.basename(filePath, '.proto');
      
      return await this.register(name, content, {
        package: options.package,
        version: options.version || this.config.versioning.defaultVersion,
        tags: options.tags
      });
    } catch (error) {
      throw new Error(`Failed to register schema from file ${filePath}: ${error}`);
    }
  }

  /**
   * 注册Schema
   */
  async register(
    name: string, 
    content: string, 
    options: {
      package?: string;
      version?: string;
      dependencies?: string[];
      tags?: Record<string, string>;
    } = {}
  ): Promise<SchemaMetadata> {
    const version = options.version || this.config.versioning.defaultVersion || '1.0.0';
    
    if (!validateSchemaVersion(version)) {
      throw new Error(`Invalid schema version format: ${version}`);
    }

    const hash = generateSchemaHash(content);
    const id = generateId('schema');
    const now = new Date();

    const metadata: SchemaMetadata = {
      id,
      name,
      package: options.package,
      version,
      hash,
      createdAt: now,
      updatedAt: now,
      dependencies: options.dependencies || [],
      tags: options.tags || {}
    };

    // 检查兼容性
    await this.checkCompatibility(name, content, version);

    const registration: SchemaRegistration = {
      metadata,
      content
    };

    // 存储到后端
    await this.persistSchema(registration);
    
    // 缓存
    const schemaKey = this.getSchemaKey(name, version);
    this.schemas.set(schemaKey, registration);

    // 编译并缓存
    if (this.config.cache.enabled) {
      try {
        const compiled = await this.compileSchema(registration);
        this.compiledCache.set(schemaKey, compiled);
      } catch (error) {
        console.warn(`Failed to compile schema ${name}:${version}:`, error);
      }
    }

    return metadata;
  }

  /**
   * 获取Schema
   */
  async getSchema(name: string, version?: string): Promise<SchemaRegistration | null> {
    const resolvedVersion = version || await this.getLatestVersion(name);
    if (!resolvedVersion) return null;

    const schemaKey = this.getSchemaKey(name, resolvedVersion);
    
    // 检查缓存
    if (this.schemas.has(schemaKey)) {
      return this.schemas.get(schemaKey)!;
    }

    // 从后端加载
    const schema = await this.loadSchema(name, resolvedVersion);
    if (schema) {
      this.schemas.set(schemaKey, schema);
    }

    return schema;
  }

  /**
   * 获取编译后的Schema
   */
  async getCompiledSchema(name: string, version?: string): Promise<CompiledSchema | null> {
    const resolvedVersion = version || await this.getLatestVersion(name);
    if (!resolvedVersion) return null;

    const schemaKey = this.getSchemaKey(name, resolvedVersion);
    
    // 检查缓存
    if (this.compiledCache.has(schemaKey)) {
      return this.compiledCache.get(schemaKey)!;
    }

    // 获取原始Schema
    const schema = await this.getSchema(name, resolvedVersion);
    if (!schema) return null;

    // 编译
    const compiled = await this.compileSchema(schema);
    
    // 缓存
    if (this.config.cache.enabled) {
      this.compiledCache.set(schemaKey, compiled);
    }

    return compiled;
  }

  /**
   * 列出所有Schema
   */
  async listSchemas(): Promise<SchemaMetadata[]> {
    const schemas: SchemaMetadata[] = [];
    
    for (const [, registration] of this.schemas) {
      schemas.push(registration.metadata);
    }

    return schemas.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * 获取Schema的所有版本
   */
  async getSchemaVersions(name: string): Promise<string[]> {
    const versions: string[] = [];
    
    for (const [key, registration] of this.schemas) {
      if (registration.metadata.name === name) {
        versions.push(registration.metadata.version);
      }
    }

    return versions.sort(compareSchemaVersions);
  }

  /**
   * 获取最新版本
   */
  async getLatestVersion(name: string): Promise<string | null> {
    const versions = await this.getSchemaVersions(name);
    return versions.length > 0 ? versions[versions.length - 1]! : null;
  }

  /**
   * 删除Schema
   */
  async deleteSchema(name: string, version?: string): Promise<boolean> {
    if (version) {
      const schemaKey = this.getSchemaKey(name, version);
      const deleted = this.schemas.delete(schemaKey);
      this.compiledCache.delete(schemaKey);
      
      if (deleted) {
        await this.removeSchemaFromBackend(name, version);
      }
      
      return deleted;
    } else {
      // 删除所有版本
      const versions = await this.getSchemaVersions(name);
      let deletedAny = false;
      
      for (const v of versions) {
        const schemaKey = this.getSchemaKey(name, v);
        if (this.schemas.delete(schemaKey)) {
          this.compiledCache.delete(schemaKey);
          await this.removeSchemaFromBackend(name, v);
          deletedAny = true;
        }
      }
      
      return deletedAny;
    }
  }

  /**
   * 编译Schema
   */
  private async compileSchema(registration: SchemaRegistration): Promise<CompiledSchema> {
    try {
      const root = new Root();
      root.loadSync(registration.content, { keepCase: true });
      
      const types = new Map<string, Type>();
      root.nestedArray.forEach(nested => {
        if (nested instanceof Type) {
          types.set(nested.fullName, nested);
        }
      });

      // 生成描述符 (简化实现)
      const descriptors = new Uint8Array(Buffer.from(registration.content, 'utf8'));

      return {
        root,
        types,
        descriptors,
        metadata: registration.metadata
      };
    } catch (error) {
      throw new Error(`Failed to compile schema ${registration.metadata.name}: ${error}`);
    }
  }

  /**
   * 检查兼容性
   */
  private async checkCompatibility(name: string, content: string, version: string): Promise<void> {
    if (!this.config.compatibility.strictChecks) {
      return;
    }

    const existingVersions = await this.getSchemaVersions(name);
    if (existingVersions.length === 0) {
      return; // 第一个版本，无需检查兼容性
    }

    const latestVersion = existingVersions[existingVersions.length - 1];
    const existing = await this.getSchema(name, latestVersion);
    
    if (!existing) {
      return;
    }

    // 简化的兼容性检查实现
    const compatibility = this.config.compatibility.level;
    
    switch (compatibility) {
      case PROTOBUF_CONSTANTS.COMPATIBILITY_LEVELS.BACKWARD:
        await this.checkBackwardCompatibility(existing.content, content);
        break;
      case PROTOBUF_CONSTANTS.COMPATIBILITY_LEVELS.FORWARD:
        await this.checkForwardCompatibility(existing.content, content);
        break;
      case PROTOBUF_CONSTANTS.COMPATIBILITY_LEVELS.FULL:
        await this.checkBackwardCompatibility(existing.content, content);
        await this.checkForwardCompatibility(existing.content, content);
        break;
      case PROTOBUF_CONSTANTS.COMPATIBILITY_LEVELS.NONE:
        // 不检查兼容性
        break;
    }
  }

  private async checkBackwardCompatibility(oldContent: string, newContent: string): Promise<void> {
    // 简化实现：检查是否有字段被删除
    // 实际实现应该解析proto文件并进行详细的兼容性检查
    console.warn('Backward compatibility check not fully implemented');
  }

  private async checkForwardCompatibility(oldContent: string, newContent: string): Promise<void> {
    // 简化实现：检查是否有必需字段被添加
    console.warn('Forward compatibility check not fully implemented');
  }

  /**
   * 从目录加载Schema
   */
  private async loadSchemasFromDirectory(): Promise<void> {
    try {
      const files = await fs.readdir(this.config.file.schemaDir);
      const protoFiles = files.filter(file => file.endsWith('.proto'));
      
      for (const file of protoFiles) {
        try {
          await this.registerFromFile(path.join(this.config.file.schemaDir, file));
        } catch (error) {
          console.warn(`Failed to load schema from ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn(`Failed to load schemas from directory:`, error);
    }
  }

  /**
   * 持久化Schema到后端
   */
  private async persistSchema(registration: SchemaRegistration): Promise<void> {
    switch (this.config.backend) {
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.FILE:
        await this.persistToFile(registration);
        break;
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.REDIS:
        await this.persistToRedis(registration);
        break;
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.HTTP:
        await this.persistToHttp(registration);
        break;
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.MEMORY:
        // 内存模式不需要持久化
        break;
    }
  }

  private async persistToFile(registration: SchemaRegistration): Promise<void> {
    const fileName = `${registration.metadata.name}_${registration.metadata.version}.proto`;
    const filePath = path.join(this.config.file.schemaDir, fileName);
    
    await fs.mkdir(this.config.file.schemaDir, { recursive: true });
    await fs.writeFile(filePath, registration.content, 'utf8');
  }

  private async persistToRedis(registration: SchemaRegistration): Promise<void> {
    // Redis持久化实现
    console.warn('Redis backend not implemented');
  }

  private async persistToHttp(registration: SchemaRegistration): Promise<void> {
    // HTTP后端持久化实现
    console.warn('HTTP backend not implemented');
  }

  /**
   * 从后端加载Schema
   */
  private async loadSchema(name: string, version: string): Promise<SchemaRegistration | null> {
    switch (this.config.backend) {
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.FILE:
        return await this.loadFromFile(name, version);
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.REDIS:
        return await this.loadFromRedis(name, version);
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.HTTP:
        return await this.loadFromHttp(name, version);
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.MEMORY:
      default:
        return null;
    }
  }

  private async loadFromFile(name: string, version: string): Promise<SchemaRegistration | null> {
    try {
      const fileName = `${name}_${version}.proto`;
      const filePath = path.join(this.config.file.schemaDir, fileName);
      const content = await fs.readFile(filePath, 'utf8');
      
      const hash = generateSchemaHash(content);
      const metadata: SchemaMetadata = {
        id: generateId('schema'),
        name,
        version,
        hash,
        createdAt: new Date(),
        updatedAt: new Date(),
        dependencies: [],
        tags: {}
      };

      return { metadata, content };
    } catch (error) {
      return null;
    }
  }

  private async loadFromRedis(name: string, version: string): Promise<SchemaRegistration | null> {
    console.warn('Redis backend not implemented');
    return null;
  }

  private async loadFromHttp(name: string, version: string): Promise<SchemaRegistration | null> {
    console.warn('HTTP backend not implemented');
    return null;
  }

  private async removeSchemaFromBackend(name: string, version: string): Promise<void> {
    switch (this.config.backend) {
      case PROTOBUF_CONSTANTS.BACKEND_TYPES.FILE:
        try {
          const fileName = `${name}_${version}.proto`;
          const filePath = path.join(this.config.file.schemaDir, fileName);
          await fs.unlink(filePath);
        } catch (error) {
          // Ignore file not found errors
        }
        break;
    }
  }

  private getSchemaKey(name: string, version: string): string {
    return `${name}:${version}`;
  }

  /**
   * 清理缓存
   */
  clearCache(): void {
    this.schemas.clear();
    this.compiledCache.clear();
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): {
    schemasCount: number;
    compiledCount: number;
  } {
    return {
      schemasCount: this.schemas.size,
      compiledCount: this.compiledCache.size
    };
  }
}