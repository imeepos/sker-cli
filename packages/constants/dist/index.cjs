"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AUTH_TYPES: () => AUTH_TYPES,
  BUSINESS_ERROR_CODES: () => BUSINESS_ERROR_CODES,
  CONFIG_CHANGE: () => CONFIG_CHANGE,
  CONFIG_PRIORITIES: () => CONFIG_PRIORITIES,
  CONFIG_RESET: () => CONFIG_RESET,
  CONFIG_SOURCES: () => CONFIG_SOURCES,
  CONTENT_TYPES: () => CONTENT_TYPES,
  CORE_CONFIG_CHANGE: () => CORE_CONFIG_CHANGE,
  CORE_ERROR_CODES: () => CORE_ERROR_CODES,
  CORE_INITIALIZED: () => CORE_INITIALIZED,
  CORE_MIDDLEWARE_ERROR: () => CORE_MIDDLEWARE_ERROR,
  CORE_PLUGIN_ERROR: () => CORE_PLUGIN_ERROR,
  CORE_RESTARTED: () => CORE_RESTARTED,
  CORE_RESTARTING: () => CORE_RESTARTING,
  CORE_RESTART_FAILED: () => CORE_RESTART_FAILED,
  CORE_STARTED: () => CORE_STARTED,
  CORE_STARTING: () => CORE_STARTING,
  CORE_START_FAILED: () => CORE_START_FAILED,
  CORE_STOPPED: () => CORE_STOPPED,
  CORE_STOPPING: () => CORE_STOPPING,
  CORE_STOP_FAILED: () => CORE_STOP_FAILED,
  CRYPTO_ALGORITHMS: () => CRYPTO_ALGORITHMS,
  DEFAULT_LIMITS: () => DEFAULT_LIMITS,
  DEFAULT_PORTS: () => DEFAULT_PORTS,
  DEFAULT_TIMEOUTS: () => DEFAULT_TIMEOUTS,
  ENVIRONMENTS: () => ENVIRONMENTS,
  ERROR: () => ERROR,
  HEALTH_CHECK_CONFIG: () => HEALTH_CHECK_CONFIG,
  HTTP_METHODS: () => HTTP_METHODS,
  INTEGRATION_ERROR_CODES: () => INTEGRATION_ERROR_CODES,
  JWT_ALGORITHMS: () => JWT_ALGORITHMS,
  JWT_CLAIMS: () => JWT_CLAIMS,
  LIFECYCLE_ERROR: () => LIFECYCLE_ERROR,
  LIFECYCLE_HOOK_ERROR: () => LIFECYCLE_HOOK_ERROR,
  LIFECYCLE_HOOK_EXECUTED: () => LIFECYCLE_HOOK_EXECUTED,
  LIFECYCLE_HOOK_EXECUTING: () => LIFECYCLE_HOOK_EXECUTING,
  LIFECYCLE_STARTED: () => LIFECYCLE_STARTED,
  LIFECYCLE_STARTING: () => LIFECYCLE_STARTING,
  LIFECYCLE_STATE_CHANGED: () => LIFECYCLE_STATE_CHANGED,
  LIFECYCLE_STOPPED: () => LIFECYCLE_STOPPED,
  LIFECYCLE_STOPPING: () => LIFECYCLE_STOPPING,
  LOAD_BALANCE_STRATEGIES: () => LOAD_BALANCE_STRATEGIES,
  LOG_FIELDS: () => LOG_FIELDS,
  LOG_LEVELS: () => LOG_LEVELS,
  MEMORY_THRESHOLD_EXCEEDED: () => MEMORY_THRESHOLD_EXCEEDED,
  MEMORY_USAGE: () => MEMORY_USAGE,
  MESSAGE_TYPES: () => MESSAGE_TYPES,
  METRIC_LABELS: () => METRIC_LABELS,
  METRIC_TYPES: () => METRIC_TYPES,
  MIDDLEWARES_CLEARED: () => MIDDLEWARES_CLEARED,
  MIDDLEWARE_ADDED: () => MIDDLEWARE_ADDED,
  MIDDLEWARE_CHAIN_COMPLETED: () => MIDDLEWARE_CHAIN_COMPLETED,
  MIDDLEWARE_CHAIN_FAILED: () => MIDDLEWARE_CHAIN_FAILED,
  MIDDLEWARE_DISABLED: () => MIDDLEWARE_DISABLED,
  MIDDLEWARE_ENABLED: () => MIDDLEWARE_ENABLED,
  MIDDLEWARE_ERROR: () => MIDDLEWARE_ERROR,
  MIDDLEWARE_EXECUTED: () => MIDDLEWARE_EXECUTED,
  MIDDLEWARE_EXECUTING: () => MIDDLEWARE_EXECUTING,
  MIDDLEWARE_INSERTED: () => MIDDLEWARE_INSERTED,
  MIDDLEWARE_REMOVED: () => MIDDLEWARE_REMOVED,
  MIDDLEWARE_TIMEOUT: () => MIDDLEWARE_TIMEOUT,
  PERMISSION_LEVELS: () => PERMISSION_LEVELS,
  PLUGIN_CONFIG_UPDATED: () => PLUGIN_CONFIG_UPDATED,
  PLUGIN_DESTROYED: () => PLUGIN_DESTROYED,
  PLUGIN_DESTROYING: () => PLUGIN_DESTROYING,
  PLUGIN_DISABLED: () => PLUGIN_DISABLED,
  PLUGIN_ENABLED: () => PLUGIN_ENABLED,
  PLUGIN_ERROR: () => PLUGIN_ERROR,
  PLUGIN_INITIALIZED: () => PLUGIN_INITIALIZED,
  PLUGIN_INITIALIZING: () => PLUGIN_INITIALIZING,
  PLUGIN_REGISTERED: () => PLUGIN_REGISTERED,
  PLUGIN_SKIPPED: () => PLUGIN_SKIPPED,
  PLUGIN_UNREGISTERED: () => PLUGIN_UNREGISTERED,
  PROTOCOL_TYPES: () => PROTOCOL_TYPES,
  RETRY_STRATEGIES: () => RETRY_STRATEGIES,
  SECURITY_ERROR_CODES: () => SECURITY_ERROR_CODES,
  SERVICE_STATUS: () => SERVICE_STATUS,
  SYSTEM_ERROR_CODES: () => SYSTEM_ERROR_CODES,
  TIME_UNITS: () => TIME_UNITS,
  TOKEN_TYPES: () => TOKEN_TYPES,
  TRACE_HEADERS: () => TRACE_HEADERS,
  buildUrl: () => buildUrl,
  createErrorResponse: () => createErrorResponse,
  deepMerge: () => deepMerge,
  delay: () => delay,
  formatErrorCode: () => formatErrorCode,
  formatTimestamp: () => formatTimestamp,
  generateTraceId: () => generateTraceId,
  generateUUID: () => generateUUID,
  getCurrentTimestamp: () => getCurrentTimestamp,
  getErrorCategory: () => getErrorCategory,
  isValidErrorCode: () => isValidErrorCode,
  isValidHttpMethod: () => isValidHttpMethod,
  isValidProtocol: () => isValidProtocol,
  logLevelToNumber: () => logLevelToNumber,
  numberToLogLevel: () => numberToLogLevel,
  numberToStatus: () => numberToStatus,
  protocolToString: () => protocolToString,
  retry: () => retry,
  statusToNumber: () => statusToNumber,
  stringToProtocol: () => stringToProtocol
});
module.exports = __toCommonJS(index_exports);

