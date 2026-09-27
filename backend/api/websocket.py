import logging
import socketio
from typing import Dict, Any

logger = logging.getLogger("TraceX.WebSocket")

# Async Socket.IO server configured with permissive CORS for dashboard integration
sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*"
)

@sio.event
async def connect(sid, environ):
    logger.info(f"Client connected: {sid}")
    await sio.emit("system:connected", {"status": "connected", "sid": sid}, to=sid)

@sio.event
async def disconnect(sid):
    logger.info(f"Client disconnected: {sid}")

@sio.event
async def ping(sid, data):
    await sio.emit("pong", data, to=sid)

async def broadcast_metrics_update(services_data: Dict[str, Any]):
    await sio.emit("metrics:update", services_data)

async def broadcast_health_change(service_id: str, status: str):
    await sio.emit("service:health", {"serviceId": service_id, "status": status})

async def broadcast_anomaly(anomaly_data: Dict[str, Any]):
    await sio.emit("anomaly:detected", anomaly_data)

async def broadcast_incident(incident_data: Dict[str, Any]):
    await sio.emit("incident:created", incident_data)

async def broadcast_rca(rca_payload: Dict[str, Any]):
    await sio.emit("rca:completed", rca_payload)

async def broadcast_chaos_injected(scenario: str, target: str):
    await sio.emit("chaos:injected", {"scenario": scenario, "target": target})

async def broadcast_chaos_updated(active_scenarios: list):
    await sio.emit("chaos:updated", {"activeScenarios": active_scenarios})

async def broadcast_chaos_reset():
    await sio.emit("chaos:reset", {})
