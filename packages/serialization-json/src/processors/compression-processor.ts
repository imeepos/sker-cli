/**
 * 数据压缩处理器
 */

import { gzip, gunzip, brotliCompress, brotliDecompress, deflate, inflate } from 'zlib';
import { promisify } from 'util';
import { EventEmitter } from 'events';
import {
  CompressionConfig,
  CompressionAlgorithm
} from '../types/serializer-types.js';
import { PERFORMANCE_CONSTANTS } from '../constants/json-constants.js';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);
const brotliCompressAsync = promisify(brotliCompress);
const brotliDecompressAsync = promisify(brotliDecompress);
const deflateAsync = promisify(deflate);
const inflateAsync = promisify(inflate);

/**
 * 压缩统计信息
 */
export interface CompressionStats {
  algorithm: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  compressionTime: number;
  decompressionTime: number;
}

/**
 * 自适应压缩配置
 */
export interface AdaptiveCompressionConfig {
  enabled: boolean;
  sizeThresholds: {
    tiny: number;
    small: number;
    medium: number;
    large: number;
  };
  algorithmSelection: {
    [key: string]: CompressionAlgorithm;
  };
}

/**
 * 数据压缩处理器
 */
interface RequiredCompressionConfig {
  algorithm: 'none' | 'gzip' | 'brotli' | 'deflate';
  level: number;
  threshold: number;
  dictionary?: Buffer;
}

export class CompressionProcessor extends EventEmitter {
  private config: RequiredCompressionConfig;
  private stats: Map<string, CompressionStats> = new Map();
  private adaptiveConfig: AdaptiveCompressionConfig;

  constructor(config: Partial<CompressionConfig> = {}) {
    super();

    this.config = {
      algorithm: config.algorithm ?? 'gzip',
      level: config.level ?? 6,
      threshold: config.threshold ?? 1024,
      dictionary: config.dictionary
    };

    this.adaptiveConfig = {
      enabled: true,
      sizeThresholds: {
        tiny: PERFORMANCE_CONSTANTS.SIZE_THRESHOLDS.TINY,
        small: PERFORMANCE_CONSTANTS.SIZE_THRESHOLDS.SMALL,
        medium: PERFORMANCE_CONSTANTS.SIZE_THRESHOLDS.MEDIUM,
        large: PERFORMANCE_CONSTANTS.SIZE_THRESHOLDS.LARGE
      },
      algorithmSelection: {
        tiny: CompressionAlgorithm.NONE,
        small: CompressionAlgorithm.GZIP,
        medium: CompressionAlgorithm.GZIP,
        large: CompressionAlgorithm.BROTLI,
        huge: CompressionAlgorithm.BROTLI
      }
    };
  }

  /**
   * 压缩数据
   */
  async compress(data: Buffer, options?: Partial<RequiredCompressionConfig>): Promise<{
    compressed: Buffer;
    stats: CompressionStats;
  }> {
    const startTime = Date.now();
    const config = { ...this.config, ...options };
    const originalSize = data.length;

    this.emit('compressionStarted', { 
      algorithm: config.algorithm, 
      originalSize 
    });

    // 检查是否需要压缩
    if (originalSize < config.threshold) {
      const stats: CompressionStats = {
        algorithm: 'none',
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        compressionTime: 0,
        decompressionTime: 0
      };

      this.emit('compressionSkipped', stats);
      return { compressed: data, stats };
    }

    // 选择压缩算法
    const algorithm = this.selectAlgorithm(data, config);
    
    try {
      let compressed: Buffer;

      switch (algorithm) {
        case 'gzip':
          compressed = await this.compressGzip(data, config);
          break;
        case 'brotli':
          compressed = await this.compressBrotli(data, config);
          break;
        case 'deflate':
          compressed = await this.compressDeflate(data, config);
          break;
        case 'none':
        default:
          compressed = data;
          break;
      }

      const compressionTime = Date.now() - startTime;
      const stats: CompressionStats = {
        algorithm,
        originalSize,
        compressedSize: compressed.length,
        compressionRatio: compressed.length / originalSize,
        compressionTime,
        decompressionTime: 0
      };

      this.stats.set(`compress-${Date.now()}`, stats);
      this.emit('compressionCompleted', stats);

      return { compressed, stats };

    } catch (error) {
      this.emit('compressionError', { 
        algorithm, 
        error, 
        originalSize 
      });
      throw new Error(`Compression failed with ${algorithm}: ${(error as Error).message}`);
    }
  }

