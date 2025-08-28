/**
 * 跨语言类型映射器
 * Cross-language type mapper
 */

import { type SkerString } from '@sker/types';

export type SupportedLanguage = 'typescript' | 'javascript' | 'java' | 'go' | 'rust' | 'csharp' | 'python';

export interface TypeMapping {
  from: SkerString;
  to: SkerString;
  converter?: string;
  imports?: string[];
}

export interface LanguageMapping {
  language: SupportedLanguage;
  mappings: Record<string, TypeMapping>;
  namingConvention: NamingConvention;
  primitiveTypes: Record<string, string>;
  collectionTypes: Record<string, string>;
  imports: Record<string, string[]>;
}

export interface NamingConvention {
  property: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case';
  class: 'PascalCase' | 'camelCase' | 'snake_case';
  constant: 'UPPER_SNAKE' | 'UPPER_CAMEL' | 'lower_snake' | 'PascalCase';
  file: 'kebab-case' | 'snake_case' | 'camelCase' | 'PascalCase';
}

export interface TransformationContext {
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  packageName?: string;
  namespace?: string;
  imports?: Set<string>;
  customMappings?: Record<string, string>;
}

/**
 * 跨语言类型映射器
 * Cross-language type mapper
 */
export class CrossLanguageTypeMapper {
  private languageMappings: Map<SupportedLanguage, LanguageMapping>;

  constructor() {
    this.languageMappings = new Map();
    this.initializeDefaultMappings();
  }

