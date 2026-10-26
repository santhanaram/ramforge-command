import { createSourceAction, ingestAction, setRightsAction } from '@/app/actions';
import { Notice } from '@/components/Notice';
import { PageHeader } from '@/components/PageHeader';
import { StatusTag } from '@/components/StatusTag';
import { SubmitButton } from '@/components/SubmitButton';
import { getStore } from '@/lib/store';

export default async function KnowledgePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const store = await getStore();
  const sources = await store.listSources();
  return (
    <>
      <PageHeader eyebrow="Knowledge" title="Source library and rights" intro="Add a source, record your permission evidence, then add its text. Agents can only cite passages from approved sources." />
      <Notice ok={sp.ok} error={sp.error} />
      <div className="alert">Nothing is preloaded. No Alex Hormozi books, transcripts or course material are included. Public availability is not permission: only add text you have the right to use for this purpose.</div>
      <div className="layout2" style={{ marginTop: 20 }}>
        <section className="panel">
          <h2>Sources</h2>
          {sources.map((s) => (
            <article key={s.id} className="source">
              <div className="secrow"><h3>{s.title}</h3><StatusTag status={s.rights_status} label={`rights ${s.rights_status}`} /></div>
              <p className="small muted">{[s.creator, s.source_url].filter(Boolean).join(' · ') || 'No creator or link recorded'} · {s.chunk_count} passage(s) stored</p>
              {s.permitted_use && <p className="small">Permitted use: {s.permitted_use}</p>}
              {s.permission_evidence && <p className="small">Evidence: {s.permission_evidence}</p>}
              <details>
                <summary>Rights decision</summary>
                <form action={setRightsAction} className="form">
                  <input type="hidden" name="id" value={s.id} />
                  <label>Rights status<select className="field" name="rights_status" defaultValue={s.rights_status}><option value="pending">Pending</option><option value="approved">Approved</option><option value="restricted">Restricted</option><option value="rejected">Rejected</option></select></label>
                  <label>Permission evidence (required to approve)<textarea className="field" name="permission_evidence" rows={2} defaultValue={s.permission_evidence ?? ''} placeholder="Licence reference, written permission, or proof you own it" /></label>
                  <label>Why (kept in the audit trail)<input className="field" name="rationale" required /></label>
                  <SubmitButton className="btn" pendingText="Saving...">Save rights decision</SubmitButton>
                </form>
              </details>
              <details>
                <summary>Add text {s.rights_status !== 'approved' && '(locked until rights are approved)'}</summary>
                <form action={ingestAction} className="form">
                  <input type="hidden" name="id" value={s.id} />
                  <label>Text to store<textarea className="field" name="text" rows={6} disabled={s.rights_status !== 'approved'} placeholder="Paste text. Lines like [page 12] or [00:14:05] set the citation locator for what follows." /></label>
                  <SubmitButton className="btn" pendingText="Storing..." disabled={s.rights_status !== 'approved'}>Store passages</SubmitButton>
                </form>
              </details>
            </article>
          ))}
          {!sources.length && <p className="empty">No sources yet.</p>}
        </section>
        <div>
          <section className="panel">
            <h2>Add a source</h2>
            <form action={createSourceAction} className="form">
              <label>Title<input className="field" name="title" required maxLength={300} /></label>
              <label>Creator or publisher<input className="field" name="creator" maxLength={200} /></label>
              <label>Link<input className="field" name="source_url" type="url" maxLength={1000} placeholder="https://" /></label>
              <label>Intended use<input className="field" name="permitted_use" maxLength={500} placeholder="For example: internal training only" /></label>
              <label>Notes<textarea className="field" name="notes" rows={2} maxLength={2000} /></label>
              <SubmitButton pendingText="Adding...">Add source (rights pending)</SubmitButton>
            </form>
          </section>
          <section className="panel">
            <h2>How the pipeline works</h2>
            <ol className="small duties">
              <li>Add the source. Its rights start as pending.</li>
              <li>Record permission evidence and approve. Without evidence, approval is refused.</li>
              <li>Paste the text. It is split into passages with page or time locators.</li>
              <li>Agents retrieve matching passages and must cite them as [S1], [S2].</li>
              <li>Vera checks every citation and that every quote appears word for word.</li>
              <li>Withdrawing rights deletes the stored passages immediately.</li>
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}
