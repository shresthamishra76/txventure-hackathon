import { Router } from 'express';
import { runSimulation } from '../lib/simulationEngine.js';
import type { SimulationRequest } from '../types.js';

const router = Router();

router.post('/', (req, res) => {
  const { event_type, severity, affected_node_ids = [] } = req.body as SimulationRequest;

  if (!event_type || severity == null) {
    res.status(400).json({ error: 'event_type and severity are required' });
    return;
  }

  if (severity < 1 || severity > 10) {
    res.status(400).json({ error: 'severity must be between 1 and 10' });
    return;
  }

  const result = runSimulation(event_type, severity, affected_node_ids);
  res.json(result);
});

export default router;
