import { EventHandler, AsyncHandler, StringToken, ERROR } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';
export class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private maxListeners: number = 10;
  private onceListeners: Map<string, Set<EventHandler>> = new Map();

  public on<T = any>(event: StringToken<T>, handler: EventHandler<T>): void {
    if (!event || typeof handler !== 'function') {
      throw new SkerError(
        ErrorCodes.EVENT_ERROR,
        'Event name and handler are required'
      );
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    const handlers = this.listeners.get(event)!;

    if (handlers.size >= this.maxListeners) {
      console.warn(
        `Warning: Maximum listeners (${this.maxListeners}) exceeded for event "${event}". ` +
        'This could indicate a memory leak.'
      );
    }

    handlers.add(handler);
  }

  public once<T = any>(event: StringToken<T>, handler: EventHandler<T>): void {
    if (!event || typeof handler !== 'function') {
      throw new SkerError(
        ErrorCodes.EVENT_ERROR,
        'Event name and handler are required'
      );
    }

    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }

    this.onceListeners.get(event)!.add(handler);
  }

  public off<T>(event: StringToken<T>, handler?: EventHandler<T>): void {
    if (!event) {
      throw new SkerError(ErrorCodes.EVENT_ERROR, 'Event name is required');
    }

    if (handler) {
      const handlers = this.listeners.get(event);
      if (handlers) {
        handlers.delete(handler);
        if (handlers.size === 0) {
          this.listeners.delete(event);
        }
      }

      const onceHandlers = this.onceListeners.get(event);
      if (onceHandlers) {
        onceHandlers.delete(handler);
        if (onceHandlers.size === 0) {
          this.onceListeners.delete(event);
        }
      }
    } else {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    }
  }

  public emit<T = any>(event: StringToken<T>, data?: T): void {
    if (!event) {
      throw new SkerError(ErrorCodes.EVENT_ERROR, 'Event name is required');
    }

    const handlers = this.listeners.get(event);
    const onceHandlers = this.onceListeners.get(event);

    if (!handlers?.size && !onceHandlers?.size) {
      return;
    }

    try {
      if (handlers) {
        for (const handler of handlers) {
          if (this.isAsyncHandler(handler)) {
            handler(data).catch((error) => {
              this.handleError(error, event);
            });
          } else {
            handler(data);
          }
        }
      }

      if (onceHandlers) {
        for (const handler of onceHandlers) {
          if (this.isAsyncHandler(handler)) {
            handler(data).catch((error) => {
              this.handleError(error, event);
            });
          } else {
            handler(data);
          }
        }
        this.onceListeners.delete(event);
      }
    } catch (error) {
      this.handleError(error, event);
    }
  }

  public async emitAsync<T = any>(event: StringToken<T>, data?: T): Promise<void> {
    if (!event) {
      throw new SkerError(ErrorCodes.EVENT_ERROR, 'Event name is required');
    }

    const handlers = this.listeners.get(event);
    const onceHandlers = this.onceListeners.get(event);

    if (!handlers?.size && !onceHandlers?.size) {
      return;
    }

    const promises: Promise<void>[] = [];

    try {
      if (handlers) {
        for (const handler of handlers) {
          if (this.isAsyncHandler(handler)) {
            promises.push(handler(data));
          } else {
            promises.push(Promise.resolve(handler(data)));
          }
        }
      }

      if (onceHandlers) {
        for (const handler of onceHandlers) {
          if (this.isAsyncHandler(handler)) {
            promises.push(handler(data));
          } else {
            promises.push(Promise.resolve(handler(data)));
          }
        }
        this.onceListeners.delete(event);
      }

      await Promise.all(promises);
    } catch (error) {
      throw new SkerError(
        ErrorCodes.EVENT_ERROR,
        `Error emitting async event "${event}"`,
        { event, data },
        error as Error
      );
    }
  }

  public removeAllListeners<T = any>(event?: StringToken<T>): void {
    if (event) {
      this.listeners.delete(event);
      this.onceListeners.delete(event);
    } else {
      this.listeners.clear();
      this.onceListeners.clear();
    }
  }

  public listenerCount<T = any>(event: StringToken<T>): number {
    const handlersCount = this.listeners.get(event)?.size || 0;
    const onceHandlersCount = this.onceListeners.get(event)?.size || 0;
    return handlersCount + onceHandlersCount;
  }

  public eventNames<T = any>(): StringToken<T>[] {
    const allEvents = new Set([
      ...this.listeners.keys(),
      ...this.onceListeners.keys()
    ]);
    return Array.from(allEvents);
  }

  public setMaxListeners(n: number): void {
    if (n < 0 || !Number.isInteger(n)) {
      throw new SkerError(
        ErrorCodes.EVENT_ERROR,
        'maxListeners must be a non-negative integer'
      );
    }
    this.maxListeners = n;
  }

  public getMaxListeners(): number {
    return this.maxListeners;
  }

  private isAsyncHandler<T = any>(handler: EventHandler<T>): handler is AsyncHandler<T> {
    return handler.constructor.name === 'AsyncFunction';
  }

  private handleError<T>(error: unknown, event: StringToken<T>): void {
    console.error(`EventBus error in event "${event}":`, error);

    if (this.listenerCount('error') > 0) {
      this.emit(ERROR, { error, event });
    }
  }
}
