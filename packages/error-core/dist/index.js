// src/codes/index.ts
var SYSTEM_ERROR_CODES = {
  GENERIC_ERROR: "100001",
  SERVICE_UNAVAILABLE: "100002",
  DATABASE_CONNECTION_FAILED: "100003",
  TIMEOUT: "100004",
  MEMORY_OVERFLOW: "100005",
  RESOURCE_EXHAUSTED: "100006",
  CONFIGURATION_ERROR: "100007",
  DEPENDENCY_FAILURE: "100008",
  NETWORK_ERROR: "100009",
  FILE_SYSTEM_ERROR: "100010"
};
var BUSINESS_ERROR_CODES = {
  VALIDATION_FAILED: "200001",
  USER_NOT_FOUND: "201001",
  USER_ALREADY_EXISTS: "201002",
  USER_INACTIVE: "201003",
  INVALID_CREDENTIALS: "201004",
  PERMISSION_DENIED: "201005",
  RESOURCE_NOT_FOUND: "202001",
  RESOURCE_CONFLICT: "202002",
  RESOURCE_LOCKED: "202003",
  INVALID_INPUT: "203001",
  INVALID_FORMAT: "203002",
  INVALID_RANGE: "203003",
  BUSINESS_RULE_VIOLATION: "204001",
  WORKFLOW_ERROR: "204002",
  STATE_TRANSITION_ERROR: "204003"
};
var INTEGRATION_ERROR_CODES = {
  EXTERNAL_SERVICE_UNAVAILABLE: "300001",
  EXTERNAL_SERVICE_TIMEOUT: "300002",
  API_RATE_LIMIT_EXCEEDED: "300003",
  PROTOCOL_ERROR: "300004",
  SERIALIZATION_ERROR: "300005",
  DESERIALIZATION_ERROR: "300006",
  VERSION_MISMATCH: "300007",
  AUTHENTICATION_FAILED: "300008",
  AUTHORIZATION_FAILED: "300009",
  CONTRACT_VIOLATION: "300010"
};
var SECURITY_ERROR_CODES = {
  AUTHENTICATION_REQUIRED: "400001",
  AUTHENTICATION_FAILED: "400002",
  AUTHORIZATION_FAILED: "400003",
  ACCESS_DENIED: "400004",
  TOKEN_EXPIRED: "400005",
  TOKEN_INVALID: "400006",
  SECURITY_VIOLATION: "400007",
  SUSPICIOUS_ACTIVITY: "400008",
  RATE_LIMIT_EXCEEDED: "400009",
  ENCRYPTION_FAILED: "400010",
  DECRYPTION_FAILED: "400011",
  SIGNATURE_INVALID: "400012"
};
var ERROR_CODES = {
  ...SYSTEM_ERROR_CODES,
  ...BUSINESS_ERROR_CODES,
  ...INTEGRATION_ERROR_CODES,
  ...SECURITY_ERROR_CODES
};
var ERROR_CATEGORY_MAP = {};
Object.values(SYSTEM_ERROR_CODES).forEach((code) => {
  ERROR_CATEGORY_MAP[code] = "system";
});
Object.values(BUSINESS_ERROR_CODES).forEach((code) => {
  ERROR_CATEGORY_MAP[code] = "business";
});
Object.values(INTEGRATION_ERROR_CODES).forEach((code) => {
  ERROR_CATEGORY_MAP[code] = "integration";
});
Object.values(SECURITY_ERROR_CODES).forEach((code) => {
  ERROR_CATEGORY_MAP[code] = "security";
});
function getErrorCategory(code) {
  return ERROR_CATEGORY_MAP[code] || "system";
}
var HTTP_STATUS_MAPPING = {
  system: 500,
  business: 400,
  integration: 502,
  security: 401
};
function getHttpStatusForCategory(category) {
  return HTTP_STATUS_MAPPING[category] || 500;
}
function getHttpStatusForErrorCode(code) {
  const category = getErrorCategory(code);
  return getHttpStatusForCategory(category);
}

// src/errors/base.ts
var SkerError = class extends Error {
  code;
  details;
  context;
  originalError;
  httpStatusCode;
  timestamp;
  traceId;
  requestId;
  constructor(options) {
    super(options.message);
    this.name = this.constructor.name;
    this.code = options.code || "000000";
    this.details = options.details || [];
    this.context = options.context || {};
    this.originalError = options.originalError;
    this.httpStatusCode = options.httpStatusCode || 500;
    this.timestamp = options.timestamp || /* @__PURE__ */ new Date();
    this.traceId = options.traceId;
    this.requestId = options.requestId;
    Object.setPrototypeOf(this, new.target.prototype);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
  toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details.length > 0 ? this.details : void 0,
        timestamp: this.timestamp.toISOString(),
        trace_id: this.traceId,
        request_id: this.requestId
      },
      success: false
    };
  }
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      details: this.details,
      context: this.context,
      httpStatusCode: this.httpStatusCode,
      timestamp: this.timestamp.toISOString(),
      traceId: this.traceId,
      requestId: this.requestId,
      stack: this.stack,
      originalError: this.originalError?.toString()
    };
  }
  toString() {
    return `${this.name}: ${this.message} (${this.code})`;
  }
  withContext(additionalContext) {
    Object.assign(this.context, additionalContext);
    return this;
  }
  withTraceId(traceId) {
    this.traceId = traceId;
    return this;
  }
  withRequestId(requestId) {
    this.requestId = requestId;
    return this;
  }
};

// src/errors/specific.ts
var SystemError = class extends SkerError {
  category = "system";
  constructor(options) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory("system")
    });
  }
};
var BusinessError = class extends SkerError {
  category = "business";
  constructor(options) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory("business")
    });
  }
};
var IntegrationError = class extends SkerError {
  category = "integration";
  constructor(options) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory("integration")
    });
  }
};
var SecurityError = class extends SkerError {
  category = "security";
  constructor(options) {
    super({
      ...options,
      httpStatusCode: options.httpStatusCode || getHttpStatusForCategory("security")
    });
  }
};
var ValidationError = class extends BusinessError {
  validationErrors;
  constructor(options) {
    super({
      ...options,
      code: options.code || "200001"
    });
    this.validationErrors = options.validationErrors;
    this.name = "ValidationError";
  }
  toResponse() {
    const baseResponse = super.toResponse();
    return {
      ...baseResponse,
      error: {
        ...baseResponse.error,
        validation_errors: this.validationErrors
      }
    };
  }
};
function createSystemError(options) {
  return new SystemError(options);
}
function createBusinessError(options) {
  return new BusinessError(options);
}
function createIntegrationError(options) {
  return new IntegrationError(options);
}
function createSecurityError(options) {
  return new SecurityError(options);
}
function createValidationError(message, validationErrors, context) {
  return new ValidationError({
    message,
    validationErrors,
    context
  });
}

