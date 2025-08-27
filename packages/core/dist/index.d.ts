type AsyncHandler<T = any> = (data?: T) => Promise<void>;
type SyncHandler<T = any> = (data?: T) => void;
type EventHandler<T = any> = AsyncHandler<T> | SyncHandler<T>;
interface CoreOptions {
    serviceName: string;
    version: string;
    environment?: string;
    plugins?: PluginConfig[];
    config?: ConfigOptions;
    lifecycle?: LifecycleOptions;
}
interface PluginConfig {
    name: string;
    package?: string;
    options?: Record<string, any>;
    enabled?: boolean;
}
interface ConfigOptions {
    sources?: ConfigSource[];
    defaultConfig?: Record<string, any>;
    schema?: any;
}
interface ConfigSource {
    type: 'env' | 'file' | 'remote';
    prefix?: string;
    path?: string;
    url?: string;
}
interface LifecycleOptions {
    startTimeout?: number;
    stopTimeout?: number;
    gracefulShutdown?: boolean;
}
interface LifecycleHook {
    name: string | undefined;
    handler: AsyncHandler;
    timeout: number | undefined;
}
interface Plugin {
    name: string;
    version: string;
    initialize: (context: PluginContext) => Promise<void>;
    destroy: () => Promise<void>;
}
interface PluginContext {
    core: any;
    config: Record<string, any>;
    logger?: any;
}
interface MiddlewareContext {
    request?: any;
    response?: any;
    data?: any;
    metadata?: Record<string, any>;
}
type MiddlewareHandler = (context: MiddlewareContext, next: () => Promise<void>) => Promise<void>;
interface ContextData {
    requestId?: string;
    userId?: string;
    traceId?: string;
    [key: string]: any;
}
declare enum ErrorCodes {
    UNKNOWN = "UNKNOWN",
    INITIALIZATION_FAILED = "INITIALIZATION_FAILED",
    START_FAILED = "START_FAILED",
    STOP_FAILED = "STOP_FAILED",
    CONFIG_ERROR = "CONFIG_ERROR",
    PLUGIN_ERROR = "PLUGIN_ERROR",
    CONTEXT_ERROR = "CONTEXT_ERROR",
    MIDDLEWARE_ERROR = "MIDDLEWARE_ERROR",
    EVENT_ERROR = "EVENT_ERROR"
}
type StringToken<T> = string & {
    __type?: T;
};
declare const ERROR: StringToken<{
    error: unknown;
    event: StringToken<any>;
}>;
declare const MEMORY_USAGE: StringToken<{
    memoryUsage: NodeJS.MemoryUsage;
    usage: number;
    threshold: number;
}>;
declare const MEMORY_THRESHOLD_EXCEEDED: StringToken<{
    memoryUsage: NodeJS.MemoryUsage;
    usage: number;
    threshold: number;
}>;
declare const LIFECYCLE_ERROR: StringToken<{
    error: unknown;
    event: StringToken<any>;
}>;
declare const CONFIG_CHANGE: StringToken<{
    key: string;
    value: any;
    oldValue: any;
}>;
declare const CONFIG_RESET: StringToken<{
    oldConfig: Record<string, any>;
    newConfig: Record<string, any>;
}>;
declare const LIFECYCLE_STARTING: StringToken<{}>;
declare const LIFECYCLE_STARTED: StringToken<{}>;
declare const LIFECYCLE_STOPPING: StringToken<{}>;
declare const LIFECYCLE_STOPPED: StringToken<{}>;
declare const LIFECYCLE_STATE_CHANGED: StringToken<{
    oldState: any;
    newState: any;
}>;
declare const LIFECYCLE_HOOK_EXECUTING: StringToken<{
    name: string;
    phase: 'start' | 'stop';
}>;
declare const LIFECYCLE_HOOK_EXECUTED: StringToken<{
    name: string;
    phase: 'start' | 'stop';
}>;
declare const LIFECYCLE_HOOK_ERROR: StringToken<{
    name: string;
    phase: 'start' | 'stop';
    error: unknown;
}>;
declare const MIDDLEWARE_ADDED: StringToken<{
    middleware: any;
}>;
declare const MIDDLEWARE_REMOVED: StringToken<{
    middleware: any;
}>;
declare const MIDDLEWARE_ENABLED: StringToken<{
    name: string;
}>;
declare const MIDDLEWARE_DISABLED: StringToken<{
    name: string;
}>;
declare const MIDDLEWARES_CLEARED: StringToken<{
    count: number;
}>;
declare const MIDDLEWARE_EXECUTING: StringToken<{
    name: string;
    context: MiddlewareContext;
}>;
declare const MIDDLEWARE_EXECUTED: StringToken<{
    name: string;
    context: MiddlewareContext;
}>;
declare const MIDDLEWARE_ERROR: StringToken<{
    name: string;
    error: unknown;
    context: MiddlewareContext;
}>;
declare const MIDDLEWARE_CHAIN_COMPLETED: StringToken<{
    executedMiddlewares: string[];
    context: MiddlewareContext;
}>;
declare const MIDDLEWARE_CHAIN_FAILED: StringToken<{
    error: unknown;
    executedMiddlewares: string[];
    context: MiddlewareContext;
}>;
declare const MIDDLEWARE_TIMEOUT: StringToken<{
    timeout: number;
    context: MiddlewareContext;
}>;
declare const MIDDLEWARE_INSERTED: StringToken<{
    middleware: any;
    beforeName?: string;
    afterName?: string;
}>;
declare const PLUGIN_REGISTERED: StringToken<{
    name: string;
    plugin: any;
    config: PluginConfig;
}>;
declare const PLUGIN_UNREGISTERED: StringToken<{
    name: string;
}>;
declare const PLUGIN_SKIPPED: StringToken<{
    name: string;
    reason: string;
}>;
declare const PLUGIN_INITIALIZING: StringToken<{
    name: string;
}>;
declare const PLUGIN_INITIALIZED: StringToken<{
    name: string;
}>;
declare const PLUGIN_ERROR: StringToken<{
    name: string;
    error: unknown;
    phase: string;
}>;
declare const PLUGIN_DESTROYING: StringToken<{
    name: string;
}>;
declare const PLUGIN_DESTROYED: StringToken<{
    name: string;
}>;
declare const PLUGIN_ENABLED: StringToken<{
    name: string;
}>;
declare const PLUGIN_DISABLED: StringToken<{
    name: string;
}>;
declare const PLUGIN_CONFIG_UPDATED: StringToken<{
    name: string;
    oldConfig: Record<string, any>;
    newConfig: Record<string, any>;
}>;
declare const CORE_INITIALIZED: StringToken<{
    serviceName: string;
    version: string;
    environment: string;
}>;
declare const CORE_STARTING: StringToken<{}>;
declare const CORE_STARTED: StringToken<{
    serviceName: string;
    version: string;
    uptime: number;
}>;
declare const CORE_START_FAILED: StringToken<{
    error: unknown;
}>;
declare const CORE_STOPPING: StringToken<{}>;
declare const CORE_STOPPED: StringToken<{
    serviceName: string;
    uptime: number;
}>;
declare const CORE_STOP_FAILED: StringToken<{
    error: unknown;
}>;
declare const CORE_RESTARTING: StringToken<{}>;
declare const CORE_RESTARTED: StringToken<{}>;
declare const CORE_RESTART_FAILED: StringToken<{
    error: unknown;
}>;
declare const CORE_PLUGIN_ERROR: StringToken<{
    name: string;
    error: unknown;
    phase: string;
}>;
declare const CORE_MIDDLEWARE_ERROR: StringToken<{
    name: string;
    error: unknown;
    context: MiddlewareContext;
}>;
declare const CORE_CONFIG_CHANGE: StringToken<{
    key: string;
    value: any;
    oldValue: any;
}>;

