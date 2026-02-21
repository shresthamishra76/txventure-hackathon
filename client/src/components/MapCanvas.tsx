import React, { useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import type {
  InfrastructureNode,
  GraphEdge,
  NodeType,
  SimulationResult,
  ReroutedEdge,
} from '../types';
import { NODE_COLORS, NODE_ICONS, STATUS_RING_COLORS } from '../types';
import NodeTooltip from './NodeTooltip';
import EdgeTooltip from './EdgeTooltip';

interface Props {
  nodes: InfrastructureNode[];
  edges: GraphEdge[];
  layers: { graph: boolean; map2d: boolean; map3d: boolean };
  visibleTypes: Set<NodeType>;
  showVulnerability: boolean;
  vulnerableNodes: string[];
  simResult: SimulationResult | null;
}

const AUSTIN_CENTER: [number, number] = [30.2672, -97.7431];
const DEFAULT_ZOOM = 11;

type NodeSimStatus = 'failed' | 'cascaded' | 'unresolvable' | 'sim-vulnerable' | 'rerouted' | null;

const STATUS_BADGE_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  failed:         { label: 'FAILED',        bg: 'bg-red-600',    text: 'text-white' },
  cascaded:       { label: 'CASCADE FAIL',  bg: 'bg-red-800',    text: 'text-red-100' },
  unresolvable:   { label: 'NO BACKUP',     bg: 'bg-red-950',    text: 'text-red-200' },
  'sim-vulnerable': { label: 'AT RISK',     bg: 'bg-orange-600', text: 'text-white' },
  rerouted:       { label: 'REROUTED',      bg: 'bg-purple-600', text: 'text-white' },
  vulnerable:     { label: 'VULNERABLE',    bg: 'bg-orange-500', text: 'text-white' },
};

interface GraphOverlayProps {
  nodes: InfrastructureNode[];
  edges: GraphEdge[];
  visibleTypes: Set<NodeType>;
  showVulnerability: boolean;
  vulnerableNodes: string[];
  simResult: SimulationResult | null;
}

