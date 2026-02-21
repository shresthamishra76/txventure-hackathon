import type {
  InfrastructureNode,
  GraphEdge,
  EventType,
  SimulationResult,
  ReroutedEdge,
  NodeType,
  NodeStatus,
} from '../types.js';
import { nodes as originalNodes, edges as originalEdges } from '../data/mockData.js';

const EVENT_PRIMARY_TYPES: Record<EventType, NodeType[]> = {
  deep_freeze: ['fuel_supply'],
  flood: ['water_infrastructure'],
  power_surge: ['power_generation'],
  earthquake: ['fuel_supply', 'power_generation'],
  custom: ['power_generation'],
};

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function determinePrimaryFailures(
  nodes: InfrastructureNode[],
  eventType: EventType,
  severity: number,
  preselectedIds: string[]
): string[] {
  if (preselectedIds.length > 0) return preselectedIds;

  const primaryTypes = EVENT_PRIMARY_TYPES[eventType];
  const candidates = nodes.filter((n) => primaryTypes.includes(n.type));

  if (severity >= 7) return candidates.map((n) => n.id);
  if (severity >= 4) {
    const count = Math.min(Math.ceil(candidates.length * 0.66), candidates.length);
    return candidates.slice(0, count).map((n) => n.id);
  }
  return candidates.length > 0 ? [candidates[0].id] : [];
}

function cascadeFailures(
  nodeMap: Map<string, InfrastructureNode>,
  edges: GraphEdge[],
  failedIds: Set<string>
): string[] {
  const cascaded: string[] = [];
  let changed = true;

  while (changed) {
    changed = false;
    for (const [nodeId, node] of nodeMap) {
      if (failedIds.has(nodeId) || node.type === 'residential') continue;

      const dependencies = edges.filter((e) => e.source === nodeId);
      if (dependencies.length === 0) continue;

      const allDepsFailed = dependencies.every((e) => failedIds.has(e.target));
      if (allDepsFailed) {
        failedIds.add(nodeId);
        cascaded.push(nodeId);
        changed = true;
      }
    }
  }

  return cascaded;
}

function rerouteEdges(
  nodeMap: Map<string, InfrastructureNode>,
  edges: GraphEdge[],
  failedIds: Set<string>
): { rerouted: ReroutedEdge[]; updatedEdges: GraphEdge[] } {
  const rerouted: ReroutedEdge[] = [];
  const updatedEdges = deepClone(edges);

  for (const edge of updatedEdges) {
    if (!failedIds.has(edge.target)) continue;

    const failedNode = nodeMap.get(edge.target);
    if (!failedNode) continue;

    const alternatives = Array.from(nodeMap.values())
      .filter((n) => n.type === failedNode.type && !failedIds.has(n.id) && n.id !== edge.target);

    const altEdgeLoads = new Map<string, number>();
    for (const alt of alternatives) {
      const totalLoad = updatedEdges
        .filter((e) => e.target === alt.id)
        .reduce((sum, e) => sum + e.current_load, 0);
      const totalCapacity = updatedEdges
        .filter((e) => e.target === alt.id)
        .reduce((sum, e) => sum + e.capacity, 0) || 1;
      altEdgeLoads.set(alt.id, totalLoad / totalCapacity);
    }

    alternatives.sort((a, b) => (altEdgeLoads.get(a.id) || 0) - (altEdgeLoads.get(b.id) || 0));

    if (alternatives.length > 0) {
      const bestAlt = alternatives[0];
      rerouted.push({
        edge_id: edge.id,
        old_target: edge.target,
        new_target: bestAlt.id,
      });
      edge.target = bestAlt.id;
    }
  }

  return { rerouted, updatedEdges };
}

