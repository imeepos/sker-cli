import * as fs from 'fs/promises';
import * as path from 'path';
import { 
  OutputAdapter, 
  BatchOutputAdapter, 
  LogEntry, 
  LogLevel, 
  LogFormat 
} from './types.js';

export class FileOutputAdapter implements OutputAdapter {
  private writeStream?: fs.FileHandle;
  private currentSize = 0;

  constructor(private config: {
    filename: string;
    maxSize?: string;
    maxFiles?: number;
    compress?: boolean;
  }) {}

  async write(entry: LogEntry): Promise<void> {
    if (!this.writeStream) {
      await this.openFile();
    }

    const content = JSON.stringify(entry) + '\n';
    const size = Buffer.byteLength(content, 'utf8');
    
    if (this.shouldRotate(size)) {
      await this.rotateFile();
    }

    await this.writeStream!.write(content);
    this.currentSize += size;
  }

  private async openFile(): Promise<void> {
    const dir = path.dirname(this.config.filename);
    await fs.mkdir(dir, { recursive: true });
    
    this.writeStream = await fs.open(this.config.filename, 'a');
    
    const stats = await this.writeStream.stat();
    this.currentSize = stats.size;
  }

  private shouldRotate(additionalSize: number): boolean {
    if (!this.config.maxSize) return false;
    
    const maxBytes = this.parseSize(this.config.maxSize);
    return this.currentSize + additionalSize > maxBytes;
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      'B': 1,
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };

    const match = size.match(/^(\d+(?:\.\d+)?)\s*([KMGT]?B)$/i);
    if (!match) {
      throw new Error(`Invalid size format: ${size}`);
    }

    const [, value, unit] = match;
    return parseFloat(value || '0') * (units[unit?.toUpperCase() || 'B'] || 1);
  }

  private async rotateFile(): Promise<void> {
    if (this.writeStream) {
      await this.writeStream.close();
    }

    const { dir, name, ext } = path.parse(this.config.filename);
    
    if (this.config.maxFiles && this.config.maxFiles > 0) {
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(dir, `${name}.${i}${ext}`);
        const newFile = path.join(dir, `${name}.${i + 1}${ext}`);
        
        try {
          await fs.rename(oldFile, newFile);
        } catch (error) {
        }
      }
      
      const rotatedFile = path.join(dir, `${name}.1${ext}`);
      try {
        await fs.rename(this.config.filename, rotatedFile);
        
        if (this.config.compress) {
          await this.compressFile(rotatedFile);
        }
      } catch (error) {
        console.error('Failed to rotate log file:', error);
      }
    }

    await this.openFile();
    this.currentSize = 0;
  }

  private async compressFile(filename: string): Promise<void> {
    console.log(`[FileOutputAdapter] Compression not implemented for: ${filename}`);
  }

  async flush(): Promise<void> {
    if (this.writeStream) {
      await this.writeStream.sync();
    }
  }

  async close(): Promise<void> {
    if (this.writeStream) {
      await this.writeStream.close();
      this.writeStream = undefined;
    }
  }
}

export class ElasticsearchOutputAdapter implements OutputAdapter {
  private readonly baseUrl: string;

  constructor(private config: {
    host: string;
    index: string;
    type?: string;
    username?: string;
    password?: string;
  }) {
    this.baseUrl = config.host.endsWith('/') ? config.host : `${config.host}/`;
  }

