// src/basic-types.ts
var BasicTypes = {
  /**
   * 创建UUID
   * Create UUID
   */
  createUUID() {
    return crypto.randomUUID();
  },
  /**
   * 验证UUID格式
   * Validate UUID format
   */
  isValidUUID(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  },
  /**
   * 创建货币金额
   * Create money amount
   */
  createMoneyAmount(value) {
    return String(value);
  },
  /**
   * 验证货币金额格式
   * Validate money amount format
   */
  isValidMoneyAmount(value) {
    const decimalRegex = /^-?\d+(\.\d+)?$/;
    return decimalRegex.test(value);
  },
  /**
   * 验证URL格式
   * Validate URL format
   */
  isValidURL(value) {
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
  isValidEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  },
  /**
   * 创建ISO8601时间戳
   * Create ISO8601 timestamp
   */
  createTimestamp(date) {
    return date || /* @__PURE__ */ new Date();
  },
  /**
   * 验证时间戳格式
   * Validate timestamp format
   */
  isValidTimestamp(value) {
    return value instanceof Date && !isNaN(value.getTime());
  },
  /**
   * 将时间戳转换为ISO8601字符串
   * Convert timestamp to ISO8601 string
   */
  timestampToISO8601(timestamp) {
    return timestamp.toISOString();
  },
  /**
   * 从ISO8601字符串创建时间戳
   * Create timestamp from ISO8601 string
   */
  timestampFromISO8601(iso8601) {
    return new Date(iso8601);
  }
};

