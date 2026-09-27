import time
import random
from typing import Dict, List, Optional, Tuple
from .service_graph import get_initial_services, ServiceDefinition, ServiceMetrics, TOPOLOGY_EDGES
from .fault_injector import FaultInjector, FaultState
from .telemetry_generator import TelemetryGenerator, Span, LogEntry, TelemetryBatch

class DigitalTwin:
    def __init__(self):
        self.services: Dict[str, ServiceDefinition] = get_initial_services()
        self.fault_injector = FaultInjector()
        self.telemetry_generator = TelemetryGenerator()
        self.last_tick = time.time()

    def reset(self):
        self.services = get_initial_services()
        self.fault_injector.reset()

    def inject_fault(self, scenario: str) -> FaultState:
        return self.fault_injector.inject(scenario)

    def remove_fault(self, scenario: str) -> Optional[FaultState]:
        return self.fault_injector.remove_fault(scenario)

    def tick(self) -> TelemetryBatch:
        now = time.time()
        batch_metrics: Dict[str, dict] = {}

        # 1. Update every service's metrics with natural baseline jitter + fault degradation
        for svc_id, service in self.services.items():
            base = service.baseline

            # Natural small jitter (+/- 2-5%)
            jitter_lat = random.uniform(0.95, 1.05)
            jitter_rps = random.uniform(0.97, 1.03)
            jitter_cpu = random.uniform(0.96, 1.04)

            cur_dict = {
                "latency_p50": max(0.5, base.latency_p50 * jitter_lat),
                "latency_p95": max(1.0, base.latency_p95 * jitter_lat),
                "latency_p99": max(1.5, base.latency_p99 * jitter_lat),
                "error_rate": max(0.0, base.error_rate * random.uniform(0.8, 1.2)),
                "rps": max(0.0, base.rps * jitter_rps),
                "cpu_pct": min(100.0, max(1.0, base.cpu_pct * jitter_cpu)),
                "memory_pct": min(100.0, max(1.0, base.memory_pct * jitter_cpu))
            }

            # Apply faults
            cur_dict = self.fault_injector.apply_faults(svc_id, {}, cur_dict)

            # Assign back to service
            service.current = ServiceMetrics(**cur_dict)

            # Determine health
            if service.current.error_rate > 10.0 or service.current.latency_p99 > base.latency_p99 * 4.0:
                service.health = "critical"
            elif service.current.error_rate > 1.5 or service.current.latency_p99 > base.latency_p99 * 2.0 or service.current.cpu_pct > 85.0:
                service.health = "warning"
            else:
                service.health = "healthy"

            batch_metrics[svc_id] = {
                "id": svc_id,
                "name": service.name,
                "health": service.health,
                "current": service.current.model_dump(),
                "baseline": service.baseline.model_dump()
            }

        # 2. Synthesize distributed traces and logs
        services_dict = {k: v.model_dump() for k, v in self.services.items()}
        spans, logs = self.telemetry_generator.generate_trace_tree(services_dict)

        self.last_tick = now
        return TelemetryBatch(
            timestamp=now,
            spans=spans,
            logs=logs,
            service_metrics=batch_metrics
        )

    def get_services_snapshot(self) -> List[dict]:
        return [svc.model_dump() for svc in self.services.values()]

    def get_topology(self) -> dict:
        return {
            "nodes": [svc.model_dump() for svc in self.services.values()],
            "edges": TOPOLOGY_EDGES
        }
