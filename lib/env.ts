// Reads configuration from environment variables. Server-only values never use the NEXT_PUBLIC_ prefix,
// so Next.js never sends them to the browser.

const num = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
};

export function supabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export type AiConfig = {
  live: boolean;
  provider: 'anthropic' | 'simulated';
  model: string;
  effort: 'low' | 'medium' | 'high';
  maxOutputTokens: number;
  timeoutMs: number;
  dailyBudgetUsd: number;
};

export function aiConfig(): AiConfig {
  const wantsSimulated = (process.env.AI_PROVIDER ?? '').toLowerCase() === 'simulated';
  const live = Boolean(process.env.ANTHROPIC_API_KEY) && !wantsSimulated;
  const effort = (process.env.AI_EFFORT ?? 'medium') as AiConfig['effort'];
  return {
    live,
    provider: live ? 'anthropic' : 'simulated',
    model: live ? process.env.AI_MODEL || 'claude-opus-5-5' : 'simulated-v1',
    effort: ['low', 'medium', 'high'].includes(effort) ? effort : 'medium',
    maxOutputTokens: num(process.env.AI_MAX_OUTPUT_TOKENS, 4000),
    timeoutMs: num(process.env.AI_TIMEOUT_MS, 90_000),
    dailyBudgetUsd: num(process.env.AI_DAILY_BUDGET_USD, 5),
  };
}

// A public deployment without Supabase would let any visitor change the shared demo data.
// Writes are therefore off in production demo mode unless explicitly allowed.
export function demoWritesAllowed() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_PUBLIC_DEMO === 'true';
}

// Optional allow-list (comma separated). When set, only these accounts can use the workspace.
export function emailAllowed(email: string | null) {
  const list = (process.env.ALLOWED_EMAILS ?? '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return !list.length || (email !== null && list.includes(email.toLowerCase()));
}
