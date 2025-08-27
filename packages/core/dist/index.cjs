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
  ConfigManager: () => ConfigManager,
  Context: () => Context,
  ErrorCodes: () => ErrorCodes,
  EventBus: () => EventBus,
  LifecycleManager: () => LifecycleManager,
  LifecycleState: () => LifecycleState,
  MiddlewareManager: () => MiddlewareManager,
  PluginManager: () => PluginManager,
  SkerCore: () => SkerCore,
  SkerError: () => SkerError,
  createError: () => createError,
  ensureContext: () => ensureContext,
  getCurrentContext: () => getCurrentContext,
  isError: () => isError,
  isSkerError: () => isSkerError,
  withContext: () => withContext,
  withCurrentContext: () => withCurrentContext,
  wrapError: () => wrapError
});
module.exports = __toCommonJS(index_exports);

// src/types/index.ts
var ErrorCodes = /* @__PURE__ */ ((ErrorCodes2) => {
  ErrorCodes2["UNKNOWN"] = "UNKNOWN";
  ErrorCodes2["INITIALIZATION_FAILED"] = "INITIALIZATION_FAILED";
  ErrorCodes2["START_FAILED"] = "START_FAILED";
  ErrorCodes2["STOP_FAILED"] = "STOP_FAILED";
  ErrorCodes2["CONFIG_ERROR"] = "CONFIG_ERROR";
  ErrorCodes2["PLUGIN_ERROR"] = "PLUGIN_ERROR";
  ErrorCodes2["CONTEXT_ERROR"] = "CONTEXT_ERROR";
  ErrorCodes2["MIDDLEWARE_ERROR"] = "MIDDLEWARE_ERROR";
  ErrorCodes2["EVENT_ERROR"] = "EVENT_ERROR";
  return ErrorCodes2;
})(ErrorCodes || {});

// src/errors/index.ts
var SkerError = class _SkerError extends Error {
  code;
  details;
  cause;
  constructor(code = "UNKNOWN" /* UNKNOWN */, message, details, cause) {
    super(message || code);
    this.name = "SkerError";
    this.code = code;
    this.details = details;
    this.cause = cause;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, _SkerError);
    }
  }
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      stack: this.stack,
      cause: this.cause?.message
    };
  }
  toString() {
    let result = `${this.name} [${this.code}]: ${this.message}`;
    if (this.details) {
      result += `
Details: ${JSON.stringify(this.details, null, 2)}`;
    }
    if (this.cause) {
      result += `
Caused by: ${this.cause.message}`;
    }
    return result;
  }
};
function createError(code, message, details, cause) {
  return new SkerError(code, message, details, cause);
}
function isError(error) {
  return error instanceof Error;
}
function isSkerError(error) {
  return error instanceof SkerError;
}
function wrapError(error, code, message) {
  if (isSkerError(error)) {
    return error;
  }
  if (isError(error)) {
    return new SkerError(code, message || error.message, void 0, error);
  }
  return new SkerError(code, message || String(error));
}

