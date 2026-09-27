'use client';

import React from 'react';
import { CheckCircle2, AlertOctagon } from 'lucide-react';
import { RootCauseResult } from '@/types';
import ConfidenceRing from './ConfidenceRing';

interface RootCausePanelProps {
  result: RootCauseResult | null;
}

export default function RootCausePanel({ result }: RootCausePanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#16161b] rounded-xl border border-white/20 h-full min-h-[220px] text-center shadow-md">
        <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-white">System Normal</h3>
        <p className="text-neutral-400 text-xs mt-1 font-mono max-w-xs">
          All 8 microservices operational within latency and error SLAs
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#221215] rounded-xl border border-red-500/50 p-5 shadow-xl relative overflow-hidden">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400 font-medium">
              Root Cause Identification
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded border border-red-500/40 bg-red-500/20 text-red-400">
              {result.severity.toUpperCase()} RISK
            </span>
          </div>

          <div className="flex items-center gap-2 text-red-400">
            <AlertOctagon className="w-6 h-6 flex-shrink-0 animate-pulse text-red-500" />
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {result.rootCause.serviceName}
            </h2>
          </div>

          <p className="text-xs text-red-300 font-mono font-medium mt-1">
            Origin: {result.rootCause.description}
          </p>
        </div>

        <div className="flex flex-col items-center">
          <ConfidenceRing value={result.confidence} size={64} />
          <span className="text-[10px] text-neutral-400 mt-1 font-mono font-medium">Confidence</span>
        </div>
      </div>

      {/* Causal Explanation Box */}
      <div className="bg-[#0e0e11] rounded-lg border border-white/10 p-3.5">
        <h4 className="text-xs font-mono text-neutral-300 uppercase tracking-wider mb-1 flex items-center gap-1.5 font-bold">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
          Causal Diagnosis
        </h4>
        <p className="text-neutral-200 text-xs leading-relaxed font-mono">
          {result.explanation}
        </p>
      </div>
    </div>
  );
}
