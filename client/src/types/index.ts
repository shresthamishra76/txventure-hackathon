export type NodeType =
  | 'power_generation'
  | 'water_infrastructure'
  | 'fuel_supply'
  | 'food_source'
  | 'emergency_services'
  | 'residential';

export type NodeStatus = 'operational' | 'degraded' | 'failed' | 'rerouted' | 'unresolvable' | 'vulnerable';

export interface BaseNode {
  id: string;
  type: NodeType;
  name: string;
  lat: number;
  lng: number;
  status: NodeStatus;
}

export interface PowerGenerationNode extends BaseNode {
  type: 'power_generation';
  capacity_mw: number;
  fuel_source: string;
  output_voltage_kv: number;
  operator: string;
}

export interface WaterInfrastructureNode extends BaseNode {
  type: 'water_infrastructure';
  capacity_mgd: number;
  pressure_psi: number;
  storage_mil_gal: number;
  service_zone: string;
}

export interface FuelSupplyNode extends BaseNode {
  type: 'fuel_supply';
  capacity_mmcfd: number;
  pressure_psi: number;
  pipeline_diameter_in: number;
  operator: string;
}

export interface FoodSourceNode extends BaseNode {
  type: 'food_source';
  capacity_tons_per_day: number;
  refrigeration_units: number;
  backup_generator: boolean;
  service_radius_miles: number;
}

export interface EmergencyServicesNode extends BaseNode {
  type: 'emergency_services';
  unit_count: number;
  response_time_min: number;
  coverage_zone: string;
  fuel_reserve_days: number;
}

export interface ResidentialNode extends BaseNode {
  type: 'residential';
  household_count: number;
  avg_power_demand_kw: number;
  avg_water_demand_gpd: number;
  population_estimate: number;
}

export type InfrastructureNode =
  | PowerGenerationNode
  | WaterInfrastructureNode
  | FuelSupplyNode
  | FoodSourceNode
  | EmergencyServicesNode
  | ResidentialNode;

export type EdgeType =
  | 'power_dependency'
  | 'water_dependency'
  | 'fuel_dependency'
  | 'food_dependency'
  | 'emergency_dependency';

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  capacity: number;
  current_load: number;
  critical: boolean;
}

export interface GraphData {
  nodes: InfrastructureNode[];
  edges: GraphEdge[];
}

export interface ReroutedEdge {
  edge_id: string;
  old_target: string;
  new_target: string;
}

export interface SimulationRequest {
  event_type: EventType;
  severity: number;
  affected_node_ids?: string[];
}

export interface SimulationResult {
  failed_nodes: string[];
  cascaded_nodes: string[];
  rerouted_edges: ReroutedEdge[];
  vulnerable_nodes: string[];
  unresolvable_nodes: string[];
  summary_prompt_context: string;
}

export interface SuggestionRequest {
  simulation_result: SimulationResult;
  event_type: EventType;
  severity: number;
}

export interface SuggestionResponse {
  suggestion: string;
}

export type EventType = 'deep_freeze' | 'flood' | 'power_surge' | 'earthquake' | 'custom';

export const NODE_COLORS: Record<NodeType, string> = {
  power_generation: '#EAB308',
  water_infrastructure: '#3B82F6',
  fuel_supply: '#F97316',
  food_source: '#22C55E',
  emergency_services: '#EF4444',
  residential: '#6B7280',
};

export const NODE_ICONS: Record<NodeType, string> = {
  power_generation: '⚡',
  water_infrastructure: '💧',
  fuel_supply: '🔥',
  food_source: '🏪',
  emergency_services: '🚨',
  residential: '🏘',
};

export const NODE_LABELS: Record<NodeType, string> = {
  power_generation: 'Power Generation',
  water_infrastructure: 'Water Infrastructure',
  fuel_supply: 'Fuel Supply',
  food_source: 'Food Sources',
  emergency_services: 'Emergency Services',
  residential: 'Residential',
};

export const STATUS_RING_COLORS: Record<NodeStatus, string> = {
  operational: '#22C55E',
  degraded: '#EAB308',
  failed: '#EF4444',
  rerouted: '#A855F7',
  unresolvable: '#EF4444',
  vulnerable: '#F97316',
};
