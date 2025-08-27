/**
 * Schema注册表接口和基础实现
 * Schema registry interface and base implementation
 */

import { BasicTypes, type UUID, type SkerString } from '@sker/types';

export interface Schema {
  id: UUID;
  name: SkerString;
  version: SkerString;
  type: 'json-schema' | 'avro' | 'protobuf';
  definition: any;
  created_at: Date;
  updated_at: Date;
  metadata?: Record<string, unknown>;
}

export interface SchemaVersion {
  version: SkerString;
  schema: Schema;
  compatibility: 'backward' | 'forward' | 'full' | 'none';
  is_active: boolean;
  migration_rules?: MigrationRule[];
}

export interface MigrationRule {
  from_version: SkerString;
  to_version: SkerString;
  rules: FieldMigrationRule[];
}

export interface FieldMigrationRule {
  type: 'add_field' | 'remove_field' | 'rename_field' | 'change_type' | 'transform';
  path: SkerString;
  from?: SkerString;
  to?: SkerString;
  default?: unknown;
  transform?: SkerString | ((value: any) => any);
}

export interface SchemaRegistryConfig {
  backend: 'memory' | 'redis' | 'mongodb' | 'postgresql' | 'http';
  connection?: {
    host?: string;
    port?: number;
    username?: string;
    password?: string;
    database?: string;
    url?: string;
  };
  cache?: {
    enabled: boolean;
    ttl: number;
    maxSize: number;
  };
  compatibility: 'backward' | 'forward' | 'full' | 'none';
  versionStrategy: 'semantic' | 'numeric' | 'timestamp';
}

export interface SchemaRegistryOperations {
  register(name: SkerString, version: SkerString, definition: any): Promise<UUID>;
  get(name: SkerString, version?: SkerString): Promise<Schema | null>;
  list(name?: SkerString): Promise<Schema[]>;
  delete(name: SkerString, version?: SkerString): Promise<boolean>;
  checkCompatibility(name: SkerString, newDefinition: any): Promise<boolean>;
  getVersions(name: SkerString): Promise<SchemaVersion[]>;
  setActiveVersion(name: SkerString, version: SkerString): Promise<boolean>;
}

/**
 * 内存Schema注册表实现
 * In-memory schema registry implementation
 */
export class MemorySchemaRegistry implements SchemaRegistryOperations {
  private schemas: Map<string, Map<string, Schema>> = new Map();
  private activeVersions: Map<string, string> = new Map();
  private config: SchemaRegistryConfig;

  constructor(config: SchemaRegistryConfig) {
    this.config = {
      backend: config.backend,
      cache: {
        enabled: true,
        ttl: 300000, // 5 minutes
        maxSize: 1000,
        ...config.cache
      },
      compatibility: config.compatibility || 'backward',
      versionStrategy: config.versionStrategy || 'semantic',
      connection: config.connection
    };
  }

