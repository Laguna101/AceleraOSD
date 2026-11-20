-- Aggregate metrics from the CRM's actual tenant tables.
-- Buyer budget is not booked revenue; this endpoint does not infer revenue.
create index if not exists crm_leads_organization_created_at_idx
  on public.crm_leads (organization_id, created_at);

create index if not exists crm_leads_organization_status_closed_at_idx
  on public.crm_leads (organization_id, status, closed_at)
  where status = 'won';

create index if not exists calendar_appointments_organization_created_at_idx
  on public.calendar_appointments (organization_id, created_at);

create or replace function public.fn_aceleraos_activity_metrics(
  p_org uuid,
  p_from timestamptz,
  p_to timestamptz
)
returns jsonb
language sql
stable
security invoker
set search_path = public
as $$
  with eligible_org as (
    select p_org as id
    where p_org in (select public.fn_user_org_ids())
  ),
  buckets as (
    select
      i,
      p_from + make_interval(secs => extract(epoch from (p_to - p_from)) * i / 6) as bucket_from,
      p_from + make_interval(secs => extract(epoch from (p_to - p_from)) * (i + 1) / 6) as bucket_to
    from generate_series(0, 5) as series(i)
  ),
  lead_buckets as (
    select
      b.i,
      b.bucket_from,
      b.bucket_to,
      count(l.id)::integer as count,
      count(l.id) filter (where s.agent_stage_hint = 'qualified')::integer as qualified_count
    from buckets b
    left join eligible_org o on true
    left join public.crm_leads l
      on l.organization_id = o.id
      and l.created_at >= b.bucket_from
      and l.created_at < b.bucket_to
    left join public.crm_stages s
      on s.id = l.stage_id
      and s.organization_id = l.organization_id
    group by b.i, b.bucket_from, b.bucket_to
  ),
  appointment_buckets as (
    select
      b.i,
      b.bucket_from,
      b.bucket_to,
      count(a.id)::integer as count
    from buckets b
    left join eligible_org o on true
    left join public.calendar_appointments a
      on a.organization_id = o.id
      and a.created_at >= b.bucket_from
      and a.created_at < b.bucket_to
      and a.status <> 'cancelled'
    group by b.i, b.bucket_from, b.bucket_to
  ),
  won_buckets as (
    select
      b.i,
      b.bucket_from,
      b.bucket_to,
      count(l.id)::integer as count
    from buckets b
    left join eligible_org o on true
    left join public.crm_leads l
      on l.organization_id = o.id
      and l.status = 'won'
      and l.closed_at >= b.bucket_from
      and l.closed_at < b.bucket_to
    group by b.i, b.bucket_from, b.bucket_to
  ),
  lead_totals as (
    select
      count(l.id)::integer as total,
      count(l.id) filter (where s.agent_stage_hint = 'qualified')::integer as qualified
    from eligible_org o
    join public.crm_leads l
      on l.organization_id = o.id
      and l.created_at >= p_from
      and l.created_at < p_to
    left join public.crm_stages s
      on s.id = l.stage_id
      and s.organization_id = l.organization_id
  ),
  appointment_total as (
    select count(a.id)::integer as total
    from eligible_org o
    join public.calendar_appointments a
      on a.organization_id = o.id
      and a.created_at >= p_from
      and a.created_at < p_to
      and a.status <> 'cancelled'
  ),
  won_total as (
    select count(l.id)::integer as total
    from eligible_org o
    join public.crm_leads l
      on l.organization_id = o.id
      and l.status = 'won'
      and l.closed_at >= p_from
      and l.closed_at < p_to
  ),
  stage_totals as (
    select coalesce(
      jsonb_agg(jsonb_build_object('stage', coalesce(grouped.stage, 'sem_etapa'), 'count', grouped.count)
        order by grouped.count desc, grouped.stage),
      '[]'::jsonb
    ) as items
    from (
      select coalesce(s.name, 'sem_etapa') as stage, count(*)::integer as count
      from eligible_org o
      join public.crm_leads l
        on l.organization_id = o.id
        and l.created_at >= p_from
        and l.created_at < p_to
      left join public.crm_stages s
        on s.id = l.stage_id
        and s.organization_id = l.organization_id
      group by s.name
    ) grouped
  )
  select jsonb_build_object(
    'window', jsonb_build_object('from', p_from, 'to', p_to),
    'leads', jsonb_build_object(
      'total', lead_totals.total,
      'qualified', lead_totals.qualified,
      'by_stage', stage_totals.items,
      'buckets', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'from', bucket_from,
          'to', bucket_to,
          'count', count,
          'qualified_count', qualified_count
        ) order by i), '[]'::jsonb)
        from lead_buckets
      )
    ),
    'appointments', jsonb_build_object(
      'total', appointment_total.total,
      'buckets', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'from', bucket_from,
          'to', bucket_to,
          'count', count
        ) order by i), '[]'::jsonb)
        from appointment_buckets
      )
    ),
    'won', jsonb_build_object(
      'total', won_total.total,
      'buckets', (
        select coalesce(jsonb_agg(jsonb_build_object(
          'from', bucket_from,
          'to', bucket_to,
          'count', count
        ) order by i), '[]'::jsonb)
        from won_buckets
      )
    )
  )
  from lead_totals, appointment_total, won_total, stage_totals;
$$;

revoke all on function public.fn_aceleraos_activity_metrics(uuid, timestamptz, timestamptz)
  from public, anon;
grant execute on function public.fn_aceleraos_activity_metrics(uuid, timestamptz, timestamptz)
  to authenticated, service_role;

comment on function public.fn_aceleraos_activity_metrics(uuid, timestamptz, timestamptz) is
  'Returns tenant-scoped lead, qualification, non-cancelled appointment and won-deal counts for AceleraOS. Does not infer revenue.';

notify pgrst, 'reload schema';
