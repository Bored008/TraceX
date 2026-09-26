import uuid
import time
import random
from typing import List, Dict, Optional, Tuple
from pydantic import BaseModel, Field

class Span(BaseModel):
    trace_id: str
    span_id: str
    parent_span_id: Optional[str] = None
    service_id: str
    operation: str
    start_time: float
    end_time: float
    duration_ms: float
    status: str = "OK"  # "OK" or "ERROR"
    error_message: Optional[str] = None
    attributes: Dict[str, str] = Field(default_factory=dict)
    self_time_ms: float = 0.0

class LogEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    timestamp: float
    service_id: str
    level: str  # "INFO", "WARN", "ERROR", "CRITICAL"
    message: str
    trace_id: Optional[str] = None
    span_id: Optional[str] = None

class TelemetryBatch(BaseModel):
    timestamp: float
    spans: List[Span]
    logs: List[LogEntry]
    service_metrics: Dict[str, dict]

class TelemetryGenerator:
    def __init__(self):
        pass

    def generate_trace_tree(self, services_state: Dict[str, dict]) -> Tuple[List[Span], List[LogEntry]]:
        """
        Synthesizes a distributed trace traversing the microservice architecture.
        Calculates realistic child and parent timings so that MicroRCA can accurately
        decompose self-time.
        """
        trace_id = uuid.uuid4().hex[:16]
        base_time = time.time()
        spans: List[Span] = []
        logs: List[LogEntry] = []

        # 1. CDN Ingress Span
        cdn_state = services_state.get("cdn", {})
        cdn_cur = cdn_state.get("current", {})
        cdn_err = random.random() * 100.0 < cdn_cur.get("error_rate", 0.01)
        cdn_self = max(1.0, random.gauss(cdn_cur.get("latency_p50", 3.0), 1.0))
        cdn_span_id = uuid.uuid4().hex[:16]

        # 2. API Gateway Span
        gw_state = services_state.get("api-gateway", {})
        gw_cur = gw_state.get("current", {})
        gw_err = random.random() * 100.0 < gw_cur.get("error_rate", 0.1)
        gw_self = max(2.0, random.gauss(gw_cur.get("latency_p50", 10.0), 2.0))
        gw_span_id = uuid.uuid4().hex[:16]

        # 3. Auth Service Span
        auth_state = services_state.get("auth-service", {})
        auth_cur = auth_state.get("current", {})
        auth_err = random.random() * 100.0 < auth_cur.get("error_rate", 0.05)
        auth_self = max(2.0, random.gauss(auth_cur.get("latency_p50", 14.0), 3.0))
        auth_span_id = uuid.uuid4().hex[:16]

        auth_start = base_time + (cdn_self + gw_self) / 1000.0
        auth_span = Span(
            trace_id=trace_id,
            span_id=auth_span_id,
            parent_span_id=gw_span_id,
            service_id="auth-service",
            operation="POST /v1/auth/verify",
            start_time=auth_start,
            end_time=auth_start + auth_self / 1000.0,
            duration_ms=auth_self,
            status="ERROR" if auth_err else "OK",
            error_message="Unauthorized or Connection Refused" if auth_err else None,
            self_time_ms=auth_self
        )
        spans.append(auth_span)

        if auth_err:
            logs.append(LogEntry(
                timestamp=auth_start,
                service_id="auth-service",
                level="ERROR",
                message="Token validation failed or auth daemon unreachable",
                trace_id=trace_id,
                span_id=auth_span_id
            ))

        # Downstream execution if auth passes
        order_duration = 0.0
        if not auth_err:
            # 4. Order Service Span
            order_state = services_state.get("order-service", {})
            order_cur = order_state.get("current", {})
            order_err = random.random() * 100.0 < order_cur.get("error_rate", 0.2)
            order_self = max(5.0, random.gauss(order_cur.get("latency_p50", 25.0), 5.0))
            order_span_id = uuid.uuid4().hex[:16]

            # 5. Postgres DB Span from Order
            db_state = services_state.get("postgres-db", {})
            db_cur = db_state.get("current", {})
            db_err = random.random() * 100.0 < db_cur.get("error_rate", 0.01)
            db_self = max(1.0, random.gauss(db_cur.get("latency_p50", 5.0), 2.0))
            db_span_id = uuid.uuid4().hex[:16]

            # 6. Payment Service Span
            pay_state = services_state.get("payment-service", {})
            pay_cur = pay_state.get("current", {})
            pay_err = random.random() * 100.0 < pay_cur.get("error_rate", 0.3)
            pay_self = max(10.0, random.gauss(pay_cur.get("latency_p50", 50.0), 10.0))
            pay_span_id = uuid.uuid4().hex[:16]

            # DB timing
            db_start = auth_start + (auth_self + order_self) / 1000.0
            db_span = Span(
                trace_id=trace_id,
                span_id=db_span_id,
                parent_span_id=order_span_id,
                service_id="postgres-db",
                operation="SELECT / UPDATE pg_orders",
                start_time=db_start,
                end_time=db_start + db_self / 1000.0,
                duration_ms=db_self,
                status="ERROR" if db_err else "OK",
                error_message="FATAL: remaining connection slots are reserved" if db_err else None,
                self_time_ms=db_self
            )
            spans.append(db_span)

            if db_err:
                logs.append(LogEntry(
                    timestamp=db_start,
                    service_id="postgres-db",
                    level="CRITICAL",
                    message="Connection pool exhausted: active connections 100/100",
                    trace_id=trace_id,
                    span_id=db_span_id
                ))

            # Payment timing
            pay_start = db_start + db_self / 1000.0
            pay_span = Span(
                trace_id=trace_id,
                span_id=pay_span_id,
                parent_span_id=order_span_id,
                service_id="payment-service",
                operation="POST /v1/charge",
                start_time=pay_start,
                end_time=pay_start + pay_self / 1000.0,
                duration_ms=pay_self,
                status="ERROR" if pay_err else "OK",
                error_message="Payment gateway timeout / connection refused" if pay_err else None,
                self_time_ms=pay_self
            )
            spans.append(pay_span)

            if pay_err:
                logs.append(LogEntry(
                    timestamp=pay_start,
                    service_id="payment-service",
                    level="ERROR",
                    message="Upstream payment provider connection failed",
                    trace_id=trace_id,
                    span_id=pay_span_id
                ))

            # Total Order duration = self time + child DB + child Payment
            order_duration = order_self + db_self + pay_self
            order_start = auth_start + auth_self / 1000.0
            order_is_error = order_err or db_err or pay_err
            order_span = Span(
                trace_id=trace_id,
                span_id=order_span_id,
                parent_span_id=gw_span_id,
                service_id="order-service",
                operation="POST /orders/checkout",
                start_time=order_start,
                end_time=order_start + order_duration / 1000.0,
                duration_ms=order_duration,
                status="ERROR" if order_is_error else "OK",
                error_message="Downstream dependency failed" if order_is_error else None,
                self_time_ms=order_self
            )
            spans.append(order_span)

            if order_is_error:
                logs.append(LogEntry(
                    timestamp=order_start + order_duration / 1000.0,
                    service_id="order-service",
                    level="WARN" if not db_err else "ERROR",
                    message=f"Order checkout failed due to {'database bottleneck' if db_err else 'payment failure'}",
                    trace_id=trace_id,
                    span_id=order_span_id
                ))

        # API Gateway total duration = self + auth + order
        gw_duration = gw_self + auth_self + order_duration
        gw_start = base_time + cdn_self / 1000.0
        gw_is_error = gw_err or auth_err or (not auth_err and (spans[-1].status == "ERROR"))
        gw_span = Span(
            trace_id=trace_id,
            span_id=gw_span_id,
            parent_span_id=cdn_span_id,
            service_id="api-gateway",
            operation="POST /api/v1/checkout",
            start_time=gw_start,
            end_time=gw_start + gw_duration / 1000.0,
            duration_ms=gw_duration,
            status="ERROR" if gw_is_error else "OK",
            error_message="Gateway Timeout 504" if gw_is_error else None,
            self_time_ms=gw_self
        )
        spans.append(gw_span)

        # CDN total duration = cdn_self + gw_duration
        cdn_duration = cdn_self + gw_duration
        cdn_is_error = cdn_err or gw_is_error
        cdn_span = Span(
            trace_id=trace_id,
            span_id=cdn_span_id,
            parent_span_id=None,
            service_id="cdn",
            operation="GET /",
            start_time=base_time,
            end_time=base_time + cdn_duration / 1000.0,
            duration_ms=cdn_duration,
            status="ERROR" if cdn_is_error else "OK",
            error_message="Edge Origin Fetch Failed" if cdn_is_error else None,
            self_time_ms=cdn_self
        )
        spans.append(cdn_span)

        return spans, logs