// src/protocol.ts
var PROTOCOL_TYPES = {
  UNKNOWN: "unknown",
  HTTP: "http",
  HTTPS: "https",
  GRPC: "grpc",
  WEBSOCKET: "websocket",
  TCP: "tcp",
  UDP: "udp"
};
var HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD"
};
var MESSAGE_TYPES = {
  REQUEST: "request",
  RESPONSE: "response",
  EVENT: "event",
  COMMAND: "command",
  NOTIFICATION: "notification"
};
var CONTENT_TYPES = {
  JSON: "application/json",
  PROTOBUF: "application/protobuf",
  MSGPACK: "application/msgpack",
  XML: "application/xml",
  FORM_DATA: "multipart/form-data",
  FORM_URLENCODED: "application/x-www-form-urlencoded"
};

// src/errors.ts
var SYSTEM_ERROR_CODES = {
  // 通用系统错误 (100-xxx)
  UNKNOWN: "100000",
  INTERNAL_ERROR: "100001",
  SERVICE_UNAVAILABLE: "100002",
  SERVICE_TIMEOUT: "100003",
  RESOURCE_EXHAUSTED: "100004",
  CONFIGURATION_ERROR: "100005",
  INITIALIZATION_FAILED: "100006",
  START_FAILED: "100007",
  STOP_FAILED: "100008",
  // 网络错误 (101-xxx)
  NETWORK_CONNECTION_FAILED: "101001",
  NETWORK_TIMEOUT: "101002",
  NETWORK_INTERRUPTED: "101003",
  DNS_RESOLUTION_FAILED: "101004",
  // 数据错误 (102-xxx)
  SERIALIZATION_FAILED: "102001",
  DESERIALIZATION_FAILED: "102002",
  DATA_FORMAT_ERROR: "102003",
  DATA_SIZE_EXCEEDED: "102004"
};
var CORE_ERROR_CODES = {
  CONFIG_ERROR: "150001",
  PLUGIN_ERROR: "150002",
  CONTEXT_ERROR: "150003",
  MIDDLEWARE_ERROR: "150004",
  EVENT_ERROR: "150005"
};
var BUSINESS_ERROR_CODES = {
  // 通用业务错误 (200-xxx)
  BUSINESS_RULE_VIOLATION: "200001",
  BUSINESS_PROCESS_ERROR: "200002",
  BUSINESS_STATE_INVALID: "200003",
  BUSINESS_DATA_INCONSISTENT: "200004",
  // 用户相关错误 (201-xxx)
  USER_NOT_FOUND: "201001",
  USER_ALREADY_EXISTS: "201002",
  USER_STATE_INVALID: "201003",
  USER_PERMISSION_DENIED: "201004",
  // 订单相关错误 (202-xxx)
  ORDER_NOT_FOUND: "202001",
  ORDER_STATE_INVALID: "202002",
  ORDER_AMOUNT_INVALID: "202003",
  INSUFFICIENT_INVENTORY: "202004"
};
var INTEGRATION_ERROR_CODES = {
  // 外部服务错误 (300-xxx)
  EXTERNAL_SERVICE_UNAVAILABLE: "300001",
  EXTERNAL_SERVICE_RESPONSE_INVALID: "300002",
  API_VERSION_INCOMPATIBLE: "300003",
  DATA_MAPPING_FAILED: "300004",
  // 数据库错误 (301-xxx)
  DATABASE_CONNECTION_FAILED: "301001",
  QUERY_TIMEOUT: "301002",
  TRANSACTION_ROLLBACK: "301003",
  CONSTRAINT_VIOLATION: "301004"
};
var SECURITY_ERROR_CODES = {
  // 认证错误 (400-xxx)
  AUTHENTICATION_FAILED: "400001",
  AUTHORIZATION_FAILED: "400002",
  TOKEN_EXPIRED: "400003",
  SIGNATURE_VERIFICATION_FAILED: "400004",
  IP_RESTRICTED: "400005",
  RATE_LIMITED: "400006",
  // 数据安全错误 (401-xxx)
  SENSITIVE_DATA_ACCESS_DENIED: "401001",
  DATA_ENCRYPTION_FAILED: "401002",
  DATA_DECRYPTION_FAILED: "401003"
};
function createErrorResponse(error) {
  return {
    ...error,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}

// src/events.ts
var ERROR = "ERROR";
var MEMORY_USAGE = "MEMORY_USAGE";
var MEMORY_THRESHOLD_EXCEEDED = "memoryThresholdExceeded";
var LIFECYCLE_ERROR = "lifecycleError";
var LIFECYCLE_STARTING = "starting";
var LIFECYCLE_STARTED = "started";
var LIFECYCLE_STOPPING = "stopping";
var LIFECYCLE_STOPPED = "stopped";
var LIFECYCLE_STATE_CHANGED = "stateChanged";
var LIFECYCLE_HOOK_EXECUTING = "hookExecuting";
var LIFECYCLE_HOOK_EXECUTED = "hookExecuted";
var LIFECYCLE_HOOK_ERROR = "hookError";
var CONFIG_CHANGE = "change";
var CONFIG_RESET = "reset";
var MIDDLEWARE_ADDED = "middlewareAdded";
var MIDDLEWARE_REMOVED = "middlewareRemoved";
var MIDDLEWARE_ENABLED = "middlewareEnabled";
var MIDDLEWARE_DISABLED = "middlewareDisabled";
var MIDDLEWARES_CLEARED = "middlewaresCleared";
var MIDDLEWARE_EXECUTING = "middlewareExecuting";
var MIDDLEWARE_EXECUTED = "middlewareExecuted";
var MIDDLEWARE_ERROR = "middlewareError";
var MIDDLEWARE_CHAIN_COMPLETED = "middlewareChainCompleted";
var MIDDLEWARE_CHAIN_FAILED = "middlewareChainFailed";
var MIDDLEWARE_TIMEOUT = "middlewareTimeout";
var MIDDLEWARE_INSERTED = "middlewareInserted";
var PLUGIN_REGISTERED = "pluginRegistered";
var PLUGIN_UNREGISTERED = "pluginUnregistered";
var PLUGIN_SKIPPED = "pluginSkipped";
var PLUGIN_INITIALIZING = "pluginInitializing";
var PLUGIN_INITIALIZED = "pluginInitialized";
var PLUGIN_ERROR = "pluginError";
var PLUGIN_DESTROYING = "pluginDestroying";
var PLUGIN_DESTROYED = "pluginDestroyed";
var PLUGIN_ENABLED = "pluginEnabled";
var PLUGIN_DISABLED = "pluginDisabled";
var PLUGIN_CONFIG_UPDATED = "pluginConfigUpdated";
var CORE_INITIALIZED = "initialized";
var CORE_STARTING = "starting";
var CORE_STARTED = "started";
var CORE_START_FAILED = "startFailed";
var CORE_STOPPING = "stopping";
var CORE_STOPPED = "stopped";
var CORE_STOP_FAILED = "stopFailed";
var CORE_RESTARTING = "restarting";
var CORE_RESTARTED = "restarted";
var CORE_RESTART_FAILED = "restartFailed";
var CORE_PLUGIN_ERROR = "pluginError";
var CORE_MIDDLEWARE_ERROR = "middlewareError";
var CORE_CONFIG_CHANGE = "configChange";

// src/service.ts
var SERVICE_STATUS = {
  UNKNOWN: 0,
  HEALTHY: 1,
  UNHEALTHY: 2,
  MAINTENANCE: 3,
  STARTING: 4,
  STOPPING: 5
};
var LOAD_BALANCE_STRATEGIES = {
  ROUND_ROBIN: "round_robin",
  WEIGHTED_ROUND_ROBIN: "weighted_round_robin",
  LEAST_CONNECTIONS: "least_connections",
  RANDOM: "random",
  CONSISTENT_HASHING: "consistent_hashing",
  IP_HASH: "ip_hash"
};
var DEFAULT_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  GRPC: 50051,
  WEBSOCKET: 8080,
  WEBSOCKET_SECURE: 8443,
  REDIS: 6379,
  MYSQL: 3306,
  POSTGRESQL: 5432,
  MONGODB: 27017,
  ELASTICSEARCH: 9200
};
var HEALTH_CHECK_CONFIG = {
  DEFAULT_INTERVAL: 3e4,
  // 30秒
  DEFAULT_TIMEOUT: 1e4,
  // 10秒  
  DEFAULT_RETRIES: 3,
  // 3次重试
  DEFAULT_THRESHOLD: 3,
  // 连续3次失败才标记为不健康
  STARTUP_GRACE_PERIOD: 6e4
  // 启动宽限期60秒
};

