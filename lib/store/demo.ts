// In-memory demo store. Data lives in server memory and resets when the server restarts.
// It enforces the same governance rules as the Supabase triggers so the demo behaves honestly.
import { randomUUID } from 'node:crypto';
import { assertCanIngest, assertReleasable, assertReviewer, assertRightsChange, GovernanceError, latestReview } from '../governance';
import type { AgentRun, ApprovalEvent, Review, RunLog, Source, SourceChunk, Task, TaskEvent, TaskStatus } from '../types';
import type { ApprovedChunk, Store } from './types';

type DemoData = {
  tasks: Task[]; events: TaskEvent[]; runs: AgentRun[]; logs: RunLog[];
  sources: Source[]; chunks: SourceChunk[]; reviews: Review[]; approvals: ApprovalEvent[]; logSeq: number;
};

const now = () => new Date().toISOString();

function seed(): DemoData {
  const t = (title: string, role_id: string, description: string, acceptance_criteria: string): Task => ({
    id: randomUUID(), title, role_id, description, acceptance_criteria, status: 'draft', priority: 'normal', due_date: null, created_at: now(), updated_at: now(),
  });
  const tasks = [
    t('Draft the source rights approval checklist', 'RF-005', 'Write the checklist Iris uses before any source is ingested.', 'Covers evidence, permitted use, expiry and who approved.'),
    t('Summarise the RAMFORGE source policy for new team members', 'RF-049', 'Explain the source policy in plain language using the approved internal policy document.', 'Every point cites the policy. No claims beyond it.'),
    t('Design the framework card metadata fields', 'RF-019', 'Propose the fields every framework card must carry.', 'Separates documented and synthesis fields.'),
    t('Check dashboard accessibility on mobile', 'RF-032', 'Review the main screens at phone width for keyboard and contrast issues.', 'List of issues with severity.'),
  ];
  const policyId = randomUUID();
  const sources: Source[] = [{
    id: policyId, title: 'RAMFORGE source policy (internal demo document)', creator: 'RAM', source_url: null, rights_status: 'approved',
    permission_evidence: 'Internal document written for this workspace. Owned by RAM.', permitted_use: 'Internal training and answer grounding',
    notes: 'Fictional demo content. Contains no third-party material.', rights_reviewed_at: now(), created_at: now(),
  }, {
    id: randomUUID(), title: 'Example third-party book (rights not yet cleared)', creator: 'Unknown', source_url: null, rights_status: 'pending',
    permission_evidence: null, permitted_use: null, notes: 'Shows that pending sources cannot be ingested.', rights_reviewed_at: null, created_at: now(),
  }];
  const policy = [
    ['section 1', 'Every source must have written permission evidence before any of its text is stored. Public availability is not permission.'],
    ['section 2', 'Attribution is required for every quote, but attribution is never a substitute for permission.'],
    ['section 3', 'Agents may only make factual claims that cite an approved passage. Their own reasoning must be labelled as synthesis.'],
    ['section 4', 'Vera reviews every deliverable independently. Vera can recommend release but cannot authorise it.'],
    ['section 5', 'Only RAM, the human owner, can approve a public release, and must record a rationale for the decision.'],
  ];
  const chunks: SourceChunk[] = policy.map(([locator, content], i) => ({ id: randomUUID(), source_id: policyId, ordinal: i, content, locator, created_at: now() }));
  const events: TaskEvent[] = tasks.map((task) => ({
    id: randomUUID(), task_id: task.id, event_type: 'created', actor_type: 'system', actor_role_id: null, from_role_id: null, to_role_id: task.role_id,
    message: 'Demo task created with sample data.', data: {}, created_at: now(),
  }));
  return { tasks, events, runs: [], logs: [], sources, chunks, reviews: [], approvals: [], logSeq: 0 };
}

const g = globalThis as unknown as { __ramforgeDemo?: DemoData };
export function demoData(): DemoData {
  if (!g.__ramforgeDemo) g.__ramforgeDemo = seed();
  return g.__ramforgeDemo;
}
export function resetDemo() {
  g.__ramforgeDemo = seed();
}

