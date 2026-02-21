import { useState, useCallback } from 'react';
import type { EventType, SimulationResult } from '../types';

export function useSimulation() {
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const simulate = useCallback(async (eventType: EventType, severity: number) => {
    setSimulating(true);
    setSuggestion(null);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_type: eventType, severity }),
      });

      if (!res.ok) throw new Error('Simulation failed');
      const result: SimulationResult = await res.json();
      setSimResult(result);

      setSuggesting(true);
      try {
        const suggestRes = await fetch('/api/suggest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            simulation_result: result,
            event_type: eventType,
            severity,
          }),
        });

        if (suggestRes.ok) {
          const data = await suggestRes.json();
          setSuggestion(data.suggestion);
        }
      } catch {
        setSuggestion('Unable to generate AI suggestion.');
      } finally {
        setSuggesting(false);
      }
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSimResult(null);
    setSuggestion(null);
  }, []);

  return { simResult, suggestion, simulating, suggesting, simulate, reset };
}
