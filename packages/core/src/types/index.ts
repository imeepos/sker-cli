export type AsyncHandler<T = any> = (data?: T) => Promise<void>;
export type SyncHandler<T = any> = (data?: T) => void;
export type EventHandler<T = any> = AsyncHandler<T> | SyncHandler<T>;

export interface CoreOptions {
  serviceName: string;
  version: string;
  environment?: string;
  plugins?: PluginConfig[];
  config?: ConfigOptions;
  lifecycle?: LifecycleOptions;
}

export interface PluginConfig {
  name: string;
  package?: string;
  options?: Record<string, any>;
  enabled?: boolean;
}

export interface ConfigOptions {
  sources?: ConfigSource[];
  defaultConfig?: Record<string, any>;
  schema?: any;
}

export interface ConfigSource {
  type: 'env' | 'file' | 'remote';
  prefix?: string;
  path?: string;
  url?: string;
}

export interface LifecycleOptions {
  startTimeout?: number;
  stopTimeout?: number;
  gracefulShutdown?: boolean;
}

export interface LifecycleHook {
  name: string | undefined;
  handler: AsyncHandler;
  timeout: number | undefined;
}

export interface Plugin {
  name: string;
  version: string;
  initialize: (context: PluginContext) => Promise<void>;
  destroy: () => Promise<void>;
}

export interface PluginContext {
  core: any;
  config: Record<string, any>;
  logger?: any;
}

export interface MiddlewareContext {
  request?: any;
  response?: any;
  data?: any;
  metadata?: Record<string, any>;
}

export type MiddlewareHandler = (
  context: MiddlewareContext,
  next: () => Promise<void>
) => Promise<void>;

export interface ContextData {
  requestId?: string;
  userId?: string;
  traceId?: string;
  [key: string]: any;
}

export enum ErrorCodes {
  UNKNOWN = 'UNKNOWN',
  INITIALIZATION_FAILED = 'INITIALIZATION_FAILED',
  START_FAILED = 'START_FAILED',
  STOP_FAILED = 'STOP_FAILED',
  CONFIG_ERROR = 'CONFIG_ERROR',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
  CONTEXT_ERROR = 'CONTEXT_ERROR',
  MIDDLEWARE_ERROR = 'MIDDLEWARE_ERROR',
  EVENT_ERROR = 'EVENT_ERROR'
}

export type StringToken<T> = string & { __type?: T }
export const ERROR: StringToken<{ error: unknown, event: StringToken<any> }> = `ERROR`;
export const MEMORY_USAGE: StringToken<{
  memoryUsage: NodeJS.MemoryUsage;
  usage: number;
  threshold: number;
}> = `MEMORY_USAGE`;

export const MEMORY_THRESHOLD_EXCEEDED: StringToken<{
  memoryUsage: NodeJS.MemoryUsage;
  usage: number;
  threshold: number;
}> = `memoryThresholdExceeded`

export const LIFECYCLE_ERROR: StringToken<{ error: unknown, event: StringToken<any> }> = `lifecycleError`

export const CONFIG_CHANGE: StringToken<{
  key: string;
  value: any;
  oldValue: any;
}> = `change`;

export const CONFIG_RESET: StringToken<{
  oldConfig: Record<string, any>;
  newConfig: Record<string, any>;
}> = `reset`;

export const LIFECYCLE_STARTING: StringToken<{}> = `starting`;

export const LIFECYCLE_STARTED: StringToken<{}> = `started`;

export const LIFECYCLE_STOPPING: StringToken<{}> = `stopping`;

export const LIFECYCLE_STOPPED: StringToken<{}> = `stopped`;

export const LIFECYCLE_STATE_CHANGED: StringToken<{
  oldState: any;
  newState: any;
}> = `stateChanged`;

export const LIFECYCLE_HOOK_EXECUTING: StringToken<{
  name: string;
  phase: 'start' | 'stop';
}> = `hookExecuting`;

export const LIFECYCLE_HOOK_EXECUTED: StringToken<{
  name: string;
  phase: 'start' | 'stop';
}> = `hookExecuted`;

export const LIFECYCLE_HOOK_ERROR: StringToken<{
  name: string;
  phase: 'start' | 'stop';
  error: unknown;
}> = `hookError`;

export const MIDDLEWARE_ADDED: StringToken<{
  middleware: any;
}> = `middlewareAdded`;