  /**
   * 初始化默认类型映射
   * Initialize default type mappings
   */
  private initializeDefaultMappings(): void {
    // TypeScript/JavaScript映射
    this.languageMappings.set('typescript', {
      language: 'typescript',
      mappings: {
        'string': { from: 'string', to: 'string' },
        'number': { from: 'number', to: 'number' },
        'boolean': { from: 'boolean', to: 'boolean' },
        'Date': { from: 'Date', to: 'Date' },
        'Array': { from: 'Array<T>', to: 'T[]' },
        'Map': { from: 'Map<K,V>', to: 'Map<K, V>' },
        'Set': { from: 'Set<T>', to: 'Set<T>' }
      },
      namingConvention: {
        property: 'camelCase',
        class: 'PascalCase',
        constant: 'UPPER_SNAKE',
        file: 'kebab-case'
      },
      primitiveTypes: {
        'string': 'string',
        'number': 'number',
        'integer': 'number',
        'float': 'number',
        'boolean': 'boolean',
        'timestamp': 'Date',
        'uuid': 'string',
        'binary': 'Uint8Array'
      },
      collectionTypes: {
        'array': 'Array',
        'list': 'Array',
        'map': 'Map',
        'set': 'Set'
      },
      imports: {}
    });

    // Java映射
    this.languageMappings.set('java', {
      language: 'java',
      mappings: {
        'string': { from: 'string', to: 'String' },
        'number': { from: 'number', to: 'Double' },
        'integer': { from: 'number', to: 'Long' },
        'boolean': { from: 'boolean', to: 'Boolean' },
        'Date': { from: 'Date', to: 'Instant', imports: ['java.time.Instant'] },
        'Array': { from: 'Array<T>', to: 'List<T>', imports: ['java.util.List'] },
        'Map': { from: 'Map<K,V>', to: 'Map<K, V>', imports: ['java.util.Map'] },
        'Set': { from: 'Set<T>', to: 'Set<T>', imports: ['java.util.Set'] }
      },
      namingConvention: {
        property: 'camelCase',
        class: 'PascalCase',
        constant: 'UPPER_SNAKE',
        file: 'PascalCase'
      },
      primitiveTypes: {
        'string': 'String',
        'number': 'Double',
        'integer': 'Long',
        'float': 'Double',
        'boolean': 'Boolean',
        'timestamp': 'Instant',
        'uuid': 'UUID',
        'binary': 'byte[]'
      },
      collectionTypes: {
        'array': 'List',
        'list': 'List',
        'map': 'Map',
        'set': 'Set'
      },
      imports: {
        'Instant': ['java.time.Instant'],
        'UUID': ['java.util.UUID'],
        'List': ['java.util.List'],
        'Map': ['java.util.Map'],
        'Set': ['java.util.Set']
      }
    });

    // Go映射
    this.languageMappings.set('go', {
      language: 'go',
      mappings: {
        'string': { from: 'string', to: 'string' },
        'number': { from: 'number', to: 'float64' },
        'integer': { from: 'number', to: 'int64' },
        'boolean': { from: 'boolean', to: 'bool' },
        'Date': { from: 'Date', to: 'time.Time', imports: ['time'] },
        'Array': { from: 'Array<T>', to: '[]T' },
        'Map': { from: 'Map<K,V>', to: 'map[K]V' }
      },
      namingConvention: {
        property: 'PascalCase',
        class: 'PascalCase',
        constant: 'PascalCase',
        file: 'snake_case'
      },
      primitiveTypes: {
        'string': 'string',
        'number': 'float64',
        'integer': 'int64',
        'float': 'float64',
        'boolean': 'bool',
        'timestamp': 'time.Time',
        'uuid': 'string',
        'binary': '[]byte'
      },
      collectionTypes: {
        'array': '[]',
        'list': '[]',
        'map': 'map',
        'set': 'map[T]struct{}'
      },
      imports: {
        'time.Time': ['time']
      }
    });

    // Rust映射
    this.languageMappings.set('rust', {
      language: 'rust',
      mappings: {
        'string': { from: 'string', to: 'String' },
        'number': { from: 'number', to: 'f64' },
        'integer': { from: 'number', to: 'i64' },
        'boolean': { from: 'boolean', to: 'bool' },
        'Date': { from: 'Date', to: 'DateTime<Utc>', imports: ['chrono::{DateTime, Utc}'] },
        'Array': { from: 'Array<T>', to: 'Vec<T>' },
        'Map': { from: 'Map<K,V>', to: 'HashMap<K, V>', imports: ['std::collections::HashMap'] },
        'Set': { from: 'Set<T>', to: 'HashSet<T>', imports: ['std::collections::HashSet'] }
      },
      namingConvention: {
        property: 'snake_case',
        class: 'PascalCase',
        constant: 'UPPER_SNAKE',
        file: 'snake_case'
      },
      primitiveTypes: {
        'string': 'String',
        'number': 'f64',
        'integer': 'i64',
        'float': 'f64',
        'boolean': 'bool',
        'timestamp': 'DateTime<Utc>',
        'uuid': 'Uuid',
        'binary': 'Vec<u8>'
      },
      collectionTypes: {
        'array': 'Vec',
        'list': 'Vec',
        'map': 'HashMap',
        'set': 'HashSet'
      },
      imports: {
        'DateTime<Utc>': ['chrono::{DateTime, Utc}'],
        'HashMap': ['std::collections::HashMap'],
        'HashSet': ['std::collections::HashSet'],
        'Uuid': ['uuid::Uuid']
      }
    });

    // Python映射
    this.languageMappings.set('python', {
      language: 'python',
      mappings: {
        'string': { from: 'string', to: 'str' },
        'number': { from: 'number', to: 'float' },
        'integer': { from: 'number', to: 'int' },
        'boolean': { from: 'boolean', to: 'bool' },
        'Date': { from: 'Date', to: 'datetime', imports: ['datetime'] },
        'Array': { from: 'Array<T>', to: 'List[T]', imports: ['typing'] },
        'Map': { from: 'Map<K,V>', to: 'Dict[K, V]', imports: ['typing'] },
        'Set': { from: 'Set<T>', to: 'Set[T]', imports: ['typing'] }
      },
      namingConvention: {
        property: 'snake_case',
        class: 'PascalCase',
        constant: 'UPPER_SNAKE',
        file: 'snake_case'
      },
      primitiveTypes: {
        'string': 'str',
        'number': 'float',
        'integer': 'int',
        'float': 'float',
        'boolean': 'bool',
        'timestamp': 'datetime',
        'uuid': 'UUID',
        'binary': 'bytes'
      },
      collectionTypes: {
        'array': 'List',
        'list': 'List',
        'map': 'Dict',
        'set': 'Set'
      },
      imports: {
        'datetime': ['datetime'],
        'UUID': ['uuid'],
        'List': ['typing'],
        'Dict': ['typing'],
        'Set': ['typing']
      }
    });

    // C#映射
    this.languageMappings.set('csharp', {
      language: 'csharp',
      mappings: {
        'string': { from: 'string', to: 'string' },
        'number': { from: 'number', to: 'double' },
        'integer': { from: 'number', to: 'long' },
        'boolean': { from: 'boolean', to: 'bool' },
        'Date': { from: 'Date', to: 'DateTime' },
        'Array': { from: 'Array<T>', to: 'List<T>', imports: ['System.Collections.Generic'] },
        'Map': { from: 'Map<K,V>', to: 'Dictionary<K, V>', imports: ['System.Collections.Generic'] },
        'Set': { from: 'Set<T>', to: 'HashSet<T>', imports: ['System.Collections.Generic'] }
      },
      namingConvention: {
        property: 'PascalCase',
        class: 'PascalCase',
        constant: 'PascalCase',
        file: 'PascalCase'
      },
      primitiveTypes: {
        'string': 'string',
        'number': 'double',
        'integer': 'long',
        'float': 'double',
        'boolean': 'bool',
        'timestamp': 'DateTime',
        'uuid': 'Guid',
        'binary': 'byte[]'
      },
      collectionTypes: {
        'array': 'List',
        'list': 'List',
        'map': 'Dictionary',
        'set': 'HashSet'
      },
      imports: {
        'List': ['System.Collections.Generic'],
        'Dictionary': ['System.Collections.Generic'],
        'HashSet': ['System.Collections.Generic']
      }
    });
  }

