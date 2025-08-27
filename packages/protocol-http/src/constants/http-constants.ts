/**
 * @fileoverview HTTP协议常量定义
 */

// HTTP状态码常量
export const HTTP_STATUS = {
  // 1xx 信息性状态码
  CONTINUE: 100,
  SWITCHING_PROTOCOLS: 101,
  PROCESSING: 102,
  EARLY_HINTS: 103,
  
  // 2xx 成功状态码
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NON_AUTHORITATIVE_INFORMATION: 203,
  NO_CONTENT: 204,
  RESET_CONTENT: 205,
  PARTIAL_CONTENT: 206,
  MULTI_STATUS: 207,
  ALREADY_REPORTED: 208,
  IM_USED: 226,
  
  // 3xx 重定向状态码
  MULTIPLE_CHOICES: 300,
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  SEE_OTHER: 303,
  NOT_MODIFIED: 304,
  USE_PROXY: 305,
  TEMPORARY_REDIRECT: 307,
  PERMANENT_REDIRECT: 308,
  
  // 4xx 客户端错误状态码
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  PAYLOAD_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  
  // 5xx 服务器错误状态码
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NOT_EXTENDED: 510,
  NETWORK_AUTHENTICATION_REQUIRED: 511
} as const;

// HTTP状态码描述
export const HTTP_STATUS_TEXT = {
  100: 'Continue',
  101: 'Switching Protocols',
  102: 'Processing',
  103: 'Early Hints',
  
  200: 'OK',
  201: 'Created',
  202: 'Accepted',
  203: 'Non-Authoritative Information',
  204: 'No Content',
  205: 'Reset Content',
  206: 'Partial Content',
  207: 'Multi-Status',
  208: 'Already Reported',
  226: 'IM Used',
  
  300: 'Multiple Choices',
  301: 'Moved Permanently',
  302: 'Found',
  303: 'See Other',
  304: 'Not Modified',
  305: 'Use Proxy',
  307: 'Temporary Redirect',
  308: 'Permanent Redirect',
  
  400: 'Bad Request',
  401: 'Unauthorized',
  402: 'Payment Required',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  407: 'Proxy Authentication Required',
  408: 'Request Timeout',
  409: 'Conflict',
  410: 'Gone',
  411: 'Length Required',
  412: 'Precondition Failed',
  413: 'Payload Too Large',
  414: 'URI Too Long',
  415: 'Unsupported Media Type',
  416: 'Range Not Satisfiable',
  417: 'Expectation Failed',
  421: 'Misdirected Request',
  422: 'Unprocessable Entity',
  423: 'Locked',
  424: 'Failed Dependency',
  425: 'Too Early',
  426: 'Upgrade Required',
  428: 'Precondition Required',
  429: 'Too Many Requests',
  431: 'Request Header Fields Too Large',
  451: 'Unavailable For Legal Reasons',
  
  500: 'Internal Server Error',
  501: 'Not Implemented',
  502: 'Bad Gateway',
  503: 'Service Unavailable',
  504: 'Gateway Timeout',
  505: 'HTTP Version Not Supported',
  506: 'Variant Also Negotiates',
  507: 'Insufficient Storage',
  508: 'Loop Detected',
  510: 'Not Extended',
  511: 'Network Authentication Required'
} as const;

// HTTP方法常量
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE',
  PATCH: 'PATCH',
  HEAD: 'HEAD',
  OPTIONS: 'OPTIONS',
  TRACE: 'TRACE'
} as const;

// Content-Type常量
export const CONTENT_TYPES = {
  JSON: 'application/json',
  XML: 'application/xml',
  HTML: 'text/html',
  PLAIN: 'text/plain',
  FORM_URLENCODED: 'application/x-www-form-urlencoded',
  FORM_DATA: 'multipart/form-data',
  OCTET_STREAM: 'application/octet-stream',
  PDF: 'application/pdf',
  ZIP: 'application/zip',
  GZIP: 'application/gzip',
  CSS: 'text/css',
  JAVASCRIPT: 'application/javascript',
  PNG: 'image/png',
  JPG: 'image/jpeg',
  GIF: 'image/gif',
  SVG: 'image/svg+xml'
} as const;

