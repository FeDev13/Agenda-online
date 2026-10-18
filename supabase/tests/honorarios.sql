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
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select lives_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',12345,0)$$, 'lawyer creates estimate');
select is((select amount_cents from public.case_fee_estimates), 12345::bigint, 'exact cents persist');
select is((select count(*)::int from public.audit_log where action='fee_estimate.saved'), 1, 'mutation audited');
select throws_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',1,0)$$, '40001', 'Estimate changed', 'stale creation rejected');
select lives_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',0,1)$$, 'update to zero accepted');
select throws_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','USD',-1,0)$$, '22023', 'Invalid estimate', 'negative rejected');
select throws_ok($$update public.case_fee_estimates set amount_cents=1$$, '42501', 'permission denied for table case_fee_estimates', 'direct writes denied');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.case_fee_estimates), 1, 'assigned paralegal reads');
select throws_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',1,2)$$, '42501', 'Not authorized', 'paralegal cannot edit');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
select is((select count(*)::int from public.case_fee_estimates), 1, 'assigned read-only reads');
select throws_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',1,2)$$, '42501', 'Not authorized', 'read-only cannot edit');
select set_config('request.jwt.claim.sub', 'bbbbbbbb-0000-4000-8000-000000000001', true);
select is((select count(*)::int from public.case_fee_estimates), 0, 'cross-firm reads denied');
select throws_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',1,2)$$, '42501', 'Not authorized', 'cross-firm edit denied');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000004', true);
select lives_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','USD',100,0)$$, 'admin edits');
reset role;
update public.firm_memberships set status='disabled' where profile_id='aaaaaaaa-0000-4000-8000-000000000002';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select is((select count(*)::int from public.case_fee_estimates), 0, 'inactive membership denied');
reset role;
delete from public.case_members where profile_id='aaaaaaaa-0000-4000-8000-000000000003';
set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
select is((select count(*)::int from public.case_fee_estimates), 0, 'unassigned read-only denied');
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000004', true);
select lives_ok($$select public.archive_case('22000000-0000-4000-8000-000000000001')$$, 'admin archives case');
select is((select count(*)::int from public.case_fee_estimates), 2, 'archived estimates remain readable');
select throws_ok($$select public.set_case_fee_estimate('22000000-0000-4000-8000-000000000001','ARS',1,2)$$, '42501', 'Not authorized', 'archived estimate cannot be changed');
select * from finish();
rollback;
