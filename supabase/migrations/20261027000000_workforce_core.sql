-- RAMFORGE Command v2: tasks, handoffs, agent runs, source chunks, Vera reviews and RAM release gate.
-- Apply after 20261026000000_initial.sql, in a dedicated Supabase project, after review.
-- Every table is owner-scoped with RLS. Audit tables (task_events, run_logs, reviews, approval_events)
-- have no update or delete policies, so they are append-only for signed-in users.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Vera division roles are RF-061 to RF-075 in data/workforce.ts.
create or replace function public.is_vera_role(role_id text) returns boolean
language sql immutable set search_path = '' as $$
  select role_id ~ '^RF-0(6[1-9]|7[0-5])$'
$$;

-- ---------------------------------------------------------------------------
-- Tasks (the existing assignments table, extended)
-- ---------------------------------------------------------------------------
alter table public.assignments
  add column if not exists description text not null default '' check (length(description) <= 8000),
  add column if not exists acceptance_criteria text not null default '' check (length(acceptance_criteria) <= 4000),
  add column if not exists priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  add column if not exists due_date date;

alter table public.assignments drop constraint if exists assignments_status_check;
-- Legacy statuses carry no review evidence, so nothing is migrated straight to approved or released.
update public.assignments set status = case status
  when 'backlog' then 'draft'
  when 'in_progress' then 'running'
  when 'review' then 'awaiting_review'
  when 'done' then 'awaiting_review'
  else status end;
alter table public.assignments alter column status set default 'draft';
alter table public.assignments add constraint assignments_status_check check (status in
  ('draft','queued','running','awaiting_review','needs_changes','approved','released','failed','cancelled'));

drop trigger if exists assignments_touch on public.assignments;
create trigger assignments_touch before update on public.assignments
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Task events: created, status changes, handoffs and notes (append-only)
-- ---------------------------------------------------------------------------
create table if not exists public.task_events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.assignments(id) on delete cascade,
  event_type text not null check (event_type in
    ('created','status_changed','handoff','note','run_started','run_finished','review_recorded','release_decision')),
  actor_type text not null check (actor_type in ('human','agent','system')),
  actor_role_id text check (actor_role_id is null or actor_role_id ~ '^RF-[0-9]{3}$'),
  from_role_id text check (from_role_id is null or from_role_id ~ '^RF-[0-9]{3}$'),
  to_role_id text check (to_role_id is null or to_role_id ~ '^RF-[0-9]{3}$'),
  message text not null default '' check (length(message) <= 4000),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists task_events_task_idx on public.task_events(task_id, created_at);

-- ---------------------------------------------------------------------------
-- Agent runs and execution logs
-- ---------------------------------------------------------------------------
create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.assignments(id) on delete cascade,
  role_id text not null check (role_id ~ '^RF-[0-9]{3}$'),
  mode text not null check (mode in ('live','simulated')),
  provider text not null,
  model text not null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed','refused','cancelled')),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  cost_usd numeric(12,6) not null default 0 check (cost_usd >= 0),
  output text,
  citations jsonb not null default '[]'::jsonb,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists agent_runs_task_idx on public.agent_runs(task_id, created_at desc);
create index if not exists agent_runs_owner_created_idx on public.agent_runs(owner_id, created_at desc);

create table if not exists public.run_logs (
  id bigint generated always as identity primary key,
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  level text not null default 'info' check (level in ('info','warn','error')),
  step text not null,
  message text not null check (length(message) <= 4000),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists run_logs_run_idx on public.run_logs(run_id, id);

-- ---------------------------------------------------------------------------
-- Sources: rights gate and chunks
-- ---------------------------------------------------------------------------
alter table public.sources
  add column if not exists permitted_use text,
  add column if not exists rights_reviewed_at timestamptz;
alter table public.sources drop constraint if exists sources_approval_needs_evidence;
alter table public.sources add constraint sources_approval_needs_evidence check (
  rights_status <> 'approved' or length(trim(coalesce(permission_evidence,''))) > 0);

create table if not exists public.source_chunks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete cascade,
  ordinal integer not null check (ordinal >= 0),
  content text not null check (length(content) between 1 and 8000),
  locator text,
  created_at timestamptz not null default now(),
  unique (source_id, ordinal)
);
create index if not exists source_chunks_owner_idx on public.source_chunks(owner_id);

-- Chunks may only be stored for an approved source owned by the same user.
create or replace function public.enforce_chunk_rights() returns trigger
language plpgsql set search_path = '' as $$
declare s record;
begin
  select rights_status, owner_id into s from public.sources where id = new.source_id;
  if s is null or s.owner_id <> new.owner_id then
    raise exception 'source not found for this owner';
  end if;
  if s.rights_status <> 'approved' then
    raise exception 'source rights are %, ingestion requires approved rights', s.rights_status;
  end if;
  return new;
