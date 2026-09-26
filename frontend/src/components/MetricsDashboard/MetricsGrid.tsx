'use client';

import React from 'react';
import { Clock, AlertTriangle, Activity, Cpu } from 'lucide-react';
import MetricCard from './MetricCard';
import { ServiceInfo } from '@/types';

interface MetricsGridProps {
  service: ServiceInfo | null;
}

export default function MetricsGrid({ service }: MetricsGridProps) {
  if (!service) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[10rem] rounded-lg border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
        <Activity className="w-6 h-6 text-neutral-600 mb-2" />
        <p className="text-neutral-500 text-xs font-mono">
          Click any microservice node in the topology above to inspect live telemetry
        </p>
      </div>
    );
  }

  const { metrics, metricsHistory } = service;

  const latency = metrics?.latency ?? 0;
  const errorRate = metrics?.errorRate ?? 0;
  const throughput = metrics?.throughput ?? 0;
  const cpu = metrics?.cpu ?? 0;

  const latencyStatus = latency > 200 ? 'critical' : 'normal';
  const errorStatus = errorRate > 2 ? 'critical' : 'normal';
  const throughputStatus = throughput < 50 ? 'critical' : 'normal';
  const cpuStatus = cpu > 60 ? 'critical' : 'normal';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
      <MetricCard
        title="P99 Latency"
        value={Math.round(latency)}
        unit="ms"
        status={latencyStatus}
        icon={<Clock className="w-3.5 h-3.5" />}
        data={metricsHistory?.latency || []}
      />
      <MetricCard
        title="Error Rate"
        value={Number(errorRate.toFixed(2))}
        unit="%"
        status={errorStatus}
        icon={<AlertTriangle className="w-3.5 h-3.5" />}
        data={metricsHistory?.errorRate || []}
      />
      <MetricCard
        title="Throughput"
        value={Math.round(throughput)}
        unit="rps"
        status={throughputStatus}
        icon={<Activity className="w-3.5 h-3.5" />}
        data={metricsHistory?.throughput || []}
      />
      <MetricCard
        title="CPU Utilization"
        value={Math.round(cpu)}
        unit="%"
        status={cpuStatus}
        icon={<Cpu className="w-3.5 h-3.5" />}
        data={metricsHistory?.cpu || []}
      />
    </div>
  );
}
