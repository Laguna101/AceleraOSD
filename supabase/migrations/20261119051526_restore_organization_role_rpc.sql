-- The CRM Imobiliario compatibility schema had the newer app's generated
-- function type, but not this RPC. requireRole() uses it to fail closed, and
-- several RLS policies use the same helper. Restore the canonical role lookup
-- while respecting revoked memberships and the support-session context.
create or replace function public.fn_user_role_in_org(p_org uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when s->>'status' = 'active'
      and (s->>'organization_id')::uuid = p_org
    then case when s->>'access_mode' = 'full' then 'admin' else 'viewer' end
    else (
      select uo.role
      from public.user_organizations uo
      where uo.user_id = auth.uid()
        and uo.organization_id = p_org
        and uo.revoked_at is null
      limit 1
    )
  end
  from (select public.fn_support_context() as s) context;
$$;

revoke all on function public.fn_user_role_in_org(uuid) from public, anon;
grant execute on function public.fn_user_role_in_org(uuid) to authenticated, service_role;

notify pgrst, 'reload schema';
