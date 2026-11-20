-- Close unauthenticated access introduced by the initial compatibility migration.
alter table public.platform_branding enable row level security;
revoke all on public.platform_branding from anon, authenticated;
