# Dependency Mapper — Product Requirements Document

## Overview

A single-page web application that visualizes Austin's critical infrastructure as an interactive dependency graph overlaid on a map. City planners and grid operators can simulate disaster events (e.g., "Deep Freeze") to expose cascading failures, automatically reroute dependencies, and receive AI-generated remediation suggestions.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript |
| Styling | Tailwind CSS |
| Graph Visualization | React Flow (or D3.js) |
| 2D Map | OpenStreetMap via Leaflet.js |
| 3D Map | Deck.gl (toggleable layer) |
| Backend | Node.js + Express (or Next.js API routes) |
| AI/LLM | OpenAI API (gpt-4o) |
| Environment Variables | OPENAI_API_KEY, MAPBOX_TOKEN (reserved), OSM_API_KEY |

---

## Environment Variables

```
OPENAI_API_KEY=your_key_here
MAPBOX_TOKEN=reserved_for_future_use
OSM_API_KEY=your_key_here
```

---

## Data Model

### Node Types

All nodes are fixed mock data representing Austin, TX infrastructure. Each node has exactly 5 fields plus a system `id` and `type`.

#### 1. Power Generation Node
```json
{
  "id": "pow_001",
  "type": "power_generation",
  "name": "Decker Creek Power Plant",
  "lat": 30.3195,
  "lng": -97.6453,
  "capacity_mw": 820,
  "status": "operational",
  "fuel_source": "natural_gas",
  "output_voltage_kv": 138,
  "operator": "Austin Energy"
}
```

#### 2. Water Infrastructure Node
```json
{
  "id": "wat_001",
  "type": "water_infrastructure",
  "name": "Ullrich Water Treatment Plant",
  "lat": 30.3672,
  "lng": -97.7956,
  "capacity_mgd": 150,
  "status": "operational",
  "pressure_psi": 65,
  "storage_mil_gal": 30,
  "service_zone": "Central Austin"
}
```

#### 3. Fuel Supply Node
```json
{
  "id": "fuel_001",
  "type": "fuel_supply",
  "name": "Austin Gas Compressor Station A",
  "lat": 30.2672,
  "lng": -97.7431,
  "capacity_mmcfd": 400,
  "status": "operational",
  "pressure_psi": 800,
  "pipeline_diameter_in": 36,
  "operator": "Atmos Energy"
}
```

#### 4. Food Source Node
```json
{
  "id": "food_001",
  "type": "food_source",
  "name": "HEB Distribution Center North",
  "lat": 30.4200,
  "lng": -97.6900,
  "capacity_tons_per_day": 500,
  "status": "operational",
  "refrigeration_units": 120,
  "backup_generator": true,
  "service_radius_miles": 25
}
```

#### 5. Emergency Services Node
```json
{
  "id": "ems_001",
  "type": "emergency_services",
  "name": "Austin Fire Station 1",
  "lat": 30.2672,
  "lng": -97.7431,
  "unit_count": 3,
  "status": "operational",
  "response_time_min": 4,
  "coverage_zone": "Downtown",
  "fuel_reserve_days": 7
}
```

#### 6. Residential Cluster Node (input only — no outputs)
```json
{
  "id": "res_001",
  "type": "residential",
  "name": "East Austin Residential Cluster",
  "lat": 30.2600,
  "lng": -97.7200,
  "household_count": 4200,
  "status": "operational",
  "avg_power_demand_kw": 1.8,
  "avg_water_demand_gpd": 80,
  "population_estimate": 9800
}
```

---

### Mock Node Inventory (Austin, TX)

Generate the following fixed nodes (exact coordinates approximate):

**Power Generation (3 nodes):** Decker Creek Power Plant, Sand Hill Energy Center, Fayette Power Project substation  
**Water Infrastructure (3 nodes):** Ullrich WTP, Davis WTP, Handcox WTP  
**Fuel Supply (3 nodes):** North Austin Compressor Station, South Gas Transfer Hub, East Distribution Valve Station  
**Food Sources (3 nodes):** HEB Distribution North, Whole Foods Regional Hub, Austin Food Bank Warehouse  
**Emergency Services (4 nodes):** Fire Station Central, Fire Station East, Travis County EMS Hub, Austin Police Command  
**Residential Clusters (5 nodes):** Downtown Core, East Austin, North Austin, South Congress, Mueller District  

**Total: ~21 nodes**

---

### Edge / Dependency Model

Edges represent directional dependencies (A depends on B = arrow from A to B).

```json
{
  "id": "edge_001",
  "source": "wat_001",
  "target": "pow_001",
  "type": "power_dependency",
  "capacity": 100,
  "current_load": 72,
  "critical": true
}
```

