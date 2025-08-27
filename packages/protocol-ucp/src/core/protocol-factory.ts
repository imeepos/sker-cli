import {
  ProtocolType,
  ProtocolAdapter,
  ProtocolClient,
  ProtocolServer,
  Connection,
  ConnectionConfig,
  CallOptions,
  StreamOptions
} from '../interfaces/protocol.js';

/**
 * 协议选择策略枚举
 */
export enum SelectionStrategy {
  FIXED = 'fixed',
  ROUND_ROBIN = 'round_robin',
  LEAST_LATENCY = 'least_latency',
  LOAD_BASED = 'load_based',
  ADAPTIVE = 'adaptive',
  PRIORITY = 'priority'
}

/**
 * 协议选择条件接口
 */
export interface SelectionCondition {
  service?: string;
  method?: string;
  clientType?: string;
  payloadSize?: number;
  requiresStreaming?: boolean;
  latencyRequirement?: number;
  throughputRequirement?: number;
  reliability?: number;
  security?: boolean;
  [key: string]: any;
}

/**
 * 协议优先级配置接口
 */
export interface ProtocolPriority {
  protocol: ProtocolType;
  conditions: string[];
  weight: number;
  latencyWeight?: number;
  throughputWeight?: number;
  reliabilityWeight?: number;
}

/**
 * 协议选择器配置接口
 */
export interface ProtocolSelectorConfig {
  strategy: SelectionStrategy;
  priorities?: ProtocolPriority[];
  metrics?: {
    latency: number;
    throughput: number;
    reliability: number;
  };
  fallbackProtocol?: ProtocolType;
  maxSelectionTime?: number;
}

/**
 * 协议性能指标接口
 */
export interface ProtocolMetrics {
  protocol: ProtocolType;
  latency: number;
  throughput: number;
  errorRate: number;
  availability: number;
  connectionCount: number;
  lastUpdated: number;
}

/**
 * 协议选择器实现
 */
export class ProtocolSelector {
  private readonly config: ProtocolSelectorConfig;
  private readonly metrics: Map<ProtocolType, ProtocolMetrics> = new Map();
  private roundRobinIndex = 0;
  
  constructor(config: ProtocolSelectorConfig) {
    this.config = config;
  }
  
  /**
   * 根据条件选择最优协议
   */
  async selectProtocol(
    condition: SelectionCondition,
    availableProtocols: ProtocolType[] = Object.values(ProtocolType)
  ): Promise<ProtocolType> {
    const startTime = Date.now();
    
    try {
      let selectedProtocol: ProtocolType;
      
      switch (this.config.strategy) {
        case SelectionStrategy.FIXED:
          selectedProtocol = this.selectFixed(availableProtocols);
          break;
          
        case SelectionStrategy.ROUND_ROBIN:
          selectedProtocol = this.selectRoundRobin(availableProtocols);
          break;
          
        case SelectionStrategy.LEAST_LATENCY:
          selectedProtocol = this.selectLeastLatency(availableProtocols);
          break;
          
        case SelectionStrategy.LOAD_BASED:
          selectedProtocol = this.selectLoadBased(availableProtocols);
          break;
          
        case SelectionStrategy.ADAPTIVE:
          selectedProtocol = await this.selectAdaptive(condition, availableProtocols);
          break;
          
        case SelectionStrategy.PRIORITY:
          selectedProtocol = this.selectByPriority(condition, availableProtocols);
          break;
          
        default:
          selectedProtocol = availableProtocols[0] || this.config.fallbackProtocol || ProtocolType.HTTP;
      }
      
      const selectionTime = Date.now() - startTime;
      if (this.config.maxSelectionTime && selectionTime > this.config.maxSelectionTime) {
        console.warn(`Protocol selection took ${selectionTime}ms, exceeding max time ${this.config.maxSelectionTime}ms`);
      }
      
      return selectedProtocol;
      
    } catch (error) {
      console.error('Error selecting protocol:', error);
      return this.config.fallbackProtocol || availableProtocols[0] || ProtocolType.HTTP;
    }
  }
  
