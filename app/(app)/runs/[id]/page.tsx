import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/PageHeader';
import { StatusTag } from '@/components/StatusTag';
import { roleById } from '@/data/workforce';
import { getStore } from '@/lib/store';

export default async function RunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const store = await getStore();
  const run = await store.getRun(id);
  if (!run) notFound();
  const [logs, task] = await Promise.all([store.listLogs(id), store.getTask(run.task_id)]);
  const role = roleById(run.role_id);
  const duration = run.started_at && run.finished_at ? ((new Date(run.finished_at).getTime() - new Date(run.started_at).getTime()) / 1000).toFixed(1) : null;
  return (
    <>
      <PageHeader eyebrow="Agent runs / log" title={`Run by ${role?.name ?? run.role_id}`} intro={task ? `Task: ${task.title}` : undefined}>
        <StatusTag status={run.mode} label={run.mode === 'live' ? 'Live model run' : 'Simulated run'} />
        <StatusTag status={run.status} />
      </PageHeader>
      <div className="cards">
        <div className="metric"><span>Provider and model</span><strong className="metricsmall">{run.provider} / {run.model}</strong></div>
        <div className="metric"><span>Tokens in / out</span><strong className="metricsmall">{run.input_tokens.toLocaleString()} / {run.output_tokens.toLocaleString()}</strong></div>
        <div className="metric"><span>Cost</span><strong className="metricsmall">${Number(run.cost_usd).toFixed(6)}</strong></div>
        <div className="metric"><span>Duration</span><strong className="metricsmall">{duration ? `${duration} s` : 'n/a'}</strong></div>
      </div>
      <div className="layout2">
        <section className="panel">
          <h2>Output</h2>
          {run.output ? <pre className="output">{run.output}</pre> : <p>{run.error ?? 'No output recorded.'}</p>}
          {task && <Link className="btn" href={`/tasks/${task.id}`}>Back to task</Link>}
        </section>
        <section className="panel">
          <h2>Execution log</h2>
          <ol className="timeline">
            {logs.map((l) => (
              <li key={l.id} className={`log ${l.level}`}>
                <div className="small muted">{new Date(l.created_at).toLocaleTimeString('en-GB')} · {l.level} · {l.step}</div>
                <div className="small">{l.message}</div>
              </li>
            ))}
          </ol>
          <p className="small muted">Logs are append-only. They cannot be edited or deleted from the app.</p>
        </section>
      </div>
    </>
  );
}
