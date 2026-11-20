-- A revoked membership must not be restored by the legacy profile record.
create or replace function public.fn_user_org_ids()
returns setof uuid language sql stable security definer set search_path = public as $$
  select organization_id from public.user_organizations
  where user_id = auth.uid() and revoked_at is null;
$$;