  /**
   * 解压数据
   */
  async decompress(data: Buffer, algorithm: string): Promise<{
    decompressed: Buffer;
    stats: Partial<CompressionStats>;
  }> {
    const startTime = Date.now();
    const compressedSize = data.length;

    this.emit('decompressionStarted', { 
      algorithm, 
      compressedSize 
    });

    if (algorithm === 'none') {
      return {
        decompressed: data,
        stats: {
          algorithm: 'none',
          compressedSize,
          decompressionTime: 0
        }
      };
    }

    try {
      let decompressed: Buffer;

      switch (algorithm) {
        case 'gzip':
          decompressed = await this.decompressGzip(data);
          break;
        case 'brotli':
          decompressed = await this.decompressBrotli(data);
          break;
        case 'deflate':
          decompressed = await this.decompressDeflate(data);
          break;
        default:
          throw new Error(`Unsupported decompression algorithm: ${algorithm}`);
      }

      const decompressionTime = Date.now() - startTime;
      const stats: Partial<CompressionStats> = {
        algorithm,
        compressedSize,
        originalSize: decompressed.length,
        compressionRatio: compressedSize / decompressed.length,
        decompressionTime
      };

      this.emit('decompressionCompleted', stats);

      return { decompressed, stats };

    } catch (error) {
      this.emit('decompressionError', { 
        algorithm, 
        error, 
        compressedSize 
      });
      throw new Error(`Decompression failed with ${algorithm}: ${(error as Error).message}`);
    }
  }

  /**
   * Gzip压缩
   */
  private async compressGzip(data: Buffer, config: RequiredCompressionConfig): Promise<Buffer> {
    const options: any = {
      level: config.level
    };

    if (config.dictionary) {
      options.dictionary = config.dictionary;
    }

    return gzipAsync(data, options);
  }

  /**
   * Gzip解压
   */
  private async decompressGzip(data: Buffer): Promise<Buffer> {
    return gunzipAsync(data);
  }

  /**
   * Brotli压缩
   */
  private async compressBrotli(data: Buffer, config: RequiredCompressionConfig): Promise<Buffer> {
    const options: any = {
      params: {
        [require('zlib').constants.BROTLI_PARAM_QUALITY]: config.level || 6
      }
    };

    return brotliCompressAsync(data, options);
  }

  /**
   * Brotli解压
   */
  private async decompressBrotli(data: Buffer): Promise<Buffer> {
    return brotliDecompressAsync(data);
  }

  /**
   * Deflate压缩
   */
  private async compressDeflate(data: Buffer, config: RequiredCompressionConfig): Promise<Buffer> {
    const options: any = {
      level: config.level
    };

    return deflateAsync(data, options);
  }

  /**
   * Deflate解压
   */
  private async decompressDeflate(data: Buffer): Promise<Buffer> {
    return inflateAsync(data);
  }

  /**
   * 选择压缩算法
   */
  private selectAlgorithm(data: Buffer, config: RequiredCompressionConfig): string {
    // 如果明确指定了算法，直接使用
    if (config.algorithm !== 'none' && !this.adaptiveConfig.enabled) {
      return config.algorithm || 'gzip';
    }

    // 自适应算法选择
    return this.adaptiveAlgorithmSelection(data);
  }

  /**
   * 自适应算法选择
   */
  private adaptiveAlgorithmSelection(data: Buffer): string {
    const size = data.length;
    const { sizeThresholds, algorithmSelection } = this.adaptiveConfig;

    if (size <= sizeThresholds.tiny) {
      return algorithmSelection.tiny || 'none';
    } else if (size <= sizeThresholds.small) {
      return algorithmSelection.small || 'gzip';
    } else if (size <= sizeThresholds.medium) {
      return algorithmSelection.medium || 'gzip';
    } else if (size <= sizeThresholds.large) {
      return algorithmSelection.large || 'brotli';
    } else {
      return algorithmSelection.huge || 'brotli';
    }
  }

