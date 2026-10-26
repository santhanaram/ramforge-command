# CLAUDE CODE PROJECT INSTRUCTIONS: RAMFORGE COMMAND

You are the lead engineer and product architect implementing the standalone RAMFORGE Command project.

## Goal
Deliver a production-grade AI workforce operations dashboard deployed using GitHub, Vercel and Supabase, managing five divisions, ten team leads and sixty specialists with alliterative names and ten role responsibilities each.

## Project context
This repository contains a working Next.js dashboard starter with all 75 roles generated in `data/workforce.ts`, local demonstration assignments, a Supabase email-login option, user-owned assignment CRUD (create/read/update), and a first SQL migration. It is **not** yet an autonomous agent execution platform. Initial subject: attributed educational content from Alex Hormozi, with content rights respected and no impersonation.

## First instruction
Read `AGENTS.md`, `docs/PROJECT_PLAN.md`, `docs/ORCHESTRATION.md`, `docs/DEPLOYMENT_GUIDE.md`, `docs/DATA_MODEL.md` and inspect the actual code. Run `npm install`, `npm run lint`, and `npm run build` before changing the architecture. Report what is functional versus scaffolded; never invent test outcomes.

## Build sequence
1. Verify install, build, responsive design, accessible navigation and 75 role records.
2. Replace placeholder initials with **licensed or user-provided** consistent 3D animated fictional portraits; store asset references and alt text. Do not scrape restricted imagery. Never claim images exist until supplied.
3. Complete Supabase SSR authentication using current verified documentation; ensure RLS and no user data cross-access. Migration changes must be reviewed and tested.
4. Implement source catalogue UI and permission workflow. Reject unapproved source ingestion.
5. Implement task detail pages, accountable handoffs, attachments, revisions, approval events and immutable execution logs.
6. Add retrieval and grounded consultation only after sources are approved and indexed. Keep source-derived claims separate from synthesis.
7. Integrate configurable model provider **server-side only** with budgets, rate limits, timeouts, retries, prompt-injection testing and observability. Real agent runs must have logs and costs.
8. Create Vera independent review checks and final RAM human-approval release gate.
9. Run end-to-end tests and deploy to Vercel via GitHub; capture links only after verified successful deployment.

## Restrictions
Never deploy or mutate connected accounts without explicit user authorisation. No false endorsements, made-up citations, fake completion status, copyrighted bulk transcript ingestion without rights, or credentials in commits. Use no em dash in user-facing copy.

## Definition of done
Real authentication, secure persistent data, source rights checks, auditable agent execution, verified outputs, final human approval, accessible responsive UI, passing tests, and documented deployment. A demo is never production-complete.