  async write(entry: LogEntry): Promise<void> {
    try {
      const url = `${this.baseUrl}${this.config.index}/${this.config.type || '_doc'}`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...this.getAuthHeaders()
        },
        body: JSON.stringify(entry)
      });

      if (!response.ok) {
        throw new Error(`Elasticsearch write failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('[ElasticsearchOutputAdapter] Failed to write entry:', error);
      throw error;
    }
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
    
    return headers;
  }
}

export class BatchElasticsearchOutputAdapter implements BatchOutputAdapter {
  private buffer: LogEntry[] = [];
  private timer?: NodeJS.Timeout;

  constructor(
    private config: {
      host: string;
      index: string;
      type?: string;
      username?: string;
      password?: string;
    },
    private options: {
      batchSize: number;
      flushInterval: number;
      maxRetries: number;
    } = {
      batchSize: 100,
      flushInterval: 5000,
      maxRetries: 3
    }
  ) {
    this.startFlushTimer();
  }

  async write(entry: LogEntry): Promise<void> {
    this.buffer.push(entry);
    
    if (this.buffer.length >= this.options.batchSize) {
      await this.flush();
    }
  }

  async writeBatch(entries: LogEntry[]): Promise<void> {
    const baseUrl = this.config.host.endsWith('/') ? this.config.host : `${this.config.host}/`;
    
    const body = entries.flatMap(entry => [
      { index: { _index: this.config.index, _type: this.config.type || '_doc' } },
      entry
    ]);

    let retries = 0;
    while (retries < this.options.maxRetries) {
      try {
        const response = await fetch(`${baseUrl}_bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...this.getAuthHeaders()
          },
          body: body.map(item => JSON.stringify(item)).join('\n') + '\n'
        });

        if (!response.ok) {
          throw new Error(`Elasticsearch bulk write failed: ${response.status} ${response.statusText}`);
        }

        const result = await response.json() as any;
        if (result.errors) {
          console.warn('[BatchElasticsearchOutputAdapter] Some documents failed to index:', result.items);
        }

        return;
      } catch (error) {
        retries++;
        if (retries >= this.options.maxRetries) {
          console.error('[BatchElasticsearchOutputAdapter] Failed to write batch after retries:', error);
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const entries = [...this.buffer];
    this.buffer = [];

    await this.writeBatch(entries);
  }

  private startFlushTimer(): void {
    this.timer = setInterval(() => {
      this.flush().catch(error => {
        console.error('[BatchElasticsearchOutputAdapter] Timer flush failed:', error);
      });
    }, this.options.flushInterval);
  }

  private getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (this.config.username && this.config.password) {
      const credentials = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }
    
    return headers;
  }

  async close(): Promise<void> {
    if (this.timer) {
      clearInterval(this.timer);
    }
    
    await this.flush();
  }
}

export class ConsoleOutputAdapter implements OutputAdapter {
  constructor(private format: LogFormat = LogFormat.PRETTY) {}

  write(entry: LogEntry): void {
    const output = this.format === LogFormat.JSON 
      ? JSON.stringify(entry, null, 2)
      : this.formatPretty(entry);
    
    const logFunction = this.getLogFunction(entry.level);
    logFunction(output);
  }

  private getLogFunction(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        return console.error;
      default:
        return console.log;
    }
  }

  private formatPretty(entry: LogEntry): string {
    const levelColors: Record<LogLevel, string> = {
      [LogLevel.TRACE]: '\x1b[90m',    // Bright Black (Gray)
      [LogLevel.DEBUG]: '\x1b[36m',    // Cyan
      [LogLevel.INFO]: '\x1b[32m',     // Green  
      [LogLevel.WARN]: '\x1b[33m',     // Yellow
      [LogLevel.ERROR]: '\x1b[31m',    // Red
      [LogLevel.FATAL]: '\x1b[35m'     // Magenta
    };
    
    const reset = '\x1b[0m';
    const color = levelColors[entry.level] || '';
    
    const level = LogLevel[entry.level].padEnd(5);
    const timestamp = new Date(entry.timestamp).toLocaleString();
    const service = `[${entry.service.name}]`;
    
    let output = `${color}${timestamp} ${level}${reset} ${service} ${entry.message}`;
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(entry.context)}`;
    }
    
    if (entry.error) {
      output += `\n  ${color}Error: ${entry.error.message}${reset}`;
      if (entry.error.stack) {
        output += `\n  ${color}Stack: ${entry.error.stack}${reset}`;
      }
    }
    
    return output;
  }
}

export class MultiOutputAdapter implements OutputAdapter {
  constructor(private outputs: OutputAdapter[]) {}

  async write(entry: LogEntry): Promise<void> {
    const promises = this.outputs.map(async output => {
      try {
        await output.write(entry);
      } catch (error) {
        console.error('[MultiOutputAdapter] Output failed:', error);
      }
    });

    await Promise.all(promises);
  }

  async flush(): Promise<void> {
    const promises = this.outputs
      .filter(output => output.flush)
      .map(output => output.flush!());
    
    await Promise.all(promises);
  }

  async close(): Promise<void> {
    const promises = this.outputs
      .filter(output => output.close)
      .map(output => output.close!());
    
    await Promise.all(promises);
  }
}

export function createFilter(options: {
  condition: (entry: LogEntry) => boolean;
  transform: (entry: LogEntry) => LogEntry | null;
}) {
  return (entry: LogEntry): LogEntry | null => {
    if (options.condition(entry)) {
      return options.transform(entry);
    }
    return entry;
  };
}