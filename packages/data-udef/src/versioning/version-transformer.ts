/**
 * 版本转换器实现
 * Version transformer implementation
 */

import type { UDEFMessageImpl } from '../core/message.js';
import { MessageFactory } from '../core/message.js';
import { type SkerString } from '@sker/types';

export interface MigrationRule {
  from_version: SkerString;
  to_version: SkerString;
  rules: FieldMigrationRule[];
  description?: string;
  created_at?: Date;
  created_by?: string;
}

export interface FieldMigrationRule {
  type: 'add_field' | 'remove_field' | 'rename_field' | 'change_type' | 'transform' | 'restructure';
  path: SkerString;
  from_path?: SkerString;
  to_path?: SkerString;
  default_value?: unknown;
  transform_function?: string | ((value: any, context: MigrationContext) => any);
  condition?: string | ((data: any, context: MigrationContext) => boolean);
  description?: string;
}

export interface MigrationContext {
  source_version: SkerString;
  target_version: SkerString;
  message_type: string;
  migration_path: SkerString[];
  warnings: string[];
  errors: string[];
  custom_data?: Record<string, unknown>;
}

export interface MigrationResult {
  success: boolean;
  transformed_message?: UDEFMessageImpl;
  warnings: string[];
  errors: string[];
  applied_rules: string[];
  migration_path: SkerString[];
}

export interface VersionCompatibility {
  from_version: SkerString;
  to_version: SkerString;
  compatibility: 'full' | 'backward' | 'forward' | 'none';
  migration_required: boolean;
  breaking_changes: string[];
}

/**
 * 版本比较器
 * Version comparator
 */
export class VersionComparator {
  /**
   * 比较两个语义化版本
   * Compare two semantic versions
   */
  static compareSemanticVersions(v1: SkerString, v2: SkerString): number {
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
   * 检查版本是否兼容
   * Check version compatibility
   */
  static isCompatible(from: SkerString, to: SkerString): VersionCompatibility {
    const comparison = this.compareSemanticVersions(from, to);
    
    if (comparison === 0) {
      return {
        from_version: from,
        to_version: to,
        compatibility: 'full',
        migration_required: false,
        breaking_changes: []
      };
    }

    const fromParts = from.split('.').map(n => parseInt(n, 10));
    const toParts = to.split('.').map(n => parseInt(n, 10));

    const majorChange = (toParts[0] || 0) !== (fromParts[0] || 0);
    const minorChange = (toParts[1] || 0) !== (fromParts[1] || 0);
    const patchChange = (toParts[2] || 0) !== (fromParts[2] || 0);

    let compatibility: 'full' | 'backward' | 'forward' | 'none';
    let migration_required = false;
    const breaking_changes: string[] = [];

    if (majorChange) {
      compatibility = 'none';
      migration_required = true;
      breaking_changes.push(`Major version change: ${fromParts[0]} -> ${toParts[0]}`);
    } else if (minorChange && comparison > 0) {
      compatibility = 'backward';
      migration_required = true;
      breaking_changes.push(`Minor version upgrade: ${fromParts[1]} -> ${toParts[1]}`);
    } else if (minorChange && comparison < 0) {
      compatibility = 'forward';
      migration_required = false;
    } else if (patchChange) {
      compatibility = 'full';
      migration_required = false;
    } else {
      compatibility = 'full';
      migration_required = false;
    }

    return {
      from_version: from,
      to_version: to,
      compatibility,
      migration_required,
      breaking_changes
    };
  }

  /**
   * 获取版本间的升级路径
   * Get upgrade path between versions
   */
  static getUpgradePath(
    from: SkerString, 
    to: SkerString, 
    availableVersions: SkerString[]
  ): SkerString[] {
    if (from === to) {
      return [from];
    }

    // 简化实现：直接路径
    // 实际应用中应该使用图算法找到最优路径
    const sortedVersions = availableVersions
      .filter(v => this.compareSemanticVersions(v, from) >= 0 && 
                   this.compareSemanticVersions(v, to) <= 0)
      .sort((a, b) => this.compareSemanticVersions(a, b));

    if (sortedVersions.length === 0) {
      return [from, to]; // 直接迁移
    }

    return sortedVersions;
  }
}

/**
 * 版本转换器
 * Version transformer
 */
export class VersionTransformer {
  private migrationRules: Map<string, MigrationRule[]>;
  private customTransformers: Map<string, (value: any, context: MigrationContext) => any>;

