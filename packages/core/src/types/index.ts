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

export type StringToken<T> = string & { __type?: T };

// 重新导出所有事件常量
export {
  ERROR,
  MEMORY_USAGE,
  MEMORY_THRESHOLD_EXCEEDED,
  LIFECYCLE_ERROR,
  CONFIG_CHANGE,
  CONFIG_RESET,
  LIFECYCLE_STARTING,
  LIFECYCLE_STARTED,
  LIFECYCLE_STOPPING,
  LIFECYCLE_STOPPED,
  LIFECYCLE_STATE_CHANGED,
  LIFECYCLE_HOOK_EXECUTING,
  LIFECYCLE_HOOK_EXECUTED,
  LIFECYCLE_HOOK_ERROR,
  MIDDLEWARE_ADDED,
  MIDDLEWARE_REMOVED,
  MIDDLEWARE_ENABLED,
  MIDDLEWARE_DISABLED,
  MIDDLEWARES_CLEARED,
  MIDDLEWARE_EXECUTING,
  MIDDLEWARE_EXECUTED,
  MIDDLEWARE_ERROR,
  MIDDLEWARE_CHAIN_COMPLETED,
  MIDDLEWARE_CHAIN_FAILED,
  MIDDLEWARE_TIMEOUT,
  MIDDLEWARE_INSERTED,
  PLUGIN_REGISTERED,
  PLUGIN_UNREGISTERED,
  PLUGIN_SKIPPED,
  PLUGIN_INITIALIZING,
  PLUGIN_INITIALIZED,
  PLUGIN_ERROR,
  PLUGIN_DESTROYING,
  PLUGIN_DESTROYED,
  PLUGIN_ENABLED,
  PLUGIN_DISABLED,
  PLUGIN_CONFIG_UPDATED,
  CORE_INITIALIZED,
  CORE_STARTING,
  CORE_STARTED,
  CORE_START_FAILED,
  CORE_STOPPING,
  CORE_STOPPED,
  CORE_STOP_FAILED,
  CORE_RESTARTING,
  CORE_RESTARTED,
  CORE_RESTART_FAILED,
  CORE_PLUGIN_ERROR,
  CORE_MIDDLEWARE_ERROR,
  CORE_CONFIG_CHANGE
} from '@sker/constants';