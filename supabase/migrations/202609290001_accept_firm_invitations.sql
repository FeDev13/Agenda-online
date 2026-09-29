create or replace function public.accept_pending_firm_invitations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_membership record;
  v_accepted_count integer := 0;
begin
  if auth.uid() is null then
    raise exception 'not authenticated' using errcode = '42501';
  end if;

  for v_membership in
    update public.firm_memberships
    set status = 'active',
        accepted_at = coalesce(accepted_at, now())
    where profile_id = auth.uid()
      and status = 'invited'
    returning id, firm_id
  loop
    v_accepted_count := v_accepted_count + 1;

    insert into public.audit_log (
      firm_id,
      actor_profile_id,
      action,
      target_table,
      target_id
    )
    values (
      v_membership.firm_id,
      auth.uid(),
      'membership.accepted',
      'firm_memberships',
      v_membership.id
    );
  end loop;

  return v_accepted_count;
end;
$$;

revoke all on function public.accept_pending_firm_invitations() from public;
grant execute on function public.accept_pending_firm_invitations() to authenticated;