// src/security.ts
var AUTH_TYPES = {
  API_KEY: "api_key",
  BEARER_TOKEN: "bearer",
  BASIC: "basic",
  OAUTH2: "oauth2",
  JWT: "jwt",
  MUTUAL_TLS: "mtls",
  DIGEST: "digest"
};
var TOKEN_TYPES = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  ID_TOKEN: "id_token",
  API_KEY: "api_key"
};
var PERMISSION_LEVELS = {
  READ: "read",
  WRITE: "write",
  DELETE: "delete",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin"
};
var CRYPTO_ALGORITHMS = {
  // 对称加密
  AES_128_GCM: "aes-128-gcm",
  AES_256_GCM: "aes-256-gcm",
  // 非对称加密
  RSA_2048: "rsa-2048",
  RSA_4096: "rsa-4096",
  ECDSA_P256: "ecdsa-p256",
  ECDSA_P384: "ecdsa-p384",
  // 哈希算法
  SHA256: "sha256",
  SHA512: "sha512",
  BCRYPT: "bcrypt",
  SCRYPT: "scrypt"
};
var JWT_CLAIMS = {
  ISSUER: "iss",
  // 颁发者
  SUBJECT: "sub",
  // 主题
  AUDIENCE: "aud",
  // 受众
  EXPIRATION: "exp",
  // 过期时间
  NOT_BEFORE: "nbf",
  // 不早于时间
  ISSUED_AT: "iat",
  // 颁发时间
  JWT_ID: "jti",
  // JWT ID
  // 自定义声明
  ROLES: "roles",
  // 角色
  PERMISSIONS: "permissions",
  // 权限
  TENANT_ID: "tenant_id",
  // 租户ID
  USER_ID: "user_id",
  // 用户ID
  CLIENT_ID: "client_id"
  // 客户端ID
};
var JWT_ALGORITHMS = {
  HS256: "HS256",
  // HMAC SHA256
  HS384: "HS384",
  // HMAC SHA384  
  HS512: "HS512",
  // HMAC SHA512
  RS256: "RS256",
  // RSA SHA256
  RS384: "RS384",
  // RSA SHA384
  RS512: "RS512",
  // RSA SHA512
  ES256: "ES256",
  // ECDSA SHA256
  ES384: "ES384",
  // ECDSA SHA384
  ES512: "ES512"
  // ECDSA SHA512
};

