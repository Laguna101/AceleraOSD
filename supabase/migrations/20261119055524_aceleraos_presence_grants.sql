-- Supabase's default public-schema grants include table access for anon.
-- Keep access behind authenticated RLS policies only.
revoke all on table public.attendant_availability from public, anon;
grant select, insert, update, delete on table public.attendant_availability
  to authenticated, service_role;

notify pgrst, 'reload schema';