function findVulnerableNodes(
  nodeMap: Map<string, InfrastructureNode>,
  edges: GraphEdge[],
  failedIds: Set<string>
): string[] {
  const vulnerable: string[] = [];

  for (const [nodeId, node] of nodeMap) {
    if (failedIds.has(nodeId)) continue;

    const operationalInputs = edges.filter(
      (e) => e.source === nodeId && !failedIds.has(e.target)
    );

    if (operationalInputs.length < 2 && operationalInputs.length > 0) {
      vulnerable.push(nodeId);
    }
  }

  return vulnerable;
}

function findUnresolvableNodes(
  nodeMap: Map<string, InfrastructureNode>,
  edges: GraphEdge[],
  failedIds: Set<string>,
  reroutedEdgeIds: Set<string>
): string[] {
  const unresolvable: string[] = [];

  for (const [nodeId, node] of nodeMap) {
    if (failedIds.has(nodeId)) continue;

    const deps = edges.filter((e) => e.source === nodeId);
    if (deps.length === 0) continue;

    const allDepsFailedOrUnrerouted = deps.every(
      (e) => failedIds.has(e.target) && !reroutedEdgeIds.has(e.id)
    );

    if (allDepsFailedOrUnrerouted) {
      unresolvable.push(nodeId);
    }
  }

  return unresolvable;
}

function buildSummaryContext(
  nodeMap: Map<string, InfrastructureNode>,
  result: Omit<SimulationResult, 'summary_prompt_context'>,
  eventType: EventType,
  severity: number
): string {
  const getName = (id: string) => nodeMap.get(id)?.name || id;

  const lines: string[] = [
    `Event: ${eventType} at severity ${severity}/10`,
    `Directly failed nodes: ${result.failed_nodes.map(getName).join(', ')}`,
    `Cascade-failed nodes: ${result.cascaded_nodes.map(getName).join(', ') || 'none'}`,
    `Rerouted dependencies: ${result.rerouted_edges.map((r) => `${r.edge_id}: ${getName(r.old_target)} → ${getName(r.new_target)}`).join('; ') || 'none'}`,
    `Vulnerable nodes (< 2 inputs): ${result.vulnerable_nodes.map(getName).join(', ') || 'none'}`,
    `Unresolvable nodes: ${result.unresolvable_nodes.map(getName).join(', ') || 'none'}`,
  ];

  return lines.join('\n');
}

export function runSimulation(
  eventType: EventType,
  severity: number,
  affectedNodeIds: string[] = []
): SimulationResult {
  const nodesCopy = deepClone(originalNodes);
  const edgesCopy = deepClone(originalEdges);
  const nodeMap = new Map(nodesCopy.map((n) => [n.id, n]));

  const primaryFailedIds = determinePrimaryFailures(nodesCopy, eventType, severity, affectedNodeIds);
  const failedSet = new Set(primaryFailedIds);

  for (const id of failedSet) {
    const node = nodeMap.get(id);
    if (node) node.status = 'failed';
  }

  const cascadedIds = cascadeFailures(nodeMap, edgesCopy, failedSet);

  for (const id of cascadedIds) {
    const node = nodeMap.get(id);
    if (node) node.status = 'failed';
  }

  const { rerouted, updatedEdges } = rerouteEdges(nodeMap, edgesCopy, failedSet);
  const reroutedEdgeIds = new Set(rerouted.map((r) => r.edge_id));

  const vulnerableNodes = findVulnerableNodes(nodeMap, updatedEdges, failedSet);
  const unresolvableNodes = findUnresolvableNodes(nodeMap, updatedEdges, failedSet, reroutedEdgeIds);

  const partialResult = {
    failed_nodes: primaryFailedIds,
    cascaded_nodes: cascadedIds,
    rerouted_edges: rerouted,
    vulnerable_nodes: vulnerableNodes,
    unresolvable_nodes: unresolvableNodes,
  };

  const summaryContext = buildSummaryContext(nodeMap, partialResult, eventType, severity);

  return { ...partialResult, summary_prompt_context: summaryContext };
}