// src/monitoring.ts
var LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
};
var METRIC_TYPES = {
  COUNTER: "counter",
  // 计数器
  GAUGE: "gauge",
  // 仪表盘
  HISTOGRAM: "histogram",
  // 直方图
  SUMMARY: "summary",
  // 摘要
  TIMER: "timer"
  // 计时器
};
var TRACE_HEADERS = {
  TRACE_ID: "x-trace-id",
  SPAN_ID: "x-span-id",
  PARENT_SPAN_ID: "x-parent-span-id",
  TRACE_FLAGS: "x-trace-flags",
  BAGGAGE: "baggage"
};
var LOG_FIELDS = {
  TIMESTAMP: "timestamp",
  LEVEL: "level",
  MESSAGE: "message",
  SERVICE: "service",
  VERSION: "version",
  TRACE_ID: "trace_id",
  SPAN_ID: "span_id",
  USER_ID: "user_id",
  REQUEST_ID: "request_id",
  ERROR: "error",
  DURATION: "duration",
  HTTP_METHOD: "http_method",
  HTTP_STATUS: "http_status",
  HTTP_PATH: "http_path"
};
var METRIC_LABELS = {
  SERVICE_NAME: "service_name",
  VERSION: "version",
  ENVIRONMENT: "environment",
  METHOD: "method",
  STATUS: "status",
  ENDPOINT: "endpoint",
  ERROR_TYPE: "error_type"
};

