import networkx as nx
from typing import List, Dict, Set, Optional, Tuple
from ..simulator.service_graph import SERVICE_DEFINITIONS, TOPOLOGY_EDGES

class GraphStore:
    def __init__(self):
        self.graph = nx.DiGraph()
        self._build_default_topology()

    def _build_default_topology(self):
        for svc_id, data in SERVICE_DEFINITIONS.items():
            self.graph.add_node(
                svc_id,
                name=data["name"],
                icon=data["icon"],
                description=data["description"]
            )

        for edge in TOPOLOGY_EDGES:
            # edge['source'] calls edge['target']
            self.graph.add_edge(edge["source"], edge["target"], weight=1.0)

    def get_callees(self, service_id: str) -> List[str]:
        """Services that service_id calls directly (downstream dependencies)."""
        if not self.graph.has_node(service_id):
            return []
        return list(self.graph.successors(service_id))

    def get_callers(self, service_id: str) -> List[str]:
        """Services that call service_id directly (upstream callers)."""
        if not self.graph.has_node(service_id):
            return []
        return list(self.graph.predecessors(service_id))

    def get_all_downstream(self, service_id: str) -> Set[str]:
        """All transitively called dependencies (descendants)."""
        if not self.graph.has_node(service_id):
            return set()
        return nx.descendants(self.graph, service_id)

    def get_all_upstream(self, service_id: str) -> Set[str]:
        """All transitively calling upstream services (ancestors / impacted clients)."""
        if not self.graph.has_node(service_id):
            return set()
        return nx.ancestors(self.graph, service_id)

    def find_path(self, source: str, target: str) -> Optional[List[str]]:
        try:
            return nx.shortest_path(self.graph, source=source, target=target)
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            return None

    def get_weakly_connected_components(self, nodes: List[str]) -> List[List[str]]:
        """Decomposes a subset of nodes into connected graph components."""
        subgraph = self.graph.subgraph(nodes).to_undirected()
        return [list(c) for c in nx.connected_components(subgraph)]

    def infer_missing_links(self, anomalous_services: List[str]) -> List[Tuple[str, str, str]]:
        """
        If anomalous services contains A and C, but not B, and there is a direct path A -> B -> C,
        infers that B is a missing bridge event.
        Returns list of (source, inferred_bridge, target).
        """
        inferred = []
        node_set = set(anomalous_services)

        for u in anomalous_services:
            for v in anomalous_services:
                if u != v:
                    try:
                        paths = list(nx.all_shortest_paths(self.graph, source=u, target=v))
                        for path in paths:
                            # Path is [u, x1, x2, ..., v]
                            if len(path) == 3 and path[1] not in node_set:
                                inferred.append((u, path[1], v))
                    except (nx.NetworkXNoPath, nx.NodeNotFound):
                        continue
        return list(set(inferred))

    def to_dict(self) -> dict:
        nodes = []
        for n, data in self.graph.nodes(data=True):
            nodes.append({"id": n, **data})
        edges = []
        for u, v, data in self.graph.edges(data=True):
            edges.append({"source": u, "target": v, **data})
        return {"nodes": nodes, "edges": edges}
