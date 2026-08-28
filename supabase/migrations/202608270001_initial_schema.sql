create extension if not exists pgcrypto;

create type public.firm_role as enum ('admin', 'lawyer', 'paralegal', 'read_only');
create type public.membership_status as enum ('invited', 'active', 'disabled');
create type public.case_status as enum ('open', 'closed', 'archived');
create type public.task_status as enum ('open', 'completed', 'archived');
create type public.reminder_channel as enum ('in_app', 'email');

create table public.firms (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  default_timezone text not null default 'America/Argentina/Buenos_Aires',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  email text not null,
  mfa_required boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.firm_memberships (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  role public.firm_role not null,
  status public.membership_status not null default 'invited',
  invited_by uuid references public.profiles (id) on delete set null,
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, profile_id)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  display_name text not null check (char_length(trim(display_name)) > 0),
  identity_reference text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (firm_id, id)
);

create table public.cases (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  client_id uuid not null,
  case_number text not null check (char_length(trim(case_number)) > 0),
  title text not null check (char_length(trim(title)) > 0),
  status public.case_status not null default 'open',
  jurisdiction text,
  court text,
  docket_number text,
  opened_on date not null,
  closed_on date,
  description text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, client_id) references public.clients (firm_id, id) on delete restrict,
  unique (firm_id, id),
  unique (firm_id, case_number),
  check (closed_on is null or closed_on >= opened_on)
);

create table public.case_members (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  role text not null default 'assigned',
  assigned_by uuid references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict,
  foreign key (firm_id, profile_id) references public.firm_memberships (firm_id, profile_id) on delete restrict,
  unique (firm_id, case_id, profile_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  title text not null check (char_length(trim(title)) > 0),
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  location text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict,
  check (ends_at is null or ends_at >= starts_at)
);

create table public.case_deadlines (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  title text not null check (char_length(trim(title)) > 0),
  due_on date not null,
  rule_source text,
  calculation_notes text,
  confirmed_by uuid references public.profiles (id) on delete restrict,
  confirmed_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  title text not null check (char_length(trim(title)) > 0),
  status public.task_status not null default 'open',
  due_on date,
  assigned_to uuid references public.profiles (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict,
  foreign key (firm_id, assigned_to) references public.firm_memberships (firm_id, profile_id) on delete restrict
);

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  event_id uuid references public.events (id) on delete cascade,
  deadline_id uuid references public.case_deadlines (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  remind_at timestamptz not null,
  channel public.reminder_channel not null default 'in_app',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict,
  check (
    num_nonnulls(event_id, deadline_id, task_id) = 1
  )
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  body text not null check (char_length(trim(body)) > 0),
  archived_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  updated_by uuid references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict
);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  case_id uuid not null,
  storage_bucket text not null default 'case-documents',
  storage_path text not null,
  display_name text not null check (char_length(trim(display_name)) > 0),
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes >= 0),
  archived_at timestamptz,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict,
  unique (storage_bucket, storage_path)
);

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(trim(action)) > 0),
  target_table text not null check (char_length(trim(target_table)) > 0),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index firm_memberships_profile_status_idx on public.firm_memberships (profile_id, status);
