import os
import json
import logging
from typing import Dict, Any, Optional
from pydantic import BaseModel
from ..config import settings
from .rca_engine import RCAResult
from .propagation_tracer import PropagationPath
from .impact_analyzer import ImpactAssessment

logger = logging.getLogger("TraceX.Explainer")

class IncidentExplanation(BaseModel):
    summary: str
    causal_chain: str
    suggested_fix: str
    model_used: str

class GeminiExplainer:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
            except Exception as e:
                logger.warning(f"Could not initialize Gemini model: {e}")

    def explain(
        self,
        rca: RCAResult,
        propagation: PropagationPath,
        impact: ImpactAssessment
    ) -> IncidentExplanation:
        if self.model and self.api_key:
            try:
                return self._generate_gemini_explanation(rca, propagation, impact)
            except Exception as e:
                logger.error(f"Gemini API call failed, falling back to template engine: {e}")

        return self._generate_template_explanation(rca, propagation, impact)

    def _generate_gemini_explanation(
        self,
        rca: RCAResult,
        propagation: PropagationPath,
        impact: ImpactAssessment
    ) -> IncidentExplanation:
        prop_str = " -> ".join([s.service_name for s in propagation.steps])
        prompt = f"""You are a distributed systems principal site reliability engineer analyzing a production incident.

Incident Telemetry Context:
- Root Cause Service: {rca.root_cause_service}
- Confidence Score: {rca.confidence}%
- Primary Fault Metric: {rca.primary_metric} reached {rca.anomaly_value} (normal baseline: {rca.baseline_value})
- Self-Time Bottleneck: {rca.self_time_ms}ms
- Propagation Sequence: {prop_str}
- Impact: {impact.affected_services_count} services affected, ~{impact.estimated_affected_users} users impacted
- Inferred Missing Telemetry Links: {', '.join(rca.inferred_missing_services) if rca.inferred_missing_services else 'None'}

Return a valid JSON object with EXACTLY three fields:
1. "summary": A crisp 2-3 sentence executive technical summary explaining what happened and why.
2. "causal_chain": Step-by-step description of how the failure propagated through the dependencies.
3. "suggested_fix": Concrete engineering remediation (e.g. pool sizing, circuit breakers, backpressure, retries).

Respond with ONLY the JSON object."""

        response = self.model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        parsed = json.loads(response.text)
        return IncidentExplanation(
            summary=parsed.get("summary", ""),
            causal_chain=parsed.get("causal_chain", ""),
            suggested_fix=parsed.get("suggested_fix", ""),
            model_used=settings.GEMINI_MODEL
        )

    def _generate_template_explanation(
        self,
        rca: RCAResult,
        propagation: PropagationPath,
        impact: ImpactAssessment
    ) -> IncidentExplanation:
        svc = rca.root_cause_service
        metric = rca.primary_metric
        val = rca.anomaly_value
        base = rca.baseline_value

        prop_str = " ➔ ".join([s.service_name for s in propagation.steps])

        # Tailored knowledge base heuristics for known scenarios
        if "db" in svc or "postgres" in svc:
            summary = (
                f"The database connection pool reached saturation, with latency surging to {val}ms "
                f"(normal baseline: {base}ms). Downstream services accumulated blocked query threads, "
                f"causing cascading queue exhaustion across {impact.affected_services_count} dependent microservices."
            )
            causal_chain = f"{prop_str}. Database queue stall directly induced gateway timeouts and client-facing HTTP 504 errors."
            suggested_fix = "Increase database connection pool capacity, configure query statement timeouts (e.g. 5000ms), and implement circuit breakers on Order Service queries."
        elif "auth" in svc:
            summary = (
                f"The Auth Service encountered process crash and became unresponsive (error rate: {val}%). "
                f"Without valid token verification, incoming traffic at the API Gateway was blocked."
            )
            causal_chain = f"{prop_str}. Failure to decrypt JWT sessions caused immediate 401 Unauthorized responses at the ingress proxy."
            suggested_fix = "Deploy replica instances with auto-scaling, configure fallback read-only session caching via Redis, and tune health check thresholds."
        elif "payment" in svc:
            summary = (
                f"Payment Service suffered a network partition/timeout with external payment gateways, "
                f"spiking error rate to {val}%. Order checkout transactions stalled."
            )
            causal_chain = f"{prop_str}. Outbound payment socket failures tripped the checkout circuit breaker, preventing order completion."
            suggested_fix = "Enable asynchronous checkout with idempotency keys, dead-letter message queues, and fast fallback payment retries."
        elif "inventory" in svc:
            summary = (
                f"Inventory Service suffered severe memory bloat and garbage collection thrashing, "
                f"driving P99 latency to {val}ms."
            )
            causal_chain = f"{prop_str}. Heavy GC pauses delayed stock reservation calls from the API Gateway."
            suggested_fix = "Investigate in-memory LRU cache eviction policies, tune JVM/runtime heap limits, and add asynchronous stock verification."
        else:
            summary = (
                f"{svc} experienced an anomalous {metric} spike to {val} (baseline: {base}), "
                f"affecting ~{impact.estimated_affected_users} users across {impact.affected_services_count} services."
            )
            causal_chain = f"Failure originated in {svc} and propagated along the critical dependency path: {prop_str}."
            suggested_fix = f"Implement request rate-limiting, add timeout hedging, and review health metrics on {svc}."

        return IncidentExplanation(
            summary=summary,
            causal_chain=causal_chain,
            suggested_fix=suggested_fix,
            model_used="Template Engine (Deterministic Fallback)"
        )
