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
type SkerBoolean = boolean;
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
type SkerInteger = number;
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
type SkerFloat = number;
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
type SkerString = string;
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
type SkerTimestamp = Date;
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
type SkerDecimal = string;
/**
 * 类型品牌标记 - 用于创建名义类型
 * Type branding - for creating nominal types
 */
type Brand<T, K> = T & {
    readonly __brand: K;
};
/**
 * UUID类型 - 标准UUID字符串
 * UUID type - standard UUID string
 */
type UUID = Brand<string, 'UUID'>;
/**
 * 货币金额类型 - 使用高精度数值
 * Money amount type - using high precision decimal
 */
type MoneyAmount = Brand<SkerDecimal, 'MoneyAmount'>;
/**
 * URL类型 - 有效的URL字符串
 * URL type - valid URL string
 */
type URL = Brand<string, 'URL'>;
/**
 * Email类型 - 有效的邮箱地址字符串
 * Email type - valid email address string
 */
type Email = Brand<string, 'Email'>;
/**
 * 基础类型工具函数
 * Basic type utility functions
 */
declare const BasicTypes: {
    /**
     * 创建UUID
     * Create UUID
     */
    createUUID(): UUID;
    /**
     * 验证UUID格式
     * Validate UUID format
     */
    isValidUUID(value: string): value is UUID;
    /**
     * 创建货币金额
     * Create money amount
     */
    createMoneyAmount(value: string | number): MoneyAmount;
    /**
     * 验证货币金额格式
     * Validate money amount format
     */
    isValidMoneyAmount(value: string): value is MoneyAmount;
    /**
     * 验证URL格式
     * Validate URL format
     */
    isValidURL(value: string): value is URL;
    /**
     * 验证邮箱格式
     * Validate email format
     */
    isValidEmail(value: string): value is Email;
    /**
     * 创建ISO8601时间戳
     * Create ISO8601 timestamp
     */
    createTimestamp(date?: Date): SkerTimestamp;
    /**
     * 验证时间戳格式
     * Validate timestamp format
     */
    isValidTimestamp(value: unknown): value is SkerTimestamp;
    /**
     * 将时间戳转换为ISO8601字符串
     * Convert timestamp to ISO8601 string
     */
    timestampToISO8601(timestamp: SkerTimestamp): string;
    /**
     * 从ISO8601字符串创建时间戳
     * Create timestamp from ISO8601 string
     */
    timestampFromISO8601(iso8601: string): SkerTimestamp;
};

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
type SkerArray<T> = T[];
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
type SkerMap<K, V> = Map<K, V>;
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
type SkerSet<T> = Set<T>;
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
type SkerOptional<T> = T | null | undefined;
/**
 * 元组类型 - 固定长度和类型的数组
 * Tuple type - fixed-length array with specific types
 */
type SkerTuple<T extends readonly unknown[]> = T;
/**
 * 记录类型 - 键值对对象
 * Record type - key-value object
 */
type SkerRecord<K extends string | number | symbol, V> = Record<K, V>;
/**
 * 集合类型工具函数
 * Collection type utility functions
 */
declare const CollectionTypes: {
    /**
     * 创建数组
     * Create array
     */
    createArray<T>(items?: T[]): SkerArray<T>;
    /**
     * 验证数组
     * Validate array
     */
    isArray<T>(value: unknown): value is SkerArray<T>;
    /**
     * 数组转换为普通对象（用于序列化）
     * Convert array to plain object (for serialization)
     */
    arrayToObject<T>(array: SkerArray<T>): Record<string, T>;
    /**
     * 从普通对象恢复数组
     * Restore array from plain object
     */
    arrayFromObject<T>(obj: Record<string, T>): SkerArray<T>;
    /**
     * 创建映射
     * Create map
     */
    createMap<K, V>(entries?: [K, V][]): SkerMap<K, V>;
    /**
     * 验证映射
     * Validate map
     */
    isMap<K, V>(value: unknown): value is SkerMap<K, V>;
    /**
     * 映射转换为普通对象（用于序列化）
     * Convert map to plain object (for serialization)
     */
    mapToObject<K extends string, V>(map: SkerMap<K, V>): Record<K, V>;
    /**
     * 从普通对象恢复映射
     * Restore map from plain object
     */
    mapFromObject<K extends string, V>(obj: Record<K, V>): SkerMap<K, V>;
    /**
     * 映射转换为数组（用于序列化复杂键类型）
     * Convert map to array (for serializing complex key types)
     */
    mapToArray<K, V>(map: SkerMap<K, V>): Array<[K, V]>;
    /**
     * 从数组恢复映射
     * Restore map from array
     */
    mapFromArray<K, V>(array: Array<[K, V]>): SkerMap<K, V>;
    /**
     * 创建集合
     * Create set
     */
    createSet<T>(items?: T[]): SkerSet<T>;
    /**
     * 验证集合
     * Validate set
     */
    isSet<T>(value: unknown): value is SkerSet<T>;
    /**
     * 集合转换为数组（用于序列化）
     * Convert set to array (for serialization)
     */
    setToArray<T>(set: SkerSet<T>): SkerArray<T>;
    /**
     * 从数组恢复集合
     * Restore set from array
     */
    setFromArray<T>(array: SkerArray<T>): SkerSet<T>;
    /**
     * 验证可选值
     * Validate optional value
     */
    isSome<T>(value: SkerOptional<T>): value is T;
    /**
     * 验证空值
     * Validate null value
     */
    isNone<T>(value: SkerOptional<T>): value is null | undefined;
    /**
     * 获取可选值或默认值
     * Get optional value or default
     */
    getOrDefault<T>(value: SkerOptional<T>, defaultValue: T): T;
    /**
     * 创建元组
     * Create tuple
     */
    createTuple<T extends readonly unknown[]>(...items: T): SkerTuple<T>;
    /**
     * 验证元组
     * Validate tuple
     */
    isTuple(value: unknown): value is SkerTuple<readonly unknown[]>;
    /**
     * 创建记录
     * Create record
     */
    createRecord<K extends string | number | symbol, V>(obj?: Record<K, V>): SkerRecord<K, V>;
    /**
     * 验证记录
     * Validate record
     */
    isRecord<K extends string | number | symbol, V>(value: unknown): value is SkerRecord<K, V>;
    /**
     * 深度克隆集合
     * Deep clone collection
     */
    deepClone<T>(value: T): T;
    /**
     * 检查集合是否为空
     * Check if collection is empty
     */
    isEmpty(value: unknown): boolean;
};

/**
 * UDEF (Unified Data Exchange Format) 消息格式类型定义
 * UDEF message format type definitions
 */

/**
 * 内容类型枚举
 * Content type enumeration
 */
declare enum ContentType {
    JSON = "application/json",
    PROTOBUF = "application/protobuf",
    MESSAGEPACK = "application/msgpack",
    AVRO = "application/avro",
    XML = "application/xml",
    PLAIN_TEXT = "text/plain",
    BINARY = "application/octet-stream"
}
/**
 * 消息类型枚举
 * Message type enumeration
 */
declare enum MessageType {
    REQUEST = "request",
    RESPONSE = "response",
    EVENT = "event",
    COMMAND = "command",
    NOTIFICATION = "notification",
    ERROR = "error",
    HEARTBEAT = "heartbeat"
}
/**
 * 消息优先级枚举
 * Message priority enumeration
 */
declare enum MessagePriority {
    LOW = 1,
    NORMAL = 5,
    HIGH = 8,
    CRITICAL = 10
}
/**
 * 服务信息接口
 * Service information interface
 */
interface ServiceInfo$1 {
    service_name: SkerString;
    service_version: SkerString;
    service_id: SkerString;
    instance_id?: SkerString;
}
/**
 * 消息头部接口
 * Message header interface
 */
interface MessageHeader {
    /** UUID格式消息ID */
    message_id: UUID;
    /** 关联消息ID，用于请求响应匹配 */
    correlation_id?: UUID;
    /** 创建时间戳 */
    timestamp: SkerTimestamp;
    /** 发送方信息 */
    source: ServiceInfo$1;
    /** 接收方信息 */
    destination?: ServiceInfo$1;
    /** 内容类型 */
    content_type: ContentType;
    /** 消息类型 */
    message_type: MessageType;
    /** 消息版本 */
    version?: SkerString;
}
/**
 * 消息元数据接口
 * Message metadata interface
 */
