// Server-side orchestration: run a task's assigned agent, log every step, cost the run,
// hand the output to an independent Vera reviewer, and leave release to RAM.
import { roleById } from '@/data/workforce';
import type { AiConfig } from './env';
import { assertRunnable, GovernanceError, pickReviewer } from './governance';
import { buildSystem, buildUser, PROMPT_VERSION } from './ai/prompt';
import { costUsd, maxRunCost } from './ai/pricing';
import type { Provider } from './ai/simulated';
import { search } from './retrieval';
import type { Store } from './store/types';
import type { Citation } from './types';
import { extractMarkers, verifyOutput, type SuppliedSource } from './verification';

const startOfUtcDay = () => new Date(new Date().toISOString().slice(0, 10)).toISOString();
const approxTokens = (s: string) => Math.ceil(s.length / 4);

export async function runAgent(store: Store, taskId: string, provider: Provider, cfg: AiConfig): Promise<string> {
  const task = await store.getTask(taskId);
  if (!task) throw new GovernanceError('Task not found.');
  assertRunnable(task);
  const role = roleById(task.role_id);
  if (!role) throw new GovernanceError(`Unknown role ${task.role_id}.`);

  // Retrieve approved passages only. The store never returns chunks from unapproved sources.
  const chunks = await store.listApprovedChunks();
  const hits = search(chunks, `${task.title} ${task.description} ${task.acceptance_criteria}`, 6);
  const supplied: SuppliedSource[] = hits.map((h, i) => ({
    marker: `S${i + 1}`, chunk_id: h.item.id, source_id: h.item.source_id, source_title: h.item.source_title, locator: h.item.locator, content: h.item.content,
  }));
  const system = buildSystem(role);
  const user = buildUser(task, supplied);

  // Budget gate: refuse a run whose worst case would exceed today's budget.
  const spent = await store.costSince(startOfUtcDay());
  const worst = maxRunCost(cfg.model, approxTokens(system + user), cfg.maxOutputTokens);
  if (provider.live && spent + worst > cfg.dailyBudgetUsd) {
    throw new GovernanceError(`Daily AI budget would be exceeded ($${spent.toFixed(2)} spent, this run could cost up to $${worst.toFixed(2)}, limit $${cfg.dailyBudgetUsd.toFixed(2)}).`);
  }

  const run = await store.createRun({ task_id: task.id, role_id: role.id, mode: provider.live ? 'live' : 'simulated', provider: provider.name, model: cfg.model });
  const started = Date.now();
  await store.updateRun(run.id, { status: 'running', started_at: new Date().toISOString() });
  await store.setTaskStatus(task.id, 'running');
  await store.addEvent({ task_id: task.id, event_type: 'run_started', actor_type: 'system', actor_role_id: role.id, message: `${role.name} started a ${provider.live ? 'live' : 'simulated'} run.`, data: { run_id: run.id } });
  await store.addLog(run.id, 'info', 'start', `Run started for ${role.name} (${role.id}) using ${provider.name}/${cfg.model}.`, { prompt_version: PROMPT_VERSION, simulated: !provider.live });
  await store.addLog(run.id, 'info', 'budget', `Spent today $${spent.toFixed(4)}; worst case for this run $${worst.toFixed(4)}; limit $${cfg.dailyBudgetUsd.toFixed(2)}.`);
  await store.addLog(run.id, 'info', 'retrieval', supplied.length ? `Retrieved ${supplied.length} approved passage(s).` : 'No approved passages matched this task.',
    { passages: supplied.map((s) => ({ marker: s.marker, chunk_id: s.chunk_id, source: s.source_title, locator: s.locator })) });

  try {
    const result = await provider.generate({ system, user, sources: supplied, taskTitle: task.title });
    const cost = costUsd(result.model, result.inputTokens, result.outputTokens);
    for (const note of result.notes) await store.addLog(run.id, 'warn', 'provider', note);
    await store.addLog(run.id, 'info', 'usage', `Model ${result.model}: ${result.inputTokens} input and ${result.outputTokens} output tokens, cost $${cost.toFixed(6)}.`, { stop_reason: result.stopReason, latency_ms: Date.now() - started });

    const used = new Set(extractMarkers(result.text));
    const citations: Citation[] = supplied.filter((s) => used.has(s.marker)).map(({ marker, chunk_id, source_id, source_title, locator }) => ({ marker, chunk_id, source_id, source_title, locator }));
    const status = result.refused ? 'refused' : 'succeeded';
    await store.updateRun(run.id, {
      status, model: result.model, output: result.text, citations, input_tokens: result.inputTokens, output_tokens: result.outputTokens, cost_usd: cost, finished_at: new Date().toISOString(),
    });
    await store.addEvent({ task_id: task.id, event_type: 'run_finished', actor_type: 'agent', actor_role_id: role.id, message: result.refused ? 'The model declined this task.' : `Run finished with ${citations.length} citation(s).`, data: { run_id: run.id, status } });
    if (result.refused) {
      await store.setTaskStatus(task.id, 'failed');
      return run.id;
    }
    // Handoff: the producing role passes its output to an independent Vera reviewer.
    const reviewer = pickReviewer(task, role.id);
    await store.setTaskStatus(task.id, 'awaiting_review');
    await store.addEvent({ task_id: task.id, event_type: 'handoff', actor_type: 'system', from_role_id: role.id, to_role_id: reviewer, message: `Output handed to ${roleById(reviewer)?.name} for independent review.`, data: { run_id: run.id } });
    await store.addLog(run.id, 'info', 'handoff', `Handed to ${roleById(reviewer)?.name} (${reviewer}) for Vera review.`);
    return run.id;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await store.addLog(run.id, 'error', 'provider', `Run failed: ${message}`);
    await store.updateRun(run.id, { status: 'failed', error: message, finished_at: new Date().toISOString() });
    await store.setTaskStatus(task.id, 'failed');
    await store.addEvent({ task_id: task.id, event_type: 'run_finished', actor_type: 'system', actor_role_id: role.id, message: `Run failed: ${message}`, data: { run_id: run.id, status: 'failed' } });
    return run.id;
  }
}

