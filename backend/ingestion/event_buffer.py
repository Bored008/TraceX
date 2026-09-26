import time
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class BufferedEvent(BaseModel):
    event_type: str  # "metric", "span", "log"
    timestamp: float
    received_at: float
    data: Dict[str, Any]
    is_late: bool = False

class EventBuffer:
    """
    Handles imperfect network data:
    - Buffers incoming events for a grace window (default 5.0s)
    - Orders events chronologically by their event timestamp (resolves out-of-order delivery)
    - Detects severely late-arriving events that arrived past the grace window
    """
    def __init__(self, buffer_seconds: float = 5.0):
        self.buffer_seconds = buffer_seconds
        self.queue: List[BufferedEvent] = []
        self.late_events: List[BufferedEvent] = []

    def push(self, event_type: str, timestamp: float, data: Dict[str, Any]) -> BufferedEvent:
        now = time.time()
        # If timestamp is older than now - buffer_seconds * 2, mark as late
        is_late = (now - timestamp) > (self.buffer_seconds * 2)

        event = BufferedEvent(
            event_type=event_type,
            timestamp=timestamp,
            received_at=now,
            data=data,
            is_late=is_late
        )

        if is_late:
            self.late_events.append(event)
            # keep late events capped
            if len(self.late_events) > 100:
                self.late_events.pop(0)

        self.queue.append(event)
        # Keep queue sorted by origin timestamp
        self.queue.sort(key=lambda e: e.timestamp)
        return event

    def pop_ready(self, watermark: Optional[float] = None) -> List[BufferedEvent]:
        """
        Pops events whose timestamp is older than (current_time - buffer_seconds).
        If watermark is passed, pops events <= watermark.
        """
        now = time.time()
        cutoff = watermark if watermark is not None else (now - self.buffer_seconds)

        ready = []
        remaining = []

        for e in self.queue:
            if e.received_at <= (now - self.buffer_seconds) or e.timestamp <= cutoff:
                ready.append(e)
            else:
                remaining.append(e)

        self.queue = remaining
        return ready

    def flush_all(self) -> List[BufferedEvent]:
        events = list(self.queue)
        self.queue.clear()
        return events
