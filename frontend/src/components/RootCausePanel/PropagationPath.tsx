'use client';

import React from 'react';
import { ArrowDown, Box } from 'lucide-react';
import { PropagationStep } from '@/types';
import { SERVICE_CONFIG } from '@/lib/constants';

interface PropagationPathProps {
  steps: PropagationStep[];
  rootCauseServiceId: string;
}

export default function PropagationPath({ steps, rootCauseServiceId }: PropagationPathProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="relative">
      <div className="absolute left-[1.125rem] top-2 bottom-2 w-px bg-slate-800"></div>
      
      <div className="space-y-3.5 relative">
        {steps.map((step, index) => {
          const isRoot = step.from === rootCauseServiceId || index === 0;
          const sourceName = SERVICE_CONFIG?.[step.from]?.name || step.from;
          const targetName = SERVICE_CONFIG?.[step.to]?.name || step.to;
          
          return (
            <div key={index} className="flex gap-3">
              <div className="relative flex flex-col items-center z-10">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 bg-slate-900 ${isRoot ? 'border-rose-500 text-rose-400 shadow-rose-500/30' : 'border-amber-500 text-amber-400 shadow-amber-500/20'}`}>
                  <Box className="w-3.5 h-3.5" />
                </div>
              </div>
              
              <div className="flex-1 bg-slate-950/60 rounded-xl border border-slate-800/80 p-3 relative overflow-hidden">
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold text-xs ${isRoot ? 'text-rose-400' : 'text-amber-400'}`}>{sourceName}</span>
                    <ArrowDown className="w-3.5 h-3.5 text-slate-500 -rotate-90" />
                    <span className="font-semibold text-xs text-slate-300">{targetName}</span>
                  </div>
                  <span className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded text-slate-400 border border-slate-800">
                    +{step.delay}ms
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600 mr-2 inline-block"></span>
                  <span className="text-slate-400">{step.mechanism}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
