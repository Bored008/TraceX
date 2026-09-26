import time
import networkx as nx
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field
from ..store.graph_store import GraphStore
from .anomaly_detector import AnomalyEvent

class PropagationStep(BaseModel):
    step_number: int
    service_id: str
    service_name: str
    timestamp: float
    delay_seconds: float
    metric_affected: str
    value: float
    severity: str
    status: str  # "root", "propagated", "impacted"
    description: str

class PropagationPath(BaseModel):
    root_cause_service: str
    total_steps: int
    total_propagation_time_seconds: float
    path: List[str]  # e.g. ["postgres-db", "order-service", "api-gateway"]
    steps: List[PropagationStep]

class PropagationTracer:
    def __init__(self, graph_store: GraphStore):
        self.graph_store = graph_store

    def trace(
        self,
        root_cause_id: str,
        anomalies: List[AnomalyEvent],
        service_definitions: Dict[str, Any]
    ) -> PropagationPath:
        # Group anomalies by service and get earliest anomaly
        svc_first_anomaly: Dict[str, AnomalyEvent] = {}
        for a in anomalies:
            if a.service_id not in svc_first_anomaly or a.timestamp < svc_first_anomaly[a.service_id].timestamp:
                svc_first_anomaly[a.service_id] = a

        root_anomaly = svc_first_anomaly.get(root_cause_id)
        root_timestamp = root_anomaly.timestamp if root_anomaly else time.time()

        # Build causal propagation tree starting from root_cause_id
        # We trace callers (upstream services that call root_cause_id and got slowed down)
        steps: List[PropagationStep] = []
        ordered_path: List[str] = [root_cause_id]

        root_name = service_definitions.get(root_cause_id, {}).get("name", root_cause_id)
        steps.append(PropagationStep(
            step_number=1,
            service_id=root_cause_id,
            service_name=root_name,
            timestamp=root_timestamp,
            delay_seconds=0.0,
            metric_affected=root_anomaly.metric_name if root_anomaly else "system",
            value=root_anomaly.value if root_anomaly else 0.0,
            severity=root_anomaly.severity.value if root_anomaly else "CRITICAL",
            status="root",
            description=root_anomaly.description if root_anomaly else "Primary point of failure"
        ))

        # BFS / Dijkstra from root cause upwards through callers that are also anomalous
        visited = {root_cause_id}
        queue = [root_cause_id]
        step_idx = 2

        # Sort remaining anomalous services by timestamp
        other_anomalies = sorted(
            [a for s, a in svc_first_anomaly.items() if s != root_cause_id],
            key=lambda x: x.timestamp
        )

        for anom in other_anomalies:
            svc_id = anom.service_id
            if svc_id in visited:
                continue

            # Verify there is topological connection from or to root cause
            has_connection = (
                nx.has_path(self.graph_store.graph, svc_id, root_cause_id) or
                nx.has_path(self.graph_store.graph, root_cause_id, svc_id)
            )

            if has_connection:
                visited.add(svc_id)
                ordered_path.append(svc_id)
                delay = max(0.0, anom.timestamp - root_timestamp)
                name = service_definitions.get(svc_id, {}).get("name", svc_id)

                steps.append(PropagationStep(
                    step_number=step_idx,
                    service_id=svc_id,
                    service_name=name,
                    timestamp=anom.timestamp,
                    delay_seconds=round(delay, 2),
                    metric_affected=anom.metric_name,
                    value=anom.value,
                    severity=anom.severity.value,
                    status="propagated" if step_idx == 2 else "impacted",
                    description=anom.description
                ))
                step_idx += 1

        total_time = steps[-1].delay_seconds if len(steps) > 1 else 0.0

        return PropagationPath(
            root_cause_service=root_cause_id,
            total_steps=len(steps),
            total_propagation_time_seconds=total_time,
            path=ordered_path,
            steps=steps
        )
