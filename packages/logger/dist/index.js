// src/types.ts
var LogLevel = /* @__PURE__ */ ((LogLevel2) => {
  LogLevel2[LogLevel2["TRACE"] = 0] = "TRACE";
  LogLevel2[LogLevel2["DEBUG"] = 1] = "DEBUG";
  LogLevel2[LogLevel2["INFO"] = 2] = "INFO";
  LogLevel2[LogLevel2["WARN"] = 3] = "WARN";
  LogLevel2[LogLevel2["ERROR"] = 4] = "ERROR";
  LogLevel2[LogLevel2["FATAL"] = 5] = "FATAL";
  return LogLevel2;
})(LogLevel || {});
var LogFormat = /* @__PURE__ */ ((LogFormat2) => {
  LogFormat2["JSON"] = "json";
  LogFormat2["PRETTY"] = "pretty";
  LogFormat2["TEXT"] = "text";
  return LogFormat2;
})(LogFormat || {});

// src/logger.ts
import { EventEmitter } from "events";
import { AsyncLocalStorage } from "async_hooks";

// src/outputs.ts
import * as fs from "fs/promises";
import * as path from "path";
var FileOutputAdapter = class {
  constructor(config) {
    this.config = config;
  }
  writeStream;
  currentSize = 0;
  async write(entry) {
    if (!this.writeStream) {
      await this.openFile();
    }
    const content = JSON.stringify(entry) + "\n";
    const size = Buffer.byteLength(content, "utf8");
    if (this.shouldRotate(size)) {
      await this.rotateFile();
    }
    await this.writeStream.write(content);
    this.currentSize += size;
  }
  async openFile() {
    const dir = path.dirname(this.config.filename);
    await fs.mkdir(dir, { recursive: true });
    this.writeStream = await fs.open(this.config.filename, "a");
    const stats = await this.writeStream.stat();
    this.currentSize = stats.size;
  }
  shouldRotate(additionalSize) {
    if (!this.config.maxSize) return false;
    const maxBytes = this.parseSize(this.config.maxSize);
    return this.currentSize + additionalSize > maxBytes;
  }
  parseSize(size) {
    const units = {
      "B": 1,
      "KB": 1024,
      "MB": 1024 * 1024,
      "GB": 1024 * 1024 * 1024
    };
    const match = size.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) {
      throw new Error(`Invalid size format: ${size}`);
    }
    const [, value, unit] = match;
    return parseFloat(value || "0") * (units[unit?.toUpperCase() || "B"] || 1);
  }
  async rotateFile() {
    if (this.writeStream) {
      await this.writeStream.close();
    }
    const { dir, name, ext } = path.parse(this.config.filename);
    if (this.config.maxFiles && this.config.maxFiles > 0) {
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(dir, `${name}.${i}${ext}`);
        const newFile = path.join(dir, `${name}.${i + 1}${ext}`);
        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
        }
      }
      const rotatedFile = path.join(dir, `${name}.1${ext}`);
      try {
        await fs.rename(this.config.filename, rotatedFile);
        if (this.config.compress) {
          await this.compressFile(rotatedFile);
        }
      } catch (error) {
        console.error("Failed to rotate log file:", error);
      }
    }
    await this.openFile();
    this.currentSize = 0;
  }
  async compressFile(filename) {
    console.log(`[FileOutputAdapter] Compression not implemented for: ${filename}`);
  }
  async flush() {
    if (this.writeStream) {
      await this.writeStream.sync();
    }
  }
  async close() {
    if (this.writeStream) {
      await this.writeStream.close();
      this.writeStream = void 0;
    }
  }
};
var ElasticsearchOutputAdapter = class {
  constructor(config) {
    this.config = config;
    this.baseUrl = config.host.endsWith("/") ? config.host : `${config.host}/`;
  }
  baseUrl;
  async write(entry) {
    try {
      const url = `${this.baseUrl}${this.config.index}/${this.config.type || "_doc"}`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(entry)
      });
      if (!response.ok) {
        throw new Error(`Elasticsearch write failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error("[ElasticsearchOutputAdapter] Failed to write entry:", error);
      throw error;
    }
  }
  getAuthHeaders() {
    const headers = {};
    if (this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }
    return headers;
  }
};
var BatchElasticsearchOutputAdapter = class {
  constructor(config, options = {
    batchSize: 100,
    flushInterval: 5e3,
    maxRetries: 3
  }) {
    this.config = config;
    this.options = options;
    this.startFlushTimer();
  }
  buffer = [];
  timer;
  async write(entry) {
    this.buffer.push(entry);
    if (this.buffer.length >= this.options.batchSize) {
      await this.flush();
    }
  }
  async writeBatch(entries) {
    const baseUrl = this.config.host.endsWith("/") ? this.config.host : `${this.config.host}/`;
    const body = entries.flatMap((entry) => [
      { index: { _index: this.config.index, _type: this.config.type || "_doc" } },
      entry
    ]);
    let retries = 0;
    while (retries < this.options.maxRetries) {
      try {
        const response = await fetch(`${baseUrl}_bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...this.getAuthHeaders()
          },
          body: body.map((item) => JSON.stringify(item)).join("\n") + "\n"
        });
        if (!response.ok) {
          throw new Error(`Elasticsearch bulk write failed: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        if (result.errors) {
          console.warn("[BatchElasticsearchOutputAdapter] Some documents failed to index:", result.items);
        }
        return;
      } catch (error) {
        retries++;
        if (retries >= this.options.maxRetries) {
          console.error("[BatchElasticsearchOutputAdapter] Failed to write batch after retries:", error);
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1e3 * retries));
      }
    }
  }
  async flush() {
    if (this.buffer.length === 0) return;
    const entries = [...this.buffer];
    this.buffer = [];
    await this.writeBatch(entries);
  }
  startFlushTimer() {
    this.timer = setInterval(() => {
      this.flush().catch((error) => {
        console.error("[BatchElasticsearchOutputAdapter] Timer flush failed:", error);
      });
    }, this.options.flushInterval);
  }
  getAuthHeaders() {
    const headers = {};
    if (this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString("base64");
      headers["Authorization"] = `Basic ${credentials}`;
    }
    return headers;
  }
  async close() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    await this.flush();
  }
};
var ConsoleOutputAdapter = class {
  constructor(format = "pretty" /* PRETTY */) {
    this.format = format;
  }
  write(entry) {
    const output = this.format === "json" /* JSON */ ? JSON.stringify(entry, null, 2) : this.formatPretty(entry);
    const logFunction = this.getLogFunction(entry.level);
    logFunction(output);
  }
  getLogFunction(level) {
    switch (level) {
      case 0 /* TRACE */:
      case 1 /* DEBUG */:
        return console.debug;
      case 2 /* INFO */:
        return console.info;
      case 3 /* WARN */:
        return console.warn;
      case 4 /* ERROR */:
      case 5 /* FATAL */:
        return console.error;
      default:
        return console.log;
    }
  }
  formatPretty(entry) {
    const levelColors = {
      [0 /* TRACE */]: "\x1B[90m",
      // Bright Black (Gray)
      [1 /* DEBUG */]: "\x1B[36m",
      // Cyan
      [2 /* INFO */]: "\x1B[32m",
      // Green  
      [3 /* WARN */]: "\x1B[33m",
      // Yellow
      [4 /* ERROR */]: "\x1B[31m",
      // Red
      [5 /* FATAL */]: "\x1B[35m"
      // Magenta
    };
    const reset = "\x1B[0m";
    const color = levelColors[entry.level] || "";
    const level = LogLevel[entry.level].padEnd(5);
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const service = `[${entry.service.name}]`;
    let output = `${color}${timestamp} ${level}${reset} ${service} ${entry.message}`;
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }
    if (entry.error) {
      output += `
  ${color}Error: ${entry.error.message}${reset}`;
      if (entry.error.stack) {
        output += `
  ${color}Stack: ${entry.error.stack}${reset}`;
      }
    }
    return output;
  }
};
var MultiOutputAdapter = class {
  constructor(outputs) {
    this.outputs = outputs;
  }
  async write(entry) {
    const promises = this.outputs.map(async (output) => {
      try {
        await output.write(entry);
      } catch (error) {
        console.error("[MultiOutputAdapter] Output failed:", error);
      }
    });
    await Promise.all(promises);
  }
  async flush() {
    const promises = this.outputs.filter((output) => output.flush).map((output) => output.flush());
    await Promise.all(promises);
  }
  async close() {
    const promises = this.outputs.filter((output) => output.close).map((output) => output.close());
    await Promise.all(promises);
  }
};
function createFilter(options) {
  return (entry) => {
    if (options.condition(entry)) {
      return options.transform(entry);
    }
    return entry;
  };
}

// src/logger.ts
var Logger = class _Logger extends EventEmitter {
  config;
  outputs = [];
  contextStorage = new AsyncLocalStorage();
  buffer = [];
  flushTimer;
  contextProvider;
  constructor(config = {}) {
    super();
    this.config = {
      name: config.name || "default",
      service: config.service || {
        name: config.name || "unknown",
        version: "1.0.0"
      },
      level: config.level || 2 /* INFO */,
      format: config.format || "json" /* JSON */,
      outputs: config.outputs || [{ type: "console", enabled: true }],
      tracing: config.tracing || { enabled: false, sampling: 0.1 },
      performance: config.performance || {
        enabled: false,
        includeSystemMetrics: false
      },
      context: config.context || {
        autoInjectTraceId: true,
        autoInjectRequestId: true,
        includeSourceInfo: false
      },
      filters: config.filters || [],
      async: config.async || false,
      bufferSize: config.bufferSize || 1e3,
      flushInterval: config.flushInterval || 5e3,
      onError: config.onError || ((error) => {
        console.error("[Logger Error]:", error);
      })
    };
    this.initializeOutputs();
    if (this.config.async) {
      this.startFlushTimer();
    }
  }
  initializeOutputs() {
    this.outputs = this.config.outputs.filter((output) => output.enabled).map((outputConfig) => this.createOutputAdapter(outputConfig));
  }
  createOutputAdapter(config) {
    return new ConsoleOutputAdapter(config.format || this.config.format);
  }
  startFlushTimer() {
    this.flushTimer = setInterval(() => {
      this.flush().catch(this.config.onError);
    }, this.config.flushInterval);
  }
  getCurrentContext() {
    let context = {};
    if (this.contextProvider) {
      context = { ...context, ...this.contextProvider.getContext() };
    }
    const storageContext = this.contextStorage.getStore();
    if (storageContext) {
      context = { ...context, ...storageContext };
    }
    if (this.config.context.autoInjectRequestId && !context.request_id) {
      context.request_id = this.generateUUID();
    }
    if (this.config.context.autoInjectTraceId && !context.trace_id) {
      context.trace_id = this.generateTraceId();
    }
    return context;
  }
  getSourceInfo() {
    if (!this.config.context.includeSourceInfo) {
      return {};
    }
    const stack = new Error().stack;
    if (!stack) return {};
    const stackLines = stack.split("\n");
    const callerLine = stackLines[4] || "";
    if (callerLine) {
      const match = callerLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
      if (match) {
        return {
          function_name: match[1],
          source_file: match[2],
          line_number: parseInt(match[3], 10)
        };
      }
    }
    return {};
  }
  createLogEntry(level, message, context, error) {
    const entry = {
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      level,
      message,
      service: this.config.service,
      context: { ...this.getCurrentContext(), ...context },
      metadata: this.getSourceInfo()
    };
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: error.code
      };
    }
    return entry;
  }
  applyFilters(entry) {
    let filteredEntry = entry;
    for (const filter of this.config.filters) {
      filteredEntry = filter(filteredEntry);
      if (!filteredEntry) {
        return null;
      }
    }
    return filteredEntry;
  }
  async writeEntry(entry) {
    const filteredEntry = this.applyFilters(entry);
    if (!filteredEntry) return;
    if (this.config.async) {
      this.buffer.push(filteredEntry);
      if (this.buffer.length >= this.config.bufferSize) {
        await this.flush();
      }
    } else {
      await this.writeToOutputs(filteredEntry);
    }
  }
  async writeToOutputs(entry) {
    const promises = this.outputs.map(async (output) => {
      try {
        await output.write(entry);
      } catch (error) {
        this.config.onError(error);
      }
    });
    await Promise.all(promises);
  }
  isLevelEnabled(level) {
    return level >= this.config.level;
  }
  setLevel(level) {
    this.config.level = level;
  }
  child(context) {
    const childConfig = { ...this.config };
    const childLogger = new _Logger(childConfig);
    childLogger.contextStorage = this.contextStorage;
    childLogger.contextProvider = {
      getContext: () => ({ ...this.getCurrentContext(), ...context })
    };
    return childLogger;
  }
  trace(message, context) {
    if (this.isLevelEnabled(0 /* TRACE */)) {
      this.writeEntry(this.createLogEntry(0 /* TRACE */, message, context));
    }
  }
  debug(message, context) {
    if (this.isLevelEnabled(1 /* DEBUG */)) {
      this.writeEntry(this.createLogEntry(1 /* DEBUG */, message, context));
    }
  }
  info(message, context) {
    if (this.isLevelEnabled(2 /* INFO */)) {
      this.writeEntry(this.createLogEntry(2 /* INFO */, message, context));
    }
  }
  warn(message, context) {
    if (this.isLevelEnabled(3 /* WARN */)) {
      this.writeEntry(this.createLogEntry(3 /* WARN */, message, context));
    }
  }
  error(message, context, error) {
    if (this.isLevelEnabled(4 /* ERROR */)) {
      this.writeEntry(this.createLogEntry(4 /* ERROR */, message, context, error));
    }
  }
  fatal(message, context, error) {
    if (this.isLevelEnabled(5 /* FATAL */)) {
      this.writeEntry(this.createLogEntry(5 /* FATAL */, message, context, error));
    }
  }
  async flush() {
    if (this.buffer.length === 0) return;
    const entriesToFlush = [...this.buffer];
    this.buffer = [];
    const promises = entriesToFlush.map((entry) => this.writeToOutputs(entry));
    await Promise.all(promises);
    const flushPromises = this.outputs.filter((output) => output.flush).map((output) => output.flush());
    await Promise.all(flushPromises);
  }
  async close() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
    const closePromises = this.outputs.filter((output) => output.close).map((output) => output.close());
    await Promise.all(closePromises);
  }
  runInContext(context, fn) {
    return this.contextStorage.run(context, fn);
  }
  generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === "x" ? r : r & 3 | 8;
      return v.toString(16);
    });
  }
  generateTraceId() {
    return Math.random().toString(36).substr(2, 16);
  }
};

// src/tracing.ts
import { AsyncLocalStorage as AsyncLocalStorage2 } from "async_hooks";
var TracingLogger = class extends Logger {
  traceStorage = new AsyncLocalStorage2();
  activeSpans = /* @__PURE__ */ new Map();
  tracingConfig;
  constructor(config = {}) {
    super(config);
    this.tracingConfig = config.tracing || { enabled: true, sampling: 0.1 };
  }
  startSpan(operationName, parentSpan) {
    if (!this.tracingConfig.enabled) {
      return new NoOpSpan();
    }
    const traceContext = this.getCurrentTraceContext();
    const spanId = this.createSpanId();
    const span = new SpanImpl({
      spanId,
      traceId: traceContext?.traceId || this.createTraceId(),
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      references: parentSpan ? [{
        type: "childOf",
        spanContext: {
          traceId: parentSpan.traceId,
          spanId: parentSpan.spanId
        }
      }] : []
    });
    this.activeSpans.set(spanId, span);
    return span;
  }
  getCurrentTraceContext() {
    return this.traceStorage.getStore();
  }
  runInTrace(traceContext, fn) {
    return this.traceStorage.run(traceContext, fn);
  }
  async runInTraceAsync(traceContext, fn) {
    return new Promise((resolve, reject) => {
      this.traceStorage.run(traceContext, async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
  getCurrentContext() {
    const baseContext = super.getCurrentContext();
    const traceContext = this.getCurrentTraceContext();
    if (traceContext) {
      return {
        ...baseContext,
        trace_id: traceContext.traceId,
        span_id: traceContext.spanId,
        parent_span_id: traceContext.parentSpanId
      };
    }
    return baseContext;
  }
  createTraceId() {
    return Array.from(
      { length: 32 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
  createSpanId() {
    return Array.from(
      { length: 16 },
      () => Math.floor(Math.random() * 16).toString(16)
    ).join("");
  }
};
var SpanImpl = class {
  spanId;
  traceId;
  operationName;
  startTime;
  endTime;
  tags;
  logs;
  references;
  constructor(data) {
    this.spanId = data.spanId;
    this.traceId = data.traceId;
    this.operationName = data.operationName;
    this.startTime = data.startTime;
    this.tags = data.tags;
    this.logs = data.logs;
    this.references = data.references;
  }
  setTag(key, value) {
    this.tags[key] = value;
    return this;
  }
  log(fields) {
    this.logs.push({
      timestamp: Date.now(),
      fields
    });
    return this;
  }
  recordException(error) {
    this.setTag("error", true);
    this.log({
      event: "error",
      "error.object": error,
      "error.kind": error.constructor.name,
      message: error.message,
      stack: error.stack
    });
    return this;
  }
  end() {
    this.endTime = Date.now();
    console.log(`[Span] ${this.operationName} completed in ${this.endTime - this.startTime}ms`, {
      traceId: this.traceId,
      spanId: this.spanId,
      duration: this.endTime - this.startTime,
      tags: this.tags,
      logs: this.logs
    });
  }
};
var NoOpSpan = class {
  spanId = "";
  traceId = "";
  operationName = "";
  startTime = 0;
  endTime = 0;
  tags = {};
  logs = [];
  references = [];
  setTag() {
    return this;
  }
  log() {
    return this;
  }
  recordException() {
    return this;
  }
  end() {
  }
};
function createTraceContext(data) {
  return {
    traceId: data.traceId || createRandomTraceId(),
    spanId: data.spanId || createRandomSpanId(),
    parentSpanId: data.parentSpanId,
    flags: data.flags || 0,
    baggage: data.baggage || {}
  };
}
function createRandomTraceId() {
  return Array.from(
    { length: 32 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join("");
}
function createRandomSpanId() {
  return Array.from(
    { length: 16 },
    () => Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// src/performance.ts
import * as os from "os";
import { performance } from "perf_hooks";
var PerformanceLogger = class _PerformanceLogger extends TracingLogger {
  performanceConfig;
  counters = /* @__PURE__ */ new Map();
  histograms = /* @__PURE__ */ new Map();
  gauges = /* @__PURE__ */ new Map();
  metricsTimer;
  constructor(config = {}) {
    super(config);
    this.performanceConfig = config.performance || {
      enabled: true,
      includeSystemMetrics: false,
      metricsInterval: 3e4
    };
    if (this.performanceConfig.enabled && this.performanceConfig.includeSystemMetrics) {
      this.startSystemMetricsCollection();
    }
  }
  startSystemMetricsCollection() {
    this.metricsTimer = setInterval(() => {
      this.collectSystemMetrics();
    }, this.performanceConfig.metricsInterval || 3e4);
  }
  collectSystemMetrics() {
    const metrics = {
      cpu_usage_percent: this.getCpuUsage(),
      memory_usage_bytes: process.memoryUsage().heapUsed,
      memory_total_bytes: os.totalmem(),
      memory_free_bytes: os.freemem(),
      uptime_seconds: process.uptime(),
      load_average: os.loadavg()
    };
    this.info("System metrics collected", { metrics });
    this.recordGauge("system_cpu_usage_percent", metrics.cpu_usage_percent || 0);
    this.recordGauge("system_memory_usage_bytes", metrics.memory_usage_bytes || 0);
    this.recordGauge("system_memory_free_bytes", metrics.memory_free_bytes);
    this.recordGauge("system_uptime_seconds", metrics.uptime_seconds);
  }
  getCpuUsage() {
    const cpus2 = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    cpus2.forEach((cpu) => {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    });
    return 100 - ~~(100 * totalIdle / totalTick);
  }
  incrementCounter(name, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + 1);
    this.debug("Counter incremented", {
      metric: name,
      value: current + 1,
      tags
    });
  }
  recordHistogram(name, value, tags = {}) {
    const key = this.createMetricKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    this.debug("Histogram recorded", {
      metric: name,
      value,
      tags,
      count: values.length
    });
  }
  recordGauge(name, value, tags = {}) {
    const key = this.createMetricKey(name, tags);
    this.gauges.set(key, value);
    this.debug("Gauge recorded", {
      metric: name,
      value,
      tags
    });
  }
  getMetricsSummary() {
    const summary = {
      counters: Object.fromEntries(this.counters),
      histograms: {},
      gauges: Object.fromEntries(this.gauges)
    };
    for (const [key, values] of this.histograms) {
      const sorted = [...values].sort((a, b) => a - b);
      const count = sorted.length;
      const sum = sorted.reduce((a, b) => a + b, 0);
      const p95Index = Math.floor(count * 0.95);
      summary.histograms[key] = {
        count,
        min: sorted[0] || 0,
        max: sorted[count - 1] || 0,
        avg: count > 0 ? sum / count : 0,
        p95: sorted[p95Index] || 0
      };
    }
    return summary;
  }
  monitor(operationName) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;
      descriptor.value = async function(...args) {
        const logger = this.logger || new _PerformanceLogger();
        const startTime = performance.now();
        const span = logger.startSpan(operationName);
        try {
          span.setTag("method", propertyKey);
          span.setTag("class", target.constructor.name);
          const result = await originalMethod.apply(this, args);
          const duration = performance.now() - startTime;
          logger.recordHistogram(`${operationName}_duration_ms`, duration, {
            method: propertyKey,
            status: "success"
          });
          logger.incrementCounter(`${operationName}_total`, {
            method: propertyKey,
            status: "success"
          });
          logger.info(`Operation completed: ${operationName}`, {
            method: propertyKey,
            duration_ms: duration,
            success: true
          });
          span.setTag("success", true);
          span.setTag("duration_ms", duration);
          span.end();
          return result;
        } catch (error) {
          const duration = performance.now() - startTime;
          logger.recordHistogram(`${operationName}_duration_ms`, duration, {
            method: propertyKey,
            status: "error",
            error_type: error.constructor.name
          });
          logger.incrementCounter(`${operationName}_total`, {
            method: propertyKey,
            status: "error",
            error_type: error.constructor.name
          });
          logger.error(`Operation failed: ${operationName}`, {
            method: propertyKey,
            duration_ms: duration,
            error: error.message
          }, error);
          span.recordException(error);
          span.setTag("success", false);
          span.setTag("duration_ms", duration);
          span.end();
          throw error;
        }
      };
      return descriptor;
    };
  }
  async measureAsync(operationName, operation, tags = {}) {
    const startTime = performance.now();
    const span = this.startSpan(operationName);
    try {
      Object.entries(tags).forEach(([key, value]) => {
        span.setTag(key, value);
      });
      const result = await operation();
      const duration = performance.now() - startTime;
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: "success"
      });
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: "success"
      });
      span.setTag("success", true);
      span.setTag("duration_ms", duration);
      span.end();
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: "error",
        error_type: error.constructor.name
      });
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: "error",
        error_type: error.constructor.name
      });
      span.recordException(error);
      span.setTag("success", false);
      span.setTag("duration_ms", duration);
      span.end();
      throw error;
    }
  }
  measure(operationName, operation, tags = {}) {
    const startTime = performance.now();
    try {
      const result = operation();
      const duration = performance.now() - startTime;
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: "success"
      });
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: "success"
      });
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordHistogram(`${operationName}_duration_ms`, duration, {
        ...tags,
        status: "error",
        error_type: error.constructor.name
      });
      this.incrementCounter(`${operationName}_total`, {
        ...tags,
        status: "error",
        error_type: error.constructor.name
      });
      throw error;
    }
  }
  createMetricKey(name, tags) {
    const tagString = Object.entries(tags).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => `${key}:${value}`).join(",");
    return tagString ? `${name}{${tagString}}` : name;
  }
  async close() {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    await super.close();
  }
};

// src/factory.ts
function createLogger(config = {}) {
  const mergedConfig = mergeWithDefaults(config);
  if (config.performance?.enabled && config.tracing?.enabled) {
    return new PerformanceLogger(mergedConfig);
  }
  if (config.tracing?.enabled) {
    return new TracingLogger(mergedConfig);
  }
  return new Logger(mergedConfig);
}
function createConsoleLogger(config = {}) {
  return createLogger({
    ...config,
    outputs: [{
      type: "console",
      enabled: true,
      format: config.format || "pretty" /* PRETTY */
    }]
  });
}
function createFileLogger(filename, config = {}) {
  return createLogger({
    ...config,
    outputs: [{
      type: "file",
      enabled: true,
      config: {
        filename,
        maxSize: "10MB",
        maxFiles: 5,
        compress: true,
        ...config.outputs?.[0]?.config
      }
    }]
  });
}
function createElasticsearchLogger(elasticsearchConfig, config = {}) {
  return createLogger({
    ...config,
    outputs: [{
      type: "elasticsearch",
      enabled: true,
      config: elasticsearchConfig
    }]
  });
}
function createProductionLogger(config = {}) {
  const productionConfig = {
    level: 2 /* INFO */,
    format: "json" /* JSON */,
    async: true,
    bufferSize: 1e3,
    flushInterval: 5e3,
    outputs: [
      {
        type: "console",
        enabled: true,
        format: "json" /* JSON */
      },
      {
        type: "file",
        enabled: true,
        config: {
          filename: "./logs/app.log",
          maxSize: "50MB",
          maxFiles: 10,
          compress: true
        }
      }
    ],
    tracing: {
      enabled: true,
      sampling: 0.1
    },
    performance: {
      enabled: true,
      includeSystemMetrics: true,
      metricsInterval: 6e4
    },
    context: {
      autoInjectTraceId: true,
      autoInjectRequestId: true,
      includeSourceInfo: false
    },
    filters: [
      (entry) => {
        if (entry.context?.password) {
          entry.context.password = "[REDACTED]";
        }
        if (entry.context?.token) {
          entry.context.token = "[REDACTED]";
        }
        if (entry.context?.authorization) {
          entry.context.authorization = "[REDACTED]";
        }
        return entry;
      }
    ],
    ...config
  };
  return createLogger(productionConfig);
}
function createDevelopmentLogger(config = {}) {
  const developmentConfig = {
    level: 1 /* DEBUG */,
    format: "pretty" /* PRETTY */,
    async: false,
    outputs: [{
      type: "console",
      enabled: true,
      format: "pretty" /* PRETTY */
    }],
    tracing: {
      enabled: true,
      sampling: 1
    },
    performance: {
      enabled: true,
      includeSystemMetrics: false
    },
    context: {
      autoInjectTraceId: true,
      autoInjectRequestId: true,
      includeSourceInfo: true
    },
    ...config
  };
  return createLogger(developmentConfig);
}
function createTestLogger(config = {}) {
  const testConfig = {
    level: 4 /* ERROR */,
    format: "json" /* JSON */,
    async: false,
    outputs: [],
    tracing: {
      enabled: false,
      sampling: 0
    },
    performance: {
      enabled: false,
      includeSystemMetrics: false
    },
    ...config
  };
  return createLogger(testConfig);
}
function createStructuredLogger(serviceName, version, config = {}) {
  return createLogger({
    service: {
      name: serviceName,
      version,
      instance_id: process.env.HOSTNAME || process.env.INSTANCE_ID || "unknown",
      environment: process.env.NODE_ENV || "development"
    },
    format: "json" /* JSON */,
    ...config
  });
}
function mergeWithDefaults(config) {
  const defaults = {
    name: "default",
    service: {
      name: config.name || "unknown",
      version: "1.0.0",
      instance_id: process.env.HOSTNAME || "unknown",
      environment: process.env.NODE_ENV || "development"
    },
    level: parseLogLevel(process.env.LOG_LEVEL) || 2 /* INFO */,
    format: "json" /* JSON */,
    outputs: [{
      type: "console",
      enabled: true
    }],
    tracing: {
      enabled: false,
      sampling: 0.1
    },
    performance: {
      enabled: false,
      includeSystemMetrics: false
    },
    context: {
      autoInjectTraceId: true,
      autoInjectRequestId: true,
      includeSourceInfo: false
    },
    filters: [],
    async: false,
    bufferSize: 1e3,
    flushInterval: 5e3,
    onError: (error) => {
      console.error("[Logger Error]:", error);
    }
  };
  const merged = {
    ...defaults,
    ...config
  };
  if (config.service || defaults.service) {
    merged.service = {
      ...defaults.service,
      ...config.service
    };
  }
  if (config.tracing || defaults.tracing) {
    merged.tracing = {
      ...defaults.tracing,
      ...config.tracing
    };
  }
  if (config.performance || defaults.performance) {
    merged.performance = {
      ...defaults.performance,
      ...config.performance
    };
  }
  if (config.context || defaults.context) {
    merged.context = {
      ...defaults.context,
      ...config.context
    };
  }
  if (config.outputs) {
    merged.outputs = config.outputs.map((output) => ({
      ...output,
      config: output.config ? {
        ...output.config
      } : void 0
    }));
  } else {
    merged.outputs = defaults.outputs;
  }
  return merged;
}
function parseLogLevel(levelString) {
  if (!levelString) return void 0;
  const upperLevel = levelString.toUpperCase();
  const levelMap = {
    "TRACE": 0 /* TRACE */,
    "DEBUG": 1 /* DEBUG */,
    "INFO": 2 /* INFO */,
    "WARN": 3 /* WARN */,
    "WARNING": 3 /* WARN */,
    "ERROR": 4 /* ERROR */,
    "FATAL": 5 /* FATAL */
  };
  return levelMap[upperLevel];
}
function createOutputAdapter(config) {
  switch (config.type) {
    case "console":
      return new ConsoleOutputAdapter(config.format);
    case "file":
      if (!config.config?.filename) {
        throw new Error("File output requires filename configuration");
      }
      return new FileOutputAdapter({
        filename: config.config.filename,
        maxSize: config.config.maxSize,
        maxFiles: config.config.maxFiles,
        compress: config.config.compress
      });
    case "elasticsearch":
      if (!config.config?.host || !config.config?.index) {
        throw new Error("Elasticsearch output requires host and index configuration");
      }
      return new ElasticsearchOutputAdapter({
        host: config.config.host,
        index: config.config.index,
        type: config.config.type,
        username: config.config.username,
        password: config.config.password
      });
    default:
      throw new Error(`Unsupported output type: ${config.type}`);
  }
}

// src/middleware.ts
function createLoggerMiddleware(config) {
  const {
    logger,
    includeRequest = true,
    includeResponse = false,
    sensitiveFields = ["password", "token", "authorization", "cookie"]
  } = config;
  return (req, res, next) => {
    const startTime = Date.now();
    const requestId = req.headers["x-request-id"] || generateRequestId();
    const traceId = req.headers["x-trace-id"] || generateTraceId();
    req.requestId = requestId;
    req.traceId = traceId;
    const context = {
      request_id: requestId,
      trace_id: traceId,
      method: req.method,
      url: req.url || req.originalUrl,
      user_agent: req.headers["user-agent"],
      ip_address: req.ip || req.connection?.remoteAddress,
      user_id: req.user?.id || req.userId
    };
    logger.runInContext(context, () => {
      if (includeRequest) {
        const requestData = sanitizeObject({
          method: req.method,
          url: req.url || req.originalUrl,
          headers: req.headers,
          query: req.query,
          body: req.body,
          params: req.params
        }, sensitiveFields);
        logger.info("HTTP request started", {
          ...context,
          request: requestData
        });
      }
      const originalSend = res.send;
      const originalJson = res.json;
      res.send = function(body) {
        res.responseBody = body;
        return originalSend.call(this, body);
      };
      res.json = function(body) {
        res.responseBody = body;
        return originalJson.call(this, body);
      };
      res.on("finish", () => {
        const duration = Date.now() - startTime;
        const responseContext = {
          ...context,
          status_code: res.statusCode,
          duration_ms: duration
        };
        if (includeResponse && res.responseBody) {
          const responseData = sanitizeObject({
            status: res.statusCode,
            headers: res.getHeaders ? res.getHeaders() : {},
            body: res.responseBody
          }, sensitiveFields);
          responseContext.response = responseData;
        }
        if (res.statusCode >= 400) {
          logger.warn("HTTP request completed with error", responseContext);
        } else {
          logger.info("HTTP request completed", responseContext);
        }
      });
      res.on("error", (error) => {
        const duration = Date.now() - startTime;
        logger.error("HTTP request failed", {
          ...context,
          duration_ms: duration,
          error: error.message
        }, error);
      });
      next();
    });
  };
}
function createKoaLoggerMiddleware(config) {
  const {
    logger,
    logRequests = true,
    logResponses = false,
    logErrors = true,
    sensitiveFields = ["password", "token", "authorization", "cookie"]
  } = config;
  return async (ctx, next) => {
    const startTime = Date.now();
    const requestId = ctx.headers["x-request-id"] || generateRequestId();
    const traceId = ctx.headers["x-trace-id"] || generateTraceId();
    ctx.state.requestId = requestId;
    ctx.state.traceId = traceId;
    const context = {
      request_id: requestId,
      trace_id: traceId,
      method: ctx.method,
      url: ctx.url,
      user_agent: ctx.headers["user-agent"],
      ip_address: ctx.ip,
      user_id: ctx.state.user?.id || ctx.state.userId
    };
    await logger.runInContext(context, async () => {
      if (logRequests) {
        const requestData = sanitizeObject({
          method: ctx.method,
          url: ctx.url,
          headers: ctx.headers,
          query: ctx.query,
          body: ctx.request.body
        }, sensitiveFields);
        logger.info("Koa request started", {
          ...context,
          request: requestData
        });
      }
      try {
        await next();
        const duration = Date.now() - startTime;
        const responseContext = {
          ...context,
          status_code: ctx.status,
          duration_ms: duration
        };
        if (logResponses && ctx.body) {
          const responseData = sanitizeObject({
            status: ctx.status,
            headers: ctx.response.headers,
            body: ctx.body
          }, sensitiveFields);
          responseContext.response = responseData;
        }
        if (ctx.status >= 400) {
          logger.warn("Koa request completed with error", responseContext);
        } else {
          logger.info("Koa request completed", responseContext);
        }
      } catch (error) {
        const duration = Date.now() - startTime;
        if (logErrors) {
          logger.error("Koa request failed", {
            ...context,
            duration_ms: duration,
            error: error.message
          }, error);
        }
        throw error;
      }
    });
  };
}
function createGrpcLoggerInterceptor(config) {
  const {
    logger,
    logCalls = true,
    logResults = true,
    logErrors = true,
    sensitiveFields = []
  } = config;
  return (call, callback) => {
    const startTime = Date.now();
    const requestId = call.metadata?.get("x-request-id")?.[0] || generateRequestId();
    const traceId = call.metadata?.get("x-trace-id")?.[0] || generateTraceId();
    const context = {
      request_id: requestId,
      trace_id: traceId,
      grpc_method: call.handler?.path,
      grpc_type: call.handler?.type,
      remote_address: call.getPeer?.()
    };
    logger.runInContext(context, () => {
      if (logCalls) {
        const requestData = sanitizeObject({
          method: call.handler?.path,
          metadata: call.metadata?.getMap(),
          request: call.request
        }, sensitiveFields);
        logger.info("gRPC call started", {
          ...context,
          grpc_call: requestData
        });
      }
      const originalCallback = callback;
      const wrappedCallback = (error, response) => {
        const duration = Date.now() - startTime;
        if (error) {
          if (logErrors) {
            logger.error("gRPC call failed", {
              ...context,
              duration_ms: duration,
              grpc_code: error.code,
              error: error.message
            }, error);
          }
        } else {
          const responseContext = {
            ...context,
            duration_ms: duration
          };
          if (logResults && response) {
            const responseData = sanitizeObject({
              response
            }, sensitiveFields);
            responseContext.grpc_response = responseData;
          }
          logger.info("gRPC call completed", responseContext);
        }
        originalCallback(error, response);
      };
      try {
        call.handler.func(call, wrappedCallback);
      } catch (error) {
        const duration = Date.now() - startTime;
        if (logErrors) {
          logger.error("gRPC call exception", {
            ...context,
            duration_ms: duration,
            error: error.message
          }, error);
        }
        wrappedCallback(error, null);
      }
    });
  };
}
function createFastifyPlugin(logger) {
  return async function fastifyLogger(fastify) {
    fastify.addHook("onRequest", async (request) => {
      const startTime = Date.now();
      const requestId = request.headers["x-request-id"] || generateRequestId();
      const traceId = request.headers["x-trace-id"] || generateTraceId();
      request.requestId = requestId;
      request.traceId = traceId;
      request.startTime = startTime;
      const context = {
        request_id: requestId,
        trace_id: traceId,
        method: request.method,
        url: request.url,
        user_agent: request.headers["user-agent"],
        ip_address: request.ip
      };
      logger.runInContext(context, () => {
        logger.info("Fastify request started", context);
      });
    });
    fastify.addHook("onResponse", async (request, reply) => {
      const duration = Date.now() - request.startTime;
      const context = {
        request_id: request.requestId,
        trace_id: request.traceId,
        method: request.method,
        url: request.url,
        status_code: reply.statusCode,
        duration_ms: duration
      };
      logger.runInContext(context, () => {
        if (reply.statusCode >= 400) {
          logger.warn("Fastify request completed with error", context);
        } else {
          logger.info("Fastify request completed", context);
        }
      });
    });
    fastify.addHook("onError", async (request, _reply, error) => {
      const duration = Date.now() - request.startTime;
      const context = {
        request_id: request.requestId,
        trace_id: request.traceId,
        method: request.method,
        url: request.url,
        duration_ms: duration,
        error: error.message
      };
      logger.runInContext(context, () => {
        logger.error("Fastify request error", context, error);
      });
    });
  };
}
function sanitizeObject(obj, sensitiveFields = []) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveFields));
  }
  const sanitized = { ...obj };
  for (const field of sensitiveFields) {
    if (field.toLowerCase() in sanitized) {
      sanitized[field.toLowerCase()] = "[REDACTED]";
    }
    if (field in sanitized) {
      sanitized[field] = "[REDACTED]";
    }
  }
  Object.keys(sanitized).forEach((key) => {
    if (typeof sanitized[key] === "object" && sanitized[key] !== null) {
      sanitized[key] = sanitizeObject(sanitized[key], sensitiveFields);
    }
  });
  return sanitized;
}
function generateRequestId() {
  return Math.random().toString(36).substr(2, 9);
}
function generateTraceId() {
  return Math.random().toString(36).substr(2, 16);
}
export {
  BatchElasticsearchOutputAdapter,
  ConsoleOutputAdapter,
  ElasticsearchOutputAdapter,
  FileOutputAdapter,
  LogFormat,
  LogLevel,
  Logger,
  MultiOutputAdapter,
  PerformanceLogger,
  TracingLogger,
  createConsoleLogger,
  createDevelopmentLogger,
  createElasticsearchLogger,
  createFastifyPlugin,
  createFileLogger,
  createFilter,
  createGrpcLoggerInterceptor,
  createKoaLoggerMiddleware,
  createLogger,
  createLoggerMiddleware,
  createOutputAdapter,
  createProductionLogger,
  createStructuredLogger,
  createTestLogger,
  createTraceContext
};
//# sourceMappingURL=index.js.map