interface MessageMetadata {
    /** 分布式追踪ID */
    trace_id?: SkerString;
    /** 跨度ID */
    span_id?: SkerString;
    /** 父跨度ID */
    parent_span_id?: SkerString;
    /** 消息优先级 */
    priority?: MessagePriority;
    /** 生存时间（毫秒） */
    ttl?: number;
    /** 重试次数 */
    retry_count?: number;
    /** 最大重试次数 */
    max_retries?: number;
    /** 延迟发送时间戳 */
    delay_until?: SkerTimestamp;
    /** 消息标签 */
    tags?: SkerArray<SkerString>;
    /** 消息路由键 */
    routing_key?: SkerString;
    /** 消息分区键 */
    partition_key?: SkerString;
    /** 自定义属性 */
    custom_properties?: SkerRecord<string, unknown>;
}
/**
 * 消息信封接口
 * Message envelope interface
 */
interface MessageEnvelope {
    header: MessageHeader;
    metadata: MessageMetadata;
}
/**
 * 消息载荷接口
 * Message payload interface
 */
interface MessagePayload {
    /** 实际业务数据 */
    data: unknown;
    /** 数据模式版本 */
    schema_version: SkerString;
    /** 数据校验和 */
    checksum?: SkerString;
    /** 数据大小（字节） */
    size_bytes?: number;
    /** 数据编码方式 */
    encoding?: SkerString;
    /** 数据压缩方式 */
    compression?: SkerString;
}
/**
 * UDEF消息接口
 * UDEF message interface
 */
interface UDEFMessage {
    envelope: MessageEnvelope;
    payload: MessagePayload;
}
/**
 * 类型化UDEF消息接口
 * Typed UDEF message interface
 */
interface TypedUDEFMessage<TData = unknown> extends UDEFMessage {
    payload: MessagePayload & {
        data: TData;
    };
}
/**
 * 请求消息接口
 * Request message interface
 */
interface RequestMessage<TData = unknown> extends TypedUDEFMessage<TData> {
    envelope: MessageEnvelope & {
        header: MessageHeader & {
            message_type: MessageType.REQUEST;
        };
    };
}
/**
 * 响应消息接口
 * Response message interface
 */
interface ResponseMessage<TData = unknown> extends TypedUDEFMessage<TData> {
    envelope: MessageEnvelope & {
        header: MessageHeader & {
            message_type: MessageType.RESPONSE;
            correlation_id: UUID;
        };
    };
}
/**
 * 事件消息接口
 * Event message interface
 */
interface EventMessage<TData = unknown> extends TypedUDEFMessage<TData> {
    envelope: MessageEnvelope & {
        header: MessageHeader & {
            message_type: MessageType.EVENT;
        };
    };
}
/**
 * 命令消息接口
 * Command message interface
 */
interface CommandMessage<TData = unknown> extends TypedUDEFMessage<TData> {
    envelope: MessageEnvelope & {
        header: MessageHeader & {
            message_type: MessageType.COMMAND;
        };
    };
}
/**
 * 通知消息接口
 * Notification message interface
 */
interface NotificationMessage<TData = unknown> extends TypedUDEFMessage<TData> {
    envelope: MessageEnvelope & {
        header: MessageHeader & {
            message_type: MessageType.NOTIFICATION;
        };
    };
}
/**
 * 心跳消息接口
 * Heartbeat message interface
 */
interface HeartbeatMessage extends TypedUDEFMessage<{
    status: 'alive' | 'healthy' | 'degraded';
    timestamp: SkerTimestamp;
    metrics?: SkerRecord<string, unknown>;
}> {
    envelope: MessageEnvelope & {
        header: MessageHeader & {
            message_type: MessageType.HEARTBEAT;
        };
    };
}
/**
 * 消息批处理接口
 * Message batch interface
 */
interface MessageBatch {
    batch_id: UUID;
    messages: SkerArray<UDEFMessage>;
    batch_size: number;
    created_at: SkerTimestamp;
    metadata?: MessageMetadata;
}
/**
 * 消息确认接口
 * Message acknowledgment interface
 */
interface MessageAck {
    message_id: UUID;
    ack_type: 'positive' | 'negative' | 'reject';
    timestamp: SkerTimestamp;
    reason?: SkerString;
    retry_after?: number;
}
/**
 * 消息统计接口
 * Message statistics interface
 */
interface MessageStats {
    total_messages: number;
    success_count: number;
    error_count: number;
    average_processing_time_ms: number;
    throughput_per_second: number;
    last_message_timestamp: SkerTimestamp;
}
/**
 * 消息过滤器接口
 * Message filter interface
 */
interface MessageFilter {
    service_name?: SkerString;
    message_type?: MessageType;
    tags?: SkerArray<SkerString>;
    priority?: MessagePriority;
    timestamp_after?: SkerTimestamp;
    timestamp_before?: SkerTimestamp;
    custom_filter?: (message: UDEFMessage) => boolean;
}
/**
 * 消息路由规则接口
 * Message routing rule interface
 */
interface MessageRoutingRule {
    rule_id: UUID;
    name: SkerString;
    condition: MessageFilter;
    destination: ServiceInfo$1;
    transformation?: SkerString;
    enabled: boolean;
}
/**
 * 消息转换接口
 * Message transformation interface
 */
interface MessageTransformation {
    from_format: ContentType;
    to_format: ContentType;
    schema_mapping?: SkerRecord<string, string>;
    field_mappings?: SkerRecord<string, string>;
    custom_transformer?: SkerString;
}

/**
 * 标准错误处理类型定义
 * Standard error handling type definitions
 */

/**
 * 错误级别枚举
 * Error level enumeration
 */
declare enum ErrorLevel {
    /** 系统级错误 - 如网络错误、服务不可用等 */
    SYSTEM = "system",
    /** 业务逻辑错误 - 如验证失败、业务规则违反等 */
    BUSINESS = "business",
    /** 集成错误 - 如第三方服务错误、数据格式不匹配等 */
    INTEGRATION = "integration",
    /** 安全错误 - 如认证失败、权限不足等 */
    SECURITY = "security",
    /** 配置错误 - 如配置缺失、配置格式错误等 */
    CONFIGURATION = "configuration",
    /** 数据错误 - 如数据不一致、数据损坏等 */
    DATA = "data"
}
/**
 * 错误严重性枚举
 * Error severity enumeration
 */
declare enum ErrorSeverity {
    /** 低 - 不影响主要功能 */
    LOW = 1,
    /** 中等 - 影响部分功能 */
    MEDIUM = 2,
    /** 高 - 影响主要功能 */
    HIGH = 3,
    /** 严重 - 导致服务不可用 */
    CRITICAL = 4
}
/**
 * HTTP状态码枚举（常用）
 * HTTP status code enumeration (common ones)
 */
declare enum HttpStatusCode {
    OK = 200,
    CREATED = 201,
    ACCEPTED = 202,
    NO_CONTENT = 204,
    MOVED_PERMANENTLY = 301,
    FOUND = 302,
    NOT_MODIFIED = 304,
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    NOT_IMPLEMENTED = 501,
    BAD_GATEWAY = 502,
    SERVICE_UNAVAILABLE = 503,
    GATEWAY_TIMEOUT = 504
}
/**
 * 标准错误码定义
 * Standard error code definitions
 */
