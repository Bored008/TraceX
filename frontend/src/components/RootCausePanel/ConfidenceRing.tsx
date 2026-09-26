'use client';

import React from 'react';

interface ConfidenceRingProps {
  value: number; // 0-100
  size?: number;
}

const ConfidenceRing: React.FC<ConfidenceRingProps> = ({ value, size = 64 }) => {
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  // Green for high confidence (>=75%), Red for uncertainty/risk (<75%)
  const color = value >= 75 ? 'text-emerald-400' : 'text-red-400';

  return (
    <div className="relative flex items-center justify-center select-none" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90 w-full h-full">
        <circle
          className="text-white/10"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={`${color} transition-all duration-700 ease-out`}
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
        <span className="text-xs font-mono font-bold">{value}%</span>
      </div>
    </div>
  );
};

export default ConfidenceRing;
