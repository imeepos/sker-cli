// 日志级别
export const LOG_LEVELS = {
  TRACE: 0,
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
  FATAL: 5
} as const;

// 指标类型
export const METRIC_TYPES = {
  COUNTER: 'counter',         // 计数器
  GAUGE: 'gauge',             // 仪表盘
  HISTOGRAM: 'histogram',     // 直方图
  SUMMARY: 'summary',         // 摘要
  TIMER: 'timer'              // 计时器
} as const;

// 追踪头部
export const TRACE_HEADERS = {
  TRACE_ID: 'x-trace-id',
  SPAN_ID: 'x-span-id',
  PARENT_SPAN_ID: 'x-parent-span-id',
  TRACE_FLAGS: 'x-trace-flags',
  BAGGAGE: 'baggage'
} as const;

// 日志字段标准
export const LOG_FIELDS = {
  TIMESTAMP: 'timestamp',
  LEVEL: 'level',
  MESSAGE: 'message',
  SERVICE: 'service',
  VERSION: 'version',
  TRACE_ID: 'trace_id',
  SPAN_ID: 'span_id',
  USER_ID: 'user_id',
  REQUEST_ID: 'request_id',
  ERROR: 'error',
  DURATION: 'duration',
  HTTP_METHOD: 'http_method',
  HTTP_STATUS: 'http_status',
  HTTP_PATH: 'http_path'
} as const;

// 指标标签
export const METRIC_LABELS = {
  SERVICE_NAME: 'service_name',
  VERSION: 'version',
  ENVIRONMENT: 'environment',
  METHOD: 'method',
  STATUS: 'status',
  ENDPOINT: 'endpoint',
  ERROR_TYPE: 'error_type'
} as const;

// 日志结构接口
export interface LogEntry {
  [LOG_FIELDS.TIMESTAMP]: string;
  [LOG_FIELDS.LEVEL]: LogLevelType;
  [LOG_FIELDS.MESSAGE]: string;
  [LOG_FIELDS.SERVICE]?: string;
  [LOG_FIELDS.VERSION]?: string;
  [LOG_FIELDS.TRACE_ID]?: string;
  [LOG_FIELDS.SPAN_ID]?: string;
  [LOG_FIELDS.USER_ID]?: string;
  [LOG_FIELDS.REQUEST_ID]?: string;
  [LOG_FIELDS.ERROR]?: Error | string;
  [LOG_FIELDS.DURATION]?: number;
  [LOG_FIELDS.HTTP_METHOD]?: string;
  [LOG_FIELDS.HTTP_STATUS]?: number;
  [LOG_FIELDS.HTTP_PATH]?: string;
  [key: string]: any;
}

// 指标数据接口
export interface MetricData {
  name: string;
  type: MetricType;
  value: number;
  labels?: Record<string, string>;
  timestamp?: number;
  unit?: string;
  description?: string;
}

// 类型定义
export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];
export type LogLevelType = LogLevel;
export type MetricType = typeof METRIC_TYPES[keyof typeof METRIC_TYPES];
export type TraceHeader = typeof TRACE_HEADERS[keyof typeof TRACE_HEADERS];
export type LogField = typeof LOG_FIELDS[keyof typeof LOG_FIELDS];
export type MetricLabel = typeof METRIC_LABELS[keyof typeof METRIC_LABELS];