  async register(name: SkerString, version: SkerString, definition: any): Promise<UUID> {
    // 验证版本格式
    this.validateVersion(version);
    
    // 检查兼容性
    const isCompatible = await this.checkCompatibility(name, definition);
    if (!isCompatible && this.config.compatibility !== 'none') {
      throw new Error(`Schema ${name}@${version} is not compatible with existing versions`);
    }
    
    // 创建Schema
    const schema: Schema = {
      id: BasicTypes.createUUID(),
      name,
      version,
      type: this.detectSchemaType(definition),
      definition,
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // 存储Schema
    if (!this.schemas.has(name)) {
      this.schemas.set(name, new Map());
    }
    
    this.schemas.get(name)!.set(version, schema);
    
    // 设置为活跃版本（如果是第一个版本或最新版本）
    const currentActive = this.activeVersions.get(name);
    if (!currentActive || this.isNewerVersion(version, currentActive)) {
      this.activeVersions.set(name, version);
    }
    
    return schema.id;
  }

  async get(name: SkerString, version?: SkerString): Promise<Schema | null> {
    const schemaVersions = this.schemas.get(name);
    if (!schemaVersions) {
      return null;
    }
    
    const targetVersion = version || this.activeVersions.get(name);
    if (!targetVersion) {
      return null;
    }
    
    return schemaVersions.get(targetVersion) || null;
  }

  async list(name?: SkerString): Promise<Schema[]> {
    if (name) {
      const schemaVersions = this.schemas.get(name);
      return schemaVersions ? Array.from(schemaVersions.values()) : [];
    }
    
    // 返回所有Schema
    const allSchemas: Schema[] = [];
    for (const schemaVersions of this.schemas.values()) {
      allSchemas.push(...schemaVersions.values());
    }
    
    return allSchemas;
  }

  async delete(name: SkerString, version?: SkerString): Promise<boolean> {
    const schemaVersions = this.schemas.get(name);
    if (!schemaVersions) {
      return false;
    }
    
    if (version) {
      // 删除特定版本
      const deleted = schemaVersions.delete(version);
      
      // 如果删除的是活跃版本，需要设置新的活跃版本
      if (deleted && this.activeVersions.get(name) === version) {
        const remainingVersions = Array.from(schemaVersions.keys());
        if (remainingVersions.length > 0) {
          const latestVersion = this.getLatestVersion(remainingVersions);
          this.activeVersions.set(name, latestVersion);
        } else {
          this.activeVersions.delete(name);
        }
      }
      
      // 如果没有版本了，删除整个Schema组
      if (schemaVersions.size === 0) {
        this.schemas.delete(name);
      }
      
      return deleted;
    } else {
      // 删除所有版本
      this.schemas.delete(name);
      this.activeVersions.delete(name);
      return true;
    }
  }

  async checkCompatibility(name: SkerString, newDefinition: any): Promise<boolean> {
    const currentSchema = await this.get(name);
    if (!currentSchema) {
      return true; // 新Schema总是兼容的
    }
    
    return this.validateCompatibility(currentSchema.definition, newDefinition);
  }

  async getVersions(name: SkerString): Promise<SchemaVersion[]> {
    const schemaVersions = this.schemas.get(name);
    if (!schemaVersions) {
      return [];
    }
    
    const activeVersion = this.activeVersions.get(name);
    
    return Array.from(schemaVersions.values()).map(schema => ({
      version: schema.version,
      schema,
      compatibility: this.config.compatibility,
      is_active: schema.version === activeVersion
    }));
  }

  async setActiveVersion(name: SkerString, version: SkerString): Promise<boolean> {
    const schemaVersions = this.schemas.get(name);
    if (!schemaVersions || !schemaVersions.has(version)) {
      return false;
    }
    
    this.activeVersions.set(name, version);
    return true;
  }

  /**
   * 检测Schema类型
   * Detect schema type
   */
  private detectSchemaType(definition: any): 'json-schema' | 'avro' | 'protobuf' {
    if (typeof definition === 'string') {
      // 字符串格式，可能是protobuf定义
      return 'protobuf';
    }
    
    if (definition && typeof definition === 'object') {
      if (definition.$schema || definition.type) {
        return 'json-schema';
      }
      if (definition.type && definition.name && definition.fields) {
        return 'avro';
      }
    }
    
    return 'json-schema'; // 默认
  }

  /**
   * 验证版本格式
   * Validate version format
   */
  private validateVersion(version: SkerString): void {
    switch (this.config.versionStrategy) {
      case 'semantic':
        if (!/^\d+\.\d+\.\d+/.test(version)) {
          throw new Error(`Invalid semantic version: ${version}`);
        }
        break;
      case 'numeric':
        if (!/^\d+$/.test(version)) {
          throw new Error(`Invalid numeric version: ${version}`);
        }
        break;
      case 'timestamp':
        if (!/^\d{13}$/.test(version)) {
          throw new Error(`Invalid timestamp version: ${version}`);
        }
        break;
    }
  }

  /**
   * 检查版本是否更新
   * Check if version is newer
   */
  private isNewerVersion(version1: SkerString, version2: SkerString): boolean {
    switch (this.config.versionStrategy) {
      case 'semantic':
        return this.compareSemanticVersions(version1, version2) > 0;
      case 'numeric':
        return parseInt(version1, 10) > parseInt(version2, 10);
      case 'timestamp':
        return parseInt(version1, 10) > parseInt(version2, 10);
      default:
        return version1 > version2;
    }
  }

  /**
   * 比较语义化版本
   * Compare semantic versions
   */
  private compareSemanticVersions(v1: SkerString, v2: SkerString): number {
    const parts1 = v1.split('.').map(n => parseInt(n, 10));
    const parts2 = v2.split('.').map(n => parseInt(n, 10));
    
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;
      
      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }
    
    return 0;
  }

  /**
   * 获取最新版本
   * Get latest version
   */
  private getLatestVersion(versions: SkerString[]): SkerString {
    return versions.reduce((latest, current) => 
      this.isNewerVersion(current, latest) ? current : latest
    );
  }

  /**
   * 验证兼容性
   * Validate compatibility
   */
  private validateCompatibility(oldDefinition: any, newDefinition: any): boolean {
    // 简化的兼容性检查实现
    // 实际应用中应该根据Schema类型进行详细的兼容性检查
    
    switch (this.config.compatibility) {
      case 'backward':
        return this.isBackwardCompatible(oldDefinition, newDefinition);
      case 'forward':
        return this.isForwardCompatible(oldDefinition, newDefinition);
      case 'full':
        return this.isBackwardCompatible(oldDefinition, newDefinition) && 
               this.isForwardCompatible(oldDefinition, newDefinition);
      case 'none':
        return true;
      default:
        return true;
    }
  }

  /**
   * 检查向后兼容性
   * Check backward compatibility
   */
  private isBackwardCompatible(oldDef: any, newDef: any): boolean {
    // 简化实现：检查新Schema是否可以读取旧数据
    if (!oldDef || !newDef) return false;
    
    // 如果两个定义相同，则兼容
    if (JSON.stringify(oldDef) === JSON.stringify(newDef)) {
      return true;
    }
    
    // JSON Schema兼容性检查
    if (oldDef.type && newDef.type && oldDef.type === 'object' && newDef.type === 'object') {
      const oldRequired = oldDef.required || [];
      const newRequired = newDef.required || [];
      
      // 新Schema不能要求旧Schema中不存在的必填字段
      for (const field of newRequired) {
        if (!oldRequired.includes(field) && !oldDef.properties?.[field]) {
          return false;
        }
      }
      
      return true;
    }
    
    return true; // 默认兼容
  }

  /**
   * 检查向前兼容性
   * Check forward compatibility
   */
  private isForwardCompatible(oldDef: any, newDef: any): boolean {
    // 简化实现：检查旧Schema是否可以读取新数据
    return this.isBackwardCompatible(newDef, oldDef);
  }
}