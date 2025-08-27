/**
 * @sker/protocol-websocket - 事件发射器
 */

import { EventEmitter as NodeEventEmitter } from 'events';
import { Logger } from '@sker/logger';
import { WebSocketConnection, EventFilter, EventRoute } from '../types/websocket-types.js';

export class WebSocketEventEmitter extends NodeEventEmitter {
  private logger: Logger;
  private filters: EventFilter[] = [];
  private maxListeners: number = 100;

  constructor(logger?: Logger) {
    super();
    this.logger = logger || new Logger({ name: 'WebSocketEventEmitter' });
    this.setMaxListeners(this.maxListeners);
    
    // 监听错误事件避免未捕获的异常
    this.on('error', (error: Error) => {
      this.logger.error('EventEmitter error', { error: error.message, stack: error.stack });
    });
  }

  addFilter(filter: EventFilter): void {
    this.filters.push(filter);
    this.logger.debug('Event filter added', { filterName: filter.name });
  }

  removeFilter(filterName: string): boolean {
    const initialLength = this.filters.length;
    this.filters = this.filters.filter(filter => filter.name !== filterName);
    const removed = this.filters.length < initialLength;
    
    if (removed) {
      this.logger.debug('Event filter removed', { filterName });
    }
    
    return removed;
  }

  getFilters(): EventFilter[] {
    return [...this.filters];
  }

  clearFilters(): void {
    const count = this.filters.length;
    this.filters = [];
    this.logger.debug('All event filters cleared', { count });
  }

  private applyFilters(connection: WebSocketConnection, event: any): { 
    allowed: boolean; 
    modified?: any; 
    reason?: string 
  } {
    let modifiedEvent = event;
    
    for (const filter of this.filters) {
      try {
        const shouldAllow = filter.condition(connection, modifiedEvent);
        
        if (!shouldAllow) {
          if (filter.action === 'reject') {
            return { 
              allowed: false, 
              reason: filter.message || `Event rejected by filter: ${filter.name}` 
            };
          } else if (filter.action === 'modify' && filter.modifier) {
            modifiedEvent = filter.modifier(modifiedEvent);
          }
        } else if (filter.action === 'modify' && filter.modifier) {
          // 即使条件为真，也可以应用修改
          modifiedEvent = filter.modifier(modifiedEvent);
        }
      } catch (error) {
        this.logger.error('Filter execution failed', {
          filterName: filter.name,
          error: error instanceof Error ? error.message : String(error)
        });
        
        // 过滤器执行失败时的策略 - 继续处理其他过滤器
        continue;
      }
    }
    
    return { allowed: true, modified: modifiedEvent };
  }

  safeEmit(event: string, connection: WebSocketConnection, ...args: any[]): boolean {
    try {
      // 应用事件过滤器
      const eventData = args[0];
      const filterResult = this.applyFilters(connection, { type: event, data: eventData });
      
      if (!filterResult.allowed) {
        this.logger.debug('Event filtered out', {
          event,
          connectionId: connection.id,
          reason: filterResult.reason
        });
        return false;
      }
      
      // 使用过滤后的数据
      const finalArgs = filterResult.modified ? [filterResult.modified.data, ...args.slice(1)] : args;
      
      // 发射事件
      const emitted = this.emit(event, connection, ...finalArgs);
      
      if (emitted) {
        this.logger.debug('Event emitted', {
          event,
          connectionId: connection.id,
          listenerCount: this.listenerCount(event)
        });
      }
      
      return emitted;
    } catch (error) {
      this.logger.error('Error during event emission', {
        event,
        connectionId: connection?.id,
        error: error instanceof Error ? error.message : String(error)
      });
      
      // 发射错误事件
      this.emit('error', error);
      return false;
    }
  }

