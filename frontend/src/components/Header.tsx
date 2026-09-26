'use client';

import React from 'react';
import { Search, Activity, Radio, Cpu } from 'lucide-react';

interface HeaderProps {
  systemStatus: 'healthy' | 'incident';
  incidentCount: number;
  isBackendConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({ systemStatus, incidentCount, isBackendConnected = false }) => {
  const isHealthy = systemStatus === 'healthy';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
              TraceX
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              MicroRCA v2.0
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono">Distributed Topology Root Cause Analyzer</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend live connection status badge */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono transition-all ${
          isBackendConnected
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-amber-950/40 border-amber-500/30 text-amber-300'
        }`}>
          <Radio className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
          <span>{isBackendConnected ? 'FastAPI Backend: Live (WebSocket)' : 'Standalone Fallback Mode'}</span>
        </div>

        {/* System Health / Incident indicator */}
        <div className={`flex items-center px-3.5 py-1.5 rounded-full border text-xs font-semibold tracking-wide ${
          isHealthy
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            : 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
        }`}>
          <div className="relative flex items-center justify-center w-3 h-3 mr-2">
            {!isHealthy && <Activity className="absolute w-3.5 h-3.5 animate-ping opacity-75 text-rose-500" />}
            <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400' : 'bg-rose-500'}`}></div>
          </div>
          <span>
            {isHealthy ? 'System Healthy' : `Active Incident (${incidentCount})`}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