// src/errors/utils.ts
function isSkerError(error) {
  return error instanceof SkerError;
}
function isSystemError(error) {
  return error instanceof SystemError;
}
function isBusinessError(error) {
  return error instanceof BusinessError;
}
function isIntegrationError(error) {
  return error instanceof IntegrationError;
}
function isSecurityError(error) {
  return error instanceof SecurityError;
}
function isErrorOfCategory(error, category) {
  if (isSkerError(error)) {
    return error.category === category;
  }
  return false;
}
function wrapError(error, additionalContext) {
  if (isSkerError(error)) {
    if (additionalContext) {
      error.withContext(additionalContext);
    }
    return error;
  }
  return new SystemError({
    code: "100001",
    message: error?.message || "Unknown error",
    originalError: error,
    context: additionalContext || {}
  });
}
function sanitizeErrorForLogging(error, sensitiveFields = []) {
  const sanitized = error.toJSON();
  const defaultSensitiveFields = ["password", "token", "secret", "key", "authorization"];
  const allSensitiveFields = [...defaultSensitiveFields, ...sensitiveFields];
  function removeSensitiveData(obj) {
    if (typeof obj !== "object" || obj === null) {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(removeSensitiveData);
    }
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (allSensitiveFields.some(
        (field) => key.toLowerCase().includes(field.toLowerCase())
      )) {
        cleaned[key] = "[REDACTED]";
      } else {
        cleaned[key] = removeSensitiveData(value);
      }
    }
    return cleaned;
  }
  return removeSensitiveData(sanitized);
}
function extractErrorInfo(error) {
  if (isSkerError(error)) {
    return {
      message: error.message,
      code: error.code,
      category: error.category,
      stack: error.stack
    };
  }
  return {
    message: error?.message || "Unknown error",
    code: "100001",
    category: "system",
    stack: error?.stack
  };
}
function createErrorFromCode(code, message, context) {
  const category = getErrorCategory(code);
  switch (category) {
    case "business":
      return new BusinessError({ code, message, context });
    case "integration":
      return new IntegrationError({ code, message, context });
    case "security":
      return new SecurityError({ code, message, context });
    case "system":
    default:
      return new SystemError({ code, message, context });
  }
}

// src/responses/index.ts
function createErrorResponse(options) {
  return {
    error: {
      code: options.code,
      message: options.message,
      details: options.details,
      timestamp: (options.timestamp || /* @__PURE__ */ new Date()).toISOString(),
      trace_id: options.traceId,
      request_id: options.requestId
    },
    success: false
  };
}
function errorToResponse(error) {
  return error.toResponse();
}
function formatErrorForApi(error, options) {
  const traceId = options?.traceId;
  const requestId = options?.requestId;
  if (error instanceof SkerError) {
    const response = error.toResponse();
    if (traceId) response.error.trace_id = traceId;
    if (requestId) response.error.request_id = requestId;
    return response;
  }
  return createErrorResponse({
    code: "100001",
    message: error?.message || "Internal server error",
    traceId,
    requestId
  });
}
function formatErrorForClient(error) {
  return formatErrorForApi(error, {
    includeStackTrace: false,
    includeSensitiveData: false
  });
}
function formatErrorForDevelopment(error) {
  const baseResponse = formatErrorForApi(error, {
    includeStackTrace: true,
    includeSensitiveData: true
  });
  if (error instanceof SkerError) {
    return {
      ...baseResponse,
      debug: {
        stack: error.stack,
        originalError: error.originalError,
        context: error.context
      }
    };
  }
  return {
    ...baseResponse,
    debug: {
      stack: error?.stack,
      originalError: error
    }
  };
}
var ApiErrorFormatter = class {
  constructor(options) {
    this.options = options;
  }
  format(error, context) {
    const traceId = context?.traceId || this.options.defaultTraceIdProvider?.();
    const requestId = context?.requestId || this.options.defaultRequestIdProvider?.();
    return formatErrorForApi(error, {
      includeStackTrace: this.options.includeStackTrace,
      includeSensitiveData: this.options.includeSensitiveData,
      traceId,
      requestId
    });
  }
};
var productionFormatter = new ApiErrorFormatter({
  includeStackTrace: false,
  includeSensitiveData: false
});
var developmentFormatter = new ApiErrorFormatter({
  includeStackTrace: true,
  includeSensitiveData: true
});
var testingFormatter = new ApiErrorFormatter({
  includeStackTrace: true,
  includeSensitiveData: true,
  defaultTraceIdProvider: () => "test-trace-id",
  defaultRequestIdProvider: () => "test-request-id"
});

