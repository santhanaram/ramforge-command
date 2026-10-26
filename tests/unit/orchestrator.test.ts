import { beforeEach, describe, expect, it } from 'vitest';
import { demoStore, resetDemo } from '@/lib/store/demo';
import { reviewTask, runAgent } from '@/lib/orchestrator';
import { simulatedProvider, type Provider } from '@/lib/ai/simulated';
import type { AiConfig } from '@/lib/env';
import { assertManualTransition } from '@/lib/governance';

const cfg: AiConfig = { live: false, provider: 'simulated', model: 'simulated-v1', effort: 'medium', maxOutputTokens: 4000, timeoutMs: 1000, dailyBudgetUsd: 1 };
const policyTask = async (store = demoStore(true)) => (await store.listTasks()).find((t) => t.title.includes('source policy'))!;

describe('orchestration and governance (demo store)', () => {
  beforeEach(() => resetDemo());

  it('runs, hands off to Vera, passes review and releases only with RAM approval', async () => {
    const store = demoStore(true);
    const task = await policyTask(store);
    const runId = await runAgent(store, task.id, simulatedProvider(), cfg);
    const run = (await store.getRun(runId))!;
    expect(run.mode).toBe('simulated');
    expect(run.status).toBe('succeeded');
    expect(run.citations.length).toBeGreaterThan(0);
    expect((await store.getTask(task.id))!.status).toBe('awaiting_review');
    const events = await store.listEvents(task.id);
    expect(events.find((e) => e.event_type === 'handoff')?.to_role_id).toBe('RF-063');
    expect((await store.listLogs(runId)).map((l) => l.step)).toEqual(['start', 'budget', 'retrieval', 'usage', 'handoff']);

    await expect(store.decideRelease(task.id, 'approved', 'too early')).rejects.toThrow(/passing Vera review/);
    const review = await reviewTask(store, task.id);
    expect(review.verdict).toBe('pass');
    expect((await store.getTask(task.id))!.status).toBe('approved');

    await expect(store.decideRelease(task.id, 'approved', '  ')).rejects.toThrow(/rationale/);
    await store.decideRelease(task.id, 'approved', 'Checked the citations');
    expect((await store.getTask(task.id))!.status).toBe('released');
    await expect(store.setTaskStatus(task.id, 'draft')).rejects.toThrow(/final/);
  });

  it('sends back output with a fabricated quote', async () => {
    const store = demoStore(true);
    const task = await policyTask(store);
    const liar: Provider = {
      name: 'fake', live: false,
      async generate() {
        return { text: '## Summary\nA confident summary of the policy for review.\n## Source-backed points\n- "Agents may say anything they like" [S1]', model: 'simulated-v1', inputTokens: 0, outputTokens: 0, stopReason: 'end_turn', refused: false, notes: [] };
      },
    };
    await runAgent(store, task.id, liar, cfg);
    const result = await reviewTask(store, task.id);
    expect(result.verdict).toBe('needs_changes');
    expect((await store.getTask(task.id))!.status).toBe('needs_changes');
  });

  it('records provider failures as failed runs with logs', async () => {
    const store = demoStore(true);
    const task = await policyTask(store);
    const broken: Provider = { name: 'broken', live: false, async generate() { throw new Error('timeout after 1000ms'); } };
    const runId = await runAgent(store, task.id, broken, cfg);
    expect((await store.getRun(runId))!.status).toBe('failed');
    expect((await store.getTask(task.id))!.status).toBe('failed');
    expect((await store.listLogs(runId)).some((l) => l.level === 'error' && l.message.includes('timeout'))).toBe(true);
  });

  it('refuses live runs that would exceed the daily budget', async () => {
    const store = demoStore(true);
    const task = await policyTask(store);
    const live: Provider = { ...simulatedProvider(), name: 'anthropic', live: true };
    await expect(runAgent(store, task.id, live, { ...cfg, live: true, model: 'claude-opus-5-5', maxOutputTokens: 100_000, dailyBudgetUsd: 0.5 })).rejects.toThrow(/budget/);
    expect(await store.listRuns(task.id)).toHaveLength(0);
  });

  it('blocks ingestion of unapproved sources and drops chunks when rights are withdrawn', async () => {
    const store = demoStore(true);
    const sources = await store.listSources();
    const pending = sources.find((s) => s.rights_status === 'pending')!;
    await expect(store.addChunks(pending.id, [{ ordinal: 0, content: 'x', locator: null }])).rejects.toThrow(/approved rights/);
    await expect(store.setSourceRights(pending.id, 'approved', '', 'no evidence')).rejects.toThrow(/evidence/);
    const approved = sources.find((s) => s.rights_status === 'approved')!;
    expect((await store.listApprovedChunks()).length).toBeGreaterThan(0);
    await store.setSourceRights(approved.id, 'restricted', null, 'Licence expired');
    expect(await store.listApprovedChunks()).toHaveLength(0);
  });

  it('keeps Vera independent and blocks manual approval', async () => {
    const store = demoStore(true);
    const t = await store.createTask({ title: 'Vera own audit', description: '', acceptance_criteria: '', role_id: 'RF-063', priority: 'normal', due_date: null });
    await store.setTaskStatus(t.id, 'awaiting_review');
    await expect(store.recordReview({ task_id: t.id, run_id: null, reviewer_role_id: 'RF-063', reviewer_type: 'agent', verdict: 'pass', summary: 'self', checks: [] })).rejects.toThrow(/own task/);
    await expect(store.recordReview({ task_id: t.id, run_id: null, reviewer_role_id: 'RF-031', reviewer_type: 'agent', verdict: 'pass', summary: 'x', checks: [] })).rejects.toThrow(/Vera division/);
    await expect(store.setTaskStatus(t.id, 'approved')).rejects.toThrow(/passing Vera review/);
    expect(() => assertManualTransition('draft', 'approved')).toThrow();
    expect(() => assertManualTransition('draft', 'queued')).not.toThrow();
  });

  it('makes the public demo read-only when writes are not allowed', async () => {
    const store = demoStore(false);
    await expect(store.createTask({ title: 'x', description: '', acceptance_criteria: '', role_id: 'RF-001', priority: 'normal', due_date: null })).rejects.toThrow(/read-only/);
  });
});
