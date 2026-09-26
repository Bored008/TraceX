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
      <div className="flex flex-col items-center justify-center w-full min-h-[12rem] rounded-xl border border-slate-800/80 border-dashed bg-slate-950/20">
        <Activity className="w-8 h-8 text-slate-600 mb-2 opacity-40" />
        <p className="text-slate-500 text-xs">Select any service node above to inspect real-time telemetry metrics</p>
      </div>
    );
  }

  const { metrics, metricsHistory } = service;

  const latency = metrics?.latency ?? 0;
  const errorRate = metrics?.errorRate ?? 0;
  const throughput = metrics?.throughput ?? 0;
  const cpu = metrics?.cpu ?? 0;

  const latencyStatus = latency > 500 ? 'critical' : latency > 200 ? 'warning' : 'normal';
  const errorStatus = errorRate > 10 ? 'critical' : errorRate > 2 ? 'warning' : 'normal';
  const throughputStatus = throughput < 50 ? 'critical' : 'normal';
  const cpuStatus = cpu > 80 ? 'critical' : cpu > 60 ? 'warning' : 'normal';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
      <MetricCard
        title="P99 Latency"
        value={Math.round(latency)}
        unit="ms"
        status={latencyStatus}
        icon={<Clock className="w-4 h-4" />}
        data={metricsHistory?.latency || []}
      />
      <MetricCard
        title="Error Rate"
        value={Number(errorRate.toFixed(2))}
        unit="%"
        status={errorStatus}
        icon={<AlertTriangle className="w-4 h-4" />}
        data={metricsHistory?.errorRate || []}
      />
      <MetricCard
        title="Throughput"
        value={Math.round(throughput)}
        unit="rps"
        status={throughputStatus}
        icon={<Activity className="w-4 h-4" />}
        data={metricsHistory?.throughput || []}
      />
      <MetricCard
        title="CPU Utilization"
        value={Math.round(cpu)}
        unit="%"
        status={cpuStatus}
        icon={<Cpu className="w-4 h-4" />}
        data={metricsHistory?.cpu || []}
      />
    </div>
  );
}
