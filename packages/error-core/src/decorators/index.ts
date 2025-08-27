import { RetryStrategy, CircuitBreakerStrategy } from '../strategies/index.js';
import { SkerError, wrapError } from '../errors/index.js';
import "reflect-metadata";
// 错误处理装饰器选项
interface HandleErrorsOptions {
  onError?: (error: any, context?: any) => void;
  rethrow?: boolean;
  wrapUnknownErrors?: boolean;
  contextProvider?: () => Record<string, any>;
}

// 重试装饰器选项
interface RetryOnErrorOptions {
  maxAttempts: number;
  delay: number;
  backoff?: 'fixed' | 'linear' | 'exponential';
  retryCondition?: (error: any) => boolean;
}

// 熔断器装饰器选项
interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeout: number;
  monitoringPeriod?: number;
  onStateChange?: (state: string) => void;
}

// 方法装饰器：错误处理
export function HandleErrors(options: HandleErrorsOptions = {}) {
  return function (_target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        const context = options.contextProvider ? options.contextProvider() : {
          method: propertyName,
          arguments: args,
          className: this.constructor.name
        };

        if (options.onError) {
          options.onError(error, context);
        }

        if (options.rethrow !== false) {
          if (options.wrapUnknownErrors && !(error instanceof SkerError)) {
            throw wrapError(error, context);
          }
          throw error;
        }
      }
    };

    return descriptor;
  };
}

// 方法装饰器：重试
export function RetryOnError(options: RetryOnErrorOptions) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    const retryStrategy = new RetryStrategy({
      maxAttempts: options.maxAttempts,
      initialDelay: options.delay,
      backoffMultiplier: options.backoff === 'exponential' ? 2 : 
                        options.backoff === 'linear' ? 1 : 1,
      retryCondition: options.retryCondition
    });

    descriptor.value = async function (...args: any[]) {
      return await retryStrategy.execute(() => method.apply(this, args));
    };

    return descriptor;
  };
}

// 方法装饰器：熔断器
export function CircuitBreaker(options: CircuitBreakerOptions) {
  const circuitBreaker = new CircuitBreakerStrategy({
    failureThreshold: options.failureThreshold,
    resetTimeout: options.resetTimeout,
    monitoringPeriod: options.monitoringPeriod,
    onStateChange: options.onStateChange
  });

  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return await circuitBreaker.execute(() => method.apply(this, args));
    };

    return descriptor;
  };
}

// 方法装饰器：降级
export function FallbackOnError(fallbackMethod: string | Function) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        return await method.apply(this, args);
      } catch (error) {
        if (typeof fallbackMethod === 'string') {
          const fallback = (this as any)[fallbackMethod];
          if (typeof fallback === 'function') {
            return await fallback.apply(this, args);
          }
          throw new Error(`Fallback method '${fallbackMethod}' not found`);
        } else {
          return await fallbackMethod.apply(this, args);
        }
      }
    };

    return descriptor;
  };
}

// 组合装饰器：带超时的重试
export function RetryWithTimeout(options: {
  maxAttempts: number;
  delay: number;
  timeout: number;
  timeoutError?: string;
}) {
  return function (_target: any, _propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    const retryStrategy = new RetryStrategy({
      maxAttempts: options.maxAttempts,
      initialDelay: options.delay,
      backoffMultiplier: 2
    });

    descriptor.value = async function (...args: any[]) {
      return await retryStrategy.execute(async () => {
        return await Promise.race([
          method.apply(this, args),
          new Promise((_, reject) => {
            setTimeout(() => {
              reject(new Error(options.timeoutError || 'Method timeout'));
            }, options.timeout);
          })
        ]);
      });
    };

    return descriptor;
  };
}

// 类装饰器：全局错误处理
export function GlobalErrorHandler(options: HandleErrorsOptions = {}) {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    return class extends constructor {
      constructor(...args: any[]) {
        super(...args);
        
        // 为所有方法添加错误处理
        const proto = constructor.prototype;
        const propertyNames = Object.getOwnPropertyNames(proto);
        
        propertyNames.forEach(propertyName => {
          if (propertyName !== 'constructor') {
            const descriptor = Object.getOwnPropertyDescriptor(proto, propertyName);
            if (descriptor && typeof descriptor.value === 'function') {
              const originalMethod = descriptor.value;
              
              descriptor.value = async function (...args: any[]) {
                try {
                  return await originalMethod.apply(this, args);
                } catch (error) {
                  const context = options.contextProvider ? options.contextProvider() : {
                    method: propertyName,
                    arguments: args,
                    className: constructor.name
                  };

                  if (options.onError) {
                    options.onError(error, context);
                  }

                  if (options.rethrow !== false) {
                    if (options.wrapUnknownErrors && !(error instanceof SkerError)) {
                      throw wrapError(error, context);
                    }
                    throw error;
                  }
                }
              };
              
              Object.defineProperty(proto, propertyName, descriptor);
            }
          }
        });
      }
    };
  };
}

// 参数装饰器：参数验证
export function ValidateParam(validator: (value: any) => boolean | string) {
  return function (target: any, propertyName: string | symbol, parameterIndex: number) {
    const existingValidators = Reflect.getMetadata('validate:params', target, propertyName) || [];
    existingValidators[parameterIndex] = validator;
    Reflect.defineMetadata('validate:params', existingValidators, target, propertyName);
  };
}

// 方法装饰器：参数验证执行
export function ValidateParams() {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = function (...args: any[]) {
      const validators = Reflect.getMetadata('validate:params', target, propertyName);
      
      if (validators) {
        validators.forEach((validator: Function, index: number) => {
          if (validator && index < args.length) {
            const result = validator(args[index]);
            if (typeof result === 'string') {
              throw new Error(`Parameter ${index} validation failed: ${result}`);
            } else if (result === false) {
              throw new Error(`Parameter ${index} validation failed`);
            }
          }
        });
      }
      
      return method.apply(this, args);
    };
    
    return descriptor;
  };
}