// 标准HTTP头部常量
export const HTTP_HEADERS = {
  // 通用头部
  CACHE_CONTROL: 'Cache-Control',
  CONNECTION: 'Connection',
  DATE: 'Date',
  PRAGMA: 'Pragma',
  TRAILER: 'Trailer',
  TRANSFER_ENCODING: 'Transfer-Encoding',
  UPGRADE: 'Upgrade',
  VIA: 'Via',
  WARNING: 'Warning',
  
  // 请求头部
  ACCEPT: 'Accept',
  ACCEPT_CHARSET: 'Accept-Charset',
  ACCEPT_ENCODING: 'Accept-Encoding',
  ACCEPT_LANGUAGE: 'Accept-Language',
  AUTHORIZATION: 'Authorization',
  EXPECT: 'Expect',
  FROM: 'From',
  HOST: 'Host',
  IF_MATCH: 'If-Match',
  IF_MODIFIED_SINCE: 'If-Modified-Since',
  IF_NONE_MATCH: 'If-None-Match',
  IF_RANGE: 'If-Range',
  IF_UNMODIFIED_SINCE: 'If-Unmodified-Since',
  MAX_FORWARDS: 'Max-Forwards',
  PROXY_AUTHORIZATION: 'Proxy-Authorization',
  RANGE: 'Range',
  REFERER: 'Referer',
  TE: 'TE',
  USER_AGENT: 'User-Agent',
  
  // 响应头部
  ACCEPT_RANGES: 'Accept-Ranges',
  AGE: 'Age',
  ETAG: 'ETag',
  LOCATION: 'Location',
  PROXY_AUTHENTICATE: 'Proxy-Authenticate',
  RETRY_AFTER: 'Retry-After',
  SERVER: 'Server',
  VARY: 'Vary',
  WWW_AUTHENTICATE: 'WWW-Authenticate',
  
  // 实体头部
  ALLOW: 'Allow',
  CONTENT_ENCODING: 'Content-Encoding',
  CONTENT_LANGUAGE: 'Content-Language',
  CONTENT_LENGTH: 'Content-Length',
  CONTENT_LOCATION: 'Content-Location',
  CONTENT_MD5: 'Content-MD5',
  CONTENT_RANGE: 'Content-Range',
  CONTENT_TYPE: 'Content-Type',
  EXPIRES: 'Expires',
  LAST_MODIFIED: 'Last-Modified',
  
  // 自定义头部
  X_POWERED_BY: 'X-Powered-By',
  X_REQUEST_ID: 'X-Request-ID',
  X_FORWARDED_FOR: 'X-Forwarded-For',
  X_FORWARDED_HOST: 'X-Forwarded-Host',
  X_FORWARDED_PROTO: 'X-Forwarded-Proto',
  X_REAL_IP: 'X-Real-IP',
  X_CACHE: 'X-Cache',
  X_FRAME_OPTIONS: 'X-Frame-Options',
  X_CONTENT_TYPE_OPTIONS: 'X-Content-Type-Options',
  X_XSS_PROTECTION: 'X-XSS-Protection',
  
  // CORS头部
  ACCESS_CONTROL_ALLOW_ORIGIN: 'Access-Control-Allow-Origin',
  ACCESS_CONTROL_ALLOW_CREDENTIALS: 'Access-Control-Allow-Credentials',
  ACCESS_CONTROL_ALLOW_HEADERS: 'Access-Control-Allow-Headers',
  ACCESS_CONTROL_ALLOW_METHODS: 'Access-Control-Allow-Methods',
  ACCESS_CONTROL_EXPOSE_HEADERS: 'Access-Control-Expose-Headers',
  ACCESS_CONTROL_MAX_AGE: 'Access-Control-Max-Age',
  ACCESS_CONTROL_REQUEST_HEADERS: 'Access-Control-Request-Headers',
  ACCESS_CONTROL_REQUEST_METHOD: 'Access-Control-Request-Method',
  ORIGIN: 'Origin'
} as const;

// 默认端口常量
export const DEFAULT_PORTS = {
  HTTP: 80,
  HTTPS: 443,
  FTP: 21,
  SSH: 22,
  TELNET: 23,
  SMTP: 25,
  DNS: 53,
  POP3: 110,
  IMAP: 143
} as const;

// HTTP版本常量
export const HTTP_VERSIONS = {
  HTTP_1_0: '1.0',
  HTTP_1_1: '1.1',
  HTTP_2: '2.0'
} as const;

// 缓存策略常量
export const CACHE_STRATEGIES = {
  NO_CACHE: 'no-cache',
  NO_STORE: 'no-store',
  MAX_AGE: 'max-age',
  MUST_REVALIDATE: 'must-revalidate',
  PUBLIC: 'public',
  PRIVATE: 'private',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
} as const;

// 编码常量
export const ENCODINGS = {
  GZIP: 'gzip',
  DEFLATE: 'deflate',
  BR: 'br',
  IDENTITY: 'identity'
} as const;

// 错误代码常量
export const HTTP_ERROR_CODES = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  CLIENT_ERROR: 'CLIENT_ERROR'
} as const;

// 默认配置常量
export const DEFAULT_CONFIG = {
  SERVER: {
    HOST: '0.0.0.0',
    PORT: 3000,
    TIMEOUT: 30000,
    MAX_CONNECTIONS: 10000,
    KEEP_ALIVE_TIMEOUT: 5000
  },
  CLIENT: {
    TIMEOUT: 30000,
    MAX_REDIRECTS: 5,
    MAX_CONNECTIONS: 100,
    MAX_CONNECTIONS_PER_HOST: 10
  },
  CACHE: {
    TTL: 300000, // 5 minutes
    MAX_SIZE: 100 * 1024 * 1024, // 100MB
    MAX_ENTRIES: 1000
  },
  RATE_LIMIT: {
    WINDOW_MS: 60000, // 1 minute
    MAX_REQUESTS: 1000
  }
} as const;

// 中间件优先级常量
export const MIDDLEWARE_PRIORITY = {
  SECURITY: 100,
  CORS: 200,
  COMPRESSION: 300,
  RATE_LIMIT: 400,
  AUTHENTICATION: 500,
  VALIDATION: 600,
  LOGGING: 700,
  CACHING: 800,
  ROUTING: 900,
  ERROR_HANDLER: 1000
} as const;

// 路径模式常量
export const PATH_PATTERNS = {
  PARAM: '/:([^/]+)',
  WILDCARD: '/(.*)',
  OPTIONAL: '/?([^/]*)',
  EXTENSION: '\\.(\\w+)$'
} as const;