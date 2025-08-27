import { EventBus } from '../events/index.js';
import { MiddlewareHandler, MiddlewareContext } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';

interface MiddlewareInfo {
  handler: MiddlewareHandler;
  name: string | undefined;
  priority: number;
  enabled: boolean;
}

export class MiddlewareManager extends EventBus {
  private middlewares: MiddlewareInfo[] = [];
  private sorted = true;

  public use(handler: MiddlewareHandler, options?: {
    name?: string;
    priority?: number;
    enabled?: boolean;
  }): void {
    if (typeof handler !== 'function') {
      throw new SkerError(
        ErrorCodes.MIDDLEWARE_ERROR,
        'Middleware handler must be a function'
      );
    }

    const middleware: MiddlewareInfo = {
      handler,
      name: options?.name || undefined,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false
    };

    this.middlewares.push(middleware);
    this.sorted = false;

    this.emit('middlewareAdded', { middleware });
  }

  public remove(nameOrHandler: string | MiddlewareHandler): boolean {
    const index = this.middlewares.findIndex(mw => 
      (typeof nameOrHandler === 'string' && mw.name === nameOrHandler) ||
      (typeof nameOrHandler === 'function' && mw.handler === nameOrHandler)
    );

    if (index >= 0) {
      const removed = this.middlewares.splice(index, 1)[0];
      this.emit('middlewareRemoved', { middleware: removed });
      return true;
    }

    return false;
  }

  public enable(name: string): boolean {
    const middleware = this.middlewares.find(mw => mw.name === name);
    if (middleware) {
      middleware.enabled = true;
      this.emit('middlewareEnabled', { name });
      return true;
    }
    return false;
  }

  public disable(name: string): boolean {
    const middleware = this.middlewares.find(mw => mw.name === name);
    if (middleware) {
      middleware.enabled = false;
      this.emit('middlewareDisabled', { name });
      return true;
    }
    return false;
  }

  public clear(): void {
    const count = this.middlewares.length;
    this.middlewares = [];
    this.sorted = true;
    this.emit('middlewaresCleared', { count });
  }

  public async execute(context: MiddlewareContext): Promise<void> {
    const enabledMiddlewares = this.getEnabledMiddlewares();
    
    if (enabledMiddlewares.length === 0) {
      return;
    }

    let currentIndex = 0;
    const executedMiddlewares: string[] = [];

    const next = async (): Promise<void> => {
      if (currentIndex >= enabledMiddlewares.length) {
        return;
      }

      const middleware = enabledMiddlewares[currentIndex++]!;
      const middlewareName = middleware.name || `anonymous-${currentIndex}`;
      
      try {
        this.emit('middlewareExecuting', { name: middlewareName, context });
        executedMiddlewares.push(middlewareName);
        
        await middleware.handler(context, next);
        
        this.emit('middlewareExecuted', { name: middlewareName, context });
      } catch (error) {
        this.emit('middlewareError', { name: middlewareName, error, context });
        throw new SkerError(
          ErrorCodes.MIDDLEWARE_ERROR,
          `Middleware "${middlewareName}" failed`,
          { middlewareName, executedMiddlewares },
          error as Error
        );
      }
    };

    try {
      await next();
      this.emit('middlewareChainCompleted', { executedMiddlewares, context });
    } catch (error) {
      this.emit('middlewareChainFailed', { error, executedMiddlewares, context });
      throw error;
    }
  }

  public async executeWithTimeout(
    context: MiddlewareContext,
    timeout: number
  ): Promise<void> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new SkerError(
          ErrorCodes.MIDDLEWARE_ERROR,
          `Middleware execution timed out after ${timeout}ms`,
          { timeout, context }
        ));
      }, timeout);
    });

    try {
      await Promise.race([
        this.execute(context),
        timeoutPromise
      ]);
    } catch (error) {
      if (error instanceof SkerError && error.message.includes('timed out')) {
        this.emit('middlewareTimeout', { timeout, context });
      }
      throw error;
    }
  }

  public getMiddlewares(): Array<{
    name?: string;
    priority: number;
    enabled: boolean;
  }> {
    return this.middlewares.map(mw => ({
      name: mw.name,
      priority: mw.priority || 0,
      enabled: mw.enabled !== false
    }));
  }

  public getEnabledMiddlewares(): MiddlewareInfo[] {
    if (!this.sorted) {
      this.sortMiddlewares();
    }

    return this.middlewares.filter(mw => mw.enabled !== false);
  }

  public getMiddlewareCount(): number {
    return this.middlewares.length;
  }

  public getEnabledMiddlewareCount(): number {
    return this.middlewares.filter(mw => mw.enabled !== false).length;
  }

  public hasMiddleware(nameOrHandler: string | MiddlewareHandler): boolean {
    return this.middlewares.some(mw => 
      (typeof nameOrHandler === 'string' && mw.name === nameOrHandler) ||
      (typeof nameOrHandler === 'function' && mw.handler === nameOrHandler)
    );
  }

  public insertBefore(
    beforeName: string,
    handler: MiddlewareHandler,
    options?: {
      name?: string;
      priority?: number;
      enabled?: boolean;
    }
  ): boolean {
    const index = this.middlewares.findIndex(mw => mw.name === beforeName);
    if (index < 0) {
      return false;
    }

    const middleware: MiddlewareInfo = {
      handler,
      name: options?.name || undefined,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false
    };

    this.middlewares.splice(index, 0, middleware);
    this.sorted = false;

    this.emit('middlewareInserted', { middleware, beforeName });
    return true;
  }

  public insertAfter(
    afterName: string,
    handler: MiddlewareHandler,
    options?: {
      name?: string;
      priority?: number;
      enabled?: boolean;
    }
  ): boolean {
    const index = this.middlewares.findIndex(mw => mw.name === afterName);
    if (index < 0) {
      return false;
    }

    const middleware: MiddlewareInfo = {
      handler,
      name: options?.name || undefined,
      priority: options?.priority || 0,
      enabled: options?.enabled !== false
    };

    this.middlewares.splice(index + 1, 0, middleware);
    this.sorted = false;

    this.emit('middlewareInserted', { middleware, afterName });
    return true;
  }

  private sortMiddlewares(): void {
    this.middlewares.sort((a, b) => {
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      return priorityB - priorityA;
    });
    this.sorted = true;
  }
}