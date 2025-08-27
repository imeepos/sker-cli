import { CoreOptions } from '../types/index.js';
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

      this.emit('initialized', {
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
      this.emit('starting');
      await this.lifecycleManager.start();
      this.emit('started', {
        serviceName: this.serviceName,
        version: this.version,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit('startFailed', error);
      throw error;
    }
  }

  public async stop(): Promise<void> {
    try {
      this.emit('stopping');
      await this.lifecycleManager.stop();
      this.emit('stopped', {
        serviceName: this.serviceName,
        uptime: this.uptime
      });
    } catch (error) {
      this.emit('stopFailed', error);
      throw error;
    }
  }

  public async restart(): Promise<void> {
    this.emit('restarting');
    await this.lifecycleManager.restart();
    this.emit('restarted');
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

      this.emit('memoryUsage', {
        memoryUsage,
        usage,
        threshold
      });

      if (usage > threshold) {
        this.emit('memoryThresholdExceeded', {
          usage,
          threshold,
          memoryUsage
        });
      }
    }, interval);
  }

  private setupEventHandlers(): void {
    this.lifecycleManager.on('error', (error) => {
      this.emit('lifecycleError', error);
    });

    this.pluginManager.on('pluginError', (data) => {
      this.emit('pluginError', data);
    });

    this.middlewareManager.on('middlewareError', (data) => {
      this.emit('middlewareError', data);
    });

    this.configManager.on('change', (data) => {
      this.emit('configChange', data);
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