function GraphOverlay({
  nodes,
  edges,
  visibleTypes,
  showVulnerability,
  vulnerableNodes,
  simResult,
}: GraphOverlayProps) {
  const map = useMap();
  const [, setRenderTick] = useState(0);
  const [hoveredNode, setHoveredNode] = useState<{
    node: InfrastructureNode;
    x: number;
    y: number;
  } | null>(null);
  const [hoveredEdge, setHoveredEdge] = useState<{
    edge: GraphEdge;
    x: number;
    y: number;
  } | null>(null);

  useMapEvents({
    moveend: () => setRenderTick((t) => t + 1),
    zoomend: () => setRenderTick((t) => t + 1),
  });

  const nodeMap = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);

  const filteredNodes = useMemo(
    () => nodes.filter((n) => visibleTypes.has(n.type)),
    [nodes, visibleTypes]
  );

  const reroutedEdgeMap = useMemo(() => {
    const m = new Map<string, ReroutedEdge>();
    if (simResult) {
      for (const r of simResult.rerouted_edges) m.set(r.edge_id, r);
    }
    return m;
  }, [simResult]);

  const reroutedNodeIds = useMemo(() => {
    if (!simResult) return new Set<string>();
    const ids = new Set<string>();
    for (const r of simResult.rerouted_edges) ids.add(r.new_target);
    return ids;
  }, [simResult]);

  const failedSet = useMemo(() => {
    if (!simResult) return new Set<string>();
    return new Set([...simResult.failed_nodes, ...simResult.cascaded_nodes]);
  }, [simResult]);

  const getNodeScreenPos = useCallback(
    (node: InfrastructureNode) => {
      const point = map.latLngToContainerPoint([node.lat, node.lng]);
      return { x: point.x, y: point.y };
    },
    [map]
  );

  const getNodeSimStatus = useCallback(
    (nodeId: string): NodeSimStatus => {
      if (!simResult) return null;
      if (simResult.failed_nodes.includes(nodeId)) return 'failed';
      if (simResult.cascaded_nodes.includes(nodeId)) return 'cascaded';
      if (simResult.unresolvable_nodes.includes(nodeId)) return 'unresolvable';
      if (simResult.vulnerable_nodes.includes(nodeId)) return 'sim-vulnerable';
      if (reroutedNodeIds.has(nodeId)) return 'rerouted';
      return null;
    },
    [simResult, reroutedNodeIds]
  );

  const getEdgeColor = useCallback(
    (edge: GraphEdge) => {
      if (reroutedEdgeMap.has(edge.id)) return '#A855F7';
      if (failedSet.has(edge.target) || failedSet.has(edge.source)) return '#EF4444';
      if (edge.current_load / edge.capacity > 0.85) return '#F97316';
      if (edge.critical) return '#EF4444';
      return '#4B5563';
    },
    [reroutedEdgeMap, failedSet]
  );

  const visibleEdges = useMemo(
    () =>
      edges.filter((e) => {
        const src = nodeMap.get(e.source);
        const tgt = nodeMap.get(e.target);
        if (!src || !tgt) return false;
        return visibleTypes.has(src.type) && visibleTypes.has(tgt.type);
      }),
    [edges, nodeMap, visibleTypes]
  );

  return (
    <>
      {/* SVG layer for edges and vulnerability rings */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 400 }}
      >
        <defs>
          <marker id="arrow-gray" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#4B5563" />
          </marker>
          <marker id="arrow-red" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#EF4444" />
          </marker>
          <marker id="arrow-purple" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#A855F7" />
          </marker>
          <marker id="arrow-orange" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" fill="#F97316" />
          </marker>

          <filter id="glow-orange" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Vulnerability glow rings — rendered UNDER edges */}
        {showVulnerability &&
          filteredNodes
            .filter((n) => vulnerableNodes.includes(n.id) && !failedSet.has(n.id))
            .map((node) => {
              const pos = getNodeScreenPos(node);
              return (
                <g key={`vuln-ring-${node.id}`}>
                  <circle cx={pos.x} cy={pos.y} r={28} fill="none" stroke="#FB923C" strokeWidth={3} opacity={0.6} filter="url(#glow-orange)" />
                  <circle cx={pos.x} cy={pos.y} r={24} fill="none" stroke="#FB923C" strokeWidth={2} opacity={0.4}>
                    <animate attributeName="r" values="24;34;24" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx={pos.x} cy={pos.y} r={20} fill="none" stroke="#FB923C" strokeWidth={1.5} opacity={0.3}>
                    <animate attributeName="r" values="20;38;20" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;0;0.3" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

        {/* Failed node glow rings */}
        {simResult &&
          filteredNodes
            .filter((n) => failedSet.has(n.id))
            .map((node) => {
              const pos = getNodeScreenPos(node);
              const isCascade = simResult.cascaded_nodes.includes(node.id);
              return (
                <g key={`fail-ring-${node.id}`}>
                  <circle cx={pos.x} cy={pos.y} r={26} fill="none" stroke={isCascade ? '#991B1B' : '#EF4444'} strokeWidth={3} opacity={0.7} filter="url(#glow-red)" />
                  <circle cx={pos.x} cy={pos.y} r={22} fill="none" stroke="#EF4444" strokeWidth={2} opacity={0.5}>
                    <animate attributeName="r" values="22;32;22" dur="1.4s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.4s" repeatCount="indefinite" />
                  </circle>
                </g>
              );
            })}

        {/* Edges */}
        {visibleEdges.map((edge) => {
          const srcNode = nodeMap.get(edge.source);
          const tgtNode = nodeMap.get(edge.target);
          if (!srcNode || !tgtNode) return null;

          const src = getNodeScreenPos(srcNode);
          const tgt = getNodeScreenPos(tgtNode);
          const color = getEdgeColor(edge);
          const loadRatio = edge.current_load / edge.capacity;
          const thickness = Math.max(1.5, loadRatio * 5);
          const isRerouted = reroutedEdgeMap.has(edge.id);
          const isFailed = failedSet.has(edge.target) || failedSet.has(edge.source);

          const arrowId =
            color === '#A855F7' ? 'arrow-purple' :
            color === '#EF4444' ? 'arrow-red' :
            color === '#F97316' ? 'arrow-orange' : 'arrow-gray';

          return (
            <g key={edge.id}>
              {/* Glow under for failed/rerouted edges */}
              {(isFailed || isRerouted) && (
                <line
                  x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                  stroke={color}
                  strokeWidth={thickness + 4}
                  opacity={0.15}
                  strokeLinecap="round"
                />
              )}
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke={color}
                strokeWidth={thickness}
                strokeDasharray={isRerouted ? '10 5' : isFailed ? '6 3' : 'none'}
                className={isRerouted ? 'animated-dash' : ''}
                markerEnd={`url(#${arrowId})`}
                opacity={isFailed ? 0.8 : 0.6}
                strokeLinecap="round"
              />
              <line
                x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
                stroke="transparent"
                strokeWidth={14}
                className="pointer-events-auto cursor-pointer"
                onMouseEnter={(e) => setHoveredEdge({ edge, x: e.clientX, y: e.clientY })}
                onMouseLeave={() => setHoveredEdge(null)}
              />
            </g>
          );
        })}
      </svg>

      {/* Node circles + status badges */}
      {filteredNodes.map((node) => {
        const pos = getNodeScreenPos(node);
        const isFailed = failedSet.has(node.id);
        const isVulnerable = showVulnerability && vulnerableNodes.includes(node.id);
        const simStatus = getNodeSimStatus(node.id);
        const baseColor = NODE_COLORS[node.type];

        let ringColor = STATUS_RING_COLORS.operational;
        let pulseClass = '';
        let badgeKey: string | null = null;
        const nodeSize = isFailed || simStatus === 'unresolvable' ? 34 : 28;

        if (simStatus === 'failed') {
          ringColor = '#EF4444';
          pulseClass = 'pulse-red';
          badgeKey = 'failed';
        } else if (simStatus === 'cascaded') {
          ringColor = '#991B1B';
          pulseClass = 'pulse-cascade';
          badgeKey = 'cascaded';
        } else if (simStatus === 'unresolvable') {
          ringColor = '#7F1D1D';
          pulseClass = 'pulse-unresolvable';
          badgeKey = 'unresolvable';
        } else if (simStatus === 'sim-vulnerable') {
          ringColor = STATUS_RING_COLORS.vulnerable;
          pulseClass = 'pulse-orange';
          badgeKey = 'sim-vulnerable';
        } else if (simStatus === 'rerouted') {
          ringColor = '#A855F7';
          badgeKey = 'rerouted';
        } else if (isVulnerable && !simResult) {
          ringColor = STATUS_RING_COLORS.vulnerable;
          pulseClass = 'pulse-orange';
          badgeKey = 'vulnerable';
        }

        const half = nodeSize / 2;
        const badge = badgeKey ? STATUS_BADGE_CONFIG[badgeKey] : null;

        return (
          <React.Fragment key={node.id}>
            <div
              className={`absolute pointer-events-auto cursor-pointer transition-all duration-200 hover:scale-125 ${pulseClass}`}
              style={{
                left: pos.x - half,
                top: pos.y - half,
                width: nodeSize,
                height: nodeSize,
                zIndex: isFailed ? 460 : 450,
                borderRadius: '50%',
                backgroundColor: isFailed ? '#1F1F1F' : baseColor,
                border: `3px solid ${ringColor}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isFailed ? '16px' : '14px',
                boxShadow: isFailed
                  ? `0 0 20px rgba(239,68,68,0.5)`
                  : isVulnerable
                  ? `0 0 16px rgba(251,146,60,0.4)`
                  : `0 0 6px ${baseColor}40`,
              }}
              onMouseEnter={(e) => setHoveredNode({ node, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {isFailed ? '✕' : NODE_ICONS[node.type]}
            </div>

            {/* Status badge below node */}
            {badge && (
              <div
                className={`absolute pointer-events-none status-badge ${badge.bg} ${badge.text} text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap tracking-wide`}
                style={{
                  left: pos.x,
                  top: pos.y + half + 4,
                  transform: 'translateX(-50%)',
                  zIndex: 470,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
                }}
              >
                {badge.label}
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Map legend */}
      <div
        className="absolute pointer-events-none bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-2.5 text-[10px] text-gray-300 space-y-1.5"
        style={{ bottom: 16, right: 16, zIndex: 500 }}
      >
        <div className="text-[9px] font-semibold uppercase tracking-wider text-gray-500 mb-1">Status</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Operational</div>
        <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block shadow-[0_0_6px_rgba(251,146,60,0.6)]" /> Vulnerable</div>
        {simResult && (
          <>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block shadow-[0_0_6px_rgba(239,68,68,0.6)]" /> Failed</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-900 inline-block" /> Cascade Fail</div>
            <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Rerouted</div>
            <div className="border-t border-gray-700 pt-1.5 mt-1">
              <div className="flex items-center gap-1.5"><span className="w-4 border-t-2 border-red-500 border-dashed" /> Failed Edge</div>
              <div className="flex items-center gap-1.5 mt-1"><span className="w-4 border-t-2 border-purple-500 border-dashed" /> Rerouted Edge</div>
            </div>
          </>
        )}
      </div>

      {hoveredNode && (
        <NodeTooltip node={hoveredNode.node} x={hoveredNode.x} y={hoveredNode.y} />
      )}
      {hoveredEdge && (
        <EdgeTooltip
          edge={hoveredEdge.edge}
          x={hoveredEdge.x}
          y={hoveredEdge.y}
          sourceNodeName={nodeMap.get(hoveredEdge.edge.source)?.name || hoveredEdge.edge.source}
          targetNodeName={nodeMap.get(hoveredEdge.edge.target)?.name || hoveredEdge.edge.target}
        />
      )}
    </>
  );
}

export default function MapCanvas({
  nodes,
  edges,
  layers,
  visibleTypes,
  showVulnerability,
  vulnerableNodes,
  simResult,
}: Props) {
  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={AUSTIN_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={true}
        style={{ background: '#1a1a2e' }}
      >
        {layers.map2d && (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
        )}
        {layers.graph && (
          <GraphOverlay
            nodes={nodes}
            edges={edges}
            visibleTypes={visibleTypes}
            showVulnerability={showVulnerability}
            vulnerableNodes={vulnerableNodes}
            simResult={simResult}
          />
        )}
      </MapContainer>
    </div>
  );
}
