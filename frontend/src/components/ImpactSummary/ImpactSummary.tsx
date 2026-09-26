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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-5 flex items-center">
        <div className="w-12 h-12 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mr-4">
          <Server className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Affected Services</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">{affectedServices.length}</span>
            <span className="text-slate-500 text-sm">/ {totalServices} total</span>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-slate-700 p-5 flex items-center">
        <div className="w-12 h-12 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center mr-4">
          <Users className="w-6 h-6 text-pink-400" />
        </div>
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">Affected Users</p>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-white">~{affectedUsers.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImpactSummary;