  constructor(initialRules: MigrationRule[] = []) {
    this.migrationRules = new Map();
    this.customTransformers = new Map();
    
    // 按照版本对迁移规则进行分组
    this.addMigrationRules(initialRules);
  }

  /**
   * 添加迁移规则
   * Add migration rules
   */
  addMigrationRules(rules: MigrationRule[]): void {
    for (const rule of rules) {
      const key = `${rule.from_version}->${rule.to_version}`;
      
      if (!this.migrationRules.has(key)) {
        this.migrationRules.set(key, []);
      }
      
      this.migrationRules.get(key)!.push(rule);
    }
  }

  /**
   * 添加自定义转换函数
   * Add custom transformer function
   */
  addCustomTransformer(
    name: string, 
    transformer: (value: any, context: MigrationContext) => any
  ): void {
    this.customTransformers.set(name, transformer);
  }

  /**
   * 升级消息版本
   * Upgrade message version
   */
  async upgrade(
    message: UDEFMessageImpl, 
    targetVersion: SkerString
  ): Promise<MigrationResult> {
    const currentVersion = message.payload.schema_version;
    
    if (currentVersion === targetVersion) {
      return {
        success: true,
        transformed_message: message,
        warnings: [],
        errors: [],
        applied_rules: [],
        migration_path: [currentVersion]
      };
    }

    return this.transform(message, currentVersion, targetVersion);
  }

  /**
   * 降级消息版本
   * Downgrade message version
   */
  async downgrade(
    message: UDEFMessageImpl, 
    targetVersion: SkerString
  ): Promise<MigrationResult> {
    const currentVersion = message.payload.schema_version;
    
    if (currentVersion === targetVersion) {
      return {
        success: true,
        transformed_message: message,
        warnings: [],
        errors: [],
        applied_rules: [],
        migration_path: [currentVersion]
      };
    }

    return this.transform(message, currentVersion, targetVersion);
  }

  /**
   * 转换消息
   * Transform message
   */
  private async transform(
    message: UDEFMessageImpl,
    fromVersion: SkerString,
    toVersion: SkerString
  ): Promise<MigrationResult> {
    const context: MigrationContext = {
      source_version: fromVersion,
      target_version: toVersion,
      message_type: message.messageType,
      migration_path: [fromVersion],
      warnings: [],
      errors: []
    };

    try {
      // 获取迁移路径
      const migrationPath = this.getMigrationPath(fromVersion, toVersion);
      context.migration_path = migrationPath;

      let currentMessage = message;
      const appliedRules: string[] = [];

      // 逐步应用迁移规则
      for (let i = 0; i < migrationPath.length - 1; i++) {
        const stepFrom = migrationPath[i]!;
        const stepTo = migrationPath[i + 1]!;
        
        const stepResult = await this.applyMigrationStep(
          currentMessage,
          stepFrom,
          stepTo,
          context
        );

        if (!stepResult.success) {
          return stepResult;
        }

        currentMessage = stepResult.transformed_message!;
        appliedRules.push(...stepResult.applied_rules);
      }

      // 更新消息的Schema版本
      const updatedPayload = currentMessage.payload.updateData(
        currentMessage.getData(),
        false
      );
      const finalMessage = new (currentMessage.constructor as any)(
        currentMessage.envelope,
        Object.assign(Object.create(Object.getPrototypeOf(updatedPayload)), updatedPayload, {
          schema_version: toVersion
        })
      );

      return {
        success: true,
        transformed_message: finalMessage,
        warnings: context.warnings,
        errors: context.errors,
        applied_rules: appliedRules,
        migration_path: migrationPath
      };
    } catch (error) {
      context.errors.push(`Migration failed: ${(error as Error).message}`);
      
      return {
        success: false,
        warnings: context.warnings,
        errors: context.errors,
        applied_rules: [],
        migration_path: context.migration_path
      };
    }
  }

  /**
   * 获取迁移路径
   * Get migration path
   */
  private getMigrationPath(fromVersion: SkerString, toVersion: SkerString): SkerString[] {
    // 简化实现：直接路径
    // 实际应用中应该根据可用的迁移规则构建最优路径
    const allVersions = new Set<string>();
    
    // 收集所有版本
    for (const key of this.migrationRules.keys()) {
      const [from, to] = key.split('->');
      allVersions.add(from!);
      allVersions.add(to!);
    }

    return VersionComparator.getUpgradePath(
      fromVersion,
      toVersion,
      Array.from(allVersions)
    );
  }

