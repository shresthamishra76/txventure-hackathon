import type { InfrastructureNode, GraphEdge } from '../types.js';

export const nodes: InfrastructureNode[] = [
  // ── Power Generation (2) ──
  {
    id: 'pow_001',
    type: 'power_generation',
    name: 'Decker Creek Power Plant',
    lat: 30.3195,
    lng: -97.6453,
    capacity_mw: 820,
    status: 'operational',
    fuel_source: 'natural_gas',
    output_voltage_kv: 138,
    operator: 'Austin Energy',
  },
  {
    id: 'pow_002',
    type: 'power_generation',
    name: 'Sand Hill Energy Center',
    lat: 30.1951,
    lng: -97.6081,
    capacity_mw: 600,
    status: 'operational',
    fuel_source: 'natural_gas',
    output_voltage_kv: 345,
    operator: 'Austin Energy',
  },

  // ── Water Infrastructure (2) ──
  {
    id: 'wat_001',
    type: 'water_infrastructure',
    name: 'Ullrich Water Treatment Plant',
    lat: 30.3672,
    lng: -97.7956,
    capacity_mgd: 167,
    status: 'operational',
    pressure_psi: 65,
    storage_mil_gal: 30,
    service_zone: 'Central Austin',
  },
  {
    id: 'wat_002',
    type: 'water_infrastructure',
    name: 'Davis Water Treatment Plant',
    lat: 30.2900,
    lng: -97.8650,
    capacity_mgd: 118,
    status: 'operational',
    pressure_psi: 60,
    storage_mil_gal: 25,
    service_zone: 'South Austin',
  },

  // ── Fuel Supply (2) ──
  {
    id: 'fuel_001',
    type: 'fuel_supply',
    name: 'North Austin Compressor Station',
    lat: 30.4100,
    lng: -97.7431,
    capacity_mmcfd: 400,
    status: 'operational',
    pressure_psi: 800,
    pipeline_diameter_in: 36,
    operator: 'Atmos Energy',
  },
  {
    id: 'fuel_002',
    type: 'fuel_supply',
    name: 'South Gas Transfer Hub',
    lat: 30.1800,
    lng: -97.7800,
    capacity_mmcfd: 350,
    status: 'operational',
    pressure_psi: 750,
    pipeline_diameter_in: 30,
    operator: 'Atmos Energy',
  },

  // ── Food Sources (2) ──
  {
    id: 'food_001',
    type: 'food_source',
    name: 'HEB Distribution Center North',
    lat: 30.4200,
    lng: -97.6900,
    capacity_tons_per_day: 500,
    status: 'operational',
    refrigeration_units: 120,
    backup_generator: true,
    service_radius_miles: 25,
  },
  {
    id: 'food_002',
    type: 'food_source',
    name: 'Whole Foods Regional Hub',
    lat: 30.2700,
    lng: -97.7500,
    capacity_tons_per_day: 300,
    status: 'operational',
    refrigeration_units: 80,
    backup_generator: true,
    service_radius_miles: 20,
  },

  // ── Emergency Services (3) ──
  {
    id: 'ems_001',
    type: 'emergency_services',
    name: 'Fire Station Central',
    lat: 30.2672,
    lng: -97.7431,
    unit_count: 3,
    status: 'operational',
    response_time_min: 4,
    coverage_zone: 'Downtown',
    fuel_reserve_days: 7,
  },
  {
    id: 'ems_002',
    type: 'emergency_services',
    name: 'Fire Station East',
    lat: 30.2600,
    lng: -97.7000,
    unit_count: 2,
    status: 'operational',
    response_time_min: 5,
    coverage_zone: 'East Austin',
    fuel_reserve_days: 5,
  },
  {
    id: 'ems_003',
    type: 'emergency_services',
    name: 'Travis County EMS Hub',
    lat: 30.3100,
    lng: -97.7600,
    unit_count: 8,
    status: 'operational',
    response_time_min: 6,
    coverage_zone: 'County-wide',
    fuel_reserve_days: 10,
  },

  // ── Residential Clusters (4) ──
  {
    id: 'res_001',
    type: 'residential',
    name: 'Downtown Core',
    lat: 30.2672,
    lng: -97.7431,
    household_count: 3200,
    status: 'operational',
    avg_power_demand_kw: 2.1,
    avg_water_demand_gpd: 90,
    population_estimate: 6500,
  },
  {
    id: 'res_002',
    type: 'residential',
    name: 'East Austin',
    lat: 30.2600,
    lng: -97.7200,
    household_count: 4200,
    status: 'operational',
    avg_power_demand_kw: 1.8,
    avg_water_demand_gpd: 80,
    population_estimate: 9800,
  },
  {
    id: 'res_003',
    type: 'residential',
    name: 'North Austin',
    lat: 30.4000,
    lng: -97.7300,
    household_count: 5600,
    status: 'operational',
    avg_power_demand_kw: 2.0,
    avg_water_demand_gpd: 85,
    population_estimate: 13200,
  },
  {
    id: 'res_004',
    type: 'residential',
    name: 'South Congress',
    lat: 30.2400,
    lng: -97.7500,
    household_count: 2800,
    status: 'operational',
    avg_power_demand_kw: 1.9,
    avg_water_demand_gpd: 75,
    population_estimate: 6200,
  },
];

