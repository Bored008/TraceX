'use client';

import React from 'react';
import { RotateCcw, AlertTriangle } from 'lucide-react';
import { ChaosScenario } from '@/types';
import { CHAOS_SCENARIOS } from '@/lib/constants';

interface ControlPanelProps {
  onInjectFault: (scenario: ChaosScenario) => void;
  onReset: () => void;
  isActive: boolean;
  activeScenario?: ChaosScenario | null;
}

export default function ControlPanel({
  onInjectFault,
  onReset,
  isActive,
  activeScenario,
}: ControlPanelProps) {
  return (
    <div className="bg-white/[0.02] backdrop-blur-md rounded-lg border border-white/10 p-5 select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight">
            Fault Injection & Risk Simulator
          </h3>
          <p className="text-xs text-neutral-400 font-mono">
            Trigger simulated distributed faults to evaluate root-cause detection
          </p>
        </div>

        <button
          onClick={onReset}
          disabled={!Boolean(isActive)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all duration-200
            ${
              isActive
                ? 'border border-emerald-500 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer'
                : 'border border-white/10 bg-white/[0.01] text-neutral-600 cursor-not-allowed'
            }
          `}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isActive ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          <span>Reset System to Safe Baseline</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CHAOS_SCENARIOS.map((scenario) => {
          const isScenarioActive = isActive && activeScenario === scenario.id;
          const isDisabled = isActive && !isScenarioActive;

          return (
            <button
              key={scenario.id}
              onClick={() => onInjectFault(scenario.id)}
              disabled={isDisabled}
              className={`
                p-3.5 rounded-lg border text-left transition-all duration-200 flex flex-col justify-between min-h-[92px]
                ${
                  isScenarioActive
                    ? 'border-red-500 bg-red-950/20 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.25)] ring-1 ring-red-500/50'
                    : isDisabled
                    ? 'border-white/5 bg-transparent opacity-35 cursor-not-allowed'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.05] cursor-pointer text-white'
                }
              `}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{scenario.icon || '⚡'}</span>
                    <span className="font-bold text-xs sm:text-[13px] text-white truncate">{scenario.name}</span>
                  </div>
                  {isScenarioActive && (
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 line-clamp-2 font-sans leading-relaxed">
                  {scenario.description}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-neutral-500">
                <span>Target: {scenario.id.replace('_', ' ')}</span>
                <span className={isScenarioActive ? 'text-red-400 font-bold' : 'text-neutral-500'}>
                  {isScenarioActive ? 'Harm Injected' : 'Click to Inject'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
