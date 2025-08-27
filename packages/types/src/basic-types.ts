/**
 * 跨语言基础类型映射
 * Cross-language basic type mappings
 */

/**
 * 布尔类型 - 映射到各语言的布尔类型
 * Boolean type - maps to boolean types in different languages
 * - JavaScript: boolean
 * - Go: bool
 * - Java: boolean
 * - Rust: bool
 * - C#: bool
 * - Python: bool
 */
export type SkerBoolean = boolean;

/**
 * 整数类型 - 统一使用64位整数
 * Integer type - unified 64-bit integer
 * - JavaScript: number (IEEE 754 double precision)
 * - Go: int64
 * - Java: Long
 * - Rust: i64
 * - C#: long
 * - Python: int
 */
export type SkerInteger = number;

/**
 * 浮点数类型 - 统一使用双精度浮点数
 * Float type - unified double precision floating point
 * - JavaScript: number
 * - Go: float64
 * - Java: Double
 * - Rust: f64
 * - C#: double
 * - Python: float
 */
export type SkerFloat = number;

/**
 * 字符串类型 - UTF-8编码字符串
 * String type - UTF-8 encoded string
 * - JavaScript: string
 * - Go: string
 * - Java: String
 * - Rust: String
 * - C#: string
 * - Python: str
 */
export type SkerString = string;

/**
 * 时间戳类型 - ISO8601格式时间戳
 * Timestamp type - ISO8601 formatted timestamp
 * - JavaScript: Date
 * - Go: time.Time
 * - Java: Instant
 * - Rust: DateTime<Utc>
 * - C#: DateTime
 * - Python: datetime
 */
export type SkerTimestamp = Date;

/**
 * 高精度数值类型 - 用于货币计算等需要精确计算的场景
 * High precision decimal type - for monetary calculations and precise arithmetic
 * 在不同语言中以字符串形式传输，本地转换为对应的高精度数值类型
 * Transmitted as string across languages, converted to appropriate high-precision types locally
 * - JavaScript: string (can be converted to BigNumber/Decimal.js)
 * - Go: decimal.Decimal (shopspring/decimal)
 * - Java: BigDecimal
 * - Rust: rust_decimal::Decimal
 * - C#: decimal
 * - Python: decimal.Decimal
 */
export type SkerDecimal = string;

/**
 * 类型品牌标记 - 用于创建名义类型
 * Type branding - for creating nominal types
 */
export type Brand<T, K> = T & { readonly __brand: K };

/**
 * UUID类型 - 标准UUID字符串
 * UUID type - standard UUID string
 */
export type UUID = Brand<string, 'UUID'>;

/**
 * 货币金额类型 - 使用高精度数值
 * Money amount type - using high precision decimal
 */
export type MoneyAmount = Brand<SkerDecimal, 'MoneyAmount'>;

/**
 * URL类型 - 有效的URL字符串
 * URL type - valid URL string
 */
export type URL = Brand<string, 'URL'>;

/**
 * Email类型 - 有效的邮箱地址字符串
 * Email type - valid email address string
 */
export type Email = Brand<string, 'Email'>;

/**
 * 基础类型工具函数
 * Basic type utility functions
 */
export const BasicTypes = {
  /**
   * 创建UUID
   * Create UUID
   */
  createUUID(): UUID {
    return crypto.randomUUID() as UUID;
  },

  /**
   * 验证UUID格式
   * Validate UUID format
   */
  isValidUUID(value: string): value is UUID {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },

  /**
   * 创建货币金额
   * Create money amount
   */
  createMoneyAmount(value: string | number): MoneyAmount {
    return String(value) as MoneyAmount;
  },

  /**
   * 验证货币金额格式
   * Validate money amount format
   */
  isValidMoneyAmount(value: string): value is MoneyAmount {
    const decimalRegex = /^-?\d+(\.\d+)?$/;
    return decimalRegex.test(value);
  },

  /**
   * 验证URL格式
   * Validate URL format
   */
  isValidURL(value: string): value is URL {
    try {
      new globalThis.URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 验证邮箱格式
   * Validate email format
   */
  isValidEmail(value: string): value is Email {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },

  /**
   * 创建ISO8601时间戳
   * Create ISO8601 timestamp
   */
  createTimestamp(date?: Date): SkerTimestamp {
    return date || new Date();
  },

  /**
   * 验证时间戳格式
   * Validate timestamp format
   */
  isValidTimestamp(value: unknown): value is SkerTimestamp {
    return value instanceof Date && !isNaN(value.getTime());
  },

  /**
   * 将时间戳转换为ISO8601字符串
   * Convert timestamp to ISO8601 string
   */
  timestampToISO8601(timestamp: SkerTimestamp): string {
    return timestamp.toISOString();
  },

  /**
   * 从ISO8601字符串创建时间戳
   * Create timestamp from ISO8601 string
   */
  timestampFromISO8601(iso8601: string): SkerTimestamp {
    return new Date(iso8601);
  }
};