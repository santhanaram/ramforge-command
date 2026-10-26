# Agent orchestration

All AI work runs on the server. The browser never calls a model and never sees an API key.

## Task lifecycle

```
draft -> queued -> running -> awaiting_review -> approved -> released
                     |              |               |
                   failed      needs_changes    needs_changes / cancelled (RAM decision)
```

- People can move tasks only between draft, queued, cancelled and back to queued after changes or failure.
- `approved` is reachable only through a passing Vera review. `released` only through a RAM decision with a rationale. Released tasks are final.
- These rules are enforced in `lib/governance.ts` (demo) and by triggers in `supabase/migrations/20261027000000_workforce_core.sql` (live).

## One agent run (`lib/orchestrator.ts`)

1. Check the task can run and the accountable role exists.
2. Retrieve up to 6 passages from **approved** sources only (`lib/retrieval.ts`, BM25).
3. Build the prompt (`lib/ai/prompt.ts`). Passages are wrapped as untrusted data so instructions inside them are ignored. The agent must cite `[S1]`, quote exactly, label synthesis, and never speak as or imply endorsement by any source author.
4. Budget gate: refuse the run if today's spend plus the worst-case cost would exceed `AI_DAILY_BUDGET_USD`.
5. Call the provider (`lib/ai/provider.ts`): Anthropic with timeout, 2 SDK retries for transient errors, and server-side refusal fallback; or the simulated provider when no key is set.
6. Record tokens, cost (`lib/ai/pricing.ts`), latency, citations and every step in the append-only run log.
7. Hand off to an independent Vera reviewer (never the task's own role or the run's role).

## Vera review (`lib/verification.ts`)

Deterministic checks, independent of the model that wrote the output: citations point to supplied passages, quotes appear word for word, every source-backed point is cited, no impersonation or endorsement wording, no credentials, plus warnings for simulated output or missing evidence. Any failure sends the task back as `needs_changes`.

## RAM release

Only the signed-in human owner can approve, request changes or reject, and a rationale is required. Decisions go to `approval_events`, which cannot be edited or deleted.