create index clients_firm_status_idx on public.clients (firm_id, status);
create index cases_firm_status_idx on public.cases (firm_id, status);
create index case_members_profile_idx on public.case_members (profile_id, firm_id);
create index events_case_starts_idx on public.events (case_id, starts_at);
create index events_firm_starts_idx on public.events (firm_id, starts_at);
create index case_deadlines_case_due_idx on public.case_deadlines (case_id, due_on);
create index case_deadlines_firm_due_idx on public.case_deadlines (firm_id, due_on);
create index tasks_case_status_idx on public.tasks (case_id, status);
create index reminders_firm_remind_at_idx on public.reminders (firm_id, remind_at);
create index notes_case_created_at_idx on public.notes (case_id, created_at desc);
create index documents_case_created_at_idx on public.documents (case_id, created_at desc);
create index audit_log_firm_created_at_idx on public.audit_log (firm_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_firms_updated_at before update on public.firms
  for each row execute function public.set_updated_at();
create trigger set_profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_firm_memberships_updated_at before update on public.firm_memberships
  for each row execute function public.set_updated_at();
create trigger set_clients_updated_at before update on public.clients
  for each row execute function public.set_updated_at();
create trigger set_cases_updated_at before update on public.cases
  for each row execute function public.set_updated_at();
create trigger set_events_updated_at before update on public.events
  for each row execute function public.set_updated_at();
create trigger set_case_deadlines_updated_at before update on public.case_deadlines
  for each row execute function public.set_updated_at();
create trigger set_tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();
create trigger set_notes_updated_at before update on public.notes
  for each row execute function public.set_updated_at();
create trigger set_documents_updated_at before update on public.documents
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    coalesce(new.email, ''),
    nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_active_firm_member(target_firm_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.firm_memberships memberships
    where memberships.firm_id = target_firm_id
      and memberships.profile_id = auth.uid()
      and memberships.status = 'active'
  );
$$;

create or replace function public.active_firm_role(target_firm_id uuid)
returns public.firm_role
language sql
stable
security definer
set search_path = public
as $$
  select memberships.role
  from public.firm_memberships memberships
  where memberships.firm_id = target_firm_id
    and memberships.profile_id = auth.uid()
    and memberships.status = 'active'
  limit 1;
$$;

create or replace function public.has_firm_role(
  target_firm_id uuid,
  allowed_roles public.firm_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.active_firm_role(target_firm_id) = any(allowed_roles), false);
$$;

create or replace function public.can_access_case(
  target_firm_id uuid,
  target_case_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_active_firm_member(target_firm_id)
    and (
      public.has_firm_role(target_firm_id, array['admin', 'lawyer']::public.firm_role[])
      or exists (
        select 1
        from public.case_members members
        where members.firm_id = target_firm_id
          and members.case_id = target_case_id
          and members.profile_id = auth.uid()
      )
    );
$$;

create or replace function public.create_case_with_client(
  p_firm_id uuid,
  p_client_display_name text,
  p_case_number text,
  p_title text,
  p_opened_on date,
  p_jurisdiction text default null,
  p_court text default null,
  p_docket_number text default null,
  p_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_client_id uuid;
  v_case_id uuid;
begin
  if not public.has_firm_role(p_firm_id, array['admin', 'lawyer']::public.firm_role[]) then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.clients (firm_id, display_name, created_by)
  values (p_firm_id, trim(p_client_display_name), auth.uid())
  returning id into v_client_id;

  insert into public.cases (
    firm_id,
    client_id,
    case_number,
    title,
    opened_on,
    jurisdiction,
    court,
    docket_number,
    description,
    created_by
  )
  values (
    p_firm_id,
    v_client_id,
    trim(p_case_number),
    trim(p_title),
    p_opened_on,
    nullif(trim(coalesce(p_jurisdiction, '')), ''),
    nullif(trim(coalesce(p_court, '')), ''),
    nullif(trim(coalesce(p_docket_number, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    auth.uid()
  )
  returning id into v_case_id;

  insert into public.case_members (firm_id, case_id, profile_id, role, assigned_by)
  values (p_firm_id, v_case_id, auth.uid(), 'responsible_lawyer', auth.uid());

  insert into public.audit_log (firm_id, actor_profile_id, action, target_table, target_id)
  values (p_firm_id, auth.uid(), 'case.created', 'cases', v_case_id);

  return v_case_id;
end;
$$;

create or replace function public.create_case_event(
  p_case_id uuid,
  p_title text,
  p_starts_at_local timestamp without time zone,
  p_ends_at_local timestamp without time zone default null,
  p_timezone text default 'America/Argentina/Buenos_Aires',
  p_location text default null,
  p_description text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_firm_id uuid;
  v_event_id uuid;
begin
  perform now() at time zone p_timezone;

  select firm_id into v_firm_id
  from public.cases
  where id = p_case_id
    and status = 'open';

  if v_firm_id is null
    or not public.can_access_case(v_firm_id, p_case_id)
    or not public.has_firm_role(v_firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.events (
    firm_id,
    case_id,
    title,
    starts_at,
    ends_at,
    timezone,
    location,
    description,
    created_by
  )
  values (
    v_firm_id,
    p_case_id,
    trim(p_title),
    p_starts_at_local at time zone p_timezone,
    case when p_ends_at_local is null then null else p_ends_at_local at time zone p_timezone end,
    p_timezone,
    nullif(trim(coalesce(p_location, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    auth.uid()
  )
  returning id into v_event_id;

  insert into public.audit_log (firm_id, actor_profile_id, action, target_table, target_id)
  values (v_firm_id, auth.uid(), 'event.created', 'events', v_event_id);

  return v_event_id;
end;
$$;

create or replace function public.create_legal_deadline(
  p_case_id uuid,
  p_title text,
  p_due_on date,
  p_rule_source text default null,
  p_calculation_notes text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_firm_id uuid;
  v_deadline_id uuid;
begin
  select firm_id into v_firm_id
  from public.cases
  where id = p_case_id
    and status = 'open';

  if v_firm_id is null
    or not public.can_access_case(v_firm_id, p_case_id)
    or not public.has_firm_role(v_firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  insert into public.case_deadlines (
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
    v_firm_id,
    p_case_id,
    trim(p_title),
    p_due_on,
    nullif(trim(coalesce(p_rule_source, '')), ''),
    nullif(trim(coalesce(p_calculation_notes, '')), ''),
    auth.uid(),
    now(),
    auth.uid()
  )
  returning id into v_deadline_id;

  insert into public.audit_log (firm_id, actor_profile_id, action, target_table, target_id)
  values (v_firm_id, auth.uid(), 'deadline.created', 'case_deadlines', v_deadline_id);

  return v_deadline_id;
end;
$$;

alter table public.firms enable row level security;
alter table public.profiles enable row level security;
alter table public.firm_memberships enable row level security;
alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.case_members enable row level security;
alter table public.events enable row level security;
alter table public.case_deadlines enable row level security;
alter table public.tasks enable row level security;
alter table public.reminders enable row level security;
alter table public.notes enable row level security;
alter table public.documents enable row level security;
alter table public.audit_log enable row level security;

alter table public.firms force row level security;
alter table public.profiles force row level security;
alter table public.firm_memberships force row level security;
alter table public.clients force row level security;
alter table public.cases force row level security;
alter table public.case_members force row level security;
alter table public.events force row level security;
alter table public.case_deadlines force row level security;
alter table public.tasks force row level security;
alter table public.reminders force row level security;
alter table public.notes force row level security;
alter table public.documents force row level security;
alter table public.audit_log force row level security;

create policy "active members can read their firms" on public.firms
  for select to authenticated
  using (public.is_active_firm_member(id));

create policy "admins can update firm settings" on public.firms
  for update to authenticated
  using (public.has_firm_role(id, array['admin']::public.firm_role[]))
  with check (public.has_firm_role(id, array['admin']::public.firm_role[]));

create policy "users can read own profile and firm colleagues" on public.profiles
  for select to authenticated
  using (
    id = auth.uid()
    or exists (
      select 1
      from public.firm_memberships self
      join public.firm_memberships colleague on colleague.firm_id = self.firm_id
      where self.profile_id = auth.uid()
        and self.status = 'active'
        and colleague.profile_id = profiles.id
        and (
          colleague.status = 'active'
          or self.role = 'admin'
        )
    )
  );

create policy "users can update own display name" on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "members can read memberships in their firms" on public.firm_memberships
  for select to authenticated
  using (public.is_active_firm_member(firm_id));

create policy "admins can manage memberships" on public.firm_memberships
  for all to authenticated
  using (public.has_firm_role(firm_id, array['admin']::public.firm_role[]))
  with check (public.has_firm_role(firm_id, array['admin']::public.firm_role[]));

create policy "active members can read clients" on public.clients
  for select to authenticated
  using (public.is_active_firm_member(firm_id));

create policy "case managers can create clients" on public.clients
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "case managers can update clients" on public.clients
  for update to authenticated
  using (public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[]))
  with check (public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[]));

create policy "authorized users can read cases" on public.cases
  for select to authenticated
  using (public.can_access_case(firm_id, id));

create policy "admins and lawyers can create cases" on public.cases
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[])
  );

create policy "admins and lawyers can update cases" on public.cases
  for update to authenticated
  using (public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]))
  with check (public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]));

create policy "authorized users can read case members" on public.case_members
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "admins and lawyers can manage case members" on public.case_members
  for all to authenticated
  using (public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]))
  with check (public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]));

create policy "authorized users can read events" on public.events
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "schedule managers can create events" on public.events
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "schedule managers can update events" on public.events
  for update to authenticated
  using (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  )
  with check (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authorized users can read legal deadlines" on public.case_deadlines
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "schedule managers can create legal deadlines" on public.case_deadlines
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "schedule managers can update legal deadlines" on public.case_deadlines
  for update to authenticated
  using (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  )
  with check (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authorized users can read tasks" on public.tasks
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "authorized users can manage tasks" on public.tasks
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authorized users can update tasks" on public.tasks
  for update to authenticated
  using (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  )
  with check (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authorized users can read reminders" on public.reminders
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "authorized users can create reminders" on public.reminders
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authorized users can read notes" on public.notes
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "authorized users can create notes" on public.notes
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authors and case managers can update notes" on public.notes
  for update to authenticated
  using (
    public.can_access_case(firm_id, case_id)
    and (created_by = auth.uid() or public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]))
  )
  with check (
    public.can_access_case(firm_id, case_id)
    and (created_by = auth.uid() or public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]))
  );

