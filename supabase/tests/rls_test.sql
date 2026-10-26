-- Row-level security and governance tests. Two users, A and B, must never see or change each other's data,
-- and the Vera review and RAM release rules must hold even when someone calls the database directly.
\set ON_ERROR_STOP on
\set QUIET on

create schema tests;
grant usage on schema tests to authenticated, anon;
create function tests.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise exception 'FAIL: %', label; end if;
  raise notice 'ok - %', label;
end $$;
create function tests.throws(stmt text, label text, expect text default null) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if expect is not null and position(expect in sqlerrm) = 0 then
      raise exception 'FAIL: % (wrong error: %)', label, sqlerrm;
    end if;
    raise notice 'ok - % (blocked: %)', label, sqlerrm;
    return;
  end;
  raise exception 'FAIL: % (statement succeeded)', label;
end $$;
grant execute on all functions in schema tests to authenticated, anon;

insert into auth.users values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@example.test'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@example.test');

-- ---------- User A creates data ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}', false);

insert into public.assignments(id, owner_id, title, role_id)
  values ('11111111-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'A task', 'RF-020');
insert into public.sources(id, owner_id, title, rights_status)
  values ('22222222-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'A source', 'pending');
insert into public.agent_runs(id, owner_id, task_id, role_id, mode, provider, model, status)
  values ('33333333-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
          '11111111-0000-0000-0000-000000000001', 'RF-020', 'simulated', 'simulated', 'simulated-v1', 'running');
insert into public.run_logs(owner_id, run_id, step, message)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001', 'start', 'started');
select tests.ok((select count(*) from public.assignments) = 1, 'A sees own task');

select tests.throws($$insert into public.assignments(owner_id, title, role_id)
  values ('bbbbbbbb-0000-0000-0000-000000000002', 'spoofed', 'RF-001')$$, 'A cannot create a task owned by B');

-- ---------- User B cannot see or touch A's data ----------
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002"}', false);
select tests.ok((select count(*) from public.assignments) = 0, 'B cannot read A tasks');
select tests.ok((select count(*) from public.sources) = 0, 'B cannot read A sources');
select tests.ok((select count(*) from public.agent_runs) = 0, 'B cannot read A runs');
select tests.ok((select count(*) from public.run_logs) = 0, 'B cannot read A run logs');
update public.assignments set title = 'hijacked' where id = '11111111-0000-0000-0000-000000000001';
delete from public.assignments where id = '11111111-0000-0000-0000-000000000001';
select tests.throws($$insert into public.task_events(owner_id, task_id, event_type, actor_type)
  values ('bbbbbbbb-0000-0000-0000-000000000002', '11111111-0000-0000-0000-000000000001', 'note', 'human')$$,
  'B cannot add events to A task');
select tests.throws($$insert into public.run_logs(owner_id, run_id, step, message)
  values ('bbbbbbbb-0000-0000-0000-000000000002', '33333333-0000-0000-0000-000000000001', 'x', 'x')$$,
  'B cannot write logs into A run');
select tests.throws($$select public.decide_release('11111111-0000-0000-0000-000000000001', 'approved', 'sneaky')$$,
  'B cannot release A task');

-- ---------- Anonymous visitors get nothing ----------
reset role;
set role anon;
select tests.throws($$select count(*) from public.assignments$$, 'anon cannot read tasks', 'permission denied');
reset role;
select tests.ok((select title from public.assignments where id = '11111111-0000-0000-0000-000000000001') = 'A task',
  'A task unchanged after B update/delete attempts');

-- ---------- Source rights gate ----------
set role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001"}', false);
select tests.throws($$insert into public.source_chunks(owner_id, source_id, ordinal, content)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 0, 'text')$$,
  'pending source cannot be ingested', 'requires approved rights');
select tests.throws($$update public.sources set rights_status = 'approved' where id = '22222222-0000-0000-0000-000000000001'$$,
  'approval without permission evidence is rejected', 'sources_approval_needs_evidence');
update public.sources set rights_status = 'approved', permission_evidence = 'Written licence on file, ref L-1'
  where id = '22222222-0000-0000-0000-000000000001';
insert into public.source_chunks(owner_id, source_id, ordinal, content)
  values ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 0, 'Approved text');
