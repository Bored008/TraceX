'use client';
import React from 'react';
import { Zap, RotateCcw } from 'lucide-react';
import { ChaosScenario } from '@/types';
import { CHAOS_SCENARIOS } from '@/lib/constants';

interface ControlPanelProps {
  onInjectFault: (scenario: ChaosScenario) => void;
  onReset: () => void;
  isActive: boolean;
  activeScenario?: ChaosScenario | null;
}

export default function ControlPanel({ onInjectFault, onReset, isActive, activeScenario }: ControlPanelProps) {
  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-white">Chaos Control Panel</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
        {CHAOS_SCENARIOS.map((scenario) => {
          const isScenarioActive = isActive && activeScenario === scenario.id;
          const isDisabled = isActive && !isScenarioActive;

          return (
            <button
              key={scenario.id}
              onClick={() => onInjectFault(scenario.id)}
              disabled={isDisabled}
              className={`
                relative overflow-hidden p-3 rounded-lg border flex flex-col items-start text-left transition-all duration-200
                ${isScenarioActive
                  ? 'border-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.4)] scale-[1.02]'
                  : isDisabled
                    ? 'border-slate-700 opacity-40 cursor-not-allowed bg-slate-800/30'
                    : 'border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 cursor-pointer bg-slate-800/70'
                }
              `}
            >
              <div 
                className={`absolute inset-0 opacity-10 bg-gradient-to-br ${scenario.color || 'from-slate-400 to-slate-500'}`} 
              />
              
              <div className="flex items-center gap-2 w-full mb-1 relative z-10">
                <span className="text-xl" aria-hidden="true">{scenario.icon || '⚡'}</span>
                <span className="font-semibold text-sm text-slate-200 truncate">{scenario.name}</span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-2 relative z-10">{scenario.description}</p>
              
              {isScenarioActive && (
                <div className="absolute inset-0 bg-indigo-500/10 animate-pulse pointer-events-none z-0" />
              )}
            </button>
          );
        })}
      </div>

      <div className="border-t border-slate-700 pt-4 flex justify-end">
        <button
          onClick={onReset}
          disabled={!Boolean(isActive)}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm
            ${isActive
              ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white hover:from-emerald-500 hover:to-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }
          `}
        >
          <RotateCcw className={`w-4 h-4 ${isActive ? 'animate-[spin_2s_linear_infinite]' : ''}`} />
          System Reset
        </button>
      </div>
    </div>
  );
}
