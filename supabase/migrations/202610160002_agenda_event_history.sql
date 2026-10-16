-- Include past events in a browsable history while retaining RLS and pagination.
create or replace function public.list_agenda(
  p_firm_id uuid,
  p_scope text default 'upcoming',
  p_kind text default 'all',
  p_from date default null,
  p_to date default null,
  p_page integer default 1
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_today date;
  v_result jsonb;
begin
  if not public.is_active_firm_member(p_firm_id) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if p_scope is null or p_scope not in ('upcoming', 'overdue', 'review', 'resolved', 'all')
    or p_kind is null or p_kind not in ('all', 'event', 'deadline', 'task')
    or p_page is null or p_page < 1 or p_page > 100000
    or (p_from is not null and p_to is not null and p_from > p_to)
  then
    raise exception 'invalid agenda filters' using errcode = '22023';
  end if;

  select (now() at time zone default_timezone)::date into v_today
  from public.firms where id = p_firm_id;

  with entries as (
    select e.id, e.firm_id, e.case_id, e.title, 'event'::text as kind,
      (e.starts_at at time zone f.default_timezone)::date as date_key,
      e.starts_at, e.timezone, e.location as subtitle,
      'pending'::text as status, 0 as status_revision, e.hidden_at,
      null::timestamptz as status_changed_at
    from public.events e join public.firms f on f.id = e.firm_id
    where e.firm_id = p_firm_id
    union all
    select d.id, d.firm_id, d.case_id, d.title, 'deadline', d.due_on,
      null, null, d.rule_source, d.status, d.status_revision, d.hidden_at, d.status_changed_at
    from public.case_deadlines d where d.firm_id = p_firm_id
    union all
    select t.id, t.firm_id, t.case_id, t.title, 'task', t.due_on,
      null, null, 'Tarea', t.status::text, 0, null, null
    from public.tasks t where t.firm_id = p_firm_id and t.due_on is not null
  ), filtered as (
    select e.id, e.case_id, c.title as case_title, e.title, e.kind, e.date_key,
      e.starts_at, e.timezone, e.subtitle, e.status, e.status_revision, e.status_changed_at
    from entries e join public.cases c on c.id = e.case_id and c.firm_id = e.firm_id
    where (p_kind = 'all' or e.kind = p_kind)
      and (p_from is null or e.date_key >= p_from)
      and (p_to is null or e.date_key <= p_to)
      and (
        (p_scope = 'all')
        or (p_scope = 'upcoming' and e.hidden_at is null and (
          (e.kind = 'event' and e.starts_at >= now())
          or (e.kind <> 'event' and e.status in ('pending', 'open') and e.date_key >= v_today)))
        or (p_scope = 'overdue' and e.kind <> 'event'
          and e.status in ('pending', 'open') and e.date_key < v_today)
        or (p_scope = 'review' and e.kind = 'deadline' and e.status = 'needs_review')
        or (p_scope = 'resolved' and e.kind <> 'event' and e.status in ('completed', 'cancelled'))
      )
  ), page as (
    select * from filtered
    order by date_key, starts_at nulls first, kind, id
    limit 25 offset ((p_page::bigint - 1) * 25)
  )
  select jsonb_build_object(
    'timezone', (select default_timezone from public.firms where id = p_firm_id),
    'today', v_today,
    'total', (select count(*) from filtered),
    'entries', coalesce((select jsonb_agg(to_jsonb(p) order by date_key, starts_at nulls first, kind, id) from page p), '[]'::jsonb)
  ) into v_result;
  return v_result;
end;
$$;
revoke all on function public.list_agenda(uuid, text, text, date, date, integer) from public, anon;
grant execute on function public.list_agenda(uuid, text, text, date, date, integer) to authenticated;

commit;
