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

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'critical':
        return '#ef4444';
      case 'degraded':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const edgeColor = getStatusColor(edgeData?.status);
  const isAnimated = edgeData?.animated !== false;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: edgeData?.status === 'critical' ? 3 : 2,
          stroke: edgeColor,
          opacity: 0.8,
          strokeDasharray: isAnimated ? '5, 5' : 'none',
          animation: isAnimated ? 'flow 20s linear infinite' : 'none',
        }}
      />
      {edgeData?.protocol && (
        <foreignObject
          width={60}
          height={20}
          x={labelX - 30}
          y={labelY - 10}
          requiredExtensions="http://www.w3.org/1999/xhtml"
        >
          <div className="flex h-full w-full items-center justify-center font-mono bg-slate-900/80 rounded px-1 text-[10px] border border-slate-700 text-slate-300 backdrop-blur">
            {edgeData.protocol}
          </div>
        </foreignObject>
      )}
      <style>
        {`
          @keyframes flow {
            from { stroke-dashoffset: 100; }
            to { stroke-dashoffset: 0; }
          }
        `}
      </style>
    </>
  );
}
