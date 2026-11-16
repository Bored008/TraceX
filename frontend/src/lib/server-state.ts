import {
  ServiceInfo,
  RootCauseResult,
  ChaosScenario,
} from '@/types';
import { SERVICE_CONFIG, SERVICE_DEPENDENCIES } from './constants';
import {
  generateInitialServices,
  tickServices,
  simulateFault,
} from './mock-data';

export type EventListener = (event: string, data: any) => void;

export interface ServerState {
  activeScenarios: ChaosScenario[];
  services: ServiceInfo[];
  incidents: RootCauseResult[];
  recentAnomalies: any[];
  lastTickTime: number;
  subscribers: Set<EventListener>;
}

const globalForServerState = globalThis as unknown as {
  __tracex_server_state__?: ServerState;
};

function initServerState(): ServerState {
  return {
    activeScenarios: [],
    services: generateInitialServices(),
    incidents: [],
    recentAnomalies: [],
    lastTickTime: Date.now(),
    subscribers: new Set(),
  };
}

export function getServerState(): ServerState {
  if (!globalForServerState.__tracex_server_state__) {
    globalForServerState.__tracex_server_state__ = initServerState();
  }
  return globalForServerState.__tracex_server_state__;
}

export function notifySubscribers(event: string, data: any) {
  const state = getServerState();
  state.subscribers.forEach((listener) => {
    try {
      listener(event, data);
    } catch (err) {
      console.error(`[TraceX ServerState] Error in subscriber for ${event}:`, err);
    }
  });
}

export function subscribeEvents(listener: EventListener): () => void {
  const state = getServerState();
  state.subscribers.add(listener);
  return () => {
    state.subscribers.delete(listener);
  };
}

export function getServicesSnapshot(): ServiceInfo[] {
  const state = getServerState();
  return state.services;
}

export function getServiceById(id: string): ServiceInfo | undefined {
  const state = getServerState();
  return state.services.find((s) => s.id === id);
}

export function getActiveScenarios(): ChaosScenario[] {
  const state = getServerState();
  return state.activeScenarios;
}

export function isChaosActive(): boolean {
  const state = getServerState();
  return state.activeScenarios.length > 0;
}

export function getIncidents(): RootCauseResult[] {
  const state = getServerState();
  return state.incidents;
}

export function getIncidentById(id: string): RootCauseResult | undefined {
  const state = getServerState();
  return state.incidents.find((inc) => inc.id === id);
}

export function normalizeScenario(scenario: string): ChaosScenario {
  const map: Record<string, ChaosScenario> = {
    db_overload: 'db_overload',
    auth_crash: 'auth_crash',
    network_partition: 'network_partition',
    payment_crash: 'network_partition',
    memory_leak: 'memory_leak',
    cdn_latency: 'cdn_latency',
    cdn_spike: 'cdn_latency',
  };
  return map[scenario] || (scenario as ChaosScenario);
}

export function getTargetServiceForScenario(scenario: ChaosScenario): string {
  switch (scenario) {
    case 'db_overload':
      return 'postgres-db';
    case 'auth_crash':
      return 'auth-service';
    case 'network_partition':
      return 'payment-service';
    case 'memory_leak':
      return 'inventory-service';
    case 'cdn_latency':
      return 'cdn';
    default:
      return 'postgres-db';
  }
}

export function injectChaosScenario(rawScenario: string) {
  const state = getServerState();
  const normalizedScenario = normalizeScenario(rawScenario);

  if (!state.activeScenarios.includes(normalizedScenario)) {
    state.activeScenarios.push(normalizedScenario);
  }

  const fault = simulateFault(normalizedScenario);
  const now = Date.now();

  // Apply degraded state to affected services
  fault.affectedServices.forEach((effect, serviceId) => {
    state.services = state.services.map((s) => {
      if (s.id === serviceId) {
        return {
          ...s,
          status: effect.status,
          metrics: {
            ...s.metrics,
            ...effect.metrics,
          },
        };
      }
      return s;
    });
  });

  // Calculate secondary roots if concurrent active faults exist
  const secondaryRoots = state.activeScenarios
    .filter((s) => s !== normalizedScenario)
    .map((s) => {
      const targetId = getTargetServiceForScenario(s);
      const targetName = SERVICE_CONFIG[targetId]?.name || targetId;
      return {
        serviceId: targetId,
        serviceName: targetName,
        description: `Concurrent simulated fault: ${s.replace('_', ' ')}`,
      };
    });

  const rcaResult: RootCauseResult = {
    ...fault.rcaResult,
    id: `inc-${now}-${fault.rcaResult.rootCause.serviceId}`,
    timestamp: now,
    secondaryRootCauses: secondaryRoots,
    secondaryRootCauseIds: secondaryRoots.map((sr) => sr.serviceId),
  };

  state.incidents.unshift(rcaResult);
  if (state.incidents.length > 50) {
    state.incidents.pop();
  }

  const anomalies = fault.timeline
    .filter((t) => t.type === 'anomaly')
    .map((t) => ({
      id: t.id || `anom-${now}-${t.serviceId}`,
      timestamp: now,
      service_id: t.serviceId,
      serviceId: t.serviceId,
      metric_name: fault.rcaResult.rootCause.metric,
      description: t.description,
      severity: t.severity || 'HIGH',
    }));

  state.recentAnomalies.push(...anomalies);
  if (state.recentAnomalies.length > 200) {
    state.recentAnomalies = state.recentAnomalies.slice(-200);
  }

  // Real-time broadcast
  notifySubscribers('chaos:injected', {
    scenario: normalizedScenario,
    target: fault.rcaResult.rootCause.serviceId,
  });
  notifySubscribers('chaos:updated', {
    activeScenarios: state.activeScenarios,
  });
  anomalies.forEach((anom) => {
    notifySubscribers('anomaly:detected', anom);
  });
  notifySubscribers('rca:completed', rcaResult);
  notifySubscribers('incident:created', rcaResult);
  notifySubscribers('metrics:update', {
    timestamp: now,
    services: state.services,
  });

  return {
    status: 'injected',
    scenario: normalizedScenario,
    activeScenarios: state.activeScenarios,
    rcaResult,
    affectedServices: rcaResult.affectedServices,
  };
}

