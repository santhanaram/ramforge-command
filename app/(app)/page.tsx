import Link from 'next/link';
import { ChevronRight, CheckCircle2, ClipboardList } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Portrait } from '@/components/Portrait';
import { StatusTag } from '@/components/StatusTag';
import { divisionLabels, roleById, workforce } from '@/data/workforce';
import { getStore } from '@/lib/store';

export default async function Overview() {
  const store = await getStore();
  const [tasks, runs] = await Promise.all([store.listTasks(), store.listRuns()]);
  const today = new Date().toISOString().slice(0, 10);
  const runsToday = runs.filter((r) => r.created_at.startsWith(today));
  const open = tasks.filter((t) => !['released', 'cancelled'].includes(t.status));
  const heads = workforce.filter((r) => r.level === 'head');
  const byDivision = (div: string) => tasks.filter((t) => roleById(t.role_id)?.division === div);

  return (
    <>
      <PageHeader eyebrow="Overview" title="Your AI workforce, in command." intro="Five divisions. Seventy-five roles. Every run logged, every output reviewed by Vera, every release approved by RAM." />
      <div className="cards">
        <div className="metric"><span>Open tasks</span><strong>{open.length}</strong><span>{tasks.length} in total</span></div>
        <div className="metric"><span>Awaiting Vera review</span><strong>{tasks.filter((t) => t.status === 'awaiting_review').length}</strong><span>Independent evidence checks</span></div>
        <div className="metric"><span>Awaiting RAM release</span><strong>{tasks.filter((t) => t.status === 'approved').length}</strong><span>Human decision required</span></div>
        <div className="metric"><span>Agent runs today</span><strong>{runsToday.length}</strong><span>${runsToday.reduce((s, r) => s + Number(r.cost_usd), 0).toFixed(4)} spent · {runsToday.filter((r) => r.mode === 'simulated').length} simulated</span></div>
      </div>

      <div className="secrow"><h2>Command divisions</h2><Link className="btn" href="/workforce">Explore roles <ChevronRight size={15} aria-hidden /></Link></div>
      <div className="divisiongrid">
        {heads.map((head) => {
          const dt = byDivision(head.division);
          return (
            <Link className="divisioncard" key={head.id} href={`/workforce?division=${head.division}`}>
              <Portrait role={head} />
              <strong>{head.name}</strong>
              <small>{head.title}</small>
              <div className="divmeta" style={{ color: head.color }}>{head.division} · {divisionLabels[head.division]}</div>
              <div className="divstats"><span>{dt.filter((t) => !['released', 'cancelled'].includes(t.status)).length} open</span><span>{dt.filter((t) => t.status === 'released').length} released</span></div>
            </Link>
          );
        })}
      </div>

      <div className="layout2">
        <section className="panel">
          <div className="secrow"><h2>Work queue</h2><Link className="btn" href="/tasks">All tasks</Link></div>
          {open.slice(0, 6).map((t) => (
            <Link className="listrow" key={t.id} href={`/tasks/${t.id}`}>
              <ClipboardList size={19} color="#8daccf" aria-hidden />
              <div style={{ flex: 1 }}><strong className="rowtitle">{t.title}</strong><div className="muted small">{roleById(t.role_id)?.name} · {roleById(t.role_id)?.title}</div></div>
              <StatusTag status={t.status} />
            </Link>
          ))}
          {!open.length && <p>No open tasks. <Link href="/tasks" className="link">Create one</Link>.</p>}
        </section>
        <section className="panel">
          <h2>Operating rules</h2>
          {['No source text is stored until its rights are approved with evidence', 'Agents cite approved passages; their own reasoning is labelled synthesis', 'Vera checks every output independently of the role that wrote it', 'Only RAM can release, and must record a reason', 'No impersonation of, or implied endorsement by, any expert'].map((x) => (
            <div key={x} className="listrow"><CheckCircle2 color="#79ddcc" size={18} aria-hidden /><span className="small">{x}</span></div>
          ))}
        </section>
      </div>
    </>
  );
}
