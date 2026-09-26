import time
from typing import List, Dict, Any
from pydantic import BaseModel, Field
from ..config import settings
from ..store.graph_store import GraphStore

class ImpactAssessment(BaseModel):
    affected_services_count: int
    total_services_count: int
    blast_radius_pct: float
    estimated_affected_users: int
    estimated_failed_requests_per_sec: float
    severity_level: str  # "LOW", "MODERATE", "SEVERE", "CRITICAL"
    affected_services: List[str]
    unaffected_services: List[str]
    critical_path_disrupted: bool

class ImpactAnalyzer:
    def __init__(self, graph_store: GraphStore):
        self.graph_store = graph_store

    def assess(
        self,
        root_cause_service: str,
        anomalous_services: List[str],
        current_metrics: Dict[str, dict]
    ) -> ImpactAssessment:
        all_nodes = list(self.graph_store.graph.nodes())
        total_count = len(all_nodes) or 8

        # Unique affected services
        affected_set = set(anomalous_services)
        affected_set.add(root_cause_service)
        affected_list = list(affected_set)

        unaffected = [n for n in all_nodes if n not in affected_set]
        blast_radius = round((len(affected_list) / total_count) * 100.0, 1)

        # Estimate affected users and failed requests
        failed_rps = 0.0
        for svc_id in affected_list:
            svc_info = current_metrics.get(svc_id, {})
            current_m = svc_info.get("current", {})
            rps = current_m.get("rps", 100.0)
            err_pct = current_m.get("error_rate", 0.0)
            failed_rps += (rps * (err_pct / 100.0))

        # 1 RPS of failure affects approximately 15 concurrent users
        estimated_users = int(max(failed_rps * settings.BASE_USER_MULTIPLIER, len(affected_list) * 250))

        # Is critical path (cdn -> api-gateway -> order-service -> postgres-db) disrupted?
        crit_nodes = {"cdn", "api-gateway", "order-service", "postgres-db"}
        crit_disrupted = len(crit_nodes.intersection(affected_set)) >= 2

        if blast_radius >= 50.0 or estimated_users > 2000 or "api-gateway" in affected_set:
            severity = "CRITICAL"
        elif blast_radius >= 30.0 or estimated_users > 500:
            severity = "SEVERE"
        elif blast_radius >= 15.0:
            severity = "MODERATE"
        else:
            severity = "LOW"

        return ImpactAssessment(
            affected_services_count=len(affected_list),
            total_services_count=total_count,
            blast_radius_pct=blast_radius,
            estimated_affected_users=estimated_users,
            estimated_failed_requests_per_sec=round(failed_rps, 1),
            severity_level=severity,
            affected_services=affected_list,
            unaffected_services=unaffected,
            critical_path_disrupted=crit_disrupted
        )