  /**
   * 映射类型
   * Map type
   */
  mapType(
    sourceType: string, 
    context: TransformationContext
  ): { type: string; imports: string[] } {
    const targetMapping = this.languageMappings.get(context.targetLanguage);
    if (!targetMapping) {
      throw new Error(`Unsupported target language: ${context.targetLanguage}`);
    }

    // 检查自定义映射
    if (context.customMappings && context.customMappings[sourceType]) {
      return { type: context.customMappings[sourceType], imports: [] };
    }

    // 检查基本类型映射
    if (targetMapping.primitiveTypes[sourceType]) {
      const mappedType = targetMapping.primitiveTypes[sourceType];
      const imports = targetMapping.imports[mappedType] || [];
      return { type: mappedType, imports };
    }

    // 检查集合类型
    const collectionMatch = this.matchCollectionType(sourceType);
    if (collectionMatch) {
      return this.mapCollectionType(collectionMatch, targetMapping, context);
    }

    // 检查复杂类型映射
    if (targetMapping.mappings[sourceType]) {
      const mapping = targetMapping.mappings[sourceType];
      return { type: mapping.to, imports: mapping.imports || [] };
    }

    // 默认返回原类型
    return { type: sourceType, imports: [] };
  }

  /**
   * 匹配集合类型
   * Match collection type
   */
  private matchCollectionType(type: string): { base: string; elementType: string } | null {
    const arrayMatch = type.match(/^(Array|List)<(.+)>$/);
    if (arrayMatch) {
      return { base: 'array', elementType: arrayMatch[2]! };
    }

    const mapMatch = type.match(/^Map<(.+),\s*(.+)>$/);
    if (mapMatch) {
      return { base: 'map', elementType: `${mapMatch[1]}, ${mapMatch[2]}` };
    }

    const setMatch = type.match(/^Set<(.+)>$/);
    if (setMatch) {
      return { base: 'set', elementType: setMatch[1]! };
    }

    return null;
  }

