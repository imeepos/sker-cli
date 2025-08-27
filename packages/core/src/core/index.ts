import { CoreOptions, ERROR, LIFECYCLE_ERROR, MEMORY_THRESHOLD_EXCEEDED, MEMORY_USAGE, CORE_INITIALIZED, CORE_STARTING, CORE_STARTED, CORE_START_FAILED, CORE_STOPPING, CORE_STOPPED, CORE_STOP_FAILED, CORE_RESTARTING, CORE_RESTARTED, CORE_RESTART_FAILED, CORE_PLUGIN_ERROR, CORE_MIDDLEWARE_ERROR, CORE_CONFIG_CHANGE } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';
import { EventBus } from '../events/index.js';
import { ConfigManager } from '../config/index.js';
import { LifecycleManager, LifecycleState } from '../lifecycle/index.js';
import { PluginManager } from '../plugins/index.js';
import { MiddlewareManager } from '../middleware/index.js';

export class SkerCore extends EventBus {
  private readonly options: CoreOptions;
  private readonly configManager: ConfigManager;
  private readonly lifecycleManager: LifecycleManager;
  private readonly pluginManager: PluginManager;
  private readonly middlewareManager: MiddlewareManager;
  private readonly startTime: number;

  constructor(options: CoreOptions) {
    super();

    if (!options.serviceName) {
      throw new SkerError(
        ErrorCodes.INITIALIZATION_FAILED,
        'Service name is required'
      );
    }

    if (!options.version) {
      throw new SkerError(
        ErrorCodes.INITIALIZATION_FAILED,
        'Service version is required'
      );
    }

    this.options = {
      environment: 'development',
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

      this.emit(CORE_INITIALIZED, {
        serviceName: this.options.serviceName,
        version: this.options.version,
        environment: this.options.environment
      });
    } catch (error) {
      throw new SkerError(
        ErrorCodes.INITIALIZATION_FAILED,
        'Failed to initialize SkerCore',
        { options: this.options },
        error as Error
      );
    }
  }

  public get serviceName(): string {
    return this.options.serviceName;
  }

  public get version(): string {
    return this.options.version;
  }

  public get environment(): string {
    return this.options.environment || 'development';
  }

  public get uptime(): number {
    return Date.now() - this.startTime;
  }

  public get state(): LifecycleState {
    return this.lifecycleManager.currentState;
  }

  public get isStarted(): boolean {
    return this.lifecycleManager.isStarted;
  }

  public get isStopped(): boolean {
    return this.lifecycleManager.isStopped;
  }

  public async start(): Promise<void> {
    try {
      this.emit(CORE_STARTING, {});
      await this.lifecycleManager.start();
      this.emit(CORE_STARTED, {
        serviceName: this.serviceName,
        version: this.version,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit(CORE_START_FAILED, { error });
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      this.emit(CORE_STOPPING, {});
      await this.lifecycleManager.stop();
      this.emit(CORE_STOPPED, {
        serviceName: this.serviceName,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit(CORE_STOP_FAILED, { error });
      throw error;
    }
  }

  public async restart(): Promise<void> {
    try {
      this.emit(CORE_RESTARTING, {});
      await this.lifecycleManager.restart();
      this.emit(CORE_RESTARTED, {});
    } catch (error) {
      this.emit(CORE_RESTART_FAILED, { error });
      throw error;
    }

  }

  public getConfig(): ConfigManager {
    return this.configManager;
  }

  public getLifecycle(): LifecycleManager {
    return this.lifecycleManager;
  }

  public getPlugins(): PluginManager {
    return this.pluginManager;
  }

  public getMiddleware(): MiddlewareManager {
    return this.middlewareManager;
  }

  public getPlugin<T = any>(name: string): T {
    const plugin = this.pluginManager.get<T>(name);
    if (!plugin) {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Plugin "${name}" not found or not initialized`
      );
    }
    return plugin;
  }

  public hasPlugin(name: string): boolean {
    return this.pluginManager.isInitialized(name);
  }

  public getInfo(): {
    serviceName: string;
    version: string;
    environment: string;
    state: LifecycleState;
    uptime: number;
    plugins: string[];
    config: Record<string, any>;
  } {
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

  public enableMemoryMonitoring(options?: {
    interval?: number;
    threshold?: number;
  }): void {
    const interval = options?.interval || 30000;
    const threshold = options?.threshold || 0.8;

    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      const totalMemory = memoryUsage.heapTotal;
      const usedMemory = memoryUsage.heapUsed;
      const usage = usedMemory / totalMemory;

      this.emit(MEMORY_USAGE, {
        memoryUsage,
        usage,
        threshold,
      });

      if (usage > threshold) {
        this.emit(MEMORY_THRESHOLD_EXCEEDED, {
          usage,
          threshold,
          memoryUsage
        });
      }
    }, interval);
  }

  setupEventHandlers(): void {
    this.lifecycleManager.on(ERROR, (error) => {
      this.emit(LIFECYCLE_ERROR, error);
    });

    this.pluginManager.on('pluginError', (data) => {
      this.emit(CORE_PLUGIN_ERROR, data);
    });

    this.middlewareManager.on('middlewareError', (data) => {
      this.emit(CORE_MIDDLEWARE_ERROR, data);
    });

    this.configManager.on('change', (data) => {
      this.emit(CORE_CONFIG_CHANGE, data);
    });

    this.on('error', (error) => {
      console.error('SkerCore error:', error);
    });
  }

  private registerPlugins(): void {
    if (!this.options.plugins?.length) {
      return;
    }

    for (const pluginConfig of this.options.plugins) {
      if (pluginConfig.enabled === false) {
        continue;
      }

      try {
        if (pluginConfig.package) {
          import(pluginConfig.package)
            .then((pluginModule) => {
              const plugin = pluginModule.default || pluginModule;
              this.pluginManager.register(pluginConfig.name, plugin, pluginConfig);
            })
            .catch((error) => {
              console.warn(`Failed to load plugin "${pluginConfig.name}":`, error);
            });
        }
      } catch (error) {
        console.warn(`Failed to register plugin "${pluginConfig.name}":`, error);
      }
    }
  }

  private setupLifecycleHooks(): void {
    this.lifecycleManager.onStart(async () => {
      await this.pluginManager.initializeAll();
    });

    this.lifecycleManager.onStop(async () => {
      await this.pluginManager.destroyAll();
    });
  }
}