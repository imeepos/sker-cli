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