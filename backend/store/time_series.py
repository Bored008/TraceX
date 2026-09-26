import time
import numpy as np
from collections import deque
from typing import Dict, List, Optional, Tuple, Any
from pydantic import BaseModel

class MetricDataPoint(BaseModel):
    timestamp: float
    metrics: Dict[str, float]

class TimeSeriesStore:
    def __init__(self, window_seconds: int = 120):
        self.window_seconds = window_seconds
        # Mapping from service_id to deque of MetricDataPoint
        self.data: Dict[str, deque[MetricDataPoint]] = {}

    def record(self, service_id: str, timestamp: float, metrics: Dict[str, float]):
        if service_id not in self.data:
            self.data[service_id] = deque()

        q = self.data[service_id]
        q.append(MetricDataPoint(timestamp=timestamp, metrics=metrics))

        # Evict older than window_seconds
        cutoff = timestamp - self.window_seconds
        while q and q[0].timestamp < cutoff:
            q.popleft()

    def get_history(self, service_id: str, metric_name: Optional[str] = None, last_seconds: Optional[int] = None) -> List[dict]:
        if service_id not in self.data:
            return []

        q = self.data[service_id]
        if not q:
            return []

        cutoff = (time.time() - last_seconds) if last_seconds else 0.0

        results = []
        for pt in q:
            if pt.timestamp >= cutoff:
                if metric_name:
                    results.append({
                        "timestamp": pt.timestamp,
                        "value": pt.metrics.get(metric_name, 0.0)
                    })
                else:
                    results.append({
                        "timestamp": pt.timestamp,
                        **pt.metrics
                    })
        return results

    def get_stats(self, service_id: str, metric_name: str, window_seconds: Optional[int] = None) -> Tuple[float, float, int]:
        """
        Returns (mean, std_dev, sample_count) for the specified metric in the window.
        """
        if service_id not in self.data:
            return 0.0, 0.0, 0

        q = self.data[service_id]
        if not q:
            return 0.0, 0.0, 0

        now = time.time()
        cutoff = (now - window_seconds) if window_seconds else (now - self.window_seconds)

        values = [pt.metrics[metric_name] for pt in q if pt.timestamp >= cutoff and metric_name in pt.metrics]
        if not values:
            return 0.0, 0.0, 0

        arr = np.array(values, dtype=np.float64)
        mean = float(np.mean(arr))
        std = float(np.std(arr))
        return mean, std, len(values)

    def get_feature_matrix(self, service_id: str, feature_names: List[str]) -> np.ndarray:
        """
        Returns 2D numpy array [n_samples, n_features] for machine learning training/scoring.
        """
        if service_id not in self.data:
            return np.empty((0, len(feature_names)))

        q = self.data[service_id]
        rows = []
        for pt in q:
            row = [pt.metrics.get(f, 0.0) for f in feature_names]
            rows.append(row)

        if not rows:
            return np.empty((0, len(feature_names)))

        return np.array(rows, dtype=np.float64)

    def clear(self):
        self.data.clear()
