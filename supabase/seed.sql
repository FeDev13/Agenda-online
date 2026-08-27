-- Synthetic local-development data only.
-- Never replace these rows with real client, case, document, credential, or export data.

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change,
  email_change_token_current,
  phone,
  phone_change,
  phone_change_token,
  reauthentication_token,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  (
    '10000000-0000-4000-8000-000000000010',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'admin@example.test',
    crypt('Agenda-demo-1!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Alicia Admin"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000011',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'lawyer@example.test',
    crypt('Agenda-demo-1!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Lorenzo Lawyer"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000012',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'paralegal@example.test',
    crypt('Agenda-demo-1!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Paula Paralegal"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000013',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'reader@example.test',
    crypt('Agenda-demo-1!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Rita Read Only"}'::jsonb,
    now(),
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000020',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'outside@example.test',
    crypt('Agenda-demo-1!', gen_salt('bf')),
    now(),
    '',
    '',
    '',
    '',
    '',
    null,
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"display_name":"Oscar Other Firm"}'::jsonb,
    now(),
    now()
  )
on conflict (id) do update
set
  email = excluded.email,
  encrypted_password = excluded.encrypted_password,
  email_confirmed_at = excluded.email_confirmed_at,
  confirmation_token = excluded.confirmation_token,
  recovery_token = excluded.recovery_token,
  email_change_token_new = excluded.email_change_token_new,
  email_change = excluded.email_change,
  email_change_token_current = excluded.email_change_token_current,
  phone = excluded.phone,
  phone_change = excluded.phone_change,
  phone_change_token = excluded.phone_change_token,
  reauthentication_token = excluded.reauthentication_token,
  raw_app_meta_data = excluded.raw_app_meta_data,
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into auth.identities (
  provider_id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
select
  users.id::text,
  users.id,
  jsonb_build_object('sub', users.id::text, 'email', users.email),
  'email',
  now(),
  now(),
  now()
from auth.users users
where users.email in (
  'admin@example.test',
  'lawyer@example.test',
  'paralegal@example.test',
  'reader@example.test',
  'outside@example.test'
)
on conflict (provider_id, provider) do update
set
  identity_data = excluded.identity_data,
  updated_at = now();

insert into public.firms (id, name)
values
  ('10000000-0000-4000-8000-000000000001', 'Synthetic Legal Studio'),
  ('10000000-0000-4000-8000-000000000002', 'Synthetic Outside Firm')
on conflict (id) do update
set
  name = excluded.name,
  updated_at = now();

insert into public.firm_memberships (
  firm_id,
  profile_id,
  role,
  status,
  accepted_at
)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000010',
    'admin',
    'active',
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000011',
    'lawyer',
    'active',
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000012',
    'paralegal',
    'active',
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000013',
    'read_only',
    'active',
    now()
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000020',
    'lawyer',
    'active',
    now()
  )
on conflict (firm_id, profile_id) do update
set
  role = excluded.role,
  status = excluded.status,
  accepted_at = excluded.accepted_at,
  updated_at = now();

insert into public.clients (id, firm_id, display_name, created_by)
values
  (
    '10000000-0000-4000-8000-000000000101',
    '10000000-0000-4000-8000-000000000001',
    'Synthetic Client One',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000001',
    'Synthetic Client Two',
    '10000000-0000-4000-8000-000000000011'
  ),
  (
    '10000000-0000-4000-8000-000000000201',
    '10000000-0000-4000-8000-000000000002',
    'Synthetic Outside Client',
    '10000000-0000-4000-8000-000000000020'
  )
on conflict (id) do update
set
  display_name = excluded.display_name,
  updated_at = now();

insert into public.cases (
  id,
  firm_id,
  client_id,
  case_number,
  title,
  jurisdiction,
  court,
  docket_number,
  opened_on,
  description,
  created_by
)
values
  (
    '10000000-0000-4000-8000-000000000111',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000101',
    'SYN-2026-001',
    'Synthetic Contract Review',
    'Ciudad Autonoma de Buenos Aires',
    'Civil Court 12',
    'EXP-SYN-001',
    '2026-08-01',
    'Synthetic case for local MVP validation.',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000112',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000102',
    'SYN-2026-002',
    'Synthetic Labor Hearing',
    'Provincia de Buenos Aires',
    'Labor Court 4',
    'EXP-SYN-002',
    '2026-08-15',
    'Synthetic case for assignment and scheduling checks.',
    '10000000-0000-4000-8000-000000000011'
  ),
  (
    '10000000-0000-4000-8000-000000000211',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000201',
    'OUT-2026-001',
    'Synthetic Other Firm Matter',
    'Ciudad Autonoma de Buenos Aires',
    'Commercial Court 3',
    'EXP-OUT-001',
    '2026-08-10',
    'Synthetic cross-firm isolation check.',
    '10000000-0000-4000-8000-000000000020'
  )
on conflict (id) do update
set
  title = excluded.title,
  jurisdiction = excluded.jurisdiction,
  court = excluded.court,
  docket_number = excluded.docket_number,
  description = excluded.description,
  updated_at = now();

insert into public.case_members (firm_id, case_id, profile_id, role, assigned_by)
values
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000111',
    '10000000-0000-4000-8000-000000000010',
    'responsible_admin',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000111',
    '10000000-0000-4000-8000-000000000012',
    'assigned_paralegal',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000112',
    '10000000-0000-4000-8000-000000000011',
    'responsible_lawyer',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000211',
    '10000000-0000-4000-8000-000000000020',
    'responsible_lawyer',
    '10000000-0000-4000-8000-000000000020'
  )
on conflict (firm_id, case_id, profile_id) do update
set
  role = excluded.role,
  assigned_by = excluded.assigned_by;

insert into public.events (
  id,
  firm_id,
  case_id,
  title,
  starts_at,
  ends_at,
  timezone,
  location,
  created_by
)
values (
  '10000000-0000-4000-8000-000000000301',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000111',
  'Synthetic client meeting',
  '2026-09-15 10:00:00 America/Argentina/Buenos_Aires'::timestamptz,
  '2026-09-15 11:00:00 America/Argentina/Buenos_Aires'::timestamptz,
  'America/Argentina/Buenos_Aires',
  'Conference room',
  '10000000-0000-4000-8000-000000000010'
)
on conflict (id) do update
set
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  timezone = excluded.timezone,
  location = excluded.location,
  updated_at = now();

insert into public.case_deadlines (
  id,
  firm_id,
  case_id,
  title,
  due_on,
  rule_source,
  calculation_notes,
  confirmed_by,
  confirmed_at,
  created_by
)
values (
  '10000000-0000-4000-8000-000000000401',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000112',
  'Synthetic filing deadline',
  '2026-09-20',
  'Manual court order review',
  'Synthetic manually entered deadline; no automated legal calculation.',
  '10000000-0000-4000-8000-000000000011',
  now(),
  '10000000-0000-4000-8000-000000000011'
)
on conflict (id) do update
set
  title = excluded.title,
  due_on = excluded.due_on,
  rule_source = excluded.rule_source,
  calculation_notes = excluded.calculation_notes,
  updated_at = now();

insert into public.notes (id, firm_id, case_id, body, created_by)
values (
  '10000000-0000-4000-8000-000000000501',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000111',
  'Synthetic note for local case-detail review.',
  '10000000-0000-4000-8000-000000000010'
)
on conflict (id) do update
set
  body = excluded.body,
  updated_at = now();

insert into public.tasks (
  id,
  firm_id,
  case_id,
  title,
  due_on,
  assigned_to,
  created_by
)
values (
  '10000000-0000-4000-8000-000000000601',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000111',
  'Synthetic prepare hearing packet',
  '2026-09-10',
  '10000000-0000-4000-8000-000000000012',
  '10000000-0000-4000-8000-000000000010'
)
on conflict (id) do update
set
  title = excluded.title,
  due_on = excluded.due_on,
  assigned_to = excluded.assigned_to,
  updated_at = now();

insert into public.documents (
  id,
  firm_id,
  case_id,
  storage_path,
  display_name,
  mime_type,
  size_bytes,
  created_by
)
values (
  '10000000-0000-4000-8000-000000000701',
  '10000000-0000-4000-8000-000000000001',
  '10000000-0000-4000-8000-000000000111',
  '10000000-0000-4000-8000-000000000001/10000000-0000-4000-8000-000000000111/synthetic-contract.pdf',
  'Synthetic contract.pdf',
  'application/pdf',
  102400,
  '10000000-0000-4000-8000-000000000010'
)
on conflict (id) do update
set
  storage_path = excluded.storage_path,
  display_name = excluded.display_name,
  mime_type = excluded.mime_type,
  size_bytes = excluded.size_bytes,
  updated_at = now();
