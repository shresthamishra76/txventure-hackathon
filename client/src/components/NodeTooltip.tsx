import React, { useRef, useLayoutEffect, useState } from 'react';
import type { InfrastructureNode } from '../types';
import { NODE_ICONS, NODE_LABELS, STATUS_RING_COLORS } from '../types';

interface Props {
  node: InfrastructureNode;
  x: number;
  y: number;
}

function getNodeFields(node: InfrastructureNode): Record<string, string | number | boolean> {
  switch (node.type) {
    case 'power_generation':
      return {
        'Capacity': `${node.capacity_mw} MW`,
        'Fuel Source': node.fuel_source,
        'Voltage': `${node.output_voltage_kv} kV`,
        'Operator': node.operator,
      };
    case 'water_infrastructure':
      return {
        'Capacity': `${node.capacity_mgd} MGD`,
        'Pressure': `${node.pressure_psi} PSI`,
        'Storage': `${node.storage_mil_gal}M gal`,
        'Zone': node.service_zone,
      };
    case 'fuel_supply':
      return {
        'Capacity': `${node.capacity_mmcfd} MMCFD`,
        'Pressure': `${node.pressure_psi} PSI`,
        'Pipeline': `${node.pipeline_diameter_in}"`,
        'Operator': node.operator,
      };
    case 'food_source':
      return {
        'Capacity': `${node.capacity_tons_per_day} tons/day`,
        'Refrigeration': `${node.refrigeration_units} units`,
        'Backup Gen': node.backup_generator ? 'Yes' : 'No',
        'Radius': `${node.service_radius_miles} mi`,
      };
    case 'emergency_services':
      return {
        'Units': node.unit_count,
        'Response': `${node.response_time_min} min`,
        'Zone': node.coverage_zone,
        'Fuel Reserve': `${node.fuel_reserve_days} days`,
      };
    case 'residential':
      return {
        'Households': node.household_count.toLocaleString(),
        'Power Demand': `${node.avg_power_demand_kw} kW`,
        'Water Demand': `${node.avg_water_demand_gpd} GPD`,
        'Population': node.population_estimate.toLocaleString(),
      };
  }
}

export default function NodeTooltip({ node, x, y }: Props) {
  const fields = getNodeFields(node);
  const statusColor = STATUS_RING_COLORS[node.status];
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
      className="fixed z-[9999] pointer-events-none bg-gray-900/95 text-white rounded-lg shadow-xl p-3 min-w-[220px] backdrop-blur-sm border border-gray-700"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
        <span className="text-lg">{NODE_ICONS[node.type]}</span>
        <div>
          <div className="font-semibold text-sm leading-tight">{node.name}</div>
          <div className="text-xs text-gray-400">{NODE_LABELS[node.type]}</div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 mb-2">
        <span
          className="inline-block w-2 h-2 rounded-full"
          style={{ backgroundColor: statusColor }}
        />
        <span className="text-xs capitalize" style={{ color: statusColor }}>
          {node.status}
        </span>
      </div>
      <div className="space-y-1">
        {Object.entries(fields).map(([key, val]) => (
          <div key={key} className="flex justify-between text-xs">
            <span className="text-gray-400">{key}</span>
            <span className="font-medium">{String(val)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
