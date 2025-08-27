declare const PROTOCOL_TYPES: {
    readonly UNKNOWN: "unknown";
    readonly HTTP: "http";
    readonly HTTPS: "https";
    readonly GRPC: "grpc";
    readonly WEBSOCKET: "websocket";
    readonly TCP: "tcp";
    readonly UDP: "udp";
};
declare const HTTP_METHODS: {
    readonly GET: "GET";
    readonly POST: "POST";
    readonly PUT: "PUT";
    readonly PATCH: "PATCH";
    readonly DELETE: "DELETE";
    readonly OPTIONS: "OPTIONS";
    readonly HEAD: "HEAD";
};
declare const MESSAGE_TYPES: {
    readonly REQUEST: "request";
    readonly RESPONSE: "response";
    readonly EVENT: "event";
    readonly COMMAND: "command";
    readonly NOTIFICATION: "notification";
};
declare const CONTENT_TYPES: {
    readonly JSON: "application/json";
    readonly PROTOBUF: "application/protobuf";
    readonly MSGPACK: "application/msgpack";
    readonly XML: "application/xml";
    readonly FORM_DATA: "multipart/form-data";
    readonly FORM_URLENCODED: "application/x-www-form-urlencoded";
};
type ProtocolType = typeof PROTOCOL_TYPES[keyof typeof PROTOCOL_TYPES];
type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
type MessageType = typeof MESSAGE_TYPES[keyof typeof MESSAGE_TYPES];
type ContentType = typeof CONTENT_TYPES[keyof typeof CONTENT_TYPES];

declare const SYSTEM_ERROR_CODES: {
    readonly INTERNAL_ERROR: "100001";
    readonly SERVICE_UNAVAILABLE: "100002";
    readonly SERVICE_TIMEOUT: "100003";
    readonly RESOURCE_EXHAUSTED: "100004";
    readonly CONFIGURATION_ERROR: "100005";
    readonly NETWORK_CONNECTION_FAILED: "101001";
    readonly NETWORK_TIMEOUT: "101002";
    readonly NETWORK_INTERRUPTED: "101003";
    readonly DNS_RESOLUTION_FAILED: "101004";
    readonly SERIALIZATION_FAILED: "102001";
    readonly DESERIALIZATION_FAILED: "102002";
    readonly DATA_FORMAT_ERROR: "102003";
    readonly DATA_SIZE_EXCEEDED: "102004";
};
declare const BUSINESS_ERROR_CODES: {
    readonly BUSINESS_RULE_VIOLATION: "200001";
    readonly BUSINESS_PROCESS_ERROR: "200002";
    readonly BUSINESS_STATE_INVALID: "200003";
    readonly BUSINESS_DATA_INCONSISTENT: "200004";
    readonly USER_NOT_FOUND: "201001";
    readonly USER_ALREADY_EXISTS: "201002";
    readonly USER_STATE_INVALID: "201003";
    readonly USER_PERMISSION_DENIED: "201004";
    readonly ORDER_NOT_FOUND: "202001";
    readonly ORDER_STATE_INVALID: "202002";
    readonly ORDER_AMOUNT_INVALID: "202003";
    readonly INSUFFICIENT_INVENTORY: "202004";
};
declare const INTEGRATION_ERROR_CODES: {
    readonly EXTERNAL_SERVICE_UNAVAILABLE: "300001";
    readonly EXTERNAL_SERVICE_RESPONSE_INVALID: "300002";
    readonly API_VERSION_INCOMPATIBLE: "300003";
    readonly DATA_MAPPING_FAILED: "300004";
    readonly DATABASE_CONNECTION_FAILED: "301001";
    readonly QUERY_TIMEOUT: "301002";
    readonly TRANSACTION_ROLLBACK: "301003";
    readonly CONSTRAINT_VIOLATION: "301004";
};
declare const SECURITY_ERROR_CODES: {
    readonly AUTHENTICATION_FAILED: "400001";
    readonly AUTHORIZATION_FAILED: "400002";
    readonly TOKEN_EXPIRED: "400003";
    readonly SIGNATURE_VERIFICATION_FAILED: "400004";
    readonly IP_RESTRICTED: "400005";
    readonly RATE_LIMITED: "400006";
    readonly SENSITIVE_DATA_ACCESS_DENIED: "401001";
    readonly DATA_ENCRYPTION_FAILED: "401002";
    readonly DATA_DECRYPTION_FAILED: "401003";
};
interface ErrorDetail {
    field: string;
    error_code: string;
    error_message: string;
}
interface ErrorResponse {
    code: string;
    message: string;
    details?: ErrorDetail[];
    timestamp?: string;
    trace_id?: string;
}
declare function createErrorResponse(error: Omit<ErrorResponse, 'timestamp'>): ErrorResponse;
type SystemErrorCode = typeof SYSTEM_ERROR_CODES[keyof typeof SYSTEM_ERROR_CODES];
type BusinessErrorCode = typeof BUSINESS_ERROR_CODES[keyof typeof BUSINESS_ERROR_CODES];
type IntegrationErrorCode = typeof INTEGRATION_ERROR_CODES[keyof typeof INTEGRATION_ERROR_CODES];
type SecurityErrorCode = typeof SECURITY_ERROR_CODES[keyof typeof SECURITY_ERROR_CODES];
type ErrorCode = SystemErrorCode | BusinessErrorCode | IntegrationErrorCode | SecurityErrorCode;

