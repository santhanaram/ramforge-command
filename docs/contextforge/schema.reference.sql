-- REFERENCE ONLY. Copied from the ContextForge package. Not applied to any database by RAMFORGE Command.
-- Development starter schema. Review policies before production.
create extension if not exists pgcrypto;
create table if not exists public.tools (id text primary key, name text not null, repo_url text, verified boolean not null default false, enabled boolean not null default false, risk_level text not null default 'P2', created_at timestamptz not null default now());
create table if not exists public.agents (id uuid primary key default gen_random_uuid(), name text not null, role text not null, active boolean not null default false);
create table if not exists public.sources (id uuid primary key default gen_random_uuid(), url text, title text, retrieved_at timestamptz, content_sha256 text, rights_basis text, source_metadata jsonb not null default '{}'::jsonb);
create table if not exists public.jobs (id uuid primary key default gen_random_uuid(), tool_id text references public.tools(id), status text not null default 'pending', requested_by uuid not null, idempotency_key text unique, budget_usd numeric(12,4), created_at timestamptz not null default now());
create table if not exists public.approvals (id uuid primary key default gen_random_uuid(), job_id uuid references public.jobs(id), requested_by uuid not null, reviewed_by uuid, status text not null default 'pending', reason text, reviewed_at timestamptz);
create table if not exists public.audit_events (id bigint generated always as identity primary key, actor_id uuid, action text not null, entity_type text, entity_id text, metadata jsonb not null default '{}'::jsonb, occurred_at timestamptz not null default now());
alter table public.tools enable row level security;
alter table public.agents enable row level security;
alter table public.sources enable row level security;
alter table public.jobs enable row level security;
alter table public.approvals enable row level security;
alter table public.audit_events enable row level security;
-- No permissive policies intentionally: all client reads denied until role-scoped policies are implemented and tested.
