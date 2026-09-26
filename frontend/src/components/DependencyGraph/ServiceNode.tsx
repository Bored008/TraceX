'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface ServiceNodeData extends Record<string, unknown> {
  serviceId: string;
  name: string;
  icon: string;
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  metrics?: {
    latency?: number;
    errorRate?: number;
    throughput?: number;
    cpu?: number;
  };
  isRootCause?: boolean;
  isAffected?: boolean;
}

export default function ServiceNode({ data }: { data: ServiceNodeData }) {
  const statusColors = {
    healthy: 'border-emerald-500/50 bg-slate-800/90 shadow-emerald-500/10',
    degraded: 'border-amber-500 bg-amber-950/40 shadow-amber-500/30 animate-pulse',
    critical: 'border-red-500 bg-red-950/50 shadow-red-500/40 animate-pulse',
    down: 'border-rose-900 bg-rose-950/60 shadow-rose-900/50 opacity-80',
  };

  const status = data?.status || 'healthy';
  const statusColor = statusColors[status] || statusColors.healthy;

  // Root cause gets an animated red glow, affected gets amber ring
  const rootCauseClasses = data?.isRootCause ? 'ring-4 ring-red-500 shadow-[0_0_35px_rgba(239,68,68,0.7)]' : '';
  const affectedClasses = data?.isAffected && !data?.isRootCause ? 'ring-2 ring-amber-400 animate-pulse' : '';

  // Defensive metric extraction to prevent runtime undefined crashes
  const latency = typeof data?.metrics?.latency === 'number' ? Math.round(data.metrics.latency) : 10;
  const errorRate = typeof data?.metrics?.errorRate === 'number' ? Number(data.metrics.errorRate.toFixed(2)) : 0.0;
  const throughput = typeof data?.metrics?.throughput === 'number' ? Math.round(data.metrics.throughput) : 100;
  const cpu = typeof data?.metrics?.cpu === 'number' ? Math.round(data.metrics.cpu) : 15;

  return (
    <div className={`w-[220px] rounded-xl border ${statusColor} ${rootCauseClasses} ${affectedClasses} p-3.5 shadow-lg backdrop-blur-md transition-all duration-300 hover:scale-105 select-none`}>
      <Handle type="target" position={Position.Top} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900" />
      
      <div className="flex items-center gap-2.5 mb-2.5">
        <div className="text-xl bg-slate-900/70 p-1.5 rounded-lg border border-slate-700/50 flex-shrink-0">
          {data?.icon || '📦'}
        </div>
        <div className="flex-1 overflow-hidden min-w-0">
          <h3 className="font-semibold text-slate-100 truncate text-xs">{data?.name || data?.serviceId}</h3>
          <p className="text-[10px] text-slate-400 truncate font-mono">{data?.serviceId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 text-[11px]">
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Latency</span>
          <span className={`font-mono font-semibold ${latency > 500 ? 'text-red-400' : latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {latency}ms
          </span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Errors</span>
          <span className={`font-mono font-semibold ${errorRate > 5 ? 'text-red-400' : errorRate > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {errorRate}%
          </span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">Req/s</span>
          <span className="font-mono font-semibold text-blue-400">
            {throughput}
          </span>
        </div>
        <div className="bg-slate-900/60 p-1.5 rounded border border-slate-800/80 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-slate-400">CPU</span>
          <span className={`font-mono font-semibold ${cpu > 80 ? 'text-red-400' : cpu > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {cpu}%
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!w-3 !h-3 !bg-slate-400 !border-2 !border-slate-900" />
    </div>
  );
}
