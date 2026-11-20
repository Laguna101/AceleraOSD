"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

export interface TrendBucket {
  from: string;
  to: string;
  count: number;
  qualified_count?: number;
}

export interface CommercialActivityMetrics {
  window: { from: string; to: string };
  leads: {
    total: number;
    qualified: number;
    by_stage: { stage: string; count: number }[];
    buckets: (TrendBucket & { qualified_count: number })[];
  };
  appointments: {
    total: number;
    buckets: TrendBucket[];
  };
  won?: {
    total: number;
    buckets: TrendBucket[];
  };
}

export function useCommercialActivityMetrics(days: 30 | 90 | 180) {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);
  const params = new URLSearchParams({ from: from.toISOString(), to: to.toISOString() });

  return useQuery({
    queryKey: ["metrics", "commercial-activity", days],
    queryFn: async () =>
      apiClient.get<{ data: CommercialActivityMetrics }>(
        `/api/v1/metrics/overview?${params.toString()}`,
      ),
    staleTime: 30_000,
  });
}