// src/strategies/backoff.ts
var ExponentialBackoffStrategy = class {
  constructor(multiplier = 2, maxDelay = 3e4, jitter = true) {
    this.multiplier = multiplier;
    this.maxDelay = maxDelay;
    this.jitter = jitter;
  }
  calculateDelay(attempt, baseDelay) {
    const exponentialDelay = baseDelay * Math.pow(this.multiplier, attempt - 1);
    let delay = Math.min(exponentialDelay, this.maxDelay);
    if (this.jitter) {
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    return Math.max(0, delay);
  }
};
var LinearBackoffStrategy = class {
  constructor(increment = 1e3, maxDelay = 3e4, jitter = false) {
    this.increment = increment;
    this.maxDelay = maxDelay;
    this.jitter = jitter;
  }
  calculateDelay(attempt, baseDelay) {
    const linearDelay = baseDelay + this.increment * (attempt - 1);
    let delay = Math.min(linearDelay, this.maxDelay);
    if (this.jitter) {
      const jitterRange = delay * 0.1;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    return Math.max(0, delay);
  }
};
var FixedBackoffStrategy = class {
  constructor(jitter = false) {
    this.jitter = jitter;
  }
  calculateDelay(_attempt, baseDelay) {
    let delay = baseDelay;
    if (this.jitter) {
      const jitterRange = delay * 0.1;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    return delay;
  }
};

// src/strategies/retry.ts
var RetryStrategy = class {
  constructor(options) {
    this.options = options;
    this.backoffStrategy = this.createBackoffStrategy();
  }
  backoffStrategy;
  createBackoffStrategy() {
    const backoffMultiplier = this.options.backoffMultiplier || 2;
    const maxDelay = this.options.maxDelay || 3e4;
    const jitter = this.options.jitter || false;
    if (backoffMultiplier === 1) {
      return new FixedBackoffStrategy(jitter);
    } else if (backoffMultiplier > 1) {
      return new ExponentialBackoffStrategy(backoffMultiplier, maxDelay, jitter);
    } else {
      return new LinearBackoffStrategy(1e3, maxDelay, jitter);
    }
  }
  async execute(fn, _context) {
    let lastError;
    for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt >= this.options.maxAttempts) {
          break;
        }
        if (this.options.retryCondition && !this.options.retryCondition(error, attempt)) {
          break;
        }
        const delay = this.backoffStrategy.calculateDelay(attempt, this.options.initialDelay);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }
    throw lastError;
  }
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};
var RetryBuilder = class {
  options = {};
  maxAttempts(attempts) {
    this.options.maxAttempts = attempts;
    return this;
  }
  initialDelay(delay) {
    this.options.initialDelay = delay;
    return this;
  }
  backoffMultiplier(multiplier) {
    this.options.backoffMultiplier = multiplier;
    return this;
  }
  maxDelay(delay) {
    this.options.maxDelay = delay;
    return this;
  }
  withJitter() {
    this.options.jitter = true;
    return this;
  }
  retryOn(condition) {
    this.options.retryCondition = condition;
    return this;
  }
  build() {
    if (!this.options.maxAttempts) {
      throw new Error("maxAttempts is required");
    }
    if (!this.options.initialDelay) {
      throw new Error("initialDelay is required");
    }
    return new RetryStrategy(this.options);
  }
};
var DEFAULT_RETRY_STRATEGY = new RetryStrategy({
  maxAttempts: 3,
  initialDelay: 1e3,
  backoffMultiplier: 2,
  maxDelay: 1e4,
  jitter: true
});
var AGGRESSIVE_RETRY_STRATEGY = new RetryStrategy({
  maxAttempts: 5,
  initialDelay: 500,
  backoffMultiplier: 1.5,
  maxDelay: 5e3,
  jitter: true
});
var CONSERVATIVE_RETRY_STRATEGY = new RetryStrategy({
  maxAttempts: 2,
  initialDelay: 2e3,
  backoffMultiplier: 2,
  maxDelay: 3e4,
  jitter: false
});
function createRetryStrategy() {
  return new RetryBuilder();
}
function retryWithExponentialBackoff(fn, maxAttempts = 3, initialDelay = 1e3) {
  const strategy = new RetryStrategy({
    maxAttempts,
    initialDelay,
    backoffMultiplier: 2,
    jitter: true
  });
  return strategy.execute(fn);
}
function retryWithLinearBackoff(fn, maxAttempts = 3, initialDelay = 1e3) {
  const strategy = new RetryStrategy({
    maxAttempts,
    initialDelay,
    backoffMultiplier: 1,
    jitter: false
  });
  return strategy.execute(fn);
}

// src/strategies/circuit-breaker.ts
var CircuitBreakerStrategy = class {
  constructor(options) {
    this.options = options;
  }
  state = "closed";
  failureCount = 0;
  successCount = 0;
  nextAttemptTime;
  async execute(fn) {
    if (this.state === "open") {
      if (this.shouldAttemptReset()) {
        this.state = "half-open";
        this.successCount = 0;
        this.notifyStateChange();
      } else {
        throw new Error("Circuit breaker is OPEN");
      }
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  onSuccess() {
    this.failureCount = 0;
    if (this.state === "half-open") {
      this.successCount++;
      const halfOpenMaxCalls = this.options.halfOpenMaxCalls || 1;
      if (this.successCount >= halfOpenMaxCalls) {
        this.state = "closed";
        this.notifyStateChange();
      }
    }
  }
  onFailure() {
    this.failureCount++;
    if (this.state === "half-open") {
      this.state = "open";
      this.setNextAttemptTime();
      this.notifyStateChange();
    } else if (this.state === "closed" && this.failureCount >= this.options.failureThreshold) {
      this.state = "open";
      this.setNextAttemptTime();
      this.notifyStateChange();
    }
  }
  shouldAttemptReset() {
    return this.nextAttemptTime ? /* @__PURE__ */ new Date() >= this.nextAttemptTime : false;
  }
  setNextAttemptTime() {
    this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
  }
  notifyStateChange() {
    if (this.options.onStateChange) {
      this.options.onStateChange(this.state);
    }
  }
  getState() {
    return this.state;
  }
  getFailureCount() {
    return this.failureCount;
  }
  getSuccessCount() {
    return this.successCount;
  }
  reset() {
    this.state = "closed";
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = void 0;
    this.notifyStateChange();
  }
  forceOpen() {
    this.state = "open";
    this.setNextAttemptTime();
    this.notifyStateChange();
  }
  forceClose() {
    this.state = "closed";
    this.failureCount = 0;
    this.nextAttemptTime = void 0;
    this.notifyStateChange();
  }
};
var CircuitBreakerBuilder = class {
  options = {};
  failureThreshold(threshold) {
    this.options.failureThreshold = threshold;
    return this;
  }
  resetTimeout(timeout) {
    this.options.resetTimeout = timeout;
    return this;
  }
  halfOpenMaxCalls(calls) {
    this.options.halfOpenMaxCalls = calls;
    return this;
  }
  monitoringPeriod(period) {
    this.options.monitoringPeriod = period;
    return this;
  }
  onStateChange(callback) {
    this.options.onStateChange = callback;
    return this;
  }
  build() {
    if (!this.options.failureThreshold) {
      throw new Error("failureThreshold is required");
    }
    if (!this.options.resetTimeout) {
      throw new Error("resetTimeout is required");
    }
    return new CircuitBreakerStrategy(this.options);
  }
};
var DEFAULT_CIRCUIT_BREAKER = new CircuitBreakerStrategy({
  failureThreshold: 5,
  resetTimeout: 6e4,
  halfOpenMaxCalls: 3
});
var AGGRESSIVE_CIRCUIT_BREAKER = new CircuitBreakerStrategy({
  failureThreshold: 3,
  resetTimeout: 3e4,
  halfOpenMaxCalls: 1
});
var CONSERVATIVE_CIRCUIT_BREAKER = new CircuitBreakerStrategy({
  failureThreshold: 10,
  resetTimeout: 12e4,
  halfOpenMaxCalls: 5
});
function createCircuitBreaker() {
  return new CircuitBreakerBuilder();
}

// src/strategies/fallback.ts
var FallbackStrategy = class {
  constructor(options) {
    this.options = options;
  }
  async execute(fn, context) {
    try {
      return await fn();
    } catch (error) {
      if (this.shouldUseFallback(error)) {
        return await this.options.fallback(error, context || {});
      }
      throw error;
    }
  }
  shouldUseFallback(error) {
    if (this.options.condition) {
      return this.options.condition(error);
    }
    return true;
  }
};
var ErrorRecoveryStrategy = class {
  constructor(strategies) {
    this.strategies = strategies;
  }
  async execute(fn, context) {
    let currentFn = fn;
    for (const { strategy } of this.strategies) {
      const wrappedFn = currentFn;
      currentFn = () => strategy.execute(wrappedFn, context);
    }
    return await currentFn();
  }
};
var CacheFallbackStrategy = class extends FallbackStrategy {
  constructor(cache = /* @__PURE__ */ new Map(), keyGenerator = (ctx) => JSON.stringify(ctx), condition) {
    super({
      fallback: async (error, context) => {
        const key = this.keyGenerator(context);
        const cachedValue = this.cache.get(key);
        if (cachedValue !== void 0) {
          return cachedValue;
        }
        throw new Error(`No cached value available for fallback: ${error.message}`);
      },
      condition
    });
    this.cache = cache;
    this.keyGenerator = keyGenerator;
  }
  setCachedValue(context, value) {
    const key = this.keyGenerator(context);
    this.cache.set(key, value);
  }
  clearCache() {
    this.cache.clear();
  }
};
var DefaultValueFallbackStrategy = class extends FallbackStrategy {
  constructor(defaultValue, condition) {
    super({
      fallback: async () => this.defaultValue,
      condition
    });
    this.defaultValue = defaultValue;
  }
};
var AlternativeServiceFallbackStrategy = class extends FallbackStrategy {
  constructor(alternativeService, condition) {
    super({
      fallback: async () => await this.alternativeService(),
      condition
    });
    this.alternativeService = alternativeService;
  }
};
function createFallbackStrategy(fallback, condition) {
  return new FallbackStrategy({ fallback, condition });
}
function createCacheFallback(cache, keyGenerator, condition) {
  return new CacheFallbackStrategy(cache, keyGenerator, condition);
}
function createDefaultValueFallback(defaultValue, condition) {
  return new DefaultValueFallbackStrategy(defaultValue, condition);
}
function createAlternativeServiceFallback(alternativeService, condition) {
  return new AlternativeServiceFallbackStrategy(alternativeService, condition);
}

// src/decorators/index.ts
import "reflect-metadata";
function HandleErrors(options = {}) {
  return function(_target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = async function(...args) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        const context = options.contextProvider ? options.contextProvider() : {
          method: propertyName,
          arguments: args,
          className: this.constructor.name
        };
        if (options.onError) {
          options.onError(error, context);
        }
        if (options.rethrow !== false) {
          if (options.wrapUnknownErrors && !(error instanceof SkerError)) {
            throw wrapError(error, context);
          }
          throw error;
        }
      }
    };
    return descriptor;
  };
}
function RetryOnError(options) {
  return function(_target, _propertyName, descriptor) {
    const method = descriptor.value;
    const retryStrategy = new RetryStrategy({
      maxAttempts: options.maxAttempts,
      initialDelay: options.delay,
      backoffMultiplier: options.backoff === "exponential" ? 2 : options.backoff === "linear" ? 1 : 1,
      retryCondition: options.retryCondition
    });
    descriptor.value = async function(...args) {
      return await retryStrategy.execute(() => method.apply(this, args));
    };
    return descriptor;
  };
}
function CircuitBreaker(options) {
  const circuitBreaker = new CircuitBreakerStrategy({
    failureThreshold: options.failureThreshold,
    resetTimeout: options.resetTimeout,
    monitoringPeriod: options.monitoringPeriod,
    onStateChange: options.onStateChange
  });
  return function(_target, _propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = async function(...args) {
      return await circuitBreaker.execute(() => method.apply(this, args));
    };
    return descriptor;
  };
}
function FallbackOnError(fallbackMethod) {
  return function(_target, _propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = async function(...args) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        if (typeof fallbackMethod === "string") {
          const fallback = this[fallbackMethod];
          if (typeof fallback === "function") {
            return await fallback.apply(this, args);
          }
          throw new Error(`Fallback method '${fallbackMethod}' not found`);
        } else {
          return await fallbackMethod.apply(this, args);
        }
      }
    };
    return descriptor;
  };
}
function RetryWithTimeout(options) {
  return function(_target, _propertyName, descriptor) {
    const method = descriptor.value;
    const retryStrategy = new RetryStrategy({
      maxAttempts: options.maxAttempts,
      initialDelay: options.delay,
      backoffMultiplier: 2
    });
    descriptor.value = async function(...args) {
      return await retryStrategy.execute(async () => {
        return await Promise.race([
          method.apply(this, args),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(options.timeoutError || "Method timeout"));
            }, options.timeout);
          })
        ]);
      });
    };
    return descriptor;
  };
}
function GlobalErrorHandler(options = {}) {
  return function(constructor) {
    return class extends constructor {
      constructor(...args) {
        super(...args);
        const proto = constructor.prototype;
        const propertyNames = Object.getOwnPropertyNames(proto);
        propertyNames.forEach((propertyName) => {
          if (propertyName !== "constructor") {
            const descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);
            if (descriptor && typeof descriptor.value === "function") {
              const originalMethod = descriptor.value;
              descriptor.value = async function(...args2) {
                try {
                  return await originalMethod.apply(this, args2);
                } catch (error) {
                  const context = options.contextProvider ? options.contextProvider() : {
                    method: propertyName,
                    arguments: args2,
                    className: constructor.name
                  };
                  if (options.onError) {
                    options.onError(error, context);
                  }
                  if (options.rethrow !== false) {
                    if (options.wrapUnknownErrors && !(error instanceof SkerError)) {
                      throw wrapError(error, context);
                    }
                    throw error;
                  }
                }
              };
              Object.defineProperty(proto, propertyName, descriptor);
            }
          }
        });
      }
    };
  };
}
function ValidateParam(validator) {
  return function(target, propertyName, parameterIndex) {
    const existingValidators = Reflect.getMetadata("validate:params", target, propertyName) || [];
    existingValidators[parameterIndex] = validator;
    Reflect.defineMetadata("validate:params", existingValidators, target, propertyName);
  };
}
function ValidateParams() {
  return function(target, propertyName, descriptor) {
    const method = descriptor.value;
    descriptor.value = function(...args) {
      const validators = Reflect.getMetadata("validate:params", target, propertyName);
      if (validators) {
        validators.forEach((validator, index) => {
          if (validator && index < args.length) {
            const result = validator(args[index]);
            if (typeof result === "string") {
              throw new Error(`Parameter ${index} validation failed: ${result}`);
            } else if (result === false) {
              throw new Error(`Parameter ${index} validation failed`);
            }
          }
        });
      }
      return method.apply(this, args);
    };
    return descriptor;
  };
}

