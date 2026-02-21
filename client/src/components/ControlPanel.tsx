import React, { useState } from 'react';
import type { NodeType, EventType, SimulationResult } from '../types';
import { NODE_COLORS, NODE_ICONS, NODE_LABELS } from '../types';

const ALL_NODE_TYPES: NodeType[] = [
  'power_generation',
  'water_infrastructure',
  'fuel_supply',
  'food_source',
  'emergency_services',
  'residential',
];

const EVENT_TYPES: { value: EventType; label: string }[] = [
  { value: 'deep_freeze', label: 'Deep Freeze' },
  { value: 'flood', label: 'Flood' },
  { value: 'power_surge', label: 'Power Surge' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'custom', label: 'Custom' },
];

interface Props {
  layers: { graph: boolean; map2d: boolean; map3d: boolean };
  onToggleLayer: (layer: 'graph' | 'map2d' | 'map3d') => void;
  visibleTypes: Set<NodeType>;
  onToggleType: (type: NodeType) => void;
  showVulnerability: boolean;
  onToggleVulnerability: () => void;
  vulnerableCount: number;
  onSimulate: (eventType: EventType, severity: number) => void;
  onReset: () => void;
  simulating: boolean;
  simResult: SimulationResult | null;
}

export default function ControlPanel({
  layers,
  onToggleLayer,
  visibleTypes,
  onToggleType,
  showVulnerability,
  onToggleVulnerability,
  vulnerableCount,
  onSimulate,
  onReset,
  simulating,
  simResult,
}: Props) {
  const [eventType, setEventType] = useState<EventType>('deep_freeze');
  const [severity, setSeverity] = useState(8);

  return (
    <div className="w-[280px] h-full bg-gray-900 text-white flex flex-col overflow-y-auto custom-scrollbar border-r border-gray-700">
      {/* Layer Toggles */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Layers
        </h3>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={layers.graph} onChange={() => onToggleLayer('graph')} className="accent-blue-500 w-4 h-4" />
          <span className="text-sm">Node Graph Layer</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer mb-2">
          <input type="checkbox" checked={layers.map2d} onChange={() => onToggleLayer('map2d')} className="accent-blue-500 w-4 h-4" />
          <span className="text-sm">2D Map Layer</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={layers.map3d} onChange={() => onToggleLayer('map3d')} className="accent-blue-500 w-4 h-4" />
          <span className="text-sm text-gray-500">3D Map Layer (coming soon)</span>
        </label>
      </div>

      {/* Filter by Node Type */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Filter by Node Type
        </h3>
        {ALL_NODE_TYPES.map((type) => (
          <label key={type} className="flex items-center gap-2 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={visibleTypes.has(type)}
              onChange={() => onToggleType(type)}
              className="w-4 h-4"
              style={{ accentColor: NODE_COLORS[type] }}
            />
            <span className="text-sm">
              {NODE_ICONS[type]} {NODE_LABELS[type]}
            </span>
          </label>
        ))}
      </div>

      {/* Event Simulator */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Event Simulator
        </h3>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as EventType)}
          className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm mb-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          {EVENT_TYPES.map((evt) => (
            <option key={evt.value} value={evt.value}>{evt.label}</option>
          ))}
        </select>

        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>Severity</span>
            <span className="font-mono text-white">{severity}/10</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-red-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-0.5">
            <span>Minor</span>
            <span>Catastrophic</span>
          </div>
        </div>

        <button
          onClick={() => onSimulate(eventType, severity)}
          disabled={simulating}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded transition-colors text-sm mb-2"
        >
          {simulating ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Simulating...
            </span>
          ) : (
            'Simulate Event'
          )}
        </button>
        {simResult && (
          <button
            onClick={onReset}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors text-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* Simulation Results */}
      {simResult && (
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
            Simulation Impact
          </h3>
          <div className="space-y-2">
            <ResultRow
              color="bg-red-500"
              label="Direct Failures"
              count={simResult.failed_nodes.length}
            />
            <ResultRow
              color="bg-red-800"
              label="Cascade Failures"
              count={simResult.cascaded_nodes.length}
            />
            <ResultRow
              color="bg-purple-500"
              label="Rerouted"
              count={simResult.rerouted_edges.length}
            />
            <ResultRow
              color="bg-orange-500"
              label="Now Vulnerable"
              count={simResult.vulnerable_nodes.length}
            />
            <ResultRow
              color="bg-red-950"
              label="No Backup Available"
              count={simResult.unresolvable_nodes.length}
              critical
            />
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Total affected</span>
              <span className="text-sm font-bold text-red-400">
                {simResult.failed_nodes.length +
                  simResult.cascaded_nodes.length +
                  simResult.vulnerable_nodes.length +
                  simResult.unresolvable_nodes.length}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Vulnerability Report */}
      <div className="p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
          Vulnerability Report
        </h3>
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={showVulnerability}
            onChange={onToggleVulnerability}
            className="accent-orange-500 w-4 h-4"
          />
          <span className="text-sm">Show vulnerability overlay</span>
        </label>
        <div className={`rounded p-3 flex items-center gap-3 ${vulnerableCount > 0 ? 'bg-orange-900/30 border border-orange-700/50' : 'bg-gray-800'}`}>
          <div className={`rounded-full w-10 h-10 flex items-center justify-center font-bold text-lg ${vulnerableCount > 0 ? 'bg-orange-500/30 text-orange-400' : 'bg-gray-700 text-gray-400'}`}>
            {vulnerableCount}
          </div>
          <div>
            <div className={`text-sm font-medium ${vulnerableCount > 0 ? 'text-orange-300' : 'text-gray-300'}`}>
              node{vulnerableCount !== 1 ? 's' : ''} at risk
            </div>
            {vulnerableCount > 0 && (
              <div className="text-[10px] text-orange-400/70 mt-0.5">
                Single point of failure — &lt; 2 dependencies
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultRow({ color, label, count, critical }: { color: string; label: string; count: number; critical?: boolean }) {
  if (count === 0 && !critical) return null;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`} />
        <span className="text-xs text-gray-300">{label}</span>
      </div>
      <span className={`text-xs font-bold ${count > 0 ? (critical ? 'text-red-300' : 'text-white') : 'text-gray-500'}`}>
        {count}
      </span>
    </div>
  );
}
