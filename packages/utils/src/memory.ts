export interface ObjectPoolOptions<T> {
  maxSize?: number;
  createFn: () => T;
  resetFn?: (obj: T) => void;
  validateFn?: (obj: T) => boolean;
}

export class ObjectPool<T> {
  private pool: T[] = [];
  private readonly maxSize: number;
  private readonly createFn: () => T;
  private readonly resetFn?: (obj: T) => void;
  private readonly validateFn?: (obj: T) => boolean;

  constructor(options: ObjectPoolOptions<T>) {
    this.maxSize = options.maxSize || 10;
    this.createFn = options.createFn;
    this.resetFn = options.resetFn;
    this.validateFn = options.validateFn;
  }

  acquire(): T {
    let obj = this.pool.pop();
    
    if (!obj) {
      obj = this.createFn();
    } else if (this.validateFn && !this.validateFn(obj)) {
      obj = this.createFn();
    }
    
    return obj;
  }

  release(obj: T): void {
    if (this.pool.length >= this.maxSize) return;
    
    if (this.resetFn) {
      this.resetFn(obj);
    }
    
    if (!this.validateFn || this.validateFn(obj)) {
      this.pool.push(obj);
    }
  }

  size(): number {
    return this.pool.length;
  }

  clear(): void {
    this.pool = [];
  }
}

export function createObjectPool<T>(
  createFn: () => T,
  resetFn?: (obj: T) => void,
  options: Omit<ObjectPoolOptions<T>, 'createFn' | 'resetFn'> = {}
): ObjectPool<T> {
  return new ObjectPool({
    ...options,
    createFn,
    resetFn
  });
}

export function createMemoryPool(bufferSize: number, poolSize = 10): ObjectPool<ArrayBuffer> {
  return createObjectPool(
    () => new ArrayBuffer(bufferSize),
    undefined,
    { maxSize: poolSize }
  );
}

export interface MemoryTracker {
  getUsage(): MemoryUsage;
  track<T>(fn: () => T): { result: T; memoryDelta: number };
  trackAsync<T>(fn: () => Promise<T>): Promise<{ result: T; memoryDelta: number }>;
}

export interface MemoryUsage {
  heapUsed: number;
  heapTotal: number;
  external: number;
  arrayBuffers: number;
}

export function trackMemoryUsage(): MemoryTracker {
  const getMemoryUsage = (): MemoryUsage => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: usage.heapUsed,
        heapTotal: usage.heapTotal,
        external: usage.external,
        arrayBuffers: usage.arrayBuffers || 0
      };
    }
    
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      return {
        heapUsed: memory.usedJSHeapSize,
        heapTotal: memory.totalJSHeapSize,
        external: memory.totalJSHeapSize - memory.usedJSHeapSize,
        arrayBuffers: 0
      };
    }
    
    return {
      heapUsed: 0,
      heapTotal: 0,
      external: 0,
      arrayBuffers: 0
    };
  };

  return {
    getUsage: getMemoryUsage,
    
    track<T>(fn: () => T): { result: T; memoryDelta: number } {
      const beforeMemory = getMemoryUsage();
      const result = fn();
      const afterMemory = getMemoryUsage();
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed;
      
      return { result, memoryDelta };
    },
    
    async trackAsync<T>(fn: () => Promise<T>): Promise<{ result: T; memoryDelta: number }> {
      const beforeMemory = getMemoryUsage();
      const result = await fn();
      const afterMemory = getMemoryUsage();
      const memoryDelta = afterMemory.heapUsed - beforeMemory.heapUsed;
      
      return { result, memoryDelta };
    }
  };
}

export class MemoryMonitor {
  private interval: NodeJS.Timeout | null = null;
  private samples: MemoryUsage[] = [];
  private maxSamples: number;
  private onThreshold?: (usage: MemoryUsage) => void;
  private threshold?: number;

  constructor(
    maxSamples = 100,
    options: {
      threshold?: number;
      onThreshold?: (usage: MemoryUsage) => void;
    } = {}
  ) {
    this.maxSamples = maxSamples;
    this.threshold = options.threshold;
    this.onThreshold = options.onThreshold;
  }

  start(intervalMs = 1000): void {
    if (this.interval) return;
    
    const tracker = trackMemoryUsage();
    
    this.interval = setInterval(() => {
      const usage = tracker.getUsage();
      this.samples.push(usage);
      
      if (this.samples.length > this.maxSamples) {
        this.samples.shift();
      }
      
      if (this.threshold && usage.heapUsed > this.threshold && this.onThreshold) {
        this.onThreshold(usage);
      }
    }, intervalMs);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  getSamples(): MemoryUsage[] {
    return [...this.samples];
  }

  getLatest(): MemoryUsage | undefined {
    return this.samples[this.samples.length - 1];
  }

  getAverage(): MemoryUsage | undefined {
    if (this.samples.length === 0) return undefined;
    
    const totals = this.samples.reduce(
      (acc, usage) => ({
        heapUsed: acc.heapUsed + usage.heapUsed,
        heapTotal: acc.heapTotal + usage.heapTotal,
        external: acc.external + usage.external,
        arrayBuffers: acc.arrayBuffers + usage.arrayBuffers
      }),
      { heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 }
    );
    
    const count = this.samples.length;
    return {
      heapUsed: Math.round(totals.heapUsed / count),
      heapTotal: Math.round(totals.heapTotal / count),
      external: Math.round(totals.external / count),
      arrayBuffers: Math.round(totals.arrayBuffers / count)
    };
  }

  getPeak(): MemoryUsage | undefined {
    if (this.samples.length === 0) return undefined;
    
    return this.samples.reduce((peak, usage) => ({
      heapUsed: Math.max(peak.heapUsed, usage.heapUsed),
      heapTotal: Math.max(peak.heapTotal, usage.heapTotal),
      external: Math.max(peak.external, usage.external),
      arrayBuffers: Math.max(peak.arrayBuffers, usage.arrayBuffers)
    }));
  }

  clear(): void {
    this.samples = [];
  }
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

declare const window: any;
export function gc(): void {
  if (typeof global !== 'undefined' && global.gc) {
    global.gc();
  } else if (typeof window !== 'undefined' && (window as any).gc) {
    (window as any).gc();
  }
}

export function forceGC(): Promise<void> {
  return new Promise((resolve) => {
    gc();
    setTimeout(() => {
      gc();
      resolve();
    }, 100);
  });
}