declare const SERVICE_STATUS: {
    readonly UNKNOWN: 0;
    readonly HEALTHY: 1;
    readonly UNHEALTHY: 2;
    readonly MAINTENANCE: 3;
    readonly STARTING: 4;
    readonly STOPPING: 5;
};
declare const LOAD_BALANCE_STRATEGIES: {
    readonly ROUND_ROBIN: "round_robin";
    readonly WEIGHTED_ROUND_ROBIN: "weighted_round_robin";
    readonly LEAST_CONNECTIONS: "least_connections";
    readonly RANDOM: "random";
    readonly CONSISTENT_HASHING: "consistent_hashing";
    readonly IP_HASH: "ip_hash";
};
declare const DEFAULT_PORTS: {
    readonly HTTP: 80;
    readonly HTTPS: 443;
    readonly GRPC: 50051;
    readonly WEBSOCKET: 8080;
    readonly WEBSOCKET_SECURE: 8443;
    readonly REDIS: 6379;
    readonly MYSQL: 3306;
    readonly POSTGRESQL: 5432;
    readonly MONGODB: 27017;
    readonly ELASTICSEARCH: 9200;
};
declare const HEALTH_CHECK_CONFIG: {
    readonly DEFAULT_INTERVAL: 30000;
    readonly DEFAULT_TIMEOUT: 10000;
    readonly DEFAULT_RETRIES: 3;
    readonly DEFAULT_THRESHOLD: 3;
    readonly STARTUP_GRACE_PERIOD: 60000;
};
interface ServiceInfo {
    name: string;
    version: string;
    host: string;
    port: number;
    status: ServiceStatusType;
    loadBalanceStrategy: LoadBalanceStrategyType;
    healthCheck?: {
        endpoint: string;
        interval: number;
        timeout: number;
        retries?: number;
    };
    metadata?: Record<string, any>;
}
type ServiceStatusType = typeof SERVICE_STATUS[keyof typeof SERVICE_STATUS];
type LoadBalanceStrategyType = typeof LOAD_BALANCE_STRATEGIES[keyof typeof LOAD_BALANCE_STRATEGIES];
type DefaultPortType = typeof DEFAULT_PORTS[keyof typeof DEFAULT_PORTS];