// src/events/index.ts
var EventBus = class {
  listeners = /* @__PURE__ */ new Map();
  maxListeners = 10;
  onceListeners = /* @__PURE__ */ new Map();
  on(event, handler) {
    if (!event || typeof handler !== "function") {
      throw new SkerError(
        "EVENT_ERROR" /* EVENT_ERROR */,
        "Event name and handler are required"
      );
    }
    if (!this.listeners.has(event)) {
      this.listeners.set(event, /* @__PURE__ */ new Set());
    }
    const handlers = this.listeners.get(event);
    if (handlers.size >= this.maxListeners) {
      console.warn(
        `Warning: Maximum listeners (${this.maxListeners}) exceeded for event "${event}". This could indicate a memory leak.`
      );
    }
    handlers.add(handler);
  }
  once(event, handler) {
    if (!event || typeof handler !== "function") {
      throw new SkerError(
        "EVENT_ERROR" /* EVENT_ERROR */,
        "Event name and handler are required"
      );
    }
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, /* @__PURE__ */ new Set());
    }
    this.onceListeners.get(event).add(handler);
  }
  off(event, handler) {
    if (!event) {
      throw new SkerError("EVENT_ERROR" /* EVENT_ERROR */, "Event name is required");
    }
    if (handler) {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      }
      const onceHandlers = this.onceListeners.get(event);
      if (onceHandlers) {
        onceHandlers.delete(handler);
        if (onceHandlers.size === 0) {
          this.onceListeners.delete(event);
        }
      }
    } else {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    }
  }
  emit(event, data) {
    if (!event) {
      throw new SkerError("EVENT_ERROR" /* EVENT_ERROR */, "Event name is required");
    }
    const handlers = this.listeners.get(event);
    const onceHandlers = this.onceListeners.get(event);
    if (!handlers?.size && !onceHandlers?.size) {
      return;
    }
    try {
      if (handlers) {
        for (const handler of handlers) {
          if (this.isAsyncHandler(handler)) {
            handler(data).catch((error) => {
              this.handleError(error, event);
            });
          } else {
            handler(data);
          }
        }
      }
      if (onceHandlers) {
        for (const handler of onceHandlers) {
          if (this.isAsyncHandler(handler)) {
            handler(data).catch((error) => {
              this.handleError(error, event);
            });
          } else {
            handler(data);
          }
        }
        this.onceListeners.delete(event);
      }
    } catch (error) {
      this.handleError(error, event);
    }
  }
  async emitAsync(event, data) {
    if (!event) {
      throw new SkerError("EVENT_ERROR" /* EVENT_ERROR */, "Event name is required");
    }
    const handlers = this.listeners.get(event);
    const onceHandlers = this.onceListeners.get(event);
    if (!handlers?.size && !onceHandlers?.size) {
      return;
    }
    const promises = [];
    try {
      if (handlers) {
        for (const handler of handlers) {
          if (this.isAsyncHandler(handler)) {
            promises.push(handler(data));
          } else {
            promises.push(Promise.resolve(handler(data)));
          }
        }
      }
      if (onceHandlers) {
        for (const handler of onceHandlers) {
          if (this.isAsyncHandler(handler)) {
            promises.push(handler(data));
          } else {
            promises.push(Promise.resolve(handler(data)));
          }
        }
        this.onceListeners.delete(event);
      }
      await Promise.all(promises);
    } catch (error) {
      throw new SkerError(
        "EVENT_ERROR" /* EVENT_ERROR */,
        `Error emitting async event "${event}"`,
        { event, data },
        error
      );
    }
  }
  removeAllListeners(event) {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }
  listenerCount(event) {
    const handlersCount = this.listeners.get(event)?.size || 0;
    const onceHandlersCount = this.onceListeners.get(event)?.size || 0;
    return handlersCount + onceHandlersCount;
  }
  eventNames() {
    const allEvents = /* @__PURE__ */ new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys()
    ]);
    return Array.from(allEvents);
  }
  setMaxListeners(n) {
    if (n < 0 || !Number.isInteger(n)) {
      throw new SkerError(
        "EVENT_ERROR" /* EVENT_ERROR */,
        "maxListeners must be a non-negative integer"
      );
    }
    this.maxListeners = n;
  }
  getMaxListeners() {
    return this.maxListeners;
  }
  isAsyncHandler(handler) {
    return handler.constructor.name === "AsyncFunction";
  }
  handleError(error, event) {
    console.error(`EventBus error in event "${event}":`, error);
    if (this.listenerCount("error") > 0) {
      this.emit("error", { error, event });
    }
  }
};

