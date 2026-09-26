import Dagre from '@dagrejs/dagre';
import { Node, Edge } from '@xyflow/react';

export function getLayoutedElements(nodes: Node[], edges: Edge[]): { nodes: Node[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'TB', nodesep: 50, ranksep: 80 });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));
  nodes.forEach((node) => {
    // Custom ServiceNode dimensions
    g.setNode(node.id, { width: 220, height: 160 });
  });

  Dagre.layout(g);

  // Find minX and minY to normalize coordinate origin cleanly
  let minX = Infinity;
  let minY = Infinity;
  nodes.forEach((node) => {
    const pos = g.node(node.id);
    if (pos) {
      minX = Math.min(minX, pos.x - 110);
      minY = Math.min(minY, pos.y - 80);
    }
  });

  if (!isFinite(minX)) minX = 0;
  if (!isFinite(minY)) minY = 0;

  return {
    nodes: nodes.map((node) => {
      const position = g.node(node.id);
      return {
        ...node,
        width: 220,
        height: 160,
        position: {
          x: Math.round(position.x - 110 - minX + 40),
          y: Math.round(position.y - 80 - minY + 40),
        },
      };
    }),
    edges,
  };
}
