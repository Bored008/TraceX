import { ServiceInfo, RootCauseResult, TimelineEvent, ChaosScenario } from '@/types';
import { SERVICE_CONFIG } from './constants';

// Generate initial healthy services
export function generateInitialServices(): ServiceInfo[] {
  return Object.entries(SERVICE_CONFIG).map(([id, config]) => ({
    id,
    name: config.name,
    type: config.type,
    status: 'healthy' as const,
    metrics: { ...config.baselineMetrics },
    metricsHistory: {
      latency: generateHistory(config.baselineMetrics.latency, 0.1, 60),
      errorRate: generateHistory(config.baselineMetrics.errorRate, 0.2, 60),
      throughput: generateHistory(config.baselineMetrics.throughput, 0.05, 60),
      cpu: generateHistory(config.baselineMetrics.cpu, 0.08, 60),
    },
  }));
}

function generateHistory(baseline: number, variance: number, points: number) {
  const now = Date.now();
  return Array.from({ length: points }, (_, i) => ({
    timestamp: now - (points - i) * 1000,
    value: baseline * (1 + (Math.random() - 0.5) * variance * 2),
  }));
}

// Adds a new data point with noise to all service histories
export function tickServices(services: ServiceInfo[]): ServiceInfo[] {
  const now = Date.now();
  return services.map((service) => {
    const config = SERVICE_CONFIG[service.id];
    if (!config) return service;

    const addNoise = (base: number, variance: number) =>
      base * (1 + (Math.random() - 0.5) * variance * 2);

    // If service is in a fault state, keep its current degraded metrics
    if (service.status !== 'healthy') {
      const newMetrics = { ...service.metrics };
      return {
        ...service,
        metrics: newMetrics,
        metricsHistory: {
          latency: [...service.metricsHistory.latency.slice(-59), { timestamp: now, value: newMetrics.latency }],
          errorRate: [...service.metricsHistory.errorRate.slice(-59), { timestamp: now, value: newMetrics.errorRate }],
          throughput: [...service.metricsHistory.throughput.slice(-59), { timestamp: now, value: newMetrics.throughput }],
          cpu: [...service.metricsHistory.cpu.slice(-59), { timestamp: now, value: newMetrics.cpu }],
        },
      };
    }

    const newMetrics = {
      latency: addNoise(config.baselineMetrics.latency, 0.1),
      errorRate: addNoise(config.baselineMetrics.errorRate, 0.2),
      throughput: addNoise(config.baselineMetrics.throughput, 0.05),
      cpu: addNoise(config.baselineMetrics.cpu, 0.08),
      memory: addNoise(config.baselineMetrics.memory, 0.05),
      connections: addNoise(config.baselineMetrics.connections, 0.05),
    };

    return {
      ...service,
      metrics: newMetrics,
      metricsHistory: {
        latency: [...service.metricsHistory.latency.slice(-59), { timestamp: now, value: newMetrics.latency }],
        errorRate: [...service.metricsHistory.errorRate.slice(-59), { timestamp: now, value: newMetrics.errorRate }],
        throughput: [...service.metricsHistory.throughput.slice(-59), { timestamp: now, value: newMetrics.throughput }],
        cpu: [...service.metricsHistory.cpu.slice(-59), { timestamp: now, value: newMetrics.cpu }],
      },
    };
  });
}

// Simulate fault injection (client-side demo mode)
interface FaultSimulation {
  affectedServices: Map<string, { delay: number; metrics: Partial<ServiceInfo['metrics']>; status: ServiceInfo['status'] }>;
  timeline: TimelineEvent[];
  rcaResult: RootCauseResult;
}

