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
  CONFIG_CHANGE: () => import_constants.CONFIG_CHANGE,
  CONFIG_RESET: () => import_constants.CONFIG_RESET,
  CORE_CONFIG_CHANGE: () => import_constants.CORE_CONFIG_CHANGE,
  CORE_INITIALIZED: () => import_constants.CORE_INITIALIZED,
  CORE_MIDDLEWARE_ERROR: () => import_constants.CORE_MIDDLEWARE_ERROR,
  CORE_PLUGIN_ERROR: () => import_constants.CORE_PLUGIN_ERROR,
  CORE_RESTARTED: () => import_constants.CORE_RESTARTED,
  CORE_RESTARTING: () => import_constants.CORE_RESTARTING,
  CORE_RESTART_FAILED: () => import_constants.CORE_RESTART_FAILED,
  CORE_STARTED: () => import_constants.CORE_STARTED,
  CORE_STARTING: () => import_constants.CORE_STARTING,
  CORE_START_FAILED: () => import_constants.CORE_START_FAILED,
  CORE_STOPPED: () => import_constants.CORE_STOPPED,
  CORE_STOPPING: () => import_constants.CORE_STOPPING,
  CORE_STOP_FAILED: () => import_constants.CORE_STOP_FAILED,
  ConfigManager: () => ConfigManager,
  Context: () => Context,
  ERROR: () => import_constants.ERROR,
  ErrorCodes: () => ErrorCodes,
  EventBus: () => EventBus,
  LIFECYCLE_ERROR: () => import_constants.LIFECYCLE_ERROR,
  LIFECYCLE_HOOK_ERROR: () => import_constants.LIFECYCLE_HOOK_ERROR,
  LIFECYCLE_HOOK_EXECUTED: () => import_constants.LIFECYCLE_HOOK_EXECUTED,
  LIFECYCLE_HOOK_EXECUTING: () => import_constants.LIFECYCLE_HOOK_EXECUTING,
  LIFECYCLE_STARTED: () => import_constants.LIFECYCLE_STARTED,
  LIFECYCLE_STARTING: () => import_constants.LIFECYCLE_STARTING,
  LIFECYCLE_STATE_CHANGED: () => import_constants.LIFECYCLE_STATE_CHANGED,
  LIFECYCLE_STOPPED: () => import_constants.LIFECYCLE_STOPPED,
  LIFECYCLE_STOPPING: () => import_constants.LIFECYCLE_STOPPING,
  LifecycleManager: () => LifecycleManager,
  LifecycleState: () => LifecycleState,
  MEMORY_THRESHOLD_EXCEEDED: () => import_constants.MEMORY_THRESHOLD_EXCEEDED,
  MEMORY_USAGE: () => import_constants.MEMORY_USAGE,
  MIDDLEWARES_CLEARED: () => import_constants.MIDDLEWARES_CLEARED,
  MIDDLEWARE_ADDED: () => import_constants.MIDDLEWARE_ADDED,
  MIDDLEWARE_CHAIN_COMPLETED: () => import_constants.MIDDLEWARE_CHAIN_COMPLETED,
  MIDDLEWARE_CHAIN_FAILED: () => import_constants.MIDDLEWARE_CHAIN_FAILED,
  MIDDLEWARE_DISABLED: () => import_constants.MIDDLEWARE_DISABLED,
  MIDDLEWARE_ENABLED: () => import_constants.MIDDLEWARE_ENABLED,
  MIDDLEWARE_ERROR: () => import_constants.MIDDLEWARE_ERROR,
  MIDDLEWARE_EXECUTED: () => import_constants.MIDDLEWARE_EXECUTED,
  MIDDLEWARE_EXECUTING: () => import_constants.MIDDLEWARE_EXECUTING,
  MIDDLEWARE_INSERTED: () => import_constants.MIDDLEWARE_INSERTED,
  MIDDLEWARE_REMOVED: () => import_constants.MIDDLEWARE_REMOVED,
  MIDDLEWARE_TIMEOUT: () => import_constants.MIDDLEWARE_TIMEOUT,
  MiddlewareManager: () => MiddlewareManager,
  PLUGIN_CONFIG_UPDATED: () => import_constants.PLUGIN_CONFIG_UPDATED,
  PLUGIN_DESTROYED: () => import_constants.PLUGIN_DESTROYED,
  PLUGIN_DESTROYING: () => import_constants.PLUGIN_DESTROYING,
  PLUGIN_DISABLED: () => import_constants.PLUGIN_DISABLED,
  PLUGIN_ENABLED: () => import_constants.PLUGIN_ENABLED,
  PLUGIN_ERROR: () => import_constants.PLUGIN_ERROR,
  PLUGIN_INITIALIZED: () => import_constants.PLUGIN_INITIALIZED,
  PLUGIN_INITIALIZING: () => import_constants.PLUGIN_INITIALIZING,
  PLUGIN_REGISTERED: () => import_constants.PLUGIN_REGISTERED,
  PLUGIN_SKIPPED: () => import_constants.PLUGIN_SKIPPED,
  PLUGIN_UNREGISTERED: () => import_constants.PLUGIN_UNREGISTERED,
  PluginManager: () => PluginManager,
  SkerCore: () => SkerCore,
  SkerError: () => SkerError,
  createError: () => createError,
  ensureContext: () => ensureContext,
  getCurrentContext: () => getCurrentContext,
  isError: () => isError,
  isSkerError: () => import_error_core.isSkerError,
  withContext: () => withContext,
  withCurrentContext: () => withCurrentContext,
  wrapError: () => import_error_core.wrapError
});
module.exports = __toCommonJS(index_exports);

