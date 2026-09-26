'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ServiceInfo,
  RootCauseResult,
  TimelineEvent,
  ChaosScenario,
} from '@/types';
import {
  generateInitialServices,
  tickServices,
  simulateFault,
} from '@/lib/mock-data';
import { api } from '@/lib/api';
import { getSocket } from '@/lib/socket';

// Whether to explicitly force mock mode
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface DashboardState {
  services: ServiceInfo[];
  rootCauseResult: RootCauseResult | null;
  timelineEvents: TimelineEvent[];
  selectedServiceId: string | null;
  isBackendConnected: boolean;
  activeScenario: ChaosScenario | null;
  systemStatus: 'healthy' | 'incident';
}

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(() => ({
    services: generateInitialServices(),
    rootCauseResult: null,
    timelineEvents: [
      {
        id: 'init',
        timestamp: Date.now(),
        type: 'info',
        title: 'System Initialized',
        description: 'All 8 services are healthy and operational',
      },
    ],
    selectedServiceId: null,
    isBackendConnected: false,
    activeScenario: null,
    systemStatus: 'healthy',
  }));

  const faultTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isConnectedRef = useRef(false);

  // Initialize backend connection and Socket.IO listeners
  useEffect(() => {
    if (FORCE_MOCK) return;

    const socket = getSocket();

    // Check backend health via REST first
    api
      .healthCheck()
      .then((res) => {
        if (res.status === 'healthy') {
          isConnectedRef.current = true;
          setState((prev) => ({
            ...prev,
            isBackendConnected: true,
            timelineEvents: [
              ...prev.timelineEvents,
              {
                id: `backend-conn-${Date.now()}`,
                timestamp: Date.now(),
                type: 'info',
                title: 'Backend Connected',
                description: 'Streaming real-time telemetry from FastAPI & MicroRCA engine',
              },
            ],
          }));

          // Fetch initial service graph
          return api.getServiceGraph();
        }
      })
      .then((graph) => {
        if (graph && graph.services && graph.services.length > 0) {
          setState((prev) => ({ ...prev, services: graph.services }));
        }
      })
      .catch(() => {
        isConnectedRef.current = false;
        setState((prev) => ({ ...prev, isBackendConnected: false }));
      });

    // Connect socket
    socket.connect();

    const onConnect = () => {
      isConnectedRef.current = true;
      setState((prev) => ({ ...prev, isBackendConnected: true }));
    };

    const onDisconnect = () => {
      isConnectedRef.current = false;
      setState((prev) => ({ ...prev, isBackendConnected: false }));
    };

    const onMetricsUpdate = (data: { timestamp: number; services: ServiceInfo[] }) => {
      if (data && Array.isArray(data.services) && data.services.length > 0) {
        setState((prev) => ({
          ...prev,
          services: data.services,
        }));
      }
    };

    const onAnomalyDetected = (anom: any) => {
      const event: TimelineEvent = {
        id: anom.id || `anom-${Date.now()}`,
        timestamp: anom.timestamp ? anom.timestamp * 1000 : Date.now(),
        type: 'anomaly',
        serviceId: anom.service_id,
        title: `${anom.service_id || 'Service'} Anomaly`,
        description: anom.description || `Anomaly detected on ${anom.metric_name}`,
        severity: anom.severity || 'HIGH',
      };

      setState((prev) => {
        // Prevent duplicate events within short window
        const exists = prev.timelineEvents.some((e) => e.id === event.id);
        if (exists) return prev;
        return {
          ...prev,
          timelineEvents: [...prev.timelineEvents.slice(-40), event],
        };
      });
    };

    const onRcaCompleted = (incident: any) => {
      const rcaResult: RootCauseResult = {
        id: incident.id,
        timestamp: incident.timestamp || Date.now(),
        rootCause: incident.rootCause || {
          serviceId: incident.root_cause_service || 'postgres-db',
          serviceName: incident.root_cause_service || 'PostgresDB',
          metric: 'latency_p99',
          description: incident.explanation || 'Root cause identified',
          timestamp: incident.timestamp || Date.now(),
          value: 4000,
          baseline: 15,
        },
        propagationPath: incident.propagationPath || [],
        affectedServices: incident.affectedServices || [],
        affectedUsers: incident.affectedUsers || 1200,
        confidence: incident.confidence || 90,
        explanation: incident.explanation || '',
        aiExplanation: incident.aiExplanation || incident.explanation || '',
        suggestedFix: incident.suggestedFix || '',
        severity: incident.severity || 'CRITICAL',
      };

      const eventId = `rca-event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timelineEvent: TimelineEvent = {
        id: eventId,
        timestamp: Date.now(),
        type: 'rca',
        serviceId: rcaResult.rootCause.serviceId,
        title: `RCA: ${rcaResult.rootCause.serviceName} (${rcaResult.confidence}% confidence)`,
        description: rcaResult.explanation,
        severity: rcaResult.severity,
      };

      setState((prev) => {
        // Prevent duplicate RCA events within 5 seconds for the same service
        const isDuplicate = prev.timelineEvents.some(
          (e) => e.type === 'rca' && e.serviceId === rcaResult.rootCause.serviceId && (Date.now() - e.timestamp) < 5000
        );
        if (isDuplicate) {
          return {
            ...prev,
            rootCauseResult: rcaResult,
            systemStatus: 'incident',
          };
        }
        return {
          ...prev,
          rootCauseResult: rcaResult,
          systemStatus: 'incident',
          timelineEvents: [...prev.timelineEvents.slice(-40), timelineEvent],
        };
      });
    };

    const onChaosInjected = (data: { scenario: ChaosScenario; target?: string }) => {
      setState((prev) => ({
        ...prev,
        activeScenario: data.scenario,
        systemStatus: 'incident',
      }));
    };

    const onChaosReset = () => {
      setState((prev) => ({
        ...prev,
        rootCauseResult: null,
        activeScenario: null,
        systemStatus: 'healthy',
      }));
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('metrics:update', onMetricsUpdate);
    socket.on('anomaly:detected', onAnomalyDetected);
    socket.on('rca:completed', onRcaCompleted);
    socket.on('incident:created', onRcaCompleted);
    socket.on('chaos:injected', onChaosInjected);
    socket.on('chaos:reset', onChaosReset);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('metrics:update', onMetricsUpdate);
      socket.off('anomaly:detected', onAnomalyDetected);
      socket.off('rca:completed', onRcaCompleted);
      socket.off('incident:created', onRcaCompleted);
      socket.off('chaos:injected', onChaosInjected);
      socket.off('chaos:reset', onChaosReset);
      socket.disconnect();
    };
  }, []);

  // Tick metrics locally only if backend is not connected (standalone fallback mode)
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.isBackendConnected || prev.services.length === 0) return prev;
        return {
          ...prev,
          services: tickServices(prev.services),
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Inject fault
  const injectFault = useCallback(
    (scenario: ChaosScenario) => {
      setState((prev) => {
        if (prev.activeScenario) return prev;

        // If backend connected, call REST API
        if (isConnectedRef.current) {
          api.injectChaos(scenario).catch((err) => {
            console.error('Failed to inject chaos via backend:', err);
          });
          return {
            ...prev,
            activeScenario: scenario,
            systemStatus: 'incident',
            timelineEvents: [
              ...prev.timelineEvents,
              {
                id: `chaos-${Date.now()}`,
                timestamp: Date.now(),
                type: 'chaos',
                title: `Fault Injected: ${scenario}`,
                description: `Live chaos experiment triggered on backend`,
                severity: 'HIGH',
              },
            ],
          };
        }

        // Fallback: local simulation
        const fault = simulateFault(scenario);

        // Clear existing timers
        faultTimersRef.current.forEach(clearTimeout);
        faultTimersRef.current = [];

        fault.affectedServices.forEach((effect, serviceId) => {
          const timer = setTimeout(() => {
            setState((current) => {
              const updatedServices = current.services.map((s) => {
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

              const matchingEvent = fault.timeline.find(
                (e) => e.serviceId === serviceId && e.type === 'anomaly'
              );

              return {
                ...current,
                services: updatedServices,
                timelineEvents: matchingEvent
                  ? [...current.timelineEvents, { ...matchingEvent, timestamp: Date.now() }]
                  : current.timelineEvents,
              };
            });
          }, effect.delay);

          faultTimersRef.current.push(timer);
        });

        const maxDelay = Math.max(
          ...Array.from(fault.affectedServices.values()).map((e) => e.delay)
        );
        const rcaTimer = setTimeout(() => {
          const rcaEvent = fault.timeline.find((e) => e.type === 'rca');
          setState((current) => ({
            ...current,
            rootCauseResult: {
              ...fault.rcaResult,
              timestamp: Date.now(),
            },
            timelineEvents: rcaEvent
              ? [...current.timelineEvents, { ...rcaEvent, timestamp: Date.now() }]
              : current.timelineEvents,
          }));
        }, maxDelay + 2000);

        faultTimersRef.current.push(rcaTimer);

        const chaosEvent = fault.timeline[0];
        return {
          ...prev,
          activeScenario: scenario,
          systemStatus: 'incident',
          timelineEvents: chaosEvent
            ? [...prev.timelineEvents, chaosEvent]
            : prev.timelineEvents,
        };
      });
    },
    []
  );

  // Reset all services
  const resetServices = useCallback(() => {
    faultTimersRef.current.forEach(clearTimeout);
    faultTimersRef.current = [];

    // If backend connected, call REST reset
    if (isConnectedRef.current) {
      api.resetChaos().catch((err) => {
        console.error('Failed to reset chaos via backend:', err);
      });
    }

    const freshServices = generateInitialServices();

    setState((prev) => ({
      ...prev,
      services: freshServices,
      rootCauseResult: null,
      activeScenario: null,
      systemStatus: 'healthy',
      timelineEvents: [
        ...prev.timelineEvents,
        {
          id: `reset-${Date.now()}`,
          timestamp: Date.now(),
          type: 'recovery',
          title: 'System Reset',
          description: 'All services restored to healthy baseline',
        },
      ],
    }));
  }, []);

  // Select a service
  const selectService = useCallback((serviceId: string | null) => {
    setState((prev) => ({ ...prev, selectedServiceId: serviceId }));
  }, []);

  const selectedService =
    state.services.find((s) => s.id === state.selectedServiceId) || null;

  return {
    services: state.services,
    rootCauseResult: state.rootCauseResult,
    timelineEvents: state.timelineEvents,
    selectedService,
    selectedServiceId: state.selectedServiceId,
    isBackendConnected: state.isBackendConnected,
    activeScenario: state.activeScenario,
    systemStatus: state.systemStatus,
    injectFault,
    resetServices,
    selectService,
  };
}
