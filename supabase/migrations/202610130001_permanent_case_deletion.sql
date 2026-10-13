create or replace function public.delete_case_permanently(
  p_case_id uuid,
  p_confirmation text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case_number text;
  v_firm_id uuid;
  v_status public.case_status;
  v_counts jsonb;
begin
  select firm_id, case_number, status
    into v_firm_id, v_case_number, v_status
  from public.cases
  where id = p_case_id;

  if v_firm_id is null
    or not public.has_firm_role(v_firm_id, array['admin']::public.firm_role[])
  then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if v_status <> 'archived' then
    raise exception 'case must be archived before permanent deletion'
      using errcode = '23514';
  end if;

  if trim(coalesce(p_confirmation, '')) <> v_case_number then
    raise exception 'confirmation does not match case number'
      using errcode = '22023';
  end if;

  select jsonb_build_object(
    'case_number', v_case_number,
    'case_members', (select count(*) from public.case_members where case_id = p_case_id),
    'events', (select count(*) from public.events where case_id = p_case_id),
    'deadlines', (select count(*) from public.case_deadlines where case_id = p_case_id),
    'tasks', (select count(*) from public.tasks where case_id = p_case_id),
    'reminders', (select count(*) from public.reminders where case_id = p_case_id),
    'notes', (select count(*) from public.notes where case_id = p_case_id),
    'documents', (select count(*) from public.documents where case_id = p_case_id),
    'notification_deliveries', (
      select count(*) from public.notification_deliveries where case_id = p_case_id
    )
  ) into v_counts;

  insert into public.audit_log (
    firm_id,
    actor_profile_id,
    action,
    target_table,
    target_id,
    metadata
  )
  values (
    v_firm_id,
    auth.uid(),
    'case.deleted_permanently',
    'cases',
    p_case_id,
    v_counts
  );

  delete from public.notification_deliveries
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.reminders
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.documents
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.notes
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.case_members
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.events
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.case_deadlines
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.tasks
  where firm_id = v_firm_id
    and case_id = p_case_id;

  delete from public.cases
  where firm_id = v_firm_id
    and id = p_case_id
    and status = 'archived';
end;
$$;

revoke all on function public.delete_case_permanently(uuid, text) from public;
grant execute on function public.delete_case_permanently(uuid, text) to authenticated;
