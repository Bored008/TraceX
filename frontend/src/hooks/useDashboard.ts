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

// Whether to use mock data or connect to backend
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

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
    services: USE_MOCK ? generateInitialServices() : [],
    rootCauseResult: null,
    timelineEvents: USE_MOCK
      ? [
          {
            id: 'init',
            timestamp: Date.now(),
            type: 'info',
            title: 'System Initialized',
            description: 'All 8 services are healthy and operational',
          },
        ]
      : [],
    selectedServiceId: null,
    isBackendConnected: false,
    activeScenario: null,
    systemStatus: 'healthy',
  }));

  const faultTimersRef = useRef<NodeJS.Timeout[]>([]);

  // Initialize backend connection if not in mock mode
  useEffect(() => {
    if (!USE_MOCK) {
      api
        .healthCheck()
        .then(() => {
          setState((prev) => ({ ...prev, isBackendConnected: true }));
          return api.getServiceGraph();
        })
        .then((graph) => {
          setState((prev) => ({ ...prev, services: graph.services }));
        })
        .catch(() => {
          const initialServices = generateInitialServices();
          setState((prev) => ({
            ...prev,
            services: initialServices,
            timelineEvents: [
              {
                id: 'init',
                timestamp: Date.now(),
                type: 'info',
                title: 'Demo Mode',
                description:
                  'Backend not connected. Running with simulated data.',
              },
            ],
          }));
        });
    }
  }, []);

  // Tick metrics every second without recreating the timer
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        if (prev.services.length === 0) return prev;
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

        const fault = simulateFault(scenario);

        // Clear any existing timers
        faultTimersRef.current.forEach(clearTimeout);
        faultTimersRef.current = [];

        // Schedule service degradation based on delays
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

        // Schedule RCA result after all services are affected
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
          description: 'All services restored to healthy state',
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