export function stopChaosScenario(rawScenario: string) {
  const state = getServerState();
  const normalizedScenario = normalizeScenario(rawScenario);

  state.activeScenarios = state.activeScenarios.filter((s) => s !== normalizedScenario);
  const now = Date.now();

  if (state.activeScenarios.length === 0) {
    state.services = generateInitialServices();
    notifySubscribers('chaos:reset', {});
    notifySubscribers('chaos:updated', { activeScenarios: [] });
    notifySubscribers('metrics:update', { timestamp: now, services: state.services });
  } else {
    state.services = generateInitialServices();
    for (const sc of state.activeScenarios) {
      const f = simulateFault(sc);
      f.affectedServices.forEach((effect, serviceId) => {
        state.services = state.services.map((s) => {
          if (s.id === serviceId) {
            return {
              ...s,
              status: effect.status,
              metrics: { ...s.metrics, ...effect.metrics },
            };
          }
          return s;
        });
      });
    }
    notifySubscribers('chaos:updated', { activeScenarios: state.activeScenarios });
    notifySubscribers('metrics:update', { timestamp: now, services: state.services });
  }

  return {
    status: 'stopped',
    scenario: normalizedScenario,
    activeScenarios: state.activeScenarios,
  };
}

export function resetChaosState() {
  const state = getServerState();
  state.activeScenarios = [];
  state.services = generateInitialServices();
  state.recentAnomalies = [];
  const now = Date.now();

  notifySubscribers('chaos:reset', {});
  notifySubscribers('chaos:updated', { activeScenarios: [] });
  notifySubscribers('metrics:update', { timestamp: now, services: state.services });

  return {
    status: 'reset',
    message: 'All faults cleared and services reset to baseline',
  };
}

export function tickServerState(): ServiceInfo[] {
  const state = getServerState();
  const now = Date.now();

  if (now - state.lastTickTime < 900) {
    return state.services;
  }
  state.lastTickTime = now;

  state.services = tickServices(state.services);

  if (state.activeScenarios.length > 0) {
    for (const sc of state.activeScenarios) {
      const f = simulateFault(sc);
      f.affectedServices.forEach((effect, serviceId) => {
        state.services = state.services.map((s) => {
          if (s.id === serviceId) {
            return {
              ...s,
              status: effect.status,
              metrics: {
                ...s.metrics,
                ...effect.metrics,
              },
            };
          }
          return s;
        });
      });
    }
  }

  notifySubscribers('metrics:update', {
    timestamp: now,
    services: state.services,
  });

  return state.services;
}

export function getServiceHistory(serviceId: string, metric?: string, seconds: number = 60) {
  const state = getServerState();
  const service = state.services.find((s) => s.id === serviceId);
  if (!service) return { service_id: serviceId, history: [] };

  const cutoff = Date.now() - seconds * 1000;

  if (metric && metric in service.metricsHistory) {
    const raw = (service.metricsHistory as any)[metric] || [];
    const filtered = raw.filter((pt: any) => pt.timestamp >= cutoff);
    return {
      service_id: serviceId,
      metric,
      history: filtered,
    };
  }

  const latencyHist = service.metricsHistory.latency.filter((pt) => pt.timestamp >= cutoff);
  const history = latencyHist.map((pt, idx) => ({
    timestamp: pt.timestamp / 1000,
    latency_p95: pt.value,
    error_rate: service.metricsHistory.errorRate[idx]?.value ?? 0,
    rps: service.metricsHistory.throughput[idx]?.value ?? 100,
    cpu_pct: service.metricsHistory.cpu[idx]?.value ?? 20,
  }));

  return {
    service_id: serviceId,
    history,
    metricsHistory: service.metricsHistory,
  };
}

export { SERVICE_CONFIG, SERVICE_DEPENDENCIES };
