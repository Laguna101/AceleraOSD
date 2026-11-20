-- Restore the team availability surface used by the shell and routing UI.
-- Additive compatibility for the CRM Imobiliario Supabase project.

create or replace function public.fn_role_at_least(p_org uuid, p_min text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with levels(role, lvl) as (
    values ('viewer', 1), ('agent', 2), ('manager', 3), ('admin', 4)
  )
  select coalesce(
    (
      select user_level.lvl >= min_level.lvl
      from levels user_level
      join levels min_level on min_level.role = p_min
      where user_level.role = public.fn_user_role_in_org(p_org)
    ),
    false
  );
$$;

revoke all on function public.fn_role_at_least(uuid, text) from public, anon;
grant execute on function public.fn_role_at_least(uuid, text) to authenticated, service_role;

create table if not exists public.attendant_availability (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  is_available boolean not null default false,
  capacity integer not null default 5 check (capacity > 0),
  schedule jsonb not null default '{}',
  last_heartbeat_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create index if not exists idx_attendant_availability_available
  on public.attendant_availability (organization_id)
  where is_available;

alter table public.attendant_availability enable row level security;

drop policy if exists attendant_availability_select on public.attendant_availability;
create policy attendant_availability_select on public.attendant_availability
  as permissive for select to authenticated
  using (
    organization_id in (select public.fn_user_org_ids())
    or public.fn_is_platform_admin()
  );

drop policy if exists attendant_availability_insert on public.attendant_availability;
create policy attendant_availability_insert on public.attendant_availability
  for insert to authenticated
  with check (
    organization_id in (select public.fn_user_org_ids())
    and (
      user_id = auth.uid()
      or public.fn_role_at_least(organization_id, 'manager')
    )
  );

drop policy if exists attendant_availability_update on public.attendant_availability;
create policy attendant_availability_update on public.attendant_availability
  for update to authenticated
  using (
    organization_id in (select public.fn_user_org_ids())
    and (
      user_id = auth.uid()
      or public.fn_role_at_least(organization_id, 'manager')
    )
  )
  with check (
    organization_id in (select public.fn_user_org_ids())
    and (
      user_id = auth.uid()
      or public.fn_role_at_least(organization_id, 'manager')
    )
  );

drop policy if exists attendant_availability_delete on public.attendant_availability;
create policy attendant_availability_delete on public.attendant_availability
  for delete to authenticated
  using (
    organization_id in (select public.fn_user_org_ids())
    and (
      user_id = auth.uid()
      or public.fn_role_at_least(organization_id, 'manager')
    )
  );

-- Do not let a readonly support session inherit access through membership or
-- platform administration. Full support access remains governed by the regular
-- tenant policies and its audited session context.
create policy attendant_availability_support_readonly_fence
  on public.attendant_availability
  as restrictive for all to authenticated
  using (
    not coalesce(
      public.fn_support_context()->>'status' = 'active'
      and public.fn_support_context()->>'access_mode' = 'support_readonly',
      false
    )
  )
  with check (
    not coalesce(
      public.fn_support_context()->>'status' = 'active'
      and public.fn_support_context()->>'access_mode' = 'support_readonly',
      false
    )
  );

comment on table public.attendant_availability is
  'Tenant-scoped availability and work schedule for CRM attendants.';

notify pgrst, 'reload schema';
