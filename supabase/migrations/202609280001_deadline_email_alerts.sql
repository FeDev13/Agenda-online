create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms (id) on delete restrict,
  recipient_profile_id uuid not null references public.profiles (id) on delete restrict,
  recipient_email text not null check (char_length(trim(recipient_email)) > 0),
  schedule_item_kind text not null check (schedule_item_kind in ('deadline', 'task')),
  schedule_item_id uuid not null,
  case_id uuid not null,
  alert_window text not null check (
    alert_window in ('seven_day', 'forty_eight_hour', 'twenty_four_hour')
  ),
  channel public.reminder_channel not null default 'email',
  provider text not null default 'resend' check (provider in ('resend')),
  provider_message_id text,
  status text not null default 'pending' check (
    status in ('pending', 'sent', 'failed', 'skipped')
  ),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (firm_id, case_id) references public.cases (firm_id, id) on delete restrict,
  unique (
    recipient_profile_id,
    schedule_item_kind,
    schedule_item_id,
    alert_window,
    channel
  )
);

create index notification_deliveries_firm_created_idx
  on public.notification_deliveries (firm_id, created_at desc);

create index notification_deliveries_status_idx
  on public.notification_deliveries (status, created_at);

create trigger set_notification_deliveries_updated_at before update
  on public.notification_deliveries
  for each row execute function public.set_updated_at();

alter table public.notification_deliveries enable row level security;
alter table public.notification_deliveries force row level security;

grant select, insert, update on public.notification_deliveries to service_role;
