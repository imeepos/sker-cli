import { isPlainObject, isDefined } from './types.js';

export interface UtilsConfig {
  dateFormat?: {
    default?: string;
    timezone?: string;
  };
  validation?: {
    strict?: boolean;
    throwOnError?: boolean;
  };
  cache?: {
    defaultTTL?: number;
    maxSize?: number;
  };
  errorHandling?: {
    includeStackTrace?: boolean;
    logErrors?: boolean;
  };
  async?: {
    defaultTimeout?: number;
    defaultRetries?: number;
    defaultConcurrency?: number;
  };
}

const defaultConfig: Required<UtilsConfig> = {
  dateFormat: {
    default: 'yyyy-MM-dd HH:mm:ss',
    timezone: 'UTC'
  },
  validation: {
    strict: false,
    throwOnError: false
  },
  cache: {
    defaultTTL: 300000, // 5 minutes
    maxSize: 1000
  },
  errorHandling: {
    includeStackTrace: true,
    logErrors: false
  },
  async: {
    defaultTimeout: 30000, // 30 seconds
    defaultRetries: 3,
    defaultConcurrency: 5
  }
};

let currentConfig: Required<UtilsConfig> = { ...defaultConfig };

export function configureUtils(config: UtilsConfig): void {
  currentConfig = deepMergeConfig(currentConfig, config);
}

export function getConfig(): Required<UtilsConfig> {
  return { ...currentConfig };
}

export function getConfigValue<K extends keyof UtilsConfig>(key: K): Required<UtilsConfig>[K] {
  return currentConfig[key];
}

export function resetConfig(): void {
  currentConfig = { ...defaultConfig };
}

function deepMergeConfig(
  target: Required<UtilsConfig>,
  source: UtilsConfig
): Required<UtilsConfig> {
  const result = { ...target };
  
  for (const key in source) {
    const sourceValue = source[key as keyof UtilsConfig];
    const targetValue = result[key as keyof Required<UtilsConfig>];
    
    if (isPlainObject(sourceValue) && isPlainObject(targetValue)) {
      result[key as keyof Required<UtilsConfig>] = {
        ...targetValue,
        ...sourceValue
      } as any;
    } else if (isDefined(sourceValue)) {
      result[key as keyof Required<UtilsConfig>] = sourceValue as any;
    }
  }
  
  return result;
}

export class ConfigManager {
  private config: Map<string, any> = new Map();
  private listeners: Map<string, ((value: any) => void)[]> = new Map();

  set<T>(key: string, value: T): void {
    const oldValue = this.config.get(key);
    this.config.set(key, value);
    
    if (oldValue !== value) {
      this.notifyListeners(key, value);
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.config.has(key) ? this.config.get(key) : defaultValue;
  }

  has(key: string): boolean {
    return this.config.has(key);
  }

  delete(key: string): boolean {
    const deleted = this.config.delete(key);
    if (deleted) {
      this.notifyListeners(key, undefined);
    }
    return deleted;
  }

  clear(): void {
    const keys = Array.from(this.config.keys());
    this.config.clear();
    
    for (const key of keys) {
      this.notifyListeners(key, undefined);
    }
  }

  keys(): string[] {
    return Array.from(this.config.keys());
  }

  values(): any[] {
    return Array.from(this.config.values());
  }

  entries(): [string, any][] {
    return Array.from(this.config.entries());
  }

  size(): number {
    return this.config.size;
  }

  subscribe(key: string, listener: (value: any) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key)!.push(listener);
    
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        const index = keyListeners.indexOf(listener);
        if (index !== -1) {
          keyListeners.splice(index, 1);
        }
        
        if (keyListeners.length === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  merge(config: Record<string, any>): void {
    for (const [key, value] of Object.entries(config)) {
      this.set(key, value);
    }
  }

  toObject(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const [key, value] of this.config.entries()) {
      result[key] = value;
    }
    return result;
  }

  fromObject(obj: Record<string, any>): void {
    this.clear();
    this.merge(obj);
  }

  clone(): ConfigManager {
    const clone = new ConfigManager();
    clone.config = new Map(this.config);
    return clone;
  }

  private notifyListeners(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      for (const listener of keyListeners) {
        try {
          listener(value);
        } catch (error) {
          console.error(`Error in config listener for key "${key}":`, error);
        }
      }
    }
  }
}

export function createConfigManager(initialConfig?: Record<string, any>): ConfigManager {
  const manager = new ConfigManager();
  if (initialConfig) {
    manager.fromObject(initialConfig);
  }
  return manager;
}

export interface ConfigurationOptions {
  required?: string[];
  defaults?: Record<string, any>;
  validation?: Record<string, (value: any) => boolean>;
  transform?: Record<string, (value: any) => any>;
}

export class Configuration {
  private manager: ConfigManager;
  private options: ConfigurationOptions;

  constructor(config: Record<string, any> = {}, options: ConfigurationOptions = {}) {
    this.manager = new ConfigManager();
    this.options = options;
    this.initialize(config);
  }

  private initialize(config: Record<string, any>): void {
    const mergedConfig = { ...this.options.defaults, ...config };
    
    this.validateRequired(mergedConfig);
    this.validateValues(mergedConfig);
    this.transformValues(mergedConfig);
    
    this.manager.fromObject(mergedConfig);
  }

  private validateRequired(config: Record<string, any>): void {
    if (this.options.required) {
      for (const key of this.options.required) {
        if (!(key in config) || config[key] === undefined || config[key] === null) {
          throw new Error(`Required configuration key "${key}" is missing`);
        }
      }
    }
  }

  private validateValues(config: Record<string, any>): void {
    if (this.options.validation) {
      for (const [key, validator] of Object.entries(this.options.validation)) {
        if (key in config && !validator(config[key])) {
          throw new Error(`Invalid value for configuration key "${key}"`);
        }
      }
    }
  }

  private transformValues(config: Record<string, any>): void {
    if (this.options.transform) {
      for (const [key, transformer] of Object.entries(this.options.transform)) {
        if (key in config) {
          config[key] = transformer(config[key]);
        }
      }
    }
  }

  get<T>(key: string, defaultValue?: T): T | undefined {
    return this.manager.get(key, defaultValue);
  }

  set<T>(key: string, value: T): void {
    if (this.options.validation && this.options.validation[key]) {
      if (!this.options.validation[key](value)) {
        throw new Error(`Invalid value for configuration key "${key}"`);
      }
    }

    let transformedValue = value;
    if (this.options.transform && this.options.transform[key]) {
      transformedValue = this.options.transform[key](value);
    }

    this.manager.set(key, transformedValue);
  }

  has(key: string): boolean {
    return this.manager.has(key);
  }

  subscribe(key: string, listener: (value: any) => void): () => void {
    return this.manager.subscribe(key, listener);
  }

  toObject(): Record<string, any> {
    return this.manager.toObject();
  }
}