// src/config/index.ts
var import_fs = require("fs");
var import_path = require("path");
var ConfigManager = class extends EventBus {
  config = {};
  sources;
  defaultConfig;
  schema;
  watchers = /* @__PURE__ */ new Map();
  constructor(options = {}) {
    super();
    this.sources = options.sources || [{ type: "env" }];
    this.defaultConfig = options.defaultConfig || {};
    this.schema = options.schema;
    this.loadConfig();
  }
  get(key) {
    return this.getNestedValue(this.config, key) ?? this.getNestedValue(this.defaultConfig, key);
  }
  set(key, value) {
    const oldValue = this.get(key);
    this.setNestedValue(this.config, key, value);
    if (oldValue !== value) {
      this.emit("change", { key, value, oldValue });
      this.notifyWatchers(key, value);
    }
  }
  has(key) {
    return this.getNestedValue(this.config, key) !== void 0 || this.getNestedValue(this.defaultConfig, key) !== void 0;
  }
  delete(key) {
    if (this.has(key)) {
      const oldValue = this.get(key);
      this.deleteNestedValue(this.config, key);
      this.emit("change", { key, value: void 0, oldValue });
      this.notifyWatchers(key, void 0);
      return true;
    }
    return false;
  }
  getAll() {
    return { ...this.defaultConfig, ...this.config };
  }
  reset() {
    const oldConfig = { ...this.config };
    this.config = {};
    this.loadConfig();
    this.emit("reset", { oldConfig, newConfig: this.config });
  }
  onChange(key, handler) {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, /* @__PURE__ */ new Set());
    }
    this.watchers.get(key).add(handler);
    return () => {
      const handlers = this.watchers.get(key);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.watchers.delete(key);
        }
      }
    };
  }
  validate() {
    if (!this.schema) {
      return true;
    }
    try {
      if (typeof this.schema.validate === "function") {
        return this.schema.validate(this.getAll());
      }
      return true;
    } catch (error) {
      throw new SkerError(
        "CONFIG_ERROR" /* CONFIG_ERROR */,
        "Configuration validation failed",
        { config: this.getAll() },
        error
      );
    }
  }
  loadConfig() {
    try {
      for (const source of this.sources) {
        this.loadFromSource(source);
      }
      this.validate();
    } catch (error) {
      throw new SkerError(
        "CONFIG_ERROR" /* CONFIG_ERROR */,
        "Failed to load configuration",
        { sources: this.sources },
        error
      );
    }
  }
  loadFromSource(source) {
    try {
      switch (source.type) {
        case "env":
          this.loadFromEnv(source.prefix);
          break;
        case "file":
          this.loadFromFile(source.path);
          break;
        case "remote":
          this.loadFromRemote(source.url);
          break;
        default:
          throw new SkerError(
            "CONFIG_ERROR" /* CONFIG_ERROR */,
            `Unsupported config source type: ${source.type}`
          );
      }
    } catch (error) {
      console.warn(`Failed to load config from ${source.type} source:`, error);
    }
  }
  loadFromEnv(prefix) {
    const envPrefix = prefix || "";
    for (const [key, value] of Object.entries(process.env)) {
      if (!envPrefix || key.startsWith(envPrefix)) {
        const configKey = envPrefix ? key.slice(envPrefix.length).toLowerCase().replace(/_/g, ".") : key.toLowerCase().replace(/_/g, ".");
        this.setNestedValue(this.config, configKey, this.parseEnvValue(value));
      }
    }
  }
  loadFromFile(filePath) {
    if (!filePath) {
      throw new SkerError("CONFIG_ERROR" /* CONFIG_ERROR */, "File path is required for file source");
    }
    try {
      const fullPath = (0, import_path.join)(process.cwd(), filePath);
      const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
      let parsed;
      if (filePath.endsWith(".json")) {
        parsed = JSON.parse(content);
      } else if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
        throw new SkerError("CONFIG_ERROR" /* CONFIG_ERROR */, "JavaScript config files not supported yet");
      } else {
        throw new SkerError("CONFIG_ERROR" /* CONFIG_ERROR */, "Unsupported config file format");
      }
      Object.assign(this.config, parsed);
    } catch (error) {
      throw new SkerError(
        "CONFIG_ERROR" /* CONFIG_ERROR */,
        `Failed to load config from file: ${filePath}`,
        { filePath },
        error
      );
    }
  }
  loadFromRemote(url) {
    if (!url) {
      throw new SkerError("CONFIG_ERROR" /* CONFIG_ERROR */, "URL is required for remote source");
    }
    console.warn("Remote config loading not implemented yet");
  }
  parseEnvValue(value) {
    if (value === void 0) return void 0;
    if (value === "") return "";
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
  getNestedValue(obj, key) {
    const keys = key.split(".");
    let current = obj;
    for (const k of keys) {
      if (current === null || current === void 0 || typeof current !== "object") {
        return void 0;
      }
      current = current[k];
    }
    return current;
  }
  setNestedValue(obj, key, value) {
    const keys = key.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (current[k] === void 0 || typeof current[k] !== "object") {
        current[k] = {};
      }
      current = current[k];
    }
    current[keys[keys.length - 1]] = value;
  }
  deleteNestedValue(obj, key) {
    const keys = key.split(".");
    let current = obj;
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (current[k] === void 0 || typeof current[k] !== "object") {
        return;
      }
      current = current[k];
    }
    delete current[keys[keys.length - 1]];
  }
  notifyWatchers(key, value) {
    const handlers = this.watchers.get(key);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(value);
        } catch (error) {
          console.error(`Config watcher error for key "${key}":`, error);
        }
      }
    }
  }
};

