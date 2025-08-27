import { FallbackOptions } from '../types/index.js';

export class FallbackStrategy {
  constructor(private options: FallbackOptions) {}

  async execute<T>(fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (this.shouldUseFallback(error)) {
        return await this.options.fallback(error, context || {});
      }
      throw error;
    }
  }

  private shouldUseFallback(error: any): boolean {
    if (this.options.condition) {
      return this.options.condition(error);
    }
    return true; // 默认总是使用降级
  }
}

// 组合策略
export class ErrorRecoveryStrategy {
  constructor(private strategies: Array<{
    type: 'retry' | 'fallback' | 'circuit-breaker';
    strategy: any;
  }>) {}

  async execute<T>(fn: () => Promise<T>, context?: Record<string, any>): Promise<T> {
    let currentFn = fn;
    
    // 按顺序应用所有策略
    for (const { strategy } of this.strategies) {
      const wrappedFn = currentFn;
      currentFn = () => strategy.execute(wrappedFn, context);
    }
    
    return await currentFn();
  }
}

// 内置降级策略
export class CacheFallbackStrategy extends FallbackStrategy {
  constructor(
    private cache: Map<string, any> = new Map(),
    private keyGenerator: (context: Record<string, any>) => string = (ctx) => JSON.stringify(ctx),
    condition?: (error: any) => boolean
  ) {
    super({
      fallback: async (error, context) => {
        const key = this.keyGenerator(context);
        const cachedValue = this.cache.get(key);
        
        if (cachedValue !== undefined) {
          return cachedValue;
        }
        
        throw new Error(`No cached value available for fallback: ${error.message}`);
      },
      condition
    });
  }

  setCachedValue(context: Record<string, any>, value: any): void {
    const key = this.keyGenerator(context);
    this.cache.set(key, value);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export class DefaultValueFallbackStrategy extends FallbackStrategy {
  constructor(
    private defaultValue: any,
    condition?: (error: any) => boolean
  ) {
    super({
      fallback: async () => this.defaultValue,
      condition
    });
  }
}

export class AlternativeServiceFallbackStrategy extends FallbackStrategy {
  constructor(
    private alternativeService: () => Promise<any>,
    condition?: (error: any) => boolean
  ) {
    super({
      fallback: async () => await this.alternativeService(),
      condition
    });
  }
}

// 工厂函数
export function createFallbackStrategy(
  fallback: (error: any, context: any) => Promise<any>,
  condition?: (error: any) => boolean
): FallbackStrategy {
  return new FallbackStrategy({ fallback, condition });
}

export function createCacheFallback(
  cache?: Map<string, any>,
  keyGenerator?: (context: Record<string, any>) => string,
  condition?: (error: any) => boolean
): CacheFallbackStrategy {
  return new CacheFallbackStrategy(cache, keyGenerator, condition);
}

export function createDefaultValueFallback<T>(
  defaultValue: T,
  condition?: (error: any) => boolean
): DefaultValueFallbackStrategy {
  return new DefaultValueFallbackStrategy(defaultValue, condition);
}

export function createAlternativeServiceFallback(
  alternativeService: () => Promise<any>,
  condition?: (error: any) => boolean
): AlternativeServiceFallbackStrategy {
  return new AlternativeServiceFallbackStrategy(alternativeService, condition);
}