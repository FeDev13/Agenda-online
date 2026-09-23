begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;

select plan(23);

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

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.cases where firm_id = '20000000-0000-4000-8000-000000000001'),
  1,
  'firm lawyer can read own firm case'
);

select is(
  (select count(*)::integer from public.cases where firm_id = '30000000-0000-4000-8000-000000000001'),
  0,
  'firm lawyer cannot read another firm case'
);

select throws_ok(
  $$
    insert into public.cases (firm_id, client_id, case_number, title, opened_on, created_by)
    values (
      '30000000-0000-4000-8000-000000000001',
      '31000000-0000-4000-8000-000000000001',
      'B-999',
      'Causa prohibida entre estudios',
      '2026-09-02',
      'aaaaaaaa-0000-4000-8000-000000000001'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "cases"',
  'cross-firm case insert is denied'
);

select throws_ok(
  $$
    select public.archive_case('22000000-0000-4000-8000-000000000001')
  $$,
  '42501',
  'not authorized',
  'firm lawyer cannot archive cases through the archive RPC'
);

select throws_ok(
  $$
    update public.cases
    set status = 'archived'
    where id = '22000000-0000-4000-8000-000000000001'
  $$,
  '42501',
  'not authorized',
  'firm lawyer cannot archive cases through direct table update'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.cases),
  1,
  'assigned paralegal can read only assigned case'
);

select lives_ok(
  $$
    select public.create_case_event(
      '22000000-0000-4000-8000-000000000001',
      'Preparacion sintetica de audiencia',
      '2026-09-15 10:30'::timestamp,
      '2026-09-15 11:30'::timestamp,
      'America/Argentina/Buenos_Aires',
      'Sala de reuniones',
      null
    )
  $$,
  'assigned paralegal can create a timezone-aware event'
);

select is(
  (select timezone from public.events where title = 'Preparacion sintetica de audiencia'),
  'America/Argentina/Buenos_Aires',
  'event retains original IANA timezone'
);

select lives_ok(
  $$
    select public.create_legal_deadline(
      '22000000-0000-4000-8000-000000000001',
      'Vencimiento sintetico de presentacion',
      '2026-09-15'::date,
      'Revision manual de orden judicial',
      'Carga manual; sin calculo automatizado'
    )
  $$,
  'assigned paralegal can create a date-only legal deadline'
);

select is(
  (select due_on::text from public.case_deadlines where title = 'Vencimiento sintetico de presentacion'),
  '2026-09-15',
  'deadline preserves date-only semantics'
);

select lives_ok(
  $$
    select public.hide_schedule_item(
      'event',
      (
        select id
        from public.events
        where title = 'Preparacion sintetica de audiencia'
      )
    )
  $$,
  'assigned paralegal can hide an authorized event'
);

select ok(
  (
    select hidden_at is not null
    from public.events
    where title = 'Preparacion sintetica de audiencia'
  ),
  'hidden event keeps the row and stores a hidden timestamp'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000001', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000001","role":"authenticated"}',
  true
);

select is(
  (
    select count(*)::integer
    from public.audit_log
    where action = 'event.hidden'
  ),
  1,
  'hidden event writes an audit entry'
);

select lives_ok(
  $$
    delete from public.case_members
    where firm_id = '20000000-0000-4000-8000-000000000001'
      and case_id = '22000000-0000-4000-8000-000000000001'
      and profile_id = 'aaaaaaaa-0000-4000-8000-000000000002'
  $$,
  'firm lawyer can remove a case assignment'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000002', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000002","role":"authenticated"}',
  true
);

select is(
  (select count(*)::integer from public.cases),
  0,
  'removed paralegal can no longer read the assigned case'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000003', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000003","role":"authenticated"}',
  true
);

select throws_ok(
  $$
    select public.hide_schedule_item(
      'deadline',
      (
        select id
        from public.case_deadlines
        where title = 'Vencimiento sintetico de presentacion'
      )
    )
  $$,
  '42501',
  'not authorized',
  'read-only member cannot hide schedule items even when assigned'
);

select throws_ok(
  $$
    select public.create_legal_deadline(
      '22000000-0000-4000-8000-000000000001',
      'Vencimiento prohibido para lector',
      '2026-09-16'::date,
      null,
      null
    )
  $$,
  '42501',
  'not authorized',
  'read-only member cannot create deadlines even when assigned'
);

select throws_ok(
  $$
    insert into public.notes (firm_id, case_id, body, created_by)
    values (
      '20000000-0000-4000-8000-000000000001',
      '22000000-0000-4000-8000-000000000001',
      'Forbidden reader note',
      'aaaaaaaa-0000-4000-8000-000000000003'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "notes"',
  'read-only member cannot create notes even when assigned'
);

select throws_ok(
  $$
    insert into public.tasks (firm_id, case_id, title, created_by)
    values (
      '20000000-0000-4000-8000-000000000001',
      '22000000-0000-4000-8000-000000000001',
      'Forbidden reader task',
      'aaaaaaaa-0000-4000-8000-000000000003'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "tasks"',
  'read-only member cannot create tasks even when assigned'
);

select throws_ok(
  $$
    insert into public.documents (
      firm_id,
      case_id,
      storage_path,
      display_name,
      created_by
    )
    values (
      '20000000-0000-4000-8000-000000000001',
      '22000000-0000-4000-8000-000000000001',
      '20000000-0000-4000-8000-000000000001/22000000-0000-4000-8000-000000000001/forbidden.pdf',
      'Forbidden reader document',
      'aaaaaaaa-0000-4000-8000-000000000003'
    )
  $$,
  '42501',
  'new row violates row-level security policy for table "documents"',
  'read-only member cannot create document metadata even when assigned'
);

select set_config('request.jwt.claim.sub', 'aaaaaaaa-0000-4000-8000-000000000004', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-0000-4000-8000-000000000004","role":"authenticated"}',
  true
);

select lives_ok(
  $$
    select public.archive_case('22000000-0000-4000-8000-000000000001')
  $$,
  'firm admin can archive an open case'
);

select is(
  (select status::text from public.cases where id = '22000000-0000-4000-8000-000000000001'),
  'archived',
  'case archive keeps the row and marks it archived'
);

select is(
  (
    select count(*)::integer
    from public.audit_log
    where action = 'case.archived'
      and target_id = '22000000-0000-4000-8000-000000000001'
  ),
  1,
  'case archive writes an audit entry'
);

select * from finish();

rollback;
