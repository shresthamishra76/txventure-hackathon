import { Router } from 'express';
import { nodes, edges } from '../data/mockData.js';

const router = Router();

router.get('/', (_req, res) => {
  res.json({ nodes, edges });
});

export default router;
