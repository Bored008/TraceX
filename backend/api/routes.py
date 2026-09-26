import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api")

class ChaosInjectRequest(BaseModel):
    scenario: str

DEPENDENCIES = [
    {"source": "cdn", "target": "api-gateway", "protocol": "HTTPS", "avgLatency": 5},
    {"source": "api-gateway", "target": "auth-service", "protocol": "gRPC", "avgLatency": 15},
    {"source": "api-gateway", "target": "order-service", "protocol": "gRPC", "avgLatency": 20},
    {"source": "api-gateway", "target": "inventory-service", "protocol": "gRPC", "avgLatency": 18},
    {"source": "order-service", "target": "payment-service", "protocol": "gRPC", "avgLatency": 30},
    {"source": "order-service", "target": "postgres-db", "protocol": "TCP", "avgLatency": 8},
    {"source": "order-service", "target": "notification-service", "protocol": "AMQP", "avgLatency": 10},
    {"source": "inventory-service", "target": "postgres-db", "protocol": "TCP", "avgLatency": 8},
    {"source": "payment-service", "target": "postgres-db", "protocol": "TCP", "avgLatency": 8}
]

def format_service_info(service: dict, time_series_store) -> dict:
    svc_id = service["id"]
    cur = service.get("current", {})
    health = service.get("health", "healthy")
    status_map = {"healthy": "healthy", "warning": "degraded", "critical": "critical"}
    status = status_map.get(health, "healthy")

    type_map = {
        "cdn": "cdn",
        "api-gateway": "gateway",
        "auth-service": "auth",
        "order-service": "order",
        "payment-service": "payment",
        "inventory-service": "inventory",
        "notification-service": "notification",
        "postgres-db": "database"
    }

    # Fetch recent sliding-window time series points
    raw_hist = time_series_store.get_history(svc_id, last_seconds=30) if time_series_store else []
    latency_hist = [{"timestamp": int(pt["timestamp"] * 1000), "value": round(pt.get("latency_p95", 10.0), 1)} for pt in raw_hist]
    error_hist = [{"timestamp": int(pt["timestamp"] * 1000), "value": round(pt.get("error_rate", 0.0), 2)} for pt in raw_hist]
    throughput_hist = [{"timestamp": int(pt["timestamp"] * 1000), "value": round(pt.get("rps", 100.0), 1)} for pt in raw_hist]
    cpu_hist = [{"timestamp": int(pt["timestamp"] * 1000), "value": round(pt.get("cpu_pct", 20.0), 1)} for pt in raw_hist]

    return {
        "id": svc_id,
        "name": service.get("name", svc_id),
        "type": type_map.get(svc_id, "gateway"),
        "status": status,
        "health": health,
        "metrics": {
            "latency": round(cur.get("latency_p95", 10.0), 1),
            "errorRate": round(cur.get("error_rate", 0.0), 2),
            "throughput": round(cur.get("rps", 100.0), 1),
            "cpu": round(cur.get("cpu_pct", 20.0), 1),
            "memory": round(cur.get("memory_pct", 30.0), 1),
            "connections": int(cur.get("rps", 100.0) * 0.5)
        },
        "metricsHistory": {
            "latency": latency_hist[-20:] if latency_hist else [{"timestamp": int(time.time() * 1000), "value": round(cur.get("latency_p95", 10.0), 1)}],
            "errorRate": error_hist[-20:] if error_hist else [{"timestamp": int(time.time() * 1000), "value": round(cur.get("error_rate", 0.0), 2)}],
            "throughput": throughput_hist[-20:] if throughput_hist else [{"timestamp": int(time.time() * 1000), "value": round(cur.get("rps", 100.0), 1)}],
            "cpu": cpu_hist[-20:] if cpu_hist else [{"timestamp": int(time.time() * 1000), "value": round(cur.get("cpu_pct", 20.0), 1)}]
        },
        "current": cur,
        "baseline": service.get("baseline", {})
    }

@router.get("/health")
async def health(request: Request):
    app_state = request.app.state
    faults = app_state.digital_twin.fault_injector.get_active_faults()
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "active_faults": [f.model_dump() for f in faults]
    }

@router.get("/services")
async def get_services(request: Request):
    app_state = request.app.state
    raw_services = app_state.digital_twin.get_services_snapshot()
    return [format_service_info(s, app_state.time_series_store) for s in raw_services]

@router.get("/services/{service_id}/metrics")
async def get_service_metrics(
    service_id: str,
    request: Request,
    metric: Optional[str] = Query(None, description="Optional specific metric filter"),
    seconds: int = Query(60, ge=5, le=300, description="Seconds of history")
):
    app_state = request.app.state
    history = app_state.time_series_store.get_history(service_id, metric_name=metric, last_seconds=seconds)
    return {
        "service_id": service_id,
        "history": history
    }

@router.get("/graph")
async def get_graph(request: Request):
    app_state = request.app.state
    raw_services = app_state.digital_twin.get_services_snapshot()
    formatted_services = [format_service_info(s, app_state.time_series_store) for s in raw_services]
    graph_dict = app_state.graph_store.to_dict()

    return {
        "services": formatted_services,
        "dependencies": DEPENDENCIES,
        "nodes": graph_dict["nodes"],
        "edges": graph_dict["edges"]
    }

@router.get("/spans")
async def get_spans(request: Request, limit: int = Query(50, ge=1, le=200)):
    app_state = request.app.state
    spans = app_state.collector.get_recent_spans(limit=limit)
    return [s.model_dump() for s in spans]

@router.get("/logs")
async def get_logs(request: Request, limit: int = Query(50, ge=1, le=200)):
    app_state = request.app.state
    logs = app_state.collector.get_recent_logs(limit=limit)
    return [l.model_dump() for l in logs]

@router.get("/anomalies")
async def get_anomalies(request: Request, limit: int = Query(50, ge=1, le=200)):
    app_state = request.app.state
    return app_state.recent_anomalies[-limit:]

@router.get("/incidents")
async def get_incidents(request: Request):
    app_state = request.app.state
    return app_state.incidents

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str, request: Request):
    app_state = request.app.state
    for inc in app_state.incidents:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")

@router.get("/chaos/scenarios")
async def get_chaos_scenarios(request: Request):
    app_state = request.app.state
    return app_state.digital_twin.fault_injector.scenarios_info

@router.post("/chaos/inject")
async def inject_chaos(req: ChaosInjectRequest, request: Request):
    app_state = request.app.state
    try:
        fault = app_state.digital_twin.inject_fault(req.scenario)
        return {
            "status": "injected",
            "scenario": req.scenario,
            "fault": fault.model_dump()
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/chaos/reset")
async def reset_chaos(request: Request):
    app_state = request.app.state
    app_state.digital_twin.reset()
    app_state.recent_anomalies.clear()
    return {"status": "reset", "message": "All faults cleared and services reset to baseline"}