declare class EventBus {
    private listeners;
    private maxListeners;
    private onceListeners;
    on<T = any>(event: StringToken<T>, handler: EventHandler<T>): void;
    once<T = any>(event: StringToken<T>, handler: EventHandler<T>): void;
    off<T>(event: StringToken<T>, handler?: EventHandler<T>): void;
    emit<T = any>(event: StringToken<T>, data?: T): void;
    emitAsync<T = any>(event: StringToken<T>, data?: T): Promise<void>;
    removeAllListeners<T = any>(event?: StringToken<T>): void;
    listenerCount<T = any>(event: StringToken<T>): number;
    eventNames<T = any>(): StringToken<T>[];
    setMaxListeners(n: number): void;
    getMaxListeners(): number;
    private isAsyncHandler;
    private handleError;
}

declare class ConfigManager extends EventBus {
    private config;
    private readonly sources;
    private readonly defaultConfig;
    private readonly schema?;
    private watchers;
    constructor(options?: ConfigOptions);
    get<T = any>(key: string): T;
    set(key: string, value: any): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    getAll(): Record<string, any>;
    reset(): void;
    onChange(key: string, handler: (value: any) => void): () => void;
    validate(): boolean;
    private loadConfig;
    private loadFromSource;
    private loadFromEnv;
    private loadFromFile;
    private loadFromRemote;
    private parseEnvValue;
    private getNestedValue;
    private setNestedValue;
    private deleteNestedValue;
    private notifyWatchers;
}

