export type ServiceStatus = 'healthy' | 'degraded' | 'critical' | 'down';

export interface ServiceInfo {
  id: string;
  name: string;
  type: 'cdn' | 'gateway' | 'auth' | 'order' | 'payment' | 'inventory' | 'notification' | 'database';
  status: ServiceStatus;
  metrics: {
    latency: number;
    errorRate: number;
    throughput: number;
    cpu: number;
    memory: number;
    connections: number;
  };
  metricsHistory: {
    latency: Array<{ timestamp: number; value: number }>;
    errorRate: Array<{ timestamp: number; value: number }>;
    throughput: Array<{ timestamp: number; value: number }>;
    cpu: Array<{ timestamp: number; value: number }>;
  };
}

export interface ServiceDependency {
  source: string;
  target: string;
  protocol: string;
  avgLatency: number;
}

export interface ServiceGraph {
  services: ServiceInfo[];
  dependencies: ServiceDependency[];
}