// src/lifecycle/index.ts
var LifecycleState = /* @__PURE__ */ ((LifecycleState3) => {
  LifecycleState3["CREATED"] = "created";
  LifecycleState3["STARTING"] = "starting";
  LifecycleState3["STARTED"] = "started";
  LifecycleState3["STOPPING"] = "stopping";
  LifecycleState3["STOPPED"] = "stopped";
  LifecycleState3["ERROR"] = "error";
  return LifecycleState3;
})(LifecycleState || {});
var LifecycleManager = class extends EventBus {
  state = "created" /* CREATED */;
  startHooks = [];
  stopHooks = [];
  options;
  startPromise;
  stopPromise;
  constructor(options = {}) {
    super();
    this.options = {
      startTimeout: 3e4,
      stopTimeout: 1e4,
      gracefulShutdown: true,
      ...options
    };
    if (this.options.gracefulShutdown) {
      this.setupGracefulShutdown();
    }
  }
  get currentState() {
    return this.state;
  }
  get isStarted() {
    return this.state === "started" /* STARTED */;
  }
  get isStopped() {
    return this.state === "stopped" /* STOPPED */;
  }
  get isStarting() {
    return this.state === "starting" /* STARTING */;
  }
  get isStopping() {
    return this.state === "stopping" /* STOPPING */;
  }
  onStart(handler, options) {
    if (typeof handler !== "function") {
      throw new SkerError("INITIALIZATION_FAILED" /* INITIALIZATION_FAILED */, "Start handler must be a function");
    }
    this.startHooks.push({
      handler,
      name: options?.name || void 0,
      timeout: options?.timeout || this.options.startTimeout
    });
  }
  onStop(handler, options) {
    if (typeof handler !== "function") {
      throw new SkerError("INITIALIZATION_FAILED" /* INITIALIZATION_FAILED */, "Stop handler must be a function");
    }
    this.stopHooks.unshift({
      handler,
      name: options?.name || void 0,
      timeout: options?.timeout || this.options.stopTimeout
    });
  }
  async start() {
    if (this.state === "started" /* STARTED */) {
      return;
    }
    if (this.state === "starting" /* STARTING */) {
      return this.startPromise;
    }
    if (this.state !== "created" /* CREATED */ && this.state !== "stopped" /* STOPPED */) {
      throw new SkerError(
        "START_FAILED" /* START_FAILED */,
        `Cannot start from state: ${this.state}`
      );
    }
    this.startPromise = this.doStart();
    return this.startPromise;
  }
  async stop() {
    if (this.state === "stopped" /* STOPPED */) {
      return;
    }
    if (this.state === "stopping" /* STOPPING */) {
      return this.stopPromise;
    }
    if (this.state !== "started" /* STARTED */) {
      throw new SkerError(
        "STOP_FAILED" /* STOP_FAILED */,
        `Cannot stop from state: ${this.state}`
      );
    }
    this.stopPromise = this.doStop();
    return this.stopPromise;
  }
  async restart() {
    if (this.isStarted) {
      await this.stop();
    }
    await this.start();
  }
  removeStartHook(name) {
    const index = this.startHooks.findIndex((hook) => hook.name === name);
    if (index >= 0) {
      this.startHooks.splice(index, 1);
      return true;
    }
    return false;
  }
  removeStopHook(name) {
    const index = this.stopHooks.findIndex((hook) => hook.name === name);
    if (index >= 0) {
      this.stopHooks.splice(index, 1);
      return true;
    }
    return false;
  }
  async doStart() {
    try {
      this.setState("starting" /* STARTING */);
      this.emit("starting");
      for (const hook of this.startHooks) {
        await this.executeHook(hook, "start");
      }
      this.setState("started" /* STARTED */);
      this.emit("started");
    } catch (error) {
      this.setState("error" /* ERROR */);
      this.emit("error", error);
      throw new SkerError(
        "START_FAILED" /* START_FAILED */,
        "Failed to start lifecycle",
        { state: this.state },
        error
      );
    }
  }
  async doStop() {
    try {
      this.setState("stopping" /* STOPPING */);
      this.emit("stopping");
      for (const hook of this.stopHooks) {
        await this.executeHook(hook, "stop");
      }
      this.setState("stopped" /* STOPPED */);
      this.emit("stopped");
    } catch (error) {
      this.setState("error" /* ERROR */);
      this.emit("error", error);
      throw new SkerError(
        "STOP_FAILED" /* STOP_FAILED */,
        "Failed to stop lifecycle",
        { state: this.state },
        error
      );
    }
  }
  async executeHook(hook, phase) {
    const hookName = hook.name || `anonymous-${phase}-hook`;
    const timeout = hook.timeout || (phase === "start" ? this.options.startTimeout : this.options.stopTimeout);
    try {
      this.emit("hookExecuting", { name: hookName, phase });
      await Promise.race([
        hook.handler(),
        this.createTimeoutPromise(timeout, hookName, phase)
      ]);
      this.emit("hookExecuted", { name: hookName, phase });
    } catch (error) {
      this.emit("hookError", { name: hookName, phase, error });
      throw new SkerError(
        phase === "start" ? "START_FAILED" /* START_FAILED */ : "STOP_FAILED" /* STOP_FAILED */,
        `${phase} hook "${hookName}" failed`,
        { hookName, phase, timeout },
        error
      );
    }
  }
  createTimeoutPromise(timeout, hookName, phase) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new SkerError(
          phase === "start" ? "START_FAILED" /* START_FAILED */ : "STOP_FAILED" /* STOP_FAILED */,
          `${phase} hook "${hookName}" timed out after ${timeout}ms`
        ));
      }, timeout);
    });
  }
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.emit("stateChanged", { oldState, newState });
  }
  setupGracefulShutdown() {
    const signals = ["SIGINT", "SIGTERM"];
    const shutdown = async (signal) => {
      console.log(`Received ${signal}. Starting graceful shutdown...`);
      try {
        await this.stop();
        console.log("Graceful shutdown completed");
        process.exit(0);
      } catch (error) {
        console.error("Graceful shutdown failed:", error);
        process.exit(1);
      }
    };
    signals.forEach((signal) => {
      process.on(signal, () => shutdown(signal));
    });
    process.on("uncaughtException", async (error) => {
      console.error("Uncaught exception:", error);
      try {
        await this.stop();
      } catch (stopError) {
        console.error("Failed to stop gracefully after uncaught exception:", stopError);
      }
      process.exit(1);
    });
    process.on("unhandledRejection", async (reason) => {
      console.error("Unhandled rejection:", reason);
      try {
        await this.stop();
      } catch (stopError) {
        console.error("Failed to stop gracefully after unhandled rejection:", stopError);
      }
      process.exit(1);
    });
  }
};

