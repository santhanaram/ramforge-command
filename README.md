# RAMFORGE Command

**Independent five-division AI workforce operations platform**

75 roles (5 division heads, 10 team leads, 60 specialists), each with ten role-specific responsibilities.
Tasks are run by server-side AI agents, checked by Vera's independent evidence review, and released only by RAM, the human owner.

Built with Next.js 16, React 19, TypeScript, Supabase, GitHub and Vercel.
Independent platform: not affiliated with or endorsed by Alex Hormozi or Acquisition.com. No third-party expert material is bundled.

## Run it on your computer

```bash
npm install
npm run dev
```

Open http://localhost:3000. With no settings it runs in **demo mode**: data is held in memory and the AI is **simulated**. Both are labelled at the top of every page.

## What is live and what is simulated

| Feature | Without settings (demo) | With settings (live) |
| --- | --- | --- |
| Data | In server memory, resets on restart | Supabase Postgres with row-level security |
| Sign-in | None | Email magic link (Supabase Auth, server-side cookies) |
| AI agent runs | Simulated, no model called, zero cost, labelled | Anthropic API, server-side only, tokens and cost logged |
| Vera review | Real deterministic evidence checks | Same |
| RAM release gate | Enforced in code | Enforced by database triggers |
| Portraits | AI-generated portraits of fictional people | Same, or your own images |

## Tests

```bash
npm run lint      # TypeScript type check
npm test          # unit tests (workforce, retrieval, ingestion, Vera checks, orchestration, governance)
npm run test:db   # database security tests on a throwaway local Postgres (needs PostgreSQL 15+ installed)
npm run build
npm run test:e2e  # browser tests on desktop and phone sizes (demo mode)
```

See `docs/BUILD_STATUS.md` for what has been verified and what has not.

## Docs

- `docs/DEPLOYMENT_GUIDE.md`: step-by-step setup for Supabase, GitHub and Vercel
- `docs/ORCHESTRATION.md`: how tasks, runs, handoffs, reviews and releases work
- `docs/DATA_MODEL.md`: tables, security rules and the source rights policy
- `docs/PROJECT_PLAN.md`: milestones and status
- `CLAUDE.md` and `AGENTS.md`: rules for AI coding assistants working on this repo

## Security

No secrets in code or in browser variables. The Supabase publishable key is public by design and protected by row-level security. AI keys are server-only. Sources cannot be ingested until rights are approved with evidence.