export function demoStore(canWrite: boolean): Store {
  const d = demoData();
  const guard = () => {
    if (!canWrite) throw new GovernanceError('This public demo is read-only. Connect Supabase and sign in to make changes.');
  };
  const task = (id: string) => {
    const found = d.tasks.find((x) => x.id === id);
    if (!found) throw new GovernanceError('Task not found.');
    return found;
  };
  const setStatus = (t: Task, status: TaskStatus) => {
    if (t.status === 'released') throw new GovernanceError('Released tasks are final.');
    if (status === 'approved' && latestReview(d.reviews.filter((r) => r.task_id === t.id))?.verdict !== 'pass') {
      throw new GovernanceError('Only a passing Vera review can approve a task.');
    }
    t.status = status;
    t.updated_at = now();
  };

  return {
    mode: 'demo', userEmail: null, canWrite,
    async listTasks() { return [...d.tasks].sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async getTask(id) { return d.tasks.find((x) => x.id === id) ?? null; },
    async createTask(input) {
      guard();
      const t: Task = { id: randomUUID(), ...input, status: 'draft', created_at: now(), updated_at: now() };
      d.tasks.push(t);
      return t;
    },
    async setTaskStatus(id, status) {
      guard();
      if (status === 'released') throw new GovernanceError('Use the RAM release decision to release a task.');
      setStatus(task(id), status);
    },
    async setTaskRole(id, roleId) { guard(); const t = task(id); t.role_id = roleId; t.updated_at = now(); },
    async addEvent(e) {
      guard();
      d.events.push({ id: randomUUID(), created_at: now(), data: {}, actor_role_id: null, from_role_id: null, to_role_id: null, ...e });
    },
    async listEvents(taskId) { return d.events.filter((e) => e.task_id === taskId).sort((a, b) => a.created_at.localeCompare(b.created_at)); },

    async createRun(input) {
      guard();
      const run: AgentRun = { id: randomUUID(), ...input, status: 'queued', input_tokens: 0, output_tokens: 0, cost_usd: 0, output: null, citations: [], error: null, started_at: null, finished_at: null, created_at: now() };
      d.runs.push(run);
      return run;
    },
    async updateRun(id, patch) {
      guard();
      const run = d.runs.find((r) => r.id === id);
      if (!run) throw new GovernanceError('Run not found.');
      if (!['queued', 'running'].includes(run.status)) throw new GovernanceError('Finished runs cannot be edited.');
      Object.assign(run, patch);
    },
    async addLog(runId, level, step, message, data = {}) {
      guard();
      d.logs.push({ id: ++d.logSeq, run_id: runId, level, step, message, data, created_at: now() });
    },
    async listRuns(taskId) { return d.runs.filter((r) => !taskId || r.task_id === taskId).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async getRun(id) { return d.runs.find((r) => r.id === id) ?? null; },
    async listLogs(runId) { return d.logs.filter((l) => l.run_id === runId); },
    async costSince(since) { return d.runs.filter((r) => r.created_at >= since).reduce((s, r) => s + Number(r.cost_usd), 0); },

    async listSources() {
      return [...d.sources].sort((a, b) => b.created_at.localeCompare(a.created_at)).map((s) => ({ ...s, chunk_count: d.chunks.filter((c) => c.source_id === s.id).length }));
    },
    async getSource(id) { return d.sources.find((s) => s.id === id) ?? null; },
    async createSource(input) {
      guard();
      const s: Source = { id: randomUUID(), ...input, rights_status: 'pending', permission_evidence: null, rights_reviewed_at: null, created_at: now() };
      d.sources.push(s);
      return s;
    },
    async setSourceRights(id, status, evidence, rationale) {
      guard();
      const s = d.sources.find((x) => x.id === id);
      if (!s) throw new GovernanceError('Source not found.');
      const ev = evidence?.trim() || s.permission_evidence;
      assertRightsChange(status, ev);
      s.rights_status = status;
      s.permission_evidence = ev ?? null;
      s.rights_reviewed_at = now();
      if (status !== 'approved') d.chunks = d.chunks.filter((c) => c.source_id !== id);
      d.approvals.push({ id: randomUUID(), subject_type: 'source_rights', subject_id: id, decision: status === 'approved' ? 'approved' : 'rejected', rationale, created_at: now() });
    },
    async addChunks(sourceId, chunks) {
      guard();
      const s = d.sources.find((x) => x.id === sourceId);
      if (!s) throw new GovernanceError('Source not found.');
      assertCanIngest(s);
      const start = d.chunks.filter((c) => c.source_id === sourceId).length;
      for (const c of chunks) d.chunks.push({ id: randomUUID(), source_id: sourceId, ordinal: start + c.ordinal, content: c.content, locator: c.locator, created_at: now() });
      return chunks.length;
    },
    async listApprovedChunks() {
      const approved = new Map(d.sources.filter((s) => s.rights_status === 'approved').map((s) => [s.id, s.title]));
      return d.chunks.filter((c) => approved.has(c.source_id)).map((c): ApprovedChunk => ({ ...c, source_title: approved.get(c.source_id)! }));
    },

    async recordReview(input) {
      guard();
      const t = task(input.task_id);
      const producer = input.run_id ? d.runs.find((r) => r.id === input.run_id)?.role_id : null;
      assertReviewer(t, input.reviewer_role_id, producer);
      const review: Review = { id: randomUUID(), created_at: now(), ...input };
      d.reviews.push(review);
      setStatus(t, input.verdict === 'pass' ? 'approved' : 'needs_changes');
      d.events.push({ id: randomUUID(), task_id: t.id, event_type: 'review_recorded', actor_type: 'agent', actor_role_id: input.reviewer_role_id, from_role_id: null, to_role_id: null, message: input.summary, data: { verdict: input.verdict, review_id: review.id }, created_at: now() });
    },
    async listReviews(taskId) { return d.reviews.filter((r) => !taskId || r.task_id === taskId).sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async decideRelease(taskId, decision, rationale) {
      guard();
      if (!rationale.trim()) throw new GovernanceError('A rationale is required.');
      const t = task(taskId);
      if (decision === 'approved') assertReleasable(t, d.reviews.filter((r) => r.task_id === taskId));
      if (t.status === 'released') throw new GovernanceError('Released tasks are final.');
      d.approvals.push({ id: randomUUID(), subject_type: 'task_release', subject_id: taskId, decision, rationale, created_at: now() });
      t.status = decision === 'approved' ? 'released' : decision === 'requested_changes' ? 'needs_changes' : 'cancelled';
      t.updated_at = now();
      d.events.push({ id: randomUUID(), task_id: taskId, event_type: 'release_decision', actor_type: 'human', actor_role_id: null, from_role_id: null, to_role_id: null, message: rationale, data: { decision }, created_at: now() });
    },
    async listApprovals() { return [...d.approvals].sort((a, b) => b.created_at.localeCompare(a.created_at)); },
  };
}
