import React, { useState, useMemo, useCallback } from 'react';
import type { NodeType, EventType } from './types';
import { useGraph } from './hooks/useGraph';
import { useSimulation } from './hooks/useSimulation';
import ControlPanel from './components/ControlPanel';
import MapCanvas from './components/MapCanvas';
import AISuggestionPanel from './components/AISuggestionPanel';

const ALL_NODE_TYPES: NodeType[] = [
  'power_generation',
  'water_infrastructure',
  'fuel_supply',
  'food_source',
  'emergency_services',
  'residential',
];

export default function App() {
  const { graphData, loading, error, getVulnerableNodes, resetGraph } = useGraph();
  const { simResult, suggestion, simulating, suggesting, simulate, reset: resetSim } =
    useSimulation();

  const [layers, setLayers] = useState({ graph: true, map2d: true, map3d: false });
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(new Set(ALL_NODE_TYPES));
  const [showVulnerability, setShowVulnerability] = useState(true);

  const vulnerableNodes = useMemo(() => getVulnerableNodes(), [getVulnerableNodes]);

  const handleToggleLayer = useCallback((layer: 'graph' | 'map2d' | 'map3d') => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleToggleType = useCallback((type: NodeType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const handleSimulate = useCallback(
    (eventType: EventType, severity: number) => {
      simulate(eventType, severity);
    },
    [simulate]
  );

  const handleReset = useCallback(() => {
    resetSim();
    resetGraph();
  }, [resetSim, resetGraph]);

  if (loading) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-gray-400 text-sm">Loading infrastructure data...</p>
        </div>
      </div>
    );
  }

  if (error || !graphData) {
    return (
      <div className="h-screen w-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-400 text-4xl mb-4">⚠</div>
          <h2 className="text-white text-lg font-semibold mb-2">Connection Error</h2>
          <p className="text-gray-400 text-sm mb-4">{error || 'Failed to load data.'}</p>
          <button
            onClick={resetGraph}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-gray-950 overflow-hidden">
      {/* Header */}
      <header className="h-12 bg-gray-900 border-b border-gray-700 flex items-center px-4 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗺</span>
          <h1 className="text-white font-semibold text-sm tracking-wide">
            Austin Infrastructure Dependency Mapper
          </h1>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            {graphData.nodes.length} nodes
          </span>
          <span>{graphData.edges.length} edges</span>
        </div>
      </header>

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden relative">
        <ControlPanel
          layers={layers}
          onToggleLayer={handleToggleLayer}
          visibleTypes={visibleTypes}
          onToggleType={handleToggleType}
          showVulnerability={showVulnerability}
          onToggleVulnerability={() => setShowVulnerability((v) => !v)}
          vulnerableCount={vulnerableNodes.length}
          onSimulate={handleSimulate}
          onReset={handleReset}
          simulating={simulating}
          simResult={simResult}
        />

        <div className="flex-1 relative">
          <MapCanvas
            nodes={graphData.nodes}
            edges={graphData.edges}
            layers={layers}
            visibleTypes={visibleTypes}
            showVulnerability={showVulnerability}
            vulnerableNodes={vulnerableNodes}
            simResult={simResult}
          />
        </div>

        <AISuggestionPanel
          simResult={simResult}
          suggestion={suggestion}
          suggesting={suggesting}
          nodes={graphData.nodes}
        />
      </div>
    </div>
  );
}