end $$;
drop trigger if exists source_chunks_rights on public.source_chunks;
create trigger source_chunks_rights before insert or update on public.source_chunks
  for each row execute function public.enforce_chunk_rights();

-- Revoking rights removes the indexed text immediately.
create or replace function public.on_source_rights_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.rights_status is distinct from old.rights_status then
    new.rights_reviewed_at := now();
    if new.rights_status <> 'approved' then
      delete from public.source_chunks where source_id = new.id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists sources_rights_change on public.sources;
create trigger sources_rights_change before update on public.sources
  for each row execute function public.on_source_rights_change();

-- ---------------------------------------------------------------------------
-- Vera reviews (append-only, independent of the producing role)
-- ---------------------------------------------------------------------------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.assignments(id) on delete cascade,
  run_id uuid references public.agent_runs(id) on delete set null,
  reviewer_role_id text not null,
  reviewer_type text not null check (reviewer_type in ('automated_check','agent')),
  verdict text not null check (verdict in ('pass','fail','needs_changes')),
  summary text not null check (length(summary) between 1 and 4000),
  checks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists reviews_task_idx on public.reviews(task_id, created_at desc);

create or replace function public.enforce_review_independence() returns trigger
language plpgsql set search_path = '' as $$
declare t record; producer text;
begin
  if not public.is_vera_role(new.reviewer_role_id) then
    raise exception 'reviews must be recorded by a Vera division role';
  end if;
  select role_id, owner_id into t from public.assignments where id = new.task_id;
  if t is null or t.owner_id <> new.owner_id then
    raise exception 'task not found for this owner';
  end if;
  if t.role_id = new.reviewer_role_id then
    raise exception 'a role cannot review its own task';
  end if;
  if new.run_id is not null then
    select role_id into producer from public.agent_runs where id = new.run_id and task_id = new.task_id;
    if producer is null then raise exception 'run does not belong to this task'; end if;
    if producer = new.reviewer_role_id then raise exception 'a role cannot review its own run'; end if;
  end if;
  return new;
end $$;
drop trigger if exists reviews_independence on public.reviews;
create trigger reviews_independence before insert on public.reviews
  for each row execute function public.enforce_review_independence();

-- ---------------------------------------------------------------------------
-- RAM release gate
-- ---------------------------------------------------------------------------
alter table public.approval_events drop constraint if exists approval_events_subject_type_check;
alter table public.approval_events add constraint approval_events_subject_type_check
  check (subject_type in ('task_release','source_rights'));

create or replace function public.latest_review_verdict(p_task uuid) returns text
language sql stable set search_path = '' as $$
  select verdict from public.reviews where task_id = p_task order by created_at desc, id desc limit 1
$$;

-- A release approval needs a task Vera has passed and that is waiting for RAM.
create or replace function public.enforce_release_gate() returns trigger
language plpgsql set search_path = '' as $$
declare t record;
begin
  if new.subject_type = 'task_release' then
    select status, owner_id into t from public.assignments where id = new.subject_id;
    if t is null or t.owner_id <> new.owner_id then raise exception 'task not found for this owner'; end if;
    if new.decision = 'approved' then
      if t.status <> 'approved' or coalesce(public.latest_review_verdict(new.subject_id),'') <> 'pass' then
        raise exception 'release requires a passing Vera review first';
      end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists approval_events_gate on public.approval_events;
create trigger approval_events_gate before insert on public.approval_events
  for each row execute function public.enforce_release_gate();

-- Status changes to approved or released need evidence, whoever makes them.
create or replace function public.enforce_task_status() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.status is not distinct from old.status then return new; end if;
  if new.status = 'approved' and coalesce(public.latest_review_verdict(new.id),'') <> 'pass' then
    raise exception 'only a passing Vera review can approve a task';
  end if;
  if new.status = 'released' then
    if old.status <> 'approved' then raise exception 'only approved tasks can be released'; end if;
    if not exists (
      select 1 from public.approval_events a
      where a.subject_type = 'task_release' and a.subject_id = new.id and a.decision = 'approved'
        and a.created_at >= (select max(r.created_at) from public.reviews r where r.task_id = new.id)
    ) then
      raise exception 'release requires a RAM approval recorded after the latest review';
    end if;
  end if;
  if old.status = 'released' then raise exception 'released tasks are final'; end if;
  return new;
end $$;
drop trigger if exists assignments_status_gate on public.assignments;
create trigger assignments_status_gate before update on public.assignments
  for each row execute function public.enforce_task_status();

