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
  activeScenarios?: ChaosScenario[];
}

export default function ControlPanel({
  onInjectFault,
  onReset,
  isActive,
  activeScenario,
  activeScenarios = [],
}: ControlPanelProps) {
  // Normalize current active scenarios list
  const currentActiveList: ChaosScenario[] =
    activeScenarios.length > 0
      ? activeScenarios
      : activeScenario
      ? [activeScenario]
      : [];
  const activeCount = currentActiveList.length;
  const isAnyActive = isActive || activeCount > 0;

  return (
    <div className="bg-[#16161b] rounded-xl border border-white/20 p-5 select-none shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-white tracking-tight">
              Fault Injection & Risk Simulator
            </h3>
            {activeCount > 1 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-500/20 text-red-400 border border-red-500/40">
                {activeCount} Concurrent Faults
              </span>
            )}
          </div>
          <p className="text-xs text-neutral-400 font-mono">
            Click any scenario to inject or remove. Select multiple crashes to test compound root cause analysis.
          </p>
        </div>

        <button
          onClick={onReset}
          disabled={!Boolean(isAnyActive)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-xs font-semibold transition-all duration-200
            ${
              isAnyActive
                ? 'border border-emerald-500 bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 shadow-[0_0_15px_rgba(34,197,94,0.3)] cursor-pointer'
                : 'border border-white/10 bg-[#202027] text-neutral-500 cursor-not-allowed'
            }
          `}
        >
          <RotateCcw className={`w-3.5 h-3.5 ${isAnyActive ? 'animate-[spin_3s_linear_infinite]' : ''}`} />
          <span>Reset System to Safe Baseline</span>
        </button>
      </div>

      {/* Multi-Fault Status Alert Banner */}
      {activeCount > 1 && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-between text-xs font-mono text-red-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping flex-shrink-0" />
            <span className="font-bold uppercase tracking-wider text-red-400">
              Compound Multi-Crash Mode ({activeCount} Active):
            </span>
            <span className="text-neutral-300 truncate">
              {currentActiveList.map((s) => s.replace('_', ' ')).join(' + ')}
            </span>
          </div>
          <span className="text-[11px] text-neutral-400 hidden sm:inline">
            Click an active card to toggle off
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {CHAOS_SCENARIOS.map((scenario) => {
          const isScenarioActive = currentActiveList.includes(scenario.id);

          return (
            <button
              key={scenario.id}
              onClick={() => onInjectFault(scenario.id)}
              className={`
                p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between min-h-[92px] cursor-pointer
                ${
                  isScenarioActive
                    ? 'border-red-500 bg-[#281316] text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)] ring-1 ring-red-500/50'
                    : 'border-white/20 bg-[#202027] hover:border-white/40 hover:bg-[#272732] text-white shadow-xs'
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
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/40 font-bold">
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
                <span className={isScenarioActive ? 'text-red-400 font-bold' : 'text-neutral-400'}>
                  {isScenarioActive ? 'Harm Active • Click to Remove' : '+ Click to Inject'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