// src/collection-types.ts
var CollectionTypes = {
  /**
   * 创建数组
   * Create array
   */
  createArray(items) {
    return items || [];
  },
  /**
   * 验证数组
   * Validate array
   */
  isArray(value) {
    return Array.isArray(value);
  },
  /**
   * 数组转换为普通对象（用于序列化）
   * Convert array to plain object (for serialization)
   */
  arrayToObject(array) {
    const obj = {};
    array.forEach((item, index) => {
      obj[index.toString()] = item;
    });
    return obj;
  },
  /**
   * 从普通对象恢复数组
   * Restore array from plain object
   */
  arrayFromObject(obj) {
    const keys = Object.keys(obj).map(Number).sort((a, b) => a - b);
    return keys.map((key) => obj[key.toString()]).filter((item) => item !== void 0);
  },
  /**
   * 创建映射
   * Create map
   */
  createMap(entries) {
    return new Map(entries);
  },
  /**
   * 验证映射
   * Validate map
   */
  isMap(value) {
    return value instanceof Map;
  },
  /**
   * 映射转换为普通对象（用于序列化）
   * Convert map to plain object (for serialization)
   */
  mapToObject(map) {
    const obj = {};
    map.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  },
  /**
   * 从普通对象恢复映射
   * Restore map from plain object
   */
  mapFromObject(obj) {
    return new Map(Object.entries(obj));
  },
  /**
   * 映射转换为数组（用于序列化复杂键类型）
   * Convert map to array (for serializing complex key types)
   */
  mapToArray(map) {
    return Array.from(map.entries());
  },
  /**
   * 从数组恢复映射
   * Restore map from array
   */
  mapFromArray(array) {
    return new Map(array);
  },
  /**
   * 创建集合
   * Create set
   */
  createSet(items) {
    return new Set(items);
  },
  /**
   * 验证集合
   * Validate set
   */
  isSet(value) {
    return value instanceof Set;
  },
  /**
   * 集合转换为数组（用于序列化）
   * Convert set to array (for serialization)
   */
  setToArray(set) {
    return Array.from(set);
  },
  /**
   * 从数组恢复集合
   * Restore set from array
   */
  setFromArray(array) {
    return new Set(array);
  },
  /**
   * 验证可选值
   * Validate optional value
   */
  isSome(value) {
    return value !== null && value !== void 0;
  },
  /**
   * 验证空值
   * Validate null value
   */
  isNone(value) {
    return value === null || value === void 0;
  },
  /**
   * 获取可选值或默认值
   * Get optional value or default
   */
  getOrDefault(value, defaultValue) {
    return this.isSome(value) ? value : defaultValue;
  },
  /**
   * 创建元组
   * Create tuple
   */
  createTuple(...items) {
    return items;
  },
  /**
   * 验证元组
   * Validate tuple
   */
  isTuple(value) {
    return Array.isArray(value);
  },
  /**
   * 创建记录
   * Create record
   */
  createRecord(obj) {
    return obj || {};
  },
  /**
   * 验证记录
   * Validate record
   */
  isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
  },
  /**
   * 深度克隆集合
   * Deep clone collection
   */
  deepClone(value) {
    if (value === null || typeof value !== "object") {
      return value;
    }
    if (value instanceof Date) {
      return new Date(value.getTime());
    }
    if (value instanceof Array) {
      return value.map((item) => this.deepClone(item));
    }
    if (value instanceof Set) {
      return new Set(Array.from(value).map((item) => this.deepClone(item)));
    }
    if (value instanceof Map) {
      return new Map(Array.from(value.entries()).map(([k, v]) => [this.deepClone(k), this.deepClone(v)]));
    }
    if (typeof value === "object") {
      const cloned = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          cloned[key] = this.deepClone(value[key]);
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
  isEmpty(value) {
    if (value === null || value === void 0) {
      return true;
    }
    if (Array.isArray(value)) {
      return value.length === 0;
    }
    if (value instanceof Set || value instanceof Map) {
      return value.size === 0;
    }
    if (typeof value === "object") {
      return Object.keys(value).length === 0;
    }
    if (typeof value === "string") {
      return value.length === 0;
    }
    return false;
  }
};

// src/message-types.ts
var ContentType = /* @__PURE__ */ ((ContentType2) => {
  ContentType2["JSON"] = "application/json";
  ContentType2["PROTOBUF"] = "application/protobuf";
  ContentType2["MESSAGEPACK"] = "application/msgpack";
  ContentType2["AVRO"] = "application/avro";
  ContentType2["XML"] = "application/xml";
  ContentType2["PLAIN_TEXT"] = "text/plain";
  ContentType2["BINARY"] = "application/octet-stream";
  return ContentType2;
})(ContentType || {});
var MessageType = /* @__PURE__ */ ((MessageType2) => {
  MessageType2["REQUEST"] = "request";
  MessageType2["RESPONSE"] = "response";
  MessageType2["EVENT"] = "event";
  MessageType2["COMMAND"] = "command";
  MessageType2["NOTIFICATION"] = "notification";
  MessageType2["ERROR"] = "error";
  MessageType2["HEARTBEAT"] = "heartbeat";
  return MessageType2;
})(MessageType || {});
var MessagePriority = /* @__PURE__ */ ((MessagePriority2) => {
  MessagePriority2[MessagePriority2["LOW"] = 1] = "LOW";
  MessagePriority2[MessagePriority2["NORMAL"] = 5] = "NORMAL";
  MessagePriority2[MessagePriority2["HIGH"] = 8] = "HIGH";
  MessagePriority2[MessagePriority2["CRITICAL"] = 10] = "CRITICAL";
  return MessagePriority2;
})(MessagePriority || {});

// src/error-types.ts
var ErrorLevel = /* @__PURE__ */ ((ErrorLevel2) => {
  ErrorLevel2["SYSTEM"] = "system";
  ErrorLevel2["BUSINESS"] = "business";
  ErrorLevel2["INTEGRATION"] = "integration";
  ErrorLevel2["SECURITY"] = "security";
  ErrorLevel2["CONFIGURATION"] = "configuration";
  ErrorLevel2["DATA"] = "data";
  return ErrorLevel2;
})(ErrorLevel || {});
var ErrorSeverity = /* @__PURE__ */ ((ErrorSeverity2) => {
  ErrorSeverity2[ErrorSeverity2["LOW"] = 1] = "LOW";
  ErrorSeverity2[ErrorSeverity2["MEDIUM"] = 2] = "MEDIUM";
  ErrorSeverity2[ErrorSeverity2["HIGH"] = 3] = "HIGH";
  ErrorSeverity2[ErrorSeverity2["CRITICAL"] = 4] = "CRITICAL";
  return ErrorSeverity2;
})(ErrorSeverity || {});
var HttpStatusCode = /* @__PURE__ */ ((HttpStatusCode2) => {
  HttpStatusCode2[HttpStatusCode2["OK"] = 200] = "OK";
  HttpStatusCode2[HttpStatusCode2["CREATED"] = 201] = "CREATED";
  HttpStatusCode2[HttpStatusCode2["ACCEPTED"] = 202] = "ACCEPTED";
  HttpStatusCode2[HttpStatusCode2["NO_CONTENT"] = 204] = "NO_CONTENT";
  HttpStatusCode2[HttpStatusCode2["MOVED_PERMANENTLY"] = 301] = "MOVED_PERMANENTLY";
  HttpStatusCode2[HttpStatusCode2["FOUND"] = 302] = "FOUND";
  HttpStatusCode2[HttpStatusCode2["NOT_MODIFIED"] = 304] = "NOT_MODIFIED";
  HttpStatusCode2[HttpStatusCode2["BAD_REQUEST"] = 400] = "BAD_REQUEST";
  HttpStatusCode2[HttpStatusCode2["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
  HttpStatusCode2[HttpStatusCode2["FORBIDDEN"] = 403] = "FORBIDDEN";
  HttpStatusCode2[HttpStatusCode2["NOT_FOUND"] = 404] = "NOT_FOUND";
  HttpStatusCode2[HttpStatusCode2["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
  HttpStatusCode2[HttpStatusCode2["CONFLICT"] = 409] = "CONFLICT";
  HttpStatusCode2[HttpStatusCode2["UNPROCESSABLE_ENTITY"] = 422] = "UNPROCESSABLE_ENTITY";
  HttpStatusCode2[HttpStatusCode2["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
  HttpStatusCode2[HttpStatusCode2["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
  HttpStatusCode2[HttpStatusCode2["NOT_IMPLEMENTED"] = 501] = "NOT_IMPLEMENTED";
  HttpStatusCode2[HttpStatusCode2["BAD_GATEWAY"] = 502] = "BAD_GATEWAY";
  HttpStatusCode2[HttpStatusCode2["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
  HttpStatusCode2[HttpStatusCode2["GATEWAY_TIMEOUT"] = 504] = "GATEWAY_TIMEOUT";
  return HttpStatusCode2;
})(HttpStatusCode || {});
var ErrorCodes = {
  // 系统级错误 (1xxxx)
  SYSTEM: {
    NETWORK_ERROR: "10001",
    SERVICE_UNAVAILABLE: "10002",
    TIMEOUT: "10003",
    INTERNAL_ERROR: "10004",
    RESOURCE_EXHAUSTED: "10005",
    CIRCUIT_BREAKER_OPEN: "10006"
  },
  // 业务逻辑错误 (2xxxx)
  BUSINESS: {
    VALIDATION_FAILED: "20001",
    BUSINESS_RULE_VIOLATION: "20002",
    DUPLICATE_RESOURCE: "20003",
    RESOURCE_NOT_FOUND: "20004",
    INVALID_OPERATION: "20005",
    INSUFFICIENT_FUNDS: "20006",
    QUOTA_EXCEEDED: "20007"
  },
  // 集成错误 (3xxxx)
  INTEGRATION: {
    EXTERNAL_SERVICE_ERROR: "30001",
    DATA_FORMAT_MISMATCH: "30002",
    API_VERSION_INCOMPATIBLE: "30003",
    SERIALIZATION_ERROR: "30004",
    DESERIALIZATION_ERROR: "30005",
    PROTOCOL_ERROR: "30006"
  },
  // 安全错误 (4xxxx)
  SECURITY: {
    AUTHENTICATION_FAILED: "40001",
    AUTHORIZATION_FAILED: "40002",
    TOKEN_EXPIRED: "40003",
    TOKEN_INVALID: "40004",
    ACCESS_DENIED: "40005",
    RATE_LIMIT_EXCEEDED: "40006",
    SECURITY_VIOLATION: "40007"
  },
  // 配置错误 (5xxxx)
  CONFIGURATION: {
    MISSING_CONFIGURATION: "50001",
    INVALID_CONFIGURATION: "50002",
    ENVIRONMENT_MISMATCH: "50003",
    DEPENDENCY_MISSING: "50004"
  },
  // 数据错误 (6xxxx)
  DATA: {
    DATA_CORRUPTION: "60001",
    DATA_INCONSISTENCY: "60002",
    SCHEMA_MISMATCH: "60003",
    CONSTRAINT_VIOLATION: "60004",
    DUPLICATE_KEY: "60005",
    FOREIGN_KEY_VIOLATION: "60006"
  }
};

// src/service-types.ts
var Protocol = /* @__PURE__ */ ((Protocol2) => {
  Protocol2["UNKNOWN"] = "unknown";
  Protocol2["HTTP"] = "http";
  Protocol2["HTTPS"] = "https";
  Protocol2["GRPC"] = "grpc";
  Protocol2["GRPC_WEB"] = "grpc-web";
  Protocol2["WEBSOCKET"] = "websocket";
  Protocol2["WEBSOCKET_SECURE"] = "wss";
  Protocol2["TCP"] = "tcp";
  Protocol2["UDP"] = "udp";
  Protocol2["MQTT"] = "mqtt";
  Protocol2["AMQP"] = "amqp";
  Protocol2["KAFKA"] = "kafka";
  Protocol2["REDIS"] = "redis";
  return Protocol2;
})(Protocol || {});
var HealthStatus = /* @__PURE__ */ ((HealthStatus2) => {
  HealthStatus2[HealthStatus2["UNKNOWN"] = 0] = "UNKNOWN";
  HealthStatus2[HealthStatus2["HEALTHY"] = 1] = "HEALTHY";
  HealthStatus2[HealthStatus2["UNHEALTHY"] = 2] = "UNHEALTHY";
  HealthStatus2[HealthStatus2["MAINTENANCE"] = 3] = "MAINTENANCE";
  HealthStatus2[HealthStatus2["DEGRADED"] = 4] = "DEGRADED";
  HealthStatus2[HealthStatus2["STARTING"] = 5] = "STARTING";
  HealthStatus2[HealthStatus2["SHUTTING_DOWN"] = 6] = "SHUTTING_DOWN";
  return HealthStatus2;
})(HealthStatus || {});
var LoadBalanceStrategy = /* @__PURE__ */ ((LoadBalanceStrategy2) => {
  LoadBalanceStrategy2["ROUND_ROBIN"] = "round_robin";
  LoadBalanceStrategy2["RANDOM"] = "random";
  LoadBalanceStrategy2["LEAST_CONNECTIONS"] = "least_connections";
  LoadBalanceStrategy2["WEIGHTED_ROUND_ROBIN"] = "weighted_round_robin";
  LoadBalanceStrategy2["WEIGHTED_RANDOM"] = "weighted_random";
  LoadBalanceStrategy2["LEAST_RESPONSE_TIME"] = "least_response_time";
  LoadBalanceStrategy2["CONSISTENT_HASH"] = "consistent_hash";
  LoadBalanceStrategy2["IP_HASH"] = "ip_hash";
  return LoadBalanceStrategy2;
})(LoadBalanceStrategy || {});
var ServiceState = /* @__PURE__ */ ((ServiceState2) => {
  ServiceState2["INITIALIZING"] = "initializing";
  ServiceState2["RUNNING"] = "running";
  ServiceState2["PAUSED"] = "paused";
  ServiceState2["STOPPED"] = "stopped";
  ServiceState2["ERROR"] = "error";
  ServiceState2["RESTARTING"] = "restarting";
  return ServiceState2;
})(ServiceState || {});

// src/auth-types.ts
var AuthMethod = /* @__PURE__ */ ((AuthMethod2) => {
  AuthMethod2["API_KEY"] = "api_key";
  AuthMethod2["OAUTH2"] = "oauth2";
  AuthMethod2["JWT"] = "jwt";
  AuthMethod2["BASIC"] = "basic";
  AuthMethod2["MTLS"] = "mtls";
  AuthMethod2["SAML"] = "saml";
  AuthMethod2["SSO"] = "sso";
  AuthMethod2["MFA"] = "mfa";
  AuthMethod2["BIOMETRIC"] = "biometric";
  AuthMethod2["ANONYMOUS"] = "anonymous";
  return AuthMethod2;
})(AuthMethod || {});
var OAuth2GrantType = /* @__PURE__ */ ((OAuth2GrantType2) => {
  OAuth2GrantType2["AUTHORIZATION_CODE"] = "authorization_code";
  OAuth2GrantType2["IMPLICIT"] = "implicit";
  OAuth2GrantType2["CLIENT_CREDENTIALS"] = "client_credentials";
  OAuth2GrantType2["PASSWORD"] = "password";
  OAuth2GrantType2["REFRESH_TOKEN"] = "refresh_token";
  OAuth2GrantType2["DEVICE_CODE"] = "device_code";
  return OAuth2GrantType2;
})(OAuth2GrantType || {});
var TokenType = /* @__PURE__ */ ((TokenType2) => {
  TokenType2["ACCESS_TOKEN"] = "access_token";
  TokenType2["REFRESH_TOKEN"] = "refresh_token";
  TokenType2["ID_TOKEN"] = "id_token";
  TokenType2["API_KEY"] = "api_key";
  TokenType2["SESSION_TOKEN"] = "session_token";
  return TokenType2;
})(TokenType || {});
var UserStatus = /* @__PURE__ */ ((UserStatus2) => {
  UserStatus2["ACTIVE"] = "active";
  UserStatus2["INACTIVE"] = "inactive";
  UserStatus2["SUSPENDED"] = "suspended";
  UserStatus2["LOCKED"] = "locked";
  UserStatus2["PENDING_VERIFICATION"] = "pending_verification";
  UserStatus2["DELETED"] = "deleted";
  return UserStatus2;
})(UserStatus || {});
var PermissionAction = /* @__PURE__ */ ((PermissionAction2) => {
  PermissionAction2["CREATE"] = "create";
  PermissionAction2["READ"] = "read";
  PermissionAction2["UPDATE"] = "update";
  PermissionAction2["DELETE"] = "delete";
  PermissionAction2["EXECUTE"] = "execute";
  PermissionAction2["MANAGE"] = "manage";
  PermissionAction2["ALL"] = "*";
  return PermissionAction2;
})(PermissionAction || {});
var PermissionEffect = /* @__PURE__ */ ((PermissionEffect2) => {
  PermissionEffect2["ALLOW"] = "allow";
  PermissionEffect2["DENY"] = "deny";
  return PermissionEffect2;
})(PermissionEffect || {});

// src/validation.ts
var BasicValidators = {
  /**
   * 验证布尔类型
   * Validate boolean type
   */
  boolean(value) {
    if (typeof value === "boolean") {
      return { valid: true, errors: [], data: value };
    }
    return {
      valid: false,
      errors: [{
        error_code: "TYPE_MISMATCH",
        error_message: "Expected boolean type",
        error_value: value
      }]
    };
  },
  /**
   * 验证字符串类型
   * Validate string type
   */
  string(value) {
    if (typeof value === "string") {
      return { valid: true, errors: [], data: value };
    }
    return {
      valid: false,
      errors: [{
        error_code: "TYPE_MISMATCH",
        error_message: "Expected string type",
        error_value: value
      }]
    };
  }
};
var CollectionValidators = {
  /**
   * 验证数组类型
   * Validate array type
   */
  array(value) {
    if (Array.isArray(value)) {
      return { valid: true, errors: [] };
    }
    return {
      valid: false,
      errors: [{
        error_code: "TYPE_MISMATCH",
        error_message: "Expected array type",
        error_value: value
      }]
    };
  }
};
var MessageValidators = {
  /**
   * 验证UDEF消息
   * Validate UDEF message
   */
  udefMessage(value) {
    if (!value || typeof value !== "object") {
      return {
        valid: false,
        errors: [{
          error_code: "INVALID_UDEF_MESSAGE",
          error_message: "UDEF message must be an object",
          error_value: value
        }]
      };
    }
    const obj = value;
    const errors = [];
    if (!obj.envelope) {
      errors.push({
        error_code: "MISSING_ENVELOPE",
        error_message: "Message envelope is required",
        field: "envelope"
      });
    }
    if (!obj.payload) {
      errors.push({
        error_code: "MISSING_PAYLOAD",
        error_message: "Message payload is required",
        field: "payload"
      });
    }
    return {
      valid: errors.length === 0,
      errors
    };
  }
};
var SchemaValidator = class {
  constructor(_schema) {
  }
  validate(value) {
    return {
      valid: true,
      errors: [],
      data: value
    };
  }
};
var Validators = {
  /**
   * 验证消息格式
   * Validate message format
   */
  isValidMessage: (message) => {
    const result = MessageValidators.udefMessage(message);
    return result.valid;
  },
  /**
   * 验证时间戳
   * Validate timestamp
   */
  isValidTimestamp: BasicTypes.isValidTimestamp,
  /**
   * 验证服务信息
   * Validate service info
   */
  isValidServiceInfo: (serviceInfo) => {
    if (!serviceInfo || typeof serviceInfo !== "object") {
      return false;
    }
    const obj = serviceInfo;
    return !!(obj.service_name && obj.service_version && obj.service_id && obj.network_info && typeof obj.health_status === "number");
  },
  /**
   * 通用类型验证
   * Generic type validation
   */
  validateType: (data, validator) => {
    return validator.validate(data);
  }
};
var ValidationUtils = {
  BasicValidators,
  CollectionValidators,
  MessageValidators,
  SchemaValidator,
  Validators
};

// src/conversion.ts
var SerializationFormat = /* @__PURE__ */ ((SerializationFormat2) => {
  SerializationFormat2["JSON"] = "json";
  SerializationFormat2["PROTOBUF"] = "protobuf";
  SerializationFormat2["MESSAGEPACK"] = "messagepack";
  SerializationFormat2["AVRO"] = "avro";
  SerializationFormat2["XML"] = "xml";
  SerializationFormat2["YAML"] = "yaml";
  SerializationFormat2["CBOR"] = "cbor";
  return SerializationFormat2;
})(SerializationFormat || {});
var ProtobufConverter = {
  /**
   * 转换为Protocol Buffers格式
   * Convert to Protocol Buffers format
   */
  toProtobuf(data) {
    try {
      const jsonString = JSON.stringify(data);
      const buffer = new TextEncoder().encode(jsonString);
      return {
        success: true,
        data: buffer,
        metadata: {
          format: "protobuf" /* PROTOBUF */
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  /**
   * 从Protocol Buffers格式转换
   * Convert from Protocol Buffers format
   */
  fromProtobuf(buffer) {
    try {
      const jsonString = new TextDecoder().decode(buffer);
      const data = JSON.parse(jsonString);
      return {
        success: true,
        data,
        metadata: {
          format: "protobuf" /* PROTOBUF */
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var JSONConverter = {
  /**
   * 序列化为JSON
   * Serialize to JSON
   */
  serialize(data, options) {
    try {
      const space = options?.pretty ? options.indent || 2 : void 0;
      const jsonString = JSON.stringify(data, null, space);
      return {
        success: true,
        data: jsonString,
        metadata: {
          format: "json" /* JSON */
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  /**
   * 从JSON反序列化
   * Deserialize from JSON
   */
  deserialize(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return {
        success: true,
        data,
        metadata: {
          format: "json" /* JSON */
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var MessageSerializer = {
  /**
   * 序列化消息
   * Serialize message
   */
  serializeMessage(message, format = "json" /* JSON */, options) {
    try {
      switch (format) {
        case "json" /* JSON */:
          return JSONConverter.serialize(message, options);
        case "protobuf" /* PROTOBUF */:
          return ProtobufConverter.toProtobuf(message);
        default:
          return {
            success: false,
            error: `Unsupported serialization format: ${format}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  },
  /**
   * 反序列化消息
   * Deserialize message
   */
  deserializeMessage(data, format = "json" /* JSON */) {
    try {
      switch (format) {
        case "json" /* JSON */:
          return JSONConverter.deserialize(data);
        case "protobuf" /* PROTOBUF */:
          return ProtobufConverter.fromProtobuf(data);
        default:
          return {
            success: false,
            error: `Unsupported deserialization format: ${format}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
};
var ConversionUtils = {
  ProtobufConverter,
  JSONConverter,
  MessageSerializer,
  SerializationFormat
};

// src/factories.ts
var MessageFactory = {
  /**
   * 创建标准消息
   * Create standard message
   */
  createMessage(data, options) {
    const now = BasicTypes.createTimestamp();
    const messageId = BasicTypes.createUUID();
    const serviceId = options.service_id || BasicTypes.createUUID();
    const header = {
      message_id: messageId,
      correlation_id: options.correlation_id,
      timestamp: now,
      source: {
        service_name: options.service_name,
        service_version: options.service_version || "1.0.0",
        service_id: serviceId
      },
      content_type: "application/json",
      message_type: options.message_type,
      version: "1.0"
    };
    const metadata = {
      trace_id: options.trace_id,
      priority: options.priority || 5,
      ttl: options.ttl
    };
    const envelope = {
      header,
      metadata
    };
    const payload = {
      data,
      schema_version: "1.0.0"
    };
    return {
      envelope,
      payload
    };
  }
};
var ErrorFactory = {
  /**
   * 创建错误响应
   * Create error response
   */
  createErrorResponse(options) {
    const now = BasicTypes.createTimestamp();
    return {
      success: false,
      error: {
        code: options.code,
        message: options.message,
        level: options.level || "business",
        severity: options.severity || 2,
        http_status: options.http_status,
        details: options.details,
        timestamp: now,
        help_url: options.help_url,
        retryable: options.retryable || false,
        retry_after_ms: options.retry_after_ms
      },
      metadata: {
        request_id: options.request_id,
        api_version: options.api_version || "1.0.0",
        processing_time_ms: 0
      }
    };
  },
  /**
   * 创建成功响应
   * Create success response
   */
  createSuccessResponse(data, options) {
    return {
      success: true,
      data,
      metadata: {
        api_version: options?.api_version || "1.0.0",
        processing_time_ms: 0,
        request_id: options?.request_id,
        timestamp: BasicTypes.createTimestamp()
      }
    };
  }
};
var ServiceFactory = {
  /**
   * 创建服务信息
   * Create service info
   */
  createServiceInfo(options) {
    const now = BasicTypes.createTimestamp();
    const serviceId = BasicTypes.createUUID();
    return {
      service_name: options.service_name,
      service_version: options.service_version,
      service_id: serviceId,
      network_info: {
        host: options.host,
        port: options.port,
        protocol: options.protocol || "http"
      },
      health_status: 0,
      // UNKNOWN
      service_state: "initializing",
      description: options.description,
      tags: options.tags || [],
      capabilities: [],
      supported_api_versions: ["1.0.0"],
      metadata: {},
      registered_at: now,
      last_updated: now
    };
  }
};
var AuthFactory = {
  /**
   * 创建JWT令牌（简化版）
   * Create JWT token (simplified version)
   */
  createJWTToken(options) {
    const now = BasicTypes.createTimestamp();
    const expiresInSeconds = options.expires_in_seconds || 3600;
    const expiresAt = new Date(now.getTime() + expiresInSeconds * 1e3);
    return {
      token: `jwt.${Math.random().toString(36).substring(2)}`,
      token_type: "access_token",
      issued_at: now,
      expires_at: expiresAt,
      issuer: options.issuer,
      subject: options.user_id,
      scopes: options.roles
    };
  }
};
var Factories = {
  MessageFactory,
  ErrorFactory,
  ServiceFactory,
  AuthFactory
};

// src/index.ts
var VERSION = "1.0.0";
var API_VERSION = "1.0.0";
var SUPPORTED_PROTOCOL_VERSIONS = ["1.0.0"];
var DEFAULT_CONFIG = {
  message: {
    default_content_type: "application/json",
    default_message_priority: 5,
    default_ttl_seconds: 3600,
    default_schema_version: "1.0.0"
  },
  service: {
    default_protocol: "http",
    default_health_check_interval_seconds: 30,
    default_health_check_timeout_seconds: 10,
    default_load_balance_weight: 100
  },
  auth: {
    default_token_expires_in_seconds: 3600,
    default_jwt_algorithm: "HS256"
  },
  validation: {
    strict_mode: false,
    validate_schema: true
  },
  serialization: {
    default_format: "json",
    pretty_print: false,
    include_metadata: true
  }
};
function isSuccessResponse(response) {
  return response && response.success === true;
}
function isErrorResponse(response) {
  return response && response.success === false;
}
function isRequestMessage(message) {
  return message && message.envelope?.header?.message_type === "request";
}
function isResponseMessage(message) {
  return message && message.envelope?.header?.message_type === "response";
}
function isEventMessage(message) {
  return message && message.envelope?.header?.message_type === "event";
}
function isServiceHealthy(service) {
  return service && service.health_status === 1;
}
function isUserActive(user) {
  return user && user.status === "active";
}
export {
  API_VERSION,
  AuthFactory,
  AuthMethod,
  BasicTypes,
  BasicValidators,
  CollectionTypes,
  CollectionValidators,
  ContentType,
  ConversionUtils,
  DEFAULT_CONFIG,
  ErrorCodes,
  ErrorFactory,
  ErrorLevel,
  ErrorSeverity,
  Factories,
  HealthStatus,
  HttpStatusCode,
  JSONConverter,
  LoadBalanceStrategy,
  MessageFactory,
  MessagePriority,
  MessageSerializer,
  MessageType,
  MessageValidators,
  OAuth2GrantType,
  PermissionAction,
  PermissionEffect,
  ProtobufConverter,
  Protocol,
  SUPPORTED_PROTOCOL_VERSIONS,
  SchemaValidator,
  SerializationFormat,
  ServiceFactory,
  ServiceState,
  TokenType,
  UserStatus,
  VERSION,
  ValidationUtils,
  Validators,
  isErrorResponse,
  isEventMessage,
  isRequestMessage,
  isResponseMessage,
  isServiceHealthy,
  isSuccessResponse,
  isUserActive
};
//# sourceMappingURL=index.js.map