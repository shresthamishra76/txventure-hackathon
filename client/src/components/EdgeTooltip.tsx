import React, { useRef, useLayoutEffect, useState } from 'react';
import type { GraphEdge } from '../types';

interface Props {
  edge: GraphEdge;
  x: number;
  y: number;
  sourceNodeName: string;
  targetNodeName: string;
}

export default function EdgeTooltip({ edge, x, y, sourceNodeName, targetNodeName }: Props) {
  const loadRatio = ((edge.current_load / edge.capacity) * 100).toFixed(0);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: x + 12, top: y - 10 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pad = 8;
    let left = x + 12;
    let top = y - 10;
    if (left + rect.width > window.innerWidth - pad) left = x - rect.width - 12;
    if (top + rect.height > window.innerHeight - pad) top = window.innerHeight - rect.height - pad;
    if (top < pad) top = pad;
    if (left < pad) left = pad;
    setPos({ left, top });
  }, [x, y]);

  return (
    <div
      ref={ref}
      className="fixed z-[9999] pointer-events-none bg-gray-900/95 text-white rounded-lg shadow-xl p-3 min-w-[200px] backdrop-blur-sm border border-gray-700"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="text-xs text-gray-400 mb-1">{edge.type.replace('_', ' ')}</div>
      <div className="text-sm font-medium mb-2">
        {sourceNodeName} → {targetNodeName}
      </div>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-400">Capacity</span>
          <span>{edge.capacity}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Current Load</span>
          <span>{edge.current_load}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Utilization</span>
          <span>{loadRatio}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Critical</span>
          <span className={edge.critical ? 'text-red-400' : 'text-gray-300'}>
            {edge.critical ? 'Yes' : 'No'}
          </span>
        </div>
      </div>
    </div>
  );
}
