export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function timeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timer));
  });
}

export interface RetryOptions {
  maxAttempts: number;
  delay?: number;
  backoff?: 'fixed' | 'linear' | 'exponential';
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delay: baseDelay = 1000, backoff = 'fixed', shouldRetry } = options;
  
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) break;
      if (shouldRetry && !shouldRetry(error, attempt)) break;
      
      const delayMs = calculateDelay(baseDelay, attempt, backoff);
      await delay(delayMs);
    }
  }
  
  throw lastError;
}

export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), ms);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= ms) {
      lastCall = now;
      fn(...args);
    }
  };
}

export interface PromiseAllOptions {
  concurrency?: number;
}

export async function promiseAll<T>(
  promises: (() => Promise<T>)[],
  options: PromiseAllOptions = {}
): Promise<T[]> {
  const { concurrency = Infinity } = options;
  
  if (concurrency >= promises.length) {
    return Promise.all(promises.map(fn => fn()));
  }
  
  const results: T[] = [];
  const executing: Promise<void>[] = [];
  
  for (let i = 0; i < promises.length; i++) {
    const promise = promises[i]!().then(result => {
      results[i] = result;
    });
    
    executing.push(promise);
    
    if (executing.length >= concurrency) {
      await Promise.race(executing);
      const finishedIndex = executing.findIndex(p => 
        Promise.resolve(p).then(() => true, () => true)
      );
      if (finishedIndex !== -1) {
        executing.splice(finishedIndex, 1);
      }
    }
  }
  
  await Promise.all(executing);
  return results;
}

export interface SettledResult<T> {
  status: 'fulfilled' | 'rejected';
  value?: T;
  reason?: any;
}

export async function promiseAllSettled<T>(
  promises: Promise<T>[]
): Promise<SettledResult<T>[]> {
  return Promise.all(
    promises.map(async (promise): Promise<SettledResult<T>> => {
      try {
        const value = await promise;
        return { status: 'fulfilled', value };
      } catch (reason) {
        return { status: 'rejected', reason };
      }
    })
  );
}

export function race<T>(promises: Promise<T>[]): Promise<T> {
  return Promise.race(promises);
}

export function safeAsync<T>(
  fn: () => Promise<T>
): Promise<[Error | null, T | null]> {
  return fn()
    .then(result => [null, result] as [null, T])
    .catch(error => [error, null] as [Error, null]);
}

export class AsyncQueue<T> {
  private queue: (() => Promise<T>)[] = [];
  private running = 0;
  private concurrency: number;

  constructor(concurrency = 1) {
    this.concurrency = concurrency;
  }

  async add<R>(fn: () => Promise<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result as unknown as R);
          return result as unknown as T;
        } catch (error) {
          reject(error);
          throw error;
        }
      });
      this.process();
    });
  }

  private async process(): Promise<void> {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const fn = this.queue.shift()!;

    try {
      await fn();
    } finally {
      this.running--;
      this.process();
    }
  }
}

function calculateDelay(baseDelay: number, attempt: number, backoff: string): number {
  switch (backoff) {
    case 'linear':
      return baseDelay * attempt;
    case 'exponential':
      return baseDelay * Math.pow(2, attempt - 1);
    default:
      return baseDelay;
  }
}