// Shared domain types. Field names match the Supabase tables in supabase/migrations.

export const TASK_STATUSES = ['draft', 'queued', 'running', 'awaiting_review', 'needs_changes', 'approved', 'released', 'failed', 'cancelled'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];
export type Priority = 'low' | 'normal' | 'high' | 'urgent';

export type Task = {
  id: string;
  title: string;
  description: string;
  acceptance_criteria: string;
  role_id: string;
  status: TaskStatus;
  priority: Priority;
  due_date: string | null;
  created_at: string;
  updated_at: string;
};

export type TaskEventType = 'created' | 'status_changed' | 'handoff' | 'note' | 'run_started' | 'run_finished' | 'review_recorded' | 'release_decision';
export type TaskEvent = {
  id: string;
  task_id: string;
  event_type: TaskEventType;
  actor_type: 'human' | 'agent' | 'system';
  actor_role_id: string | null;
  from_role_id: string | null;
  to_role_id: string | null;
  message: string;
  data: Record<string, unknown>;
  created_at: string;
};

export type RunMode = 'live' | 'simulated';
export type RunStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'refused' | 'cancelled';
export type Citation = { marker: string; chunk_id: string; source_id: string; source_title: string; locator: string | null };

export type AgentRun = {
  id: string;
  task_id: string;
  role_id: string;
  mode: RunMode;
  provider: string;
  model: string;
  status: RunStatus;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  output: string | null;
  citations: Citation[];
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
};

export type RunLog = { id: number; run_id: string; level: 'info' | 'warn' | 'error'; step: string; message: string; data: Record<string, unknown>; created_at: string };

export type RightsStatus = 'pending' | 'approved' | 'rejected' | 'restricted';
export type Source = {
  id: string;
  title: string;
  creator: string | null;
  source_url: string | null;
  rights_status: RightsStatus;
  permission_evidence: string | null;
  permitted_use: string | null;
  notes: string | null;
  rights_reviewed_at: string | null;
  created_at: string;
};
export type SourceChunk = { id: string; source_id: string; ordinal: number; content: string; locator: string | null; created_at: string };

export type CheckResult = { id: string; label: string; status: 'pass' | 'warn' | 'fail'; detail: string };
export type Verdict = 'pass' | 'fail' | 'needs_changes';
export type Review = {
  id: string;
  task_id: string;
  run_id: string | null;
  reviewer_role_id: string;
  reviewer_type: 'automated_check' | 'agent';
  verdict: Verdict;
  summary: string;
  checks: CheckResult[];
  created_at: string;
};

export type Decision = 'approved' | 'rejected' | 'requested_changes';
export type ApprovalEvent = { id: string; subject_type: 'task_release' | 'source_rights'; subject_id: string; decision: Decision; rationale: string; created_at: string };