declare enum LifecycleState {
    CREATED = "created",
    STARTING = "starting",
    STARTED = "started",
    STOPPING = "stopping",
    STOPPED = "stopped",
    ERROR = "error"
}
declare class LifecycleManager extends EventBus {
    private state;
    private readonly startHooks;
    private readonly stopHooks;
    private readonly options;
    private startPromise?;
    private stopPromise?;
    constructor(options?: LifecycleOptions);
    get currentState(): LifecycleState;
    get isStarted(): boolean;
    get isStopped(): boolean;
    get isStarting(): boolean;
    get isStopping(): boolean;
    onStart(handler: AsyncHandler, options?: {
        name?: string;
        timeout?: number;
    }): void;
    onStop(handler: AsyncHandler, options?: {
        name?: string;
        timeout?: number;
    }): void;
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    removeStartHook(name: string): boolean;
    removeStopHook(name: string): boolean;
    private doStart;
    private doStop;
    private executeHook;
    private createTimeoutPromise;
    private setState;
    private setupGracefulShutdown;
}

declare class PluginManager extends EventBus {
    private plugins;
    private readonly core;
    private initializationOrder;
    constructor(core: any);
    register(name: string, plugin: Plugin, config?: PluginConfig): void;
    unregister(name: string): void;
    initialize(name: string): Promise<void>;
    initializeAll(): Promise<void>;
    destroy(name: string): Promise<void>;
    destroyAll(): Promise<void>;
    get<T = any>(name: string): T | undefined;
    has(name: string): boolean;
    isInitialized(name: string): boolean;
    getRegisteredPlugins(): string[];
    getInitializedPlugins(): string[];
    getPluginInfo(name: string): PluginConfig | undefined;
    getAllPluginInfo(): Record<string, PluginConfig & {
        initialized: boolean;
    }>;
    enable(name: string): Promise<void>;
    disable(name: string): Promise<void>;
    updatePluginConfig(name: string, config: Record<string, any>): void;
}

interface MiddlewareInfo {
    handler: MiddlewareHandler;
    name: string | undefined;
    priority: number;
    enabled: boolean;
}
declare class MiddlewareManager extends EventBus {
    private middlewares;
    private sorted;
    use(handler: MiddlewareHandler, options?: {
        name?: string;
        priority?: number;
        enabled?: boolean;
    }): void;
    remove(nameOrHandler: string | MiddlewareHandler): boolean;
    enable(name: string): boolean;
    disable(name: string): boolean;
    clear(): void;
    execute(context: MiddlewareContext): Promise<void>;
    executeWithTimeout(context: MiddlewareContext, timeout: number): Promise<void>;
    getMiddlewares(): Array<{
        name?: string;
        priority: number;
        enabled: boolean;
    }>;
    getEnabledMiddlewares(): MiddlewareInfo[];
    getMiddlewareCount(): number;
    getEnabledMiddlewareCount(): number;
    hasMiddleware(nameOrHandler: string | MiddlewareHandler): boolean;
    insertBefore(beforeName: string, handler: MiddlewareHandler, options?: {
        name?: string;
        priority?: number;
        enabled?: boolean;
    }): boolean;
    insertAfter(afterName: string, handler: MiddlewareHandler, options?: {
        name?: string;
        priority?: number;
        enabled?: boolean;
    }): boolean;
    private sortMiddlewares;
}

declare class SkerCore extends EventBus {
    private readonly options;
    private readonly configManager;
    private readonly lifecycleManager;
    private readonly pluginManager;
    private readonly middlewareManager;
    private readonly startTime;
    constructor(options: CoreOptions);
    get serviceName(): string;
    get version(): string;
    get environment(): string;
    get uptime(): number;
    get state(): LifecycleState;
    get isStarted(): boolean;
    get isStopped(): boolean;
    start(): Promise<void>;
    stop(): Promise<void>;
    restart(): Promise<void>;
    getConfig(): ConfigManager;
    getLifecycle(): LifecycleManager;
    getPlugins(): PluginManager;
    getMiddleware(): MiddlewareManager;
    getPlugin<T = any>(name: string): T;
    hasPlugin(name: string): boolean;
    getInfo(): {
        serviceName: string;
        version: string;
        environment: string;
        state: LifecycleState;
        uptime: number;
        plugins: string[];
        config: Record<string, any>;
    };
    enableMemoryMonitoring(options?: {
        interval?: number;
        threshold?: number;
    }): void;
    private setupEventHandlers;
    private registerPlugins;
    private setupLifecycleHooks;
}

