'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { RootCauseResult } from '@/types';
import ConfidenceRing from './ConfidenceRing';

interface RootCausePanelProps {
  result: RootCauseResult | null;
}

export default function RootCausePanel({ result }: RootCausePanelProps) {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 h-full min-h-[220px]">
        <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3 border border-emerald-500/20">
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-sm font-semibold text-slate-200">No Incidents Detected</h3>
        <p className="text-slate-400 text-xs mt-1 text-center">Distributed topology healthy & operating within SLA baselines</p>
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    const s = severity?.toUpperCase();
    switch (s) {
      case 'CRITICAL': return 'bg-rose-500/20 text-rose-400 border-rose-500/40 shadow-rose-500/20';
      case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/40 shadow-orange-500/20';
      case 'MEDIUM': return 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-amber-500/20';
      case 'LOW': return 'bg-blue-500/20 text-blue-400 border-blue-500/40 shadow-blue-500/20';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/40';
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl rounded-2xl border border-slate-800/80 p-5 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Root Cause Analysis</span>
            <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider rounded-md border shadow-sm ${getSeverityBadge(result.severity)}`}>
              {result.severity.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-rose-400">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-pulse" />
            <h2 className="text-lg font-bold text-white tracking-tight">{result.rootCause.serviceName}</h2>
          </div>
          <p className="text-xs text-rose-300/80 mt-1 font-mono">
            Origin: {result.rootCause.description}
          </p>
        </div>
        <div className="flex flex-col items-center">
          <ConfidenceRing value={result.confidence} size={76} />
          <span className="text-[10px] text-slate-400 mt-1 font-medium">Confidence</span>
        </div>
      </div>

      <div className="bg-slate-950/70 rounded-xl p-3.5 border border-slate-800/80">
        <h4 className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          Causal Diagnosis
        </h4>
        <p className="text-slate-300 text-xs leading-relaxed">
          {result.explanation}
        </p>
      </div>
    </div>
  );
}
