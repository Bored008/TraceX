'use client';

import React from 'react';
import { Server, Users } from 'lucide-react';

interface ImpactSummaryProps {
  affectedServices: string[];
  affectedUsers: number;
  totalServices: number;
}

const ImpactSummary: React.FC<ImpactSummaryProps> = ({
  affectedServices,
  affectedUsers,
  totalServices,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Affected Services */}
      <div className="bg-[#16161b] rounded-xl border border-white/20 p-4 flex items-center shadow-md">
        <div className="w-10 h-10 rounded border border-red-500/30 bg-red-500/10 flex items-center justify-center mr-3 flex-shrink-0">
          <Server className="w-4 h-4 text-red-400" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-0.5">
            Affected Nodes
          </p>
          <div className="flex items-baseline space-x-1.5 font-mono">
            <span className="text-2xl font-black text-red-400">{affectedServices.length}</span>
            <span className="text-neutral-500 text-xs">/ {totalServices} total</span>
          </div>
        </div>
      </div>

      {/* Affected Users */}
      <div className="bg-[#16161b] rounded-xl border border-white/20 p-4 flex items-center shadow-md">
        <div className="w-10 h-10 rounded border border-white/15 bg-white/[0.04] flex items-center justify-center mr-3 flex-shrink-0">
          <Users className="w-4 h-4 text-neutral-300" />
        </div>
        <div>
          <p className="text-xs font-mono uppercase tracking-wider text-neutral-400 font-semibold mb-0.5">
            Impacted Traffic
          </p>
          <div className="flex items-baseline space-x-1.5 font-mono">
            <span className="text-2xl font-black text-white">~{affectedUsers.toLocaleString()}</span>
            <span className="text-neutral-500 text-xs">users</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;