  /**
   * 分析数据特征
   */
  analyzeData(data: Buffer): {
    entropy: number;
    repetitionRate: number;
    compressionPotential: 'low' | 'medium' | 'high';
  } {
    const frequencies = new Map<number, number>();
    let totalBytes = 0;

    // 计算字节频率
    for (const byte of data) {
      frequencies.set(byte, (frequencies.get(byte) || 0) + 1);
      totalBytes++;
    }

    // 计算熵
    let entropy = 0;
    for (const freq of frequencies.values()) {
      const probability = freq / totalBytes;
      entropy -= probability * Math.log2(probability);
    }

    // 计算重复率
    const uniqueBytes = frequencies.size;
    const repetitionRate = 1 - (uniqueBytes / 256);

    // 评估压缩潜力
    let compressionPotential: 'low' | 'medium' | 'high';
    if (entropy > 7.5) {
      compressionPotential = 'low';
    } else if (entropy > 6) {
      compressionPotential = 'medium';
    } else {
      compressionPotential = 'high';
    }

    return {
      entropy,
      repetitionRate,
      compressionPotential
    };
  }

  /**
   * 基准测试不同算法
   */
  async benchmark(data: Buffer): Promise<{
    [algorithm: string]: {
      compressionRatio: number;
      compressionTime: number;
      decompressionTime: number;
      efficiency: number; // 综合评分
    };
  }> {
    const algorithms: CompressionAlgorithm[] = [
      CompressionAlgorithm.GZIP,
      CompressionAlgorithm.BROTLI,
      CompressionAlgorithm.DEFLATE
    ];

    const results: any = {};

    for (const algorithm of algorithms) {
      try {
        const compressStart = Date.now();
        const { compressed } = await this.compress(data, { algorithm });
        const compressTime = Date.now() - compressStart;

        const decompressStart = Date.now();
        await this.decompress(compressed, algorithm);
        const decompressTime = Date.now() - decompressStart;

        const compressionRatio = compressed.length / data.length;
        
        // 计算效率评分（考虑压缩率和速度）
        const efficiency = (1 / compressionRatio) * (1000 / (compressTime + decompressTime));

        results[algorithm] = {
          compressionRatio,
          compressionTime: compressTime,
          decompressionTime: decompressTime,
          efficiency
        };

      } catch (error) {
        results[algorithm] = {
          error: (error as Error).message
        };
      }
    }

    this.emit('benchmarkCompleted', { dataSize: data.length, results });
    return results;
  }

  /**
   * 推荐最佳算法
   */
  async recommendAlgorithm(data: Buffer, priority: 'size' | 'speed' | 'balanced' = 'balanced'): Promise<{
    algorithm: CompressionAlgorithm;
    reason: string;
    expectedRatio: number;
  }> {
    const analysis = this.analyzeData(data);
    const benchmark = await this.benchmark(data);

    let bestAlgorithm = CompressionAlgorithm.GZIP;
    let reason = 'Default choice';
    let expectedRatio = 1;

    switch (priority) {
      case 'size':
        // 选择压缩率最好的
        let bestRatio = Infinity;
        for (const [alg, result] of Object.entries(benchmark)) {
          if (!('error' in result) && result.compressionRatio < bestRatio) {
            bestRatio = result.compressionRatio;
            bestAlgorithm = alg as CompressionAlgorithm;
            reason = `Best compression ratio: ${(bestRatio * 100).toFixed(1)}%`;
            expectedRatio = bestRatio;
          }
        }
        break;

      case 'speed':
        // 选择速度最快的
        let bestSpeed = Infinity;
        for (const [alg, result] of Object.entries(benchmark)) {
          if (!('error' in result)) {
            const totalTime = result.compressionTime + result.decompressionTime;
            if (totalTime < bestSpeed) {
              bestSpeed = totalTime;
              bestAlgorithm = alg as CompressionAlgorithm;
              reason = `Fastest processing: ${bestSpeed}ms`;
              expectedRatio = result.compressionRatio;
            }
          }
        }
        break;

      case 'balanced':
      default:
        // 选择效率最高的
        let bestEfficiency = 0;
        for (const [alg, result] of Object.entries(benchmark)) {
          if (!('error' in result) && result.efficiency > bestEfficiency) {
            bestEfficiency = result.efficiency;
            bestAlgorithm = alg as CompressionAlgorithm;
            reason = `Best balance of compression and speed (efficiency: ${bestEfficiency.toFixed(2)})`;
            expectedRatio = result.compressionRatio;
          }
        }
        break;
    }

    // 如果数据压缩潜力很低，推荐不压缩
    if (analysis.compressionPotential === 'low') {
      return {
        algorithm: CompressionAlgorithm.NONE,
        reason: 'Low compression potential detected, skipping compression',
        expectedRatio: 1
      };
    }

    return {
      algorithm: bestAlgorithm,
      reason,
      expectedRatio
    };
  }

