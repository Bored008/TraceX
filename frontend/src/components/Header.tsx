'use client';

import React from 'react';
import Link from 'next/link';
import { Activity, Radio, ArrowUpRight } from 'lucide-react';

interface HeaderProps {
  systemStatus: 'healthy' | 'incident';
  incidentCount: number;
  isBackendConnected?: boolean;
}

const Header: React.FC<HeaderProps> = ({ systemStatus, incidentCount, isBackendConnected = false }) => {
  const isHealthy = systemStatus === 'healthy';

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-white/10 text-white select-none">
      <div className="max-w-[1920px] mx-auto px-5 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3.5">
          <div className="w-8 h-8 rounded-lg border border-white/20 bg-white/[0.04] flex items-center justify-center shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-neutral-100 to-neutral-400 bg-clip-text text-transparent">
                TraceX
              </h1>
              <span className="text-[10px] uppercase font-mono tracking-widest px-2 py-0.5 rounded border border-white/15 bg-white/[0.03] text-neutral-400">
                SRE Topology
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 font-mono">Distributed Root Cause Analyzer</p>
          </div>
        </div>

        {/* Right Status Controls */}
        <div className="flex items-center gap-3">
          {/* Link to Storefront */}
          <Link
            href="/store"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/15 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/30 text-neutral-300 hover:text-white text-xs font-mono transition-all group shadow-xs"
          >
            <span>Blinkit Storefront</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-colors" />
          </Link>

          {/* Backend Connection Badge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all ${
              isBackendConnected
                ? 'bg-white/[0.02] border-white/10 text-neutral-300'
                : 'bg-red-950/20 border-red-500/30 text-red-400'
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${isBackendConnected ? 'text-emerald-400' : 'text-red-400 animate-pulse'}`}
            />
            <span>{isBackendConnected ? 'WebSocket Live' : 'Backend Disconnected'}</span>
          </div>

          {/* System Health Status: Green (Safe) vs Red (Harm) */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-medium tracking-wide transition-all ${
              isHealthy
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/15 border-red-500/40 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {!isHealthy && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isHealthy ? 'bg-emerald-500' : 'bg-red-500'
                }`}
              />
            </span>
            <span>{isHealthy ? 'System Normal' : `Harm Detected (${incidentCount})`}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
