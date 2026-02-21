import OpenAI from 'openai';
import type { SimulationResult, EventType } from '../types.js';

const SYSTEM_PROMPT = `You are an urban infrastructure resilience advisor. Given a disaster simulation result for Austin, TX, provide a concise 3–4 sentence summary of what failed, what was automatically rerouted, and the top 2 priority actions city operators should take. Be specific about node names. Do not use bullet points in your response — write in plain prose.`;

let client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return client;
}

export async function generateSuggestion(
  simulationResult: SimulationResult,
  eventType: EventType,
  severity: number
): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your_key_here') {
    return `[Demo mode — no API key configured] During the simulated ${eventType.replace('_', ' ')} at severity ${severity}, ${simulationResult.failed_nodes.length} infrastructure nodes failed directly, causing ${simulationResult.cascaded_nodes.length} cascading failures. The system automatically rerouted ${simulationResult.rerouted_edges.length} dependency connections to maintain service continuity where possible. Priority actions: (1) Deploy emergency fuel reserves to restore the most critical supply nodes, and (2) activate mutual aid agreements with neighboring utility districts to supplement capacity at ${simulationResult.vulnerable_nodes.length} vulnerable nodes currently operating with minimal redundancy.`;
  }

  const openai = getClient();

  const userMessage = `Simulation results for ${eventType.replace('_', ' ')} event at severity ${severity}/10:\n\n${simulationResult.summary_prompt_context}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 300,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userMessage },
    ],
  });

  return response.choices[0]?.message?.content || 'Unable to generate suggestion.';
}
