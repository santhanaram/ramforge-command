# RAMFORGE Command: milestone plan

| Milestone | Deliverable | Status (2026-10-26) |
| --- | --- | --- |
| M0 | Dashboard, 75 roles with 10 role-specific responsibilities, mobile layout | Done and tested |
| M1 | Supabase server-side auth, persistence, RLS tested across two accounts | Built; RLS tested on local Postgres; not yet on a real Supabase project |
| M2 | Source clearance: rights status, evidence, no processing while unapproved | Done and tested (demo and database) |
| M3 | Knowledge engine: approved chunks, provenance, citation-backed retrieval | Keyword retrieval done and tested; semantic search later |
| M4 | Agent orchestration: provider calls, cost control, handoffs, logs | Done; simulated runs tested; live provider not yet exercised |
| M5 | Governance: Vera review, RAM release, immutable audit trail | Done and tested |
| M6 | Operations: monitoring, backups, WCAG review, CI and Vercel rollout | CI workflow in place; deployment awaits RAM's authorisation |
| M7 | Portraits: licensed or self-made, consistent per character | Done: 75 AI-generated photorealistic portraits of fictional people (Higgsfield), with alt text and credit in `data/portraits.ts`; served from the Higgsfield CDN, self-hosting optional |