declare const ErrorCodes: {
    readonly SYSTEM: {
        readonly NETWORK_ERROR: "10001";
        readonly SERVICE_UNAVAILABLE: "10002";
        readonly TIMEOUT: "10003";
        readonly INTERNAL_ERROR: "10004";
        readonly RESOURCE_EXHAUSTED: "10005";
        readonly CIRCUIT_BREAKER_OPEN: "10006";
    };
    readonly BUSINESS: {
        readonly VALIDATION_FAILED: "20001";
        readonly BUSINESS_RULE_VIOLATION: "20002";
        readonly DUPLICATE_RESOURCE: "20003";
        readonly RESOURCE_NOT_FOUND: "20004";
        readonly INVALID_OPERATION: "20005";
        readonly INSUFFICIENT_FUNDS: "20006";
        readonly QUOTA_EXCEEDED: "20007";
    };
    readonly INTEGRATION: {
        readonly EXTERNAL_SERVICE_ERROR: "30001";
        readonly DATA_FORMAT_MISMATCH: "30002";
        readonly API_VERSION_INCOMPATIBLE: "30003";
        readonly SERIALIZATION_ERROR: "30004";
        readonly DESERIALIZATION_ERROR: "30005";
        readonly PROTOCOL_ERROR: "30006";
    };
    readonly SECURITY: {
        readonly AUTHENTICATION_FAILED: "40001";
        readonly AUTHORIZATION_FAILED: "40002";
        readonly TOKEN_EXPIRED: "40003";
        readonly TOKEN_INVALID: "40004";
        readonly ACCESS_DENIED: "40005";
        readonly RATE_LIMIT_EXCEEDED: "40006";
        readonly SECURITY_VIOLATION: "40007";
    };
    readonly CONFIGURATION: {
        readonly MISSING_CONFIGURATION: "50001";
        readonly INVALID_CONFIGURATION: "50002";
        readonly ENVIRONMENT_MISMATCH: "50003";
        readonly DEPENDENCY_MISSING: "50004";
    };
    readonly DATA: {
        readonly DATA_CORRUPTION: "60001";
        readonly DATA_INCONSISTENCY: "60002";
        readonly SCHEMA_MISMATCH: "60003";
        readonly CONSTRAINT_VIOLATION: "60004";
        readonly DUPLICATE_KEY: "60005";
        readonly FOREIGN_KEY_VIOLATION: "60006";
    };
};
/**
 * 错误详情接口
 * Error detail interface
 */
interface ErrorDetail {
    /** 字段名（如果错误与特定字段相关） */
    field?: SkerString;
    /** 具体错误码 */
    error_code: SkerString;
    /** 错误描述 */
    error_message: SkerString;
    /** 错误值（引起错误的具体值） */
    error_value?: unknown;
    /** 期望值 */
    expected_value?: unknown;
    /** 错误上下文 */
    context?: SkerRecord<string, unknown>;
}
/**
 * 错误堆栈跟踪接口
 * Error stack trace interface
 */
interface ErrorStackTrace {
    /** 函数名 */
    function_name: SkerString;
    /** 文件名 */
    file_name: SkerString;
    /** 行号 */
    line_number: number;
    /** 列号 */
    column_number?: number;
    /** 源码片段 */
    source_snippet?: SkerString;
}
/**
 * 错误响应接口
 * Error response interface
 */
interface ErrorResponse {
    /** 成功标识，错误时固定为false */
    success: false;
    /** 错误信息 */
    error: {
        /** 错误码 */
        code: SkerString;
        /** 错误消息 */
        message: SkerString;
        /** 错误级别 */
        level: ErrorLevel;
        /** 错误严重性 */
        severity: ErrorSeverity;
        /** HTTP状态码 */
        http_status?: HttpStatusCode;
        /** 错误详情列表 */
        details?: SkerArray<ErrorDetail>;
        /** 错误发生时间 */
        timestamp: SkerTimestamp;
        /** 追踪ID */
        trace_id?: SkerString;
        /** 错误堆栈跟踪 */
        stack_trace?: SkerArray<ErrorStackTrace>;
        /** 帮助链接 */
        help_url?: SkerString;
        /** 错误原因（上游错误） */
        cause?: ErrorResponse;
        /** 建议的解决方案 */
        suggested_actions?: SkerArray<SkerString>;
        /** 是否可重试 */
        retryable: boolean;
        /** 重试延迟（毫秒） */
        retry_after_ms?: number;
    };
    /** 元数据 */
    metadata: {
        /** 请求ID */
        request_id?: UUID;
        /** API版本 */
        api_version: SkerString;
        /** 处理时间（毫秒） */
        processing_time_ms: number;
        /** 服务实例ID */
        instance_id?: SkerString;
        /** 错误发生的服务名称 */
        service_name?: SkerString;
        /** 错误发生的方法名称 */
        method_name?: SkerString;
        /** 用户代理 */
        user_agent?: SkerString;
        /** 客户端IP */
        client_ip?: SkerString;
        /** 错误统计信息 */
        error_stats?: {
            /** 此错误今日发生次数 */
            occurrence_count_today: number;
            /** 首次发生时间 */
            first_occurrence: SkerTimestamp;
            /** 最后发生时间 */
            last_occurrence: SkerTimestamp;
        };
    };
}
/**
 * 成功响应接口
 * Success response interface
 */
interface SuccessResponse<TData = unknown> {
    /** 成功标识，成功时固定为true */
    success: true;
    /** 响应数据 */
    data: TData;
    /** 元数据 */
    metadata: {
        /** 请求ID */
        request_id?: UUID;
        /** API版本 */
        api_version: SkerString;
        /** 处理时间（毫秒） */
        processing_time_ms: number;
        /** 服务实例ID */
        instance_id?: SkerString;
        /** 响应时间戳 */
        timestamp: SkerTimestamp;
        /** 分页信息（如果适用） */
        pagination?: {
            page: number;
            page_size: number;
            total_count: number;
            total_pages: number;
            has_next: boolean;
            has_previous: boolean;
        };
        /** 数据版本（用于乐观锁） */
        version?: SkerString;
        /** 缓存信息 */
        cache_info?: {
            cached: boolean;
            cache_key?: SkerString;
            cache_ttl_seconds?: number;
            cache_timestamp?: SkerTimestamp;
        };
    };
}
/**
 * 服务结果联合类型
 * Service result union type
 */
type ServiceResult<TData = unknown> = SuccessResponse<TData> | ErrorResponse;
/**
 * 验证结果接口
 * Validation result interface
 */
interface ValidationResult {
    /** 是否验证通过 */
    valid: boolean;
    /** 错误列表 */
    errors: SkerArray<ErrorDetail>;
    /** 警告列表 */
    warnings?: SkerArray<ErrorDetail>;
}
/**
 * 异常基类接口
 * Base exception interface
 */
interface BaseException {
    /** 异常名称 */
    name: SkerString;
    /** 异常消息 */
    message: SkerString;
    /** 错误码 */
    code: SkerString;
    /** 错误级别 */
    level: ErrorLevel;
    /** 错误严重性 */
    severity: ErrorSeverity;
    /** 发生时间 */
    timestamp: SkerTimestamp;
    /** 堆栈跟踪 */
    stack?: SkerString;
    /** 内部错误 */
    inner_error?: BaseException;
    /** 上下文数据 */
    context?: SkerRecord<string, unknown>;
}
/**
 * 业务异常接口
 * Business exception interface
 */
interface BusinessException extends BaseException {
    level: ErrorLevel.BUSINESS;
    /** 业务规则ID */
    business_rule_id?: SkerString;
    /** 违反的约束条件 */
    violated_constraints?: SkerArray<SkerString>;
}
/**
 * 系统异常接口
 * System exception interface
 */
interface SystemException extends BaseException {
    level: ErrorLevel.SYSTEM;
    /** 系统组件 */
    component?: SkerString;
    /** 系统资源 */
    resource?: SkerString;
    /** 系统指标 */
    metrics?: SkerRecord<string, number>;
}
/**
 * 安全异常接口
 * Security exception interface
 */
interface SecurityException extends BaseException {
    level: ErrorLevel.SECURITY;
    /** 安全策略ID */
    security_policy_id?: SkerString;
    /** 尝试的操作 */
    attempted_operation?: SkerString;
    /** 用户标识 */
    user_identifier?: SkerString;
    /** IP地址 */
    ip_address?: SkerString;
}
/**
 * 错误聚合接口
 * Error aggregation interface
 */
interface ErrorAggregation {
    /** 错误码 */
    error_code: SkerString;
    /** 错误消息 */
    error_message: SkerString;
    /** 发生次数 */
    occurrence_count: number;
    /** 首次发生时间 */
    first_occurrence: SkerTimestamp;
    /** 最后发生时间 */
    last_occurrence: SkerTimestamp;
    /** 影响的用户数 */
    affected_users?: number;
    /** 影响的请求数 */
    affected_requests?: number;
    /** 平均响应时间（毫秒） */
    average_response_time_ms?: number;
}

/**
 * 服务相关类型定义
 * Service-related type definitions
 */

/**
 * 协议类型枚举
 * Protocol type enumeration
 */
