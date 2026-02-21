import React, { useState, useEffect } from 'react';
import type { SimulationResult, InfrastructureNode } from '../types';

interface Props {
  simResult: SimulationResult | null;
  suggestion: string | null;
  suggesting: boolean;
  nodes: InfrastructureNode[];
}

export default function AISuggestionPanel({ simResult, suggestion, suggesting, nodes }: Props) {
  const [expanded, setExpanded] = useState(false);

  const nameMap = new Map(nodes.map((n) => [n.id, n.name]));
  const getName = (id: string) => nameMap.get(id) || id;

  useEffect(() => {
    if (simResult) setExpanded(true);
  }, [simResult]);

  if (!simResult) return null;

  const totalAffected =
    simResult.failed_nodes.length +
    simResult.cascaded_nodes.length;

  return (
    <div className="absolute bottom-0 left-[280px] right-0 z-[500] transition-all duration-300">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full bg-gray-900/95 backdrop-blur-sm border-t border-gray-700 px-4 py-2 flex items-center justify-between text-white hover:bg-gray-800/95 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-400 text-sm">✦</span>
          <span className="text-sm font-medium">AI Analysis</span>
          {suggesting && (
            <svg className="animate-spin h-3.5 w-3.5 text-purple-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalAffected > 0 && (
            <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {totalAffected} failed
            </span>
          )}
          {simResult.rerouted_edges.length > 0 && (
            <span className="bg-purple-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {simResult.rerouted_edges.length} rerouted
            </span>
          )}
          {simResult.unresolvable_nodes.length > 0 && (
            <span className="bg-red-900 text-red-200 text-xs px-2 py-0.5 rounded-full font-medium">
              {simResult.unresolvable_nodes.length} no backup
            </span>
          )}
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 px-4 py-4 max-h-[240px] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-[1fr_280px] gap-6">
            {/* AI Summary */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                Summary
              </h4>
              {suggesting ? (
                <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating AI analysis...
                </div>
              ) : (
                <p className="text-sm text-gray-200 leading-relaxed">
                  {suggestion || 'No suggestion available.'}
                </p>
              )}
            </div>

            {/* Impact details */}
            <div className="space-y-3">
              {simResult.rerouted_edges.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    Rerouted Dependencies
                  </h4>
                  <ul className="space-y-1">
                    {simResult.rerouted_edges.slice(0, 5).map((r) => (
                      <li key={r.edge_id} className="text-xs text-gray-300 flex items-start gap-1.5">
                        <span className="text-purple-400 mt-0.5 shrink-0">→</span>
                        <span>
                          <span className="text-red-400 line-through">{getName(r.old_target)}</span>
                          {' '}
                          <span className="text-purple-400 font-medium">{getName(r.new_target)}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {simResult.unresolvable_nodes.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-red-400/80 mb-1.5">
                    No Backup Available
                  </h4>
                  <ul className="space-y-0.5">
                    {simResult.unresolvable_nodes.map((id) => (
                      <li key={id} className="text-xs text-red-300 flex items-center gap-1.5">
                        <span className="text-red-500">✕</span>
                        {getName(id)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
