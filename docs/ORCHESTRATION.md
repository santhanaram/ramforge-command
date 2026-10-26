# Agent execution design (future milestones)

Client submits task -> authenticated server verifies owner, budget and permitted scope -> Forge orchestrator resolves a role from workforce registry -> Atlas rights-gates sources -> Nova retrieves documented frameworks -> Sage drafts or transforms approved content -> Vera performs independent evidence/safety review -> HUMAN RELEASE GATE -> outcome and artifacts committed to audit log.

Recommended state machine: `draft -> queued -> running -> awaiting_review -> needs_changes | approved -> released` plus `failed` and `cancelled`.

Task record should include owner_id, assigned_role_id, dependency_ids, input_refs, permission_status, model_provider, model_id, cost_estimate, actual_cost, start/end timestamps, source_citations, run_id, quality_result, release_approver_id. Never let generated text approve itself.

Retry policy: limited exponential backoff only for transient API errors. Timeouts, user cancellation, idempotent retries and budget caps are mandatory. No hidden model calls from browsers.

The present dashboard does not claim to run agents. Role checklists represent a task charter, not execution telemetry.