declare const AUTH_TYPES: {
    readonly API_KEY: "api_key";
    readonly BEARER_TOKEN: "bearer";
    readonly BASIC: "basic";
    readonly OAUTH2: "oauth2";
    readonly JWT: "jwt";
    readonly MUTUAL_TLS: "mtls";
    readonly DIGEST: "digest";
};
declare const TOKEN_TYPES: {
    readonly ACCESS_TOKEN: "access_token";
    readonly REFRESH_TOKEN: "refresh_token";
    readonly ID_TOKEN: "id_token";
    readonly API_KEY: "api_key";
};
declare const PERMISSION_LEVELS: {
    readonly READ: "read";
    readonly WRITE: "write";
    readonly DELETE: "delete";
    readonly ADMIN: "admin";
    readonly SUPER_ADMIN: "super_admin";
};
declare const CRYPTO_ALGORITHMS: {
    readonly AES_128_GCM: "aes-128-gcm";
    readonly AES_256_GCM: "aes-256-gcm";
    readonly RSA_2048: "rsa-2048";
    readonly RSA_4096: "rsa-4096";
    readonly ECDSA_P256: "ecdsa-p256";
    readonly ECDSA_P384: "ecdsa-p384";
    readonly SHA256: "sha256";
    readonly SHA512: "sha512";
    readonly BCRYPT: "bcrypt";
    readonly SCRYPT: "scrypt";
};
declare const JWT_CLAIMS: {
    readonly ISSUER: "iss";
    readonly SUBJECT: "sub";
    readonly AUDIENCE: "aud";
    readonly EXPIRATION: "exp";
    readonly NOT_BEFORE: "nbf";
    readonly ISSUED_AT: "iat";
    readonly JWT_ID: "jti";
    readonly ROLES: "roles";
    readonly PERMISSIONS: "permissions";
    readonly TENANT_ID: "tenant_id";
    readonly USER_ID: "user_id";
    readonly CLIENT_ID: "client_id";
};
declare const JWT_ALGORITHMS: {
    readonly HS256: "HS256";
    readonly HS384: "HS384";
    readonly HS512: "HS512";
    readonly RS256: "RS256";
    readonly RS384: "RS384";
    readonly RS512: "RS512";
    readonly ES256: "ES256";
    readonly ES384: "ES384";
    readonly ES512: "ES512";
};
interface JWTPayload {
    [JWT_CLAIMS.ISSUER]?: string;
    [JWT_CLAIMS.SUBJECT]?: string;
    [JWT_CLAIMS.AUDIENCE]?: string | string[];
    [JWT_CLAIMS.EXPIRATION]?: number;
    [JWT_CLAIMS.NOT_BEFORE]?: number;
    [JWT_CLAIMS.ISSUED_AT]?: number;
    [JWT_CLAIMS.JWT_ID]?: string;
    [JWT_CLAIMS.ROLES]?: string[];
    [JWT_CLAIMS.PERMISSIONS]?: string[];
    [JWT_CLAIMS.TENANT_ID]?: string;
    [JWT_CLAIMS.USER_ID]?: string;
    [JWT_CLAIMS.CLIENT_ID]?: string;
    [key: string]: any;
}
type AuthType = typeof AUTH_TYPES[keyof typeof AUTH_TYPES];
type TokenType = typeof TOKEN_TYPES[keyof typeof TOKEN_TYPES];
type PermissionLevel = typeof PERMISSION_LEVELS[keyof typeof PERMISSION_LEVELS];
type CryptoAlgorithm = typeof CRYPTO_ALGORITHMS[keyof typeof CRYPTO_ALGORITHMS];
type JWTClaim = typeof JWT_CLAIMS[keyof typeof JWT_CLAIMS];
type JWTAlgorithm = typeof JWT_ALGORITHMS[keyof typeof JWT_ALGORITHMS];

declare const LOG_LEVELS: {
    readonly TRACE: 0;
    readonly DEBUG: 1;
    readonly INFO: 2;
    readonly WARN: 3;
    readonly ERROR: 4;
    readonly FATAL: 5;
};
declare const METRIC_TYPES: {
    readonly COUNTER: "counter";
    readonly GAUGE: "gauge";
    readonly HISTOGRAM: "histogram";
    readonly SUMMARY: "summary";
    readonly TIMER: "timer";
};
declare const TRACE_HEADERS: {
    readonly TRACE_ID: "x-trace-id";
    readonly SPAN_ID: "x-span-id";
    readonly PARENT_SPAN_ID: "x-parent-span-id";
    readonly TRACE_FLAGS: "x-trace-flags";
    readonly BAGGAGE: "baggage";
};
declare const LOG_FIELDS: {
    readonly TIMESTAMP: "timestamp";
    readonly LEVEL: "level";
    readonly MESSAGE: "message";
    readonly SERVICE: "service";
    readonly VERSION: "version";
    readonly TRACE_ID: "trace_id";
    readonly SPAN_ID: "span_id";
    readonly USER_ID: "user_id";
    readonly REQUEST_ID: "request_id";
    readonly ERROR: "error";
    readonly DURATION: "duration";
    readonly HTTP_METHOD: "http_method";
    readonly HTTP_STATUS: "http_status";
    readonly HTTP_PATH: "http_path";
};
declare const METRIC_LABELS: {
    readonly SERVICE_NAME: "service_name";
    readonly VERSION: "version";
    readonly ENVIRONMENT: "environment";
    readonly METHOD: "method";
    readonly STATUS: "status";
    readonly ENDPOINT: "endpoint";
    readonly ERROR_TYPE: "error_type";
};
interface LogEntry {
    [LOG_FIELDS.TIMESTAMP]: string;
    [LOG_FIELDS.LEVEL]: LogLevelType;
    [LOG_FIELDS.MESSAGE]: string;
    [LOG_FIELDS.SERVICE]?: string;
    [LOG_FIELDS.VERSION]?: string;
    [LOG_FIELDS.TRACE_ID]?: string;
    [LOG_FIELDS.SPAN_ID]?: string;
    [LOG_FIELDS.USER_ID]?: string;
    [LOG_FIELDS.REQUEST_ID]?: string;
    [LOG_FIELDS.ERROR]?: Error | string;
    [LOG_FIELDS.DURATION]?: number;
    [LOG_FIELDS.HTTP_METHOD]?: string;
    [LOG_FIELDS.HTTP_STATUS]?: number;
    [LOG_FIELDS.HTTP_PATH]?: string;
    [key: string]: any;
}
interface MetricData {
    name: string;
    type: MetricType;
    value: number;
    labels?: Record<string, string>;
    timestamp?: number;
    unit?: string;
    description?: string;
}
type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
type LogLevelType = LogLevel;
type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];
type TraceHeader = typeof TRACE_HEADERS[keyof typeof TRACE_HEADERS];
type LogField = typeof LOG_FIELDS[keyof typeof LOG_FIELDS];
type MetricLabel = typeof METRIC_LABELS[keyof typeof METRIC_LABELS];

