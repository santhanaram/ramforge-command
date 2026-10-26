// ContextForge AI Research Lab: a planning package for a research orchestration lab, shown read-only in its own tab.
// Source of truth for the tool list is docs/contextforge/tools.json, copied unchanged from the package.
// toolStatus below records what was checked and connected. Only tools marked 'live' do anything.
import tools from '@/docs/contextforge/tools.json';

export type CandidateTool = {
  id: string;
  name: string;
  repository: string | null;
  verification: 'unverified_identity' | 'candidate_link_review_required';
  enabled: boolean;
  approval_required: boolean;
};

export const candidateTools = tools as CandidateTool[];

export const verificationLabel: Record<CandidateTool['verification'], string> = {
  unverified_identity: 'Identity unverified',
  candidate_link_review_required: 'Link found, review needed',
};

// Phase 0 source check, done 2026-10-26: does the package registry entry point back to the same GitHub repository?
// Licence and last release are as published on the registry for the package, not a full legal review.
export const SOURCE_CHECKED_ON = '2026-10-26';

export type SourceCheck = { registry: 'PyPI' | 'npm'; pkg: string; version: string; released: string; licence: string };

export type ToolStatus = {
  state: 'live' | 'off' | 'blocked';
  source?: SourceCheck;
  why: string;
};

const noSource = 'No source to check. The package names this tool but gives no repository, so it cannot be identified or connected.';

export const toolStatus: Record<string, ToolStatus> = {
  'T-01': { state: 'off', why: noSource },
  'T-02': { state: 'off', why: noSource },
  'T-03': { state: 'off', why: noSource },
  'T-04': { state: 'off', why: noSource },
  'T-05': {
    state: 'live',
    source: { registry: 'PyPI', pkg: 'tiktoken', version: '0.14.0', released: '2026-08-17', licence: 'MIT' },
    why: 'Connected as the token counter below. It uses js-tiktoken 1.0.21 (MIT), a JavaScript port, and runs in your browser. Counts are for OpenAI models, not Claude.',
  },
  'T-06': { state: 'off', source: { registry: 'PyPI', pkg: 'llmlingua', version: '0.2.2', released: '2024-04-09', licence: 'MIT' }, why: 'Python only and needs a downloaded language model, so it needs a separate worker server. No release since April 2024.' },
  'T-07': { state: 'off', source: { registry: 'PyPI', pkg: 'gptcache', version: '0.1.44', released: '2024-08-01', licence: 'MIT' }, why: 'Python cache service that needs a worker and storage. No release since August 2024.' },
  'T-08': { state: 'off', source: { registry: 'PyPI', pkg: 'litellm', version: '1.106.4', released: '2026-10-25', licence: 'MIT' }, why: 'Python model gateway. Only useful with paid model provider keys (P2), and needs a worker.' },
  'T-09': { state: 'off', source: { registry: 'PyPI', pkg: 'outlines', version: '1.3.3', released: '2026-08-06', licence: 'Apache-2.0' }, why: 'Python library that needs a language model to drive it, so it needs a worker and a model.' },
  'T-10': { state: 'off', source: { registry: 'PyPI', pkg: 'vllm', version: '0.32.0', released: '2026-10-18', licence: 'Apache-2.0' }, why: 'Model serving engine. Needs a paid GPU server (P2).' },
  'T-11': { state: 'off', source: { registry: 'PyPI', pkg: 'openhands-ai', version: '1.11.0', released: '2026-07-09', licence: 'MIT' }, why: 'Runs coding agents in containers. Needs a container host and a paid model key (P2, P3 if it deploys).' },
  'T-12': { state: 'off', why: noSource },
  'T-13': { state: 'off', why: noSource },
  'T-14': { state: 'off', why: noSource },
  'T-15': { state: 'off', why: noSource },
  'T-16': { state: 'off', why: noSource },
  'T-17': { state: 'off', why: noSource },
  'T-18': { state: 'off', why: noSource },
  'T-19': { state: 'off', why: noSource },
  'T-20': { state: 'off', why: noSource },
  'T-21': { state: 'off', source: { registry: 'PyPI', pkg: 'firecrawl-py', version: '4.54.0', released: '2026-10-22', licence: 'MIT (client library)' }, why: 'Hosted crawling service that needs a paid account key (P2). Crawling also needs sign-in and a domain allowlist first.' },
  'T-22': { state: 'off', source: { registry: 'PyPI', pkg: 'crawl4ai', version: '0.9.5', released: '2026-10-14', licence: 'Apache-2.0' }, why: 'Python with a headless browser, so it needs a worker. Crawling (P1) also needs sign-in and a domain allowlist.' },
  'T-23': { state: 'off', source: { registry: 'PyPI', pkg: 'browser-use', version: '0.13.11', released: '2026-10-07', licence: 'MIT' }, why: 'Drives a real browser with an AI model. Needs a worker, a paid model key and P2 approval.' },
  'T-24': { state: 'off', source: { registry: 'npm', pkg: 'crawlee', version: '3.18.2', released: '2026-10-25', licence: 'Apache-2.0' }, why: 'Could run on this site, but anyone could then crawl from it: the site has no sign-in, and the plan forbids anonymous tool runs. Needs sign-in and a domain allowlist first.' },
  'T-25': { state: 'off', source: { registry: 'PyPI', pkg: 'scrapy', version: '2.19.0', released: '2026-09-10', licence: 'BSD-3-Clause' }, why: 'Python crawler, so it needs a worker. Crawling (P1) also needs sign-in and a domain allowlist.' },
  'T-26': { state: 'off', source: { registry: 'PyPI', pkg: 'markitdown', version: '0.1.9', released: '2026-10-21', licence: 'MIT' }, why: 'Python only, so it needs a worker. The plan names it as the first Phase 2 tool.' },
  'T-27': { state: 'off', source: { registry: 'PyPI', pkg: 'scrapling', version: '0.5', released: '2026-10-17', licence: 'BSD-3-Clause' }, why: 'Python, so it needs a worker. It also advertises stealth fetching to get past anti-bot protection, which the security policy forbids, so it needs a careful review.' },
  'T-28': { state: 'off', why: 'Desktop app that mirrors and controls an Android phone over USB. It cannot run on a website. Not on a package registry, so its source was not checked.' },
  'T-29': { state: 'off', source: { registry: 'PyPI', pkg: 'autoscraper', version: '1.1.14', released: '2022-07-17', licence: 'MIT' }, why: 'Python, so it needs a worker. No release since July 2022, so it looks unmaintained.' },
  'T-30': { state: 'blocked', why: 'Blocked by policy. It copies real browsers\' fingerprints to get past access controls, and the governance rules say never to do that.' },
};

