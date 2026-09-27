import asyncio
import time
import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import socketio

from .config import settings
from .simulator.digital_twin import DigitalTwin
from .simulator.service_graph import SERVICE_DEFINITIONS
from .store.time_series import TimeSeriesStore
from .store.graph_store import GraphStore
from .ingestion.collector import TelemetryCollector
from .analysis.anomaly_detector import AnomalyDetector, AnomalyEvent
from .analysis.rca_engine import MicroRCAEngine, RCAResult
from .analysis.propagation_tracer import PropagationTracer
from .analysis.impact_analyzer import ImpactAnalyzer
from .analysis.explainer import GeminiExplainer
from .api.routes import router, format_service_info
from .api.websocket import (
    sio,
    broadcast_metrics_update,
    broadcast_health_change,
    broadcast_anomaly,
    broadcast_incident,
    broadcast_rca
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("TraceX.Main")

# Global background loop flag
running = True

async def simulation_and_analysis_worker(app: FastAPI):
    """
    Continuous 1-second heartbeat loop driving:
    1. Digital twin state evolution & fault cascade
    2. Telemetry synthesis & sliding window time series ingestion
    3. Dual-tier anomaly detection
    4. MicroRCA root cause localization, propagation tracing, and AI explanation
    5. Real-time Socket.IO broadcasts
    """
    logger.info("Starting simulation & analysis engine worker loop...")
    dt: DigitalTwin = app.state.digital_twin
    ts: TimeSeriesStore = app.state.time_series_store
    collector: TelemetryCollector = app.state.collector
    detector: AnomalyDetector = app.state.anomaly_detector
    rca_engine: MicroRCAEngine = app.state.rca_engine
    tracer: PropagationTracer = app.state.tracer
    impact_analyzer: ImpactAnalyzer = app.state.impact_analyzer
    explainer: GeminiExplainer = app.state.explainer

    last_incident_time = 0.0

    while running:
        try:
            loop_start = time.time()

            # 1. Tick Digital Twin
            batch = dt.tick()

            # 2. Ingest into collector & time series
            collector.ingest_batch(batch)

            # 3. Detect anomalies across all services
            current_anomalies: List[AnomalyEvent] = []
            for svc_id, svc_data in batch.service_metrics.items():
                cur_m = svc_data["current"]
                base_m = svc_data["baseline"]
                anoms = detector.analyze_service(svc_id, cur_m, base_m, batch.timestamp)
                if anoms:
                    current_anomalies.extend(anoms)
                    for anom in anoms:
                        app.state.recent_anomalies.append(anom.model_dump())
                        await broadcast_anomaly(anom.model_dump())

            # Keep bounded anomaly history
            if len(app.state.recent_anomalies) > 300:
                app.state.recent_anomalies = app.state.recent_anomalies[-300:]

            # 4. If anomalies detected, trigger RCA Engine
            if current_anomalies:
                recent_spans = collector.get_recent_spans(limit=100)
                rca_res: RCAResult = rca_engine.find_root_cause(
                    current_anomalies,
                    recent_spans,
                    batch.service_metrics
                )

                if rca_res:
                    # Trace propagation
                    propagation = tracer.trace(
                        rca_res.root_cause_service,
                        current_anomalies,
                        SERVICE_DEFINITIONS
                    )

                    # Assess blast radius & user impact
                    impact = impact_analyzer.assess(
                        rca_res.root_cause_service,
                        rca_res.affected_services,
                        batch.service_metrics
                    )

                    # Rate-limit incident emission to avoid duplicate spam within 3 seconds
                    if (loop_start - last_incident_time) > 3.0:
                        # Generate AI explanation (Gemini or template fallback) in background thread
                        explanation = await asyncio.to_thread(explainer.explain, rca_res, propagation, impact)

                        frontend_prop_path = []
                        for i in range(len(propagation.steps) - 1):
                            s_curr = propagation.steps[i]
                            s_next = propagation.steps[i + 1]
                            frontend_prop_path.append({
                                "from": s_curr.service_id,
                                "to": s_next.service_id,
                                "delay": int(s_next.delay_seconds * 1000),
                                "mechanism": s_next.description
                            })
                        if not frontend_prop_path and propagation.steps:
                            s_curr = propagation.steps[0]
                            frontend_prop_path.append({
                                "from": s_curr.service_id,
                                "to": s_curr.service_id,
                                "delay": 0,
                                "mechanism": s_curr.description
                            })

                        rc_name = SERVICE_DEFINITIONS.get(rca_res.root_cause_service, {}).get("name", rca_res.root_cause_service)

                        secondary_roots = []
                        for sec_id in getattr(rca_res, "secondary_root_causes", []):
                            sec_name = SERVICE_DEFINITIONS.get(sec_id, {}).get("name", sec_id)
                            secondary_roots.append({
                                "serviceId": sec_id,
                                "serviceName": sec_name,
                                "description": f"Concurrent independent failure at {sec_name}"
                            })

                        incident_payload = {
                            "id": f"inc-{int(loop_start)}-{rca_res.root_cause_service}",
                            "timestamp": int(loop_start * 1000),
                            "rootCause": {
                                "serviceId": rca_res.root_cause_service,
                                "serviceName": rc_name,
                                "metric": rca_res.primary_metric,
                                "description": rca_res.summary,
                                "timestamp": int(rca_res.timestamp * 1000),
                                "value": rca_res.anomaly_value,
                                "baseline": rca_res.baseline_value
                            },
                            "secondaryRootCauses": secondary_roots,
                            "secondaryRootCauseIds": getattr(rca_res, "secondary_root_causes", []),
                            "propagationPath": frontend_prop_path,
                            "affectedServices": rca_res.affected_services,
                            "affectedUsers": impact.estimated_affected_users,
                            "confidence": round(rca_res.confidence, 1),
                            "explanation": explanation.summary,
                            "aiExplanation": explanation.causal_chain,
                            "suggestedFix": explanation.suggested_fix,
                            "severity": impact.severity_level,
                            "status": "active",
                            "root_cause": rca_res.model_dump(),
                            "propagation": propagation.model_dump(),
                            "impact": impact.model_dump(),
                            "explanation_details": explanation.model_dump()
                        }

                        app.state.incidents.insert(0, incident_payload)
                        if len(app.state.incidents) > 50:
                            app.state.incidents.pop()
                        last_incident_time = loop_start

                        await broadcast_incident(incident_payload)
                        await broadcast_rca(incident_payload)

            # 5. Broadcast real-time metrics update to dashboard
            formatted_services = [format_service_info(s, ts) for s in dt.get_services_snapshot()]
            await broadcast_metrics_update({
                "timestamp": batch.timestamp,
                "services": formatted_services,
                "raw_metrics": batch.service_metrics
            })

            # Sleep remaining interval to maintain 1-second cadence
            elapsed = time.time() - loop_start
            sleep_duration = max(0.1, settings.SIMULATOR_TICK_SECONDS - elapsed)
            await asyncio.sleep(sleep_duration)

        except asyncio.CancelledError:
            logger.info("Worker loop cancelled.")
            break
        except Exception as e:
            logger.error(f"Error in simulation loop: {e}", exc_info=True)
            await asyncio.sleep(1.0)

@asynccontextmanager
async def lifespan(app: FastAPI):
    global running
    running = True

    # Initialize shared components
    app.state.digital_twin = DigitalTwin()
    app.state.time_series_store = TimeSeriesStore(window_seconds=settings.ROLLING_WINDOW_SECONDS * 2)
    app.state.graph_store = GraphStore()
    app.state.collector = TelemetryCollector(app.state.time_series_store, buffer_seconds=settings.EVENT_BUFFER_SECONDS)
    app.state.anomaly_detector = AnomalyDetector(app.state.time_series_store)
    app.state.rca_engine = MicroRCAEngine(app.state.graph_store)
    app.state.tracer = PropagationTracer(app.state.graph_store)
    app.state.impact_analyzer = ImpactAnalyzer(app.state.graph_store)
    app.state.explainer = GeminiExplainer()

    app.state.recent_anomalies = []
    app.state.incidents = []

    # Warm up initial baseline data
    for _ in range(5):
        b = app.state.digital_twin.tick()
        app.state.collector.ingest_batch(b)

    # Start simulation worker as async task
    task = asyncio.create_task(simulation_and_analysis_worker(app))
    yield
    running = False
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

# FastAPI application instance
fastapi_app = FastAPI(
    title="TraceX - Intelligent Distributed Root Cause Analyzer",
    description="Real-time distributed system telemetry simulation, dual-tier anomaly detection, and MicroRCA diagnostics.",
    version="2.0.0",
    lifespan=lifespan
)

# CORS setup
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include REST routes
fastapi_app.include_router(router)

# Mount Socket.IO ASGI application wrapper
app = socketio.ASGIApp(
    socketio_server=sio,
    other_asgi_app=fastapi_app,
    socketio_path="socket.io"
)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=settings.HOST, port=settings.PORT, reload=True)
