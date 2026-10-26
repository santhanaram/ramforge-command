# RAMFORGE Command: milestone plan

| Milestone | Deliverable | Acceptance criterion |
| --- | --- | --- |
| M0 | Dashboard starter | `npm run lint` and `npm run build` pass, 75 roles with 10 tasks each, mobile layout |
| M1 | Auth and persistence | Supabase signed-in task CRUD, RLS tested across two separate accounts |
| M2 | Source clearance | rights status, reviewed provenance, sources cannot be processed while unapproved |
| M3 | Knowledge engine | approved source chunks, framework provenance, citation-backed retrieval tests |
| M4 | Agent orchestration | real provider calls with queue, cost control, handoffs and logs |
| M5 | Governance | Vera review workflow, human release approvals, immutable audit trail |
| M6 | Operations | monitoring, backups, dependency scanning, WCAG review, GitHub CI + Vercel rollout |

### Goal and boundary
The current artifact implements M0 plus a limited M1 client integration, not M2-M6. Do not portray placeholder division progress bars as actual metrics: replace them with computed role/task measures before production.
