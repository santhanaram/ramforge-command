// US dollars per million tokens, Anthropic first-party API list prices (checked 2026-10-26).
// Update when prices change. Unknown models are costed at the highest listed rate so budgets stay safe.
const PRICES: Record<string, { input: number; output: number }> = {
  'claude-fable-5-1': { input: 10, output: 50 },
  'claude-opus-5-5': { input: 4, output: 20 },
  'claude-opus-5': { input: 5, output: 25 },
  'claude-opus-4-8': { input: 5, output: 25 },
  'claude-sonnet-5-5': { input: 2, output: 10 },
  'claude-sonnet-5': { input: 2, output: 10 },
  'claude-haiku-5-5': { input: 0.1, output: 0.5 },
  'simulated-v1': { input: 0, output: 0 },
};
const FALLBACK = { input: 10, output: 50 };

export function priceFor(model: string) {
  return PRICES[model] ?? FALLBACK;
}

export function costUsd(model: string, inputTokens: number, outputTokens: number) {
  const p = priceFor(model);
  return Math.round(((inputTokens * p.input + outputTokens * p.output) / 1_000_000) * 1e6) / 1e6;
}

// Worst-case cost of one run, used to refuse a run that could exceed the daily budget.
export function maxRunCost(model: string, approxInputTokens: number, maxOutputTokens: number) {
  return costUsd(model, approxInputTokens, maxOutputTokens);
}
