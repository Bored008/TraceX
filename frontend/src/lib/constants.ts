import { ServiceInfo, ServiceDependency } from '@/types';

// Service configuration with icons, colors, and baseline metrics
export const SERVICE_CONFIG: Record<string, {
  name: string;
  type: ServiceInfo['type'];
  icon: string;
  color: string;
  baselineMetrics: {
    latency: number;
    errorRate: number;
    throughput: number;
    cpu: number;
    memory: number;
    connections: number;
  };
}> = {
  cdn: {
    name: 'CDN',
    type: 'cdn',
    icon: '☁️',
    color: '#60a5fa',
    baselineMetrics: { latency: 5, errorRate: 0.01, throughput: 500, cpu: 10, memory: 20, connections: 50 },
  },
  'api-gateway': {
    name: 'API Gateway',
    type: 'gateway',
    icon: '🌐',
    color: '#a78bfa',
    baselineMetrics: { latency: 15, errorRate: 0.1, throughput: 450, cpu: 25, memory: 30, connections: 200 },
  },
  'auth-service': {
    name: 'Auth Service',
    type: 'auth',
    icon: '🔐',
    color: '#34d399',
    baselineMetrics: { latency: 20, errorRate: 0.05, throughput: 200, cpu: 15, memory: 25, connections: 80 },
  },
  'order-service': {
    name: 'Order Service',
    type: 'order',
    icon: '📦',
    color: '#fbbf24',
    baselineMetrics: { latency: 45, errorRate: 0.2, throughput: 150, cpu: 35, memory: 40, connections: 100 },
  },
  'payment-service': {
    name: 'Payment Service',
    type: 'payment',
    icon: '💳',
    color: '#f472b6',
    baselineMetrics: { latency: 80, errorRate: 0.3, throughput: 100, cpu: 20, memory: 30, connections: 60 },
  },
  'inventory-service': {
    name: 'Inventory Service',
    type: 'inventory',
    icon: '📋',
    color: '#fb923c',
    baselineMetrics: { latency: 30, errorRate: 0.1, throughput: 180, cpu: 25, memory: 35, connections: 70 },
  },
  'notification-service': {
    name: 'Notification Service',
    type: 'notification',
    icon: '🔔',
    color: '#22d3ee',
    baselineMetrics: { latency: 25, errorRate: 0.05, throughput: 120, cpu: 10, memory: 20, connections: 40 },
  },
  'postgres-db': {
    name: 'PostgresDB',
    type: 'database',
    icon: '🗄️',
    color: '#4ade80',
    baselineMetrics: { latency: 8, errorRate: 0.01, throughput: 300, cpu: 40, memory: 50, connections: 100 },
  },
};

// Service dependency edges
export const SERVICE_DEPENDENCIES: ServiceDependency[] = [
  { source: 'cdn', target: 'api-gateway', protocol: 'HTTPS', avgLatency: 5 },
  { source: 'api-gateway', target: 'auth-service', protocol: 'gRPC', avgLatency: 15 },
  { source: 'api-gateway', target: 'order-service', protocol: 'gRPC', avgLatency: 20 },
  { source: 'api-gateway', target: 'inventory-service', protocol: 'gRPC', avgLatency: 18 },
  { source: 'order-service', target: 'payment-service', protocol: 'gRPC', avgLatency: 30 },
  { source: 'order-service', target: 'postgres-db', protocol: 'TCP', avgLatency: 8 },
  { source: 'order-service', target: 'notification-service', protocol: 'AMQP', avgLatency: 10 },
  { source: 'inventory-service', target: 'postgres-db', protocol: 'TCP', avgLatency: 8 },
  { source: 'payment-service', target: 'postgres-db', protocol: 'TCP', avgLatency: 8 },
];

// Status colors
export const STATUS_COLORS: Record<string, { bg: string; border: string; text: string; pulse: string }> = {
  healthy: { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-400', pulse: '' },
  degraded: { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-400', pulse: 'animate-pulse' },
  critical: { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-400', pulse: 'animate-pulse' },
  down: { bg: 'bg-red-800/20', border: 'border-red-800', text: 'text-red-300', pulse: 'animate-pulse' },
};

// Severity colors
export const SEVERITY_COLORS: Record<string, string> = {
  LOW: 'text-blue-400',
  MEDIUM: 'text-amber-400',
  HIGH: 'text-orange-400',
  CRITICAL: 'text-red-400',
};

// Chaos scenario descriptions
export const CHAOS_SCENARIOS = [
  {
    id: 'db_overload' as const,
    name: 'Database Overload',
    icon: '💥',
    description: 'Connection pool exhaustion causes cascading failures',
    color: 'from-red-600 to-orange-600',
  },
  {
    id: 'auth_crash' as const,
    name: 'Auth Service Crash',
    icon: '🔐',
    description: 'Auth service dies, all authenticated requests fail',
    color: 'from-purple-600 to-pink-600',
  },
  {
    id: 'network_partition' as const,
    name: 'Network Partition',
    icon: '🌐',
    description: 'Payment service becomes unreachable',
    color: 'from-blue-600 to-cyan-600',
  },
  {
    id: 'memory_leak' as const,
    name: 'Memory Leak',
    icon: '💾',
    description: 'Inventory service OOM with GC pauses',
    color: 'from-amber-600 to-yellow-600',
  },
  {
    id: 'cdn_latency' as const,
    name: 'CDN Latency Spike',
    icon: '☁️',
    description: 'CDN latency spike causes system-wide slowdown',
    color: 'from-teal-600 to-emerald-600',
  },
];

// Backend API URL
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:8000';
