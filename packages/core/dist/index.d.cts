import { SystemError } from '@sker/error-core';
export { isSkerError, wrapError } from '@sker/error-core';
export { CONFIG_CHANGE, CONFIG_RESET, CORE_CONFIG_CHANGE, CORE_INITIALIZED, CORE_MIDDLEWARE_ERROR, CORE_PLUGIN_ERROR, CORE_RESTARTED, CORE_RESTARTING, CORE_RESTART_FAILED, CORE_STARTED, CORE_STARTING, CORE_START_FAILED, CORE_STOPPED, CORE_STOPPING, CORE_STOP_FAILED, ERROR, LIFECYCLE_ERROR, LIFECYCLE_HOOK_ERROR, LIFECYCLE_HOOK_EXECUTED, LIFECYCLE_HOOK_EXECUTING, LIFECYCLE_STARTED, LIFECYCLE_STARTING, LIFECYCLE_STATE_CHANGED, LIFECYCLE_STOPPED, LIFECYCLE_STOPPING, MEMORY_THRESHOLD_EXCEEDED, MEMORY_USAGE, MIDDLEWARES_CLEARED, MIDDLEWARE_ADDED, MIDDLEWARE_CHAIN_COMPLETED, MIDDLEWARE_CHAIN_FAILED, MIDDLEWARE_DISABLED, MIDDLEWARE_ENABLED, MIDDLEWARE_ERROR, MIDDLEWARE_EXECUTED, MIDDLEWARE_EXECUTING, MIDDLEWARE_INSERTED, MIDDLEWARE_REMOVED, MIDDLEWARE_TIMEOUT, PLUGIN_CONFIG_UPDATED, PLUGIN_DESTROYED, PLUGIN_DESTROYING, PLUGIN_DISABLED, PLUGIN_ENABLED, PLUGIN_ERROR, PLUGIN_INITIALIZED, PLUGIN_INITIALIZING, PLUGIN_REGISTERED, PLUGIN_SKIPPED, PLUGIN_UNREGISTERED } from '@sker/constants';

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
type StringToken<T> = string & {
    __type?: T;
};

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
    setupEventHandlers(): void;
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

declare const ErrorCodes: {
    readonly UNKNOWN: "100000";
    readonly INITIALIZATION_FAILED: "100006";
    readonly START_FAILED: "100007";
    readonly STOP_FAILED: "100008";
    readonly CONFIG_ERROR: "150001";
    readonly PLUGIN_ERROR: "150002";
    readonly CONTEXT_ERROR: "150003";
    readonly MIDDLEWARE_ERROR: "150004";
    readonly EVENT_ERROR: "150005";
};
type ErrorCodes = typeof ErrorCodes[keyof typeof ErrorCodes];
declare class SkerError extends SystemError {
    readonly message: string;
    constructor(code?: string, message?: string, details?: any[] | Record<string, any>, cause?: Error);
}
declare function createError(code: string, message?: string, details?: any[] | Record<string, any>, cause?: Error): SkerError;
declare function isError(error: any): error is Error;

export { type AsyncHandler, ConfigManager, type ConfigOptions, type ConfigSource, Context, type ContextData, type CoreOptions, ErrorCodes, EventBus, type EventHandler, type LifecycleHook, LifecycleManager, type LifecycleOptions, LifecycleState, type MiddlewareContext, type MiddlewareHandler, MiddlewareManager, type Plugin, type PluginConfig, type PluginContext, PluginManager, SkerCore, SkerError, type StringToken, type SyncHandler, createError, ensureContext, getCurrentContext, isError, withContext, withCurrentContext };
