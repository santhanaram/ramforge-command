> Reference copy of the ContextForge package, shown read-only in the RAMFORGE Command **ContextForge** tab (`app/(app)/contextforge`). `AGENTS.md` is saved here as `GOVERNANCE.md` and `CLAUDE.md` as `BUILD_RULES.md`. Nothing here is installed, enabled or applied to a database.

# ContextForge AI Research Lab

Standalone Next.js/TypeScript research orchestration project. Repository name: `contextforge-ai-research-lab`. This is a **starter implementation package**, not a deployed application.

## Scope
30 registered candidate tools, six divisions, five leadership agents, gated execution, source provenance and auditable jobs. `config/tools.json` records tool candidates; `enabled` defaults to false until identity, license, permissions, integration and test review.

## Quick start
1. Create a GitHub repository named `contextforge-ai-research-lab`.
2. Open its folder in Claude Code and read `CLAUDE.md`, `AGENTS.md` and `docs/PROJECT_PLAN.md`.
3. Ask Claude Code to scaffold Next.js App Router, TypeScript, Tailwind and Supabase clients.
4. Create a Supabase project and apply `supabase/schema.sql` in a development environment.
5. Set environment variables from `.env.example`, never commit secrets.
6. Build the registry, dashboard, auth, approvals and job queue before enabling any external tool.
7. Deploy dashboard to Vercel, set environment variables and connect GitHub.
8. Provision separate worker runtime for long-running crawl/browser/LLM jobs.
9. Run permission, data privacy, rate limit, provenance and cost tests before production.

## Deployment boundary
Vercel serves UI and short API routes. Worker containers run crawlers, browsers, inference and device-dependent tools. All external actions must be approved and logged.