// src/plugins/index.ts
var PluginManager = class extends EventBus {
  plugins = /* @__PURE__ */ new Map();
  core;
  initializationOrder = [];
  constructor(core) {
    super();
    this.core = core;
  }
  register(name, plugin, config = { name }) {
    if (!name) {
      throw new SkerError("PLUGIN_ERROR" /* PLUGIN_ERROR */, "Plugin name is required");
    }
    if (!plugin || typeof plugin.initialize !== "function") {
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        "Plugin must have an initialize method"
      );
    }
    if (this.plugins.has(name)) {
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Plugin "${name}" is already registered`
      );
    }
    const context = {
      core: this.core,
      config: config.options || {},
      logger: this.core?.getLogger?.(name)
    };
    this.plugins.set(name, {
      plugin,
      config,
      context,
      initialized: false
    });
    this.emit("pluginRegistered", { name, plugin, config });
  }
  unregister(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      return;
    }
    if (pluginInstance.initialized) {
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Cannot unregister initialized plugin "${name}". Destroy it first.`
      );
    }
    this.plugins.delete(name);
    this.emit("pluginUnregistered", { name });
  }
  async initialize(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError("PLUGIN_ERROR" /* PLUGIN_ERROR */, `Plugin "${name}" not found`);
    }
    if (pluginInstance.initialized) {
      return;
    }
    if (pluginInstance.config.enabled === false) {
      this.emit("pluginSkipped", { name, reason: "disabled" });
      return;
    }
    try {
      this.emit("pluginInitializing", { name });
      pluginInstance.instance = await pluginInstance.plugin.initialize(pluginInstance.context);
      pluginInstance.initialized = true;
      this.initializationOrder.push(name);
      this.emit("pluginInitialized", { name });
    } catch (error) {
      this.emit("pluginError", { name, error, phase: "initialize" });
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Failed to initialize plugin "${name}"`,
        { name },
        error
      );
    }
  }
  async initializeAll() {
    const plugins = Array.from(this.plugins.entries());
    const errors = [];
    for (const [name] of plugins) {
      try {
        await this.initialize(name);
      } catch (error) {
        errors.push({ name, error });
      }
    }
    if (errors.length > 0) {
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Failed to initialize ${errors.length} plugin(s)`,
        { errors: errors.map((e) => ({ name: e.name, message: e.error.message })) }
      );
    }
  }
  async destroy(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance || !pluginInstance.initialized) {
      return;
    }
    try {
      this.emit("pluginDestroying", { name });
      if (typeof pluginInstance.plugin.destroy === "function") {
        await pluginInstance.plugin.destroy();
      }
      pluginInstance.initialized = false;
      pluginInstance.instance = void 0;
      const index = this.initializationOrder.indexOf(name);
      if (index >= 0) {
        this.initializationOrder.splice(index, 1);
      }
      this.emit("pluginDestroyed", { name });
    } catch (error) {
      this.emit("pluginError", { name, error, phase: "destroy" });
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Failed to destroy plugin "${name}"`,
        { name },
        error
      );
    }
  }
  async destroyAll() {
    const errors = [];
    const destroyOrder = [...this.initializationOrder].reverse();
    for (const name of destroyOrder) {
      try {
        await this.destroy(name);
      } catch (error) {
        errors.push({ name, error });
      }
    }
    if (errors.length > 0) {
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Failed to destroy ${errors.length} plugin(s)`,
        { errors: errors.map((e) => ({ name: e.name, message: e.error.message })) }
      );
    }
  }
  get(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance || !pluginInstance.initialized) {
      return void 0;
    }
    return pluginInstance.instance;
  }
  has(name) {
    return this.plugins.has(name);
  }
  isInitialized(name) {
    const pluginInstance = this.plugins.get(name);
    return pluginInstance?.initialized || false;
  }
  getRegisteredPlugins() {
    return Array.from(this.plugins.keys());
  }
  getInitializedPlugins() {
    return this.initializationOrder.slice();
  }
  getPluginInfo(name) {
    const pluginInstance = this.plugins.get(name);
    return pluginInstance?.config;
  }
  getAllPluginInfo() {
    const result = {};
    for (const [name, instance] of this.plugins) {
      result[name] = {
        ...instance.config,
        initialized: instance.initialized
      };
    }
    return result;
  }
  async enable(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError("PLUGIN_ERROR" /* PLUGIN_ERROR */, `Plugin "${name}" not found`);
    }
    if (pluginInstance.config.enabled !== false) {
      return;
    }
    pluginInstance.config.enabled = true;
    if (!pluginInstance.initialized) {
      await this.initialize(name);
    }
    this.emit("pluginEnabled", { name });
  }
  async disable(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError("PLUGIN_ERROR" /* PLUGIN_ERROR */, `Plugin "${name}" not found`);
    }
    if (pluginInstance.config.enabled === false) {
      return;
    }
    if (pluginInstance.initialized) {
      await this.destroy(name);
    }
    pluginInstance.config.enabled = false;
    this.emit("pluginDisabled", { name });
  }
  updatePluginConfig(name, config) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError("PLUGIN_ERROR" /* PLUGIN_ERROR */, `Plugin "${name}" not found`);
    }
    const oldConfig = { ...pluginInstance.context.config };
    pluginInstance.context.config = { ...pluginInstance.context.config, ...config };
    pluginInstance.config.options = { ...pluginInstance.config.options, ...config };
    this.emit("pluginConfigUpdated", { name, oldConfig, newConfig: pluginInstance.context.config });
  }
};

