begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select no_plan();

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    'aaaaaaaa-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'rls-admin-a@example.test',
    'synthetic-password-hash',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'paralegal-a@example.test',
    'synthetic-password-hash',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'readonly-a@example.test',
    'synthetic-password-hash',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'aaaaaaaa-0000-4000-8000-000000000004',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin-a@example.test',
    'synthetic-password-hash',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  ),
  (
    'bbbbbbbb-0000-4000-8000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'lawyer-b@example.test',
    'synthetic-password-hash',
    now(),
    '{}'::jsonb,
    '{}'::jsonb,
    now(),
    now()
  );

insert into public.firms (id, name)
values
  ('20000000-0000-4000-8000-000000000001', 'Estudio Sintetico A'),
  ('30000000-0000-4000-8000-000000000001', 'Estudio Sintetico B');

insert into public.firm_memberships (firm_id, profile_id, role, status, accepted_at)
values
  (
    '20000000-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000001',
    'lawyer',
    'active',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000002',
    'paralegal',
    'active',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000003',
    'read_only',
    'active',
    now()
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000004',
    'admin',
    'active',
    now()
  ),
  (
    '30000000-0000-4000-8000-000000000001',
    'bbbbbbbb-0000-4000-8000-000000000001',
    'lawyer',
    'active',
    now()
  );

insert into public.clients (id, firm_id, display_name, created_by)
values
  (
    '21000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    'Cliente Sintetico A',
    'aaaaaaaa-0000-4000-8000-000000000001'
  ),
  (
    '31000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    'Cliente Sintetico B',
    'bbbbbbbb-0000-4000-8000-000000000001'
  );

insert into public.cases (id, firm_id, client_id, case_number, title, opened_on, created_by)
values
  (
    '22000000-0000-4000-8000-000000000001',
    '20000000-0000-4000-8000-000000000001',
    '21000000-0000-4000-8000-000000000001',
    'A-001',
    'Causa asignada sintetica',
    '2026-09-01',
    'aaaaaaaa-0000-4000-8000-000000000001'
  ),
  (
    '32000000-0000-4000-8000-000000000001',
    '30000000-0000-4000-8000-000000000001',
    '31000000-0000-4000-8000-000000000001',
    'B-001',
    'Causa sintetica de otro estudio',
    '2026-09-01',
    'bbbbbbbb-0000-4000-8000-000000000001'
  );

insert into public.case_members (firm_id, case_id, profile_id, role, assigned_by)
values
  (
    '20000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000002',
    'assigned_paralegal',
    'aaaaaaaa-0000-4000-8000-000000000001'
  ),
  (
    '20000000-0000-4000-8000-000000000001',
    '22000000-0000-4000-8000-000000000001',
    'aaaaaaaa-0000-4000-8000-000000000003',
    'assigned_reader',
    'aaaaaaaa-0000-4000-8000-000000000001'
  );


insert into public.cases (id, firm_id, client_id, case_number, title, opened_on, created_by)
values ('22000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', '21000000-0000-4000-8000-000000000001', 'A-002', 'Unassigned synthetic case', current_date, 'aaaaaaaa-0000-4000-8000-000000000001');
insert into public.case_deadlines (id, firm_id, case_id, title, due_on, created_by, status) values
('23000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Confirmed overdue', (now() at time zone 'America/Argentina/Buenos_Aires')::date - 1,'aaaaaaaa-0000-4000-8000-000000000001','pending'),
('23000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Historical review', (now() at time zone 'America/Argentina/Buenos_Aires')::date - 1,'aaaaaaaa-0000-4000-8000-000000000001','needs_review'),
('23000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000002','Restricted deadline', current_date + 60,'aaaaaaaa-0000-4000-8000-000000000001','pending');
insert into public.case_deadlines (firm_id, case_id, title, due_on, created_by)
select '20000000-0000-4000-8000-000000000001','22000000-0000-4000-8000-000000000001','Pagination ' || n, current_date + n, 'aaaaaaaa-0000-4000-8000-000000000001' from generate_series(1,30) n;

