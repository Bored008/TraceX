'use client';

import React from 'react';
import { Handle, Position } from '@xyflow/react';

export interface ServiceNodeData {
  serviceId: string;
  name: string;
  icon: string;
  status: 'healthy' | 'degraded' | 'critical' | 'down';
  metrics: {
    latency: number;
    errorRate: number;
    throughput: number;
    cpu: number;
  };
  isRootCause?: boolean;
  isAffected?: boolean;
}

export default function ServiceNode({ data }: { data: ServiceNodeData }) {
  const statusColors = {
    healthy: 'border-emerald-500/50 bg-slate-800 shadow-emerald-500/20',
    degraded: 'border-amber-500 bg-amber-950/20 shadow-amber-500/40 animate-pulse',
    critical: 'border-red-500 bg-red-950/30 shadow-red-500/50 animate-pulse',
    down: 'border-rose-900 bg-rose-950/50 shadow-rose-900/50 opacity-80',
  };

  const statusColor = statusColors[data.status] || statusColors.healthy;

  // Root cause gets a harsh red glow, affected gets a yellow pulsing border
  const rootCauseClasses = data.isRootCause ? 'ring-4 ring-red-600 shadow-[0_0_30px_rgba(220,38,38,0.8)]' : '';
  const affectedClasses = data.isAffected && !data.isRootCause ? 'ring-2 ring-amber-400/80 animate-pulse' : '';

  return (
    <div className={`w-[220px] rounded-xl border ${statusColor} ${rootCauseClasses} ${affectedClasses} p-4 shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-105`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-slate-400 border-2 border-slate-900" />
      
      <div className="flex items-center gap-3 mb-3">
        <div className="text-2xl bg-slate-900/50 p-2 rounded-lg">{data.icon}</div>
        <div className="flex-1 overflow-hidden">
          <h3 className="font-semibold text-slate-100 truncate text-sm">{data.name}</h3>
          <p className="text-xs text-slate-400 truncate">{data.serviceId}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-slate-900/40 p-2 rounded flex flex-col">
          <span className="text-slate-400 mb-1">Latency</span>
          <span className={`font-mono ${data.metrics.latency > 500 ? 'text-red-400' : data.metrics.latency > 200 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.metrics.latency}ms
          </span>
        </div>
        <div className="bg-slate-900/40 p-2 rounded flex flex-col">
          <span className="text-slate-400 mb-1">Errors</span>
          <span className={`font-mono ${data.metrics.errorRate > 5 ? 'text-red-400' : data.metrics.errorRate > 1 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.metrics.errorRate.toFixed(2)}%
          </span>
        </div>
        <div className="bg-slate-900/40 p-2 rounded flex flex-col">
          <span className="text-slate-400 mb-1">Req/s</span>
          <span className="font-mono text-blue-400">
            {data.metrics.throughput}
          </span>
        </div>
        <div className="bg-slate-900/40 p-2 rounded flex flex-col">
          <span className="text-slate-400 mb-1">CPU</span>
          <span className={`font-mono ${data.metrics.cpu > 80 ? 'text-red-400' : data.metrics.cpu > 60 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.metrics.cpu}%
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-slate-400 border-2 border-slate-900" />
    </div>
  );
}