  safeEmitAsync(event: string, connection: WebSocketConnection, ...args: any[]): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // 异步版本的安全事件发射
        setImmediate(() => {
          const result = this.safeEmit(event, connection, ...args);
          resolve(result);
        });
      } catch (error) {
        this.logger.error('Error during async event emission', {
          event,
          connectionId: connection?.id,
          error: error instanceof Error ? error.message : String(error)
        });
        resolve(false);
      }
    });
  }

  onceWithTimeout(event: string, timeout: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener(event, listener);
        reject(new Error(`Event '${event}' timeout after ${timeout}ms`));
      }, timeout);

      const listener = (...args: any[]) => {
        clearTimeout(timer);
        resolve(args);
      };

      this.once(event, listener);
    });
  }

  waitFor(event: string, condition: (...args: any[]) => boolean, timeout?: number): Promise<any[]> {
    return new Promise((resolve, reject) => {
      let timer: NodeJS.Timeout | undefined;
      
      if (timeout) {
        timer = setTimeout(() => {
          this.removeListener(event, listener);
          reject(new Error(`Condition timeout for event '${event}' after ${timeout}ms`));
        }, timeout);
      }

      const listener = (...args: any[]) => {
        try {
          if (condition(...args)) {
            if (timer) clearTimeout(timer);
            this.removeListener(event, listener);
            resolve(args);
          }
        } catch (error) {
          if (timer) clearTimeout(timer);
          this.removeListener(event, listener);
          reject(error);
        }
      };

      this.on(event, listener);
    });
  }

  getEventStats(): { [event: string]: number } {
    const stats: { [event: string]: number } = {};
    
    for (const event of this.eventNames()) {
      stats[event.toString()] = this.listenerCount(event);
    }
    
    return stats;
  }

  addListenerWithMetadata(
    event: string, 
    listener: (...args: any[]) => void,
    metadata: { id?: string; description?: string; priority?: number } = {}
  ): this {
    // 包装监听器以添加元数据
    const wrappedListener = (...args: any[]) => {
      try {
        listener(...args);
      } catch (error) {
        this.logger.error('Listener execution failed', {
          event,
          listenerId: metadata.id,
          error: error instanceof Error ? error.message : String(error)
        });
        this.emit('error', error);
      }
    };

    // 保存元数据引用
    (wrappedListener as any).__metadata = metadata;
    (wrappedListener as any).__originalListener = listener;

    return this.addListener(event, wrappedListener);
  }

  removeListenerById(event: string, listenerId: string): boolean {
    const listeners = this.listeners(event);
    
    for (const listener of listeners) {
      if ((listener as any).__metadata?.id === listenerId) {
        this.removeListener(event, listener as (...args: any[]) => void);
        this.logger.debug('Listener removed by ID', { event, listenerId });
        return true;
      }
    }
    
    return false;
  }

  getListenerMetadata(event: string): Array<{ id?: string; description?: string; priority?: number }> {
    const listeners = this.listeners(event);
    return listeners
      .map(listener => (listener as any).__metadata)
      .filter(metadata => metadata !== undefined);
  }

  async emitWithAck(event: string, timeout: number = 5000, ...args: any[]): Promise<any[]> {
    const ackEvent = `${event}:ack`;
    const errorEvent = `${event}:error`;
    
    // 发射原始事件
    this.emit(event, ...args);
    
    // 等待确认
    return Promise.race([
      this.onceWithTimeout(ackEvent, timeout),
      this.onceWithTimeout(errorEvent, timeout).then(([error]) => {
        throw error;
      })
    ]);
  }

  batch(events: Array<{ event: string; args: any[] }>): void {
    this.logger.debug('Batch emitting events', { count: events.length });
    
    for (const { event, args } of events) {
      try {
        this.emit(event, ...args);
      } catch (error) {
        this.logger.error('Error in batch event emission', {
          event,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  createChild(prefix?: string): WebSocketEventEmitter {
    const child = new WebSocketEventEmitter(this.logger);
    
    // 如果有前缀，转发所有事件到父级
    if (prefix) {
      const originalEmit = child.emit.bind(child);
      child.emit = (event: string | symbol, ...args: any[]): boolean => {
        // 在子级发射
        const childResult = originalEmit(event, ...args);
        
        // 转发到父级（带前缀）
        const parentResult = this.emit(`${prefix}:${event.toString()}`, ...args);
        
        return childResult || parentResult;
      };
    }
    
    return child;
  }

  pipe(target: WebSocketEventEmitter, events?: string[]): void {
    const eventsToPipe = events || this.eventNames().map(e => e.toString());
    
    for (const event of eventsToPipe) {
      this.on(event, (...args: any[]) => {
        target.emit(event, ...args);
      });
    }
    
    this.logger.debug('Events piped to target', { events: eventsToPipe.length });
  }

  unpipe(target?: WebSocketEventEmitter): void {
    if (target) {
      // 移除到特定目标的管道 - 这在当前实现中比较困难
      // 简单的解决方案是记录管道连接
      this.logger.warn('Unpipe to specific target not fully implemented');
    } else {
      // 移除所有监听器
      this.removeAllListeners();
      this.logger.debug('All pipes removed');
    }
  }

  metrics(): {
    totalListeners: number;
    eventCount: number;
    filterCount: number;
    maxListeners: number;
  } {
    const events = this.eventNames();
    const totalListeners = events.reduce((total, event) => {
      return total + this.listenerCount(event);
    }, 0);

    return {
      totalListeners,
      eventCount: events.length,
      filterCount: this.filters.length,
      maxListeners: this.getMaxListeners()
    };
  }

  destroy(): void {
    this.logger.debug('Destroying EventEmitter', this.metrics());
    
    // 清理所有过滤器
    this.clearFilters();
    
    // 移除所有监听器
    this.removeAllListeners();
    
    // 发射销毁事件
    this.emit('destroyed');
  }
}

export class ClientEventEmitter extends WebSocketEventEmitter {
  private connectionId?: string;

  setConnection(connectionId: string): void {
    this.connectionId = connectionId;
  }

  getConnectionId(): string | undefined {
    return this.connectionId;
  }

  emitConnectionEvent(event: string, ...args: any[]): boolean {
    if (this.connectionId) {
      return this.emit(event, this.connectionId, ...args);
    }
    return this.emit(event, ...args);
  }
}