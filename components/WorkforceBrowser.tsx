'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { divisionLabels, divisionNames, workforce, type Role } from '@/data/workforce';
import { Portrait } from './Portrait';

function RoleCard({ role, open }: { role: Role; open: number }) {
  return (
    <Link href={`/workforce/${role.id}`} className="rolecard">
      <div className="smallrow"><Portrait role={role} size={45} /><span className="tag">{role.level}</span>{open > 0 && <span className="tag info">{open} open</span>}</div>
      <h3>{role.name}</h3>
      <div className="small" style={{ color: role.color }}>{role.division} · {role.id}</div>
      <p className="small">{role.title}</p>
      <div className="smallrow muted small" style={{ justifyContent: 'space-between' }}>Reports to {role.manager ?? 'RAM'} <ChevronRight size={16} aria-hidden /></div>
    </Link>
  );
}

const matches = (r: Role, q: string) =>
  !q || [r.name, r.title, r.division, r.id, r.mission, ...r.skills, ...r.tasks].join(' ').toLowerCase().includes(q);

export function WorkforceBrowser({ initialDivision, initialQuery, openByRole }: { initialDivision: string; initialQuery: string; openByRole: Record<string, number> }) {
  const [query, setQuery] = useState(initialQuery);
  const [division, setDivision] = useState(divisionNames.includes(initialDivision) ? initialDivision : 'All');
  const [level, setLevel] = useState('All');
  const q = query.trim().toLowerCase();
  const shown = useMemo(() => workforce.filter((r) => (division === 'All' || r.division === division) && (level === 'All' || r.level === level) && matches(r, q)), [division, level, q]);
  const grouped = !q && level === 'All';

  return (
    <>
      <div className="toolbar" role="search">
        <label className="sr-only" htmlFor="wf-search">Search the workforce</label>
        <input id="wf-search" className="field" placeholder="Search names, titles, skills and responsibilities" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="sr-only" htmlFor="wf-division">Division</label>
        <select id="wf-division" className="field narrow" value={division} onChange={(e) => setDivision(e.target.value)}>
          <option value="All">All divisions</option>
          {divisionNames.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <label className="sr-only" htmlFor="wf-level">Level</label>
        <select id="wf-level" className="field narrow" value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="All">All levels</option><option value="head">Division heads</option><option value="lead">Team leads</option><option value="specialist">Specialists</option>
        </select>
      </div>
      <p aria-live="polite">{shown.length} of {workforce.length} roles shown.</p>
      {grouped ? (
        divisionNames.filter((d) => division === 'All' || d === division).map((d) => {
          const head = workforce.find((r) => r.division === d && r.level === 'head')!;
          const leads = workforce.filter((r) => r.division === d && r.level === 'lead');
          return (
            <section key={d} className="division" aria-labelledby={`div-${d}`}>
              <h2 id={`div-${d}`} style={{ color: head.color }}>{d} <span className="muted small">{divisionLabels[d]}</span></h2>
              <div className="rolegrid"><RoleCard role={head} open={openByRole[head.id] ?? 0} /></div>
              {leads.map((lead) => (
                <div key={lead.id} className="team">
                  <h3 className="teamtitle">{lead.name}&apos;s team</h3>
                  <div className="rolegrid">
                    <RoleCard role={lead} open={openByRole[lead.id] ?? 0} />
                    {workforce.filter((r) => r.managerId === lead.id).map((s) => <RoleCard key={s.id} role={s} open={openByRole[s.id] ?? 0} />)}
                  </div>
                </div>
              ))}
            </section>
          );
        })
      ) : (
        <div className="rolegrid">{shown.map((r) => <RoleCard key={r.id} role={r} open={openByRole[r.id] ?? 0} />)}</div>
      )}
      {!shown.length && <p className="empty">No roles match. Try a different word.</p>}
    </>
  );
}
