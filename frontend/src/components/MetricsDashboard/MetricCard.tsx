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
  const colors = {
    normal: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    critical: '#ef4444' // red-500
  };
  const color = colors[status];

  return (
    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex flex-col h-32">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 text-slate-300">
          {icon}
          <span className="font-medium text-sm">{title}</span>
        </div>
        <div className="text-xl font-bold text-white">
          {value} <span className="text-sm font-normal text-slate-400">{unit}</span>
        </div>
      </div>
      <div className="flex-1 w-full h-full -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={color} 
              fill={`url(#gradient-${title})`} 
              strokeWidth={2} 
              isAnimationActive={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
