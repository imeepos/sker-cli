export { SkerCore } from './core/index.js';

export { EventBus } from './events/index.js';

export { ConfigManager } from './config/index.js';

export {
  LifecycleManager,
  LifecycleState
} from './lifecycle/index.js';

export { PluginManager } from './plugins/index.js';

export { MiddlewareManager } from './middleware/index.js';

export {
  Context,
  withContext,
  withCurrentContext,
  getCurrentContext,
  ensureContext
} from './context/index.js';

export {
  SkerError,
  ErrorCodes,
  createError,
  isError,
  isSkerError,
  wrapError
} from './errors/index.js';

// Re-export logger functionality from @sker/logger
export {
  Logger,
  CoreLogger,
  TracingLogger,
  PerformanceLogger,
  LogLevel,
  LogFormat,
  createLogger,
  createDevelopmentLogger,
  createTestLogger,
  createStructuredLogger
} from '@sker/logger';

export type {
  LogEntry,
  LoggerConfig,
  ServiceInfo,
  LogContext,
  LogMetadata,
  TraceContext,
  Span,
  TracingConfig,
  PerformanceConfig,
  OutputConfig,
  OutputAdapter,
  BatchOutputAdapter,
  LogFilter,
  ContextProvider,
  MetricValue,
  PerformanceMetrics,
  MonitoringDecorator,
  ErrorReportingConfig,
  LoggerMiddlewareConfig,
  CoreLoggerOptions,
  StructuredLogData,
  LogProcessor,
  TracingProcessor,
  PerformanceProcessor,
  SecurityProcessor,
  EnhancedOutputConfig
} from '@sker/logger';

// Re-export utility functions from @sker/utils
export {
  // String utilities
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
  unescapeHtml,
  // Object utilities
  deepClone,
  deepMerge,
  getPath,
  setPath,
  omit,
  pick,
  isEmpty,
  isEqual,
  // Array utilities
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
  union,
  // Async utilities
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
  // Validation utilities
  isValidUUID,
  isValidJSON,
  isValidDate,
  isValidPhoneNumber,
  validateSchema,
  sanitizeInput,
  sanitizeSQL,
  isValidCreditCard,
  isValidIPAddress,
  // Crypto utilities
  generateUUID,
  generateNonce,
  hashString,
  encodeBase64,
  decodeBase64,
  encodeUrl,
  decodeUrl,
  generateSecurePassword,
  generateSalt,
  pbkdf2,
  // Time utilities
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
  formatRelativeTime
} from '@sker/utils';

export type {
  RetryOptions,
  PromiseAllOptions,
  SettledResult,
  SchemaField,
  ValidationResult,
  TimeUnit,
  TimeDiff
} from '@sker/utils';

export type {
  CoreOptions,
  PluginConfig,
  ConfigOptions,
  ConfigSource,
  LifecycleOptions,
  LifecycleHook,
  Plugin,
  PluginContext,
  MiddlewareContext,
  MiddlewareHandler,
  ContextData,
  AsyncHandler,
  SyncHandler,
  EventHandler,
  StringToken
} from './types/index.js';

export {
  ERROR,
  MEMORY_USAGE,
  MEMORY_THRESHOLD_EXCEEDED,
  LIFECYCLE_ERROR,
  CONFIG_CHANGE,
  CONFIG_RESET,
  LIFECYCLE_STARTING,
  LIFECYCLE_STARTED,
  LIFECYCLE_STOPPING,
  LIFECYCLE_STOPPED,
  LIFECYCLE_STATE_CHANGED,
  LIFECYCLE_HOOK_EXECUTING,
  LIFECYCLE_HOOK_EXECUTED,
  LIFECYCLE_HOOK_ERROR,
  MIDDLEWARE_ADDED,
  MIDDLEWARE_REMOVED,
  MIDDLEWARE_ENABLED,
  MIDDLEWARE_DISABLED,
  MIDDLEWARES_CLEARED,
  MIDDLEWARE_EXECUTING,
  MIDDLEWARE_EXECUTED,
  MIDDLEWARE_ERROR,
  MIDDLEWARE_CHAIN_COMPLETED,
  MIDDLEWARE_CHAIN_FAILED,
  MIDDLEWARE_TIMEOUT,
  MIDDLEWARE_INSERTED,
  PLUGIN_REGISTERED,
  PLUGIN_UNREGISTERED,
  PLUGIN_SKIPPED,
  PLUGIN_INITIALIZING,
  PLUGIN_INITIALIZED,
  PLUGIN_ERROR,
  PLUGIN_DESTROYING,
  PLUGIN_DESTROYED,
  PLUGIN_ENABLED,
  PLUGIN_DISABLED,
  PLUGIN_CONFIG_UPDATED,
  CORE_INITIALIZED,
  CORE_STARTING,
  CORE_STARTED,
  CORE_START_FAILED,
  CORE_STOPPING,
  CORE_STOPPED,
  CORE_STOP_FAILED,
  CORE_RESTARTING,
  CORE_RESTARTED,
  CORE_RESTART_FAILED,
  CORE_PLUGIN_ERROR,
  CORE_MIDDLEWARE_ERROR,
  CORE_CONFIG_CHANGE
} from './types/index.js'