import time
import pytest
from backend.store.graph_store import GraphStore
from backend.analysis.anomaly_detector import AnomalyEvent, AnomalySeverity
from backend.analysis.rca_engine import MicroRCAEngine
from backend.analysis.propagation_tracer import PropagationTracer
from backend.analysis.impact_analyzer import ImpactAnalyzer
from backend.simulator.telemetry_generator import Span
from backend.simulator.service_graph import SERVICE_DEFINITIONS

def test_self_time_decomposition():
    gs = GraphStore()
    rca = MicroRCAEngine(gs)

    # Order Service (parent) duration: 4200ms
    # PostgresDB (child) duration: 4000ms
    # Order Service self-time should be ~200ms, while PostgresDB self-time should be 4000ms!
    spans = [
        Span(
            trace_id="t1",
            span_id="s_gw",
            parent_span_id=None,
            service_id="api-gateway",
            operation="GET /",
            start_time=100.0,
            end_time=104.3,
            duration_ms=4300.0
        ),
        Span(
            trace_id="t1",
            span_id="s_order",
            parent_span_id="s_gw",
            service_id="order-service",
            operation="POST /order",
            start_time=100.05,
            end_time=104.25,
            duration_ms=4200.0
        ),
        Span(
            trace_id="t1",
            span_id="s_db",
            parent_span_id="s_order",
            service_id="postgres-db",
            operation="SELECT",
            start_time=100.1,
            end_time=104.1,
            duration_ms=4000.0
        )
    ]

    self_time_map = rca.compute_self_time_map(spans)
    assert self_time_map["postgres-db"] >= 3900.0
    assert self_time_map["order-service"] <= 300.0
    assert self_time_map["api-gateway"] <= 200.0

def test_microrca_identifies_db_overload_root_cause():
    gs = GraphStore()
    rca = MicroRCAEngine(gs)
    tracer = PropagationTracer(gs)
    impact_analyzer = ImpactAnalyzer(gs)

    now = time.time()

    # Cascade: DB failed at T+0, Order degraded at T+8, Gateway at T+15
    anomalies = [
        AnomalyEvent(
            id="a1",
            service_id="postgres-db",
            timestamp=now - 15.0,
            metric_name="latency_p99",
            value=4500.0,
            baseline_value=15.0,
            z_score=6.2,
            severity=AnomalySeverity.CRITICAL,
            description="DB latency spike"
        ),
        AnomalyEvent(
            id="a2",
            service_id="order-service",
            timestamp=now - 7.0,
            metric_name="latency_p99",
            value=4800.0,
            baseline_value=70.0,
            z_score=5.1,
            severity=AnomalySeverity.CRITICAL,
            description="Order checkout slow"
        ),
        AnomalyEvent(
            id="a3",
            service_id="api-gateway",
            timestamp=now,
            metric_name="error_rate",
            value=25.0,
            baseline_value=0.1,
            z_score=4.8,
            severity=AnomalySeverity.HIGH,
            description="Gateway 504 timeouts"
        )
    ]

    spans = [
        Span(
            trace_id="t1",
            span_id="s_gw",
            parent_span_id=None,
            service_id="api-gateway",
            operation="GET /",
            start_time=now,
            end_time=now + 4.5,
            duration_ms=4500.0
        ),
        Span(
            trace_id="t1",
            span_id="s_order",
            parent_span_id="s_gw",
            service_id="order-service",
            operation="POST /order",
            start_time=now + 0.1,
            end_time=now + 4.4,
            duration_ms=4300.0
        ),
        Span(
            trace_id="t1",
            span_id="s_db",
            parent_span_id="s_order",
            service_id="postgres-db",
            operation="SELECT",
            start_time=now + 0.2,
            end_time=now + 4.2,
            duration_ms=4000.0
        )
    ]

    metrics = {
        "postgres-db": {"current": {"rps": 50.0, "error_rate": 30.0}},
        "order-service": {"current": {"rps": 60.0, "error_rate": 22.0}},
        "api-gateway": {"current": {"rps": 200.0, "error_rate": 25.0}}
    }

    result = rca.find_root_cause(anomalies, spans, metrics)
    assert result is not None
    assert result.root_cause_service == "postgres-db"
    assert result.confidence >= 80.0

    # Test propagation tracer
    propagation = tracer.trace("postgres-db", anomalies, SERVICE_DEFINITIONS)
    assert propagation.root_cause_service == "postgres-db"
    assert propagation.steps[0].service_id == "postgres-db"
    assert len(propagation.steps) == 3

    # Test impact analyzer
    impact = impact_analyzer.assess(
        "postgres-db",
        ["postgres-db", "order-service", "api-gateway"],
        metrics
    )
    assert impact.affected_services_count == 3
    assert impact.estimated_affected_users > 0
    assert impact.critical_path_disrupted is True

def test_weakly_connected_components_for_concurrent_failures():
    gs = GraphStore()
    # If cdn and auth-service fail independently from postgres-db
    nodes = ["postgres-db", "order-service", "auth-service"]
    components = gs.get_weakly_connected_components(nodes)
    # Since order-service connects to postgres-db, they form one component
    # auth-service is separate within this subset
    assert len(components) == 2
