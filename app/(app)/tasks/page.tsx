import Link from 'next/link';
import { createTaskAction } from '@/app/actions';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { RoleSelect } from '@/components/RoleSelect';
import { StatusTag } from '@/components/StatusTag';
import { SubmitButton } from '@/components/SubmitButton';
import { divisionNames, roleById } from '@/data/workforce';
import { getStore } from '@/lib/store';
import { TASK_STATUSES } from '@/lib/types';

export default async function TasksPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const store = await getStore();
  const all = await store.listTasks();
  const tasks = all.filter((t) => (!sp.status || t.status === sp.status) && (!sp.division || roleById(t.role_id)?.division === sp.division));
  const href = (k: string, v?: string) => {
    const p = new URLSearchParams(Object.entries({ status: sp.status, division: sp.division, [k]: v }).filter(([, x]) => x) as [string, string][]);
    return `/tasks${p.size ? `?${p}` : ''}`;
  };

  return (
    <>
      <PageHeader eyebrow="Tasks" title="Tasks" intro="Each task has one accountable role, acceptance criteria, an audit trail, agent runs, a Vera review and a RAM release decision." />
      <Notice ok={sp.ok} error={sp.error} />
      <section className="panel">
        <h2>Create a task</h2>
        {!store.canWrite && <p className="alert">This public demo is read-only.</p>}
        <form action={createTaskAction} className="form grid2">
          <label className="span2">Title<input className="field" name="title" required maxLength={500} placeholder="Describe the deliverable" /></label>
          <label>Accountable role<RoleSelect /></label>
          <div className="grid2">
            <label>Priority<select className="field" name="priority" defaultValue="normal"><option value="low">Low</option><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select></label>
            <label>Due date<input className="field" type="date" name="due_date" /></label>
          </div>
          <label>Description<textarea className="field" name="description" rows={3} maxLength={8000} placeholder="Context, inputs and constraints" /></label>
          <label>Acceptance criteria<textarea className="field" name="acceptance_criteria" rows={3} maxLength={4000} placeholder="How Vera and RAM will judge it" /></label>
          <div className="span2"><SubmitButton pendingText="Creating..." disabled={!store.canWrite}>Create task</SubmitButton></div>
        </form>
      </section>
      <section className="panel">
        <div className="secrow"><h2>All tasks</h2><span className="muted small">{tasks.length} of {all.length}</span></div>
        <div className="filters" aria-label="Filter by status">
          <Link className={`tag ${!sp.status ? 'info' : ''}`} href={href('status')}>Any status</Link>
          {TASK_STATUSES.map((s) => <Link key={s} className={`tag ${sp.status === s ? 'info' : ''}`} href={href('status', s)}>{s.replace(/_/g, ' ')}</Link>)}
        </div>
        <div className="filters" aria-label="Filter by division">
          <Link className={`tag ${!sp.division ? 'info' : ''}`} href={href('division')}>All divisions</Link>
          {divisionNames.map((d) => <Link key={d} className={`tag ${sp.division === d ? 'info' : ''}`} href={href('division', d)}>{d}</Link>)}
        </div>
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th>Task</th><th>Accountable role</th><th>Priority</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t.id}>
                  <td><Link className="link" href={`/tasks/${t.id}`}>{t.title}</Link></td>
                  <td>{roleById(t.role_id)?.name}<div className="muted small">{roleById(t.role_id)?.division}</div></td>
                  <td>{t.priority}</td>
                  <td><StatusTag status={t.status} /></td>
                  <td className="small">{new Date(t.updated_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!tasks.length && <p className="empty">No tasks match.</p>}
        </div>
      </section>
    </>
  );
}