export type ForgeLead = { name: string; title: string; mission: string; brief: string };

export const forgeLeads: ForgeLead[] = [
  { name: 'Atlas Architect', title: 'Architecture lead', mission: 'Own system design, code quality, interfaces, CI and Vercel deployment.', brief: 'Architecture, API contracts, deployment, security boundaries, reviews.' },
  { name: 'Wren Web Intelligence', title: 'Web intelligence lead', mission: 'Own crawl permissions, extraction adapters, rate limits and source metadata.', brief: 'Discovery, permissions, crawlers, browser workers, extraction quality.' },
  { name: 'Nadia Knowledge', title: 'Knowledge lead', mission: 'Own document conversion, retrieval, citations, deduplication and knowledge evaluation.', brief: 'Conversion, provenance, chunking, search, RAG and citations.' },
  { name: 'Owen Operations', title: 'Operations lead', mission: 'Own job queue, cost ceilings, observability, retries and model gateway.', brief: 'Jobs, model routing, token budgets, reliability and observability.' },
  { name: 'Vera Verification', title: 'Verification lead', mission: 'Own evidence checks, safety reviews, approval gates and audit compliance.', brief: 'Source validation, security, evaluation, compliance and approval gates.' },
];

// The same ten-step charter applies to every ContextForge lead.
export const leadCharter = [
  'Requirements', 'Design', 'Implement', 'Test', 'Document', 'Monitor', 'Assess risk', 'Verify provenance', 'Report metrics', 'Escalate for human approval',
];

export const approvalClasses = [
  { code: 'P0', label: 'Local read-only', signOff: false },
  { code: 'P1', label: 'Authorised external read', signOff: false },
  { code: 'P2', label: 'External write, authentication or paid operation', signOff: true },
  { code: 'P3', label: 'Production deployment, security testing, sensitive-data transfer or publication', signOff: true },
];

export const workflow = [
  'Intake', 'Classify', 'Authorisation check', 'Plan', 'Budget', 'Human approval when required',
  'Queued execution', 'Validation', 'Citation and provenance', 'Human review', 'Export',
];

export const phases = [
  { phase: 'Phase 0', scope: 'Validate candidate repository identities, licences, deployment model, budgets and permissions.' },
  { phase: 'Phase 1', scope: 'Dashboard, authentication, tool registry, admin-only approval queue, audit logging.' },
  { phase: 'Phase 2', scope: 'MarkItDown and one approved web extractor (Crawl4AI or Firecrawl), source ingestion, citation and search.' },
  { phase: 'Phase 3', scope: 'Background workers, scheduled jobs, document pipelines, cost tracking, agent assignments.' },
  { phase: 'Phase 4', scope: 'Browser automation and office integrations with P2 approval, monitoring and safe retries.' },
  { phase: 'Phase 5', scope: 'Scale crawlers, model routing and advanced testing, only after governance review.' },
];

export const acceptanceCriteria = [
  'No anonymous tool execution',
  'Row-level security tests pass',
  'Credentials stay server-side only',
  'Approved sources are tracked',
  'No uncited claims in research outputs',
  'Disabled tools cannot run',
  'Job retries are idempotent',
  'Budget ceiling is enforced',
  'An audit event is written for every transition',
];

export const securityRules = [
  'Allowlist domains and review robots.txt, terms, copyright and data protection obligations.',
  'No bypassing login walls, CAPTCHAs, paywalls or anti-bot access controls.',
  'Limit request rate, crawl depth and request volume.',
  'Treat retrieved web content as data, never as agent instructions.',
  'Human approval for security scans, authenticated browsing, outbound email, paid API calls and production changes.',
  'Record evidence of authorisation and citation metadata for every source.',
  'Validate licences and maintenance before installing any tool.',
];
