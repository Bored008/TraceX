'use client';

import React from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface MetricCardProps {
  title: string;
  value: number;
  unit: string;
  data: Array<{ timestamp: number; value: number }>;
  status: 'normal' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export default function MetricCard({ title, value, unit, data, status, icon }: MetricCardProps) {
  // Green for safe/normal, Red for harm/risk
  const color = status === 'normal' ? '#22c55e' : '#ef4444';
  const isHarm = status !== 'normal';

  return (
    <div className={`p-3.5 rounded-lg border ${isHarm ? 'border-red-500/40 bg-red-950/10' : 'border-white/10 bg-white/[0.02]'} backdrop-blur-md flex flex-col h-32 transition-all`}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 text-neutral-400 font-mono text-xs">
          <span className={isHarm ? 'text-red-400' : 'text-neutral-400'}>{icon}</span>
          <span>{title}</span>
        </div>
        <div className="text-base font-bold font-mono text-white">
          <span className={isHarm ? 'text-red-400 font-bold' : 'text-white'}>{value}</span>{' '}
          <span className="text-[11px] font-normal text-neutral-500">{unit}</span>
        </div>
      </div>

      <div className="flex-1 w-full h-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fill={`url(#gradient-${title})`} 
              strokeWidth={1.5} 
              isAnimationActive={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