declare const DEFAULT_TIMEOUTS: {
    readonly CONNECTION: 5000;
    readonly REQUEST: 30000;
    readonly READ: 60000;
    readonly WRITE: 10000;
    readonly IDLE: 300000;
    readonly HEALTH_CHECK: 10000;
};
declare const RETRY_STRATEGIES: {
    readonly FIXED_DELAY: "fixed_delay";
    readonly EXPONENTIAL_BACKOFF: "exponential_backoff";
    readonly LINEAR_BACKOFF: "linear_backoff";
    readonly RANDOM_JITTER: "random_jitter";
};
declare const TIME_UNITS: {
    readonly MILLISECOND: 1;
    readonly SECOND: 1000;
    readonly MINUTE: 60000;
    readonly HOUR: 3600000;
    readonly DAY: 86400000;
    readonly WEEK: 604800000;
};
interface RetryConfig {
    strategy: RetryStrategyType;
    maxAttempts: number;
    baseDelay: number;
    maxDelay?: number;
    backoffMultiplier?: number;
    jitterRange?: number;
}
interface TimeoutConfig {
    connection?: number;
    request?: number;
    read?: number;
    write?: number;
    idle?: number;
    healthCheck?: number;
}
type DefaultTimeout = typeof DEFAULT_TIMEOUTS[keyof typeof DEFAULT_TIMEOUTS];
type RetryStrategyType = typeof RETRY_STRATEGIES[keyof typeof RETRY_STRATEGIES];
type TimeUnit = typeof TIME_UNITS[keyof typeof TIME_UNITS];

declare const ENVIRONMENTS: {
    readonly DEVELOPMENT: "development";
    readonly TESTING: "testing";
    readonly STAGING: "staging";
    readonly PRODUCTION: "production";
};
declare const CONFIG_SOURCES: {
    readonly ENVIRONMENT: "env";
    readonly FILE: "file";
    readonly REMOTE: "remote";
    readonly DATABASE: "database";
    readonly CONSUL: "consul";
    readonly ETCD: "etcd";
};
declare const DEFAULT_LIMITS: {
    readonly MAX_REQUEST_SIZE: 10485760;
    readonly MAX_RESPONSE_SIZE: 10485760;
    readonly MAX_CONNECTIONS: 1000;
    readonly MAX_CONCURRENT_REQUESTS: 100;
    readonly RATE_LIMIT_PER_MINUTE: 1000;
    readonly MAX_RETRY_ATTEMPTS: 3;
    readonly MAX_BATCH_SIZE: 100;
};
declare const CONFIG_PRIORITIES: {
    readonly COMMAND_LINE: 0;
    readonly ENVIRONMENT: 1;
    readonly FILE: 2;
    readonly REMOTE: 3;
    readonly DEFAULT: 4;
};
interface ConfigEntry {
    key: string;
    value: any;
    source: ConfigSourceType;
    priority: number;
    description?: string;
    required?: boolean;
    defaultValue?: any;
}
interface ApplicationConfig {
    environment: EnvironmentType;
    service: {
        name: string;
        version: string;
        port: number;
    };
    database?: {
        host: string;
        port: number;
        name: string;
        username: string;
        password: string;
    };
    cache?: {
        host: string;
        port: number;
        ttl: number;
    };
    logging?: {
        level: string;
        format: string;
        output: string;
    };
    security?: {
        jwtSecret: string;
        encryptionKey: string;
        corsOrigins: string[];
    };
    limits?: Partial<typeof DEFAULT_LIMITS>;
}
type EnvironmentType = typeof ENVIRONMENTS[keyof typeof ENVIRONMENTS];
type ConfigSourceType = typeof CONFIG_SOURCES[keyof typeof CONFIG_SOURCES];
type DefaultLimit = typeof DEFAULT_LIMITS[keyof typeof DEFAULT_LIMITS];
type ConfigPriority = typeof CONFIG_PRIORITIES[keyof typeof CONFIG_PRIORITIES];

