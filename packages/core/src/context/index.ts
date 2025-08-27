import { AsyncLocalStorage } from 'async_hooks';
import { randomUUID } from 'crypto';
import { ContextData } from '../types/index.js';
import { SkerError, ErrorCodes } from '../errors/index.js';

const contextStorage = new AsyncLocalStorage<Context>();

export class Context {
  private readonly data: Map<string, any>;
  private readonly startTime: number;
  private readonly parent: Context | undefined;

  constructor(initialData: ContextData = {}, parent?: Context) {
    this.data = new Map();
    this.startTime = Date.now();
    this.parent = parent;

    this.set('requestId', initialData.requestId || randomUUID());
    this.set('userId', initialData.userId);
    this.set('traceId', initialData.traceId || randomUUID());

    for (const [key, value] of Object.entries(initialData)) {
      if (key !== 'requestId' && key !== 'userId' && key !== 'traceId') {
        this.set(key, value);
      }
    }
  }

  public static current(): Context | undefined {
    return contextStorage.getStore();
  }

  public static ensure(): Context {
    const current = Context.current();
    if (!current) {
      throw new SkerError(
        ErrorCodes.CONTEXT_ERROR,
        'No active context found. Make sure to run code within a context.'
      );
    }
    return current;
  }

  public static create(data: ContextData = {}): Context {
    const parent = Context.current();
    return new Context(data, parent);
  }

  public static fork(additionalData: ContextData = {}): Context {
    const parent = Context.current();
    if (!parent) {
      return new Context(additionalData);
    }

    const forkedData: ContextData = {
      ...parent.toObject(),
      ...additionalData
    };

    return new Context(forkedData, parent);
  }

  public async run<T>(callback: () => T | Promise<T>): Promise<T> {
    return contextStorage.run(this, callback);
  }

  public get<T = any>(key: string): T | undefined {
    if (this.data.has(key)) {
      return this.data.get(key);
    }

    if (this.parent) {
      return this.parent.get<T>(key);
    }

    return undefined;
  }

  public set<T = any>(key: string, value: T): void {
    if (!key) {
      throw new SkerError(ErrorCodes.CONTEXT_ERROR, 'Context key cannot be empty');
    }
    this.data.set(key, value);
  }

  public has(key: string): boolean {
    return this.data.has(key) || (this.parent?.has(key) ?? false);
  }

  public delete(key: string): boolean {
    return this.data.delete(key);
  }

  public get requestId(): string {
    return this.get<string>('requestId')!;
  }

  public get userId(): string | undefined {
    return this.get<string>('userId');
  }

  public get traceId(): string {
    return this.get<string>('traceId')!;
  }

  public get elapsedTime(): number {
    return Date.now() - this.startTime;
  }

  public keys(): string[] {
    const keys = new Set<string>();

    for (const key of this.data.keys()) {
      keys.add(key);
    }

    if (this.parent) {
      for (const key of this.parent.keys()) {
        keys.add(key);
      }
    }

    return Array.from(keys);
  }

  public values(): any[] {
    return this.keys().map(key => this.get(key));
  }

  public entries(): Array<[string, any]> {
    return this.keys().map(key => [key, this.get(key)]);
  }

  public toObject(): ContextData {
    const result: ContextData = {};

    for (const key of this.keys()) {
      result[key] = this.get(key);
    }

    return result;
  }

  public serialize(): string {
    return JSON.stringify(this.toObject());
  }

  public static deserialize(serialized: string): Context {
    try {
      const data = JSON.parse(serialized);
      return new Context(data);
    } catch (error) {
      throw new SkerError(
        ErrorCodes.CONTEXT_ERROR,
        'Failed to deserialize context',
        { serialized },
        error as Error
      );
    }
  }

  public clone(): Context {
    return new Context(this.toObject(), this.parent);
  }

  public child(additionalData: ContextData = {}): Context {
    const childData: ContextData = {
      ...this.toObject(),
      ...additionalData
    };

    return new Context(childData, this);
  }

  public merge(other: Context): Context {
    const mergedData: ContextData = {
      ...this.toObject(),
      ...other.toObject()
    };

    return new Context(mergedData);
  }

  public clear(): void {
    this.data.clear();
  }

  public size(): number {
    return new Set([...this.data.keys(), ...(this.parent?.keys() || [])]).size;
  }

  public isEmpty(): boolean {
    return this.size() === 0;
  }

  public toString(): string {
    return `Context(requestId=${this.requestId}, traceId=${this.traceId}, keys=[${this.keys().join(', ')}])`;
  }

  public inspect(): string {
    return `Context {
  requestId: ${this.requestId}
  traceId: ${this.traceId}
  userId: ${this.userId || 'undefined'}
  elapsedTime: ${this.elapsedTime}ms
  data: ${JSON.stringify(this.toObject(), null, 2)}
}`;
  }
}

export async function withContext<T>(
  data: ContextData,
  callback: () => T | Promise<T>
): Promise<T> {
  const context = new Context(data);
  return context.run(callback);
}

export async function withCurrentContext<T>(
  additionalData: ContextData,
  callback: () => T | Promise<T>
): Promise<T> {
  const context = Context.fork(additionalData);
  return context.run(callback);
}

export function getCurrentContext(): Context | undefined {
  return Context.current();
}

export function ensureContext(): Context {
  return Context.ensure();
}