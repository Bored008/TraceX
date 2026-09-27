export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Anomaly {
  id: string;
  timestamp: number;
  serviceId: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  severity: IncidentSeverity;
  zScore: number;
}

export interface PropagationStep {
  from: string;
  to: string;
  delay: number;
  mechanism: string;
}

export interface RootCauseResult {
  id: string;
  timestamp: number;
  rootCause: {
    serviceId: string;
    serviceName: string;
    metric: string;
    description: string;
    timestamp: number;
    value: number;
    baseline: number;
  };
  secondaryRootCauses?: Array<{
    serviceId: string;
    serviceName: string;
    description: string;
  }>;
  secondaryRootCauseIds?: string[];
  propagationPath: PropagationStep[];
  affectedServices: string[];
  affectedUsers: number;
  confidence: number;
  explanation: string;
  aiExplanation?: string;
  suggestedFix?: string;
  severity: IncidentSeverity;
}

export interface TimelineEvent {
  id: string;
  timestamp: number;
  type: 'anomaly' | 'incident' | 'rca' | 'chaos' | 'recovery' | 'info';
  serviceId?: string;
  title: string;
  description: string;
  severity?: IncidentSeverity;
}

export type ChaosScenario = 'db_overload' | 'auth_crash' | 'network_partition' | 'memory_leak' | 'cdn_latency';
