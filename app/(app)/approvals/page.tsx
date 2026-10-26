import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { StatusTag } from '@/components/StatusTag';
import { roleById } from '@/data/workforce';
import { latestReview } from '@/lib/governance';
import { getStore } from '@/lib/store';

export default async function ApprovalsPage() {
  const store = await getStore();
  const [tasks, reviews, approvals, sources] = await Promise.all([store.listTasks(), store.listReviews(), store.listApprovals(), store.listSources()]);
  const awaitingRam = tasks.filter((t) => t.status === 'approved');
  const awaitingVera = tasks.filter((t) => t.status === 'awaiting_review');
  const subject = (type: string, id: string) => type === 'task_release' ? tasks.find((t) => t.id === id)?.title : sources.find((s) => s.id === id)?.title;
  return (
    <>
      <PageHeader eyebrow="Approvals" title="Governance and release" intro="Vera reviews independently and recommends. Only RAM, the human owner, can release. Every decision is permanent in the audit trail." />
      <div className="layout2">
        <section className="panel">
          <h2>Waiting for RAM ({awaitingRam.length})</h2>
          {awaitingRam.map((t) => {
            const r = latestReview(reviews.filter((x) => x.task_id === t.id));
            return (
              <Link key={t.id} href={`/tasks/${t.id}`} className="listrow">
                <div style={{ flex: 1 }}><strong className="rowtitle">{t.title}</strong><div className="small muted">{roleById(t.role_id)?.name} · Vera: {r?.summary}</div></div>
                <span className="btn">Decide</span>
              </Link>
            );
          })}
          {!awaitingRam.length && <p>Nothing is waiting for your decision.</p>}
          <h2 style={{ marginTop: 24 }}>Waiting for Vera ({awaitingVera.length})</h2>
          {awaitingVera.map((t) => <Link key={t.id} href={`/tasks/${t.id}`} className="listrow"><span style={{ flex: 1 }}>{t.title}</span><StatusTag status={t.status} /></Link>)}
          {!awaitingVera.length && <p>No outputs are waiting for review.</p>}
        </section>
        <section className="panel">
          <h2>Decision log</h2>
          {approvals.map((a) => (
            <div key={a.id} className="listrow">
              <div style={{ flex: 1 }}>
                <div className="small muted">{new Date(a.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })} · {a.subject_type === 'task_release' ? 'Release' : 'Source rights'}</div>
                <strong className="rowtitle">{subject(a.subject_type, a.subject_id) ?? 'Removed item'}</strong>
                <div className="small">{a.rationale}</div>
              </div>
              <StatusTag status={a.decision === 'approved' ? 'pass' : 'fail'} label={a.decision.replace('_', ' ')} />
            </div>
          ))}
          {!approvals.length && <p>No decisions recorded yet.</p>}
        </section>
      </div>
    </>
  );
}
