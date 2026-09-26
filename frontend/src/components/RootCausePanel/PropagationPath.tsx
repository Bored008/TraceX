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
      <div className="absolute left-[0.875rem] top-2 bottom-2 w-px bg-white/10" />
      
      <div className="space-y-2.5 relative">
        {steps.map((step, index) => {
          const isRoot = step.from === rootCauseServiceId || index === 0;
          const sourceName = SERVICE_CONFIG?.[step.from]?.name || step.from;
          const targetName = SERVICE_CONFIG?.[step.to]?.name || step.to;
          
          return (
            <div key={index} className="flex gap-2.5 items-start">
              <div className="relative flex flex-col items-center z-10 pt-1">
                <div
                  className={`w-7 h-7 rounded border flex items-center justify-center bg-black ${
                    isRoot ? 'border-red-500 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'border-white/15 text-neutral-400'
                  }`}
                >
                  <Box className="w-3 h-3" />
                </div>
              </div>
              
              <div className="flex-1 bg-white/[0.02] rounded border border-white/10 p-2.5 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-1.5 font-mono">
                    <span className={isRoot ? 'text-red-400 font-bold' : 'text-neutral-300'}>{sourceName}</span>
                    <ArrowDown className="w-3 h-3 text-neutral-500 -rotate-90" />
                    <span className="text-neutral-400">{targetName}</span>
                  </div>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded text-neutral-400 border border-white/10 bg-white/[0.03]">
                    +{step.delay}ms
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {step.mechanism}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
