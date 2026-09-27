'use client';

import React, { useMemo } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  Position,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';

import ServiceNode, { type ServiceNodeData } from './ServiceNode';
import { getLayoutedElements } from './graph-layout';
import { ServiceInfo } from '@/types';
import { SERVICE_CONFIG, SERVICE_DEPENDENCIES } from '@/lib/constants';

interface DependencyGraphProps {
  services?: ServiceInfo[];
  rootCauseServiceId?: string;
  affectedServiceIds?: string[];
}

const nodeTypes: NodeTypes = {
  service: ServiceNode,
};

export default function DependencyGraph({ 
  services = [], 
  rootCauseServiceId, 
  affectedServiceIds = [] 
}: DependencyGraphProps) {
  // Memoize layouted node positions once
  const layoutedPositions = useMemo(() => {
    const rawNodes: Node<ServiceNodeData>[] = Object.entries(SERVICE_CONFIG).map(([id, config]) => ({
      id,
      type: 'service',
      position: { x: 0, y: 0 },
      width: 210,
      height: 155,
      initialWidth: 210,
      initialHeight: 155,
      handles: [
        { type: 'target', position: Position.Top, x: 105, y: 0, width: 10, height: 10 },
        { type: 'source', position: Position.Bottom, x: 105, y: 155, width: 10, height: 10 },
      ],
      data: {
        serviceId: id,
        name: config.name,
        icon: config.icon,
        status: 'healthy',
      },
    }));

    const rawEdges: Edge[] = SERVICE_DEPENDENCIES.map((dep) => ({
      id: `e-${dep.source}-${dep.target}`,
      source: dep.source,
      target: dep.target,
    }));

    const layout = getLayoutedElements(rawNodes, rawEdges);
    const posMap: Record<string, { x: number; y: number }> = {};
    layout.nodes.forEach((n) => {
      posMap[n.id] = n.position;
    });
    return posMap;
  }, []);

  // Compute reactive nodes
  const nodes: Node<ServiceNodeData>[] = useMemo(() => {
    return Object.entries(SERVICE_CONFIG).map(([id, config]) => {
      const serviceData = services.find((s) => s.id === id);
      const isUnhealthy = serviceData?.status === 'degraded' || serviceData?.status === 'critical';
      const isRootCause = id === rootCauseServiceId && (isUnhealthy || !serviceData);
      const isAffected = affectedServiceIds.includes(id) && (isUnhealthy || !serviceData);

      return {
        id,
        type: 'service',
        position: layoutedPositions[id] || { x: 0, y: 0 },
        width: 210,
        height: 155,
        initialWidth: 210,
        initialHeight: 155,
        handles: [
          { type: 'target', position: Position.Top, x: 105, y: 0, width: 10, height: 10 },
          { type: 'source', position: Position.Bottom, x: 105, y: 155, width: 10, height: 10 },
        ],
        data: {
          serviceId: id,
          name: config.name,
          icon: config.icon,
          status: serviceData?.status || 'healthy',
          metrics: serviceData?.metrics || {
            latency: 10,
            errorRate: 0.01,
            throughput: 100,
            cpu: 10,
          },
          isRootCause,
          isAffected,
        },
      };
    });
  }, [services, rootCauseServiceId, affectedServiceIds, layoutedPositions]);

  // Compute reactive edges (green dotted lines for healthy, red for harm/critical)
  const edges: Edge[] = useMemo(() => {
    return SERVICE_DEPENDENCIES.map((dep) => {
      const sourceServiceData = services.find((s) => s.id === dep.source);
      const targetServiceData = services.find((s) => s.id === dep.target);

      let edgeStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
      if (sourceServiceData?.status === 'critical' || targetServiceData?.status === 'critical') {
        edgeStatus = 'critical';
      } else if (sourceServiceData?.status === 'degraded' || targetServiceData?.status === 'degraded') {
        edgeStatus = 'degraded';
      }

      const isHarm = edgeStatus === 'critical' || edgeStatus === 'degraded';

      return {
        id: `e-${dep.source}-${dep.target}`,
        source: dep.source,
        target: dep.target,
        animated: true,
        style: {
          strokeWidth: isHarm ? 2.5 : 2,
          stroke: isHarm ? '#ef4444' : '#22c55e',
          strokeDasharray: '4 4',
        },
      };
    });
  }, [services]);

  return (
    <div className="w-full h-full bg-[#0e0e11]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        className="bg-[#0e0e11]"
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#2b2b32" />
        <Controls className="bg-[#141418]/95 border-white/20 fill-neutral-300 rounded-lg overflow-hidden shadow-lg" />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as { status?: string } | undefined;
            const status = data?.status;
            if (status === 'critical' || status === 'degraded' || status === 'down') return '#ef4444';
            return '#22c55e';
          }}
          maskColor="rgba(14, 14, 17, 0.85)"
          className="bg-[#141418]/95 border border-white/20 rounded-lg shadow-lg"
        />
        <Panel position="top-right" className="bg-[#141418]/95 p-3.5 rounded-xl border border-white/20 backdrop-blur-md shadow-xl">
          <h4 className="text-white font-mono text-[10px] uppercase tracking-wider mb-2 font-semibold">
            Status Legend
          </h4>
          <div className="flex flex-col gap-1.5 text-[11px] text-neutral-400 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-emerald-400 font-medium">Safe / Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-red-400 font-medium">Risk / Harm Detected</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-white/10">
              <span className="w-2 h-2 rounded-full ring-2 ring-red-500 bg-red-950" />
              <span className="text-red-300">Root Cause Origin</span>
            </div>
            <div className="flex items-center gap-2 pt-1 text-[10px] text-neutral-500">
              <span className="w-3 border-t-2 border-dashed border-emerald-500" />
              <span>Telemetry Flow</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