// src/middleware/index.ts
var MiddlewareManager = class extends EventBus {
  middlewares = [];
  sorted = true;
  use(handler, options) {
    if (typeof handler !== "function") {
      throw new SkerError(
        "MIDDLEWARE_ERROR" /* MIDDLEWARE_ERROR */,
        "Middleware handler must be a function"
      );
    }
    const middleware = {
      handler,
      name: options?.name || void 0,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false
    };
    this.middlewares.push(middleware);
    this.sorted = false;
    this.emit("middlewareAdded", { middleware });
  }
  remove(nameOrHandler) {
    const index = this.middlewares.findIndex(
      (mw) => typeof nameOrHandler === "string" && mw.name === nameOrHandler || typeof nameOrHandler === "function" && mw.handler === nameOrHandler
    );
    if (index >= 0) {
      const removed = this.middlewares.splice(index, 1)[0];
      this.emit("middlewareRemoved", { middleware: removed });
      return true;
    }
    return false;
  }
  enable(name) {
    const middleware = this.middlewares.find((mw) => mw.name === name);
    if (middleware) {
      middleware.enabled = true;
      this.emit("middlewareEnabled", { name });
      return true;
    }
    return false;
  }
  disable(name) {
    const middleware = this.middlewares.find((mw) => mw.name === name);
    if (middleware) {
      middleware.enabled = false;
      this.emit("middlewareDisabled", { name });
      return true;
    }
    return false;
  }
  clear() {
    const count = this.middlewares.length;
    this.middlewares = [];
    this.sorted = true;
    this.emit("middlewaresCleared", { count });
  }
  async execute(context) {
    const enabledMiddlewares = this.getEnabledMiddlewares();
    if (enabledMiddlewares.length === 0) {
      return;
    }
    let currentIndex = 0;
    const executedMiddlewares = [];
    const next = async () => {
      if (currentIndex >= enabledMiddlewares.length) {
        return;
      }
      const middleware = enabledMiddlewares[currentIndex++];
      const middlewareName = middleware.name || `anonymous-${currentIndex}`;
      try {
        this.emit("middlewareExecuting", { name: middlewareName, context });
        executedMiddlewares.push(middlewareName);
        await middleware.handler(context, next);
        this.emit("middlewareExecuted", { name: middlewareName, context });
      } catch (error) {
        this.emit("middlewareError", { name: middlewareName, error, context });
        throw new SkerError(
          "MIDDLEWARE_ERROR" /* MIDDLEWARE_ERROR */,
          `Middleware "${middlewareName}" failed`,
          { middlewareName, executedMiddlewares },
          error
        );
      }
    };
    try {
      await next();
      this.emit("middlewareChainCompleted", { executedMiddlewares, context });
    } catch (error) {
      this.emit("middlewareChainFailed", { error, executedMiddlewares, context });
      throw error;
    }
  }
  async executeWithTimeout(context, timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new SkerError(
          "MIDDLEWARE_ERROR" /* MIDDLEWARE_ERROR */,
          `Middleware execution timed out after ${timeout}ms`,
          { timeout, context }
        ));
      }, timeout);
    });
    try {
      await Promise.race([
        this.execute(context),
        timeoutPromise
      ]);
    } catch (error) {
      if (error instanceof SkerError && error.message.includes("timed out")) {
        this.emit("middlewareTimeout", { timeout, context });
      }
      throw error;
    }
  }
  getMiddlewares() {
    return this.middlewares.map((mw) => ({
      name: mw.name,
      priority: mw.priority || 0,
      enabled: mw.enabled !== false
    }));
  }
  getEnabledMiddlewares() {
    if (!this.sorted) {
      this.sortMiddlewares();
    }
    return this.middlewares.filter((mw) => mw.enabled !== false);
  }
  getMiddlewareCount() {
    return this.middlewares.length;
  }
  getEnabledMiddlewareCount() {
    return this.middlewares.filter((mw) => mw.enabled !== false).length;
  }
  hasMiddleware(nameOrHandler) {
    return this.middlewares.some(
      (mw) => typeof nameOrHandler === "string" && mw.name === nameOrHandler || typeof nameOrHandler === "function" && mw.handler === nameOrHandler
    );
  }
  insertBefore(beforeName, handler, options) {
    const index = this.middlewares.findIndex((mw) => mw.name === beforeName);
    if (index < 0) {
      return false;
    }
    const middleware = {
      handler,
      name: options?.name || void 0,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false
    };
    this.middlewares.splice(index, 0, middleware);
    this.sorted = false;
    this.emit("middlewareInserted", { middleware, beforeName });
    return true;
  }
  insertAfter(afterName, handler, options) {
    const index = this.middlewares.findIndex((mw) => mw.name === afterName);
    if (index < 0) {
      return false;
    }
    const middleware = {
      handler,
      name: options?.name || void 0,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false
    };
    this.middlewares.splice(index + 1, 0, middleware);
    this.sorted = false;
    this.emit("middlewareInserted", { middleware, afterName });
    return true;
  }
  sortMiddlewares() {
    this.middlewares.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });
    this.sorted = true;
  }
};