declare enum Protocol {
    UNKNOWN = "unknown",
    HTTP = "http",
    HTTPS = "https",
    GRPC = "grpc",
    GRPC_WEB = "grpc-web",
    WEBSOCKET = "websocket",
    WEBSOCKET_SECURE = "wss",
    TCP = "tcp",
    UDP = "udp",
    MQTT = "mqtt",
    AMQP = "amqp",
    KAFKA = "kafka",
    REDIS = "redis"
}
/**
 * 健康状态枚举
 * Health status enumeration
 */
declare enum HealthStatus {
    /** 未知状态 */
    UNKNOWN = 0,
    /** 健康状态 */
    HEALTHY = 1,
    /** 不健康状态 */
    UNHEALTHY = 2,
    /** 维护状态 */
    MAINTENANCE = 3,
    /** 降级服务状态 */
    DEGRADED = 4,
    /** 启动中状态 */
    STARTING = 5,
    /** 关闭中状态 */
    SHUTTING_DOWN = 6
}
/**
 * 负载均衡策略枚举
 * Load balance strategy enumeration
 */
declare enum LoadBalanceStrategy {
    /** 轮询 */
    ROUND_ROBIN = "round_robin",
    /** 随机 */
    RANDOM = "random",
    /** 最少连接 */
    LEAST_CONNECTIONS = "least_connections",
    /** 加权轮询 */
    WEIGHTED_ROUND_ROBIN = "weighted_round_robin",
    /** 加权随机 */
    WEIGHTED_RANDOM = "weighted_random",
    /** 最少响应时间 */
    LEAST_RESPONSE_TIME = "least_response_time",
    /** 一致性哈希 */
    CONSISTENT_HASH = "consistent_hash",
    /** IP哈希 */
    IP_HASH = "ip_hash"
}
/**
 * 服务状态枚举
 * Service state enumeration
 */
declare enum ServiceState {
    /** 初始化中 */
    INITIALIZING = "initializing",
    /** 运行中 */
    RUNNING = "running",
    /** 暂停 */
    PAUSED = "paused",
    /** 停止 */
    STOPPED = "stopped",
    /** 错误状态 */
    ERROR = "error",
    /** 重启中 */
    RESTARTING = "restarting"
}
/**
 * 网络信息接口
 * Network information interface
 */
interface NetworkInfo {
    /** 主机地址 */
    host: SkerString;
    /** 端口号 */
    port: number;
    /** 协议类型 */
    protocol: Protocol;
    /** 基础路径 */
    base_path?: SkerString;
    /** SSL/TLS配置 */
    tls_config?: {
        enabled: boolean;
        cert_file?: SkerString;
        key_file?: SkerString;
        ca_file?: SkerString;
        insecure_skip_verify?: boolean;
    };
    /** 连接超时（毫秒） */
    connect_timeout_ms?: number;
    /** 读取超时（毫秒） */
    read_timeout_ms?: number;
    /** 写入超时（毫秒） */
    write_timeout_ms?: number;
    /** 最大连接数 */
    max_connections?: number;
}
/**
 * 服务健康检查配置接口
 * Service health check configuration interface
 */
interface HealthCheckConfig {
    /** 健康检查URL */
    health_check_url?: URL;
    /** 检查间隔（秒） */
    interval_seconds: number;
    /** 超时时间（秒） */
    timeout_seconds: number;
    /** 健康阈值 */
    healthy_threshold: number;
    /** 不健康阈值 */
    unhealthy_threshold: number;
    /** 启用标识 */
    enabled: boolean;
    /** 自定义健康检查方法 */
    custom_check?: SkerString;
}
/**
 * 服务指标接口
 * Service metrics interface
 */
interface ServiceMetrics {
    /** CPU使用率（百分比） */
    cpu_usage_percent?: number;
    /** 内存使用量（字节） */
    memory_usage_bytes?: number;
    /** 内存使用率（百分比） */
    memory_usage_percent?: number;
    /** 磁盘使用量（字节） */
    disk_usage_bytes?: number;
    /** 网络输入字节数 */
    network_in_bytes?: number;
    /** 网络输出字节数 */
    network_out_bytes?: number;
    /** 活跃连接数 */
    active_connections?: number;
    /** 平均响应时间（毫秒） */
    average_response_time_ms?: number;
    /** 每秒请求数 */
    requests_per_second?: number;
    /** 错误率（百分比） */
    error_rate_percent?: number;
    /** 正常运行时间（秒） */
    uptime_seconds?: number;
    /** 最后更新时间 */
    last_updated: SkerTimestamp;
    /** 自定义指标 */
    custom_metrics?: SkerRecord<string, number>;
}
/**
 * 服务信息接口
 * Service information interface
 */
interface ServiceInfo {
    /** 服务名称 */
    service_name: SkerString;
    /** 服务版本 */
    service_version: SkerString;
    /** 服务实例ID */
    service_id: UUID;
    /** 实例ID（同一服务的不同实例） */
    instance_id?: UUID;
    /** 网络信息 */
    network_info: NetworkInfo;
    /** 健康状态 */
    health_status: HealthStatus;
    /** 服务状态 */
    service_state: ServiceState;
    /** 服务描述 */
    description?: SkerString;
    /** 服务标签 */
    tags: SkerArray<SkerString>;
    /** 服务能力列表 */
    capabilities: SkerArray<SkerString>;
    /** 支持的API版本 */
    supported_api_versions: SkerArray<SkerString>;
    /** 元数据 */
    metadata: SkerRecord<string, unknown>;
    /** 注册时间 */
    registered_at: SkerTimestamp;
    /** 最后更新时间 */
    last_updated: SkerTimestamp;
    /** 最后心跳时间 */
    last_heartbeat?: SkerTimestamp;
    /** 健康检查配置 */
    health_check?: HealthCheckConfig;
    /** 服务指标 */
    metrics?: ServiceMetrics;
    /** 负载均衡权重 */
    load_balance_weight?: number;
    /** 服务依赖 */
    dependencies?: SkerArray<SkerString>;
    /** 服务端点列表 */
    endpoints?: SkerArray<ServiceEndpoint>;
}
/**
 * 服务端点接口
 * Service endpoint interface
 */
