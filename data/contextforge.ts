// ContextForge AI Research Lab: a planning package for a research orchestration lab, shown read-only in its own tab.
// Source of truth for the tool list is docs/contextforge/tools.json, copied unchanged from the package.
// Nothing here is installed, connected or run. Every tool is a candidate and stays disabled.
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