-- One call that records RAM's decision, moves the task and logs the event atomically.
create or replace function public.decide_release(p_task uuid, p_decision text, p_rationale text) returns void
language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); next_status text;
begin
  if uid is null then raise exception 'sign in required'; end if;
  if length(trim(coalesce(p_rationale,''))) = 0 then raise exception 'a rationale is required'; end if;
  insert into public.approval_events(owner_id, subject_type, subject_id, decision, rationale)
    values (uid, 'task_release', p_task, p_decision, p_rationale);
  next_status := case p_decision when 'approved' then 'released' when 'requested_changes' then 'needs_changes' else 'cancelled' end;
  update public.assignments set status = next_status where id = p_task;
  insert into public.task_events(owner_id, task_id, event_type, actor_type, message, data)
    values (uid, p_task, 'release_decision', 'human', p_rationale, jsonb_build_object('decision', p_decision));
end $$;

-- Records a Vera review and moves the task to approved or needs_changes in one step.
create or replace function public.record_review(p_task uuid, p_run uuid, p_reviewer text, p_type text,
  p_verdict text, p_summary text, p_checks jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare uid uuid := auth.uid(); rid uuid;
begin
  if uid is null then raise exception 'sign in required'; end if;
  insert into public.reviews(owner_id, task_id, run_id, reviewer_role_id, reviewer_type, verdict, summary, checks)
    values (uid, p_task, p_run, p_reviewer, p_type, p_verdict, p_summary, coalesce(p_checks,'[]'::jsonb))
    returning id into rid;
  update public.assignments set status = case p_verdict when 'pass' then 'approved' else 'needs_changes' end
    where id = p_task;
  insert into public.task_events(owner_id, task_id, event_type, actor_type, actor_role_id, message, data)
    values (uid, p_task, 'review_recorded', 'agent', p_reviewer, p_summary,
            jsonb_build_object('verdict', p_verdict, 'review_id', rid));
  return rid;
end $$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------
alter table public.task_events enable row level security;
alter table public.agent_runs enable row level security;
alter table public.run_logs enable row level security;
alter table public.source_chunks enable row level security;
alter table public.reviews enable row level security;

create policy "task_events read mine" on public.task_events for select to authenticated using ((select auth.uid()) = owner_id);
create policy "task_events insert mine" on public.task_events for insert to authenticated with check (
  (select auth.uid()) = owner_id and exists (select 1 from public.assignments a where a.id = task_id and a.owner_id = (select auth.uid())));

create policy "agent_runs read mine" on public.agent_runs for select to authenticated using ((select auth.uid()) = owner_id);
create policy "agent_runs insert mine" on public.agent_runs for insert to authenticated with check (
  (select auth.uid()) = owner_id and exists (select 1 from public.assignments a where a.id = task_id and a.owner_id = (select auth.uid())));
-- A run can be updated only while it is in flight; finished runs are immutable.
create policy "agent_runs update in flight" on public.agent_runs for update to authenticated
  using ((select auth.uid()) = owner_id and status in ('queued','running'))
  with check ((select auth.uid()) = owner_id);

create policy "run_logs read mine" on public.run_logs for select to authenticated using ((select auth.uid()) = owner_id);
create policy "run_logs insert mine" on public.run_logs for insert to authenticated with check (
  (select auth.uid()) = owner_id and exists (select 1 from public.agent_runs r where r.id = run_id and r.owner_id = (select auth.uid())));

create policy "source_chunks read mine" on public.source_chunks for select to authenticated using ((select auth.uid()) = owner_id);
create policy "source_chunks insert mine" on public.source_chunks for insert to authenticated with check ((select auth.uid()) = owner_id);
create policy "source_chunks delete mine" on public.source_chunks for delete to authenticated using ((select auth.uid()) = owner_id);
create policy "sources delete mine" on public.sources for delete to authenticated using ((select auth.uid()) = owner_id);

create policy "reviews read mine" on public.reviews for select to authenticated using ((select auth.uid()) = owner_id);
create policy "reviews insert mine" on public.reviews for insert to authenticated with check ((select auth.uid()) = owner_id);

-- Explicit grants: signed-in users only. Anonymous visitors get nothing.
-- Start from nothing, then grant exactly what each table needs. Append-only tables get no update or delete.
revoke all on public.assignments, public.sources, public.frameworks, public.approval_events,
  public.task_events, public.agent_runs, public.run_logs, public.source_chunks, public.reviews from anon, authenticated;
grant select, insert, update, delete on public.assignments, public.sources, public.source_chunks to authenticated;
grant select, insert, update on public.frameworks, public.agent_runs to authenticated;
grant select, insert on public.approval_events, public.task_events, public.run_logs, public.reviews to authenticated;
revoke execute on function public.decide_release(uuid, text, text) from public, anon;
grant execute on function public.decide_release(uuid, text, text) to authenticated;
revoke execute on function public.record_review(uuid, uuid, text, text, text, text, jsonb) from public, anon;
grant execute on function public.record_review(uuid, uuid, text, text, text, text, jsonb) to authenticated;
