import { CircuitBreakerOptions, CircuitBreakerState } from '../types/index.js';

export class CircuitBreakerStrategy {
  private state: CircuitBreakerState = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private nextAttemptTime?: Date;

  constructor(private options: CircuitBreakerOptions) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half-open';
        this.successCount = 0;
        this.notifyStateChange();
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;

    if (this.state === 'half-open') {
      this.successCount++;
      const halfOpenMaxCalls = this.options.halfOpenMaxCalls || 1;
      
      if (this.successCount >= halfOpenMaxCalls) {
        this.state = 'closed';
        this.notifyStateChange();
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;

    if (this.state === 'half-open') {
      this.state = 'open';
      this.setNextAttemptTime();
      this.notifyStateChange();
    } else if (this.state === 'closed' && this.failureCount >= this.options.failureThreshold) {
      this.state = 'open';
      this.setNextAttemptTime();
      this.notifyStateChange();
    }
  }

  private shouldAttemptReset(): boolean {
    return this.nextAttemptTime ? new Date() >= this.nextAttemptTime : false;
  }

  private setNextAttemptTime(): void {
    this.nextAttemptTime = new Date(Date.now() + this.options.resetTimeout);
  }

  private notifyStateChange(): void {
    if (this.options.onStateChange) {
      this.options.onStateChange(this.state);
    }
  }

  getState(): CircuitBreakerState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  getSuccessCount(): number {
    return this.successCount;
  }

  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.nextAttemptTime = undefined;
    this.notifyStateChange();
  }

  forceOpen(): void {
    this.state = 'open';
    this.setNextAttemptTime();
    this.notifyStateChange();
  }

  forceClose(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.nextAttemptTime = undefined;
    this.notifyStateChange();
  }
}

export class CircuitBreakerBuilder {
  private options: Partial<CircuitBreakerOptions> = {};

  failureThreshold(threshold: number): this {
    this.options.failureThreshold = threshold;
    return this;
  }

  resetTimeout(timeout: number): this {
    this.options.resetTimeout = timeout;
    return this;
  }

  halfOpenMaxCalls(calls: number): this {
    this.options.halfOpenMaxCalls = calls;
    return this;
  }

  monitoringPeriod(period: number): this {
    this.options.monitoringPeriod = period;
    return this;
  }

  onStateChange(callback: (state: CircuitBreakerState) => void): this {
    this.options.onStateChange = callback;
    return this;
  }

  build(): CircuitBreakerStrategy {
    if (!this.options.failureThreshold) {
      throw new Error('failureThreshold is required');
    }
    if (!this.options.resetTimeout) {
      throw new Error('resetTimeout is required');
    }

    return new CircuitBreakerStrategy(this.options as CircuitBreakerOptions);
  }
}

// 预定义的熔断器策略
export const DEFAULT_CIRCUIT_BREAKER = new CircuitBreakerStrategy({
  failureThreshold: 5,
  resetTimeout: 60000,
  halfOpenMaxCalls: 3
});

export const AGGRESSIVE_CIRCUIT_BREAKER = new CircuitBreakerStrategy({
  failureThreshold: 3,
  resetTimeout: 30000,
  halfOpenMaxCalls: 1
});

export const CONSERVATIVE_CIRCUIT_BREAKER = new CircuitBreakerStrategy({
  failureThreshold: 10,
  resetTimeout: 120000,
  halfOpenMaxCalls: 5
});

export function createCircuitBreaker(): CircuitBreakerBuilder {
  return new CircuitBreakerBuilder();
}