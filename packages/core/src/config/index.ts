import { readFileSync } from 'fs';
import { join } from 'path';
import { ConfigOptions, ConfigSource, CONFIG_CHANGE, CONFIG_RESET } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';
import { EventBus } from '../events/index.js';

export class ConfigManager extends EventBus {
  private config: Record<string, any> = {};
  private readonly sources: ConfigSource[];
  private readonly defaultConfig: Record<string, any>;
  private readonly schema?: any;
  private watchers: Map<string, Set<(value: any) => void>> = new Map();

  constructor(options: ConfigOptions = {}) {
    super();
    this.sources = options.sources || [{ type: 'env' }];
    this.defaultConfig = options.defaultConfig || {};
    this.schema = options.schema;
    
    this.loadConfig();
  }

  public get<T = any>(key: string): T {
    return this.getNestedValue(this.config, key) ?? this.getNestedValue(this.defaultConfig, key);
  }

  public set(key: string, value: any): void {
    const oldValue = this.get(key);
    this.setNestedValue(this.config, key, value);
    
    if (oldValue !== value) {
      this.emit(CONFIG_CHANGE, { key, value, oldValue });
      this.notifyWatchers(key, value);
    }
  }

  public has(key: string): boolean {
    return this.getNestedValue(this.config, key) !== undefined ||
           this.getNestedValue(this.defaultConfig, key) !== undefined;
  }

  public delete(key: string): boolean {
    if (this.has(key)) {
      const oldValue = this.get(key);
      this.deleteNestedValue(this.config, key);
      this.emit(CONFIG_CHANGE, { key, value: undefined, oldValue });
      this.notifyWatchers(key, undefined);
      return true;
    }
    return false;
  }

  public getAll(): Record<string, any> {
    return { ...this.defaultConfig, ...this.config };
  }

  public reset(): void {
    const oldConfig = { ...this.config };
    this.config = {};
    this.loadConfig();
    
    this.emit(CONFIG_RESET, { oldConfig, newConfig: this.config });
  }

  public onChange(key: string, handler: (value: any) => void): () => void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    
    this.watchers.get(key)!.add(handler);
    
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

  public validate(): boolean {
    if (!this.schema) {
      return true;
    }

    try {
      if (typeof this.schema.validate === 'function') {
        return this.schema.validate(this.getAll());
      }
      
      return true;
    } catch (error) {
      throw new SkerError(
        ErrorCodes.CONFIG_ERROR,
        'Configuration validation failed',
        { config: this.getAll() },
        error as Error
      );
    }
  }

  private loadConfig(): void {
    try {
      for (const source of this.sources) {
        this.loadFromSource(source);
      }
      
      this.validate();
    } catch (error) {
      throw new SkerError(
        ErrorCodes.CONFIG_ERROR,
        'Failed to load configuration',
        { sources: this.sources },
        error as Error
      );
    }
  }

  private loadFromSource(source: ConfigSource): void {
    try {
      switch (source.type) {
        case 'env':
          this.loadFromEnv(source.prefix);
          break;
        case 'file':
          this.loadFromFile(source.path);
          break;
        case 'remote':
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

  private loadFromEnv(prefix?: string): void {
    const envPrefix = prefix || '';
    
    for (const [key, value] of Object.entries(process.env)) {
      if (!envPrefix || key.startsWith(envPrefix)) {
        const configKey = envPrefix 
          ? key.slice(envPrefix.length).toLowerCase().replace(/_/g, '.')
          : key.toLowerCase().replace(/_/g, '.');
        
        this.setNestedValue(this.config, configKey, this.parseEnvValue(value));
      }
    }
  }

  private loadFromFile(filePath?: string): void {
    if (!filePath) {
      throw new SkerError(ErrorCodes.CONFIG_ERROR, 'File path is required for file source');
    }

    try {
      const fullPath = join(process.cwd(), filePath);
      const content = readFileSync(fullPath, 'utf-8');
      
      let parsed: any;
      if (filePath.endsWith('.json')) {
        parsed = JSON.parse(content);
      } else if (filePath.endsWith('.js') || filePath.endsWith('.mjs')) {
        throw new SkerError(ErrorCodes.CONFIG_ERROR, 'JavaScript config files not supported yet');
      } else {
        throw new SkerError(ErrorCodes.CONFIG_ERROR, 'Unsupported config file format');
      }
      
      Object.assign(this.config, parsed);
    } catch (error) {
      throw new SkerError(
        ErrorCodes.CONFIG_ERROR,
        `Failed to load config from file: ${filePath}`,
        { filePath },
        error as Error
      );
    }
  }

  private loadFromRemote(url?: string): void {
    if (!url) {
      throw new SkerError(ErrorCodes.CONFIG_ERROR, 'URL is required for remote source');
    }
    
    console.warn('Remote config loading not implemented yet');
  }

  private parseEnvValue(value: string | undefined): any {
    if (value === undefined) return undefined;
    if (value === '') return '';
    
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;
    
    if (/^\d+$/.test(value)) return parseInt(value, 10);
    if (/^\d+\.\d+$/.test(value)) return parseFloat(value);
    
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private getNestedValue(obj: Record<string, any>, key: string): any {
    const keys = key.split('.');
    let current = obj;
    
    for (const k of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return undefined;
      }
      current = current[k];
    }
    
    return current;
  }

  private setNestedValue(obj: Record<string, any>, key: string, value: any): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]!;
      if (current[k] === undefined || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }
    
    current[keys[keys.length - 1]!] = value;
  }

  private deleteNestedValue(obj: Record<string, any>, key: string): void {
    const keys = key.split('.');
    let current = obj;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]!;
      if (current[k] === undefined || typeof current[k] !== 'object') {
        return;
      }
      current = current[k];
    }
    
    delete current[keys[keys.length - 1]!];
  }

  private notifyWatchers(key: string, value: any): void {
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
}