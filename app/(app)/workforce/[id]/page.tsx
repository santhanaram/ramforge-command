import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createTaskAction } from '@/app/actions';
import { PageHeader } from '@/components/PageHeader';
import { Portrait } from '@/components/Portrait';
import { StatusTag } from '@/components/StatusTag';
import { SubmitButton } from '@/components/SubmitButton';
import { portraits } from '@/data/portraits';
import { identityFor, portraitBrief } from '@/data/identities';
import { videos, youtubeUrl } from '@/data/videos';
import { directReports, roleById } from '@/data/workforce';
import { getStore } from '@/lib/store';

export default async function RolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const role = roleById(id);
  if (!role) notFound();
  const store = await getStore();
  const tasks = (await store.listTasks()).filter((t) => t.role_id === role.id);
  const reports = directReports(role.id);
  const identity = identityFor(role);
  const portrait = portraits[role.id];
  const roleVideos = videos[role.id] ?? [];

  return (
    <>
      <PageHeader eyebrow={`Workforce / ${role.division} / ${role.id}`} title={role.name} intro={role.title} />
      <div className="layout2">
        <section className="panel">
          <div className="profilehead">
            <Portrait role={role} size={96} />
            <div>
              <p>{role.mission}</p>
              <p className="small">Level: <strong>{role.level}</strong> · Reports to: {role.managerId ? <Link className="link" href={`/workforce/${role.managerId}`}>{role.manager}</Link> : <strong>RAM</strong>}</p>
            </div>
          </div>
          <h3>Ten responsibilities</h3>
          <ol className="duties">{role.tasks.map((t) => <li key={t}>{t}</li>)}</ol>
          <p className="small muted">These describe the role. They are not a record of work done. Real work appears as tasks, runs and reviews.</p>
          <h3>Skills</h3>
          <div className="chips">{role.skills.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
          <h3>Strengths</h3>
          <div className="chips">{role.strengths.map((s) => <span className="tag" key={s}>{s}</span>)}</div>
          {reports.length > 0 && (<>
            <h3>Direct reports</h3>
            <div className="chips">{reports.map((r) => <Link className="tag link" key={r.id} href={`/workforce/${r.id}`}>{r.name}</Link>)}</div>
          </>)}
        </section>
        <div>
          <section className="panel">
            <h2>Assign a task</h2>
            <form action={createTaskAction} className="form">
              <input type="hidden" name="role_id" value={role.id} />
              <input type="hidden" name="priority" value="normal" />
              <label>Title<input className="field" name="title" required maxLength={500} placeholder={`What should ${role.name.split(' ')[0]} do?`} /></label>
              <label>Description<textarea className="field" name="description" rows={3} maxLength={8000} /></label>
              <label>Acceptance criteria<textarea className="field" name="acceptance_criteria" rows={2} maxLength={4000} /></label>
              <SubmitButton pendingText="Creating...">Create task</SubmitButton>
            </form>
          </section>
          <section className="panel">
            <h2>Tasks for {role.name.split(' ')[0]}</h2>
            {tasks.map((t) => <Link key={t.id} href={`/tasks/${t.id}`} className="listrow"><span style={{ flex: 1 }}>{t.title}</span><StatusTag status={t.status} /></Link>)}
            {!tasks.length && <p>No tasks assigned yet.</p>}
          </section>
          <section className="panel">
            <h2>Learn the craft: five YouTube videos</h2>
            {roleVideos.length ? (
              <ol className="videos">
                {roleVideos.map((v) => <li key={v.id}><a className="link" href={youtubeUrl(v.id)} target="_blank" rel="noopener noreferrer">{v.title}</a></li>)}
              </ol>
            ) : <p>No videos listed for this role yet.</p>}
            <p className="small muted">Public videos found by web search for this role&apos;s subject area. Inclusion is not endorsement, and no creator listed here is affiliated with RAMFORGE. Links open YouTube in a new tab.</p>
          </section>
          <section className="panel">
            <h2>Portrait and identity</h2>
            {portrait ? <p className="small">This is a fictional person, not a real individual. Portrait credit: {portrait.credit}. Licence: {portrait.licence}.</p> : <p className="small">No portrait supplied yet. The initials are a placeholder. Add a licensed or self-made image using the brief below.</p>}
            <dl className="identity">
              <dt>Style</dt><dd>{identity.style}</dd>
              <dt>Framing</dt><dd>{identity.framing}</dd>
              <dt>Palette</dt><dd>{identity.palette}</dd>
              <dt>Expression</dt><dd>{identity.expression}</dd>
              <dt>Appearance</dt><dd>{identity.appearance}</dd>
            </dl>
            <details><summary>Portrait brief to copy</summary><p className="small brief">{portraitBrief(role)}</p></details>
          </section>
        </div>
      </div>
    </>
  );
}
