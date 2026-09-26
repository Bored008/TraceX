// Telemetry types matching the backend's OpenTelemetry-style data

export interface LogEntry {
  id: string;
  timestamp: number;
  serviceId: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL';
  message: string;
  traceId?: string;
  spanId?: string;
  metadata?: Record<string, unknown>;
}

export interface MetricPoint {
  timestamp: number;
  serviceId: string;
  name: MetricName;
  value: number;
  unit: string;
}

export type MetricName = 'latency' | 'error_rate' | 'throughput' | 'cpu' | 'memory' | 'connections';

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  serviceId: string;
  operationName: string;
  startTime: number;
  duration: number;
  status: 'OK' | 'ERROR' | 'TIMEOUT';
  tags?: Record<string, string>;
}

export interface ServiceMetrics {
  latency: number;
  errorRate: number;
  throughput: number;
  cpu: number;
  memory: number;
  connections: number;
}