// src/types/index.ts
var import_constants = require("@sker/constants");

// src/errors/index.ts
var import_error_core = require("@sker/error-core");
var import_constants2 = require("@sker/constants");
var ErrorCodes = {
  UNKNOWN: "100000",
  INITIALIZATION_FAILED: "100006",
  START_FAILED: "100007",
  STOP_FAILED: "100008",
  CONFIG_ERROR: "150001",
  PLUGIN_ERROR: "150002",
  CONTEXT_ERROR: "150003",
  MIDDLEWARE_ERROR: "150004",
  EVENT_ERROR: "150005"
};
var SkerError = class extends import_error_core.SystemError {
  constructor(code = ErrorCodes.UNKNOWN, message, details, cause) {
    let formattedDetails = [];
    if (Array.isArray(details)) {
      formattedDetails = details;
    } else if (details && typeof details === "object") {
      formattedDetails = [{
        field: "details",
        error_code: code,
        error_message: JSON.stringify(details)
      }];
    }
    super({
      code,
      message: message || code,
      details: formattedDetails,
      originalError: cause,
      context: {}
    });
  }
};
function createError(code, message, details, cause) {
  return new SkerError(code, message, details, cause);
}
function isError(error) {
  return error instanceof Error;
}

// src/events/index.ts
var EventBus = class {
  listeners = /* @__PURE__ */ new Map();
  maxListeners = 10;
  onceListeners = /* @__PURE__ */ new Map();
  on(event, handler) {
    if (!event || typeof handler !== "function") {
      throw new SkerError(
        ErrorCodes.EVENT_ERROR,
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
        ErrorCodes.EVENT_ERROR,
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
      throw new SkerError(ErrorCodes.EVENT_ERROR, "Event name is required");
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
      throw new SkerError(ErrorCodes.EVENT_ERROR, "Event name is required");
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
      throw new SkerError(ErrorCodes.EVENT_ERROR, "Event name is required");
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
        ErrorCodes.EVENT_ERROR,
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
        ErrorCodes.EVENT_ERROR,
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
      this.emit(import_constants.ERROR, { error, event });
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
      this.emit(import_constants.CONFIG_CHANGE, { key, value, oldValue });
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
      this.emit(import_constants.CONFIG_CHANGE, { key, value: void 0, oldValue });
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
    this.emit(import_constants.CONFIG_RESET, { oldConfig, newConfig: this.config });
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
        ErrorCodes.CONFIG_ERROR,
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
        ErrorCodes.CONFIG_ERROR,
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
            ErrorCodes.CONFIG_ERROR,
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
      throw new SkerError(ErrorCodes.CONFIG_ERROR, "File path is required for file source");
    }
    try {
      const fullPath = (0, import_path.join)(process.cwd(), filePath);
      const content = (0, import_fs.readFileSync)(fullPath, "utf-8");
      let parsed;
      if (filePath.endsWith(".json")) {
        parsed = JSON.parse(content);
      } else if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
        throw new SkerError(ErrorCodes.CONFIG_ERROR, "JavaScript config files not supported yet");
      } else {
        throw new SkerError(ErrorCodes.CONFIG_ERROR, "Unsupported config file format");
      }
      Object.assign(this.config, parsed);
    } catch (error) {
      throw new SkerError(
        ErrorCodes.CONFIG_ERROR,
        `Failed to load config from file: ${filePath}`,
        { filePath },
        error
      );
    }
  }
  loadFromRemote(url) {
    if (!url) {
      throw new SkerError(ErrorCodes.CONFIG_ERROR, "URL is required for remote source");
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
      throw new SkerError(ErrorCodes.INITIALIZATION_FAILED, "Start handler must be a function");
    }
    this.startHooks.push({
      handler,
      name: options?.name || void 0,
      timeout: options?.timeout || this.options.startTimeout
    });
  }
  onStop(handler, options) {
    if (typeof handler !== "function") {
      throw new SkerError(ErrorCodes.INITIALIZATION_FAILED, "Stop handler must be a function");
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
        ErrorCodes.START_FAILED,
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
        ErrorCodes.STOP_FAILED,
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
      this.emit(import_constants.LIFECYCLE_STARTING, {});
      for (const hook of this.startHooks) {
        await this.executeHook(hook, "start");
      }
      this.setState("started" /* STARTED */);
      this.emit(import_constants.LIFECYCLE_STARTED, {});
    } catch (error) {
      this.setState("error" /* ERROR */);
      this.emit(import_constants.ERROR, { error, event: import_constants.LIFECYCLE_STARTING });
      throw new SkerError(
        ErrorCodes.START_FAILED,
        "Failed to start lifecycle",
        { state: this.state },
        error
      );
    }
  }
  async doStop() {
    try {
      this.setState("stopping" /* STOPPING */);
      this.emit(import_constants.LIFECYCLE_STOPPING, {});
      for (const hook of this.stopHooks) {
        await this.executeHook(hook, "stop");
      }
      this.setState("stopped" /* STOPPED */);
      this.emit(import_constants.LIFECYCLE_STOPPED, {});
    } catch (error) {
      this.setState("error" /* ERROR */);
      this.emit(import_constants.ERROR, { error, event: import_constants.LIFECYCLE_STOPPING });
      throw new SkerError(
        ErrorCodes.STOP_FAILED,
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
      this.emit(import_constants.LIFECYCLE_HOOK_EXECUTING, { name: hookName, phase });
      await Promise.race([
        hook.handler(),
        this.createTimeoutPromise(timeout, hookName, phase)
      ]);
      this.emit(import_constants.LIFECYCLE_HOOK_EXECUTED, { name: hookName, phase });
    } catch (error) {
      this.emit(import_constants.LIFECYCLE_HOOK_ERROR, { name: hookName, phase, error });
      throw new SkerError(
        phase === "start" ? ErrorCodes.START_FAILED : ErrorCodes.STOP_FAILED,
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
          phase === "start" ? ErrorCodes.START_FAILED : ErrorCodes.STOP_FAILED,
          `${phase} hook "${hookName}" timed out after ${timeout}ms`
        ));
      }, timeout);
    });
  }
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    this.emit(import_constants.LIFECYCLE_STATE_CHANGED, { oldState, newState });
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
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, "Plugin name is required");
    }
    if (!plugin || typeof plugin.initialize !== "function") {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        "Plugin must have an initialize method"
      );
    }
    if (this.plugins.has(name)) {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
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
    this.emit(import_constants.PLUGIN_REGISTERED, { name, plugin, config });
  }
  unregister(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      return;
    }
    if (pluginInstance.initialized) {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Cannot unregister initialized plugin "${name}". Destroy it first.`
      );
    }
    this.plugins.delete(name);
    this.emit(import_constants.PLUGIN_UNREGISTERED, { name });
  }
  async initialize(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, `Plugin "${name}" not found`);
    }
    if (pluginInstance.initialized) {
      return;
    }
    if (pluginInstance.config.enabled === false) {
      this.emit(import_constants.PLUGIN_SKIPPED, { name, reason: "disabled" });
      return;
    }
    try {
      this.emit(import_constants.PLUGIN_INITIALIZING, { name });
      pluginInstance.instance = await pluginInstance.plugin.initialize(pluginInstance.context);
      pluginInstance.initialized = true;
      this.initializationOrder.push(name);
      this.emit(import_constants.PLUGIN_INITIALIZED, { name });
    } catch (error) {
      this.emit(import_constants.PLUGIN_ERROR, { name, error, phase: "initialize" });
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
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
        ErrorCodes.PLUGIN_ERROR,
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
      this.emit(import_constants.PLUGIN_DESTROYING, { name });
      if (typeof pluginInstance.plugin.destroy === "function") {
        await pluginInstance.plugin.destroy();
      }
      pluginInstance.initialized = false;
      pluginInstance.instance = void 0;
      const index = this.initializationOrder.indexOf(name);
      if (index >= 0) {
        this.initializationOrder.splice(index, 1);
      }
      this.emit(import_constants.PLUGIN_DESTROYED, { name });
    } catch (error) {
      this.emit(import_constants.PLUGIN_ERROR, { name, error, phase: "destroy" });
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
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
        ErrorCodes.PLUGIN_ERROR,
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
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, `Plugin "${name}" not found`);
    }
    if (pluginInstance.config.enabled !== false) {
      return;
    }
    pluginInstance.config.enabled = true;
    if (!pluginInstance.initialized) {
      await this.initialize(name);
    }
    this.emit(import_constants.PLUGIN_ENABLED, { name });
  }
  async disable(name) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, `Plugin "${name}" not found`);
    }
    if (pluginInstance.config.enabled === false) {
      return;
    }
    if (pluginInstance.initialized) {
      await this.destroy(name);
    }
    pluginInstance.config.enabled = false;
    this.emit(import_constants.PLUGIN_DISABLED, { name });
  }
  updatePluginConfig(name, config) {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, `Plugin "${name}" not found`);
    }
    const oldConfig = { ...pluginInstance.context.config };
    pluginInstance.context.config = { ...pluginInstance.context.config, ...config };
    pluginInstance.config.options = { ...pluginInstance.config.options, ...config };
    this.emit(import_constants.PLUGIN_CONFIG_UPDATED, { name, oldConfig, newConfig: pluginInstance.context.config });
  }
};

// src/middleware/index.ts
var MiddlewareManager = class extends EventBus {
  middlewares = [];
  sorted = true;
  use(handler, options) {
    if (typeof handler !== "function") {
      throw new SkerError(
        ErrorCodes.MIDDLEWARE_ERROR,
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
    this.emit(import_constants.MIDDLEWARE_ADDED, { middleware });
  }
  remove(nameOrHandler) {
    const index = this.middlewares.findIndex(
      (mw) => typeof nameOrHandler === "string" && mw.name === nameOrHandler || typeof nameOrHandler === "function" && mw.handler === nameOrHandler
    );
    if (index >= 0) {
      const removed = this.middlewares.splice(index, 1)[0];
      this.emit(import_constants.MIDDLEWARE_REMOVED, { middleware: removed });
      return true;
    }
    return false;
  }
  enable(name) {
    const middleware = this.middlewares.find((mw) => mw.name === name);
    if (middleware) {
      middleware.enabled = true;
      this.emit(import_constants.MIDDLEWARE_ENABLED, { name });
      return true;
    }
    return false;
  }
  disable(name) {
    const middleware = this.middlewares.find((mw) => mw.name === name);
    if (middleware) {
      middleware.enabled = false;
      this.emit(import_constants.MIDDLEWARE_DISABLED, { name });
      return true;
    }
    return false;
  }
  clear() {
    const count = this.middlewares.length;
    this.middlewares = [];
    this.sorted = true;
    this.emit(import_constants.MIDDLEWARES_CLEARED, { count });
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
        this.emit(import_constants.MIDDLEWARE_EXECUTING, { name: middlewareName, context });
        executedMiddlewares.push(middlewareName);
        await middleware.handler(context, next);
        this.emit(import_constants.MIDDLEWARE_EXECUTED, { name: middlewareName, context });
      } catch (error) {
        this.emit(import_constants.MIDDLEWARE_ERROR, { name: middlewareName, error, context });
        throw new SkerError(
          ErrorCodes.MIDDLEWARE_ERROR,
          `Middleware "${middlewareName}" failed`,
          { middlewareName, executedMiddlewares },
          error
        );
      }
    };
    try {
      await next();
      this.emit(import_constants.MIDDLEWARE_CHAIN_COMPLETED, { executedMiddlewares, context });
    } catch (error) {
      this.emit(import_constants.MIDDLEWARE_CHAIN_FAILED, { error, executedMiddlewares, context });
      throw error;
    }
  }
  async executeWithTimeout(context, timeout) {
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new SkerError(
          ErrorCodes.MIDDLEWARE_ERROR,
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
        this.emit(import_constants.MIDDLEWARE_TIMEOUT, { timeout, context });
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
    this.emit(import_constants.MIDDLEWARE_INSERTED, { middleware, beforeName });
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
    this.emit(import_constants.MIDDLEWARE_INSERTED, { middleware, afterName });
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
        ErrorCodes.INITIALIZATION_FAILED,
        "Service name is required"
      );
    }
    if (!options.version) {
      throw new SkerError(
        ErrorCodes.INITIALIZATION_FAILED,
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
      this.emit(import_constants.CORE_INITIALIZED, {
        serviceName: this.options.serviceName,
        version: this.options.version,
        environment: this.options.environment
      });
    } catch (error) {
      throw new SkerError(
        ErrorCodes.INITIALIZATION_FAILED,
        "Failed to initialize SkerCore",
        [{ field: "options", error_code: ErrorCodes.INITIALIZATION_FAILED, error_message: `Options: ${JSON.stringify(this.options)}` }],
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
      this.emit(import_constants.CORE_STARTING, {});
      await this.lifecycleManager.start();
      this.emit(import_constants.CORE_STARTED, {
        serviceName: this.serviceName,
        version: this.version,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit(import_constants.CORE_START_FAILED, { error });
      throw error;
    }
  }
  async stop() {
    try {
      this.emit(import_constants.CORE_STOPPING, {});
      await this.lifecycleManager.stop();
      this.emit(import_constants.CORE_STOPPED, {
        serviceName: this.serviceName,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit(import_constants.CORE_STOP_FAILED, { error });
      throw error;
    }
  }
  async restart() {
    try {
      this.emit(import_constants.CORE_RESTARTING, {});
      await this.lifecycleManager.restart();
      this.emit(import_constants.CORE_RESTARTED, {});
    } catch (error) {
      this.emit(import_constants.CORE_RESTART_FAILED, { error });
      throw error;
    }
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
        ErrorCodes.PLUGIN_ERROR,
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
      this.emit(import_constants.MEMORY_USAGE, {
        memoryUsage,
        usage,
        threshold
      });
      if (usage > threshold) {
        this.emit(import_constants.MEMORY_THRESHOLD_EXCEEDED, {
          usage,
          threshold,
          memoryUsage
        });
      }
    }, interval);
  }
  setupEventHandlers() {
    this.lifecycleManager.on(import_constants.ERROR, (error) => {
      this.emit(import_constants.LIFECYCLE_ERROR, error);
    });
    this.pluginManager.on("pluginError", (data) => {
      this.emit(import_constants.CORE_PLUGIN_ERROR, data);
    });
    this.middlewareManager.on("middlewareError", (data) => {
      this.emit(import_constants.CORE_MIDDLEWARE_ERROR, data);
    });
    this.configManager.on("change", (data) => {
      this.emit(import_constants.CORE_CONFIG_CHANGE, data);
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
        ErrorCodes.CONTEXT_ERROR,
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
      throw new SkerError(ErrorCodes.CONTEXT_ERROR, "Context key cannot be empty");
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
        ErrorCodes.CONTEXT_ERROR,
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
  CONFIG_CHANGE,
  CONFIG_RESET,
  CORE_CONFIG_CHANGE,
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
  ConfigManager,
  Context,
  ERROR,
  ErrorCodes,
  EventBus,
  LIFECYCLE_ERROR,
  LIFECYCLE_HOOK_ERROR,
  LIFECYCLE_HOOK_EXECUTED,
  LIFECYCLE_HOOK_EXECUTING,
  LIFECYCLE_STARTED,
  LIFECYCLE_STARTING,
  LIFECYCLE_STATE_CHANGED,
  LIFECYCLE_STOPPED,
  LIFECYCLE_STOPPING,
  LifecycleManager,
  LifecycleState,
  MEMORY_THRESHOLD_EXCEEDED,
  MEMORY_USAGE,
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
  MiddlewareManager,
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