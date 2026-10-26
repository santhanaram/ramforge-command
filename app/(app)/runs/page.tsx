import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { StatusTag } from '@/components/StatusTag';
import { roleById } from '@/data/workforce';
import { aiConfig } from '@/lib/env';
import { getStore } from '@/lib/store';

export default async function RunsPage() {
  const store = await getStore();
  const [runs, tasks] = await Promise.all([store.listRuns(), store.listTasks()]);
  const title = new Map(tasks.map((t) => [t.id, t.title]));
  const ai = aiConfig();
  const today = new Date().toISOString().slice(0, 10);
  const spentToday = runs.filter((r) => r.created_at.startsWith(today)).reduce((s, r) => s + Number(r.cost_usd), 0);
  return (
    <>
      <PageHeader eyebrow="Agent runs" title="Agent runs" intro="Every run records its role, mode, model, tokens, cost, duration and a step-by-step log." />
      <div className="cards">
        <div className="metric"><span>Total runs</span><strong>{runs.length}</strong><span>{runs.filter((r) => r.mode === 'live').length} live · {runs.filter((r) => r.mode === 'simulated').length} simulated</span></div>
        <div className="metric"><span>Spent today (UTC)</span><strong>${spentToday.toFixed(4)}</strong><span>Daily budget ${ai.dailyBudgetUsd.toFixed(2)}</span></div>
        <div className="metric"><span>Tokens (all runs)</span><strong>{runs.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0).toLocaleString()}</strong><span>Input plus output</span></div>
        <div className="metric"><span>Failed or refused</span><strong>{runs.filter((r) => ['failed', 'refused'].includes(r.status)).length}</strong><span>See logs for causes</span></div>
      </div>
      <section className="panel">
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th>When</th><th>Task</th><th>Role</th><th>Mode</th><th>Model</th><th>Tokens in / out</th><th>Cost</th><th>Status</th></tr></thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id}>
                  <td className="small"><Link className="link" href={`/runs/${r.id}`}>{new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'medium' })}</Link></td>
                  <td><Link className="link" href={`/tasks/${r.task_id}`}>{title.get(r.task_id) ?? 'Task'}</Link></td>
                  <td>{roleById(r.role_id)?.name}</td>
                  <td><StatusTag status={r.mode} /></td>
                  <td className="small">{r.model}</td>
                  <td className="small">{r.input_tokens.toLocaleString()} / {r.output_tokens.toLocaleString()}</td>
                  <td className="small">${Number(r.cost_usd).toFixed(6)}</td>
                  <td><StatusTag status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!runs.length && <p className="empty">No agent runs yet. Open a task and run its agent.</p>}
        </div>
      </section>
    </>
  );
}
