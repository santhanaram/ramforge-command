# Data model and source policy

Migrations: `supabase/migrations/20261026000000_initial.sql` then `20261027000000_workforce_core.sql`.
Every table has row-level security: each user sees and changes only their own rows. Anonymous visitors have no access.

| Table | Purpose | Who can change it |
| --- | --- | --- |
| `assignments` | Tasks: title, description, acceptance criteria, accountable role, status, priority, due date | Owner; status rules enforced by triggers |
| `task_events` | Audit trail: created, status changes, handoffs, notes, runs, reviews, release decisions | Append-only |
| `agent_runs` | Each run: role, live or simulated, provider, model, tokens, cost, output, citations, errors | Editable only while running |
| `run_logs` | Step-by-step execution log for each run | Append-only |
| `sources` | Source catalogue with rights status, permission evidence and permitted use | Owner; approval requires evidence |
| `source_chunks` | Stored passages with locators | Insert only for approved sources; deleted when rights are withdrawn |
| `reviews` | Vera review verdicts and checks | Append-only; reviewer must be a Vera role, independent of the author |
| `approval_events` | RAM release decisions and source rights decisions | Append-only; release needs a passing review |
| `frameworks` | Reserved for framework cards (not yet used in the UI) | Owner |

Database functions: `record_review` and `decide_release` make review and release atomic.

## Source rights policy

Statuses: pending, approved, rejected, restricted. Only approved sources with written permission evidence can be ingested. Attribution is never a substitute for permission. Public availability is not permission.
