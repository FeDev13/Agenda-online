alter table public.events
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.profiles (id) on delete set null;

alter table public.case_deadlines
  add column if not exists hidden_at timestamptz,
  add column if not exists hidden_by uuid references public.profiles (id) on delete set null;

create index if not exists events_firm_visible_starts_idx
  on public.events (firm_id, starts_at)
  where hidden_at is null;

create index if not exists case_deadlines_firm_visible_due_idx
  on public.case_deadlines (firm_id, due_on)
  where hidden_at is null;

create or replace function public.hide_schedule_item(
  p_item_kind text,
  p_item_id uuid
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_case_id uuid;
  v_firm_id uuid;
  v_target_table text;
  v_action text;
begin
  if p_item_kind = 'event' then
    select firm_id, case_id
    into v_firm_id, v_case_id
    from public.events
    where id = p_item_id
      and hidden_at is null;

    v_target_table := 'events';
    v_action := 'event.hidden';
  elsif p_item_kind = 'deadline' then
    select firm_id, case_id
    into v_firm_id, v_case_id
    from public.case_deadlines
    where id = p_item_id
      and hidden_at is null;

    v_target_table := 'case_deadlines';
    v_action := 'deadline.hidden';
  else
    raise exception 'invalid schedule item kind' using errcode = '22023';
  end if;

  if v_firm_id is null
    or not public.can_access_case(v_firm_id, v_case_id)
    or not public.has_firm_role(v_firm_id, array['admin', 'lawyer', 'paralegal']::public.firm_role[])
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if p_item_kind = 'event' then
    update public.events
    set hidden_at = now(),
        hidden_by = auth.uid()
    where id = p_item_id
      and firm_id = v_firm_id
      and hidden_at is null;
  else
    update public.case_deadlines
    set hidden_at = now(),
        hidden_by = auth.uid()
    where id = p_item_id
      and firm_id = v_firm_id
      and hidden_at is null;
  end if;

  insert into public.audit_log (
    firm_id,
    actor_profile_id,
    action,
    target_table,
    target_id
  )
  values (v_firm_id, auth.uid(), v_action, v_target_table, p_item_id);
end;
$$;

revoke all on function public.hide_schedule_item(text, uuid) from public;
grant execute on function public.hide_schedule_item(text, uuid) to authenticated;