export function simulateFault(scenario: ChaosScenario): FaultSimulation {
  const now = Date.now();

  switch (scenario) {
    case 'db_overload':
      return {
        affectedServices: new Map([
          ['postgres-db', { delay: 0, status: 'critical', metrics: { latency: 4200, errorRate: 30, throughput: 45, cpu: 98, memory: 85, connections: 100 } }],
          ['order-service', { delay: 8000, status: 'critical', metrics: { latency: 5000, errorRate: 25, throughput: 30, cpu: 70, memory: 60, connections: 90 } }],
          ['inventory-service', { delay: 10000, status: 'degraded', metrics: { latency: 1200, errorRate: 15, throughput: 80, cpu: 45, memory: 50, connections: 65 } }],
          ['payment-service', { delay: 12000, status: 'degraded', metrics: { latency: 2000, errorRate: 20, throughput: 40, cpu: 35, memory: 40, connections: 55 } }],
          ['api-gateway', { delay: 15000, status: 'critical', metrics: { latency: 3500, errorRate: 25, throughput: 120, cpu: 80, memory: 55, connections: 180 } }],
        ]),
        timeline: [
          { id: 'e1', timestamp: now, type: 'chaos', serviceId: 'postgres-db', title: 'DB Connection Pool Exhaustion', description: 'Connection pool reached 100% capacity', severity: 'CRITICAL' },
          { id: 'e2', timestamp: now + 5000, type: 'anomaly', serviceId: 'postgres-db', title: 'Anomaly Detected: PostgresDB', description: 'Latency spiked from 8ms to 4,200ms (Z-score: 12.4)', severity: 'CRITICAL' },
          { id: 'e3', timestamp: now + 8000, type: 'anomaly', serviceId: 'order-service', title: 'Anomaly Detected: Order Service', description: 'Latency spiked from 45ms to 5,000ms (Z-score: 8.7)', severity: 'HIGH' },
          { id: 'e4', timestamp: now + 10000, type: 'anomaly', serviceId: 'inventory-service', title: 'Anomaly Detected: Inventory Service', description: 'Error rate increased from 0.1% to 15%', severity: 'MEDIUM' },
          { id: 'e5', timestamp: now + 15000, type: 'anomaly', serviceId: 'api-gateway', title: 'Anomaly Detected: API Gateway', description: 'Error rate spiked to 25%, timeouts detected', severity: 'CRITICAL' },
          { id: 'e6', timestamp: now + 17000, type: 'rca', title: 'Root Cause Identified', description: 'PostgresDB connection pool exhaustion identified as root cause', severity: 'CRITICAL' },
        ],
        rcaResult: {
          id: 'rca-001',
          timestamp: now + 17000,
          rootCause: {
            serviceId: 'postgres-db',
            serviceName: 'PostgresDB',
            metric: 'connections',
            description: 'Connection pool exhaustion',
            timestamp: now,
            value: 100,
            baseline: 50,
          },
          propagationPath: [
            { from: 'postgres-db', to: 'order-service', delay: 8000, mechanism: 'Query timeout' },
            { from: 'postgres-db', to: 'inventory-service', delay: 10000, mechanism: 'Connection refused' },
            { from: 'order-service', to: 'payment-service', delay: 12000, mechanism: 'Upstream timeout' },
            { from: 'order-service', to: 'api-gateway', delay: 15000, mechanism: 'Circuit breaker triggered' },
          ],
          affectedServices: ['postgres-db', 'order-service', 'inventory-service', 'payment-service', 'api-gateway'],
          affectedUsers: 2340,
          confidence: 91,
          explanation: 'The PostgresDB connection pool reached 100% capacity at the start of the incident. This caused Order Service queries to queue, with P99 latency spiking from 45ms to 5,000ms approximately 8 seconds later. The failure then propagated to the API Gateway, which began returning timeout errors to end users.',
          aiExplanation: 'The database connection pool exhaustion was the root cause of this cascading failure. Under sustained checkout load, the PostgresDB connection pool (configured for 100 max connections) became fully saturated. This created a bottleneck where Order Service and Inventory Service queries were forced to wait for available connections, causing their latency to spike dramatically. The Order Service circuit breaker eventually tripped, propagating the failure to the API Gateway.',
          suggestedFix: 'Increase the PostgresDB connection pool size from 100 to 200. Implement connection pooling with PgBouncer. Add query timeout limits (30s) to prevent long-running queries from holding connections. Consider adding Redis caching for frequently accessed data to reduce database load.',
          severity: 'CRITICAL',
        },
      };

    case 'auth_crash':
      return {
        affectedServices: new Map([
          ['auth-service', { delay: 0, status: 'down', metrics: { latency: 0, errorRate: 100, throughput: 0, cpu: 0, memory: 0, connections: 0 } }],
          ['api-gateway', { delay: 3000, status: 'critical', metrics: { latency: 200, errorRate: 85, throughput: 80, cpu: 60, memory: 45, connections: 150 } }],
        ]),
        timeline: [
          { id: 'e1', timestamp: now, type: 'chaos', serviceId: 'auth-service', title: 'Auth Service Crash', description: 'Process terminated unexpectedly', severity: 'CRITICAL' },
          { id: 'e2', timestamp: now + 2000, type: 'anomaly', serviceId: 'auth-service', title: 'Service Down: Auth Service', description: 'No heartbeat detected, all health checks failing', severity: 'CRITICAL' },
          { id: 'e3', timestamp: now + 3000, type: 'anomaly', serviceId: 'api-gateway', title: 'Anomaly: API Gateway', description: 'Authentication failures at 85%, returning 401 errors', severity: 'CRITICAL' },
          { id: 'e4', timestamp: now + 5000, type: 'rca', title: 'Root Cause Identified', description: 'Auth Service crash caused authentication failures', severity: 'CRITICAL' },
        ],
        rcaResult: {
          id: 'rca-002',
          timestamp: now + 5000,
          rootCause: { serviceId: 'auth-service', serviceName: 'Auth Service', metric: 'throughput', description: 'Service crash', timestamp: now, value: 0, baseline: 200 },
          propagationPath: [{ from: 'auth-service', to: 'api-gateway', delay: 3000, mechanism: 'Authentication unavailable' }],
          affectedServices: ['auth-service', 'api-gateway'],
          affectedUsers: 4500,
          confidence: 96,
          explanation: 'Auth Service crashed at the start of the incident, causing all authentication requests to fail. The API Gateway began returning 401 errors for all authenticated endpoints approximately 3 seconds later.',
          aiExplanation: 'The Auth Service process terminated unexpectedly, likely due to an unhandled exception or OOM kill. Since all authenticated requests require token validation through the Auth Service, the API Gateway was unable to process any authenticated requests, resulting in an 85% error rate.',
          suggestedFix: 'Implement automatic restart policies for the Auth Service. Add graceful degradation with cached token validation. Set up health check probes with automatic failover to a standby instance.',
          severity: 'CRITICAL',
        },
      };

    case 'network_partition':
      return {
        affectedServices: new Map([
          ['payment-service', { delay: 0, status: 'down', metrics: { latency: 0, errorRate: 100, throughput: 0, cpu: 5, memory: 30, connections: 0 } }],
          ['order-service', { delay: 5000, status: 'degraded', metrics: { latency: 3000, errorRate: 40, throughput: 60, cpu: 50, memory: 45, connections: 80 } }],
          ['api-gateway', { delay: 10000, status: 'degraded', metrics: { latency: 800, errorRate: 15, throughput: 250, cpu: 45, memory: 40, connections: 160 } }],
        ]),
        timeline: [
          { id: 'e1', timestamp: now, type: 'chaos', serviceId: 'payment-service', title: 'Network Partition', description: 'Payment Service became unreachable', severity: 'CRITICAL' },
          { id: 'e2', timestamp: now + 3000, type: 'anomaly', serviceId: 'payment-service', title: 'Service Unreachable: Payment', description: 'All connection attempts timing out', severity: 'CRITICAL' },
          { id: 'e3', timestamp: now + 5000, type: 'anomaly', serviceId: 'order-service', title: 'Anomaly: Order Service', description: 'Payment calls failing, circuit breaker tripped', severity: 'HIGH' },
          { id: 'e4', timestamp: now + 10000, type: 'anomaly', serviceId: 'api-gateway', title: 'Anomaly: API Gateway', description: 'Order creation endpoints failing at 15%', severity: 'MEDIUM' },
          { id: 'e5', timestamp: now + 12000, type: 'rca', title: 'Root Cause Identified', description: 'Network partition isolated Payment Service', severity: 'CRITICAL' },
        ],
        rcaResult: {
          id: 'rca-003',
          timestamp: now + 12000,
          rootCause: { serviceId: 'payment-service', serviceName: 'Payment Service', metric: 'connections', description: 'Network partition', timestamp: now, value: 0, baseline: 60 },
          propagationPath: [
            { from: 'payment-service', to: 'order-service', delay: 5000, mechanism: 'Connection refused' },
            { from: 'order-service', to: 'api-gateway', delay: 10000, mechanism: 'Upstream error' },
          ],
          affectedServices: ['payment-service', 'order-service', 'api-gateway'],
          affectedUsers: 890,
          confidence: 88,
          explanation: 'Payment Service became unreachable due to a network partition. Order Service payment calls began timing out after 5 seconds, triggering its circuit breaker. This caused order creation failures visible at the API Gateway.',
          suggestedFix: 'Implement retry with exponential backoff for payment calls. Add a fallback queue for payment processing during outages. Deploy payment service across multiple availability zones.',
          severity: 'CRITICAL',
        },
      };

    case 'memory_leak':
      return {
        affectedServices: new Map([
          ['inventory-service', { delay: 0, status: 'degraded', metrics: { latency: 2000, errorRate: 10, throughput: 90, cpu: 80, memory: 95, connections: 60 } }],
          ['api-gateway', { delay: 15000, status: 'degraded', metrics: { latency: 500, errorRate: 5, throughput: 350, cpu: 35, memory: 38, connections: 170 } }],
        ]),
        timeline: [
          { id: 'e1', timestamp: now, type: 'chaos', serviceId: 'inventory-service', title: 'Memory Leak Initiated', description: 'Inventory Service memory usage climbing', severity: 'MEDIUM' },
          { id: 'e2', timestamp: now + 15000, type: 'anomaly', serviceId: 'inventory-service', title: 'Anomaly: Inventory Service', description: 'Memory at 95%, GC pauses causing latency spikes', severity: 'HIGH' },
          { id: 'e3', timestamp: now + 20000, type: 'anomaly', serviceId: 'api-gateway', title: 'Anomaly: API Gateway', description: 'Inventory check latency affecting response times', severity: 'MEDIUM' },
          { id: 'e4', timestamp: now + 22000, type: 'rca', title: 'Root Cause Identified', description: 'Memory leak in Inventory Service', severity: 'HIGH' },
        ],
        rcaResult: {
          id: 'rca-004',
          timestamp: now + 22000,
          rootCause: { serviceId: 'inventory-service', serviceName: 'Inventory Service', metric: 'memory', description: 'Memory leak', timestamp: now, value: 95, baseline: 35 },
          propagationPath: [{ from: 'inventory-service', to: 'api-gateway', delay: 15000, mechanism: 'GC pause latency' }],
          affectedServices: ['inventory-service', 'api-gateway'],
          affectedUsers: 450,
          confidence: 78,
          explanation: 'Inventory Service memory usage steadily climbed to 95%, triggering frequent GC pauses that caused intermittent latency spikes up to 2,000ms.',
          suggestedFix: 'Profile the Inventory Service for memory leaks. Check for unbounded caches or unclosed database connections. Set memory limits with automatic restart.',
          severity: 'HIGH',
        },
      };

    case 'cdn_latency':
      return {
        affectedServices: new Map([
          ['cdn', { delay: 0, status: 'degraded', metrics: { latency: 800, errorRate: 2, throughput: 300, cpu: 15, memory: 25, connections: 45 } }],
          ['api-gateway', { delay: 3000, status: 'degraded', metrics: { latency: 600, errorRate: 3, throughput: 280, cpu: 40, memory: 38, connections: 190 } }],
          ['order-service', { delay: 6000, status: 'degraded', metrics: { latency: 300, errorRate: 2, throughput: 100, cpu: 40, memory: 42, connections: 85 } }],
        ]),
        timeline: [
          { id: 'e1', timestamp: now, type: 'chaos', serviceId: 'cdn', title: 'CDN Latency Spike', description: 'CDN response time increased from 5ms to 800ms', severity: 'MEDIUM' },
          { id: 'e2', timestamp: now + 3000, type: 'anomaly', serviceId: 'cdn', title: 'Anomaly: CDN', description: 'Latency 160x above baseline', severity: 'HIGH' },
          { id: 'e3', timestamp: now + 5000, type: 'anomaly', serviceId: 'api-gateway', title: 'Anomaly: API Gateway', description: 'Increased upstream latency from CDN', severity: 'MEDIUM' },
          { id: 'e4', timestamp: now + 8000, type: 'rca', title: 'Root Cause Identified', description: 'CDN latency spike causing system-wide slowdown', severity: 'HIGH' },
        ],
        rcaResult: {
          id: 'rca-005',
          timestamp: now + 8000,
          rootCause: { serviceId: 'cdn', serviceName: 'CDN', metric: 'latency', description: 'CDN latency spike', timestamp: now, value: 800, baseline: 5 },
          propagationPath: [
            { from: 'cdn', to: 'api-gateway', delay: 3000, mechanism: 'Slow upstream responses' },
            { from: 'api-gateway', to: 'order-service', delay: 6000, mechanism: 'Cascading latency' },
          ],
          affectedServices: ['cdn', 'api-gateway', 'order-service'],
          affectedUsers: 1200,
          confidence: 84,
          explanation: 'CDN latency spiked from 5ms to 800ms, causing all downstream services to experience increased response times.',
          suggestedFix: 'Check CDN provider status. Implement CDN failover to secondary provider. Add cache-control headers to reduce CDN origin requests.',
          severity: 'HIGH',
        },
      };
  }
}
