import type { SuppliedSource } from '../verification';

export type GenerateInput = { system: string; user: string; sources: SuppliedSource[]; taskTitle: string };
export type GenerateResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  stopReason: string;
  refused: boolean;
  notes: string[];
};
export interface Provider {
  name: string;
  live: boolean;
  generate(input: GenerateInput): Promise<GenerateResult>;
}

// Deterministic stand-in used when no API key is configured. Its output is labelled as simulated and
// quotes real passage text so the review workflow can be exercised end to end at zero cost.
export function simulatedProvider(): Provider {
  return {
    name: 'simulated',
    live: false,
    async generate({ sources, taskTitle }) {
      const cited = sources.slice(0, 3);
      const points = cited.map((s) => {
        const words = s.content.split(/\s+/).slice(0, 12).join(' ');
        return `- The passage from ${s.source_title} (${s.locator ?? 'no locator'}) is relevant: "${words}" [${s.marker}]`;
      });
      const text = [
        '> SIMULATED OUTPUT. No AI model was called. This text tests the workflow only.',
        '',
        '## Summary',
        `Simulated draft for "${taskTitle}". ${cited.length ? `It references ${cited.length} approved passage(s).` : 'No approved passages matched, so nothing here is source-backed.'}`,
        '',
        '## Source-backed points',
        ...(points.length ? points : ['(none)']),
        '',
        '## Synthesis (not from sources)',
        '- A live model would combine the passages into a recommendation here.',
        '',
        '## Gaps, risks and next action',
        '- Configure a live AI provider and rerun before relying on this output.',
      ].join('\n');
      return { text, model: 'simulated-v1', inputTokens: 0, outputTokens: 0, stopReason: 'end_turn', refused: false, notes: [] };
    },
  };
}
