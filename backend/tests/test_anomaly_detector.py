import time
import numpy as np
import pytest
from backend.store.time_series import TimeSeriesStore
from backend.analysis.anomaly_detector import AnomalyDetector, AnomalySeverity

def test_z_score_latency_anomaly():
    ts = TimeSeriesStore(window_seconds=120)
    detector = AnomalyDetector(ts)
    service_id = "postgres-db"
    now = time.time()

    # Populate 20 normal samples (around 8ms)
    for i in range(20):
        t = now - (20 - i)
        ts.record(service_id, t, {
            "latency_p50": 5.0,
            "latency_p95": 8.0,
            "latency_p99": 12.0,
            "error_rate": 0.01,
            "rps": 300.0,
            "cpu_pct": 40.0,
            "memory_pct": 50.0
        })

    baseline = {"latency_p99": 12.0, "latency_p95": 8.0, "error_rate": 0.01, "rps": 300.0}

    # Spike latency to 3500ms
    anomalous_metrics = {
        "latency_p50": 2000.0,
        "latency_p95": 3000.0,
        "latency_p99": 3500.0,
        "error_rate": 0.01,
        "rps": 300.0,
        "cpu_pct": 95.0,
        "memory_pct": 80.0
    }

    anomalies = detector.detect_zscore_anomalies(service_id, anomalous_metrics, baseline, now)
    assert len(anomalies) > 0

    latency_anom = [a for a in anomalies if "latency" in a.metric_name][0]
    assert latency_anom.z_score >= 3.0
    assert latency_anom.severity in [AnomalySeverity.HIGH, AnomalySeverity.CRITICAL]

def test_error_rate_spike_detection():
    ts = TimeSeriesStore(window_seconds=120)
    detector = AnomalyDetector(ts)
    service_id = "auth-service"
    now = time.time()

    baseline = {"latency_p99": 35.0, "latency_p95": 20.0, "error_rate": 0.05, "rps": 200.0}
    anomalous_metrics = {
        "latency_p50": 15.0,
        "latency_p95": 20.0,
        "latency_p99": 35.0,
        "error_rate": 45.0,
        "rps": 200.0,
        "cpu_pct": 20.0,
        "memory_pct": 30.0
    }

    anomalies = detector.detect_zscore_anomalies(service_id, anomalous_metrics, baseline, now)
    assert any(a.metric_name == "error_rate" for a in anomalies)

def test_isolation_forest_multivariate():
    ts = TimeSeriesStore(window_seconds=120)
    detector = AnomalyDetector(ts)
    service_id = "inventory-service"

    # Generate synthetic training history: normal points
    normal_data = []
    for _ in range(50):
        normal_data.append([
            np.random.normal(20.0, 2.0),
            np.random.normal(30.0, 3.0),
            0.1,
            np.random.normal(180.0, 10.0),
            np.random.normal(25.0, 3.0)
        ])
    detector.train_isolation_forest(service_id, np.array(normal_data))

    # Test normal sample
    normal_score = detector.score_isolation_forest(service_id, {
        "latency_p50": 20.0,
        "latency_p95": 30.0,
        "error_rate": 0.1,
        "rps": 180.0,
        "cpu_pct": 25.0
    })

    # Test severe outlier sample
    outlier_score = detector.score_isolation_forest(service_id, {
        "latency_p50": 1500.0,
        "latency_p95": 3500.0,
        "error_rate": 25.0,
        "rps": 15.0,
        "cpu_pct": 98.0
    })

    assert outlier_score > normal_score
