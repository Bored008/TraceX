import time
from typing import Dict, Optional, List
from enum import Enum
from pydantic import BaseModel

class FaultScenario(str, Enum):
    DB_OVERLOAD = "db_overload"
    AUTH_CRASH = "auth_crash"
    NETWORK_PARTITION = "network_partition"
    MEMORY_LEAK = "memory_leak"
    CDN_SPIKE = "cdn_spike"
    CDN_LATENCY = "cdn_latency"

class FaultState(BaseModel):
    scenario: FaultScenario
    name: str
    description: str
    target_service: str
    started_at: float
    active: bool = True

class FaultInjector:
    def __init__(self):
        self.active_faults: Dict[str, FaultState] = {}
        self.scenarios_info = {
            FaultScenario.DB_OVERLOAD: {
                "name": "Database Connection Pool Exhaustion",
                "target": "postgres-db",
                "description": "Postgres connection pool saturates at 100%, causing query queues and cascading timeouts to Order Service and API Gateway."
            },
            FaultScenario.AUTH_CRASH: {
                "name": "Auth Service Crash",
                "target": "auth-service",
                "description": "Auth service process terminates unexpectedly, rejecting token verification and causing cascading 401/502 errors."
            },
            FaultScenario.NETWORK_PARTITION: {
                "name": "Payment Network Partition",
                "target": "payment-service",
                "description": "Payment gateway socket times out, tripping the Order Service circuit breaker and halting checkout flows."
            },
            FaultScenario.MEMORY_LEAK: {
                "name": "Inventory Memory Leak & GC Thrashing",
                "target": "inventory-service",
                "description": "Unbounded cache growth causes memory to climb to 95%, triggering severe Stop-The-World garbage collection pauses."
            },
            FaultScenario.CDN_SPIKE: {
                "name": "CDN Latency Spike",
                "target": "cdn",
                "description": "Edge routing degradation spikes CDN latency to 800ms, slowing all inbound ingress to API Gateway."
            },
            FaultScenario.CDN_LATENCY: {
                "name": "CDN Latency Spike",
                "target": "cdn",
                "description": "Edge routing degradation spikes CDN latency to 800ms, slowing all inbound ingress to API Gateway."
            }
        }

    def inject(self, scenario_type: str) -> FaultState:
        try:
            scenario = FaultScenario(scenario_type)
        except ValueError:
            raise ValueError(f"Unknown fault scenario: {scenario_type}. Available: {[s.value for s in FaultScenario]}")

        info = self.scenarios_info[scenario]
        fault = FaultState(
            scenario=scenario,
            name=info["name"],
            description=info["description"],
            target_service=info["target"],
            started_at=time.time(),
            active=True
        )
        self.active_faults[scenario.value] = fault
        return fault

    def reset(self):
        self.active_faults.clear()

    def get_active_faults(self) -> List[FaultState]:
        return list(self.active_faults.values())

    def apply_faults(self, service_id: str, elapsed_seconds_by_fault: Dict[str, float], metrics: dict) -> dict:
        """
        Adjusts baseline/current metrics dynamically according to the scenario's time progression.
        """
        for scenario_str, fault in self.active_faults.items():
            t = time.time() - fault.started_at

            # Scenario 1: DB Overload
            if fault.scenario == FaultScenario.DB_OVERLOAD:
                if service_id == "postgres-db":
                    # T+0s: Latency spikes to ~4200ms, errors 30%, CPU 98%
                    factor = min(1.0, t / 3.0)
                    metrics["latency_p50"] += 2500.0 * factor
                    metrics["latency_p95"] += 3800.0 * factor
                    metrics["latency_p99"] += 4500.0 * factor
                    metrics["error_rate"] += 30.0 * factor
                    metrics["cpu_pct"] = min(99.0, metrics["cpu_pct"] + 55.0 * factor)
                    metrics["memory_pct"] = min(95.0, metrics["memory_pct"] + 40.0 * factor)
                    metrics["rps"] = max(10.0, metrics["rps"] * (1.0 - 0.7 * factor))

                elif service_id == "order-service" and t >= 8.0:
                    # T+8s: Order service queries queue up waiting for DB
                    factor = min(1.0, (t - 8.0) / 4.0)
                    metrics["latency_p50"] += 3000.0 * factor
                    metrics["latency_p95"] += 4500.0 * factor
                    metrics["latency_p99"] += 5200.0 * factor
                    metrics["error_rate"] += 22.0 * factor
                    metrics["cpu_pct"] = min(90.0, metrics["cpu_pct"] + 35.0 * factor)
                    metrics["rps"] = max(15.0, metrics["rps"] * (1.0 - 0.6 * factor))

                elif service_id == "api-gateway" and t >= 15.0:
                    # T+15s: Gateway timeouts and returns 504
                    factor = min(1.0, (t - 15.0) / 3.0)
                    metrics["latency_p50"] += 1200.0 * factor
                    metrics["latency_p95"] += 2800.0 * factor
                    metrics["latency_p99"] += 3500.0 * factor
                    metrics["error_rate"] += 25.0 * factor

            # Scenario 2: Auth Crash
            elif fault.scenario == FaultScenario.AUTH_CRASH:
                if service_id == "auth-service":
                    metrics["latency_p50"] = 3000.0
                    metrics["latency_p95"] = 3000.0
                    metrics["latency_p99"] = 3000.0
                    metrics["error_rate"] = 100.0
                    metrics["cpu_pct"] = 0.0
                    metrics["rps"] = 0.0
                elif service_id == "api-gateway" and t >= 3.0:
                    factor = min(1.0, (t - 3.0) / 2.0)
                    metrics["error_rate"] += 65.0 * factor
                    metrics["latency_p95"] += 150.0 * factor
                elif service_id in ["order-service", "inventory-service"] and t >= 5.0:
                    # Traffic starved because requests rejected at gateway
                    factor = min(1.0, (t - 5.0) / 3.0)
                    metrics["rps"] = max(5.0, metrics["rps"] * (1.0 - 0.85 * factor))

            # Scenario 3: Payment Network Partition
            elif fault.scenario == FaultScenario.NETWORK_PARTITION:
                if service_id == "payment-service":
                    metrics["error_rate"] = 100.0
                    metrics["latency_p50"] = 5000.0
                    metrics["latency_p95"] = 5000.0
                    metrics["latency_p99"] = 5000.0
                    metrics["rps"] = 0.0
                elif service_id == "order-service" and t >= 5.0:
                    factor = min(1.0, (t - 5.0) / 3.0)
                    metrics["error_rate"] += 45.0 * factor
                    metrics["latency_p95"] += 1800.0 * factor
                elif service_id == "api-gateway" and t >= 8.0:
                    factor = min(1.0, (t - 8.0) / 3.0)
                    metrics["error_rate"] += 15.0 * factor

            # Scenario 4: Inventory Memory Leak
            elif fault.scenario == FaultScenario.MEMORY_LEAK:
                if service_id == "inventory-service":
                    creep = min(1.0, t / 45.0)
                    metrics["memory_pct"] = min(98.0, 35.0 + 60.0 * creep)
                    if t >= 25.0:
                        gc_spike = min(1.0, (t - 25.0) / 15.0)
                        metrics["latency_p50"] += 800.0 * gc_spike
                        metrics["latency_p95"] += 2200.0 * gc_spike
                        metrics["latency_p99"] += 3500.0 * gc_spike
                        metrics["error_rate"] += 12.0 * gc_spike
                        metrics["cpu_pct"] = min(95.0, metrics["cpu_pct"] + 45.0 * gc_spike)
                elif service_id == "api-gateway" and t >= 35.0:
                    factor = min(1.0, (t - 35.0) / 10.0)
                    metrics["latency_p95"] += 600.0 * factor
                    metrics["error_rate"] += 5.0 * factor

            # Scenario 5: CDN Latency Spike
            elif fault.scenario in [FaultScenario.CDN_SPIKE, FaultScenario.CDN_LATENCY]:
                if service_id == "cdn":
                    factor = min(1.0, t / 3.0)
                    metrics["latency_p50"] += 600.0 * factor
                    metrics["latency_p95"] += 850.0 * factor
                    metrics["latency_p99"] += 1200.0 * factor
                    metrics["error_rate"] += 4.0 * factor
                elif service_id == "api-gateway" and t >= 4.0:
                    factor = min(1.0, (t - 4.0) / 3.0)
                    metrics["latency_p95"] += 700.0 * factor

        return metrics
