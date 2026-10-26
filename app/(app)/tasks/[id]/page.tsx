import Link from 'next/link';
import { notFound } from 'next/navigation';
import { addNoteAction, changeStatusAction, decideReleaseAction, handoffAction, reviewTaskAction, runTaskAction } from '@/app/actions';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { Portrait } from '@/components/Portrait';
import { RoleSelect } from '@/components/RoleSelect';
import { StatusTag } from '@/components/StatusTag';
import { SubmitButton } from '@/components/SubmitButton';
import { roleById } from '@/data/workforce';
import { aiConfig } from '@/lib/env';
import { allowedManualStatuses, latestReview } from '@/lib/governance';
import { getStore } from '@/lib/store';

// Agent runs execute inside the server action, so allow time for a live model call.
export const maxDuration = 300;

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' });

export default async function TaskPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const store = await getStore();
  const task = await store.getTask(id);
  if (!task) notFound();
  const [events, runs, reviews] = await Promise.all([store.listEvents(id), store.listRuns(id), store.listReviews(id)]);
  const role = roleById(task.role_id)!;
  const ai = aiConfig();
  const review = latestReview(reviews);
  const lastRun = runs[0];
  const runnable = ['draft', 'queued', 'needs_changes', 'failed'].includes(task.status);
  const manual = allowedManualStatuses(task.status);

  return (
    <>
      <PageHeader eyebrow={`Tasks / ${role.division}`} title={task.title}>
        <StatusTag status={task.status} />
        <span className="tag">{task.priority} priority</span>
      </PageHeader>
      <Notice ok={sp.ok} error={sp.error} />
      <div className="layout2">
        <div>
          <section className="panel">
            <div className="profilehead">
              <Portrait role={role} size={56} />
              <div><strong>Accountable: <Link className="link" href={`/workforce/${role.id}`}>{role.name}</Link></strong><div className="muted small">{role.title} · {role.id}</div></div>
            </div>
            <h3>Description</h3><p className="pre">{task.description || 'No description.'}</p>
            <h3>Acceptance criteria</h3><p className="pre">{task.acceptance_criteria || 'None given.'}</p>
            {task.due_date && <p className="small">Due {task.due_date}</p>}
          </section>

          <section className="panel" aria-labelledby="next-step">
            <h2 id="next-step">Next step</h2>
            {runnable && (
              <form action={runTaskAction}>
                <input type="hidden" name="id" value={task.id} />
                <p>Run {role.name}&apos;s agent on this task. It retrieves approved source passages, writes a cited draft and hands it to Vera.</p>
                <p className={`alert ${ai.live ? '' : 'sim'}`}>{ai.live ? `This is a live model call (${ai.model}). Tokens and cost are logged against the daily budget of $${ai.dailyBudgetUsd.toFixed(2)}.` : 'Simulated mode: no AI model will be called. The output is a labelled placeholder that exercises the workflow.'}</p>
                <SubmitButton pendingText="Agent is working...">{ai.live ? 'Run live agent' : 'Run simulated agent'}</SubmitButton>
              </form>
            )}
            {task.status === 'running' && <p>An agent run is in progress or was interrupted. Check the run log below.</p>}
            {task.status === 'awaiting_review' && (
              <form action={reviewTaskAction}>
                <input type="hidden" name="id" value={task.id} />
                <p>Vera checks citations, exact quotes, uncited claims, impersonation or endorsement wording and credentials. The reviewer is always a different role from the author.</p>
                <SubmitButton pendingText="Vera is reviewing...">Run Vera review</SubmitButton>
              </form>
            )}
            {task.status === 'approved' && (
              <form action={decideReleaseAction} className="form">
                <input type="hidden" name="id" value={task.id} />
                <p><strong>RAM release gate.</strong> Vera has recommended this output. Only you, as the human owner, can release it.</p>
                {review && review.checks.some((c) => c.status === 'warn') && <p className="alert">Vera raised warnings: {review.checks.filter((c) => c.status === 'warn').map((c) => c.detail).join(' ')}</p>}
                <fieldset className="radios"><legend className="sr-only">Decision</legend>
                  <label><input type="radio" name="decision" value="approved" required /> Approve release</label>
                  <label><input type="radio" name="decision" value="requested_changes" /> Request changes</label>
                  <label><input type="radio" name="decision" value="rejected" /> Reject</label>
                </fieldset>
                <label>Rationale (required, kept in the audit trail)<textarea className="field" name="rationale" rows={2} required maxLength={2000} /></label>
                <SubmitButton pendingText="Recording...">Record RAM decision</SubmitButton>
              </form>
            )}
            {task.status === 'released' && <p>Released by RAM. This task is final.</p>}
            {task.status === 'cancelled' && <p>Cancelled.</p>}
          </section>

          {lastRun && (
            <section className="panel">
              <div className="secrow"><h2>Latest output</h2><Link className="btn" href={`/runs/${lastRun.id}`}>Run log</Link></div>
              <div className="smallrow wrap"><StatusTag status={lastRun.mode} label={lastRun.mode === 'live' ? 'Live model output' : 'Simulated output'} /><StatusTag status={lastRun.status} /><span className="muted small">{lastRun.model} · ${Number(lastRun.cost_usd).toFixed(6)}</span></div>
              {lastRun.output ? <pre className="output">{lastRun.output}</pre> : <p>{lastRun.error ?? 'No output.'}</p>}
              {lastRun.citations.length > 0 && (<>
                <h3>Cited sources</h3>
                <ul className="small">{lastRun.citations.map((c) => <li key={c.marker}>[{c.marker}] {c.source_title}, {c.locator ?? 'no locator'}</li>)}</ul>
              </>)}
            </section>
          )}

          {review && (
            <section className="panel">
              <h2>Vera review</h2>
              <p><StatusTag status={review.verdict === 'pass' ? 'pass' : 'fail'} label={review.verdict.replace('_', ' ')} /> by {roleById(review.reviewer_role_id)?.name} ({review.reviewer_type.replace('_', ' ')}) · {when(review.created_at)}</p>
              <p>{review.summary}</p>
              <ul className="checks">{review.checks.map((c) => <li key={c.id}><StatusTag status={c.status} /> <strong>{c.label}.</strong> <span className="muted">{c.detail}</span></li>)}</ul>
            </section>
          )}
        </div>

        <div>
          <section className="panel">
            <h2>Hand off</h2>
            <form action={handoffAction} className="form">
              <input type="hidden" name="id" value={task.id} />
              <label>New accountable role<RoleSelect defaultValue={task.role_id} /></label>
              <label>Handoff note<textarea className="field" name="note" rows={2} required maxLength={2000} placeholder="What the next role needs to know" /></label>
              <SubmitButton className="btn" pendingText="Handing off...">Hand off task</SubmitButton>
            </form>
          </section>
          {manual.length > 0 && (
            <section className="panel">
              <h2>Change status</h2>
              <form action={changeStatusAction} className="smallrow wrap">
                <input type="hidden" name="id" value={task.id} />
                <label className="sr-only" htmlFor="status">New status</label>
                <select id="status" className="field narrow" name="status">{manual.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}</select>
                <SubmitButton className="btn">Update</SubmitButton>
              </form>
              <p className="small muted">Approved and released can only be reached through Vera review and RAM release.</p>
            </section>
          )}
          <section className="panel">
            <h2>Audit trail</h2>
            <ol className="timeline">
              {events.map((e) => (
                <li key={e.id}>
                  <div className="small muted">{when(e.created_at)} · {e.actor_type}{e.actor_role_id ? ` · ${roleById(e.actor_role_id)?.name}` : ''}</div>
                  <div><strong>{e.event_type.replace(/_/g, ' ')}</strong>{e.from_role_id && e.to_role_id ? `: ${roleById(e.from_role_id)?.name} to ${roleById(e.to_role_id)?.name}` : ''}</div>
                  {e.message && <div className="small">{e.message}</div>}
                </li>
              ))}
            </ol>
            <form action={addNoteAction} className="form">
              <input type="hidden" name="id" value={task.id} />
              <label>Add a note<textarea className="field" name="note" rows={2} required maxLength={2000} /></label>
              <SubmitButton className="btn" pendingText="Adding...">Add note</SubmitButton>
            </form>
          </section>
          <section className="panel">
            <h2>Runs</h2>
            {runs.map((r) => <Link key={r.id} href={`/runs/${r.id}`} className="listrow"><span style={{ flex: 1 }} className="small">{when(r.created_at)}</span><StatusTag status={r.mode} /><StatusTag status={r.status} /></Link>)}
            {!runs.length && <p>No runs yet.</p>}
          </section>
        </div>
      </div>
    </>
  );
}
