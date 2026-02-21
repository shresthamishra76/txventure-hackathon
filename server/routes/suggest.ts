import { Router } from 'express';
import { generateSuggestion } from '../lib/openai.js';
import type { SuggestionRequest } from '../types.js';

const router = Router();

router.post('/', async (req, res) => {
  const { simulation_result, event_type, severity } = req.body as SuggestionRequest;

  if (!simulation_result || !event_type || severity == null) {
    res.status(400).json({ error: 'simulation_result, event_type, and severity are required' });
    return;
  }

  try {
    const suggestion = await generateSuggestion(simulation_result, event_type, severity);
    res.json({ suggestion });
  } catch (err) {
    console.error('OpenAI API error:', err);
    res.status(500).json({ error: 'Failed to generate suggestion' });
  }
});

export default router;
