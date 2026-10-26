-- RAMFORGE Command v1.0. Apply in a NEW Supabase project.
-- Dedicated single-owner workspace model, RLS on every public table.
create extension if not exists pgcrypto;
create table if not exists public.assignments (
 id uuid primary key default gen_random_uuid(),
 owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(title) between 1 and 500),
 role_id text not null check (role_id ~ '^RF-[0-9]{3}$'),
 status text not null default 'backlog' check (status in ('backlog','in_progress','review','done')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.sources (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references auth.users(id) on delete cascade,
 title text not null, creator text, source_url text,
 rights_status text not null default 'pending' check (rights_status in ('pending','approved','rejected','restricted')),
 permission_evidence text, notes text, created_at timestamptz not null default now()
);
create table if not exists public.frameworks (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 source_id uuid references public.sources(id) on delete set null,
 title text not null, summary text, interpretation_type text not null default 'documented' check (interpretation_type in ('documented','synthesis')),
 review_status text not null default 'draft' check (review_status in ('draft','review','approved','rejected')),
 created_at timestamptz not null default now()
);
create table if not exists public.approval_events (
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users(id) on delete cascade,
 subject_type text not null,subject_id uuid not null,decision text not null check(decision in ('approved','rejected','requested_changes')),
 rationale text not null, created_at timestamptz not null default now()
);
create index if not exists assignments_owner_created_idx on public.assignments(owner_id,created_at desc);
create index if not exists sources_owner_idx on public.sources(owner_id);
create index if not exists frameworks_owner_idx on public.frameworks(owner_id);
create index if not exists approvals_owner_idx on public.approval_events(owner_id);
alter table public.assignments enable row level security;
alter table public.sources enable row level security;
alter table public.frameworks enable row level security;
alter table public.approval_events enable row level security;
create policy "assignments read mine" on public.assignments for select to authenticated using ((select auth.uid())=owner_id);
create policy "assignments insert mine" on public.assignments for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "assignments update mine" on public.assignments for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "assignments delete mine" on public.assignments for delete to authenticated using ((select auth.uid())=owner_id);
create policy "sources read mine" on public.sources for select to authenticated using ((select auth.uid())=owner_id);
create policy "sources insert mine" on public.sources for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "sources update mine" on public.sources for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "frameworks read mine" on public.frameworks for select to authenticated using ((select auth.uid())=owner_id);
create policy "frameworks insert mine" on public.frameworks for insert to authenticated with check ((select auth.uid())=owner_id);
create policy "frameworks update mine" on public.frameworks for update to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id);
create policy "approvals read mine" on public.approval_events for select to authenticated using ((select auth.uid())=owner_id);
create policy "approvals insert mine" on public.approval_events for insert to authenticated with check ((select auth.uid())=owner_id);
-- Audit decisions intentionally append-only: no update/delete policies.
