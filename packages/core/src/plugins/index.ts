import { EventBus } from '../events/index.js';
import { Plugin, PluginConfig, PluginContext } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';

interface PluginInstance {
  plugin: Plugin;
  config: PluginConfig;
  context: PluginContext;
  initialized: boolean;
  instance?: any;
}

export class PluginManager extends EventBus {
  private plugins: Map<string, PluginInstance> = new Map();
  private readonly core: any;
  private initializationOrder: string[] = [];

  constructor(core: any) {
    super();
    this.core = core;
  }

  public register(name: string, plugin: Plugin, config: PluginConfig = { name }): void {
    if (!name) {
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, 'Plugin name is required');
    }

    if (!plugin || typeof plugin.initialize !== 'function') {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        'Plugin must have an initialize method'
      );
    }

    if (this.plugins.has(name)) {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Plugin "${name}" is already registered`
      );
    }

    const context: PluginContext = {
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

    this.emit('pluginRegistered', { name, plugin, config });
  }

  public unregister(name: string): void {
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
    this.emit('pluginUnregistered', { name });
  }

  public async initialize(name: string): Promise<void> {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, `Plugin "${name}" not found`);
    }

    if (pluginInstance.initialized) {
      return;
    }

    if (pluginInstance.config.enabled === false) {
      this.emit('pluginSkipped', { name, reason: 'disabled' });
      return;
    }

    try {
      this.emit('pluginInitializing', { name });
      
      pluginInstance.instance = await pluginInstance.plugin.initialize(pluginInstance.context);
      pluginInstance.initialized = true;
      this.initializationOrder.push(name);

      this.emit('pluginInitialized', { name });
    } catch (error) {
      this.emit('pluginError', { name, error, phase: 'initialize' });
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Failed to initialize plugin "${name}"`,
        { name },
        error as Error
      );
    }
  }

  public async initializeAll(): Promise<void> {
    const plugins = Array.from(this.plugins.entries());
    const errors: Array<{ name: string; error: Error }> = [];

    for (const [name] of plugins) {
      try {
        await this.initialize(name);
      } catch (error) {
        errors.push({ name, error: error as Error });
      }
    }

    if (errors.length > 0) {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Failed to initialize ${errors.length} plugin(s)`,
        { errors: errors.map(e => ({ name: e.name, message: e.error.message })) }
      );
    }
  }

  public async destroy(name: string): Promise<void> {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance || !pluginInstance.initialized) {
      return;
    }

    try {
      this.emit('pluginDestroying', { name });
      
      if (typeof pluginInstance.plugin.destroy === 'function') {
        await pluginInstance.plugin.destroy();
      }
      
      pluginInstance.initialized = false;
      pluginInstance.instance = undefined;
      
      const index = this.initializationOrder.indexOf(name);
      if (index >= 0) {
        this.initializationOrder.splice(index, 1);
      }

      this.emit('pluginDestroyed', { name });
    } catch (error) {
      this.emit('pluginError', { name, error, phase: 'destroy' });
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Failed to destroy plugin "${name}"`,
        { name },
        error as Error
      );
    }
  }

  public async destroyAll(): Promise<void> {
    const errors: Array<{ name: string; error: Error }> = [];
    
    const destroyOrder = [...this.initializationOrder].reverse();
    
    for (const name of destroyOrder) {
      try {
        await this.destroy(name);
      } catch (error) {
        errors.push({ name, error: error as Error });
      }
    }

    if (errors.length > 0) {
      throw new SkerError(
        ErrorCodes.PLUGIN_ERROR,
        `Failed to destroy ${errors.length} plugin(s)`,
        { errors: errors.map(e => ({ name: e.name, message: e.error.message })) }
      );
    }
  }

  public get<T = any>(name: string): T | undefined {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance || !pluginInstance.initialized) {
      return undefined;
    }
    return pluginInstance.instance as T;
  }

  public has(name: string): boolean {
    return this.plugins.has(name);
  }

  public isInitialized(name: string): boolean {
    const pluginInstance = this.plugins.get(name);
    return pluginInstance?.initialized || false;
  }

  public getRegisteredPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }

  public getInitializedPlugins(): string[] {
    return this.initializationOrder.slice();
  }

  public getPluginInfo(name: string): PluginConfig | undefined {
    const pluginInstance = this.plugins.get(name);
    return pluginInstance?.config;
  }

  public getAllPluginInfo(): Record<string, PluginConfig & { initialized: boolean }> {
    const result: Record<string, PluginConfig & { initialized: boolean }> = {};
    
    for (const [name, instance] of this.plugins) {
      result[name] = {
        ...instance.config,
        initialized: instance.initialized
      };
    }
    
    return result;
  }

  public async enable(name: string): Promise<void> {
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

    this.emit('pluginEnabled', { name });
  }

  public async disable(name: string): Promise<void> {
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
    this.emit('pluginDisabled', { name });
  }

  public updatePluginConfig(name: string, config: Record<string, any>): void {
    const pluginInstance = this.plugins.get(name);
    if (!pluginInstance) {
      throw new SkerError(ErrorCodes.PLUGIN_ERROR, `Plugin "${name}" not found`);
    }

    const oldConfig = { ...pluginInstance.context.config };
    pluginInstance.context.config = { ...pluginInstance.context.config, ...config };
    pluginInstance.config.options = { ...pluginInstance.config.options, ...config };

    this.emit('pluginConfigUpdated', { name, oldConfig, newConfig: pluginInstance.context.config });
  }
}