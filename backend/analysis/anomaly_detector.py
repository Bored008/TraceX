import time
import numpy as np
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel, Field
from sklearn.ensemble import IsolationForest

from ..config import settings
from ..store.time_series import TimeSeriesStore

class AnomalySeverity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AnomalyEvent(BaseModel):
    id: str
    service_id: str
    timestamp: float
    metric_name: str
    value: float
    baseline_value: float
    z_score: float
    severity: AnomalySeverity
    isolation_forest_score: float = 0.0
    description: str

class AnomalyDetector:
    def __init__(self, time_series_store: TimeSeriesStore):
        self.ts_store = time_series_store
        self.isolation_models: Dict[str, IsolationForest] = {}
        self.is_trained: Dict[str, bool] = {}
        self.feature_names = ["latency_p50", "latency_p95", "error_rate", "rps", "cpu_pct"]

    def _determine_severity(self, abs_z: float, metric_name: str = "", value: float = 0.0) -> AnomalySeverity:
        if metric_name == "error_rate":
            if value >= 40.0:
                return AnomalySeverity.CRITICAL
            elif value >= 10.0:
                return AnomalySeverity.HIGH
            elif value >= 2.0:
                return AnomalySeverity.MEDIUM
        elif "latency" in metric_name:
            if value >= 2000.0:
                return AnomalySeverity.CRITICAL
            elif value >= 500.0:
                return AnomalySeverity.HIGH
            elif value >= 200.0:
                return AnomalySeverity.MEDIUM

        if abs_z >= 5.0:
            return AnomalySeverity.CRITICAL
        elif abs_z >= 4.0:
            return AnomalySeverity.HIGH
        elif abs_z >= 3.0:
            return AnomalySeverity.MEDIUM
        else:
            return AnomalySeverity.LOW

    def detect_zscore_anomalies(
        self,
        service_id: str,
        current_metrics: Dict[str, float],
        baseline_metrics: Dict[str, float],
        timestamp: float
    ) -> List[AnomalyEvent]:
        anomalies: List[AnomalyEvent] = []

        # 1. Latency check (P99 / P95)
        for metric in ["latency_p99", "latency_p95"]:
            val = current_metrics.get(metric, 0.0)
            base_val = baseline_metrics.get(metric, 10.0)
            mean, std, count = self.ts_store.get_stats(service_id, metric, window_seconds=settings.ROLLING_WINDOW_SECONDS)

            if count >= 5 and std > 0.01:
                z = (val - mean) / std
            else:
                # If insufficient samples or zero std, calculate pseudo-z against baseline
                std_est = max(1.0, base_val * 0.15)
                z = (val - base_val) / std_est

            if z >= settings.Z_LATENCY_THRESHOLD or (base_val > 0 and val >= base_val * 2.5 and val > 50.0):
                severity = self._determine_severity(z, metric, val)
                anomalies.append(AnomalyEvent(
                    id=f"{service_id}-{metric}-{int(timestamp)}",
                    service_id=service_id,
                    timestamp=timestamp,
                    metric_name=metric,
                    value=round(val, 2),
                    baseline_value=round(base_val, 2),
                    z_score=round(z, 2),
                    severity=severity,
                    description=f"{metric} spiked to {val:.1f}ms (baseline: {base_val:.1f}ms, z={z:.2f})"
                ))

        # 2. Error rate check
        err_val = current_metrics.get("error_rate", 0.0)
        base_err = baseline_metrics.get("error_rate", 0.01)
        mean_err, std_err, count_err = self.ts_store.get_stats(service_id, "error_rate", window_seconds=settings.ROLLING_WINDOW_SECONDS)

        if count_err >= 5 and std_err > 0.001:
            z_err = (err_val - mean_err) / std_err
        else:
            std_err_est = max(0.05, base_err * 0.5)
            z_err = (err_val - base_err) / std_err_est

        if (z_err >= settings.Z_ERROR_THRESHOLD and err_val > 0.5) or (err_val >= base_err * settings.ERROR_MULTIPLIER_THRESHOLD and err_val > 1.0):
            severity = self._determine_severity(z_err, "error_rate", err_val)
            anomalies.append(AnomalyEvent(
                id=f"{service_id}-error_rate-{int(timestamp)}",
                service_id=service_id,
                timestamp=timestamp,
                metric_name="error_rate",
                value=round(err_val, 2),
                baseline_value=round(base_err, 2),
                z_score=round(z_err, 2),
                severity=severity,
                description=f"Error rate surged to {err_val:.2f}% (baseline: {base_err:.2f}%, z={z_err:.2f})"
            ))

        # 3. Throughput drop check
        rps_val = current_metrics.get("rps", 0.0)
        base_rps = baseline_metrics.get("rps", 100.0)
        mean_rps, std_rps, count_rps = self.ts_store.get_stats(service_id, "rps", window_seconds=settings.ROLLING_WINDOW_SECONDS)

        if count_rps >= 5 and std_rps > 1.0:
            z_rps = (rps_val - mean_rps) / std_rps
        else:
            z_rps = (rps_val - base_rps) / max(5.0, base_rps * 0.15)

        if z_rps <= settings.Z_RPS_THRESHOLD and rps_val < base_rps * 0.5:
            severity = self._determine_severity(abs(z_rps), "rps", rps_val)
            anomalies.append(AnomalyEvent(
                id=f"{service_id}-rps-{int(timestamp)}",
                service_id=service_id,
                timestamp=timestamp,
                metric_name="rps",
                value=round(rps_val, 2),
                baseline_value=round(base_rps, 2),
                z_score=round(z_rps, 2),
                severity=severity,
                description=f"Throughput plummeted to {rps_val:.1f} rps (baseline: {base_rps:.1f} rps, z={z_rps:.2f})"
            ))

        return anomalies

    def train_isolation_forest(self, service_id: str, baseline_samples: Optional[np.ndarray] = None):
        """Trains an Isolation Forest model using baseline history."""
        if baseline_samples is None:
            baseline_samples = self.ts_store.get_feature_matrix(service_id, self.feature_names)

        if len(baseline_samples) < 10:
            # Not enough data yet
            return

        model = IsolationForest(
            n_estimators=50,
            contamination=0.05,
            random_state=42
        )
        model.fit(baseline_samples)
        self.isolation_models[service_id] = model
        self.is_trained[service_id] = True

    def score_isolation_forest(self, service_id: str, current_metrics: Dict[str, float]) -> float:
        """
        Calculates multivariate anomaly score in [0.0, 1.0].
        Scores > 0.6 indicate multivariate anomalous behavior.
        """
        if not self.is_trained.get(service_id, False):
            # If not yet trained, synthesize baseline matrix and fit
            matrix = self.ts_store.get_feature_matrix(service_id, self.feature_names)
            if len(matrix) >= 10:
                self.train_isolation_forest(service_id, matrix)
            else:
                return 0.0

        model = self.isolation_models.get(service_id)
        if not model:
            return 0.0

        sample = np.array([[current_metrics.get(f, 0.0) for f in self.feature_names]])
        # decision_function gives negative for anomalies, positive for inliers
        score = model.decision_function(sample)[0]
        # Normalize into 0..1 where 1 is highest anomaly
        normalized_score = float(np.clip(0.5 - score, 0.0, 1.0))
        return normalized_score

    def analyze_service(
        self,
        service_id: str,
        current_metrics: Dict[str, float],
        baseline_metrics: Dict[str, float],
        timestamp: float
    ) -> List[AnomalyEvent]:
        anomalies = self.detect_zscore_anomalies(service_id, current_metrics, baseline_metrics, timestamp)
        iso_score = self.score_isolation_forest(service_id, current_metrics)

        for a in anomalies:
            a.isolation_forest_score = round(iso_score, 3)

        # If Isolation Forest detects high multivariate anomaly even if single metric didn't cross z-threshold
        if not anomalies and iso_score > 0.75:
            anomalies.append(AnomalyEvent(
                id=f"{service_id}-multivariate-{int(timestamp)}",
                service_id=service_id,
                timestamp=timestamp,
                metric_name="multivariate",
                value=round(iso_score, 2),
                baseline_value=0.1,
                z_score=3.5,
                severity=AnomalySeverity.MEDIUM,
                isolation_forest_score=round(iso_score, 3),
                description=f"Multivariate anomaly detected by Isolation Forest (score: {iso_score:.2f})"
            ))

        return anomalies
