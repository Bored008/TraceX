import time
import networkx as nx
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field

from .anomaly_detector import AnomalyEvent
from ..store.graph_store import GraphStore
from ..simulator.telemetry_generator import Span

class RCAResult(BaseModel):
    id: str
    timestamp: float
    root_cause_service: str
    confidence: float  # Percentage (e.g. 91.5)
    primary_metric: str
    anomaly_value: float
    baseline_value: float
    self_time_ms: float
    affected_services: List[str]
    symptom_services: List[str]
    inferred_missing_services: List[str] = Field(default_factory=list)
    secondary_root_causes: List[str] = Field(default_factory=list)
    node_scores: Dict[str, float] = Field(default_factory=dict)
    summary: str

class MicroRCAEngine:
    def __init__(self, graph_store: GraphStore):
        self.graph_store = graph_store

    def compute_self_time_map(self, spans: List[Span]) -> Dict[str, float]:
        """
        Calculates the average self-time per service from recent trace spans.
        SelfTime(u) = Duration(u) - sum(Duration(children))
        """
        if not spans:
            return {}

        # Group spans by trace_id
        traces: Dict[str, List[Span]] = {}
        for s in spans:
            traces.setdefault(s.trace_id, []).append(s)

        service_self_times: Dict[str, List[float]] = {}

        for trace_id, trace_spans in traces.items():
            # Map span_id to child durations
            child_durations: Dict[str, float] = {}
            for s in trace_spans:
                if s.parent_span_id:
                    child_durations[s.parent_span_id] = child_durations.get(s.parent_span_id, 0.0) + s.duration_ms

            for s in trace_spans:
                c_dur = child_durations.get(s.span_id, 0.0)
                self_time = max(0.0, s.duration_ms - c_dur)
                service_self_times.setdefault(s.service_id, []).append(self_time)

        avg_self_times = {}
        for svc_id, times in service_self_times.items():
            avg_self_times[svc_id] = sum(times) / max(1, len(times))

        return avg_self_times

    def find_root_cause(
        self,
        anomalies: List[AnomalyEvent],
        spans: List[Span],
        current_metrics: Dict[str, dict]
    ) -> Optional[RCAResult]:
        if not anomalies:
            return None

        # 1. Group anomalies by service
        anomalies_by_svc: Dict[str, List[AnomalyEvent]] = {}
        for a in anomalies:
            anomalies_by_svc.setdefault(a.service_id, []).append(a)

        anomalous_service_ids = list(anomalies_by_svc.keys())
        if not anomalous_service_ids:
            return None

        # 2. Decompose span self-time
        self_time_map = self.compute_self_time_map(spans)

        # 3. Temporal change-point (earliest anomaly per service)
        earliest_time_per_svc: Dict[str, float] = {}
        for svc, a_list in anomalies_by_svc.items():
            earliest_time_per_svc[svc] = min(a.timestamp for a in a_list)

        min_time = min(earliest_time_per_svc.values())
        max_time = max(earliest_time_per_svc.values())
        time_span = max(0.001, max_time - min_time)

        temporal_priorities: Dict[str, float] = {}
        for svc, t_earliest in earliest_time_per_svc.items():
            temporal_priorities[svc] = 1.0 - ((t_earliest - min_time) / time_span)

        # 4. Check for missing links in imperfect data
        missing_tuples = self.graph_store.infer_missing_links(anomalous_service_ids)
        inferred_missing_services = list(set([m[1] for m in missing_tuples]))

        # 5. Build weighted anomaly graph
        G = nx.DiGraph()
        node_scores: Dict[str, float] = {}

        for svc in anomalous_service_ids:
            svc_anomalies = anomalies_by_svc[svc]
            max_z = max(a.z_score for a in svc_anomalies)
            max_err = max((a.value for a in svc_anomalies if a.metric_name == "error_rate"), default=0.0)
            iso_score = max(a.isolation_forest_score for a in svc_anomalies)
            t_prio = temporal_priorities.get(svc, 0.5)

            # Self-time score: normal self-time is usually < 50ms. High self-time means service is the bottleneck!
            self_time = self_time_map.get(svc, 0.0)
            self_time_score = min(1.0, self_time / 1000.0) if self_time > 0 else (min(1.0, max_z / 10.0))

            # Composite node score:
            # S(u) = 0.4 * SelfTime + 0.3 * ErrorRate + 0.2 * IsolationScore + 0.1 * TemporalPriority
            err_norm = min(1.0, max_err / 50.0)
            score = (
                0.40 * self_time_score +
                0.30 * err_norm +
                0.20 * iso_score +
                0.10 * t_prio
            )
            node_scores[svc] = score
            G.add_node(svc, weight=max(0.01, score))

        # Add edges between anomalous services
        # If A calls B, and both are anomalous:
        # In MicroRCA, edge direction for root cause search flows from caller to callee (or symptom to root)
        for u in anomalous_service_ids:
            for v in anomalous_service_ids:
                if u != v and self.graph_store.graph.has_edge(u, v):
                    # delay between anomalies
                    t_u = earliest_time_per_svc.get(u, min_time)
                    t_v = earliest_time_per_svc.get(v, min_time)
                    delay = max(0.001, abs(t_v - t_u))
                    weight = 1.0 / delay
                    # Edge u -> v (caller to dependency)
                    G.add_edge(u, v, weight=weight)

        # 6. Identify symptom nodes (entrypoints or high error services)
        symptom_nodes = []
        for svc in anomalous_service_ids:
            # Nodes with no incoming edges in the anomaly graph, or top ingress like cdn / api-gateway
            callers_in_anom = [c for c in self.graph_store.get_callers(svc) if c in anomalous_service_ids]
            if not callers_in_anom or svc in ["cdn", "api-gateway"]:
                symptom_nodes.append(svc)

        if not symptom_nodes:
            symptom_nodes = anomalous_service_ids[:1]

        # Personalized PageRank starting from symptom nodes
        personalization = {n: (1.0 if n in symptom_nodes else 0.1) for n in G.nodes()}

        try:
            if len(G.nodes()) > 1 and len(G.edges()) > 0:
                pagerank_scores = nx.pagerank(
                    G,
                    alpha=0.85,
                    personalization=personalization,
                    weight="weight",
                    max_iter=100
                )
            else:
                pagerank_scores = {n: node_scores.get(n, 1.0) for n in G.nodes()}
        except Exception:
            pagerank_scores = {n: node_scores.get(n, 1.0) for n in G.nodes()}

        # Combine PageRank with raw node composite score
        final_scores: Dict[str, float] = {}
        for svc in G.nodes():
            pr = pagerank_scores.get(svc, 0.0)
            raw = node_scores.get(svc, 0.0)
            final_scores[svc] = 0.65 * pr + 0.35 * raw

        # Root cause is service with highest combined score
        root_cause_service = max(final_scores, key=final_scores.get)
        top_score = final_scores[root_cause_service]

        # Detect concurrent independent root causes (multi-crash / compound incidents)
        secondary_root_causes = []
        for svc, score in sorted(final_scores.items(), key=lambda x: x[1], reverse=True):
            if svc != root_cause_service and score >= 0.35 * top_score and node_scores.get(svc, 0.0) >= 0.35:
                # Check if svc is topologically independent (root_cause does not flow into svc)
                if not nx.has_path(self.graph_store.graph, root_cause_service, svc):
                    secondary_root_causes.append(svc)

        # Confidence calculation
        sum_scores = sum(final_scores.values()) or 1.0
        relative_ratio = top_score / sum_scores

        base_confidence = min(98.5, max(75.0, 70.0 + relative_ratio * 40.0 + node_scores[root_cause_service] * 20.0))

        # Penalty if missing links were detected in imperfect data
        if inferred_missing_services:
            base_confidence = max(50.0, base_confidence * (1.0 - 0.12 * len(inferred_missing_services)))

        # Find primary anomalous metric of root cause
        rc_anomalies = anomalies_by_svc[root_cause_service]
        primary_anomaly = max(rc_anomalies, key=lambda a: a.z_score)

        if secondary_root_causes:
            summary = (
                f"Multi-Point Compound Incident: Primary root cause is {root_cause_service} ({base_confidence:.1f}% confidence), "
                f"with concurrent independent failure detected at {', '.join(secondary_root_causes)}."
            )
        else:
            summary = (
                f"Root cause identified as {root_cause_service} with {base_confidence:.1f}% confidence. "
                f"{primary_anomaly.description}."
            )

        return RCAResult(
            id=f"rca-{int(time.time())}-{root_cause_service}",
            timestamp=time.time(),
            root_cause_service=root_cause_service,
            confidence=round(base_confidence, 1),
            primary_metric=primary_anomaly.metric_name,
            anomaly_value=primary_anomaly.value,
            baseline_value=primary_anomaly.baseline_value,
            self_time_ms=round(self_time_map.get(root_cause_service, primary_anomaly.value), 1),
            affected_services=anomalous_service_ids,
            symptom_services=symptom_nodes,
            inferred_missing_services=inferred_missing_services,
            secondary_root_causes=secondary_root_causes,
            node_scores={k: round(v, 4) for k, v in final_scores.items()},
            summary=summary
        )
