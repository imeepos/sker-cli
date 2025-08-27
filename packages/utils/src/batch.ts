export interface BatchOptions {
  batchSize?: number;
  concurrency?: number;
  delay?: number;
  onProgress?: (processed: number, total: number) => void;
  onError?: (error: Error, item: any, index: number) => void;
}

export async function batchProcess<T, R>(
  items: T[],
  processor: (batch: T[]) => Promise<R[]>,
  options: BatchOptions = {}
): Promise<R[]> {
  const {
    batchSize = 10,
    concurrency = 1,
    delay = 0,
    onProgress,
    onError
  } = options;

  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }

  const results: R[] = [];
  let processed = 0;

  const processBatch = async (batch: T[], batchIndex: number): Promise<R[]> => {
    try {
      if (delay > 0 && batchIndex > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      const batchResults = await processor(batch);
      processed += batch.length;
      
      if (onProgress) {
        onProgress(processed, items.length);
      }

      return batchResults;
    } catch (error) {
      if (onError) {
        batch.forEach((item, index) => {
          onError(error as Error, item, batchIndex * batchSize + index);
        });
      }
      throw error;
    }
  };

  if (concurrency === 1) {
    for (let i = 0; i < batches.length; i++) {
      const batchResults = await processBatch(batches[i]!, i);
      results.push(...batchResults);
    }
  } else {
    const batchPromises: Promise<R[]>[] = [];
    const semaphore = new Semaphore(concurrency);

    for (let i = 0; i < batches.length; i++) {
      const batchPromise = semaphore.acquire().then(async (release) => {
        try {
          return await processBatch(batches[i]!, i);
        } finally {
          release();
        }
      });
      batchPromises.push(batchPromise);
    }

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.flat());
  }

  return results;
}

export interface BatcherOptions<T> {
  maxBatchSize: number;
  maxWaitTime: number;
  concurrency?: number;
  processor: (items: T[]) => Promise<any[]>;
}

export class Batcher<T> {
  private queue: T[] = [];
  private timer: NodeJS.Timeout | null = null;
  private processing = false;
  private readonly options: Required<BatcherOptions<T>>;

  constructor(options: BatcherOptions<T>) {
    this.options = {
      concurrency: 1,
      ...options
    };
  }

  add(item: T): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push(item);

      if (this.queue.length >= this.options.maxBatchSize) {
        this.flush().then(resolve).catch(reject);
      } else {
        if (!this.timer) {
          this.timer = setTimeout(() => {
            this.flush().then(resolve).catch(reject);
          }, this.options.maxWaitTime);
        }
      }
    });
  }

  async flush(): Promise<void> {
    if (this.processing || this.queue.length === 0) return;

    this.processing = true;
    
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const itemsToProcess = this.queue.splice(0);

    try {
      await this.options.processor(itemsToProcess);
    } finally {
      this.processing = false;
    }
  }

  async close(): Promise<void> {
    await this.flush();
  }

  size(): number {
    return this.queue.length;
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<() => void> {
    return new Promise((resolve) => {
      if (this.permits > 0) {
        this.permits--;
        resolve(() => this.release());
      } else {
        this.waitQueue.push(() => {
          this.permits--;
          resolve(() => this.release());
        });
      }
    });
  }

  private release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const next = this.waitQueue.shift()!;
      next();
    }
  }
}

export interface ChunkProcessorOptions<T, R> {
  chunkSize: number;
  processor: (chunk: T[]) => Promise<R>;
  onChunkComplete?: (result: R, chunkIndex: number) => void;
  onError?: (error: Error, chunkIndex: number) => void;
  concurrency?: number;
}

export async function processInChunks<T, R>(
  items: T[],
  options: ChunkProcessorOptions<T, R>
): Promise<R[]> {
  const {
    chunkSize,
    processor,
    onChunkComplete,
    onError,
    concurrency = 1
  } = options;

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  const processChunk = async (chunk: T[], index: number): Promise<R> => {
    try {
      const result = await processor(chunk);
      if (onChunkComplete) {
        onChunkComplete(result, index);
      }
      return result;
    } catch (error) {
      if (onError) {
        onError(error as Error, index);
      }
      throw error;
    }
  };

  if (concurrency === 1) {
    const results: R[] = [];
    for (let i = 0; i < chunks.length; i++) {
      const result = await processChunk(chunks[i]!, i);
      results.push(result);
    }
    return results;
  } else {
    const semaphore = new Semaphore(concurrency);
    const promises = chunks.map(async (chunk, index) => {
      const release = await semaphore.acquire();
      try {
        return await processChunk(chunk, index);
      } finally {
        release();
      }
    });

    return Promise.all(promises);
  }
}