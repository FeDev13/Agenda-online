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


create temporary table activity_before as select id, last_activity_at from public.cases;
grant select on activity_before to authenticated;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select lives_ok($$insert into public.tasks (firm_id, case_id, title, created_by)
values ('20000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', 'Synthetic activity task', auth.uid())$$,
'assigned paralegal can add task and touch parent without case edit privileges');
select ok((select c.last_activity_at > b.last_activity_at from public.cases c join activity_before b using(id)), 'task advances activity');
select is((select count(*) from public.cases), 1::bigint, 'cross-firm case remains invisible');
select throws_ok($$insert into public.tasks (firm_id, case_id, title, created_by)
values ('30000000-0000-4000-8000-000000000001', '32000000-0000-4000-8000-000000000001', 'Denied cross-firm task', auth.uid())$$,
'42501', null, 'cross-firm task denied');
reset role;
select is((select c.last_activity_at from public.cases c where c.case_number = 'B-001'),
(select last_activity_at from activity_before where id = '32000000-0000-4000-8000-000000000001'), 'denied write leaves other firm activity unchanged');
update activity_before b set last_activity_at = c.last_activity_at from public.cases c where c.id = b.id;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select lives_ok($$select public.create_legal_deadline('22000000-0000-4000-8000-000000000001', 'Synthetic deadline', current_date + 7, 'Human confirmed', null)$$, 'deadline can be added');
select ok((select c.last_activity_at > b.last_activity_at from public.cases c join activity_before b using(id)), 'deadline advances activity');
reset role;
update activity_before b set last_activity_at = c.last_activity_at from public.cases c where c.id = b.id;
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
select throws_ok($$insert into public.tasks (firm_id, case_id, title, created_by)
values ('20000000-0000-4000-8000-000000000001', '22000000-0000-4000-8000-000000000001', 'Denied reader task', auth.uid())$$,
'42501', null, 'read-only task denied');
select is((select c.last_activity_at from public.cases c), (select last_activity_at from activity_before where id = '22000000-0000-4000-8000-000000000001'), 'denied reader write leaves activity unchanged');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
update public.cases set title = 'Edited synthetic case' where case_number = 'A-001';
select ok((select c.last_activity_at > b.last_activity_at from public.cases c join activity_before b using(id)), 'case edit advances activity');
select * from finish();
rollback;