// src/monitoring/collector.ts
var ErrorCollector = class {
  constructor(options = {}) {
    this.options = options;
    this.reporters = options.reporters || [];
  }
  collectedErrors = [];
  reporters = [];
  async collect(error, context) {
    if (this.options.samplingRate && Math.random() > this.options.samplingRate) {
      return;
    }
    if (this.options.filters) {
      const shouldSkip = this.options.filters.some((filter) => !filter(error));
      if (shouldSkip) {
        return;
      }
    }
    let enrichedError = error;
    if (this.options.enrichers) {
      for (const enricher of this.options.enrichers) {
        try {
          enrichedError = await enricher(enrichedError, context || {});
        } catch (enrichError) {
          console.warn("Error enricher failed:", enrichError);
        }
      }
    }
    const errorInfo = {
      error: enrichedError instanceof SkerError ? sanitizeErrorForLogging(enrichedError) : this.sanitizeGenericError(enrichedError),
      context: context || {},
      timestamp: /* @__PURE__ */ new Date(),
      id: this.generateErrorId()
    };
    this.collectedErrors.push(errorInfo);
    await this.reportError(errorInfo);
  }
  sanitizeGenericError(error) {
    return {
      name: error?.name || "Error",
      message: error?.message || "Unknown error",
      stack: error?.stack,
      code: error?.code || "UNKNOWN",
      category: "system"
    };
  }
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  async reportError(errorInfo) {
    const reportPromises = this.reporters.map(async (reporter) => {
      try {
        await this.reportToReporter(reporter, errorInfo);
      } catch (reportError) {
        console.error(`Failed to report error to ${reporter.type}:`, reportError);
      }
    });
    await Promise.allSettled(reportPromises);
  }
  async reportToReporter(reporter, errorInfo) {
    switch (reporter.type) {
      case "console":
        console.error("Error collected:", errorInfo);
        break;
      case "sentry":
        if (reporter.config.dsn) {
          console.log(`Reporting to Sentry (${reporter.config.dsn}):`, errorInfo);
        }
        break;
      case "elasticsearch":
        if (reporter.config.host) {
          console.log(`Reporting to Elasticsearch (${reporter.config.host}):`, errorInfo);
        }
        break;
      case "webhook":
        if (reporter.config.url) {
          console.log(`Reporting to Webhook (${reporter.config.url}):`, errorInfo);
        }
        break;
      default:
        console.warn(`Unknown reporter type: ${reporter.type}`);
    }
  }
  getCollectedErrors() {
    return [...this.collectedErrors];
  }
  getErrorCount() {
    return this.collectedErrors.length;
  }
  getErrorsByCategory() {
    const categories = {};
    this.collectedErrors.forEach((errorInfo) => {
      const category = errorInfo.error.category || "unknown";
      categories[category] = (categories[category] || 0) + 1;
    });
    return categories;
  }
  getErrorsByTimeRange(startTime, endTime) {
    return this.collectedErrors.filter((errorInfo) => {
      const timestamp = errorInfo.timestamp;
      return timestamp >= startTime && timestamp <= endTime;
    });
  }
  clear() {
    this.collectedErrors = [];
  }
  addReporter(reporter) {
    this.reporters.push(reporter);
  }
  removeReporter(type) {
    this.reporters = this.reporters.filter((reporter) => reporter.type !== type);
  }
};
var globalErrorCollector = null;
function getGlobalErrorCollector() {
  if (!globalErrorCollector) {
    globalErrorCollector = new ErrorCollector();
  }
  return globalErrorCollector;
}
function setGlobalErrorCollector(collector) {
  globalErrorCollector = collector;
}
function collectError(error, context) {
  return getGlobalErrorCollector().collect(error, context);
}
function setupGlobalErrorHandling(collector) {
  const errorCollector = collector || getGlobalErrorCollector();
  process.on("unhandledRejection", (reason, promise) => {
    errorCollector.collect(reason, {
      source: "unhandledRejection",
      promise: promise.toString()
    }).catch(console.error);
  });
  process.on("uncaughtException", (error) => {
    errorCollector.collect(error, {
      source: "uncaughtException",
      fatal: true
    }).catch(console.error);
  });
  process.on("warning", (warning) => {
    if (warning.name === "DeprecationWarning") {
      errorCollector.collect(warning, {
        source: "warning",
        type: "deprecation"
      }).catch(console.error);
    }
  });
}

