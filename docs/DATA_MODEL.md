# Data model and source policy

Implemented starter tables:
- `assignments`: owner-scoped tasks, role ID, status and timestamps.
- `sources`: attribution and rights evidence metadata, not the full media content.
- `frameworks`: documented vs synthetic interpretation, source reference and review state.
- `approval_events`: append-only human decisions, owner-scoped.

Every public table has RLS with owner checks. SQL belongs in `supabase/migrations/20261026000000_initial.sql`. Apply only to a dedicated project. The UI currently persists only assignment records, not source/framework editing.

Recommended future models: `task_runs`, `agent_outputs`, `source_chunks`, `source_permissions`, `review_findings`, `model_usage`, `audit_events`, `team_memberships`. Use object-level permission checks and tested RLS for every new table.

Source rights statuses: pending, approved, rejected, restricted. Only explicit approved rights with verified scope allow ingestion. Attribution is never a substitute for permission.
