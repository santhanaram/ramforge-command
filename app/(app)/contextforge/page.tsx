import { PageHeader } from '@/components/PageHeader';
import {
  acceptanceCriteria, approvalClasses, candidateTools, forgeLeads, leadCharter, phases, securityRules, verificationLabel, workflow,
} from '@/data/contextforge';

export const metadata = { title: 'ContextForge | RAMFORGE Command' };

export default function ContextForgePage() {
  const withLink = candidateTools.filter((t) => t.repository).length;
  const enabled = candidateTools.filter((t) => t.enabled).length;
  return (
    <>
      <PageHeader eyebrow="ContextForge" title="ContextForge AI Research Lab" intro="A planned research orchestration lab: candidate tools, five governance leads, approval classes and a phased build plan. This tab shows the plan. Nothing in it is installed or running." />
      <div className="alert sim" role="note">
        Planning view only. No tool on this page is installed, connected or enabled, and no crawling, browsing or model call happens here. Repository links are candidates that still need an identity and licence check, not verified or endorsed projects.
      </div>

      <div className="cards" style={{ marginTop: 20 }}>
        <div className="metric"><span>Candidate tools</span><strong>{candidateTools.length}</strong><span>Registered for review</span></div>
        <div className="metric"><span>Enabled tools</span><strong>{enabled}</strong><span>All stay off until reviewed and approved</span></div>
        <div className="metric"><span>With a candidate link</span><strong>{withLink}</strong><span>{candidateTools.length - withLink} still have no confirmed identity</span></div>
        <div className="metric"><span>Governance leads</span><strong>{forgeLeads.length}</strong><span>Agents propose, humans authorise</span></div>
      </div>

      <section className="panel" aria-labelledby="cf-leads">
        <h2 id="cf-leads">Leadership agents</h2>
        <p className="small">Each lead follows the same ten-step charter: {leadCharter.join(', ').toLowerCase()}. None of them claims a task is done without evidence.</p>
        <div className="rolegrid" style={{ marginTop: 14 }}>
          {forgeLeads.map((l) => (
            <article key={l.name} className="rolecard">
              <span className="tag">{l.title}</span>
              <h3>{l.name}</h3>
              <p className="small">{l.mission}</p>
              <p className="small muted">Focus: {l.brief}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="layout2">
        <section className="panel" aria-labelledby="cf-tools">
          <h2 id="cf-tools">Tool registry</h2>
          <p className="small">Every tool is disabled and needs human approval. A link here means a likely upstream repository was named, not that its identity, licence or safety has been checked.</p>
          <div className="tablewrap">
            <table className="table">
              <thead><tr><th scope="col">ID</th><th scope="col">Tool</th><th scope="col">Review status</th><th scope="col">State</th></tr></thead>
              <tbody>
                {candidateTools.map((t) => (
                  <tr key={t.id}>
                    <td>{t.id}</td>
                    <td>
                      {t.repository
                        ? <a className="link" href={t.repository} target="_blank" rel="noopener noreferrer">{t.name}<span className="sr-only"> (candidate repository, opens in a new tab)</span></a>
                        : t.name}
                    </td>
                    <td><span className={`tag ${t.repository ? 'approval' : 'warn'}`}>{verificationLabel[t.verification]}</span></td>
                    <td><span className="tag">{t.enabled ? 'Enabled' : 'Disabled'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <div>
          <section className="panel" aria-labelledby="cf-approvals">
            <h2 id="cf-approvals">Approval classes</h2>
            {approvalClasses.map((c) => (
              <div key={c.code} className="listrow">
                <span className={`tag ${c.signOff ? 'approval' : 'good'}`}>{c.code}</span>
                <div><strong className="rowtitle">{c.label}</strong><p className="small">{c.signOff ? 'Needs explicit human sign-off.' : 'Allowed within agreed scope.'}</p></div>
              </div>
            ))}
          </section>

          <section className="panel" aria-labelledby="cf-flow">
            <h2 id="cf-flow">Research workflow</h2>
            <ol className="small duties">{workflow.map((s) => <li key={s}>{s}</li>)}</ol>
          </section>
        </div>
      </div>

      <div className="layout2">
        <section className="panel" aria-labelledby="cf-plan">
          <h2 id="cf-plan">Delivery plan</h2>
          {phases.map((p) => (
            <div key={p.phase} className="listrow">
              <span className="tag">{p.phase}</span>
              <p className="small">{p.scope}</p>
            </div>
          ))}
          <h3>Acceptance criteria</h3>
          <ul className="small duties">{acceptanceCriteria.map((c) => <li key={c}>{c}</li>)}</ul>
        </section>

        <section className="panel" aria-labelledby="cf-security">
          <h2 id="cf-security">Security and research policy</h2>
          <ul className="small duties">{securityRules.map((r) => <li key={r}>{r}</li>)}</ul>
          <p className="small">The full package (plan, policy, agent charters, tool list and a reference database schema that has not been applied) is kept in <code>docs/contextforge/</code>.</p>
        </section>
      </div>
    </>
  );
}
