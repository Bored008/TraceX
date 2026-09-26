'use client';

import React from 'react';
import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export default function ServiceEdge({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeData = data as { status?: string; protocol?: string; animated?: boolean } | undefined;

  const isCritical = edgeData?.status === 'critical';
  const isDegraded = edgeData?.status === 'degraded';
  
  // Green for healthy/normal traffic flow, Red for harm/risk/critical, Amber-red for degraded
  const edgeColor = isCritical ? '#ef4444' : isDegraded ? '#f87171' : '#22c55e';
  const isAnimated = edgeData?.animated !== false;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: isCritical ? 2.5 : 2,
          stroke: edgeColor,
          opacity: isCritical ? 0.95 : 0.85,
          strokeDasharray: '4 4',
          animation: isAnimated ? 'dashdraw 1.2s linear infinite' : 'none',
        }}
      />
      {edgeData?.protocol && (
        <foreignObject
          width={56}
          height={20}
          x={labelX - 28}
          y={labelY - 10}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex h-full w-full items-center justify-center font-mono bg-black/90 rounded border border-white/15 text-[9px] text-neutral-300 backdrop-blur-xs select-none shadow-xs">
            {edgeData.protocol}
          </div>
        </foreignObject>
      )}
    </>
  );
}