export const MIDDLEWARE_REMOVED: StringToken<{
  middleware: any;
}> = `middlewareRemoved`;

export const MIDDLEWARE_ENABLED: StringToken<{
  name: string;
}> = `middlewareEnabled`;

export const MIDDLEWARE_DISABLED: StringToken<{
  name: string;
}> = `middlewareDisabled`;

export const MIDDLEWARES_CLEARED: StringToken<{
  count: number;
}> = `middlewaresCleared`;

export const MIDDLEWARE_EXECUTING: StringToken<{
  name: string;
  context: MiddlewareContext;
}> = `middlewareExecuting`;

export const MIDDLEWARE_EXECUTED: StringToken<{
  name: string;
  context: MiddlewareContext;
}> = `middlewareExecuted`;

export const MIDDLEWARE_ERROR: StringToken<{
  name: string;
  error: unknown;
  context: MiddlewareContext;
}> = `middlewareError`;

export const MIDDLEWARE_CHAIN_COMPLETED: StringToken<{
  executedMiddlewares: string[];
  context: MiddlewareContext;
}> = `middlewareChainCompleted`;

export const MIDDLEWARE_CHAIN_FAILED: StringToken<{
  error: unknown;
  executedMiddlewares: string[];
  context: MiddlewareContext;
}> = `middlewareChainFailed`;

export const MIDDLEWARE_TIMEOUT: StringToken<{
  timeout: number;
  context: MiddlewareContext;
}> = `middlewareTimeout`;

export const MIDDLEWARE_INSERTED: StringToken<{
  middleware: any;
  beforeName?: string;
  afterName?: string;
}> = `middlewareInserted`;

export const PLUGIN_REGISTERED: StringToken<{
  name: string;
  plugin: any;
  config: PluginConfig;
}> = `pluginRegistered`;

export const PLUGIN_UNREGISTERED: StringToken<{
  name: string;
}> = `pluginUnregistered`;

export const PLUGIN_SKIPPED: StringToken<{
  name: string;
  reason: string;
}> = `pluginSkipped`;

export const PLUGIN_INITIALIZING: StringToken<{
  name: string;
}> = `pluginInitializing`;

export const PLUGIN_INITIALIZED: StringToken<{
  name: string;
}> = `pluginInitialized`;

export const PLUGIN_ERROR: StringToken<{
  name: string;
  error: unknown;
  phase: string;
}> = `pluginError`;

export const PLUGIN_DESTROYING: StringToken<{
  name: string;
}> = `pluginDestroying`;

export const PLUGIN_DESTROYED: StringToken<{
  name: string;
}> = `pluginDestroyed`;

export const PLUGIN_ENABLED: StringToken<{
  name: string;
}> = `pluginEnabled`;

export const PLUGIN_DISABLED: StringToken<{
  name: string;
}> = `pluginDisabled`;

export const PLUGIN_CONFIG_UPDATED: StringToken<{
  name: string;
  oldConfig: Record<string, any>;
  newConfig: Record<string, any>;
}> = `pluginConfigUpdated`;

export const CORE_INITIALIZED: StringToken<{
  serviceName: string;
  version: string;
  environment: string;
}> = `initialized`;

export const CORE_STARTING: StringToken<{}> = `starting`;

export const CORE_STARTED: StringToken<{
  serviceName: string;
  version: string;
  uptime: number;
}> = `started`;

export const CORE_START_FAILED: StringToken<{
  error: unknown;
}> = `startFailed`;

export const CORE_STOPPING: StringToken<{}> = `stopping`;

export const CORE_STOPPED: StringToken<{
  serviceName: string;
  uptime: number;
}> = `stopped`;

export const CORE_STOP_FAILED: StringToken<{
  error: unknown;
}> = `stopFailed`;

export const CORE_RESTARTING: StringToken<{}> = `restarting`;

export const CORE_RESTARTED: StringToken<{}> = `restarted`;

export const CORE_RESTART_FAILED: StringToken<{
  error: unknown;
}> = `restartFailed`;

export const CORE_PLUGIN_ERROR: StringToken<{
  name: string;
  error: unknown;
  phase: string;
}> = `pluginError`;

export const CORE_MIDDLEWARE_ERROR: StringToken<{
  name: string;
  error: unknown;
  context: MiddlewareContext;
}> = `middlewareError`;

export const CORE_CONFIG_CHANGE: StringToken<{
  key: string;
  value: any;
  oldValue: any;
}> = `configChange`;