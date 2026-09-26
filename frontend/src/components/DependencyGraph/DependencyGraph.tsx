'use client';

import React, { useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeTypes,
} from '@xyflow/react';

import ServiceNode, { type ServiceNodeData } from './ServiceNode';
import { getLayoutedElements } from './graph-layout';
import { ServiceInfo } from '@/types';
import { SERVICE_CONFIG, SERVICE_DEPENDENCIES } from '@/lib/constants';
import { Position } from '@xyflow/react';

interface DependencyGraphProps {
  services?: ServiceInfo[];
  rootCauseServiceId?: string;
  affectedServiceIds?: string[];
}

const nodeTypes: NodeTypes = {
  service: ServiceNode,
};

function createInitialElements(services: ServiceInfo[] = [], rootCauseServiceId?: string, affectedServiceIds: string[] = []) {
  const rawNodes: Node<ServiceNodeData>[] = Object.entries(SERVICE_CONFIG).map(([id, config]) => {
    const serviceData = services.find((s) => s.id === id);
    const isRootCause = id === rootCauseServiceId;
    const isAffected = affectedServiceIds.includes(id);

    return {
      id,
      type: 'service',
      position: { x: 0, y: 0 },
      width: 220,
      height: 160,
      initialWidth: 220,
      initialHeight: 160,
      handles: [
        { type: 'target', position: Position.Top, x: 110, y: 0, width: 12, height: 12 },
        { type: 'source', position: Position.Bottom, x: 110, y: 160, width: 12, height: 12 },
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

  const rawEdges: Edge[] = SERVICE_DEPENDENCIES.map((dep) => {
    const sourceServiceData = services.find((s) => s.id === dep.source);
    const targetServiceData = services.find((s) => s.id === dep.target);
    
    let edgeStatus: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (sourceServiceData?.status === 'critical' || targetServiceData?.status === 'critical') {
      edgeStatus = 'critical';
    } else if (sourceServiceData?.status === 'degraded' || targetServiceData?.status === 'degraded') {
      edgeStatus = 'degraded';
    }

    return {
      id: `e-${dep.source}-${dep.target}`,
      source: dep.source,
      target: dep.target,
      animated: edgeStatus !== 'critical',
      style: {
        strokeWidth: edgeStatus === 'critical' ? 3 : 2.5,
        stroke: edgeStatus === 'critical' ? '#ef4444' : edgeStatus === 'degraded' ? '#f59e0b' : '#10b981',
      },
    };
  });

  return getLayoutedElements(rawNodes, rawEdges);
}

export default function DependencyGraph({ 
  services = [], 
  rootCauseServiceId, 
  affectedServiceIds = [] 
}: DependencyGraphProps) {
  // Compute initial layout once on mount
  const initialElements = useRef<ReturnType<typeof createInitialElements> | null>(null);
  if (!initialElements.current) {
    initialElements.current = createInitialElements(services, rootCauseServiceId, affectedServiceIds);
  }

  const [nodes, setNodes, onNodesChange] = useNodesState<Node<ServiceNodeData>>(initialElements.current.nodes as Node<ServiceNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialElements.current.edges);

  // Update existing node data & edge styles when props change without recalculating Dagre layout
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const serviceData = services.find((s) => s.id === node.id);
        const isRootCause = node.id === rootCauseServiceId;
        const isAffected = affectedServiceIds.includes(node.id);

        return {
          ...node,
          data: {
            ...node.data,
            status: serviceData?.status || 'healthy',
            metrics: serviceData?.metrics || node.data.metrics,
            isRootCause,
            isAffected,
          },
        };
      })
    );

    setEdges((prevEdges) =>
      prevEdges.map((edge) => {
        const dep = SERVICE_DEPENDENCIES.find((d) => `e-${d.source}-${d.target}` === edge.id);
        if (!dep) return edge;
        const sourceData = services.find((s) => s.id === dep.source);
        const targetData = services.find((s) => s.id === dep.target);
        const isCritical = sourceData?.status === 'critical' || targetData?.status === 'critical';
        const isDegraded = sourceData?.status === 'degraded' || targetData?.status === 'degraded';
        const stroke = isCritical ? '#ef4444' : isDegraded ? '#f59e0b' : '#10b981';

        return {
          ...edge,
          animated: !isCritical,
          style: {
            strokeWidth: isCritical ? 3 : 2.5,
            stroke,
          },
        };
      })
    );
  }, [services, rootCauseServiceId, affectedServiceIds, setNodes, setEdges]);

  return (
    <div className="w-full h-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        className="bg-slate-950"
        minZoom={0.1}
        maxZoom={1.5}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={false}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} color="#334155" />
        <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
        <MiniMap 
          nodeColor={(node) => {
            const data = node.data as { status?: string } | undefined;
            const status = data?.status;
            if (status === 'critical') return '#ef4444';
            if (status === 'degraded') return '#f59e0b';
            if (status === 'down') return '#881337';
            return '#10b981';
          }}
          maskColor="rgba(2, 6, 23, 0.75)"
          className="bg-slate-900 border-slate-800"
        />
        <Panel position="top-right" className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 backdrop-blur shadow-xl">
          <h4 className="text-slate-200 font-semibold mb-2 text-xs uppercase tracking-wider">Legend</h4>
          <div className="flex flex-col gap-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              <span>Healthy</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse"></div>
              <span>Degraded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse"></div>
              <span>Critical / Failed</span>
            </div>
            <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-slate-800">
              <div className="w-2.5 h-2.5 rounded-full ring-2 ring-red-500 bg-red-950"></div>
              <span className="text-red-300 font-medium">Root Cause</span>
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
