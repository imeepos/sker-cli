/**
 * 跨语言集合类型映射
 * Cross-language collection type mappings
 */

/**
 * 数组类型 - 有序集合
 * Array type - ordered collection
 * - JavaScript: Array<T>
 * - Go: []T
 * - Java: List<T>
 * - Rust: Vec<T>
 * - C#: List<T>
 * - Python: List[T]
 */
export type SkerArray<T> = T[];

/**
 * 映射类型 - 键值对集合
 * Map type - key-value pair collection
 * - JavaScript: Map<K, V>
 * - Go: map[K]V
 * - Java: Map<K, V>
 * - Rust: HashMap<K, V>
 * - C#: Dictionary<K, V>
 * - Python: Dict[K, V]
 */
export type SkerMap<K, V> = Map<K, V>;

/**
 * 集合类型 - 唯一值集合
 * Set type - unique value collection
 * - JavaScript: Set<T>
 * - Go: map[T]struct{}
 * - Java: Set<T>
 * - Rust: HashSet<T>
 * - C#: HashSet<T>
 * - Python: Set[T]
 */
export type SkerSet<T> = Set<T>;

/**
 * 可选类型 - 可能为空的值
 * Optional type - value that might be null/undefined
 * - JavaScript: T | null | undefined
 * - Go: *T
 * - Java: Optional<T>
 * - Rust: Option<T>
 * - C#: T?
 * - Python: Optional[T]
 */
export type SkerOptional<T> = T | null | undefined;

/**
 * 元组类型 - 固定长度和类型的数组
 * Tuple type - fixed-length array with specific types
 */
export type SkerTuple<T extends readonly unknown[]> = T;

/**
 * 记录类型 - 键值对对象
 * Record type - key-value object
 */
export type SkerRecord<K extends string | number | symbol, V> = Record<K, V>;

/**
 * 集合类型工具函数
 * Collection type utility functions
 */
export const CollectionTypes = {
  /**
   * 创建数组
   * Create array
   */
  createArray<T>(items?: T[]): SkerArray<T> {
    return items || [];
  },

  /**
   * 验证数组
   * Validate array
   */
  isArray<T>(value: unknown): value is SkerArray<T> {
    return Array.isArray(value);
  },

  /**
   * 数组转换为普通对象（用于序列化）
   * Convert array to plain object (for serialization)
   */
  arrayToObject<T>(array: SkerArray<T>): Record<string, T> {
    const obj: Record<string, T> = {};
    array.forEach((item, index) => {
      obj[index.toString()] = item;
    });
    return obj;
  },

  /**
   * 从普通对象恢复数组
   * Restore array from plain object
   */
  arrayFromObject<T>(obj: Record<string, T>): SkerArray<T> {
    const keys = Object.keys(obj).map(Number).sort((a, b) => a - b);
    return keys.map(key => obj[key.toString()]).filter((item): item is T => item !== undefined);
  },

  /**
   * 创建映射
   * Create map
   */
  createMap<K, V>(entries?: [K, V][]): SkerMap<K, V> {
    return new Map(entries);
  },

  /**
   * 验证映射
   * Validate map
   */
  isMap<K, V>(value: unknown): value is SkerMap<K, V> {
    return value instanceof Map;
  },

  /**
   * 映射转换为普通对象（用于序列化）
   * Convert map to plain object (for serialization)
   */
  mapToObject<K extends string, V>(map: SkerMap<K, V>): Record<K, V> {
    const obj: Record<K, V> = {} as Record<K, V>;
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  },

  /**
   * 从普通对象恢复映射
   * Restore map from plain object
   */
  mapFromObject<K extends string, V>(obj: Record<K, V>): SkerMap<K, V> {
    return new Map(Object.entries(obj) as [K, V][]);
  },

  /**
   * 映射转换为数组（用于序列化复杂键类型）
   * Convert map to array (for serializing complex key types)
   */
  mapToArray<K, V>(map: SkerMap<K, V>): Array<[K, V]> {
    return Array.from(map.entries());
  },

  /**
   * 从数组恢复映射
   * Restore map from array
   */
  mapFromArray<K, V>(array: Array<[K, V]>): SkerMap<K, V> {
    return new Map(array);
  },

  /**
   * 创建集合
   * Create set
   */
  createSet<T>(items?: T[]): SkerSet<T> {
    return new Set(items);
  },

  /**
   * 验证集合
   * Validate set
   */
  isSet<T>(value: unknown): value is SkerSet<T> {
    return value instanceof Set;
  },

  /**
   * 集合转换为数组（用于序列化）
   * Convert set to array (for serialization)
   */
  setToArray<T>(set: SkerSet<T>): SkerArray<T> {
    return Array.from(set);
  },

  /**
   * 从数组恢复集合
   * Restore set from array
   */
  setFromArray<T>(array: SkerArray<T>): SkerSet<T> {
    return new Set(array);
  },

  /**
   * 验证可选值
   * Validate optional value
   */
  isSome<T>(value: SkerOptional<T>): value is T {
    return value !== null && value !== undefined;
  },

  /**
   * 验证空值
   * Validate null value
   */
  isNone<T>(value: SkerOptional<T>): value is null | undefined {
    return value === null || value === undefined;
  },

  /**
   * 获取可选值或默认值
   * Get optional value or default
   */
  getOrDefault<T>(value: SkerOptional<T>, defaultValue: T): T {
    return this.isSome(value) ? value : defaultValue;
  },

  /**
   * 创建元组
   * Create tuple
   */
  createTuple<T extends readonly unknown[]>(...items: T): SkerTuple<T> {
    return items;
  },

  /**
   * 验证元组
   * Validate tuple
   */
  isTuple(value: unknown): value is SkerTuple<readonly unknown[]> {
    return Array.isArray(value);
  },

  /**
   * 创建记录
   * Create record
   */
  createRecord<K extends string | number | symbol, V>(obj?: Record<K, V>): SkerRecord<K, V> {
    return obj || {} as SkerRecord<K, V>;
  },

  /**
   * 验证记录
   * Validate record
   */
  isRecord<K extends string | number | symbol, V>(value: unknown): value is SkerRecord<K, V> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  },

  /**
   * 深度克隆集合
   * Deep clone collection
   */
  deepClone<T>(value: T): T {
    if (value === null || typeof value !== 'object') {
      return value;
    }

    if (value instanceof Date) {
      return new Date(value.getTime()) as T;
    }

    if (value instanceof Array) {
      return value.map(item => this.deepClone(item)) as T;
    }

    if (value instanceof Set) {
      return new Set(Array.from(value).map(item => this.deepClone(item))) as T;
    }

    if (value instanceof Map) {
      return new Map(Array.from(value.entries()).map(([k, v]) => [this.deepClone(k), this.deepClone(v)])) as T;
    }

    if (typeof value === 'object') {
      const cloned = {} as T;
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          (cloned as any)[key] = this.deepClone((value as any)[key]);
        }
      }
      return cloned;
    }

    return value;
  },

  /**
   * 检查集合是否为空
   * Check if collection is empty
   */
  isEmpty(value: unknown): boolean {
    if (value === null || value === undefined) {
      return true;
    }
    
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    
    if (value instanceof Set || value instanceof Map) {
      return value.size === 0;
    }
    
    if (typeof value === 'object') {
      return Object.keys(value).length === 0;
    }
    
    if (typeof value === 'string') {
      return value.length === 0;
    }
    
    return false;
  }
};