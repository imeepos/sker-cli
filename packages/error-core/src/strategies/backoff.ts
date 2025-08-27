import { BackoffStrategy } from '../types/index.js';

export class ExponentialBackoffStrategy implements BackoffStrategy {
  constructor(
    private multiplier: number = 2,
    private maxDelay: number = 30000,
    private jitter: boolean = true
  ) {}

  calculateDelay(attempt: number, baseDelay: number): number {
    const exponentialDelay = baseDelay * Math.pow(this.multiplier, attempt - 1);
    let delay = Math.min(exponentialDelay, this.maxDelay);
    
    if (this.jitter) {
      // 添加 ±25% 的抖动
      const jitterRange = delay * 0.25;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(0, delay);
  }
}

export class LinearBackoffStrategy implements BackoffStrategy {
  constructor(
    private increment: number = 1000,
    private maxDelay: number = 30000,
    private jitter: boolean = false
  ) {}

  calculateDelay(attempt: number, baseDelay: number): number {
    const linearDelay = baseDelay + (this.increment * (attempt - 1));
    let delay = Math.min(linearDelay, this.maxDelay);
    
    if (this.jitter) {
      const jitterRange = delay * 0.1;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return Math.max(0, delay);
  }
}

export class FixedBackoffStrategy implements BackoffStrategy {
  constructor(private jitter: boolean = false) {}

  calculateDelay(_attempt: number, baseDelay: number): number {
    let delay = baseDelay;
    
    if (this.jitter) {
      const jitterRange = delay * 0.1;
      delay += (Math.random() - 0.5) * 2 * jitterRange;
    }
    
    return delay;
  }
}