// String utilities
export {
  camelCase,
  snakeCase,
  kebabCase,
  truncate,
  maskString,
  isValidEmail,
  isValidUrl,
  capitalize,
  pascalCase,
  escapeHtml,
  unescapeHtml
} from './string.js';

// Object utilities
export {
  deepClone,
  deepMerge,
  getPath,
  setPath,
  omit,
  pick,
  isEmpty,
  isEqual
} from './object.js';

// Array utilities
export {
  chunk,
  flatten,
  uniq,
  uniqBy,
  groupBy,
  sortBy,
  partition,
  sample,
  sampleSize,
  shuffle,
  zip,
  zipWith,
  intersection,
  difference,
  union
} from './array.js';

// Async utilities
export {
  delay,
  timeout,
  retry,
  debounce,
  throttle,
  promiseAll,
  promiseAllSettled,
  race,
  safeAsync,
  AsyncQueue,
  type RetryOptions,
  type PromiseAllOptions,
  type SettledResult
} from './async.js';

// Validation utilities
export {
  isValidUUID,
  isValidJSON,
  isValidDate,
  isValidPhoneNumber,
  validateSchema,
  sanitizeInput,
  sanitizeSQL,
  isValidCreditCard,
  isValidIPAddress,
  type SchemaField,
  type ValidationResult
} from './validation.js';

// Crypto utilities
export {
  generateUUID,
  generateNonce,
  hashString,
  encodeBase64,
  decodeBase64,
  encodeUrl,
  decodeUrl,
  generateSecurePassword,
  generateSalt,
  pbkdf2
} from './crypto.js';

// Time utilities
export {
  formatDate,
  parseDate,
  addTime,
  subtractTime,
  diffTime,
  isExpired,
  getTimezone,
  convertTimezone,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isLeapYear,
  getDaysInMonth,
  getWeekOfYear,
  formatRelativeTime,
  type TimeUnit,
  type TimeDiff
} from './time.js';

// Environment detection utilities
export {
  isBrowser,
  isNode,
  isDeno,
  isWebWorker,
  isWindows,
  isMac,
  isLinux,
  isIOS,
  isAndroid,
  isMobile,
  isTablet,
  isDesktop,
  getEnvironment,
  getPlatform,
  getBrowserInfo,
  getNodeVersion,
  getV8Version,
  supportsWebGL,
  supportsWebGL2,
  supportsWorkers,
  supportsServiceWorker,
  supportsLocalStorage,
  supportsSessionStorage,
  type Environment,
  type Platform
} from './environment.js';

// Cache utilities
export {
  LRUCache,
  memoize,
  memoizeAsync,
  type CacheOptions,
  type CacheEntry
} from './cache.js';

// Error handling utilities
export {
  CustomError,
  createError,
  wrapError,
  isErrorType,
  ErrorHandler,
  safeSync,
  ErrorCollector,
  AggregateError,
  type ErrorContext,
  type ErrorHandlerOptions
} from './error.js';

// Batch processing utilities
export {
  batchProcess,
  Batcher,
  processInChunks,
  type BatchOptions,
  type BatcherOptions,
  type ChunkProcessorOptions
} from './batch.js';

// Memory utilities
export {
  ObjectPool,
  createObjectPool,
  createMemoryPool,
  trackMemoryUsage,
  MemoryMonitor,
  formatBytes,
  gc,
  forceGC,
  type ObjectPoolOptions,
  type MemoryTracker,
  type MemoryUsage
} from './memory.js';

// Type guards
export {
  isString,
  isNumber,
  isBoolean,
  isFunction,
  isObject,
  isPlainObject,
  isArray,
  isDate,
  isRegExp,
  isError,
  isPromise,
  isNull,
  isUndefined,
  isNil,
  isDefined,
  isArrayOf,
  isObjectWith,
  isOneOf,
  hasProperty,
  hasProperties,
  isInstanceOf,
  isStringArray,
  isNumberArray,
  isBooleanArray,
  isEmptyString,
  isNonEmptyString,
  isPositiveNumber,
  isNonNegativeNumber,
  isInteger,
  isPositiveInteger,
  isArrayLike,
  isIterable,
  isAsyncIterable,
  isMap,
  isSet,
  isWeakMap,
  isWeakSet,
  isArrayBuffer,
  isTypedArray,
  isPrimitive,
  isSerializable,
  assertIsString,
  assertIsNumber,
  assertIsObject,
  assertIsDefined,
  createGuard,
  combineGuards,
  type Primitive,
  type TypeGuard
} from './types.js';

// Configuration utilities
export {
  configureUtils,
  getConfig,
  getConfigValue,
  resetConfig,
  ConfigManager,
  createConfigManager,
  Configuration,
  type UtilsConfig,
  type ConfigurationOptions
} from './config.js';

// Advanced utility chains (implementation for createUtilChain from README)
export interface UtilChain {
  use<T>(middleware: (data: T) => T | Promise<T>): UtilChain;
  execute<T>(data: T): Promise<T>;
}

export function createUtilChain(): UtilChain {
  const middlewares: Array<(data: any) => any | Promise<any>> = [];

  return {
    use<T>(middleware: (data: T) => T | Promise<T>): UtilChain {
      middlewares.push(middleware);
      return this;
    },

    async execute<T>(data: T): Promise<T> {
      let result = data;
      for (const middleware of middlewares) {
        result = await middleware(result);
      }
      return result;
    }
  };
}