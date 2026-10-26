import { PageHeader } from '@/components/PageHeader';
import { TokenCounter } from '@/components/TokenCounter';
import {
  SOURCE_CHECKED_ON, acceptanceCriteria, approvalClasses, candidateTools, forgeLeads, leadCharter, phases, securityRules, toolStatus, workflow,
} from '@/data/contextforge';

const stateTag = { live: ['good', 'Live'], off: ['', 'Off'], blocked: ['bad', 'Blocked'] } as const;

export const metadata = { title: 'ContextForge | RAMFORGE Command' };

export default function ContextForgePage() {
  const live = candidateTools.filter((t) => toolStatus[t.id].state === 'live');
  const sourced = candidateTools.filter((t) => toolStatus[t.id].source).length;
  const noSource = candidateTools.filter((t) => !t.repository).length;
  return (
    <>
      <PageHeader eyebrow="ContextForge" title="ContextForge AI Research Lab" intro="A planned research orchestration lab: candidate tools, five governance leads, approval classes and a phased build plan. One tool is connected and working. The rest are planned." />
      <div className="alert sim" role="note">
        Mostly a plan. Only the tool marked Live works, and it runs in your browser. No crawling, browsing or model call happens on this page. A source check means the package registry points to the same repository. It is not a full licence, security or endorsement review.
      </div>

      <div className="cards" style={{ marginTop: 20 }}>
        <div className="metric"><span>Candidate tools</span><strong>{candidateTools.length}</strong><span>Registered for review</span></div>
        <div className="metric"><span>Live tools</span><strong>{live.length}</strong><span>{live.map((t) => t.name).join(', ')}, running in your browser</span></div>
        <div className="metric"><span>Source checked</span><strong>{sourced}</strong><span>{noSource} have no repository to check</span></div>
        <div className="metric"><span>Governance leads</span><strong>{forgeLeads.length}</strong><span>Agents propose, humans authorise</span></div>
      </div>

      <section className="panel" aria-labelledby="cf-tokens">
        <div className="secrow"><h2 id="cf-tokens">Token counter</h2><span className="tag good">Live: Tiktoken, in your browser</span></div>
        <p className="small">Counts how many tokens a piece of text uses, which is how AI models measure length and cost. Your text stays on your device. These counts are for OpenAI models; Claude counts tokens differently, so treat them as an estimate.</p>
        <TokenCounter />
      </section>

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

      <section className="panel" aria-labelledby="cf-tools">
        <h2 id="cf-tools">Tool registry</h2>
        <p className="small">Sources checked on {SOURCE_CHECKED_ON} against PyPI and npm. Every tool other than the live one stays off, and the reason is shown for each.</p>
        <div className="tablewrap">
          <table className="table">
            <thead><tr><th scope="col">ID</th><th scope="col">Tool</th><th scope="col">Source check</th><th scope="col">State and reason</th></tr></thead>
            <tbody>
              {candidateTools.map((t) => {
                const st = toolStatus[t.id];
                const [tone, label] = stateTag[st.state];
                return (
                  <tr key={t.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>{t.id}</td>
                    <td>
                      {t.repository
                        ? <a className="link" href={t.repository} target="_blank" rel="noopener noreferrer">{t.name}<span className="sr-only"> (repository, opens in a new tab)</span></a>
                        : t.name}
                    </td>
                    <td className="small">
                      {st.source
                        ? <><span className="tag good">Repository matches</span><br />{st.source.registry} {st.source.pkg} {st.source.version}, {st.source.licence}, released {st.source.released}</>
                        : <span className="tag warn">{t.repository ? 'Not on a registry' : 'No source'}</span>}
                    </td>
                    <td className="small"><span className={`tag ${tone}`}>{label}</span><br />{st.why}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="layout2">
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
