import time
from typing import Dict, Any, List, Optional
from .event_buffer import EventBuffer, BufferedEvent
from ..simulator.telemetry_generator import TelemetryBatch, Span, LogEntry
from ..store.time_series import TimeSeriesStore

class TelemetryCollector:
    def __init__(self, time_series_store: TimeSeriesStore, buffer_seconds: float = 2.0):
        self.ts_store = time_series_store
        self.buffer = EventBuffer(buffer_seconds=buffer_seconds)
        self.all_spans: List[Span] = []
        self.all_logs: List[LogEntry] = []
        self.max_history = 500

    def ingest_batch(self, batch: TelemetryBatch) -> List[BufferedEvent]:
        # Ingest metrics
        for svc_id, svc_data in batch.service_metrics.items():
            current_m = svc_data["current"]
            self.ts_store.record(svc_id, batch.timestamp, current_m)
            self.buffer.push("metric", batch.timestamp, {"service_id": svc_id, "metrics": current_m})

        # Store spans
        for span in batch.spans:
            self.all_spans.append(span)
            self.buffer.push("span", span.start_time, span.model_dump())

        if len(self.all_spans) > self.max_history:
            self.all_spans = self.all_spans[-self.max_history:]

        # Store logs
        for log in batch.logs:
            self.all_logs.append(log)
            self.buffer.push("log", log.timestamp, log.model_dump())

        if len(self.all_logs) > self.max_history:
            self.all_logs = self.all_logs[-self.max_history:]

        return self.buffer.pop_ready()

    def get_recent_spans(self, limit: int = 50) -> List[Span]:
        return self.all_spans[-limit:]

    def get_recent_logs(self, limit: int = 50) -> List[LogEntry]:
        return self.all_logs[-limit:]
