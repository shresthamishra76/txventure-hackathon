import { useState, useEffect, useCallback } from 'react';
import type { GraphData, InfrastructureNode, GraphEdge } from '../types';

export function useGraph() {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph');
      if (!res.ok) throw new Error('Failed to fetch graph data');
      const data: GraphData = await res.json();
      setGraphData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGraph();
  }, [fetchGraph]);

  const getVulnerableNodes = useCallback((): string[] => {
    if (!graphData) return [];
    return graphData.nodes
      .filter((node) => {
        const incomingEdges = graphData.edges.filter((e) => e.source === node.id);
        return incomingEdges.length < 2 && incomingEdges.length > 0;
      })
      .map((n) => n.id);
  }, [graphData]);

  const resetGraph = useCallback(() => {
    fetchGraph();
  }, [fetchGraph]);

  return { graphData, loading, error, getVulnerableNodes, resetGraph };
}