// src/time.ts
var DEFAULT_TIMEOUTS = {
  CONNECTION: 5e3,
  // 连接超时5秒
  REQUEST: 3e4,
  // 请求超时30秒
  READ: 6e4,
  // 读取超时60秒
  WRITE: 1e4,
  // 写入超时10秒
  IDLE: 3e5,
  // 空闲超时5分钟
  HEALTH_CHECK: 1e4
  // 健康检查超时10秒
};
var RETRY_STRATEGIES = {
  FIXED_DELAY: "fixed_delay",
  EXPONENTIAL_BACKOFF: "exponential_backoff",
  LINEAR_BACKOFF: "linear_backoff",
  RANDOM_JITTER: "random_jitter"
};
var TIME_UNITS = {
  MILLISECOND: 1,
  SECOND: 1e3,
  MINUTE: 6e4,
  HOUR: 36e5,
  DAY: 864e5,
  WEEK: 6048e5
};

// src/config.ts
var ENVIRONMENTS = {
  DEVELOPMENT: "development",
  TESTING: "testing",
  STAGING: "staging",
  PRODUCTION: "production"
};
var CONFIG_SOURCES = {
  ENVIRONMENT: "env",
  FILE: "file",
  REMOTE: "remote",
  DATABASE: "database",
  CONSUL: "consul",
  ETCD: "etcd"
};
var DEFAULT_LIMITS = {
  MAX_REQUEST_SIZE: 10485760,
  // 10MB
  MAX_RESPONSE_SIZE: 10485760,
  // 10MB
  MAX_CONNECTIONS: 1e3,
  // 最大连接数
  MAX_CONCURRENT_REQUESTS: 100,
  // 最大并发请求
  RATE_LIMIT_PER_MINUTE: 1e3,
  // 每分钟限制数
  MAX_RETRY_ATTEMPTS: 3,
  // 最大重试次数
  MAX_BATCH_SIZE: 100
  // 最大批处理大小
};
var CONFIG_PRIORITIES = {
  COMMAND_LINE: 0,
  // 最高优先级
  ENVIRONMENT: 1,
  FILE: 2,
  REMOTE: 3,
  DEFAULT: 4
  // 最低优先级
};

