'use client';

import React from 'react';
import { Terminal, CheckCircle2, Loader2 } from 'lucide-react';

interface AIExplanationProps {
  explanation?: string;
  suggestedFix?: string;
  isLoading?: boolean;
}

const AIExplanation: React.FC<AIExplanationProps> = ({
  explanation,
  suggestedFix,
  isLoading = false,
}) => {
  return (
    <div className="bg-white/[0.02] backdrop-blur-md rounded-lg border border-white/10 p-5 text-white font-sans">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded border border-white/15 bg-white/[0.04] flex items-center justify-center">
            <Terminal className="w-3.5 h-3.5 text-neutral-300" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Diagnostic Synthesis & Remediation
            </h3>
            <p className="text-xs text-neutral-400 font-mono">Automated root-cause telemetry reasoning</p>
          </div>
        </div>

        <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border border-white/15 bg-white/[0.03] text-neutral-400 font-semibold">
          Trace Analysis
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3 py-2">
          <div className="flex items-center space-x-2 text-neutral-400 text-xs font-mono">
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Synthesizing microservice dependency telemetry...</span>
          </div>
          <div className="h-10 bg-white/[0.02] rounded border border-white/5 animate-pulse" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Causal Finding */}
          <div>
            <h4 className="text-xs font-mono text-neutral-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              Observed Failure Mechanism
            </h4>
            <div className="bg-black/60 p-3.5 rounded border border-white/10 text-neutral-300 text-xs font-mono leading-relaxed whitespace-pre-wrap">
              {explanation || 'No anomalies currently detected across service topology.'}
            </div>
          </div>

          {/* Recommended Resolution */}
          {suggestedFix && (
            <div>
              <h4 className="text-xs font-mono text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Recommended System Remediation
              </h4>
              <div className="bg-emerald-950/15 p-3.5 rounded border border-emerald-500/30 text-emerald-200 text-xs font-mono leading-relaxed whitespace-pre-wrap">
                {suggestedFix}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIExplanation;