declare class Context {
    private readonly data;
    private readonly startTime;
    private readonly parent;
    constructor(initialData?: ContextData, parent?: Context);
    static current(): Context | undefined;
    static ensure(): Context;
    static create(data?: ContextData): Context;
    static fork(additionalData?: ContextData): Context;
    run<T>(callback: () => T | Promise<T>): Promise<T>;
    get<T = any>(key: string): T | undefined;
    set<T = any>(key: string, value: T): void;
    has(key: string): boolean;
    delete(key: string): boolean;
    get requestId(): string;
    get userId(): string | undefined;
    get traceId(): string;
    get elapsedTime(): number;
    keys(): string[];
    values(): any[];
    entries(): Array<[string, any]>;
    toObject(): ContextData;
    serialize(): string;
    static deserialize(serialized: string): Context;
    clone(): Context;
    child(additionalData?: ContextData): Context;
    merge(other: Context): Context;
    clear(): void;
    size(): number;
    isEmpty(): boolean;
    toString(): string;
    inspect(): string;
}
declare function withContext<T>(data: ContextData, callback: () => T | Promise<T>): Promise<T>;
declare function withCurrentContext<T>(additionalData: ContextData, callback: () => T | Promise<T>): Promise<T>;
declare function getCurrentContext(): Context | undefined;
declare function ensureContext(): Context;

declare class SkerError extends Error {
    readonly code: ErrorCodes;
    readonly details: Record<string, any> | undefined;
    readonly cause: Error | undefined;
    constructor(code?: ErrorCodes, message?: string, details?: Record<string, any>, cause?: Error);
    toJSON(): Record<string, any>;
    toString(): string;
}
declare function createError(code: ErrorCodes, message?: string, details?: Record<string, any>, cause?: Error): SkerError;
declare function isError(error: any): error is Error;
declare function isSkerError(error: any): error is SkerError;
declare function wrapError(error: unknown, code: ErrorCodes, message?: string): SkerError;

export { type AsyncHandler, CONFIG_CHANGE, CONFIG_RESET, CORE_CONFIG_CHANGE, CORE_INITIALIZED, CORE_MIDDLEWARE_ERROR, CORE_PLUGIN_ERROR, CORE_RESTARTED, CORE_RESTARTING, CORE_RESTART_FAILED, CORE_STARTED, CORE_STARTING, CORE_START_FAILED, CORE_STOPPED, CORE_STOPPING, CORE_STOP_FAILED, ConfigManager, type ConfigOptions, type ConfigSource, Context, type ContextData, type CoreOptions, ERROR, ErrorCodes, EventBus, type EventHandler, LIFECYCLE_ERROR, LIFECYCLE_HOOK_ERROR, LIFECYCLE_HOOK_EXECUTED, LIFECYCLE_HOOK_EXECUTING, LIFECYCLE_STARTED, LIFECYCLE_STARTING, LIFECYCLE_STATE_CHANGED, LIFECYCLE_STOPPED, LIFECYCLE_STOPPING, type LifecycleHook, LifecycleManager, type LifecycleOptions, LifecycleState, MEMORY_THRESHOLD_EXCEEDED, MEMORY_USAGE, MIDDLEWARES_CLEARED, MIDDLEWARE_ADDED, MIDDLEWARE_CHAIN_COMPLETED, MIDDLEWARE_CHAIN_FAILED, MIDDLEWARE_DISABLED, MIDDLEWARE_ENABLED, MIDDLEWARE_ERROR, MIDDLEWARE_EXECUTED, MIDDLEWARE_EXECUTING, MIDDLEWARE_INSERTED, MIDDLEWARE_REMOVED, MIDDLEWARE_TIMEOUT, type MiddlewareContext, type MiddlewareHandler, MiddlewareManager, PLUGIN_CONFIG_UPDATED, PLUGIN_DESTROYED, PLUGIN_DESTROYING, PLUGIN_DISABLED, PLUGIN_ENABLED, PLUGIN_ERROR, PLUGIN_INITIALIZED, PLUGIN_INITIALIZING, PLUGIN_REGISTERED, PLUGIN_SKIPPED, PLUGIN_UNREGISTERED, type Plugin, type PluginConfig, type PluginContext, PluginManager, SkerCore, SkerError, type StringToken, type SyncHandler, createError, ensureContext, getCurrentContext, isError, isSkerError, withContext, withCurrentContext, wrapError };