select ok(not has_function_privilege('anon', 'public.set_deadline_status(uuid,text,integer)', 'execute'), 'anonymous cannot resolve deadlines');
select ok(not has_function_privilege('anon', 'public.list_agenda(uuid,text,text,date,date,integer)', 'execute'), 'anonymous cannot read timeline');
select ok(not has_column_privilege('authenticated','public.case_deadlines','status','update'), 'direct lifecycle updates are denied');
select ok(not has_column_privilege('authenticated','public.case_deadlines','status','insert'), 'inserts cannot forge resolved status');
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}', true);
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'overdue', 'all', null, null, 1)->>'total')::int, 1, 'review-required historical deadline is not assumed overdue');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'review', 'all', null, null, 1)->>'total')::int, 1, 'historical review has its own view');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'upcoming', 'all', null, null, 1)->>'total')::int, 31, 'timeline counts all matches before limiting');
select is(jsonb_array_length(public.list_agenda('20000000-0000-4000-8000-000000000001', 'upcoming', 'all', null, null, 1)->'entries'), 25, 'timeline page is bounded');
select is(jsonb_array_length(public.list_agenda('20000000-0000-4000-8000-000000000001', 'upcoming', 'all', null, null, 2)->'entries'), 6, 'second page includes remaining matches');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'upcoming', 'all', current_date + 30, current_date + 30, 1)->>'total')::int, 1, 'date filter searches beyond the first twenty entries');
select throws_ok($test$select public.list_agenda('30000000-0000-4000-8000-000000000001')$test$, '42501', 'not authorized', 'lawyer cannot query another firm');
select throws_ok($test$update public.case_deadlines set status='completed' where id='23000000-0000-4000-8000-000000000001'$test$, '42501', 'permission denied for table case_deadlines', 'direct mutation cannot bypass audit');
select lives_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','completed',0)$test$, 'lawyer can complete deadline');
select is((select status from public.case_deadlines where id='23000000-0000-4000-8000-000000000001'), 'completed', 'completion persists');
select is((select status_changed_by::text from public.case_deadlines where id='23000000-0000-4000-8000-000000000001'), 'aaaaaaaa-0000-4000-8000-000000000001', 'completion records actor');
select is((select count(*)::int from public.audit_log where target_id='23000000-0000-4000-8000-000000000001' and action='deadline.status_changed'), 1, 'completion appends audit');
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','pending',0)$test$, '40001', 'deadline changed', 'stale concurrent update is rejected');
select lives_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','pending',1)$test$, 'lawyer can reopen with current revision');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000002","role":"authenticated"}', true);
select lives_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','cancelled',2)$test$, 'assigned paralegal can cancel');
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000003','completed',0)$test$, '42501', 'not authorized', 'unassigned paralegal cannot resolve');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'upcoming', 'all', null, null, 1)->>'total')::int, 30, 'assigned paralegal timeline excludes unassigned cause');
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','completed',3)$test$, '22023', 'reopen deadline first', 'resolved deadline must be reopened before another resolution');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000003","role":"authenticated"}', true);
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','pending',3)$test$, '42501', 'not authorized', 'read-only cannot reopen');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'review', 'all', null, null, 1)->>'total')::int, 1, 'assigned read-only can inspect review queue');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-4000-8000-000000000001","role":"authenticated"}', true);
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','pending',3)$test$, '42501', 'not authorized', 'cross-firm deadline mutation denied');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000004', true);
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-4000-8000-000000000004","role":"authenticated"}', true);
select lives_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','pending',3)$test$, 'admin can reopen');
select lives_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000002','completed',0)$test$, 'admin can review historical deadline as completed');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'review', 'all', null, null, 1)->>'total')::int, 0, 'reviewed deadline leaves review queue');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'resolved', 'all', null, null, 1)->>'total')::int, 1, 'reviewed completed deadline enters resolved history');
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','needs_review',4)$test$, '22023', 'invalid deadline status', 'clients cannot send deadline back to migration-only review state');
select lives_ok($test$select public.hide_schedule_item('deadline','23000000-0000-4000-8000-000000000001')$test$, 'column grants preserve schedule hiding');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'overdue', 'all', null, null, 1)->>'total')::int, 1, 'hiding never removes an overdue obligation');
-- A successfully created event must remain discoverable after its start time.
select lives_ok($test$select public.create_case_event(
  '22000000-0000-4000-8000-000000000001', 'Past synthetic event',
  (now() at time zone 'America/Argentina/Buenos_Aires') - interval '1 hour'
)$test$, 'past event creation succeeds');
select lives_ok($test$select public.create_case_event(
  '22000000-0000-4000-8000-000000000001', 'Future synthetic event',
  (now() at time zone 'America/Argentina/Buenos_Aires') + interval '1 day'
)$test$, 'future event creation succeeds');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'all', 'event')->>'total')::int, 2, 'all entries includes both past and future events');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'upcoming', 'event')->>'total')::int, 1, 'upcoming still excludes past events');
select is((public.list_agenda('20000000-0000-4000-8000-000000000001', 'overdue', 'event')->>'total')::int, 0, 'past events are not overdue obligations');
select throws_ok($test$select public.list_agenda('30000000-0000-4000-8000-000000000001', 'all', 'event')$test$, '42501', 'not authorized', 'event history denies cross-firm reads');
reset role;
update public.firm_memberships set status='disabled' where profile_id='aaaaaaaa-0000-4000-8000-000000000004';
set local role authenticated;
select throws_ok($test$select public.set_deadline_status('23000000-0000-4000-8000-000000000001','completed',4)$test$, '42501', 'not authorized', 'disabled admin cannot resolve');
select throws_ok($test$select public.list_agenda('20000000-0000-4000-8000-000000000001')$test$, '42501', 'not authorized', 'disabled membership cannot query agenda');
select * from finish();
rollback;