  /**
   * 应用单步迁移
   * Apply single migration step
   */
  private async applyMigrationStep(
    message: UDEFMessageImpl,
    fromVersion: SkerString,
    toVersion: SkerString,
    context: MigrationContext
  ): Promise<MigrationResult> {
    const ruleKey = `${fromVersion}->${toVersion}`;
    const rules = this.migrationRules.get(ruleKey) || [];

    if (rules.length === 0) {
      context.warnings.push(`No migration rules found for ${fromVersion} -> ${toVersion}`);
      return {
        success: true,
        transformed_message: message,
        warnings: context.warnings,
        errors: context.errors,
        applied_rules: [],
        migration_path: context.migration_path
      };
    }

    let transformedData = JSON.parse(JSON.stringify(message.getData()));
    const appliedRules: string[] = [];

    // 应用所有迁移规则
    for (const migrationRule of rules) {
      for (const fieldRule of migrationRule.rules) {
        try {
          const ruleApplied = await this.applyFieldMigrationRule(
            transformedData,
            fieldRule,
            context
          );
          
          if (ruleApplied) {
            appliedRules.push(`${fieldRule.type}:${fieldRule.path}`);
          }
        } catch (error) {
          context.errors.push(
            `Failed to apply rule ${fieldRule.type}:${fieldRule.path}: ${(error as Error).message}`
          );
          
          return {
            success: false,
            warnings: context.warnings,
            errors: context.errors,
            applied_rules: appliedRules,
            migration_path: context.migration_path
          };
        }
      }
    }

    // 创建新的消息实例
    const newMessage = message.updateData(transformedData);

    return {
      success: true,
      transformed_message: newMessage,
      warnings: context.warnings,
      errors: context.errors,
      applied_rules: appliedRules,
      migration_path: context.migration_path
    };
  }

  /**
   * 应用字段迁移规则
   * Apply field migration rule
   */
  private async applyFieldMigrationRule(
    data: any,
    rule: FieldMigrationRule,
    context: MigrationContext
  ): Promise<boolean> {
    // 检查条件
    if (rule.condition) {
      const conditionMet = typeof rule.condition === 'string' ?
        this.evaluateCondition(rule.condition, data, context) :
        rule.condition(data, context);
      
      if (!conditionMet) {
        return false;
      }
    }

    switch (rule.type) {
      case 'add_field':
        return this.addField(data, rule, context);
      
      case 'remove_field':
        return this.removeField(data, rule, context);
      
      case 'rename_field':
        return this.renameField(data, rule, context);
      
      case 'change_type':
        return this.changeType(data, rule, context);
      
      case 'transform':
        return this.transformField(data, rule, context);
      
      case 'restructure':
        return this.restructureData(data, rule, context);
      
      default:
        context.warnings.push(`Unknown migration rule type: ${rule.type}`);
        return false;
    }
  }

  /**
   * 添加字段
   * Add field
   */
  private addField(data: any, rule: FieldMigrationRule, context: MigrationContext): boolean {
    const path = rule.path.split('.');
    const target = this.getNestedObject(data, path.slice(0, -1), true);
    const fieldName = path[path.length - 1]!;

    if (fieldName in target) {
      context.warnings.push(`Field ${rule.path} already exists, skipping add operation`);
      return false;
    }

    target[fieldName] = rule.default_value;
    return true;
  }

  /**
   * 移除字段
   * Remove field
   */
  private removeField(data: any, rule: FieldMigrationRule, context: MigrationContext): boolean {
    const path = rule.path.split('.');
    const target = this.getNestedObject(data, path.slice(0, -1));
    const fieldName = path[path.length - 1]!;

    if (!target || !(fieldName in target)) {
      context.warnings.push(`Field ${rule.path} does not exist, skipping remove operation`);
      return false;
    }

    delete target[fieldName];
    return true;
  }

  /**
   * 重命名字段
   * Rename field
   */
  private renameField(data: any, rule: FieldMigrationRule, context: MigrationContext): boolean {
    if (!rule.from_path || !rule.to_path) {
      context.errors.push(`Rename rule requires from_path and to_path`);
      return false;
    }

    const fromPath = rule.from_path.split('.');
    const toPath = rule.to_path.split('.');

    const sourceTarget = this.getNestedObject(data, fromPath.slice(0, -1));
    const sourceField = fromPath[fromPath.length - 1]!;

    if (!sourceTarget || !(sourceField in sourceTarget)) {
      context.warnings.push(`Source field ${rule.from_path} does not exist`);
      return false;
    }

    const destTarget = this.getNestedObject(data, toPath.slice(0, -1), true);
    const destField = toPath[toPath.length - 1]!;

    destTarget[destField] = sourceTarget[sourceField];
    delete sourceTarget[sourceField];

    return true;
  }