// Vera's independent review of the latest successful run. Uses deterministic evidence checks.
export async function reviewTask(store: Store, taskId: string) {
  const task = await store.getTask(taskId);
  if (!task) throw new GovernanceError('Task not found.');
  if (task.status !== 'awaiting_review') throw new GovernanceError('Only tasks awaiting review can be reviewed.');
  const run = (await store.listRuns(taskId)).find((r) => r.status === 'succeeded');
  if (!run?.output) throw new GovernanceError('There is no successful run to review.');
  const chunks = await store.listApprovedChunks();
  const byId = new Map(chunks.map((c) => [c.id, c]));
  // Rebuild the passages the agent was given from the run log, so markers are checked against the same evidence.
  const logs = await store.listLogs(run.id);
  const retrieval = logs.find((l) => l.step === 'retrieval')?.data as { passages?: { marker: string; chunk_id: string; source: string; locator: string | null }[] } | undefined;
  const supplied: SuppliedSource[] = (retrieval?.passages ?? []).flatMap((p) => {
    const c = byId.get(p.chunk_id);
    // A passage whose rights were withdrawn since the run is no longer valid evidence.
    return c ? [{ marker: p.marker, chunk_id: c.id, source_id: c.source_id, source_title: c.source_title, locator: c.locator, content: c.content }] : [];
  });
  const result = verifyOutput(run.output, supplied, { simulated: run.mode === 'simulated' });
  const reviewer = pickReviewer(task, run.role_id);
  await store.recordReview({ task_id: task.id, run_id: run.id, reviewer_role_id: reviewer, reviewer_type: 'automated_check', verdict: result.verdict, summary: result.summary, checks: result.checks });
  return result;
}