  /**
   * 更新协议性能指标
   */
  updateMetrics(protocol: ProtocolType, metrics: Partial<ProtocolMetrics>): void {
    const current = this.metrics.get(protocol) || {
      protocol,
      latency: 0,
      throughput: 0,
      errorRate: 0,
      availability: 1,
      connectionCount: 0,
      lastUpdated: Date.now()
    };
    
    this.metrics.set(protocol, {
      ...current,
      ...metrics,
      lastUpdated: Date.now()
    });
  }
  
  /**
   * 获取协议性能指标
   */
  getMetrics(protocol: ProtocolType): ProtocolMetrics | undefined {
    return this.metrics.get(protocol);
  }
  
  private selectFixed(availableProtocols: ProtocolType[]): ProtocolType {
    return availableProtocols[0]!;
  }
  
  private selectRoundRobin(availableProtocols: ProtocolType[]): ProtocolType {
    const protocol = availableProtocols[this.roundRobinIndex % availableProtocols.length]!;
    this.roundRobinIndex++;
    return protocol;
  }
  
  private selectLeastLatency(availableProtocols: ProtocolType[]): ProtocolType {
    let bestProtocol = availableProtocols[0]!;
    let bestLatency = Infinity;
    
    for (const protocol of availableProtocols) {
      const metrics = this.metrics.get(protocol);
      if (metrics && metrics.latency < bestLatency) {
        bestLatency = metrics.latency;
        bestProtocol = protocol;
      }
    }
    
    return bestProtocol;
  }
  
  private selectLoadBased(availableProtocols: ProtocolType[]): ProtocolType {
    let bestProtocol = availableProtocols[0]!;
    let lowestLoad = Infinity;
    
    for (const protocol of availableProtocols) {
      const metrics = this.metrics.get(protocol);
      if (metrics) {
        const load = metrics.connectionCount / Math.max(metrics.availability, 0.1);
        if (load < lowestLoad) {
          lowestLoad = load;
          bestProtocol = protocol;
        }
      }
    }
    
    return bestProtocol;
  }
  
  private async selectAdaptive(
    condition: SelectionCondition,
    availableProtocols: ProtocolType[]
  ): Promise<ProtocolType> {
    const scores: Array<{ protocol: ProtocolType; score: number }> = [];
    
    for (const protocol of availableProtocols) {
      const score = this.calculateAdaptiveScore(protocol, condition);
      scores.push({ protocol, score });
    }
    
    scores.sort((a, b) => b.score - a.score);
    return scores[0]?.protocol || availableProtocols[0]!;
  }
  
  private selectByPriority(
    condition: SelectionCondition,
    availableProtocols: ProtocolType[]
  ): ProtocolType {
    if (!this.config.priorities) {
      return availableProtocols[0]!;
    }
    
    const matchingPriorities = this.config.priorities.filter(priority =>
      availableProtocols.includes(priority.protocol) &&
      this.matchesConditions(condition, priority.conditions)
    );
    
    if (matchingPriorities.length === 0) {
      return availableProtocols[0]!;
    }
    
    matchingPriorities.sort((a, b) => b.weight - a.weight);
    return matchingPriorities[0]!.protocol;
  }
  
  private calculateAdaptiveScore(protocol: ProtocolType, condition: SelectionCondition): number {
    const metrics = this.metrics.get(protocol);
    if (!metrics) {
      return 0.5; // 默认中等分数
    }
    
    let score = 0;
    const weights = this.config.metrics || { latency: 0.4, throughput: 0.3, reliability: 0.3 };
    
    // 延迟分数 (越低越好)
    const latencyScore = Math.max(0, 1 - (metrics.latency / 1000));
    score += latencyScore * weights.latency;
    
    // 吞吐量分数 (越高越好)
    const throughputScore = Math.min(1, metrics.throughput / 10000);
    score += throughputScore * weights.throughput;
    
    // 可靠性分数
    const reliabilityScore = metrics.availability * (1 - metrics.errorRate);
    score += reliabilityScore * weights.reliability;
    
    // 根据具体条件调整分数
    if (condition.requiresStreaming && protocol === ProtocolType.GRPC) {
      score += 0.2;
    }
    
    if (condition.clientType === 'web' && protocol === ProtocolType.HTTP) {
      score += 0.15;
    }
    
    if (condition.payloadSize && condition.payloadSize > 1024 * 1024 && protocol === ProtocolType.GRPC) {
      score += 0.1;
    }
    
    return Math.min(1, Math.max(0, score));
  }
  
