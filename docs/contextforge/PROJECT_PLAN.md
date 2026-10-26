# Delivery plan
Phase 0: validate candidate repository identities, licenses, deployment model, budgets and permissions.
Phase 1: Next.js dashboard, Supabase authentication, tool registry, admin-only approval queue, audit logging.
Phase 2: MarkItDown and one approved web extractor (Crawl4AI OR Firecrawl), source ingestion, citation and search.
Phase 3: background workers, scheduled jobs, document pipelines, cost tracking, agent assignments.
Phase 4: browser automation and office integrations with P2 approval, monitoring and safe retries.
Phase 5: scale crawlers, model routing and advanced testing only after governance review.

Acceptance criteria: no anonymous tool execution; RLS tests pass; credentials server-only; approved sources tracked; no uncited claims in research outputs; disabled tools cannot run; job retry idempotent; budget ceiling enforced; audit event written for every transition.
