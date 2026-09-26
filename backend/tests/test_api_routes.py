import pytest
from fastapi.testclient import TestClient
from backend.main import fastapi_app

@pytest.fixture
def client():
    with TestClient(fastapi_app) as c:
        yield c

def test_api_health(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data

def test_api_services(client):
    res = client.get("/api/services")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 8
    service_ids = [s["id"] for s in data]
    assert "postgres-db" in service_ids
    assert "order-service" in service_ids

def test_api_graph(client):
    res = client.get("/api/graph")
    assert res.status_code == 200
    data = res.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) == 8
    assert len(data["edges"]) == 9

def test_api_chaos_scenarios_and_injection(client):
    # Check scenarios endpoint
    res = client.get("/api/chaos/scenarios")
    assert res.status_code == 200
    scenarios = res.json()
    assert "db_overload" in scenarios
    assert "auth_crash" in scenarios

    # Inject DB overload
    inject_res = client.post("/api/chaos/inject", json={"scenario": "db_overload"})
    assert inject_res.status_code == 200
    assert inject_res.json()["status"] == "injected"

    # Verify health endpoint reports active fault
    health_res = client.get("/api/health")
    assert len(health_res.json()["active_faults"]) == 1

    # Reset chaos
    reset_res = client.post("/api/chaos/reset")
    assert reset_res.status_code == 200
    assert reset_res.json()["status"] == "reset"

    # Verify cleared
    health_res2 = client.get("/api/health")
    assert len(health_res2.json()["active_faults"]) == 0
