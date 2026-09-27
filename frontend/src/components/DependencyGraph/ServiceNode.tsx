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
  const status = data?.status || 'healthy';
  const isHealthy = status === 'healthy';
  const isHarm = status === 'critical' || status === 'degraded' || status === 'down';
  const isRootCause = Boolean(data?.isRootCause);
  const isAffected = Boolean(data?.isAffected && !data?.isRootCause);

  // Sharp outlined box with dark gray background and low-opacity white border
  let boxBorder = 'border-white/25 hover:border-white/50 bg-[#1c1c23] shadow-lg';
  if (isRootCause) {
    boxBorder = 'border-red-500 ring-2 ring-red-500/40 bg-[#281316] shadow-[0_0_24px_rgba(239,68,68,0.3)]';
  } else if (isAffected || isHarm) {
    boxBorder = 'border-red-500/60 bg-[#201215] shadow-[0_0_15px_rgba(239,68,68,0.15)]';
  }

  // Defensive metric extraction
  const latency = typeof data?.metrics?.latency === 'number' ? Math.round(data.metrics.latency) : 10;
  const errorRate = typeof data?.metrics?.errorRate === 'number' ? Number(data.metrics.errorRate.toFixed(2)) : 0.0;
  const throughput = typeof data?.metrics?.throughput === 'number' ? Math.round(data.metrics.throughput) : 100;
  const cpu = typeof data?.metrics?.cpu === 'number' ? Math.round(data.metrics.cpu) : 15;

  const isLatencyHarm = latency > 200;
  const isErrorHarm = errorRate > 2;
  const isCpuHarm = cpu > 60;

  return (
    <div
      className={`w-[210px] rounded-xl border ${boxBorder} p-3 shadow-md backdrop-blur-md transition-all duration-200 select-none`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-neutral-400 !border-2 !border-black"
      />

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded border border-white/15 bg-white/[0.05] flex items-center justify-center text-sm flex-shrink-0">
            {data?.icon || '📦'}
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-white text-[13px] truncate leading-tight">
              {data?.name || data?.serviceId}
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono truncate">{data?.serviceId}</p>
          </div>
        </div>

        {/* Status Indicator: Green (Safe) vs Red (Harm) */}
        <div className="flex-shrink-0">
          {isRootCause ? (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
              Root
            </span>
          ) : isHarm ? (
            <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/30">
              Harm
            </span>
          ) : (
            <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            </div>
          )}
        </div>
      </div>

      {/* Metrics Grid (Sharp outlined transparent boxes) */}
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-[#0e0e11] p-1.5 rounded-md border border-white/10 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-medium">Latency</span>
          <span className={`font-mono text-xs font-bold ${isLatencyHarm ? 'text-red-400' : 'text-emerald-400'}`}>
            {latency}ms
          </span>
        </div>

        <div className="bg-[#0e0e11] p-1.5 rounded-md border border-white/10 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-medium">Errors</span>
          <span className={`font-mono text-xs font-bold ${isErrorHarm ? 'text-red-400' : 'text-emerald-400'}`}>
            {errorRate}%
          </span>
        </div>

        <div className="bg-[#0e0e11] p-1.5 rounded-md border border-white/10 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-medium">Req/s</span>
          <span className="font-mono text-xs font-bold text-white">
            {throughput}
          </span>
        </div>

        <div className="bg-[#0e0e11] p-1.5 rounded-md border border-white/10 flex flex-col">
          <span className="text-[9px] uppercase tracking-wider text-neutral-400 font-mono font-medium">CPU</span>
          <span className={`font-mono text-xs font-bold ${isCpuHarm ? 'text-red-400' : 'text-emerald-400'}`}>
            {cpu}%
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-neutral-400 !border-2 !border-black"
      />
    </div>
  );
}