// src/monitoring/metrics.ts
var ErrorMetrics = class {
  constructor(options = {}) {
    this.options = options;
    if (options.collectionInterval) {
      this.startCollection();
    }
  }
  metrics = [];
  counters = {};
  timers = {};
  startCollection() {
    const interval = this.options.collectionInterval || 6e4;
    setInterval(() => {
      this.collectMetrics();
    }, interval);
  }
  collectMetrics() {
    const timestamp = /* @__PURE__ */ new Date();
    Object.entries(this.counters).forEach(([key, value]) => {
      this.addMetric({
        name: "error_count",
        value,
        labels: this.parseLabelsFromKey(key),
        timestamp
      });
    });
    this.calculateErrorRates(timestamp);
    this.calculateRecoveryTimes(timestamp);
  }
  parseLabelsFromKey(key) {
    const parts = key.split(":");
    const labels = {};
    parts.forEach((part) => {
      const [name, value] = part.split("=");
      if (name && value) {
        labels[name] = value;
      }
    });
    return labels;
  }
  calculateErrorRates(timestamp) {
    const totalRequests = this.counters["total_requests"] || 1;
    const totalErrors = Object.values(this.counters).reduce((sum, count) => sum + count, 0);
    const errorRate = totalErrors / totalRequests;
    this.addMetric({
      name: "error_rate",
      value: errorRate,
      labels: {},
      timestamp
    });
  }
  calculateRecoveryTimes(timestamp) {
    Object.entries(this.timers).forEach(([key, times]) => {
      if (times.length > 0) {
        const avgTime = times.reduce((sum, time) => sum + time, 0) / times.length;
        this.addMetric({
          name: "avg_error_recovery_time",
          value: avgTime,
          labels: this.parseLabelsFromKey(key),
          timestamp
        });
      }
    });
  }
  addMetric(metric) {
    this.metrics.push(metric);
    const maxMetrics = 1e4;
    if (this.metrics.length > maxMetrics) {
      this.metrics = this.metrics.slice(-maxMetrics);
    }
  }
  incrementCounter(key, labels, value = 1) {
    const metricKey = this.buildMetricKey(key, labels);
    this.counters[metricKey] = (this.counters[metricKey] || 0) + value;
  }
  recordTime(key, labels, duration) {
    const metricKey = this.buildMetricKey(key, labels);
    if (!this.timers[metricKey]) {
      this.timers[metricKey] = [];
    }
    this.timers[metricKey].push(duration);
  }
  buildMetricKey(name, labels) {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }
    const labelParts = Object.entries(labels).map(([key, value]) => `${key}=${value}`);
    return `${name}:${labelParts.join(":")}`;
  }
  getMetrics(filter) {
    let filtered = this.metrics;
    if (filter) {
      if (filter.name) {
        filtered = filtered.filter((m) => m.name === filter.name);
      }
      if (filter.startTime) {
        filtered = filtered.filter((m) => m.timestamp >= filter.startTime);
      }
      if (filter.endTime) {
        filtered = filtered.filter((m) => m.timestamp <= filter.endTime);
      }
      if (filter.labels) {
        filtered = filtered.filter((m) => {
          return Object.entries(filter.labels).every(
            ([key, value]) => m.labels[key] === value
          );
        });
      }
    }
    return filtered;
  }
  getCounters() {
    return { ...this.counters };
  }
  resetMetrics() {
    this.metrics = [];
    this.counters = {};
    this.timers = {};
  }
};
var ErrorAlerting = class {
  constructor(options = {}) {
    this.options = options;
    if (options.rules) {
      this.rules = options.rules;
    }
  }
  rules = [];
  alertHistory = [];
  addRule(rule) {
    this.rules.push(rule);
  }
  removeRule(name) {
    this.rules = this.rules.filter((rule) => rule.name !== name);
  }
  checkAlerts(metrics) {
    this.rules.forEach((rule) => {
      const shouldAlert = this.evaluateRule(rule, metrics);
      if (shouldAlert) {
        this.triggerAlert(rule, metrics);
      }
    });
  }
  evaluateRule(rule, metrics) {
    if (rule.condition.includes("error_rate >")) {
      const threshold = parseFloat(rule.condition.split(">")[1].trim());
      const currentMetrics = metrics.getMetrics({ name: "error_rate" });
      if (currentMetrics.length > 0) {
        const latestMetric = currentMetrics[currentMetrics.length - 1];
        return latestMetric.value > threshold;
      }
    }
    if (rule.condition.includes("error_count >")) {
      const threshold = parseFloat(rule.condition.split(">")[1].trim());
      const currentMetrics = metrics.getMetrics({ name: "error_count" });
      if (currentMetrics.length > 0) {
        const latestMetric = currentMetrics[currentMetrics.length - 1];
        return latestMetric.value > threshold;
      }
    }
    return false;
  }
  triggerAlert(rule, metrics) {
    const alertInfo = {
      rule,
      timestamp: /* @__PURE__ */ new Date(),
      value: this.getCurrentMetricValue(rule, metrics)
    };
    this.alertHistory.push(alertInfo);
    this.sendNotifications(alertInfo);
  }
  getCurrentMetricValue(rule, metrics) {
    const metricName = rule.condition.includes("error_rate") ? "error_rate" : "error_count";
    const currentMetrics = metrics.getMetrics({ name: metricName });
    if (currentMetrics.length > 0) {
      return currentMetrics[currentMetrics.length - 1].value;
    }
    return 0;
  }
  sendNotifications(alertInfo) {
    const notifiers = this.options.notifiers || [];
    notifiers.forEach((notifier) => {
      try {
        this.sendNotification(notifier, alertInfo);
      } catch (error) {
        console.error(`Failed to send notification via ${notifier.type}:`, error);
      }
    });
  }
  sendNotification(notifier, alertInfo) {
    const message = this.formatAlertMessage(alertInfo);
    switch (notifier.type) {
      case "console":
        console.warn("\u{1F6A8} ALERT:", message);
        break;
      case "slack":
        if (notifier.config.webhook) {
          console.log(`Sending Slack alert to ${notifier.config.webhook}:`, message);
        }
        break;
      case "email":
        if (notifier.config.recipients) {
          console.log(`Sending email alert to ${notifier.config.recipients.join(", ")}:`, message);
        }
        break;
      default:
        console.warn(`Unknown notifier type: ${notifier.type}`);
    }
  }
  formatAlertMessage(alertInfo) {
    const { rule, timestamp, value } = alertInfo;
    return `Alert: ${rule.name}
Condition: ${rule.condition}
Current Value: ${value}
Time: ${timestamp.toISOString()}
Description: ${rule.annotations.description || "No description"}`;
  }
  getAlertHistory() {
    return [...this.alertHistory];
  }
  clearAlertHistory() {
    this.alertHistory = [];
  }
};

