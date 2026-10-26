// Vera's automated evidence checks. These are deterministic and do not use a language model,
// so they stay independent of the model that wrote the output.
import type { CheckResult, Verdict } from './types';

export type SuppliedSource = { marker: string; chunk_id: string; source_id: string; source_title: string; locator: string | null; content: string };

const norm = (s: string) => s.toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();

const ENDORSEMENT = [
  /\bendorsed by alex hormozi\b/i,
  /\balex hormozi (endorses|approves|recommends this|has reviewed)\b/i,
  /\b(official|approved) (alex hormozi|acquisition\.com) (advice|content|programme|program)\b/i,
  /\b(i am|i'm|as) alex hormozi\b/i,
  /\bin partnership with (alex hormozi|acquisition\.com)\b/i,
];
const SECRETS = [/sk-ant-[a-z0-9_-]{8,}/i, /sb_secret_[a-z0-9_-]{8,}/i, /service_role/i, /-----BEGIN [A-Z ]*PRIVATE KEY-----/, /eyJ[a-zA-Z0-9_-]{20,}\.[a-zA-Z0-9_-]{20,}\./];

export function extractMarkers(text: string): string[] {
  return [...new Set([...text.matchAll(/\[(S\d+)\]/g)].map((m) => m[1]))];
}

export function extractQuotes(text: string): { quote: string; marker: string }[] {
  const out: { quote: string; marker: string }[] = [];
  for (const m of text.matchAll(/["“]([^"“”]{6,400})["”]\s*\[(S\d+)\]/g)) out.push({ quote: m[1], marker: m[2] });
  return out;
}

function section(text: string, heading: RegExp): string[] {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^#{1,4}\s/.test(l) && heading.test(l));
  if (start < 0) return [];
  const body: string[] = [];
  for (const l of lines.slice(start + 1)) {
    if (/^#{1,4}\s/.test(l)) break;
    if (/^\s*[-*]\s+/.test(l)) body.push(l.replace(/^\s*[-*]\s+/, ''));
  }
  return body;
}

export type VerificationResult = { verdict: Verdict; summary: string; checks: CheckResult[] };

export function verifyOutput(output: string, supplied: SuppliedSource[], opts: { simulated: boolean }): VerificationResult {
  const checks: CheckResult[] = [];
  const add = (id: string, label: string, status: CheckResult['status'], detail: string) => checks.push({ id, label, status, detail });
  const byMarker = new Map(supplied.map((s) => [s.marker, s]));

  add('non_empty', 'Output present', output.trim().length > 40 ? 'pass' : 'fail', output.trim().length > 40 ? 'The run produced a deliverable.' : 'The output is empty or too short to review.');

  const markers = extractMarkers(output);
  const unknown = markers.filter((m) => !byMarker.has(m));
  add('citations_known', 'Citations point to supplied sources', unknown.length ? 'fail' : 'pass',
    unknown.length ? `Unknown citation markers: ${unknown.join(', ')}. These do not match any approved source passage.` : `${markers.length} citation marker(s), all matched to approved passages.`);

  const quotes = extractQuotes(output);
  const badQuotes = quotes.filter((q) => {
    const src = byMarker.get(q.marker);
    return !src || !norm(src.content).includes(norm(q.quote));
  });
  add('quotes_exact', 'Quotes appear word for word in the cited passage', badQuotes.length ? 'fail' : 'pass',
    badQuotes.length ? `Not found in the cited passage: ${badQuotes.map((q) => `"${q.quote.slice(0, 60)}" [${q.marker}]`).join('; ')}` : quotes.length ? `${quotes.length} quote(s) checked against their passages.` : 'No direct quotes to check.');

  const backed = section(output, /source-backed/i);
  const uncited = backed.filter((b) => !/\[S\d+\]/.test(b));
  add('claims_cited', 'Every source-backed point has a citation', uncited.length ? 'fail' : 'pass',
    uncited.length ? `${uncited.length} point(s) in the source-backed section have no citation.` : backed.length ? `${backed.length} source-backed point(s), all cited.` : 'No source-backed points were made.');

  if (!supplied.length) add('evidence_available', 'Approved evidence available', 'warn', 'No approved source passages matched this task, so the output is unverified synthesis. RAM should weigh this before release.');
  else if (!markers.length) add('evidence_used', 'Evidence used', 'warn', 'Approved passages were supplied but the output cites none of them.');
  else add('evidence_used', 'Evidence used', 'pass', `${markers.length} of ${supplied.length} supplied passage(s) cited.`);

  const endorsement = ENDORSEMENT.filter((r) => r.test(output));
  add('identity', 'No impersonation or implied endorsement', endorsement.length ? 'fail' : 'pass',
    endorsement.length ? 'The output speaks as, or implies endorsement by, the source author. Rewrite in an independent voice.' : 'No impersonation or endorsement wording detected.');

  const secrets = SECRETS.filter((r) => r.test(output));
  add('secrets', 'No credentials in output', secrets.length ? 'fail' : 'pass', secrets.length ? 'The output contains text that looks like a credential.' : 'No credential patterns detected.');

  add('provider', 'Live model output', opts.simulated ? 'warn' : 'pass', opts.simulated ? 'This output came from the simulated provider, not a live AI model. Treat it as a workflow test.' : 'Output came from a live model run with logged tokens and cost.');

  const fails = checks.filter((c) => c.status === 'fail');
  const warns = checks.filter((c) => c.status === 'warn');
  const verdict: Verdict = fails.length ? 'needs_changes' : 'pass';
  const summary = fails.length
    ? `Needs changes: ${fails.map((f) => f.label.toLowerCase()).join('; ')}.`
    : `Evidence checks passed${warns.length ? ` with ${warns.length} warning(s) for RAM to weigh` : ''}.`;
  return { verdict, summary, checks };
}
