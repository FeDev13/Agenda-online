begin;

alter table public.cases add column last_activity_at timestamptz;

-- Preserve case edit/archive timestamps while backfilling historical activity.
alter table public.cases disable trigger set_cases_updated_at;
update public.cases c
set last_activity_at = greatest(c.updated_at, (
  select max(activity.updated_at)
  from (
    select updated_at from public.tasks where case_id = c.id and firm_id = c.firm_id
    union all
    select updated_at from public.case_deadlines where case_id = c.id and firm_id = c.firm_id
    union all
    select updated_at from public.events where case_id = c.id and firm_id = c.firm_id
    union all
    select updated_at from public.notes where case_id = c.id and firm_id = c.firm_id
    union all
    select updated_at from public.documents where case_id = c.id and firm_id = c.firm_id
    union all
    select updated_at from public.case_fee_estimates where case_id = c.id and firm_id = c.firm_id
  ) activity
));
alter table public.cases enable trigger set_cases_updated_at;
alter table public.cases alter column last_activity_at set default now();
alter table public.cases alter column last_activity_at set not null;

create function public.set_case_activity_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.last_activity_at = greatest(old.last_activity_at, clock_timestamp());
  return new;
end;
$$;
create trigger set_case_activity_at before update on public.cases
for each row execute function public.set_case_activity_at();

-- Only invoked after a child write has passed its existing authorization boundary.
-- Definer rights let assigned paralegals touch metadata without granting case edits.
create function public.touch_parent_case_activity() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.cases
  set last_activity_at = greatest(last_activity_at, clock_timestamp())
  where id = new.case_id and firm_id = new.firm_id and status = 'open';
  return new;
end;
$$;
revoke all on function public.set_case_activity_at() from public, anon, authenticated;
revoke all on function public.touch_parent_case_activity() from public, anon, authenticated;

create trigger touch_case_activity after insert or update on public.tasks
for each row execute function public.touch_parent_case_activity();
create trigger touch_case_activity after insert or update on public.case_deadlines
for each row execute function public.touch_parent_case_activity();
create trigger touch_case_activity after insert or update on public.events
for each row execute function public.touch_parent_case_activity();
create trigger touch_case_activity after insert or update on public.notes
for each row execute function public.touch_parent_case_activity();
create trigger touch_case_activity after insert or update on public.documents
for each row execute function public.touch_parent_case_activity();
create trigger touch_case_activity after insert or update on public.case_fee_estimates
for each row execute function public.touch_parent_case_activity();

create index cases_open_activity_idx on public.cases (firm_id, last_activity_at desc, id)
where status = 'open';

commit;