  /**
   * 改变类型
   * Change type
   */
  private changeType(data: any, rule: FieldMigrationRule, context: MigrationContext): boolean {
    const path = rule.path.split('.');
    const target = this.getNestedObject(data, path.slice(0, -1));
    const fieldName = path[path.length - 1]!;

    if (!target || !(fieldName in target)) {
      context.warnings.push(`Field ${rule.path} does not exist`);
      return false;
    }

    const currentValue = target[fieldName];
    const transformedValue = this.convertType(currentValue, rule.transform_function as string);
    
    target[fieldName] = transformedValue;
    return true;
  }

  /**
   * 转换字段
   * Transform field
   */
  private transformField(data: any, rule: FieldMigrationRule, context: MigrationContext): boolean {
    const path = rule.path.split('.');
    const target = this.getNestedObject(data, path.slice(0, -1));
    const fieldName = path[path.length - 1]!;

    if (!target || !(fieldName in target)) {
      context.warnings.push(`Field ${rule.path} does not exist`);
      return false;
    }

    const currentValue = target[fieldName];
    let transformedValue: any;

    if (typeof rule.transform_function === 'string') {
      // 查找自定义转换器
      const transformer = this.customTransformers.get(rule.transform_function);
      if (transformer) {
        transformedValue = transformer(currentValue, context);
      } else {
        // 尝试作为表达式执行（危险操作，生产环境应该避免）
        transformedValue = this.evaluateTransform(rule.transform_function, currentValue, context);
      }
    } else if (typeof rule.transform_function === 'function') {
      transformedValue = rule.transform_function(currentValue, context);
    } else {
      context.errors.push(`Invalid transform function for field ${rule.path}`);
      return false;
    }

    target[fieldName] = transformedValue;
    return true;
  }

  /**
   * 重构数据
   * Restructure data
   */
  private restructureData(data: any, rule: FieldMigrationRule, context: MigrationContext): boolean {
    if (typeof rule.transform_function === 'function') {
      const restructuredData = rule.transform_function(data, context);
      Object.assign(data, restructuredData);
      return true;
    } else if (typeof rule.transform_function === 'string') {
      const transformer = this.customTransformers.get(rule.transform_function);
      if (transformer) {
        const restructuredData = transformer(data, context);
        Object.assign(data, restructuredData);
        return true;
      }
    }

    context.errors.push(`Invalid restructure function for rule at ${rule.path}`);
    return false;
  }

  /**
   * 获取嵌套对象
   * Get nested object
   */
  private getNestedObject(obj: any, path: string[], createIfMissing = false): any {
    let current = obj;
    
    for (const key of path) {
      if (!current || typeof current !== 'object') {
        return null;
      }
      
      if (!(key in current)) {
        if (createIfMissing) {
          current[key] = {};
        } else {
          return null;
        }
      }
      
      current = current[key];
    }
    
    return current;
  }

  /**
   * 转换类型
   * Convert type
   */
  private convertType(value: any, targetType: string): any {
    switch (targetType) {
      case 'string':
        return String(value);
      case 'number':
        return Number(value);
      case 'boolean':
        return Boolean(value);
      case 'date':
        return new Date(value);
      default:
        return value;
    }
  }

  /**
   * 评估条件表达式
   * Evaluate condition expression
   */
  private evaluateCondition(condition: string, data: any, context: MigrationContext): boolean {
    // 简化实现：只支持基本的存在性检查
    // 实际应用中应该使用安全的表达式解析器
    if (condition.startsWith('exists:')) {
      const path = condition.substring(7);
      const pathParts = path.split('.');
      const target = this.getNestedObject(data, pathParts.slice(0, -1));
      const field = pathParts[pathParts.length - 1]!;
      return target && (field in target);
    }
    
    return true;
  }

  /**
   * 评估转换表达式
   * Evaluate transform expression
   */
  private evaluateTransform(expression: string, value: any, context: MigrationContext): any {
    // 简化实现：只支持基本的转换
    // 实际应用中应该使用安全的表达式解析器
    
    if (expression === 'toUpperCase' && typeof value === 'string') {
      return value.toUpperCase();
    }
    
    if (expression === 'toLowerCase' && typeof value === 'string') {
      return value.toLowerCase();
    }
    
    if (expression.startsWith('multiply:') && typeof value === 'number') {
      const multiplier = parseFloat(expression.substring(9));
      return value * multiplier;
    }
    
    return value;
  }
}