// src/testing/index.ts
var ErrorTestHelper = class {
  collectedErrors = [];
  originalErrorHandlers = {};
  constructor() {
    this.setupErrorCapture();
  }
  setupErrorCapture() {
    const originalUnhandledRejection = process.listeners("unhandledRejection");
    const originalUncaughtException = process.listeners("uncaughtException");
    this.originalErrorHandlers = {
      unhandledRejection: originalUnhandledRejection,
      uncaughtException: originalUncaughtException
    };
    process.on("unhandledRejection", (error) => {
      this.collectedErrors.push({
        type: "unhandledRejection",
        error,
        timestamp: /* @__PURE__ */ new Date()
      });
    });
    process.on("uncaughtException", (error) => {
      this.collectedErrors.push({
        type: "uncaughtException",
        error,
        timestamp: /* @__PURE__ */ new Date()
      });
    });
  }
  collectError(error) {
    this.collectedErrors.push({
      type: "manual",
      error,
      timestamp: /* @__PURE__ */ new Date()
    });
  }
  getCollectedErrors() {
    return [...this.collectedErrors];
  }
  getErrorsByType(type) {
    return this.collectedErrors.filter((item) => item.type === type);
  }
  getErrorCount() {
    return this.collectedErrors.length;
  }
  hasErrorOfType(errorType) {
    return this.collectedErrors.some((item) => item.error instanceof errorType);
  }
  hasErrorWithCode(code) {
    return this.collectedErrors.some(
      (item) => item.error instanceof SkerError && item.error.code === code
    );
  }
  reset() {
    this.collectedErrors = [];
  }
  cleanup() {
    this.reset();
    process.removeAllListeners("unhandledRejection");
    process.removeAllListeners("uncaughtException");
    this.originalErrorHandlers.unhandledRejection.forEach((listener) => {
      process.on("unhandledRejection", listener);
    });
    this.originalErrorHandlers.uncaughtException.forEach((listener) => {
      process.on("uncaughtException", listener);
    });
  }
};
var MockErrorProvider = class {
  static createSystemError(options) {
    return new SystemError({
      code: options?.code || ERROR_CODES.GENERIC_ERROR,
      message: options?.message || "Mock system error",
      context: options?.context || { mock: true }
    });
  }
  static createBusinessError(options) {
    return new BusinessError({
      code: options?.code || ERROR_CODES.VALIDATION_FAILED,
      message: options?.message || "Mock business error",
      context: options?.context || { mock: true }
    });
  }
  static createIntegrationError(options) {
    return new IntegrationError({
      code: options?.code || ERROR_CODES.EXTERNAL_SERVICE_UNAVAILABLE,
      message: options?.message || "Mock integration error",
      context: options?.context || { mock: true }
    });
  }
  static createSecurityError(options) {
    return new SecurityError({
      code: options?.code || ERROR_CODES.AUTHENTICATION_FAILED,
      message: options?.message || "Mock security error",
      context: options?.context || { mock: true }
    });
  }
  static createGenericError(message = "Mock error") {
    return new Error(message);
  }
  static createAsyncError(delay = 100, error) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(error || new Error("Mock async error"));
      }, delay);
    });
  }
};
function extendExpect(expect) {
  expect.extend({
    toThrowSkerError(received, expectedCode) {
      let pass = false;
      let message = "";
      try {
        if (typeof received === "function") {
          received();
        }
      } catch (error) {
        if (error instanceof SkerError) {
          if (expectedCode) {
            pass = error.code === expectedCode;
            message = pass ? `Expected SkerError with code ${expectedCode}` : `Expected SkerError with code ${expectedCode}, but got ${error.code}`;
          } else {
            pass = true;
            message = "Expected SkerError";
          }
        } else {
          pass = false;
          message = `Expected SkerError, but got ${error?.constructor?.name || "unknown error"}`;
        }
      }
      return {
        message: () => message,
        pass
      };
    },
    toMatchErrorPattern(received, pattern) {
      if (!(received instanceof SkerError)) {
        return {
          message: () => `Expected SkerError, but got ${received?.constructor?.name || "unknown"}`,
          pass: false
        };
      }
      const failures = [];
      if (pattern.code && received.code !== pattern.code) {
        failures.push(`code: expected ${pattern.code}, got ${received.code}`);
      }
      if (pattern.category && received.category !== pattern.category) {
        failures.push(`category: expected ${pattern.category}, got ${received.category}`);
      }
      if (pattern.message && !received.message.includes(pattern.message)) {
        failures.push(`message: expected to include "${pattern.message}", got "${received.message}"`);
      }
      if (pattern.httpStatusCode && received.httpStatusCode !== pattern.httpStatusCode) {
        failures.push(`httpStatusCode: expected ${pattern.httpStatusCode}, got ${received.httpStatusCode}`);
      }
      const pass = failures.length === 0;
      const message = pass ? `Expected error to not match pattern` : `Error pattern mismatch: ${failures.join(", ")}`;
      return {
        message: () => message,
        pass
      };
    },
    toHaveErrorDetails(received, expectedDetails) {
      if (!(received instanceof SkerError)) {
        return {
          message: () => `Expected SkerError, but got ${received?.constructor?.name || "unknown"}`,
          pass: false
        };
      }
      if (!expectedDetails) {
        const pass2 = received.details && received.details.length > 0;
        return {
          message: () => pass2 ? "Expected error to not have details" : "Expected error to have details",
          pass: pass2
        };
      }
      const pass = JSON.stringify(received.details) === JSON.stringify(expectedDetails);
      return {
        message: () => pass ? "Expected error details to not match" : `Expected error details to match ${JSON.stringify(expectedDetails)}, got ${JSON.stringify(received.details)}`,
        pass
      };
    }
  });
}
function createTestError(type = "system") {
  switch (type) {
    case "business":
      return MockErrorProvider.createBusinessError();
    case "integration":
      return MockErrorProvider.createIntegrationError();
    case "security":
      return MockErrorProvider.createSecurityError();
    default:
      return MockErrorProvider.createSystemError();
  }
}
async function expectAsyncError(asyncFn, expectedErrorType, expectedCode) {
  let error;
  try {
    await asyncFn();
    throw new Error("Expected function to throw, but it did not");
  } catch (e) {
    error = e;
  }
  if (expectedErrorType && !(error instanceof expectedErrorType)) {
    throw new Error(`Expected ${expectedErrorType.name}, but got ${error?.constructor?.name || "unknown"}`);
  }
  if (expectedCode && error instanceof SkerError && error.code !== expectedCode) {
    throw new Error(`Expected error code ${expectedCode}, but got ${error.code}`);
  }
}
function mockAsyncOperation(result, delay = 100, shouldFail = false, error) {
  return () => new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) {
        reject(error || new Error("Mock operation failed"));
      } else {
        resolve(result);
      }
    }, delay);
  });
}