// src/utils.ts
function isValidProtocol(protocol) {
  return Object.values(PROTOCOL_TYPES).includes(protocol);
}
function isValidHttpMethod(method) {
  return Object.values(HTTP_METHODS).includes(method);
}
function isValidErrorCode(code) {
  return Object.values(SYSTEM_ERROR_CODES).includes(code) || Object.values(BUSINESS_ERROR_CODES).includes(code) || Object.values(INTEGRATION_ERROR_CODES).includes(code) || Object.values(SECURITY_ERROR_CODES).includes(code);
}
function getErrorCategory(code) {
  if (code.startsWith("1")) return "system";
  if (code.startsWith("2")) return "business";
  if (code.startsWith("3")) return "integration";
  if (code.startsWith("4")) return "security";
  return "unknown";
}
function formatErrorCode(options) {
  const categoryPrefix = {
    system: "1",
    business: "2",
    integration: "3",
    security: "4"
  }[options.category];
  const subcategoryMap = {
    // System subcategories
    general: "00",
    network: "01",
    data: "02",
    // Business subcategories  
    common: "00",
    user: "01",
    order: "02",
    // Integration subcategories
    external: "00",
    database: "01",
    // Security subcategories
    auth: "00",
    data_security: "01"
  };
  const subcategoryCode = subcategoryMap[options.subcategory] || "99";
  return `${categoryPrefix}${subcategoryCode}${options.error.padStart(3, "0")}`;
}
function protocolToString(protocol) {
  return protocol;
}
function stringToProtocol(protocol) {
  return isValidProtocol(protocol) ? protocol : null;
}
function statusToNumber(status) {
  return status;
}
function numberToStatus(num) {
  return Object.values(SERVICE_STATUS).includes(num) ? num : null;
}
function logLevelToNumber(level) {
  const levelUpper = level.toUpperCase();
  return LOG_LEVELS[levelUpper] ?? null;
}
function numberToLogLevel(num) {
  const entry = Object.entries(LOG_LEVELS).find(([_, value]) => value === num);
  return entry ? entry[0] : null;
}
function buildUrl(options) {
  let url = `${options.protocol}://${options.host}`;
  if (options.port) {
    url += `:${options.port}`;
  }
  if (options.path) {
    if (!options.path.startsWith("/")) {
      url += "/";
    }
    url += options.path;
  }
  if (options.query && Object.keys(options.query).length > 0) {
    const queryString = new URLSearchParams(options.query).toString();
    url += `?${queryString}`;
  }
  return url;
}
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = result[key];
      if (typeof sourceValue === "object" && sourceValue !== null && !Array.isArray(sourceValue) && typeof targetValue === "object" && targetValue !== null && !Array.isArray(targetValue)) {
        result[key] = deepMerge(targetValue, sourceValue);
      } else {
        result[key] = sourceValue;
      }
    }
  }
  return result;
}
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retry(fn, maxAttempts = 3, delayMs = 1e3) {
  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) {
        throw lastError;
      }
      await delay(delayMs * attempt);
    }
  }
  throw lastError;
}
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === "x" ? r : r & 3 | 8;
    return v.toString(16);
  });
}
function generateTraceId() {
  return generateUUID().replace(/-/g, "");
}
function getCurrentTimestamp() {
  return Date.now();
}
function formatTimestamp(timestamp, format = "iso") {
  if (format === "unix") {
    return Math.floor(timestamp / 1e3);
  }
  return new Date(timestamp).toISOString();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AUTH_TYPES,
  BUSINESS_ERROR_CODES,
  CONFIG_CHANGE,
  CONFIG_PRIORITIES,
  CONFIG_RESET,
  CONFIG_SOURCES,
  CONTENT_TYPES,
  CORE_CONFIG_CHANGE,
  CORE_ERROR_CODES,
  CORE_INITIALIZED,
  CORE_MIDDLEWARE_ERROR,
  CORE_PLUGIN_ERROR,
  CORE_RESTARTED,
  CORE_RESTARTING,
  CORE_RESTART_FAILED,
  CORE_STARTED,
  CORE_STARTING,
  CORE_START_FAILED,
  CORE_STOPPED,
  CORE_STOPPING,
  CORE_STOP_FAILED,
  CRYPTO_ALGORITHMS,
  DEFAULT_LIMITS,
  DEFAULT_PORTS,
  DEFAULT_TIMEOUTS,
  ENVIRONMENTS,
  ERROR,
  HEALTH_CHECK_CONFIG,
  HTTP_METHODS,
  INTEGRATION_ERROR_CODES,
  JWT_ALGORITHMS,
  JWT_CLAIMS,
  LIFECYCLE_ERROR,
  LIFECYCLE_HOOK_ERROR,
  LIFECYCLE_HOOK_EXECUTED,
  LIFECYCLE_HOOK_EXECUTING,
  LIFECYCLE_STARTED,
  LIFECYCLE_STARTING,
  LIFECYCLE_STATE_CHANGED,
  LIFECYCLE_STOPPED,
  LIFECYCLE_STOPPING,
  LOAD_BALANCE_STRATEGIES,
  LOG_FIELDS,
  LOG_LEVELS,
  MEMORY_THRESHOLD_EXCEEDED,
  MEMORY_USAGE,
  MESSAGE_TYPES,
  METRIC_LABELS,
  METRIC_TYPES,
  MIDDLEWARES_CLEARED,
  MIDDLEWARE_ADDED,
  MIDDLEWARE_CHAIN_COMPLETED,
  MIDDLEWARE_CHAIN_FAILED,
  MIDDLEWARE_DISABLED,
  MIDDLEWARE_ENABLED,
  MIDDLEWARE_ERROR,
  MIDDLEWARE_EXECUTED,
  MIDDLEWARE_EXECUTING,
  MIDDLEWARE_INSERTED,
  MIDDLEWARE_REMOVED,
  MIDDLEWARE_TIMEOUT,
  PERMISSION_LEVELS,
  PLUGIN_CONFIG_UPDATED,
  PLUGIN_DESTROYED,
  PLUGIN_DESTROYING,
  PLUGIN_DISABLED,
  PLUGIN_ENABLED,
  PLUGIN_ERROR,
  PLUGIN_INITIALIZED,
  PLUGIN_INITIALIZING,
  PLUGIN_REGISTERED,
  PLUGIN_SKIPPED,
  PLUGIN_UNREGISTERED,
  PROTOCOL_TYPES,
  RETRY_STRATEGIES,
  SECURITY_ERROR_CODES,
  SERVICE_STATUS,
  SYSTEM_ERROR_CODES,
  TIME_UNITS,
  TOKEN_TYPES,
  TRACE_HEADERS,
  buildUrl,
  createErrorResponse,
  deepMerge,
  delay,
  formatErrorCode,
  formatTimestamp,
  generateTraceId,
  generateUUID,
  getCurrentTimestamp,
  getErrorCategory,
  isValidErrorCode,
  isValidHttpMethod,
  isValidProtocol,
  logLevelToNumber,
  numberToLogLevel,
  numberToStatus,
  protocolToString,
  retry,
  statusToNumber,
  stringToProtocol
});
//# sourceMappingURL=index.cjs.map