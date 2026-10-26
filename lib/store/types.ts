import type { AgentRun, ApprovalEvent, CheckResult, Citation, Decision, Priority, Review, RightsStatus, RunLog, RunMode, Source, SourceChunk, Task, TaskEvent, TaskStatus, Verdict } from '../types';
import type { ChunkInput } from '../ingest';

export type NewTask = { title: string; description: string; acceptance_criteria: string; role_id: string; priority: Priority; due_date: string | null };
export type NewEvent = Omit<TaskEvent, 'id' | 'created_at' | 'data' | 'actor_role_id' | 'from_role_id' | 'to_role_id'> &
  Partial<Pick<TaskEvent, 'data' | 'actor_role_id' | 'from_role_id' | 'to_role_id'>>;
export type NewRun = { task_id: string; role_id: string; mode: RunMode; provider: string; model: string };
export type RunPatch = Partial<Pick<AgentRun, 'status' | 'input_tokens' | 'output_tokens' | 'cost_usd' | 'output' | 'citations' | 'error' | 'started_at' | 'finished_at' | 'model'>>;
export type NewSource = { title: string; creator: string | null; source_url: string | null; permitted_use: string | null; notes: string | null };
export type ApprovedChunk = SourceChunk & { source_title: string };
export type NewReview = { task_id: string; run_id: string | null; reviewer_role_id: string; reviewer_type: Review['reviewer_type']; verdict: Verdict; summary: string; checks: CheckResult[] };

// One interface, two implementations: an in-memory demo store and the Supabase store.
// Governance rules are enforced in both (in code for demo, by database triggers and RLS for Supabase).
export interface Store {
  mode: 'demo' | 'live';
  userEmail: string | null;
  canWrite: boolean;

  listTasks(): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(input: NewTask): Promise<Task>;
  setTaskStatus(id: string, status: TaskStatus): Promise<void>;
  setTaskRole(id: string, roleId: string): Promise<void>;
  addEvent(event: NewEvent): Promise<void>;
  listEvents(taskId: string): Promise<TaskEvent[]>;

  createRun(input: NewRun): Promise<AgentRun>;
  updateRun(id: string, patch: RunPatch): Promise<void>;
  addLog(runId: string, level: RunLog['level'], step: string, message: string, data?: Record<string, unknown>): Promise<void>;
  listRuns(taskId?: string): Promise<AgentRun[]>;
  getRun(id: string): Promise<AgentRun | null>;
  listLogs(runId: string): Promise<RunLog[]>;
  costSince(sinceIso: string): Promise<number>;

  listSources(): Promise<(Source & { chunk_count: number })[]>;
  getSource(id: string): Promise<Source | null>;
  createSource(input: NewSource): Promise<Source>;
  setSourceRights(id: string, status: RightsStatus, evidence: string | null, rationale: string): Promise<void>;
  addChunks(sourceId: string, chunks: ChunkInput[]): Promise<number>;
  listApprovedChunks(): Promise<ApprovedChunk[]>;

  recordReview(input: NewReview): Promise<void>;
  listReviews(taskId?: string): Promise<Review[]>;
  decideRelease(taskId: string, decision: Decision, rationale: string): Promise<void>;
  listApprovals(): Promise<ApprovalEvent[]>;
}

export type { Citation };