// src/config/index.ts
var globalConfig = {
  global: {
    includeStackTrace: process.env.NODE_ENV !== "production",
    maxContextDepth: 5,
    sensitiveFields: ["password", "token", "creditCard", "ssn"],
    httpStatusMapping: {
      business: 400,
      system: 500,
      integration: 502,
      security: 401
    }
  },
  retry: {
    defaultMaxAttempts: 3,
    defaultInitialDelay: 1e3,
    defaultBackoffMultiplier: 2,
    defaultMaxDelay: 3e4
  },
  circuitBreaker: {
    defaultFailureThreshold: 5,
    defaultResetTimeout: 6e4,
    defaultMonitoringPeriod: 1e4
  },
  collection: {
    enabled: true,
    samplingRate: 1,
    batchSize: 100,
    flushInterval: 5e3
  },
  monitoring: {
    enabled: true,
    metricsInterval: 3e4,
    alertingEnabled: process.env.NODE_ENV === "production"
  }
};
function configureErrorHandling(config) {
  globalConfig = deepMerge(globalConfig, config);
  if (globalConfig.collection?.enabled) {
    const collector = new ErrorCollector({
      samplingRate: globalConfig.collection.samplingRate
    });
    setupGlobalErrorHandling(collector);
  }
  if (globalConfig.retry) {
    Object.assign(DEFAULT_RETRY_STRATEGY, {
      maxAttempts: globalConfig.retry.defaultMaxAttempts,
      initialDelay: globalConfig.retry.defaultInitialDelay,
      backoffMultiplier: globalConfig.retry.defaultBackoffMultiplier,
      maxDelay: globalConfig.retry.defaultMaxDelay
    });
  }
  if (globalConfig.circuitBreaker) {
    Object.assign(DEFAULT_CIRCUIT_BREAKER, {
      failureThreshold: globalConfig.circuitBreaker.defaultFailureThreshold,
      resetTimeout: globalConfig.circuitBreaker.defaultResetTimeout,
      monitoringPeriod: globalConfig.circuitBreaker.defaultMonitoringPeriod
    });
  }
}
function getErrorHandlingConfig() {
  return JSON.parse(JSON.stringify(globalConfig));
}
function resetErrorHandlingConfig() {
  globalConfig = {
    global: {
      includeStackTrace: process.env.NODE_ENV !== "production",
      maxContextDepth: 5,
      sensitiveFields: ["password", "token", "creditCard", "ssn"],
      httpStatusMapping: {
        business: 400,
        system: 500,
        integration: 502,
        security: 401
      }
    },
    retry: {
      defaultMaxAttempts: 3,
      defaultInitialDelay: 1e3,
      defaultBackoffMultiplier: 2,
      defaultMaxDelay: 3e4
    },
    circuitBreaker: {
      defaultFailureThreshold: 5,
      defaultResetTimeout: 6e4,
      defaultMonitoringPeriod: 1e4
    },
    collection: {
      enabled: true,
      samplingRate: 1,
      batchSize: 100,
      flushInterval: 5e3
    },
    monitoring: {
      enabled: true,
      metricsInterval: 3e4,
      alertingEnabled: process.env.NODE_ENV === "production"
    }
  };
}
function deepMerge(target, source) {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== null && typeof source[key] === "object" && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}
function configureFromEnvironment() {
  const envConfig = {};
  if (process.env.SKER_ERROR_INCLUDE_STACK_TRACE) {
    envConfig.global = envConfig.global || {};
    envConfig.global.includeStackTrace = process.env.SKER_ERROR_INCLUDE_STACK_TRACE === "true";
  }
  if (process.env.SKER_ERROR_MAX_CONTEXT_DEPTH) {
    envConfig.global = envConfig.global || {};
    envConfig.global.maxContextDepth = parseInt(process.env.SKER_ERROR_MAX_CONTEXT_DEPTH, 10);
  }
  if (process.env.SKER_ERROR_SENSITIVE_FIELDS) {
    envConfig.global = envConfig.global || {};
    envConfig.global.sensitiveFields = process.env.SKER_ERROR_SENSITIVE_FIELDS.split(",");
  }
  if (process.env.SKER_RETRY_MAX_ATTEMPTS) {
    envConfig.retry = envConfig.retry || {};
    envConfig.retry.defaultMaxAttempts = parseInt(process.env.SKER_RETRY_MAX_ATTEMPTS, 10);
  }
  if (process.env.SKER_RETRY_INITIAL_DELAY) {
    envConfig.retry = envConfig.retry || {};
    envConfig.retry.defaultInitialDelay = parseInt(process.env.SKER_RETRY_INITIAL_DELAY, 10);
  }
  if (process.env.SKER_CIRCUIT_BREAKER_FAILURE_THRESHOLD) {
    envConfig.circuitBreaker = envConfig.circuitBreaker || {};
    envConfig.circuitBreaker.defaultFailureThreshold = parseInt(process.env.SKER_CIRCUIT_BREAKER_FAILURE_THRESHOLD, 10);
  }
  if (process.env.SKER_CIRCUIT_BREAKER_RESET_TIMEOUT) {
    envConfig.circuitBreaker = envConfig.circuitBreaker || {};
    envConfig.circuitBreaker.defaultResetTimeout = parseInt(process.env.SKER_CIRCUIT_BREAKER_RESET_TIMEOUT, 10);
  }
  if (process.env.SKER_ERROR_COLLECTION_ENABLED) {
    envConfig.collection = envConfig.collection || {};
    envConfig.collection.enabled = process.env.SKER_ERROR_COLLECTION_ENABLED === "true";
  }
  if (process.env.SKER_ERROR_SAMPLING_RATE) {
    envConfig.collection = envConfig.collection || {};
    envConfig.collection.samplingRate = parseFloat(process.env.SKER_ERROR_SAMPLING_RATE);
  }
  if (process.env.SKER_MONITORING_ENABLED) {
    envConfig.monitoring = envConfig.monitoring || {};
    envConfig.monitoring.enabled = process.env.SKER_MONITORING_ENABLED === "true";
  }
  if (process.env.SKER_MONITORING_METRICS_INTERVAL) {
    envConfig.monitoring = envConfig.monitoring || {};
    envConfig.monitoring.metricsInterval = parseInt(process.env.SKER_MONITORING_METRICS_INTERVAL, 10);
  }
  if (Object.keys(envConfig).length > 0) {
    configureErrorHandling(envConfig);
  }
}
var DEVELOPMENT_CONFIG = {
  global: {
    includeStackTrace: true,
    maxContextDepth: 10
  },
  collection: {
    enabled: true,
    samplingRate: 1
  },
  monitoring: {
    enabled: true,
    alertingEnabled: false
  }
};
var PRODUCTION_CONFIG = {
  global: {
    includeStackTrace: false,
    maxContextDepth: 3
  },
  collection: {
    enabled: true,
    samplingRate: 0.1
  },
  monitoring: {
    enabled: true,
    alertingEnabled: true
  }
};
var TESTING_CONFIG = {
  global: {
    includeStackTrace: true,
    maxContextDepth: 5
  },
  collection: {
    enabled: false
  },
  monitoring: {
    enabled: false,
    alertingEnabled: false
  }
};

