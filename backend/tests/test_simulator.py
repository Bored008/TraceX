import time
import pytest
from backend.simulator.digital_twin import DigitalTwin
from backend.simulator.service_graph import SERVICE_DEFINITIONS, TOPOLOGY_EDGES
from backend.simulator.fault_injector import FaultScenario
from backend.ingestion.event_buffer import EventBuffer

def test_service_topology_and_baseline():
    dt = DigitalTwin()
    assert len(dt.services) == 8
    assert "postgres-db" in dt.services
    assert "api-gateway" in dt.services
    assert "cdn" in dt.services

    # Verify baseline metrics
    db = dt.services["postgres-db"]
    assert db.baseline.latency_p95 == 8.0
    assert db.baseline.error_rate == 0.01

def test_digital_twin_tick():
    dt = DigitalTwin()
    batch = dt.tick()

    assert batch.timestamp > 0
    assert len(batch.service_metrics) == 8
    assert len(batch.spans) > 0
    assert all(svc["health"] == "healthy" for svc in batch.service_metrics.values())

def test_fault_injection_db_overload():
    dt = DigitalTwin()
    fault = dt.inject_fault(FaultScenario.DB_OVERLOAD.value)

    assert fault.scenario == FaultScenario.DB_OVERLOAD
    assert fault.target_service == "postgres-db"

    # Simulate ticks with fault
    time.sleep(0.5)
    batch = dt.tick()

    db_metrics = batch.service_metrics["postgres-db"]["current"]
    assert db_metrics["latency_p99"] > 100.0
    assert db_metrics["error_rate"] > 1.0

def test_fault_reset():
    dt = DigitalTwin()
    dt.inject_fault(FaultScenario.AUTH_CRASH.value)
    dt.reset()

    assert len(dt.fault_injector.get_active_faults()) == 0
    batch = dt.tick()
    assert batch.service_metrics["auth-service"]["health"] == "healthy"

def test_event_buffer_ordering_and_late_detection():
    buf = EventBuffer(buffer_seconds=2.0)
    now = time.time()

    # Push out of order events: T+3, T+1, T+2
    buf.push("metric", now + 3.0, {"val": 3})
    buf.push("metric", now + 1.0, {"val": 1})
    buf.push("metric", now + 2.0, {"val": 2})

    # Push a severely late event (timestamp was 100 seconds ago)
    late_event = buf.push("metric", now - 100.0, {"val": "old"})

    assert late_event.is_late is True
    assert len(buf.late_events) >= 1

    # Queue should be sorted by timestamp
    timestamps = [e.timestamp for e in buf.queue]
    assert timestamps == sorted(timestamps)