**Dependency rules (enforced in mock data):**
- Residential nodes consume from Power, Water, Food, and Emergency Services (edges point inward — residential only has inputs)
- Water nodes depend on Power nodes
- Food nodes depend on Power nodes and Fuel nodes
- Emergency Services depend on Power and Fuel nodes
- Power nodes depend on Fuel nodes
- Residential nodes have NO outgoing edges

All dependency directions flow: `Fuel → Power → Water/Food/Emergency → Residential`

Build a comprehensive edge list connecting all 21 nodes with realistic Austin-geography-aware routing. Ensure every non-residential node has at least 1 outgoing and 1 incoming edge where appropriate. Residential nodes have only incoming edges.

---

## Frontend — Single Page Application

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "Austin Infrastructure Dependency Mapper"          │
├──────────────┬──────────────────────────────────────────────┤
│              │                                              │
│  CONTROL     │         MAP + GRAPH VIEW                     │
│  PANEL       │         (primary canvas)                     │
│  (left 280px)│                                              │
│              │                                              │
│              ├──────────────────────────────────────────────┤
│              │  AI SUGGESTION PANEL (bottom, collapsible)   │
└──────────────┴──────────────────────────────────────────────┘
```

### Control Panel (Left Side)

**Layer Toggles**
- [ ] Node Graph Layer (nodes + edges)
- [ ] 2D Map Layer (OpenStreetMap)
- [ ] 3D Map Layer (Deck.gl terrain)

**Filter by Node Type** — checkboxes:
- Power Generation
- Water Infrastructure
- Fuel Supply
- Food Sources
- Emergency Services
- Residential

**Event Simulator**
- Dropdown: Select event type
  - Deep Freeze
  - Flood
  - Power Surge
  - Earthquake
  - Custom
- Severity slider: 1–10
- "Simulate Event" button (primary CTA)
- "Reset" button

**Vulnerability Highlight**
- Auto-runs on load: flags nodes with fewer than 2 incoming dependency edges as "vulnerable" (shown in orange)
- Toggle: [ ] Show vulnerability overlay

---

### Map + Graph View (Main Canvas)

**Three toggleable layers rendered in z-order:**

1. **2D Map Layer** — Leaflet.js with OpenStreetMap tiles, centered on Austin (30.2672° N, 97.7431° W), zoom 11
2. **3D Map Layer** — Deck.gl ScenegraphLayer or TerrainLayer (toggled on top of 2D)
3. **Node Graph Layer** — SVG/Canvas overlay on top of the map

**Node rendering:**
- Each node type has a distinct icon and color:
  - Power: ⚡ Yellow
  - Water: 💧 Blue
  - Fuel: 🔥 Orange
  - Food: 🏪 Green
  - Emergency: 🚨 Red
  - Residential: 🏘 Gray
- Node size: 24px default, 32px on hover
- **On hover:** Show tooltip card with all 5 node fields (name, type, status, + 3 type-specific fields)
- **Status colors:** operational=green ring, degraded=yellow ring, failed=red ring, rerouted=purple ring

**Edge rendering:**
- Directional arrows (SVG arrowhead marker) from dependent node toward its dependency
- Edge color: normal=gray, critical=red, rerouted=purple, at-capacity=orange
- Edge thickness scales with `current_load / capacity` ratio
- On hover: show edge tooltip (type, capacity, current load, critical flag)

**Post-simulation rendering:**
- Failed nodes pulse red
- Rerouted dependency edges animate (dashed purple with moving dash)
- Newly vulnerable nodes highlight orange
- Cascading failure path highlighted with thick red edges in sequence

---

### AI Suggestion Panel (Bottom, Collapsible)

- Default: collapsed (32px tall bar showing "AI Analysis — click to expand")
- Expanded height: 220px
- Content after simulation runs:
  - **Summary text** (max 4 sentences, no walls of text): LLM-generated plain-language explanation of what failed, what was rerouted, and priority recommendations
  - **Affected node count badge**
  - **Rerouting changes list** (compact, 3-5 bullet items max): shows "Node X now routes through Node Y"
- Show loading spinner while awaiting OpenAI response
- Do NOT show panel before first simulation

---

## Backend — API Endpoints

### `GET /api/graph`
Returns full node + edge dataset.

**Response:**
```json
{
  "nodes": [ ...all 21 nodes... ],
  "edges": [ ...all edges... ]
}
```

---

### `POST /api/simulate`
Runs the disaster event simulation.

**Request body:**
```json
{
  "event_type": "deep_freeze",
  "severity": 8,
  "affected_node_ids": []  // optional: pre-select specific nodes; empty = auto-determine
}
```

**Simulation algorithm (server-side):**

1. **Determine failed nodes** based on event type + severity:
   - Deep Freeze: disables Fuel nodes first (severity ≥ 6 → all fuel nodes fail), then cascades to Power, then Water/Food/EMS
   - Flood: disables Water nodes + low-elevation nodes
   - Power Surge: disables Power nodes randomly based on severity
   - Severity 1–3: 1 random node of primary type fails. 4–6: 2–3 nodes. 7–10: full type class fails.

2. **Cascade detection** — BFS from failed nodes following dependency edges upstream. Any node whose ALL dependencies are failed → also fails.

3. **Rerouting algorithm** — for each failed node:
   - Find alternative nodes of same type that are still operational
   - Prefer nodes with lowest `current_load / capacity` ratio
   - Reassign edges to use the alternative node (update `current_load`)
   - If no alternative exists → mark dependent nodes as "unresolvable"
   - This is a greedy (not fully optimal) assignment: sort candidates by load ratio, assign first viable match

4. **Vulnerability scoring** — post-rerouting: any node with < 2 remaining operational inputs flagged as vulnerable

**Response:**
```json
{
  "failed_nodes": ["pow_001", "pow_002"],
  "cascaded_nodes": ["wat_001", "food_002"],
  "rerouted_edges": [
    { "edge_id": "edge_003", "old_target": "pow_001", "new_target": "pow_003" }
  ],
  "vulnerable_nodes": ["ems_002"],
  "unresolvable_nodes": ["res_003"],
  "summary_prompt_context": "..."  // passed to LLM
}
```

---

### `POST /api/suggest`
Calls OpenAI API to generate remediation suggestions.

**Request body:**
```json
{
  "simulation_result": { ...full simulate response... },
  "event_type": "deep_freeze",
  "severity": 8
}
```

**OpenAI call spec:**
- Model: `gpt-4o`
- Max tokens: 300
- System prompt: `"You are an urban infrastructure resilience advisor. Given a disaster simulation result for Austin, TX, provide a concise 3–4 sentence summary of what failed, what was automatically rerouted, and the top 2 priority actions city operators should take. Be specific about node names. Do not use bullet points in your response — write in plain prose."`
- User message: structured JSON of simulation_result rendered as readable text

**Response:**
```json
{
  "suggestion": "During the simulated deep freeze at severity 8, ..."
}
```

---

## Vulnerability Flagging (Always-On)

Independent of simulation, on initial load:

- Any node with fewer than 2 incoming edges = low-dependency = flagged vulnerable
- Displayed as orange pulsing ring in the graph
- Listed in Control Panel under "Vulnerability Report" section (count only, e.g., "3 nodes at risk")

---

## File Structure

```
/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ControlPanel.tsx
│   │   │   ├── MapCanvas.tsx
│   │   │   ├── NodeGraph.tsx
│   │   │   ├── NodeTooltip.tsx
│   │   │   ├── EdgeRenderer.tsx
│   │   │   ├── AISuggestionPanel.tsx
│   │   │   └── LayerToggle.tsx
│   │   ├── data/
│   │   │   └── mockData.ts         // all 21 nodes + edges
│   │   ├── hooks/
│   │   │   ├── useSimulation.ts
│   │   │   └── useGraph.ts
│   │   ├── types/
│   │   │   └── index.ts            // Node, Edge, SimulationResult types
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
├── server/
│   ├── routes/
│   │   ├── graph.ts
│   │   ├── simulate.ts
│   │   └── suggest.ts
│   ├── lib/
│   │   ├── simulationEngine.ts     // cascade + reroute logic
│   │   └── openai.ts               // OpenAI client wrapper
│   ├── data/
│   │   └── mockData.ts             // shared with client or imported
│   └── index.ts
├── .env
└── package.json
```

---

## Node Status State Machine

```
operational → failed (event hits it)
operational → degraded (partial dependency loss)
degraded    → failed (full dependency loss)
failed      → rerouted (alternative path found)
failed      → unresolvable (no alternative exists)
rerouted    → vulnerable (rerouted path is thin/single-dependency)
```

---

## Acceptance Criteria

1. App loads with all 21 nodes and edges rendered on the map
2. Hovering a node shows a tooltip with all 5 type-specific fields
3. All three layers (Node Graph, 2D Map, 3D Map) are independently toggleable
4. Selecting "Deep Freeze" at severity 8 causes Fuel nodes to fail, cascades to dependent Power and Water nodes
5. Rerouted edges visually animate (dashed purple) post-simulation
6. AI Suggestion Panel expands and displays a 3–4 sentence LLM summary within 5 seconds
7. Vulnerable nodes (< 2 incoming edges) are always highlighted in orange, even before simulation
8. Reset button restores all nodes and edges to initial operational state
9. No node of type "residential" has any outgoing edges

---

## Out of Scope (for this hackathon)

- User authentication
- Persistent storage / database
- Real-time data ingestion
- MapBox integration (token reserved but not used)
- Mobile responsiveness
- Multi-city support