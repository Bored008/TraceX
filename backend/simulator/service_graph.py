from typing import List, Dict, Optional
from pydantic import BaseModel, Field

class ServiceMetrics(BaseModel):
    latency_p50: float = Field(..., description="P50 latency in ms")
    latency_p95: float = Field(..., description="P95 latency in ms")
    latency_p99: float = Field(..., description="P99 latency in ms")
    error_rate: float = Field(..., description="Error rate percentage (0.0 to 100.0)")
    rps: float = Field(..., description="Requests per second")
    cpu_pct: float = Field(..., description="CPU utilization percentage (0.0 to 100.0)")
    memory_pct: float = Field(..., description="Memory utilization percentage (0.0 to 100.0)")

class ServiceDefinition(BaseModel):
    id: str
    name: str
    icon: str
    description: str
    baseline: ServiceMetrics
    current: ServiceMetrics
    health: str = "healthy"  # "healthy", "warning", "critical"
    dependencies: List[str] = Field(default_factory=list)

# 8 microservices modeling an e-commerce platform
SERVICE_DEFINITIONS: Dict[str, dict] = {
    "cdn": {
        "id": "cdn",
        "name": "Cloud CDN",
        "icon": "Cloud",
        "description": "Global Content Delivery Network & edge caching",
        "baseline": {
            "latency_p50": 3.0,
            "latency_p95": 5.0,
            "latency_p99": 8.0,
            "error_rate": 0.01,
            "rps": 500.0,
            "cpu_pct": 10.0,
            "memory_pct": 20.0
        },
        "dependencies": ["api-gateway"]
    },
    "api-gateway": {
        "id": "api-gateway",
        "name": "API Gateway",
        "icon": "Network",
        "description": "Reverse proxy, rate limiting, and request routing",
        "baseline": {
            "latency_p50": 10.0,
            "latency_p95": 15.0,
            "latency_p99": 25.0,
            "error_rate": 0.1,
            "rps": 450.0,
            "cpu_pct": 25.0,
            "memory_pct": 30.0
        },
        "dependencies": ["auth-service", "order-service", "inventory-service"]
    },
    "auth-service": {
        "id": "auth-service",
        "name": "Auth Service",
        "icon": "ShieldCheck",
        "description": "JWT validation, OAuth2 tokens, and session store",
        "baseline": {
            "latency_p50": 14.0,
            "latency_p95": 20.0,
            "latency_p99": 35.0,
            "error_rate": 0.05,
            "rps": 200.0,
            "cpu_pct": 15.0,
            "memory_pct": 25.0
        },
        "dependencies": []
    },
    "order-service": {
        "id": "order-service",
        "name": "Order Service",
        "icon": "ShoppingCart",
        "description": "Order processing, checkout workflow, lifecycle",
        "baseline": {
            "latency_p50": 30.0,
            "latency_p95": 45.0,
            "latency_p99": 70.0,
            "error_rate": 0.2,
            "rps": 150.0,
            "cpu_pct": 35.0,
            "memory_pct": 40.0
        },
        "dependencies": ["payment-service", "postgres-db", "notification-service"]
    },
    "payment-service": {
        "id": "payment-service",
        "name": "Payment Service",
        "icon": "CreditCard",
        "description": "Stripe/PayPal processor gateway & billing",
        "baseline": {
            "latency_p50": 55.0,
            "latency_p95": 80.0,
            "latency_p99": 120.0,
            "error_rate": 0.3,
            "rps": 100.0,
            "cpu_pct": 20.0,
            "memory_pct": 30.0
        },
        "dependencies": ["postgres-db"]
    },
    "inventory-service": {
        "id": "inventory-service",
        "name": "Inventory Service",
        "icon": "Package",
        "description": "Stock management, warehouse reservations",
        "baseline": {
            "latency_p50": 20.0,
            "latency_p95": 30.0,
            "latency_p99": 50.0,
            "error_rate": 0.1,
            "rps": 180.0,
            "cpu_pct": 25.0,
            "memory_pct": 35.0
        },
        "dependencies": ["postgres-db"]
    },
    "notification-service": {
        "id": "notification-service",
        "name": "Notification Service",
        "icon": "Bell",
        "description": "Email, SMS, push alerts and dispatch",
        "baseline": {
            "latency_p50": 18.0,
            "latency_p95": 25.0,
            "latency_p99": 40.0,
            "error_rate": 0.05,
            "rps": 120.0,
            "cpu_pct": 10.0,
            "memory_pct": 20.0
        },
        "dependencies": []
    },
    "postgres-db": {
        "id": "postgres-db",
        "name": "PostgresDB",
        "icon": "Database",
        "description": "Primary relational database cluster",
        "baseline": {
            "latency_p50": 5.0,
            "latency_p95": 8.0,
            "latency_p99": 15.0,
            "error_rate": 0.01,
            "rps": 300.0,
            "cpu_pct": 40.0,
            "memory_pct": 50.0
        },
        "dependencies": []
    }
}

# Directed edges representing invocation dependencies
TOPOLOGY_EDGES = [
    {"source": "cdn", "target": "api-gateway"},
    {"source": "api-gateway", "target": "auth-service"},
    {"source": "api-gateway", "target": "order-service"},
    {"source": "api-gateway", "target": "inventory-service"},
    {"source": "order-service", "target": "payment-service"},
    {"source": "order-service", "target": "postgres-db"},
    {"source": "order-service", "target": "notification-service"},
    {"source": "inventory-service", "target": "postgres-db"},
    {"source": "payment-service", "target": "postgres-db"}
]

def get_initial_services() -> Dict[str, ServiceDefinition]:
    services = {}
    for svc_id, data in SERVICE_DEFINITIONS.items():
        base_metrics = ServiceMetrics(**data["baseline"])
        current_metrics = ServiceMetrics(**data["baseline"])
        services[svc_id] = ServiceDefinition(
            id=data["id"],
            name=data["name"],
            icon=data["icon"],
            description=data["description"],
            baseline=base_metrics,
            current=current_metrics,
            health="healthy",
            dependencies=data["dependencies"]
        )
    return services
