'use client';

import React from 'react';

interface ConfidenceRingProps {
  value: number; // 0-100
  size?: number;
}

const ConfidenceRing: React.FC<ConfidenceRingProps> = ({ value, size = 64 }) => {
  const strokeWidth = size * 0.1;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  let color = 'text-rose-500'; // < 60
  if (value >= 80) color = 'text-emerald-500';
  else if (value >= 60) color = 'text-amber-500';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-slate-700"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-white">
        <span className="text-sm font-bold">{value}%</span>
      </div>
    </div>
  );
};

export default ConfidenceRing;