// src/index.ts
var currentErrorContext = null;
async function withErrorContext(context, fn) {
  const previousContext = currentErrorContext;
  currentErrorContext = { ...previousContext, ...context };
  try {
    return await fn();
  } catch (error) {
    const enrichedError = error instanceof SkerError ? error.withContext(currentErrorContext) : wrapError(error, currentErrorContext);
    getGlobalErrorCollector().collect(enrichedError, currentErrorContext);
    throw enrichedError;
  } finally {
    currentErrorContext = previousContext;
  }
}
function getCurrentErrorContext() {
  return currentErrorContext ? { ...currentErrorContext } : null;
}
var ErrorPropagator = class {
  constructor(options = {}) {
    this.options = options;
  }
  propagate(error, additionalContext) {
    const context = {
      ...getCurrentErrorContext(),
      ...additionalContext
    };
    if (!this.options.includeContext) {
      Object.keys(context).forEach((key) => delete context[key]);
    }
    if (error instanceof SkerError) {
      return error.withContext(context);
    }
    return wrapError(error, context);
  }
};
var VERSION = "1.0.0";
configureFromEnvironment();
export {
  AGGRESSIVE_CIRCUIT_BREAKER,
  AGGRESSIVE_RETRY_STRATEGY,
  AlternativeServiceFallbackStrategy,
  ApiErrorFormatter,
  BUSINESS_ERROR_CODES,
  BusinessError,
  CONSERVATIVE_CIRCUIT_BREAKER,
  CONSERVATIVE_RETRY_STRATEGY,
  CacheFallbackStrategy,
  CircuitBreaker,
  CircuitBreakerBuilder,
  CircuitBreakerStrategy,
  DEFAULT_CIRCUIT_BREAKER,
  DEFAULT_RETRY_STRATEGY,
  DEVELOPMENT_CONFIG,
  DefaultValueFallbackStrategy,
  ERROR_CODES,
  ErrorAlerting,
  ErrorCollector,
  ErrorMetrics,
  ErrorPropagator,
  ErrorRecoveryStrategy,
  ErrorTestHelper,
  ExponentialBackoffStrategy,
  FallbackOnError,
  FallbackStrategy,
  FixedBackoffStrategy,
  GlobalErrorHandler,
  HTTP_STATUS_MAPPING,
  HandleErrors,
  INTEGRATION_ERROR_CODES,
  IntegrationError,
  LinearBackoffStrategy,
  MockErrorProvider,
  PRODUCTION_CONFIG,
  RetryBuilder,
  RetryOnError,
  RetryStrategy,
  RetryWithTimeout,
  SECURITY_ERROR_CODES,
  SYSTEM_ERROR_CODES,
  SecurityError,
  SkerError,
  SystemError,
  TESTING_CONFIG,
  VERSION,
  ValidateParam,
  ValidateParams,
  ValidationError,
  collectError,
  configureErrorHandling,
  configureFromEnvironment,
  createAlternativeServiceFallback,
  createBusinessError,
  createCacheFallback,
  createCircuitBreaker,
  createDefaultValueFallback,
  createErrorFromCode,
  createErrorResponse,
  createFallbackStrategy,
  createIntegrationError,
  createRetryStrategy,
  createSecurityError,
  createSystemError,
  createTestError,
  createValidationError,
  developmentFormatter,
  errorToResponse,
  expectAsyncError,
  extendExpect,
  extractErrorInfo,
  formatErrorForApi,
  formatErrorForClient,
  formatErrorForDevelopment,
  getCurrentErrorContext,
  getErrorCategory,
  getErrorHandlingConfig,
  getGlobalErrorCollector,
  getHttpStatusForCategory,
  getHttpStatusForErrorCode,
  isBusinessError,
  isErrorOfCategory,
  isIntegrationError,
  isSecurityError,
  isSkerError,
  isSystemError,
  mockAsyncOperation,
  productionFormatter,
  resetErrorHandlingConfig,
  retryWithExponentialBackoff,
  retryWithLinearBackoff,
  sanitizeErrorForLogging,
  setGlobalErrorCollector,
  setupGlobalErrorHandling,
  testingFormatter,
  withErrorContext,
  wrapError
};
//# sourceMappingURL=index.js.map