// src/core/index.ts
var SkerCore = class extends EventBus {
  options;
  configManager;
  lifecycleManager;
  pluginManager;
  middlewareManager;
  startTime;
  constructor(options) {
    super();
    if (!options.serviceName) {
      throw new SkerError(
        "INITIALIZATION_FAILED" /* INITIALIZATION_FAILED */,
        "Service name is required"
      );
    }
    if (!options.version) {
      throw new SkerError(
        "INITIALIZATION_FAILED" /* INITIALIZATION_FAILED */,
        "Service version is required"
      );
    }
    this.options = {
      environment: "development",
      plugins: [],
      ...options
    };
    this.startTime = Date.now();
    try {
      this.configManager = new ConfigManager(this.options.config);
      this.lifecycleManager = new LifecycleManager(this.options.lifecycle);
      this.pluginManager = new PluginManager(this);
      this.middlewareManager = new MiddlewareManager();
      this.setupEventHandlers();
      this.registerPlugins();
      this.setupLifecycleHooks();
      this.emit("initialized", {
        serviceName: this.options.serviceName,
        version: this.options.version,
        environment: this.options.environment
      });
    } catch (error) {
      throw new SkerError(
        "INITIALIZATION_FAILED" /* INITIALIZATION_FAILED */,
        "Failed to initialize SkerCore",
        { options: this.options },
        error
      );
    }
  }
  get serviceName() {
    return this.options.serviceName;
  }
  get version() {
    return this.options.version;
  }
  get environment() {
    return this.options.environment || "development";
  }
  get uptime() {
    return Date.now() - this.startTime;
  }
  get state() {
    return this.lifecycleManager.currentState;
  }
  get isStarted() {
    return this.lifecycleManager.isStarted;
  }
  get isStopped() {
    return this.lifecycleManager.isStopped;
  }
  async start() {
    try {
      this.emit("starting");
      await this.lifecycleManager.start();
      this.emit("started", {
        serviceName: this.serviceName,
        version: this.version,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit("startFailed", error);
      throw error;
    }
  }
  async stop() {
    try {
      this.emit("stopping");
      await this.lifecycleManager.stop();
      this.emit("stopped", {
        serviceName: this.serviceName,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit("stopFailed", error);
      throw error;
    }
  }
  async restart() {
    this.emit("restarting");
    await this.lifecycleManager.restart();
    this.emit("restarted");
  }
  getConfig() {
    return this.configManager;
  }
  getLifecycle() {
    return this.lifecycleManager;
  }
  getPlugins() {
    return this.pluginManager;
  }
  getMiddleware() {
    return this.middlewareManager;
  }
  getPlugin(name) {
    const plugin = this.pluginManager.get(name);
    if (!plugin) {
      throw new SkerError(
        "PLUGIN_ERROR" /* PLUGIN_ERROR */,
        `Plugin "${name}" not found or not initialized`
      );
    }
    return plugin;
  }
  hasPlugin(name) {
    return this.pluginManager.isInitialized(name);
  }
  getInfo() {
    return {
      serviceName: this.serviceName,
      version: this.version,
      environment: this.environment,
      state: this.state,
      uptime: this.uptime,
      plugins: this.pluginManager.getInitializedPlugins(),
      config: this.configManager.getAll()
    };
  }
  enableMemoryMonitoring(options) {
    const interval = options?.interval || 3e4;
    const threshold = options?.threshold || 0.8;
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const usage = usedMemory / totalMemory;
      this.emit("memoryUsage", {
        memoryUsage,
        usage,
        threshold
      });
      if (usage > threshold) {
        this.emit("memoryThresholdExceeded", {
          usage,
          threshold,
          memoryUsage
        });
      }
    }, interval);
  }
  setupEventHandlers() {
    this.lifecycleManager.on("error", (error) => {
      this.emit("lifecycleError", error);
    });
    this.pluginManager.on("pluginError", (data) => {
      this.emit("pluginError", data);
    });
    this.middlewareManager.on("middlewareError", (data) => {
      this.emit("middlewareError", data);
    });
    this.configManager.on("change", (data) => {
      this.emit("configChange", data);
    });
    this.on("error", (error) => {
      console.error("SkerCore error:", error);
    });
  }
  registerPlugins() {
    if (!this.options.plugins?.length) {
      return;
    }
    for (const pluginConfig of this.options.plugins) {
      if (pluginConfig.enabled === false) {
        continue;
      }
      try {
        if (pluginConfig.package) {
          import(pluginConfig.package).then((pluginModule) => {
            const plugin = pluginModule.default || pluginModule;
            this.pluginManager.register(pluginConfig.name, plugin, pluginConfig);
          }).catch((error) => {
            console.warn(`Failed to load plugin "${pluginConfig.name}":`, error);
          });
        }
      } catch (error) {
        console.warn(`Failed to register plugin "${pluginConfig.name}":`, error);
      }
    }
  }
  setupLifecycleHooks() {
    this.lifecycleManager.onStart(async () => {
      await this.pluginManager.initializeAll();
    });
    this.lifecycleManager.onStop(async () => {
      await this.pluginManager.destroyAll();
    });
  }
};

// src/context/index.ts
var import_async_hooks = require("async_hooks");
var import_crypto = require("crypto");
var contextStorage = new import_async_hooks.AsyncLocalStorage();
var Context = class _Context {
  data;
  startTime;
  parent;
  constructor(initialData = {}, parent) {
    this.data = /* @__PURE__ */ new Map();
    this.startTime = Date.now();
    this.parent = parent;
    this.set("requestId", initialData.requestId || (0, import_crypto.randomUUID)());
    this.set("userId", initialData.userId);
    this.set("traceId", initialData.traceId || (0, import_crypto.randomUUID)());
    for (const [key, value] of Object.entries(initialData)) {
      if (key !== "requestId" && key !== "userId" && key !== "traceId") {
        this.set(key, value);
      }
    }
  }
  static current() {
    return contextStorage.getStore();
  }
  static ensure() {
    const current = _Context.current();
    if (!current) {
      throw new SkerError(
        "CONTEXT_ERROR" /* CONTEXT_ERROR */,
        "No active context found. Make sure to run code within a context."
      );
    }
    return current;
  }
  static create(data = {}) {
    const parent = _Context.current();
    return new _Context(data, parent);
  }
  static fork(additionalData = {}) {
    const parent = _Context.current();
    if (!parent) {
      return new _Context(additionalData);
    }
    const forkedData = {
      ...parent.toObject(),
      ...additionalData
    };
    return new _Context(forkedData, parent);
  }
  async run(callback) {
    return contextStorage.run(this, callback);
  }
  get(key) {
    if (this.data.has(key)) {
      return this.data.get(key);
    }
    if (this.parent) {
      return this.parent.get(key);
    }
    return void 0;
  }
  set(key, value) {
    if (!key) {
      throw new SkerError("CONTEXT_ERROR" /* CONTEXT_ERROR */, "Context key cannot be empty");
    }
    this.data.set(key, value);
  }
  has(key) {
    return this.data.has(key) || (this.parent?.has(key) ?? false);
  }
  delete(key) {
    return this.data.delete(key);
  }
  get requestId() {
    return this.get("requestId");
  }
  get userId() {
    return this.get("userId");
  }
  get traceId() {
    return this.get("traceId");
  }
  get elapsedTime() {
    return Date.now() - this.startTime;
  }
  keys() {
    const keys = /* @__PURE__ */ new Set();
    for (const key of this.data.keys()) {
      keys.add(key);
    }
    if (this.parent) {
      for (const key of this.parent.keys()) {
        keys.add(key);
      }
    }
    return Array.from(keys);
  }
  values() {
    return this.keys().map((key) => this.get(key));
  }
  entries() {
    return this.keys().map((key) => [key, this.get(key)]);
  }
  toObject() {
    const result = {};
    for (const key of this.keys()) {
      result[key] = this.get(key);
    }
    return result;
  }
  serialize() {
    return JSON.stringify(this.toObject());
  }
  static deserialize(serialized) {
    try {
      const data = JSON.parse(serialized);
      return new _Context(data);
    } catch (error) {
      throw new SkerError(
        "CONTEXT_ERROR" /* CONTEXT_ERROR */,
        "Failed to deserialize context",
        { serialized },
        error
      );
    }
  }
  clone() {
    return new _Context(this.toObject(), this.parent);
  }
  child(additionalData = {}) {
    const childData = {
      ...this.toObject(),
      ...additionalData
    };
    return new _Context(childData, this);
  }
  merge(other) {
    const mergedData = {
      ...this.toObject(),
      ...other.toObject()
    };
    return new _Context(mergedData);
  }
  clear() {
    this.data.clear();
  }
  size() {
    return (/* @__PURE__ */ new Set([...this.data.keys(), ...this.parent?.keys() || []])).size;
  }
  isEmpty() {
    return this.size() === 0;
  }
  toString() {
    return `Context(requestId=${this.requestId}, traceId=${this.traceId}, keys=[${this.keys().join(", ")}])`;
  }
  inspect() {
    return `Context {
  requestId: ${this.requestId}
  traceId: ${this.traceId}
  userId: ${this.userId || "undefined"}
  elapsedTime: ${this.elapsedTime}ms
  data: ${JSON.stringify(this.toObject(), null, 2)}
}`;
  }
};
async function withContext(data, callback) {
  const context = new Context(data);
  return context.run(callback);
}
async function withCurrentContext(additionalData, callback) {
  const context = Context.fork(additionalData);
  return context.run(callback);
}
function getCurrentContext() {
  return Context.current();
}
function ensureContext() {
  return Context.ensure();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ConfigManager,
  Context,
  ErrorCodes,
  EventBus,
  LifecycleManager,
  LifecycleState,
  MiddlewareManager,
  PluginManager,
  SkerCore,
  SkerError,
  createError,
  ensureContext,
  getCurrentContext,
  isError,
  isSkerError,
  withContext,
  withCurrentContext,
  wrapError
});
//# sourceMappingURL=index.cjs.map