-- Datos sinteticos solo para desarrollo local.
-- Nunca reemplazar estas filas con datos reales de clientes, causas, documentos, credenciales o exportaciones.

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
    '{"display_name":"Alicia Administracion"}'::jsonb,
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
    '{"display_name":"Lorenzo Abogado"}'::jsonb,
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
    '{"display_name":"Paula Asistente Legal"}'::jsonb,
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
    '{"display_name":"Rita Solo Lectura"}'::jsonb,
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
    '{"display_name":"Oscar Otro Estudio"}'::jsonb,
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
  ('10000000-0000-4000-8000-000000000001', 'Estudio Legal Sintetico'),
  ('10000000-0000-4000-8000-000000000002', 'Estudio Externo Sintetico')
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
    'Cliente Sintetico Uno',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000102',
    '10000000-0000-4000-8000-000000000001',
    'Cliente Sintetico Dos',
    '10000000-0000-4000-8000-000000000011'
  ),
  (
    '10000000-0000-4000-8000-000000000201',
    '10000000-0000-4000-8000-000000000002',
    'Cliente Externo Sintetico',
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
    'Revision contractual sintetica',
    'Ciudad Autonoma de Buenos Aires',
    'Juzgado Civil 12',
    'EXP-SYN-001',
    '2026-08-01',
    'Causa sintetica para validacion local del MVP.',
    '10000000-0000-4000-8000-000000000010'
  ),
  (
    '10000000-0000-4000-8000-000000000112',
    '10000000-0000-4000-8000-000000000001',
    '10000000-0000-4000-8000-000000000102',
    'SYN-2026-002',
    'Audiencia laboral sintetica',
    'Provincia de Buenos Aires',
    'Juzgado Laboral 4',
    'EXP-SYN-002',
    '2026-08-15',
    'Causa sintetica para controles de asignacion y agenda.',
    '10000000-0000-4000-8000-000000000011'
  ),
  (
    '10000000-0000-4000-8000-000000000211',
    '10000000-0000-4000-8000-000000000002',
    '10000000-0000-4000-8000-000000000201',
    'OUT-2026-001',
    'Asunto sintetico de otro estudio',
    'Ciudad Autonoma de Buenos Aires',
    'Juzgado Comercial 3',
    'EXP-OUT-001',
    '2026-08-10',
    'Control sintetico de aislamiento entre estudios.',
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
  'Reunion sintetica con cliente',
  '2026-09-15 10:00:00 America/Argentina/Buenos_Aires'::timestamptz,
  '2026-09-15 11:00:00 America/Argentina/Buenos_Aires'::timestamptz,
  'America/Argentina/Buenos_Aires',
  'Sala de reuniones',
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
  'Vencimiento sintetico de presentacion',
  '2026-09-20',
  'Revision manual de orden judicial',
  'Vencimiento sintetico cargado manualmente; sin calculo legal automatizado.',
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
  'Nota sintetica para revision local del detalle de causa.',
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
  'Preparar legajo sintetico para audiencia',
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
  'contrato-sintetico.pdf',
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
