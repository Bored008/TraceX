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
import { API_BASE_URL } from '@/lib/constants';

// Whether to explicitly force mock mode
const FORCE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

interface DashboardState {
  services: ServiceInfo[];
  rootCauseResult: RootCauseResult | null;
  timelineEvents: TimelineEvent[];
  selectedServiceId: string | null;
  isBackendConnected: boolean;
  activeScenario: ChaosScenario | null;
  activeScenarios: ChaosScenario[];
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
    activeScenarios: [],
    systemStatus: 'healthy',
  }));

  const faultTimersRef = useRef<NodeJS.Timeout[]>([]);
  const isConnectedRef = useRef(false);
  const sseConnectedRef = useRef(false);
  const socketConnectedRef = useRef(false);
  const healthOkRef = useRef(false);

  // Initialize backend connection, SSE, and Socket.IO listeners
  useEffect(() => {
    if (FORCE_MOCK) return;

    const socket = getSocket();
    let eventSource: EventSource | null = null;

    const updateConnection = (status: { sse?: boolean; socket?: boolean; health?: boolean }) => {
      if (typeof status.sse === 'boolean') sseConnectedRef.current = status.sse;
      if (typeof status.socket === 'boolean') socketConnectedRef.current = status.socket;
      if (typeof status.health === 'boolean') healthOkRef.current = status.health;

      const isConnected = sseConnectedRef.current || socketConnectedRef.current || healthOkRef.current;
      isConnectedRef.current = isConnected;

      setState((prev) => {
        if (prev.isBackendConnected === isConnected) return prev;
        return {
          ...prev,
          isBackendConnected: isConnected,
        };
      });
    };

    const addConnectedTimelineEvent = () => {
      setState((prev) => {
        const hasConnEvent = prev.timelineEvents.some((e) => e.title === 'Backend Connected');
        if (hasConnEvent) return prev;
        return {
          ...prev,
          timelineEvents: [
            ...prev.timelineEvents,
            {
              id: `backend-conn-${Date.now()}`,
              timestamp: Date.now(),
              type: 'info',
              title: 'Backend Connected',
              description: 'Streaming real-time telemetry from Vercel Engine & MicroRCA',
            },
          ],
        };
      });
    };

    // 1. Check backend health via REST (/api/health)
    api
      .healthCheck()
      .then((res) => {
        if (res.status === 'healthy') {
          updateConnection({ health: true });
          addConnectedTimelineEvent();

          // Fetch initial service graph
          return api.getServiceGraph();
        } else {
          updateConnection({ health: false });
        }
      })
      .then((graph) => {
        if (graph && graph.services && graph.services.length > 0) {
          setState((prev) => ({ ...prev, services: graph.services }));
        }
      })
      .catch(() => {
        updateConnection({ health: false });
      });

    // Periodic health check fallback (every 10s)
    const healthInterval = setInterval(() => {
      api
        .healthCheck()
        .then((res) => {
          updateConnection({ health: res.status === 'healthy' });
        })
        .catch(() => {
          updateConnection({ health: false });
        });
    }, 10000);

    const onMetricsUpdate = (data: { timestamp?: number; services: ServiceInfo[] }) => {
      if (data && Array.isArray(data.services) && data.services.length > 0) {
        setState((prev) => {
          const hasUnhealthyService = data.services.some(
            (s) => s.status === 'degraded' || s.status === 'critical' || s.status === 'down'
          );

          if (!hasUnhealthyService && (prev.systemStatus === 'incident' || prev.rootCauseResult !== null)) {
            const recoveryEvent: TimelineEvent = {
              id: `recovery-${Date.now()}`,
              timestamp: Date.now(),
              type: 'recovery',
              title: 'System Recovered & Baseline Restored',
              description: 'All 8 microservices returned to healthy operating baseline. SLA normal.',
            };

            return {
              ...prev,
              services: data.services,
              rootCauseResult: null,
              activeScenario: null,
              activeScenarios: [],
              systemStatus: 'healthy',
              timelineEvents: [...prev.timelineEvents.slice(-40), recoveryEvent],
            };
          }

          return {
            ...prev,
            services: data.services,
          };
        });
      }
    };

    const onAnomalyDetected = (anom: any) => {
      if (!anom) return;
      const event: TimelineEvent = {
        id: anom.id || `anom-${Date.now()}`,
        timestamp: anom.timestamp ? (anom.timestamp > 1e12 ? anom.timestamp : anom.timestamp * 1000) : Date.now(),
        type: 'anomaly',
        serviceId: anom.service_id || anom.serviceId,
        title: `${anom.service_id || anom.serviceId || 'Service'} Anomaly`,
        description: anom.description || `Anomaly detected on ${anom.metric_name || anom.metric || 'telemetry'}`,
        severity: anom.severity || 'HIGH',
      };

      setState((prev) => {
        const exists = prev.timelineEvents.some((e) => e.id === event.id);
        if (exists) return prev;
        return {
          ...prev,
          timelineEvents: [...prev.timelineEvents.slice(-40), event],
        };
      });
    };

    const onRcaCompleted = (incident: any) => {
      if (!incident) return;
      const rcaResult: RootCauseResult = {
        id: incident.id || `inc-${Date.now()}`,
        timestamp: incident.timestamp || Date.now(),
        rootCause: incident.rootCause || {
          serviceId: incident.root_cause_service || incident.serviceId || 'postgres-db',
          serviceName: incident.root_cause_service || incident.serviceName || 'PostgresDB',
          metric: incident.metric || 'latency_p99',
          description: incident.explanation || incident.description || 'Root cause identified',
          timestamp: incident.timestamp || Date.now(),
          value: incident.value || 4000,
          baseline: incident.baseline || 15,
        },
        secondaryRootCauses: incident.secondaryRootCauses || [],
        secondaryRootCauseIds: incident.secondaryRootCauseIds || [],
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
      if (!data || !data.scenario) return;
      setState((prev) => {
        const nextList = prev.activeScenarios.includes(data.scenario)
          ? prev.activeScenarios
          : [...prev.activeScenarios, data.scenario];
        return {
          ...prev,
          activeScenario: data.scenario,
          activeScenarios: nextList,
          systemStatus: 'incident',
        };
      });
    };

    const onChaosUpdated = (data: { activeScenarios: ChaosScenario[] }) => {
      if (!data) return;
      setState((prev) => {
        const nextList = Array.isArray(data.activeScenarios) ? data.activeScenarios : [];
        return {
          ...prev,
          activeScenarios: nextList,
          activeScenario: nextList.length > 0 ? nextList[nextList.length - 1] : null,
          systemStatus: nextList.length > 0 ? 'incident' : (prev.rootCauseResult ? 'incident' : 'healthy'),
        };
      });
    };

    const onChaosReset = () => {
      setState((prev) => {
        const recoveryEvent: TimelineEvent = {
          id: `recovery-${Date.now()}`,
          timestamp: Date.now(),
          type: 'recovery',
          title: 'System Reset / Baseline Restored',
          description: 'All chaos cleared. Normal microservice operation restored.',
        };

        return {
          ...prev,
          rootCauseResult: null,
          activeScenario: null,
          activeScenarios: [],
          systemStatus: 'healthy',
          timelineEvents: [...prev.timelineEvents.slice(-40), recoveryEvent],
        };
      });
    };

    // 2. Server-Sent Events (SSE) Stream at /api/events
    const sseEndpoint = API_BASE_URL ? `${API_BASE_URL}/api/events` : '/api/events';
    if (typeof window !== 'undefined' && typeof EventSource !== 'undefined') {
      try {
        eventSource = new EventSource(sseEndpoint);

        eventSource.onopen = () => {
          updateConnection({ sse: true });
          addConnectedTimelineEvent();
        };

        eventSource.onerror = () => {
          updateConnection({ sse: false });
        };

        eventSource.addEventListener('metrics:update', (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const data = JSON.parse(event.data);
            onMetricsUpdate(data);
          } catch (err) {
            console.error('Error parsing SSE metrics:update:', err);
          }
        });

        eventSource.addEventListener('anomaly:detected', (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const data = JSON.parse(event.data);
            onAnomalyDetected(data);
          } catch (err) {
            console.error('Error parsing SSE anomaly:detected:', err);
          }
        });

        eventSource.addEventListener('rca:completed', (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const data = JSON.parse(event.data);
            onRcaCompleted(data);
          } catch (err) {
            console.error('Error parsing SSE rca:completed:', err);
          }
        });

        eventSource.addEventListener('incident:created', (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const data = JSON.parse(event.data);
            onRcaCompleted(data);
          } catch (err) {
            console.error('Error parsing SSE incident:created:', err);
          }
        });

        eventSource.addEventListener('chaos:injected', (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const data = JSON.parse(event.data);
            onChaosInjected(data);
          } catch (err) {
            console.error('Error parsing SSE chaos:injected:', err);
          }
        });

        eventSource.addEventListener('chaos:updated', (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const data = JSON.parse(event.data);
            onChaosUpdated(data);
          } catch (err) {
            console.error('Error parsing SSE chaos:updated:', err);
          }
        });

        eventSource.addEventListener('chaos:reset', () => {
          try {
            updateConnection({ sse: true });
            onChaosReset();
          } catch (err) {
            console.error('Error handling SSE chaos:reset:', err);
          }
        });

        eventSource.onmessage = (event: MessageEvent) => {
          try {
            updateConnection({ sse: true });
            const parsed = JSON.parse(event.data);
            if (parsed.event && parsed.data) {
              if (parsed.event === 'metrics:update') onMetricsUpdate(parsed.data);
              else if (parsed.event === 'anomaly:detected') onAnomalyDetected(parsed.data);
              else if (parsed.event === 'rca:completed' || parsed.event === 'incident:created') onRcaCompleted(parsed.data);
              else if (parsed.event === 'chaos:injected') onChaosInjected(parsed.data);
              else if (parsed.event === 'chaos:updated') onChaosUpdated(parsed.data);
              else if (parsed.event === 'chaos:reset') onChaosReset();
            } else if (parsed.services && Array.isArray(parsed.services)) {
              onMetricsUpdate(parsed);
            }
          } catch {
            // Heartbeat / unparseable comment
          }
        };
      } catch (err) {
        console.warn('Failed to initialize EventSource:', err);
      }
    }

    // 3. Socket.IO connection (hybrid support)
    try {
      socket.connect();
    } catch {
      // Ignore initial socket connect errors on serverless
    }

    const onConnect = () => {
      updateConnection({ socket: true });
    };

    const onDisconnect = () => {
      updateConnection({ socket: false });
    };

    const onConnectError = () => {
      updateConnection({ socket: false });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('metrics:update', onMetricsUpdate);
    socket.on('anomaly:detected', onAnomalyDetected);
    socket.on('rca:completed', onRcaCompleted);
    socket.on('incident:created', onRcaCompleted);
    socket.on('chaos:injected', onChaosInjected);
    socket.on('chaos:updated', onChaosUpdated);
    socket.on('chaos:reset', onChaosReset);

    return () => {
      clearInterval(healthInterval);
      if (eventSource) {
        eventSource.close();
      }
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('metrics:update', onMetricsUpdate);
      socket.off('anomaly:detected', onAnomalyDetected);
      socket.off('rca:completed', onRcaCompleted);
      socket.off('incident:created', onRcaCompleted);
      socket.off('chaos:injected', onChaosInjected);
      socket.off('chaos:updated', onChaosUpdated);
      socket.off('chaos:reset', onChaosReset);
      try {
        socket.disconnect();
      } catch {
        // Ignore disconnect error
      }
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

  // Inject or toggle fault
  const injectFault = useCallback(
    (scenario: ChaosScenario) => {
      setState((prev) => {
        const isAlreadyActive = prev.activeScenarios.includes(scenario);

        // Always call REST API endpoint (/api/chaos/stop or /api/chaos/inject)
        if (isAlreadyActive) {
          api.stopChaos(scenario).catch((err) => {
            console.error('Failed to stop chaos via backend:', err);
          });
        } else {
          api.injectChaos(scenario).catch((err) => {
            console.error('Failed to inject chaos via backend:', err);
          });
        }

        // If backend connected, update state optimistically
        if (isConnectedRef.current) {
          if (isAlreadyActive) {
            const nextList = prev.activeScenarios.filter((s) => s !== scenario);
            return {
              ...prev,
              activeScenarios: nextList,
              activeScenario: nextList.length > 0 ? nextList[nextList.length - 1] : null,
              systemStatus: nextList.length > 0 ? 'incident' : 'healthy',
              timelineEvents: [
                ...prev.timelineEvents,
                {
                  id: `chaos-stop-${Date.now()}`,
                  timestamp: Date.now(),
                  type: 'info',
                  title: `Fault Deactivated: ${scenario.replace('_', ' ')}`,
                  description: `Removed from active fault cluster. Remaining active: ${nextList.length}`,
                },
              ],
            };
          } else {
            const nextList = [...prev.activeScenarios, scenario];
            return {
              ...prev,
              activeScenarios: nextList,
              activeScenario: scenario,
              systemStatus: 'incident',
              timelineEvents: [
                ...prev.timelineEvents,
                {
                  id: `chaos-${Date.now()}`,
                  timestamp: Date.now(),
                  type: 'chaos',
                  title: `Fault Injected: ${scenario.replace('_', ' ')}`,
                  description: `Added to active fault cluster (${nextList.length} simultaneous faults)`,
                  severity: 'HIGH',
                },
              ],
            };
          }
        }

        // Fallback: local simulation
        if (isAlreadyActive) {
          const nextList = prev.activeScenarios.filter((s) => s !== scenario);
          if (nextList.length === 0) {
            faultTimersRef.current.forEach(clearTimeout);
            faultTimersRef.current = [];
            return {
              ...prev,
              services: generateInitialServices(),
              rootCauseResult: null,
              activeScenario: null,
              activeScenarios: [],
              systemStatus: 'healthy',
              timelineEvents: [
                ...prev.timelineEvents,
                {
                  id: `chaos-stop-${Date.now()}`,
                  timestamp: Date.now(),
                  type: 'recovery',
                  title: 'All Faults Cleared',
                  description: 'Local services restored to safe baseline',
                },
              ],
            };
          }
          const remainingFault = simulateFault(nextList[nextList.length - 1]);
          return {
            ...prev,
            activeScenarios: nextList,
            activeScenario: nextList[nextList.length - 1],
            rootCauseResult: remainingFault.rcaResult,
          };
        }

        const nextList = [...prev.activeScenarios, scenario];
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
          setState((current) => {
            const secondaryRoots = current.activeScenarios
              .filter((s) => s !== scenario)
              .map((s) => ({
                serviceId: s === 'db_overload' ? 'postgres-db' : s === 'auth_crash' ? 'auth-service' : s === 'network_partition' ? 'payment-service' : 'inventory-service',
                serviceName: s === 'db_overload' ? 'PostgresDB' : s === 'auth_crash' ? 'Auth Service' : s === 'network_partition' ? 'Payment Service' : 'Inventory Service',
                description: `Concurrent simulated fault: ${s.replace('_', ' ')}`,
              }));

            const combinedRca: RootCauseResult = {
              ...fault.rcaResult,
              timestamp: Date.now(),
              secondaryRootCauses: secondaryRoots,
              secondaryRootCauseIds: secondaryRoots.map((sr) => sr.serviceId),
            };

            return {
              ...current,
              rootCauseResult: combinedRca,
              timelineEvents: rcaEvent
                ? [...current.timelineEvents, { ...rcaEvent, timestamp: Date.now() }]
                : current.timelineEvents,
            };
          });
        }, maxDelay + 2000);

        faultTimersRef.current.push(rcaTimer);

        const chaosEvent = fault.timeline[0];
        return {
          ...prev,
          activeScenario: scenario,
          activeScenarios: nextList,
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

    // Always call REST reset endpoint (/api/chaos/reset)
    api.resetChaos().catch((err) => {
      console.error('Failed to reset chaos via backend:', err);
    });

    const freshServices = generateInitialServices();

    setState((prev) => ({
      ...prev,
      services: freshServices,
      rootCauseResult: null,
      activeScenario: null,
      activeScenarios: [],
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
    activeScenarios: state.activeScenarios,
    systemStatus: state.systemStatus,
    injectFault,
    resetServices,
    resetSystem: resetServices,
    selectService,
  };
}
