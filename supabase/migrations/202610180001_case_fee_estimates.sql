begin;

-- One manually confirmed estimate per case and currency. Money uses exact cents.
create table public.case_fee_estimates (
  id uuid primary key default gen_random_uuid(),
  firm_id uuid not null references public.firms(id),
  case_id uuid not null,
  currency text not null check (currency in ('ARS', 'USD')),
  amount_cents bigint not null check (amount_cents between 0 and 999999999999),
  revision integer not null default 1 check (revision > 0),
  created_by uuid not null references public.profiles(id),
  updated_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (case_id, firm_id) references public.cases(id, firm_id) on delete cascade,
  unique (case_id, currency)
);
create index case_fee_estimates_firm_idx on public.case_fee_estimates(firm_id, case_id);
alter table public.case_fee_estimates enable row level security;
alter table public.case_fee_estimates force row level security;
create policy "case users can read fee estimates" on public.case_fee_estimates
  for select to authenticated using (public.can_access_case(firm_id, case_id));
-- Writes only through the audited RPC; no direct insert/update/delete privileges.
revoke all on public.case_fee_estimates from public, anon, authenticated;
grant select on public.case_fee_estimates to authenticated;

create function public.set_case_fee_estimate(
  p_case_id uuid, p_currency text, p_amount_cents bigint, p_expected_revision integer
) returns void
language plpgsql security definer set search_path = public
as $$
declare
  v_firm_id uuid;
  v_id uuid;
  v_revision integer;
begin
  -- Serialize with case archival/deletion and concurrent estimate creation.
  select firm_id into v_firm_id from public.cases
    where id = p_case_id and status = 'open' for update;
  if v_firm_id is null or not public.can_access_case(v_firm_id, p_case_id)
    or not public.has_firm_role(v_firm_id, array['admin', 'lawyer']::public.firm_role[])
  then raise exception 'Not authorized' using errcode = '42501'; end if;
  if p_currency is null or p_currency not in ('ARS', 'USD')
    or p_amount_cents is null or p_amount_cents not between 0 and 999999999999
    or p_expected_revision is null or p_expected_revision < 0
  then raise exception 'Invalid estimate' using errcode = '22023'; end if;

  select id, revision into v_id, v_revision from public.case_fee_estimates
    where case_id = p_case_id and currency = p_currency for update;
  if coalesce(v_revision, 0) <> p_expected_revision then
    raise exception 'Estimate changed' using errcode = '40001';
  end if;
  if v_id is null then
    insert into public.case_fee_estimates(firm_id, case_id, currency, amount_cents, created_by, updated_by)
      values(v_firm_id, p_case_id, p_currency, p_amount_cents, auth.uid(), auth.uid())
      returning id into v_id;
  else
    update public.case_fee_estimates set amount_cents = p_amount_cents,
      revision = revision + 1, updated_by = auth.uid(), updated_at = now() where id = v_id;
  end if;
  insert into public.audit_log(firm_id, actor_profile_id, action, target_table, target_id)
    values(v_firm_id, auth.uid(), 'fee_estimate.saved', 'case_fee_estimates', v_id);
end;
$$;
revoke all on function public.set_case_fee_estimate(uuid, text, bigint, integer) from public, anon;
grant execute on function public.set_case_fee_estimate(uuid, text, bigint, integer) to authenticated;
commit;
