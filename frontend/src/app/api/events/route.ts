import {
  getServicesSnapshot,
  getActiveScenarios,
  getIncidents,
  subscribeEvents,
  tickServerState,
} from '@/lib/server-state';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();
  let intervalId: NodeJS.Timeout | null = null;
  let unsubscribe: (() => void) | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, data: any) => {
        try {
          const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch {
          // Stream controller may be closed
        }
      };

      const sendComment = (comment: string) => {
        try {
          controller.enqueue(encoder.encode(`: ${comment}\n\n`));
        } catch {
          // Ignore
        }
      };

      // Initial connection acknowledgment
      sendComment('connected');

      // Send initial metrics snapshot
      const services = getServicesSnapshot();
      sendEvent('metrics:update', {
        timestamp: Date.now(),
        services,
      });

      // Send active chaos and latest incident if present
      const activeScenarios = getActiveScenarios();
      if (activeScenarios.length > 0) {
        sendEvent('chaos:updated', { activeScenarios });
      }

      const incidents = getIncidents();
      if (incidents.length > 0) {
        sendEvent('rca:completed', incidents[0]);
      }

      // Subscribe to real-time events triggered by API actions (chaos:injected, rca:completed, etc.)
      unsubscribe = subscribeEvents((event, data) => {
        // Avoid sending redundant metrics:update since the periodic interval ticks and streams them below
        if (event === 'metrics:update') return;
        sendEvent(event, data);
      });

      // 1-second cadence tick for metrics evolution and live client streaming
      intervalId = setInterval(() => {
        try {
          const updatedServices = tickServerState();
          sendEvent('metrics:update', {
            timestamp: Date.now(),
            services: updatedServices,
          });
          sendComment('ping');
        } catch (err) {
          console.error('[TraceX SSE] Tick interval error:', err);
        }
      }, 1000);
    },
    cancel() {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (unsubscribe) {
        unsubscribe();
        unsubscribe = null;
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