interface ServiceEndpoint {
    /** 端点ID */
    endpoint_id: UUID;
    /** 端点名称 */
    name: SkerString;
    /** 端点路径 */
    path: SkerString;
    /** HTTP方法 */
    method?: SkerString;
    /** 端点描述 */
    description?: SkerString;
    /** 输入模式 */
    input_schema?: SkerString;
    /** 输出模式 */
    output_schema?: SkerString;
    /** 是否已弃用 */
    deprecated?: boolean;
    /** 版本信息 */
    version?: SkerString;
    /** 标签 */
    tags?: SkerArray<SkerString>;
    /** 元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 服务注册表接口
 * Service registry interface
 */
interface ServiceRegistry {
    /** 注册表ID */
    registry_id: UUID;
    /** 注册表名称 */
    name: SkerString;
    /** 服务列表 */
    services: SkerMap<SkerString, SkerArray<ServiceInfo>>;
    /** 负载均衡策略 */
    load_balance_strategy: LoadBalanceStrategy;
    /** 服务发现配置 */
    discovery_config: {
        /** 启用服务发现 */
        enabled: boolean;
        /** 发现间隔（秒） */
        discovery_interval_seconds: number;
        /** 缓存TTL（秒） */
        cache_ttl_seconds: number;
        /** 故障转移启用 */
        failover_enabled: boolean;
        /** 断路器配置 */
        circuit_breaker?: {
            failure_threshold: number;
            recovery_timeout_seconds: number;
            half_open_max_calls: number;
        };
    };
    /** 注册表元数据 */
    metadata?: SkerRecord<string, unknown>;
    /** 创建时间 */
    created_at: SkerTimestamp;
    /** 最后更新时间 */
    last_updated: SkerTimestamp;
}
/**
 * 服务发现查询接口
 * Service discovery query interface
 */
interface ServiceDiscoveryQuery {
    /** 服务名称 */
    service_name?: SkerString;
    /** 服务版本 */
    service_version?: SkerString;
    /** 标签过滤器 */
    tags?: SkerArray<SkerString>;
    /** 健康状态过滤器 */
    health_status?: SkerArray<HealthStatus>;
    /** 能力过滤器 */
    capabilities?: SkerArray<SkerString>;
    /** 元数据过滤器 */
    metadata_filters?: SkerRecord<string, unknown>;
    /** 最大返回数量 */
    max_results?: number;
    /** 排序方式 */
    sort_by?: 'name' | 'version' | 'health' | 'load' | 'response_time';
    /** 排序方向 */
    sort_order?: 'asc' | 'desc';
}
/**
 * 服务发现结果接口
 * Service discovery result interface
 */
interface ServiceDiscoveryResult {
    /** 查询ID */
    query_id: UUID;
    /** 查询参数 */
    query: ServiceDiscoveryQuery;
    /** 匹配的服务列表 */
    services: SkerArray<ServiceInfo>;
    /** 总数量 */
    total_count: number;
    /** 查询时间 */
    query_time: SkerTimestamp;
    /** 查询耗时（毫秒） */
    query_duration_ms: number;
    /** 是否来自缓存 */
    from_cache: boolean;
    /** 缓存过期时间 */
    cache_expires_at?: SkerTimestamp;
}
/**
 * 服务依赖关系接口
 * Service dependency interface
 */
interface ServiceDependency {
    /** 依赖ID */
    dependency_id: UUID;
    /** 源服务 */
    source_service: SkerString;
    /** 目标服务 */
    target_service: SkerString;
    /** 依赖类型 */
    dependency_type: 'required' | 'optional' | 'conditional';
    /** 依赖强度 */
    strength: 'strong' | 'weak';
    /** 描述 */
    description?: SkerString;
    /** 版本约束 */
    version_constraint?: SkerString;
    /** 元数据 */
    metadata?: SkerRecord<string, unknown>;
    /** 创建时间 */
    created_at: SkerTimestamp;
}
/**
 * 服务部署信息接口
 * Service deployment information interface
 */
interface ServiceDeployment {
    /** 部署ID */
    deployment_id: UUID;
    /** 服务信息 */
    service_info: ServiceInfo;
    /** 部署环境 */
    environment: 'development' | 'testing' | 'staging' | 'production' | SkerString;
    /** 部署版本 */
    deployment_version: SkerString;
    /** 镜像信息 */
    image_info?: {
        registry: SkerString;
        repository: SkerString;
        tag: SkerString;
        digest?: SkerString;
    };
    /** 配置信息 */
    configuration: SkerRecord<string, unknown>;
    /** 资源限制 */
    resource_limits?: {
        cpu_cores?: number;
        memory_mb?: number;
        disk_gb?: number;
        network_bandwidth_mbps?: number;
    };
    /** 扩容配置 */
    scaling_config?: {
        min_instances: number;
        max_instances: number;
        target_cpu_utilization?: number;
        target_memory_utilization?: number;
        scale_up_threshold?: number;
        scale_down_threshold?: number;
    };
    /** 部署状态 */
    deployment_status: 'deploying' | 'running' | 'failed' | 'rolling_back' | 'stopped';
    /** 部署时间 */
    deployed_at: SkerTimestamp;
    /** 最后更新时间 */
    last_updated: SkerTimestamp;
    /** 部署日志 */
    deployment_logs?: SkerArray<SkerString>;
    /** 元数据 */
    metadata?: SkerRecord<string, unknown>;
}

/**
 * 认证授权类型定义
 * Authentication and authorization type definitions
 */

/**
 * 认证方法枚举
 * Authentication method enumeration
 */
declare enum AuthMethod {
    /** API密钥认证 */
    API_KEY = "api_key",
    /** OAuth 2.0认证 */
    OAUTH2 = "oauth2",
    /** JWT令牌认证 */
    JWT = "jwt",
    /** 基础认证（用户名密码） */
    BASIC = "basic",
    /** 双向TLS认证 */
    MTLS = "mtls",
    /** SAML认证 */
    SAML = "saml",
    /** 单点登录 */
    SSO = "sso",
    /** 多因子认证 */
    MFA = "mfa",
    /** 生物特征认证 */
    BIOMETRIC = "biometric",
    /** 匿名访问 */
    ANONYMOUS = "anonymous"
}
/**
 * OAuth2授权类型枚举
 * OAuth2 grant type enumeration
 */
declare enum OAuth2GrantType {
    /** 授权码模式 */
    AUTHORIZATION_CODE = "authorization_code",
    /** 隐式授权模式 */
    IMPLICIT = "implicit",
    /** 客户端凭据模式 */
    CLIENT_CREDENTIALS = "client_credentials",
    /** 密码模式 */
    PASSWORD = "password",
    /** 刷新令牌模式 */
    REFRESH_TOKEN = "refresh_token",
    /** 设备授权模式 */
    DEVICE_CODE = "device_code"
}
/**
 * 令牌类型枚举
 * Token type enumeration
 */
declare enum TokenType {
    /** 访问令牌 */
    ACCESS_TOKEN = "access_token",
    /** 刷新令牌 */
    REFRESH_TOKEN = "refresh_token",
    /** ID令牌 */
    ID_TOKEN = "id_token",
    /** API密钥 */
    API_KEY = "api_key",
    /** 会话令牌 */
    SESSION_TOKEN = "session_token"
}
/**
 * 用户状态枚举
 * User status enumeration
 */
declare enum UserStatus {
    /** 活跃 */
    ACTIVE = "active",
    /** 非活跃 */
    INACTIVE = "inactive",
    /** 暂停 */
    SUSPENDED = "suspended",
    /** 锁定 */
    LOCKED = "locked",
    /** 待验证 */
    PENDING_VERIFICATION = "pending_verification",
    /** 已删除 */
    DELETED = "deleted"
}
/**
 * 权限操作枚举
 * Permission action enumeration
 */
declare enum PermissionAction {
    /** 创建 */
    CREATE = "create",
    /** 读取 */
    READ = "read",
    /** 更新 */
    UPDATE = "update",
    /** 删除 */
    DELETE = "delete",
    /** 执行 */
    EXECUTE = "execute",
    /** 管理 */
    MANAGE = "manage",
    /** 所有权限 */
    ALL = "*"
}
/**
 * 权限效果枚举
 * Permission effect enumeration
 */
declare enum PermissionEffect {
    /** 允许 */
    ALLOW = "allow",
    /** 拒绝 */
    DENY = "deny"
}
/**
 * 基础认证信息接口
 * Basic authentication information interface
 */
interface AuthenticationInfo {
    /** 认证方法 */
    method: AuthMethod;
    /** 认证凭据 */
    credentials: SkerRecord<string, unknown>;
    /** 认证时间 */
    authenticated_at: SkerTimestamp;
    /** 过期时间 */
    expires_at?: SkerTimestamp;
    /** 认证来源 */
    auth_source?: SkerString;
    /** 会话ID */
    session_id?: UUID;
    /** 客户端信息 */
    client_info?: {
        ip_address: SkerString;
        user_agent: SkerString;
        device_id?: SkerString;
        platform?: SkerString;
    };
    /** 元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 授权令牌接口
 * Authorization token interface
 */
interface AuthorizationToken {
    /** 令牌值 */
    token: SkerString;
    /** 令牌类型 */
    token_type: TokenType;
    /** 颁发时间 */
    issued_at: SkerTimestamp;
    /** 过期时间 */
    expires_at: SkerTimestamp;
    /** 不早于时间 */
    not_before?: SkerTimestamp;
    /** 颁发者 */
    issuer: SkerString;
    /** 受众 */
    audience?: SkerArray<SkerString>;
    /** 主体（用户ID） */
    subject: SkerString;
    /** 作用域 */
    scopes?: SkerArray<SkerString>;
    /** 自定义声明 */
    claims?: SkerRecord<string, unknown>;
    /** 令牌指纹 */
    fingerprint?: SkerString;
}
/**
 * JWT令牌接口
 * JWT token interface
 */
interface JWTToken extends AuthorizationToken {
    token_type: TokenType.ACCESS_TOKEN | TokenType.ID_TOKEN;
    /** JWT头部 */
    header: {
        /** 算法 */
        alg: SkerString;
        /** 类型 */
        typ: 'JWT';
        /** 密钥ID */
        kid?: SkerString;
        /** 内容类型 */
        cty?: SkerString;
    };
    /** JWT载荷 */
    payload: {
        /** 颁发者 */
        iss: SkerString;
        /** 主体 */
        sub: SkerString;
        /** 受众 */
        aud: SkerString | SkerArray<SkerString>;
        /** 过期时间 */
        exp: number;
        /** 不早于时间 */
        nbf?: number;
        /** 颁发时间 */
        iat: number;
        /** JWT ID */
        jti: SkerString;
        /** 用户角色 */
        roles?: SkerArray<SkerString>;
        /** 用户权限 */
        permissions?: SkerArray<SkerString>;
        /** 租户ID */
        tenant_id?: SkerString;
        /** 自定义声明 */
        [key: string]: unknown;
    };
    /** JWT签名 */
    signature: SkerString;
}
/**
 * API密钥接口
 * API key interface
 */
interface APIKey extends AuthorizationToken {
    token_type: TokenType.API_KEY;
    /** 密钥名称 */
    key_name: SkerString;
    /** 密钥描述 */
    description?: SkerString;
    /** 密钥前缀 */
    key_prefix?: SkerString;
    /** 是否启用 */
    enabled: boolean;
    /** 使用次数限制 */
    usage_limit?: number;
    /** 已使用次数 */
    usage_count?: number;
    /** 最后使用时间 */
    last_used_at?: SkerTimestamp;
    /** IP白名单 */
    allowed_ips?: SkerArray<SkerString>;
    /** 引用站点白名单 */
    allowed_referrers?: SkerArray<SkerString>;
    /** 限流配置 */
    rate_limit?: {
        requests_per_minute: number;
        requests_per_hour: number;
        requests_per_day: number;
    };
}
/**
 * OAuth2令牌接口
 * OAuth2 token interface
 */
interface OAuth2Token extends AuthorizationToken {
    token_type: TokenType.ACCESS_TOKEN;
    /** 刷新令牌 */
    refresh_token?: SkerString;
    /** 授权类型 */
    grant_type: OAuth2GrantType;
    /** 客户端ID */
    client_id: SkerString;
    /** 重定向URI */
    redirect_uri?: SkerString;
    /** 授权码 */
    authorization_code?: SkerString;
    /** 状态参数 */
    state?: SkerString;
    /** PKCE码验证器 */
    code_verifier?: SkerString;
    /** PKCE码挑战 */
    code_challenge?: SkerString;
    /** PKCE码挑战方法 */
    code_challenge_method?: 'plain' | 'S256';
}
/**
 * 权限接口
 * Permission interface
 */
interface Permission {
    /** 权限ID */
    permission_id: UUID;
    /** 权限名称 */
    name: SkerString;
    /** 资源类型 */
    resource_type: SkerString;
    /** 资源ID */
    resource_id?: SkerString;
    /** 操作 */
    action: PermissionAction;
    /** 权限效果 */
    effect: PermissionEffect;
    /** 条件表达式 */
    conditions?: SkerRecord<string, unknown>;
    /** 权限描述 */
    description?: SkerString;
    /** 权限标签 */
    tags?: SkerArray<SkerString>;
    /** 是否启用 */
    enabled: boolean;
    /** 创建时间 */
    created_at: SkerTimestamp;
    /** 最后更新时间 */
    updated_at: SkerTimestamp;
    /** 元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 角色接口
 * Role interface
 */
interface Role {
    /** 角色ID */
    role_id: UUID;
    /** 角色名称 */
    role_name: SkerString;
    /** 角色显示名称 */
    display_name?: SkerString;
    /** 角色描述 */
    description?: SkerString;
    /** 权限列表 */
    permissions: SkerArray<Permission>;
    /** 父角色ID */
    parent_role_id?: UUID;
    /** 子角色ID列表 */
    child_role_ids?: SkerArray<UUID>;
    /** 角色优先级 */
    priority?: number;
    /** 是否内置角色 */
    is_built_in: boolean;
    /** 是否启用 */
    enabled: boolean;
    /** 角色标签 */
    tags?: SkerArray<SkerString>;
    /** 创建时间 */
    created_at: SkerTimestamp;
    /** 最后更新时间 */
    updated_at: SkerTimestamp;
    /** 元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 用户主体接口
 * User principal interface
 */
interface UserPrincipal {
    /** 用户ID */
    user_id: UUID;
    /** 用户名 */
    username: SkerString;
    /** 显示名称 */
    display_name?: SkerString;
    /** 邮箱地址 */
    email?: Email;
    /** 手机号码 */
    phone_number?: SkerString;
    /** 用户状态 */
    status: UserStatus;
    /** 角色列表 */
    roles: SkerArray<Role>;
    /** 权限列表 */
    permissions: SkerArray<Permission>;
    /** 用户组列表 */
    groups?: SkerArray<SkerString>;
    /** 租户ID */
    tenant_id?: UUID;
    /** 部门ID */
    department_id?: UUID;
    /** 最后登录时间 */
    last_login_at?: SkerTimestamp;
    /** 密码最后修改时间 */
    password_changed_at?: SkerTimestamp;
    /** 账户创建时间 */
    created_at: SkerTimestamp;
    /** 最后更新时间 */
    updated_at: SkerTimestamp;
    /** 用户偏好设置 */
    preferences?: SkerRecord<string, unknown>;
    /** 用户配置文件 */
    profile?: {
        first_name?: SkerString;
        last_name?: SkerString;
        avatar_url?: SkerString;
        timezone?: SkerString;
        locale?: SkerString;
        biography?: SkerString;
    };
    /** 安全设置 */
    security_settings?: {
        mfa_enabled: boolean;
        mfa_methods?: SkerArray<SkerString>;
        password_expiry_date?: SkerTimestamp;
        login_attempts: number;
        locked_until?: SkerTimestamp;
        require_password_change: boolean;
    };
    /** 用户元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 认证上下文接口
 * Authentication context interface
 */
interface AuthenticationContext {
    /** 用户主体 */
    user: SkerOptional<UserPrincipal>;
    /** 认证信息 */
    auth_info: AuthenticationInfo;
    /** 当前令牌 */
    token?: AuthorizationToken;
    /** 会话ID */
    session_id?: UUID;
    /** 认证是否有效 */
    is_authenticated: boolean;
    /** 是否为匿名用户 */
    is_anonymous: boolean;
    /** 权限列表 */
    permissions: SkerArray<SkerString>;
    /** 角色列表 */
    roles: SkerArray<SkerString>;
    /** 作用域列表 */
    scopes: SkerArray<SkerString>;
    /** 租户ID */
    tenant_id?: UUID;
    /** 客户端信息 */
    client_info?: {
        client_id?: SkerString;
        ip_address?: SkerString;
        user_agent?: SkerString;
        device_id?: SkerString;
    };
    /** 认证上下文元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 授权策略接口
 * Authorization policy interface
 */
interface AuthorizationPolicy {
    /** 策略ID */
    policy_id: UUID;
    /** 策略名称 */
    name: SkerString;
    /** 策略版本 */
    version: SkerString;
    /** 策略描述 */
    description?: SkerString;
    /** 策略规则 */
    rules: SkerArray<{
        rule_id: UUID;
        name: SkerString;
        condition: SkerString;
        effect: PermissionEffect;
        priority: number;
        enabled: boolean;
    }>;
    /** 是否启用 */
    enabled: boolean;
    /** 策略标签 */
    tags?: SkerArray<SkerString>;
    /** 创建时间 */
    created_at: SkerTimestamp;
    /** 最后更新时间 */
    updated_at: SkerTimestamp;
    /** 策略元数据 */
    metadata?: SkerRecord<string, unknown>;
}
/**
 * 授权请求接口
 * Authorization request interface
 */
interface AuthorizationRequest {
    /** 请求ID */
    request_id: UUID;
    /** 用户主体 */
    principal: UserPrincipal;
    /** 请求的资源 */
    resource: SkerString;
    /** 请求的操作 */
    action: PermissionAction;
    /** 请求上下文 */
    context?: SkerRecord<string, unknown>;
    /** 请求时间 */
    requested_at: SkerTimestamp;
    /** 请求来源 */
    source?: {
        ip_address?: SkerString;
        user_agent?: SkerString;
        service_id?: SkerString;
    };
}
/**
 * 授权结果接口
 * Authorization result interface
 */
interface AuthorizationResult {
    /** 请求ID */
    request_id: UUID;
    /** 授权是否通过 */
    authorized: boolean;
    /** 决策原因 */
    reason?: SkerString;
    /** 匹配的策略ID */
    matched_policy_id?: UUID;
    /** 匹配的规则ID */
    matched_rule_id?: UUID;
    /** 权限效果 */
    effect: PermissionEffect;
    /** 决策时间 */
    decision_time: SkerTimestamp;
    /** 决策耗时（毫秒） */
    decision_duration_ms: number;
    /** 建议操作 */
    suggested_actions?: SkerArray<SkerString>;
    /** 决策元数据 */
    metadata?: SkerRecord<string, unknown>;
}

/**
 * 验证器接口
 * Validator interface
 */
interface Validator<T> {
    validate(value: unknown): ValidationResult & {
        data?: T;
    };
}
/**
 * 字段验证规则接口
 * Field validation rule interface
 */
interface FieldValidationRule {
    field: string;
    required?: boolean;
    type?: string;
    validator?: (value: unknown) => boolean;
}
/**
 * 模式验证规则接口
 * Schema validation rule interface
 */
interface SchemaValidationRule {
    type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
    required?: string[];
}
/**
 * 基础类型验证器
 * Basic type validators
 */
declare const BasicValidators: {
    /**
     * 验证布尔类型
     * Validate boolean type
     */
    boolean(value: unknown): ValidationResult & {
        data?: boolean;
    };
    /**
     * 验证字符串类型
     * Validate string type
     */
    string(value: unknown): ValidationResult & {
        data?: string;
    };
};
/**
 * 集合类型验证器
 * Collection type validators
 */
declare const CollectionValidators: {
    /**
     * 验证数组类型
     * Validate array type
     */
    array(value: unknown): ValidationResult;
};
/**
 * 消息类型验证器
 * Message type validators
 */
declare const MessageValidators: {
    /**
     * 验证UDEF消息
     * Validate UDEF message
     */
    udefMessage(value: unknown): ValidationResult;
};
/**
 * 模式验证器
 * Schema validator
 */
declare class SchemaValidator<T = unknown> implements Validator<T> {
    constructor(_schema: SchemaValidationRule);
    validate(value: unknown): ValidationResult & {
        data?: T;
    };
}
/**
 * 通用验证函数
 * Generic validation functions
 */
declare const Validators: {
    /**
     * 验证消息格式
     * Validate message format
     */
    isValidMessage: (message: unknown) => message is UDEFMessage;
    /**
     * 验证时间戳
     * Validate timestamp
     */
    isValidTimestamp: (value: unknown) => value is SkerTimestamp;
    /**
     * 验证服务信息
     * Validate service info
     */
    isValidServiceInfo: (serviceInfo: unknown) => serviceInfo is ServiceInfo;
    /**
     * 通用类型验证
     * Generic type validation
     */
    validateType: <T>(data: unknown, validator: Validator<T>) => ValidationResult & {
        data?: T;
    };
};
/**
 * 导出验证工具集合
 * Export validation utilities collection
 */
declare const ValidationUtils: {
    BasicValidators: {
        /**
         * 验证布尔类型
         * Validate boolean type
         */
        boolean(value: unknown): ValidationResult & {
            data?: boolean;
        };
        /**
         * 验证字符串类型
         * Validate string type
         */
        string(value: unknown): ValidationResult & {
            data?: string;
        };
    };
    CollectionValidators: {
        /**
         * 验证数组类型
         * Validate array type
         */
        array(value: unknown): ValidationResult;
    };
    MessageValidators: {
        /**
         * 验证UDEF消息
         * Validate UDEF message
         */
        udefMessage(value: unknown): ValidationResult;
    };
    SchemaValidator: typeof SchemaValidator;
    Validators: {
        /**
         * 验证消息格式
         * Validate message format
         */
        isValidMessage: (message: unknown) => message is UDEFMessage;
        /**
         * 验证时间戳
         * Validate timestamp
         */
        isValidTimestamp: (value: unknown) => value is SkerTimestamp;
        /**
         * 验证服务信息
         * Validate service info
         */
        isValidServiceInfo: (serviceInfo: unknown) => serviceInfo is ServiceInfo;
        /**
         * 通用类型验证
         * Generic type validation
         */
        validateType: <T>(data: unknown, validator: Validator<T>) => ValidationResult & {
            data?: T;
        };
    };
};

/**
 * 类型转换工具函数（简化版）
 * Type conversion utility functions (simplified version)
 */
/**
 * 序列化格式枚举
 * Serialization format enumeration
 */
declare enum SerializationFormat {
    JSON = "json",
    PROTOBUF = "protobuf",
    MESSAGEPACK = "messagepack",
    AVRO = "avro",
    XML = "xml",
    YAML = "yaml",
    CBOR = "cbor"
}
/**
 * 序列化选项接口
 * Serialization options interface
 */
interface SerializationOptions {
    /** 是否美化输出（适用于JSON、XML等） */
    pretty?: boolean;
    /** 缩进字符（适用于JSON、XML等） */
    indent?: string | number;
}
/**
 * 反序列化选项接口
 * Deserialization options interface
 */
interface DeserializationOptions {
    /** 是否验证模式 */
    validate_schema?: boolean;
    /** 模式版本 */
    schema_version?: string;
}
/**
 * 转换结果接口
 * Conversion result interface
 */
interface ConversionResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    metadata?: {
        original_size?: number;
        converted_size?: number;
        conversion_time_ms?: number;
        format?: SerializationFormat;
    };
}
/**
 * Protocol Buffers转换器
 * Protocol Buffers converter
 */
declare const ProtobufConverter: {
    /**
     * 转换为Protocol Buffers格式
     * Convert to Protocol Buffers format
     */
    toProtobuf(data: unknown): ConversionResult<Uint8Array>;
    /**
     * 从Protocol Buffers格式转换
     * Convert from Protocol Buffers format
     */
    fromProtobuf(buffer: Uint8Array): ConversionResult<unknown>;
};
/**
 * JSON转换器
 * JSON converter
 */
declare const JSONConverter: {
    /**
     * 序列化为JSON
     * Serialize to JSON
     */
    serialize(data: unknown, options?: SerializationOptions): ConversionResult<string>;
    /**
     * 从JSON反序列化
     * Deserialize from JSON
     */
    deserialize(jsonString: string): ConversionResult<unknown>;
};
/**
 * 消息序列化器
 * Message serializer
 */
declare const MessageSerializer: {
    /**
     * 序列化消息
     * Serialize message
     */
    serializeMessage(message: unknown, format?: SerializationFormat, options?: SerializationOptions): ConversionResult<string | Uint8Array>;
    /**
     * 反序列化消息
     * Deserialize message
     */
    deserializeMessage(data: string | Uint8Array, format?: SerializationFormat): ConversionResult<unknown>;
};
/**
 * 导出转换工具集合
 * Export conversion utilities collection
 */
declare const ConversionUtils: {
    ProtobufConverter: {
        /**
         * 转换为Protocol Buffers格式
         * Convert to Protocol Buffers format
         */
        toProtobuf(data: unknown): ConversionResult<Uint8Array>;
        /**
         * 从Protocol Buffers格式转换
         * Convert from Protocol Buffers format
         */
        fromProtobuf(buffer: Uint8Array): ConversionResult<unknown>;
    };
    JSONConverter: {
        /**
         * 序列化为JSON
         * Serialize to JSON
         */
        serialize(data: unknown, options?: SerializationOptions): ConversionResult<string>;
        /**
         * 从JSON反序列化
         * Deserialize from JSON
         */
        deserialize(jsonString: string): ConversionResult<unknown>;
    };
    MessageSerializer: {
        /**
         * 序列化消息
         * Serialize message
         */
        serializeMessage(message: unknown, format?: SerializationFormat, options?: SerializationOptions): ConversionResult<string | Uint8Array>;
        /**
         * 反序列化消息
         * Deserialize message
         */
        deserializeMessage(data: string | Uint8Array, format?: SerializationFormat): ConversionResult<unknown>;
    };
    SerializationFormat: typeof SerializationFormat;
};

/**
 * 工厂函数（简化版） - 用于创建标准化的类型实例
 * Factory functions (simplified version) - for creating standardized type instances
 */

/**
 * 消息创建选项接口
 * Message creation options interface
 */
interface CreateMessageOptions {
    message_type: string;
    service_name: SkerString;
    service_version?: SkerString;
    service_id?: UUID;
    content_type?: string;
    priority?: number;
    ttl?: number;
    correlation_id?: UUID;
    trace_id?: SkerString;
}
/**
 * 错误响应创建选项接口
 * Error response creation options interface
 */
interface CreateErrorResponseOptions {
    code: SkerString;
    message: SkerString;
    level?: string;
    severity?: number;
    http_status?: number;
    details?: ErrorDetail[];
    help_url?: SkerString;
    retryable?: boolean;
    retry_after_ms?: number;
    api_version?: SkerString;
    request_id?: UUID;
}
/**
 * 服务信息创建选项接口
 * Service info creation options interface
 */
interface CreateServiceInfoOptions {
    service_name: SkerString;
    service_version: SkerString;
    host: SkerString;
    port: number;
    protocol?: string;
    description?: SkerString;
    tags?: SkerString[];
}
/**
 * JWT令牌创建选项接口
 * JWT token creation options interface
 */
interface CreateJWTTokenOptions {
    user_id: SkerString;
    issuer: SkerString;
    audience?: SkerString;
    expires_in_seconds?: number;
    roles?: SkerString[];
    permissions?: SkerString[];
}
/**
 * 消息工厂
 * Message factory
 */
declare const MessageFactory: {
    /**
     * 创建标准消息
     * Create standard message
     */
    createMessage<TData = unknown>(data: TData, options: CreateMessageOptions): UDEFMessage;
};
/**
 * 错误工厂
 * Error factory
 */
declare const ErrorFactory: {
    /**
     * 创建错误响应
     * Create error response
     */
    createErrorResponse(options: CreateErrorResponseOptions): ErrorResponse;
    /**
     * 创建成功响应
     * Create success response
     */
    createSuccessResponse<TData = unknown>(data: TData, options?: {
        api_version?: SkerString;
        request_id?: UUID;
    }): SuccessResponse<TData>;
};
/**
 * 服务工厂
 * Service factory
 */
declare const ServiceFactory: {
    /**
     * 创建服务信息
     * Create service info
     */
    createServiceInfo(options: CreateServiceInfoOptions): ServiceInfo;
};
/**
 * 认证工厂
 * Auth factory
 */
declare const AuthFactory: {
    /**
     * 创建JWT令牌（简化版）
     * Create JWT token (simplified version)
     */
    createJWTToken(options: CreateJWTTokenOptions): any;
};
/**
 * 导出工厂函数集合
 * Export factory functions collection
 */
declare const Factories: {
    MessageFactory: {
        /**
         * 创建标准消息
         * Create standard message
         */
        createMessage<TData = unknown>(data: TData, options: CreateMessageOptions): UDEFMessage;
    };
    ErrorFactory: {
        /**
         * 创建错误响应
         * Create error response
         */
        createErrorResponse(options: CreateErrorResponseOptions): ErrorResponse;
        /**
         * 创建成功响应
         * Create success response
         */
        createSuccessResponse<TData = unknown>(data: TData, options?: {
            api_version?: SkerString;
            request_id?: UUID;
        }): SuccessResponse<TData>;
    };
    ServiceFactory: {
        /**
         * 创建服务信息
         * Create service info
         */
        createServiceInfo(options: CreateServiceInfoOptions): ServiceInfo;
    };
    AuthFactory: {
        /**
         * 创建JWT令牌（简化版）
         * Create JWT token (simplified version)
         */
        createJWTToken(options: CreateJWTTokenOptions): any;
    };
};

/**
 * @sker/types - Sker通用类型定义包
 * Universal type definitions package for Sker communication framework
 *
 * 提供跨语言类型映射和统一数据类型定义
 * Provides cross-language type mappings and unified data type definitions
 */

/**
 * 包版本信息
 * Package version information
 */
declare const VERSION = "1.0.0";
/**
 * API版本信息
 * API version information
 */
declare const API_VERSION = "1.0.0";
/**
 * 支持的协议版本
 * Supported protocol versions
 */
declare const SUPPORTED_PROTOCOL_VERSIONS: string[];
/**
 * 默认配置
 * Default configuration
 */
declare const DEFAULT_CONFIG: {
    readonly message: {
        readonly default_content_type: "application/json";
        readonly default_message_priority: 5;
        readonly default_ttl_seconds: 3600;
        readonly default_schema_version: "1.0.0";
    };
    readonly service: {
        readonly default_protocol: "http";
        readonly default_health_check_interval_seconds: 30;
        readonly default_health_check_timeout_seconds: 10;
        readonly default_load_balance_weight: 100;
    };
    readonly auth: {
        readonly default_token_expires_in_seconds: 3600;
        readonly default_jwt_algorithm: "HS256";
    };
    readonly validation: {
        readonly strict_mode: false;
        readonly validate_schema: true;
    };
    readonly serialization: {
        readonly default_format: "json";
        readonly pretty_print: false;
        readonly include_metadata: true;
    };
};
/**
 * 检查值是否为成功响应
 * Check if value is success response
 */
declare function isSuccessResponse(response: any): boolean;
/**
 * 检查值是否为错误响应
 * Check if value is error response
 */
declare function isErrorResponse(response: any): boolean;
/**
 * 检查值是否为请求消息
 * Check if value is request message
 */
declare function isRequestMessage(message: any): boolean;
/**
 * 检查值是否为响应消息
 * Check if value is response message
 */
declare function isResponseMessage(message: any): boolean;
/**
 * 检查值是否为事件消息
 * Check if value is event message
 */
declare function isEventMessage(message: any): boolean;
/**
 * 检查服务是否健康
 * Check if service is healthy
 */
declare function isServiceHealthy(service: any): boolean;
/**
 * 检查用户是否活跃
 * Check if user is active
 */
declare function isUserActive(user: any): boolean;

export { type APIKey, API_VERSION, AuthFactory, AuthMethod, type AuthenticationContext, type AuthenticationInfo, type AuthorizationPolicy, type AuthorizationRequest, type AuthorizationResult, type AuthorizationToken, type BaseException, BasicTypes, BasicValidators, type Brand, type BusinessException, CollectionTypes, CollectionValidators, type CommandMessage, ContentType, type ConversionResult, ConversionUtils, type CreateErrorResponseOptions, type CreateJWTTokenOptions, type CreateMessageOptions, type CreateServiceInfoOptions, DEFAULT_CONFIG, type DeserializationOptions, type Email, type ErrorAggregation, ErrorCodes, type ErrorDetail, ErrorFactory, ErrorLevel, type ErrorResponse, ErrorSeverity, type ErrorStackTrace, type EventMessage, Factories, type FieldValidationRule, type HealthCheckConfig, HealthStatus, type HeartbeatMessage, HttpStatusCode, JSONConverter, type JWTToken, LoadBalanceStrategy, type MessageAck, type MessageBatch, type MessageEnvelope, MessageFactory, type MessageFilter, type MessageHeader, type MessageMetadata, type MessagePayload, MessagePriority, type MessageRoutingRule, MessageSerializer, type MessageStats, type MessageTransformation, MessageType, MessageValidators, type MoneyAmount, type NetworkInfo, type NotificationMessage, OAuth2GrantType, type OAuth2Token, type Permission, PermissionAction, PermissionEffect, ProtobufConverter, Protocol, type RequestMessage, type ResponseMessage, type Role, SUPPORTED_PROTOCOL_VERSIONS, type SchemaValidationRule, SchemaValidator, type SecurityException, SerializationFormat, type SerializationOptions, type ServiceDependency, type ServiceDeployment, type ServiceDiscoveryQuery, type ServiceDiscoveryResult, type ServiceEndpoint, ServiceFactory, type ServiceInfo$1 as ServiceInfo, type ServiceInfo as ServiceInfoType, type ServiceMetrics, type ServiceRegistry, type ServiceResult, ServiceState, type SkerArray, type SkerBoolean, type SkerDecimal, type SkerFloat, type SkerInteger, type SkerMap, type SkerOptional, type SkerRecord, type SkerSet, type SkerString, type SkerTimestamp, type SkerTuple, type SuccessResponse, type SystemException, TokenType, type TypedUDEFMessage, type UDEFMessage, type URL, type UUID, type UserPrincipal, UserStatus, VERSION, type ValidationResult, ValidationUtils, type Validator, Validators, isErrorResponse, isEventMessage, isRequestMessage, isResponseMessage, isServiceHealthy, isSuccessResponse, isUserActive };