select tests.ok((select count(*) from public.source_chunks) = 1, 'approved source can be ingested');
update public.sources set rights_status = 'restricted' where id = '22222222-0000-0000-0000-000000000001';
select tests.ok((select count(*) from public.source_chunks) = 0, 'revoking rights deletes indexed chunks');

-- ---------- Run immutability and append-only logs ----------
update public.agent_runs set status = 'succeeded', output = 'done' where id = '33333333-0000-0000-0000-000000000001';
update public.agent_runs set output = 'tampered' where id = '33333333-0000-0000-0000-000000000001';
select tests.ok((select output from public.agent_runs where id = '33333333-0000-0000-0000-000000000001') = 'done',
  'finished runs cannot be edited');
select tests.throws($$update public.run_logs set message = 'edited'$$, 'run logs cannot be edited', 'permission denied');
select tests.throws($$delete from public.run_logs$$, 'run logs cannot be deleted', 'permission denied');

-- ---------- Vera review independence ----------
select tests.throws($$select public.record_review('11111111-0000-0000-0000-000000000001', null, 'RF-031', 'agent', 'pass', 'not Vera', '[]')$$,
  'non-Vera role cannot review', 'Vera division');
insert into public.assignments(id, owner_id, title, role_id)
  values ('11111111-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 'Vera own audit', 'RF-061');
select tests.throws($$select public.record_review('11111111-0000-0000-0000-000000000002', null, 'RF-061', 'agent', 'pass', 'self', '[]')$$,
  'Vera cannot review her own task', 'cannot review its own task');

-- ---------- RAM release gate ----------
select tests.throws($$update public.assignments set status = 'approved' where id = '11111111-0000-0000-0000-000000000001'$$,
  'task cannot be approved without a Vera pass', 'passing Vera review');
select tests.throws($$select public.decide_release('11111111-0000-0000-0000-000000000001', 'approved', 'skip review')$$,
  'release blocked before Vera review', 'passing Vera review first');
select public.record_review('11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
  'RF-062', 'automated_check', 'needs_changes', 'Missing citation', '[]');
select tests.ok((select status from public.assignments where id = '11111111-0000-0000-0000-000000000001') = 'needs_changes',
  'failed review sends task back');
select public.record_review('11111111-0000-0000-0000-000000000001', '33333333-0000-0000-0000-000000000001',
  'RF-062', 'automated_check', 'pass', 'All citations verified', '[]');
select tests.ok((select status from public.assignments where id = '11111111-0000-0000-0000-000000000001') = 'approved',
  'passing review marks task approved');
select tests.throws($$update public.assignments set status = 'released' where id = '11111111-0000-0000-0000-000000000001'$$,
  'release without RAM approval event is blocked', 'RAM approval');
select tests.throws($$select public.decide_release('11111111-0000-0000-0000-000000000001', 'approved', '  ')$$,
  'release needs a rationale', 'rationale');
select public.decide_release('11111111-0000-0000-0000-000000000001', 'approved', 'Checked sources and review');
select tests.ok((select status from public.assignments where id = '11111111-0000-0000-0000-000000000001') = 'released',
  'RAM approval releases the task');
select tests.throws($$update public.assignments set status = 'draft' where id = '11111111-0000-0000-0000-000000000001'$$,
  'released tasks are final', 'final');
select tests.throws($$update public.approval_events set rationale = 'rewritten'$$, 'approvals cannot be edited', 'permission denied');
select tests.throws($$delete from public.reviews$$, 'reviews cannot be deleted', 'permission denied');
select tests.ok((select count(*) from public.task_events where task_id = '11111111-0000-0000-0000-000000000001') = 3,
  'review and release decisions are in the audit trail');

reset role;
\echo 'ALL DATABASE TESTS PASSED'
