'use client';

import React from 'react';
import { Search, Activity } from 'lucide-react';

interface HeaderProps {
  systemStatus: 'healthy' | 'incident';
  incidentCount: number;
}

const Header: React.FC<HeaderProps> = ({ systemStatus, incidentCount }) => {
  const isHealthy = systemStatus === 'healthy';

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-slate-900 border-b border-slate-700 text-white">
      <div className="flex items-center space-x-2">
        <Search className="w-6 h-6 text-blue-400" />
        <span className="text-xl font-bold tracking-tight">TraceX</span>
      </div>

      <div className="flex items-center space-x-3">
        <div className={`flex items-center px-3 py-1.5 rounded-full border ${isHealthy ? 'bg-emerald-950/50 border-emerald-800/50 text-emerald-400' : 'bg-rose-950/50 border-rose-800/50 text-rose-400'}`}>
          <div className="relative flex items-center justify-center w-4 h-4 mr-2">
            {!isHealthy && <Activity className="absolute w-4 h-4 animate-ping opacity-75 text-rose-500" />}
            <div className={`w-2.5 h-2.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`}></div>
          </div>
          <span className="text-sm font-medium">
            {isHealthy ? 'All Systems Operational' : `Incident Detected (${incidentCount})`}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
