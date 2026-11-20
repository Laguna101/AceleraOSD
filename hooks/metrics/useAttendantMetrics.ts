"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface FunnelStage {
  stage_id: string;
  stage_name: string;
  position: number;
  count: number;
}

export interface AttendantMetric {
  user_id: string;
  won: number;
  lost: number;
  conversations_handled: number;
  avg_first_response_seconds: number | null;
  name: string | null;
  email: string | null;
}

export interface AttendantMetrics {
  window: { from: string; to: string };
  owner_user_id: string | null;
  funnel: FunnelStage[];
  attendants: AttendantMetric[];
  sales_trend: {
    currency: string | null;
    total_revenue_cents: number | null;
    buckets: { from: string; to: string; count: number; revenue_cents: number | null }[];
  };
}

/** spec 13 §6 — funil + performance por atendente. `owner` filtra (manager+). */
export function useAttendantMetrics(owner: string | null, days: 30 | 90 | 180) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });
  if (owner) params.set("owner_user_id", owner);
  return useQuery({
    queryKey: ["metrics", "attendants", owner ?? "all", days],
    queryFn: async () =>
      apiClient.get<{ data: AttendantMetrics }>(`/api/v1/metrics/attendants?${params.toString()}`),
    staleTime: 30_000,
  });
}