  /**
   * 获取压缩统计
   */
  getStats(): CompressionStats[] {
    return Array.from(this.stats.values());
  }

  /**
   * 清理统计数据
   */
  clearStats(): void {
    this.stats.clear();
    this.emit('statsCleared');
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<CompressionConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('configUpdated', this.config);
  }

  /**
   * 更新自适应配置
   */
  updateAdaptiveConfig(config: Partial<AdaptiveCompressionConfig>): void {
    this.adaptiveConfig = { ...this.adaptiveConfig, ...config };
    this.emit('adaptiveConfigUpdated', this.adaptiveConfig);
  }

  /**
   * 获取支持的算法列表
   */
  getSupportedAlgorithms(): CompressionAlgorithm[] {
    return [
      CompressionAlgorithm.NONE,
      CompressionAlgorithm.GZIP,
      CompressionAlgorithm.BROTLI,
      CompressionAlgorithm.DEFLATE
    ];
  }

  /**
   * 验证算法支持
   */
  isAlgorithmSupported(algorithm: string): boolean {
    return this.getSupportedAlgorithms().includes(algorithm as CompressionAlgorithm);
  }

  /**
   * 估算压缩后大小
   */
  estimateCompressedSize(data: Buffer, algorithm: CompressionAlgorithm): number {
    const analysis = this.analyzeData(data);
    
    // 基于熵和算法特性的估算
    let estimatedRatio: number;
    
    switch (algorithm) {
      case CompressionAlgorithm.GZIP:
        estimatedRatio = Math.max(0.1, analysis.entropy / 8);
        break;
      case CompressionAlgorithm.BROTLI:
        estimatedRatio = Math.max(0.08, analysis.entropy / 9);
        break;
      case CompressionAlgorithm.DEFLATE:
        estimatedRatio = Math.max(0.12, analysis.entropy / 7.5);
        break;
      case CompressionAlgorithm.NONE:
      default:
        estimatedRatio = 1;
        break;
    }

    return Math.ceil(data.length * estimatedRatio);
  }

  /**
   * 批量压缩
   */
  async compressBatch(dataArray: Buffer[], options?: Partial<RequiredCompressionConfig>): Promise<{
    results: Array<{ compressed: Buffer; stats: CompressionStats }>;
    summary: {
      totalOriginalSize: number;
      totalCompressedSize: number;
      averageRatio: number;
      totalTime: number;
    };
  }> {
    const startTime = Date.now();
    const results: Array<{ compressed: Buffer; stats: CompressionStats }> = [];
    
    let totalOriginalSize = 0;
    let totalCompressedSize = 0;

    for (const data of dataArray) {
      const result = await this.compress(data, options);
      results.push(result);
      
      totalOriginalSize += result.stats.originalSize;
      totalCompressedSize += result.stats.compressedSize;
    }

    const totalTime = Date.now() - startTime;
    const averageRatio = totalOriginalSize > 0 ? totalCompressedSize / totalOriginalSize : 1;

    return {
      results,
      summary: {
        totalOriginalSize,
        totalCompressedSize,
        averageRatio,
        totalTime
      }
    };
  }

  /**
   * 清理资源
   */
  dispose(): void {
    this.stats.clear();
    this.removeAllListeners();
  }
}