  private matchesConditions(condition: SelectionCondition, priorityConditions: string[]): boolean {
    for (const priorityCondition of priorityConditions) {
      switch (priorityCondition) {
        case 'high_performance':
          if (condition.latencyRequirement && condition.latencyRequirement < 100) return true;
          break;
        case 'streaming':
          if (condition.requiresStreaming) return true;
          break;
        case 'web_client':
          if (condition.clientType === 'web') return true;
          break;
        case 'rest_api':
          if (condition.method && ['GET', 'POST', 'PUT', 'DELETE'].includes(condition.method.toUpperCase())) return true;
          break;
        case 'real_time':
          if (condition.latencyRequirement && condition.latencyRequirement < 50) return true;
          break;
        case 'bidirectional':
          if (condition.requiresStreaming) return true;
          break;
        case 'large_payload':
          if (condition.payloadSize && condition.payloadSize > 1024 * 1024) return true;
          break;
        case 'secure':
          if (condition.security) return true;
          break;
      }
    }
    return false;
  }
}

/**
 * 协议工厂实现
 */
export class ProtocolFactory {
  private readonly adapters: Map<ProtocolType, ProtocolAdapter> = new Map();
  private readonly selector: ProtocolSelector;
  
  constructor(selectorConfig?: ProtocolSelectorConfig) {
    this.selector = new ProtocolSelector(selectorConfig || {
      strategy: SelectionStrategy.ADAPTIVE,
      fallbackProtocol: ProtocolType.HTTP
    });
  }
  
  /**
   * 注册协议适配器
   */
  registerAdapter(adapter: ProtocolAdapter): void {
    this.adapters.set(adapter.type, adapter);
  }
  
  /**
   * 注销协议适配器
   */
  unregisterAdapter(type: ProtocolType): void {
    this.adapters.delete(type);
  }
  
  /**
   * 创建协议客户端
   */
  async createClient(
    target: string,
    condition?: SelectionCondition,
    preferredProtocol?: ProtocolType
  ): Promise<ProtocolClient> {
    let protocol: ProtocolType;
    
    if (preferredProtocol && this.adapters.has(preferredProtocol)) {
      protocol = preferredProtocol;
    } else {
      const availableProtocols = Array.from(this.adapters.keys());
      protocol = await this.selector.selectProtocol(condition || {}, availableProtocols);
    }
    
    const adapter = this.adapters.get(protocol);
    if (!adapter) {
      throw new Error(`No adapter available for protocol: ${protocol}`);
    }
    
    return this.createProtocolClient(adapter, target);
  }
  
  /**
   * 获取协议选择器
   */
  getSelector(): ProtocolSelector {
    return this.selector;
  }
  
  /**
   * 获取已注册的协议类型
   */
  getSupportedProtocols(): ProtocolType[] {
    return Array.from(this.adapters.keys());
  }
  
  private async createProtocolClient(adapter: ProtocolAdapter, target: string): Promise<ProtocolClient> {
    // 实现协议客户端创建逻辑
    return {
      protocol: adapter.type,
      target,
      async call(service: string, method: string, data: any, options?: CallOptions): Promise<any> {
        // 基本的调用实现
        throw new Error('Protocol client call not implemented');
      },
      async *stream(service: string, method: string, data: any, options?: StreamOptions): AsyncIterableIterator<any> {
        // 基本的流实现
        throw new Error('Protocol client stream not implemented');
      },
      async close(): Promise<void> {
        // 关闭连接
      }
    };
  }
}

/**
 * 创建协议客户端的便捷函数
 */
export function createProtocolClient(options: {
  protocol?: ProtocolType;
  target: string;
  condition?: SelectionCondition;
  options?: {
    retry?: {
      maxAttempts: number;
      backoff: 'linear' | 'exponential';
      retryCondition?: (error: any) => boolean;
    };
    timeout?: number;
    [key: string]: any;
  };
}): Promise<ProtocolClient> {
  const factory = new ProtocolFactory();
  return factory.createClient(options.target, options.condition, options.protocol);
}