export const edges: GraphEdge[] = [
  // ── Fuel → Power (Power depends on Fuel) ──
  // pow_001 has 2 fuel deps (resilient), pow_002 has only 1 (VULNERABLE)
  { id: 'edge_001', source: 'pow_001', target: 'fuel_001', type: 'fuel_dependency', capacity: 100, current_load: 72, critical: true },
  { id: 'edge_002', source: 'pow_001', target: 'fuel_002', type: 'fuel_dependency', capacity: 80, current_load: 35, critical: false },
  { id: 'edge_003', source: 'pow_002', target: 'fuel_002', type: 'fuel_dependency', capacity: 100, current_load: 65, critical: true },

  // ── Power → Water (Water depends on Power) ──
  // wat_001 has 2 power deps (resilient), wat_002 has only 1 (VULNERABLE)
  { id: 'edge_004', source: 'wat_001', target: 'pow_001', type: 'power_dependency', capacity: 50, current_load: 38, critical: true },
  { id: 'edge_005', source: 'wat_001', target: 'pow_002', type: 'power_dependency', capacity: 40, current_load: 20, critical: false },
  { id: 'edge_006', source: 'wat_002', target: 'pow_002', type: 'power_dependency', capacity: 50, current_load: 42, critical: true },

  // ── Power + Fuel → Food ──
  { id: 'edge_007', source: 'food_001', target: 'pow_001', type: 'power_dependency', capacity: 30, current_load: 22, critical: true },
  { id: 'edge_008', source: 'food_001', target: 'fuel_001', type: 'fuel_dependency', capacity: 25, current_load: 12, critical: false },
  { id: 'edge_009', source: 'food_002', target: 'pow_002', type: 'power_dependency', capacity: 30, current_load: 20, critical: true },
  { id: 'edge_010', source: 'food_002', target: 'fuel_002', type: 'fuel_dependency', capacity: 20, current_load: 10, critical: false },

  // ── Power + Fuel → Emergency Services ──
  { id: 'edge_011', source: 'ems_001', target: 'pow_001', type: 'power_dependency', capacity: 20, current_load: 14, critical: true },
  { id: 'edge_012', source: 'ems_001', target: 'fuel_001', type: 'fuel_dependency', capacity: 15, current_load: 8, critical: false },
  { id: 'edge_013', source: 'ems_002', target: 'pow_001', type: 'power_dependency', capacity: 15, current_load: 10, critical: true },
  { id: 'edge_014', source: 'ems_002', target: 'fuel_002', type: 'fuel_dependency', capacity: 15, current_load: 7, critical: false },
  // ems_003 has only 1 dep (VULNERABLE — single point of failure on pow_002)
  { id: 'edge_015', source: 'ems_003', target: 'pow_002', type: 'power_dependency', capacity: 25, current_load: 18, critical: true },

  // ── Residential incoming edges (Power, Water, Food, Emergency) ──
  // res_001 - Downtown Core
  { id: 'edge_016', source: 'res_001', target: 'pow_001', type: 'power_dependency', capacity: 60, current_load: 45, critical: true },
  { id: 'edge_017', source: 'res_001', target: 'wat_001', type: 'water_dependency', capacity: 40, current_load: 30, critical: true },
  { id: 'edge_018', source: 'res_001', target: 'food_002', type: 'food_dependency', capacity: 30, current_load: 22, critical: false },
  { id: 'edge_019', source: 'res_001', target: 'ems_001', type: 'emergency_dependency', capacity: 20, current_load: 12, critical: true },

  // res_002 - East Austin
  { id: 'edge_020', source: 'res_002', target: 'pow_001', type: 'power_dependency', capacity: 70, current_load: 52, critical: true },
  { id: 'edge_021', source: 'res_002', target: 'wat_001', type: 'water_dependency', capacity: 50, current_load: 35, critical: true },
  { id: 'edge_022', source: 'res_002', target: 'food_002', type: 'food_dependency', capacity: 35, current_load: 25, critical: false },
  { id: 'edge_023', source: 'res_002', target: 'ems_002', type: 'emergency_dependency', capacity: 20, current_load: 14, critical: true },

  // res_003 - North Austin
  { id: 'edge_024', source: 'res_003', target: 'pow_001', type: 'power_dependency', capacity: 80, current_load: 58, critical: true },
  { id: 'edge_025', source: 'res_003', target: 'wat_001', type: 'water_dependency', capacity: 55, current_load: 40, critical: true },
  { id: 'edge_026', source: 'res_003', target: 'food_001', type: 'food_dependency', capacity: 40, current_load: 28, critical: false },
  { id: 'edge_027', source: 'res_003', target: 'ems_003', type: 'emergency_dependency', capacity: 25, current_load: 16, critical: true },

  // res_004 - South Congress
  { id: 'edge_028', source: 'res_004', target: 'pow_002', type: 'power_dependency', capacity: 55, current_load: 40, critical: true },
  { id: 'edge_029', source: 'res_004', target: 'wat_002', type: 'water_dependency', capacity: 40, current_load: 28, critical: true },
  { id: 'edge_030', source: 'res_004', target: 'food_002', type: 'food_dependency', capacity: 30, current_load: 20, critical: false },
  { id: 'edge_031', source: 'res_004', target: 'ems_001', type: 'emergency_dependency', capacity: 20, current_load: 13, critical: true },
];