  /**
   * 映射集合类型
   * Map collection type
   */
  private mapCollectionType(
    match: { base: string; elementType: string },
    targetMapping: LanguageMapping,
    context: TransformationContext
  ): { type: string; imports: string[] } {
    const collectionType = targetMapping.collectionTypes[match.base]!;
    const allImports: string[] = [];

    if (match.base === 'array' || match.base === 'list') {
      // 递归映射元素类型
      const elementMapping = this.mapType(match.elementType, context);
      allImports.push(...elementMapping.imports);

      switch (context.targetLanguage) {
        case 'java':
          allImports.push(...(targetMapping.imports[collectionType] || []));
          return { type: `${collectionType}<${elementMapping.type}>`, imports: allImports };
        case 'go':
          return { type: `[]${elementMapping.type}`, imports: allImports };
        case 'rust':
          return { type: `Vec<${elementMapping.type}>`, imports: allImports };
        case 'python':
          allImports.push(...(targetMapping.imports['List'] || []));
          return { type: `List[${elementMapping.type}]`, imports: allImports };
        case 'csharp':
          allImports.push(...(targetMapping.imports[collectionType] || []));
          return { type: `${collectionType}<${elementMapping.type}>`, imports: allImports };
        default:
          return { type: `${elementMapping.type}[]`, imports: allImports };
      }
    } else if (match.base === 'map') {
      const [keyType, valueType] = match.elementType.split(',').map(t => t.trim());
      const keyMapping = this.mapType(keyType!, context);
      const valueMapping = this.mapType(valueType!, context);
      
      allImports.push(...keyMapping.imports, ...valueMapping.imports);

      switch (context.targetLanguage) {
        case 'java':
          allImports.push(...(targetMapping.imports[collectionType] || []));
          return { type: `${collectionType}<${keyMapping.type}, ${valueMapping.type}>`, imports: allImports };
        case 'go':
          return { type: `map[${keyMapping.type}]${valueMapping.type}`, imports: allImports };
        case 'rust':
          allImports.push(...(targetMapping.imports['HashMap'] || []));
          return { type: `HashMap<${keyMapping.type}, ${valueMapping.type}>`, imports: allImports };
        case 'python':
          allImports.push(...(targetMapping.imports['Dict'] || []));
          return { type: `Dict[${keyMapping.type}, ${valueMapping.type}]`, imports: allImports };
        case 'csharp':
          allImports.push(...(targetMapping.imports[collectionType] || []));
          return { type: `${collectionType}<${keyMapping.type}, ${valueMapping.type}>`, imports: allImports };
        default:
          return { type: `Map<${keyMapping.type}, ${valueMapping.type}>`, imports: allImports };
      }
    }

    return { type: match.elementType, imports: [] };
  }

  /**
   * 转换命名约定
   * Transform naming convention
   */
  transformNaming(
    name: string, 
    sourceConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case',
    targetConvention: 'camelCase' | 'snake_case' | 'PascalCase' | 'kebab-case' | 'UPPER_SNAKE' | 'UPPER_CAMEL' | 'lower_snake'
  ): string {
    if (sourceConvention === targetConvention) {
      return name;
    }

    // 转换为标准化格式（words数组）
    let words: string[] = [];
    
    switch (sourceConvention) {
      case 'camelCase':
        words = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
        break;
      case 'PascalCase':
        words = name.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(' ');
        break;
      case 'snake_case':
        words = name.toLowerCase().split('_');
        break;
      case 'kebab-case':
        words = name.toLowerCase().split('-');
        break;
    }

    // 转换为目标格式
    switch (targetConvention) {
      case 'camelCase':
        return words[0]!.toLowerCase() + 
               words.slice(1).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      case 'PascalCase':
        return words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('');
      case 'snake_case':
      case 'lower_snake':
        return words.map(w => w.toLowerCase()).join('_');
      case 'kebab-case':
        return words.map(w => w.toLowerCase()).join('-');
      case 'UPPER_SNAKE':
        return words.map(w => w.toUpperCase()).join('_');
      case 'UPPER_CAMEL':
        return words.map(w => w.toUpperCase()).join('');
      default:
        return name;
    }
  }

  /**
   * 获取语言的命名约定
   * Get language naming convention
   */
  getNamingConvention(language: SupportedLanguage): NamingConvention | null {
    const mapping = this.languageMappings.get(language);
    return mapping ? mapping.namingConvention : null;
  }

  /**
   * 添加自定义映射
   * Add custom mapping
   */
  addCustomMapping(language: SupportedLanguage, sourceType: string, mapping: TypeMapping): void {
    const languageMapping = this.languageMappings.get(language);
    if (languageMapping) {
      languageMapping.mappings[sourceType] = mapping;
    }
  }

  /**
   * 获取支持的语言列表
   * Get supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return Array.from(this.languageMappings.keys());
  }

  /**
   * 检查语言是否支持
   * Check if language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.languageMappings.has(language as SupportedLanguage);
  }
}