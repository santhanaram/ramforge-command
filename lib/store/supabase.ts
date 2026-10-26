import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { GovernanceError, assertRightsChange } from '../governance';
import type { AgentRun, ApprovalEvent, Review, RunLog, Source, Task, TaskEvent } from '../types';
import type { ApprovedChunk, Store } from './types';

// Supabase-backed store. Every call runs as the signed-in user under row-level security;
// database triggers enforce the rights gate, review independence and the release gate.
export function supabaseStore(db: SupabaseClient, userId: string, userEmail: string | null): Store {
  const fail = (error: { message: string } | null) => {
    if (error) throw new GovernanceError(error.message);
  };
  const runCols = 'id,task_id,role_id,mode,provider,model,status,input_tokens,output_tokens,cost_usd,output,citations,error,started_at,finished_at,created_at';
  const taskCols = 'id,title,description,acceptance_criteria,role_id,status,priority,due_date,created_at,updated_at';

  return {
    mode: 'live', userEmail, canWrite: true,
    async listTasks() {
      const { data, error } = await db.from('assignments').select(taskCols).order('created_at', { ascending: false }).limit(500);
      fail(error);
      return (data ?? []) as Task[];
    },
    async getTask(id) {
      const { data, error } = await db.from('assignments').select(taskCols).eq('id', id).maybeSingle();
      fail(error);
      return (data as Task) ?? null;
    },
    async createTask(input) {
      const { data, error } = await db.from('assignments').insert({ ...input, owner_id: userId }).select(taskCols).single();
      fail(error);
      return data as Task;
    },
    async setTaskStatus(id, status) {
      const { error } = await db.from('assignments').update({ status }).eq('id', id);
      fail(error);
    },
    async setTaskRole(id, roleId) {
      const { error } = await db.from('assignments').update({ role_id: roleId }).eq('id', id);
      fail(error);
    },
    async addEvent(e) {
      const { error } = await db.from('task_events').insert({ ...e, owner_id: userId });
      fail(error);
    },
    async listEvents(taskId) {
      const { data, error } = await db.from('task_events').select('*').eq('task_id', taskId).order('created_at');
      fail(error);
      return (data ?? []) as TaskEvent[];
    },

    async createRun(input) {
      const { data, error } = await db.from('agent_runs').insert({ ...input, owner_id: userId }).select(runCols).single();
      fail(error);
      return data as AgentRun;
    },
    async updateRun(id, patch) {
      const { error } = await db.from('agent_runs').update(patch).eq('id', id);
      fail(error);
    },
    async addLog(runId, level, step, message, data = {}) {
      const { error } = await db.from('run_logs').insert({ owner_id: userId, run_id: runId, level, step, message: message.slice(0, 4000), data });
      fail(error);
    },
    async listRuns(taskId) {
      let q = db.from('agent_runs').select(runCols).order('created_at', { ascending: false }).limit(200);
      if (taskId) q = q.eq('task_id', taskId);
      const { data, error } = await q;
      fail(error);
      return (data ?? []).map((r) => ({ ...r, cost_usd: Number(r.cost_usd) })) as AgentRun[];
    },
    async getRun(id) {
      const { data, error } = await db.from('agent_runs').select(runCols).eq('id', id).maybeSingle();
      fail(error);
      return data ? ({ ...data, cost_usd: Number(data.cost_usd) } as AgentRun) : null;
    },
    async listLogs(runId) {
      const { data, error } = await db.from('run_logs').select('id,run_id,level,step,message,data,created_at').eq('run_id', runId).order('id');
      fail(error);
      return (data ?? []) as RunLog[];
    },
    async costSince(since) {
      const { data, error } = await db.from('agent_runs').select('cost_usd').gte('created_at', since);
      fail(error);
      return (data ?? []).reduce((s, r) => s + Number(r.cost_usd), 0);
    },

    async listSources() {
      const { data, error } = await db.from('sources').select('*, source_chunks(count)').order('created_at', { ascending: false });
      fail(error);
      return (data ?? []).map(({ source_chunks, ...s }) => ({ ...(s as Source), chunk_count: (source_chunks as { count: number }[])?.[0]?.count ?? 0 }));
    },
    async getSource(id) {
      const { data, error } = await db.from('sources').select('*').eq('id', id).maybeSingle();
      fail(error);
      return (data as Source) ?? null;
    },
    async createSource(input) {
      const { data, error } = await db.from('sources').insert({ ...input, owner_id: userId }).select('*').single();
      fail(error);
      return data as Source;
    },
    async setSourceRights(id, status, evidence, rationale) {
      const current = await this.getSource(id);
      if (!current) throw new GovernanceError('Source not found.');
      const ev = evidence?.trim() || current.permission_evidence;
      assertRightsChange(status, ev);
      const { error } = await db.from('sources').update({ rights_status: status, permission_evidence: ev }).eq('id', id);
      fail(error);
      const { error: e2 } = await db.from('approval_events').insert({ owner_id: userId, subject_type: 'source_rights', subject_id: id, decision: status === 'approved' ? 'approved' : 'rejected', rationale });
      fail(e2);
    },
    async addChunks(sourceId, chunks) {
      const { count, error: e1 } = await db.from('source_chunks').select('id', { count: 'exact', head: true }).eq('source_id', sourceId);
      fail(e1);
      const start = count ?? 0;
      const rows = chunks.map((c) => ({ owner_id: userId, source_id: sourceId, ordinal: start + c.ordinal, content: c.content, locator: c.locator }));
      const { error } = await db.from('source_chunks').insert(rows);
      fail(error);
      return rows.length;
    },
    async listApprovedChunks() {
      const { data, error } = await db.from('source_chunks').select('id,source_id,ordinal,content,locator,created_at,sources!inner(title,rights_status)')
        .eq('sources.rights_status', 'approved').limit(5000);
      fail(error);
      return (data ?? []).map(({ sources, ...c }) => ({ ...c, source_title: (sources as unknown as { title: string }).title })) as ApprovedChunk[];
    },

    async recordReview(input) {
      const { error } = await db.rpc('record_review', {
        p_task: input.task_id, p_run: input.run_id, p_reviewer: input.reviewer_role_id, p_type: input.reviewer_type,
        p_verdict: input.verdict, p_summary: input.summary, p_checks: input.checks,
      });
      fail(error);
    },
    async listReviews(taskId) {
      let q = db.from('reviews').select('*').order('created_at', { ascending: false }).limit(200);
      if (taskId) q = q.eq('task_id', taskId);
      const { data, error } = await q;
      fail(error);
      return (data ?? []) as Review[];
    },
    async decideRelease(taskId, decision, rationale) {
      const { error } = await db.rpc('decide_release', { p_task: taskId, p_decision: decision, p_rationale: rationale });
      fail(error);
    },
    async listApprovals() {
      const { data, error } = await db.from('approval_events').select('id,subject_type,subject_id,decision,rationale,created_at').order('created_at', { ascending: false }).limit(200);
      fail(error);
      return (data ?? []) as ApprovalEvent[];
    },
  };
}
