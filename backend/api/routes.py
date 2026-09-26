import time
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, Query, Request
from pydantic import BaseModel

router = APIRouter(prefix="/api")

class ChaosInjectRequest(BaseModel):
    scenario: str

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
    return app_state.digital_twin.get_services_snapshot()

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
    return app_state.graph_store.to_dict()

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
