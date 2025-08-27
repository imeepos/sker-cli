import { AsyncLocalStorage } from 'async_hooks';
import { Logger } from './logger.js';
import { 
  LoggerConfig, 
  TraceContext, 
  Span, 
  TracingConfig,
  LogContext 
} from './types.js';

export class TracingLogger extends Logger {
  private traceStorage = new AsyncLocalStorage<TraceContext>();
  private activeSpans = new Map<string, SpanImpl>();
  private tracingConfig: TracingConfig;

  constructor(config: LoggerConfig = {}) {
    super(config);
    this.tracingConfig = config.tracing || { enabled: true, sampling: 0.1 };
  }

  public startSpan(operationName: string, parentSpan?: Span): Span {
    if (!this.tracingConfig.enabled) {
      return new NoOpSpan();
    }

    const traceContext = this.getCurrentTraceContext();
    const spanId = this.createSpanId();
    
    const span = new SpanImpl({
      spanId,
      traceId: traceContext?.traceId || this.createTraceId(),
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      references: parentSpan ? [{
        type: 'childOf',
        spanContext: {
          traceId: parentSpan.traceId,
          spanId: parentSpan.spanId
        }
      }] : []
    });

    this.activeSpans.set(spanId, span);
    
    return span;
  }

  public getCurrentTraceContext(): TraceContext | undefined {
    return this.traceStorage.getStore();
  }

  public runInTrace<T>(traceContext: TraceContext, fn: () => T): T {
    return this.traceStorage.run(traceContext, fn);
  }

  public async runInTraceAsync<T>(traceContext: TraceContext, fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.traceStorage.run(traceContext, async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
  }

  protected override getCurrentContext(): LogContext {
    const baseContext = super.getCurrentContext();
    const traceContext = this.getCurrentTraceContext();
    
    if (traceContext) {
      return {
        ...baseContext,
        trace_id: traceContext.traceId,
        span_id: traceContext.spanId,
        parent_span_id: traceContext.parentSpanId
      };
    }
    
    return baseContext;
  }


  private createTraceId(): string {
    return Array.from({ length: 32 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private createSpanId(): string {
    return Array.from({ length: 16 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

class SpanImpl implements Span {
  public spanId: string;
  public traceId: string;
  public operationName: string;
  public startTime: number;
  public endTime?: number;
  public tags: Record<string, any>;
  public logs: Array<{ timestamp: number; fields: Record<string, any> }>;
  public references: Array<{
    type: 'childOf' | 'followsFrom';
    spanContext: TraceContext;
  }>;

  constructor(data: {
    spanId: string;
    traceId: string;
    operationName: string;
    startTime: number;
    tags: Record<string, any>;
    logs: Array<{ timestamp: number; fields: Record<string, any> }>;
    references: Array<{
      type: 'childOf' | 'followsFrom';
      spanContext: TraceContext;
    }>;
  }) {
    this.spanId = data.spanId;
    this.traceId = data.traceId;
    this.operationName = data.operationName;
    this.startTime = data.startTime;
    this.tags = data.tags;
    this.logs = data.logs;
    this.references = data.references;
  }

  setTag(key: string, value: any): Span {
    this.tags[key] = value;
    return this;
  }

  log(fields: Record<string, any>): Span {
    this.logs.push({
      timestamp: Date.now(),
      fields
    });
    return this;
  }

  recordException(error: Error): Span {
    this.setTag('error', true);
    this.log({
      event: 'error',
      'error.object': error,
      'error.kind': error.constructor.name,
      message: error.message,
      stack: error.stack
    });
    return this;
  }

  end(): void {
    this.endTime = Date.now();
    
    console.log(`[Span] ${this.operationName} completed in ${this.endTime - this.startTime}ms`, {
      traceId: this.traceId,
      spanId: this.spanId,
      duration: this.endTime - this.startTime,
      tags: this.tags,
      logs: this.logs
    });
  }
}

class NoOpSpan implements Span {
  spanId = '';
  traceId = '';
  operationName = '';
  startTime = 0;
  endTime = 0;
  tags = {};
  logs = [];
  references = [];

  setTag(): Span { return this; }
  log(): Span { return this; }
  recordException(): Span { return this; }
  end(): void {}
}

export function createTraceContext(data: {
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
  flags?: number;
  baggage?: Record<string, string>;
}): TraceContext {
  return {
    traceId: data.traceId || createRandomTraceId(),
    spanId: data.spanId || createRandomSpanId(),
    parentSpanId: data.parentSpanId,
    flags: data.flags || 0,
    baggage: data.baggage || {}
  };
}

function createRandomTraceId(): string {
  return Array.from({ length: 32 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function createRandomSpanId(): string {
  return Array.from({ length: 16 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}