declare function isValidProtocol(protocol: string): protocol is ProtocolType;
declare function isValidHttpMethod(method: string): method is HttpMethod;
declare function isValidErrorCode(code: string): code is ErrorCode;
declare function getErrorCategory(code: string): string;
declare function formatErrorCode(options: {
    category: 'system' | 'business' | 'integration' | 'security';
    subcategory: string;
    error: string;
}): string;
declare function protocolToString(protocol: ProtocolType): string;
declare function stringToProtocol(protocol: string): ProtocolType | null;
declare function statusToNumber(status: ServiceStatusType): number;
declare function numberToStatus(num: number): ServiceStatusType | null;
declare function logLevelToNumber(level: string): LogLevel | null;
declare function numberToLogLevel(num: number): string | null;
declare function buildUrl(options: {
    protocol: ProtocolType;
    host: string;
    port?: number;
    path?: string;
    query?: Record<string, string>;
}): string;
declare function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T;
declare function delay(ms: number): Promise<void>;
declare function retry<T>(fn: () => Promise<T>, maxAttempts?: number, delayMs?: number): Promise<T>;
declare function generateUUID(): string;
declare function generateTraceId(): string;
declare function getCurrentTimestamp(): number;
declare function formatTimestamp(timestamp: number, format?: 'iso' | 'unix'): string | number;

export { AUTH_TYPES, type ApplicationConfig, type AuthType, BUSINESS_ERROR_CODES, type BusinessErrorCode, CONFIG_PRIORITIES, CONFIG_SOURCES, CONTENT_TYPES, CRYPTO_ALGORITHMS, type ConfigEntry, type ConfigPriority, type ConfigSourceType, type ContentType, type CryptoAlgorithm, DEFAULT_LIMITS, DEFAULT_PORTS, DEFAULT_TIMEOUTS, type DefaultLimit, type DefaultPortType, type DefaultTimeout, ENVIRONMENTS, type EnvironmentType, type ErrorCode, type ErrorDetail, type ErrorResponse, HEALTH_CHECK_CONFIG, HTTP_METHODS, type HttpMethod, INTEGRATION_ERROR_CODES, type IntegrationErrorCode, type JWTAlgorithm, type JWTClaim, type JWTPayload, JWT_ALGORITHMS, JWT_CLAIMS, LOAD_BALANCE_STRATEGIES, LOG_FIELDS, LOG_LEVELS, type LoadBalanceStrategyType, type LogEntry, type LogField, type LogLevel, type LogLevelType, MESSAGE_TYPES, METRIC_LABELS, METRIC_TYPES, type MessageType, type MetricData, type MetricLabel, type MetricType, PERMISSION_LEVELS, PROTOCOL_TYPES, type PermissionLevel, type ProtocolType, RETRY_STRATEGIES, type RetryConfig, type RetryStrategyType, SECURITY_ERROR_CODES, SERVICE_STATUS, SYSTEM_ERROR_CODES, type SecurityErrorCode, type ServiceInfo, type ServiceStatusType, type SystemErrorCode, TIME_UNITS, TOKEN_TYPES, TRACE_HEADERS, type TimeUnit, type TimeoutConfig, type TokenType, type TraceHeader, buildUrl, createErrorResponse, deepMerge, delay, formatErrorCode, formatTimestamp, generateTraceId, generateUUID, getCurrentTimestamp, getErrorCategory, isValidErrorCode, isValidHttpMethod, isValidProtocol, logLevelToNumber, numberToLogLevel, numberToStatus, protocolToString, retry, statusToNumber, stringToProtocol };