create policy "authorized users can read document metadata" on public.documents
  for select to authenticated
  using (public.can_access_case(firm_id, case_id));

create policy "authorized users can create document metadata" on public.documents
  for insert to authenticated
  with check (
    created_by = auth.uid()
    and public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "authorized users can archive document metadata" on public.documents
  for update to authenticated
  using (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  )
  with check (
    public.can_access_case(firm_id, case_id)
    and public.has_firm_role(firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  );

create policy "admins and lawyers can read audit log" on public.audit_log
  for select to authenticated
  using (public.has_firm_role(firm_id, array['admin', 'lawyer']::public.firm_role[]));

create policy "active members can append audit log" on public.audit_log
  for insert to authenticated
  with check (actor_profile_id = auth.uid() and public.is_active_firm_member(firm_id));

revoke all on schema public from anon;
revoke all on all tables in schema public from anon;
revoke all on all routines in schema public from public;

grant usage on schema public to authenticated;
grant usage on type public.firm_role to authenticated;
grant usage on type public.membership_status to authenticated;
grant usage on type public.case_status to authenticated;
grant usage on type public.task_status to authenticated;
grant usage on type public.reminder_channel to authenticated;
grant select, update on public.firms to authenticated;
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;
grant select, insert, update on public.firm_memberships to authenticated;
grant select, insert, update on public.clients to authenticated;
grant select, insert, update on public.cases to authenticated;
grant select, insert, update, delete on public.case_members to authenticated;
grant select, insert, update on public.events to authenticated;
grant select, insert, update on public.case_deadlines to authenticated;
grant select, insert, update on public.tasks to authenticated;
grant select, insert on public.reminders to authenticated;
grant select, insert, update on public.notes to authenticated;
grant select, insert, update on public.documents to authenticated;
grant select, insert on public.audit_log to authenticated;

grant execute on function public.is_active_firm_member(uuid) to authenticated;
grant execute on function public.active_firm_role(uuid) to authenticated;
grant execute on function public.has_firm_role(uuid, public.firm_role[]) to authenticated;
grant execute on function public.can_access_case(uuid, uuid) to authenticated;

grant execute on function public.create_case_with_client(
  uuid,
  text,
  text,
  text,
  date,
  text,
  text,
  text,
  text
) to authenticated;
grant execute on function public.create_case_event(
  uuid,
  text,
  timestamp without time zone,
  timestamp without time zone,
  text,
  text,
  text
) to authenticated;
grant execute on function public.create_legal_deadline(uuid, text, date, text, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'case-documents',
  'case-documents',
  false,
  52428800,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "case documents can be read by authorized case users"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'case-documents'
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.can_access_case(
      ((storage.foldername(name))[1])::uuid,
      ((storage.foldername(name))[2])::uuid
    )
  );

create policy "case documents can be uploaded by authorized case users"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'case-documents'
    and owner = auth.uid()
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.can_access_case(
      ((storage.foldername(name))[1])::uuid,
      ((storage.foldername(name))[2])::uuid
    )
    and public.has_firm_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin', 'lawyer', 'paralegal']::public.firm_role[]
    )
  );

create policy "case documents can be updated by authorized case users"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'case-documents'
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.can_access_case(
      ((storage.foldername(name))[1])::uuid,
      ((storage.foldername(name))[2])::uuid
    )
    and public.has_firm_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin', 'lawyer', 'paralegal']::public.firm_role[]
    )
  )
  with check (
    bucket_id = 'case-documents'
    and name ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
    and public.can_access_case(
      ((storage.foldername(name))[1])::uuid,
      ((storage.foldername(name))[2])::uuid
    )
    and public.has_firm_role(
      ((storage.foldername(name))[1])::uuid,
      array['admin', 'lawyer', 'paralegal']::public.firm_role[]
    )
  );
