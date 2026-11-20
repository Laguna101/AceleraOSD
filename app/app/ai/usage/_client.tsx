"use client";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAiUsage, type AiUsageFilters } from "@/hooks/ai/useAiUsage";
import { UsageFilters, type UsageFiltersAgent } from "@/components/ai/UsageFilters";
import { UsageChart } from "@/components/ai/UsageChart";
import { formatCentsUSD } from "@/lib/money";
import { useT } from "@/hooks/i18n/useT";
import { Button } from "@/components/ui/button";

interface Props {
  agents: UsageFiltersAgent[];
  initial: {
    agent_id?: string;
    invocation_kind?: string;
    from?: string;
    to?: string;
  };
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="acelera-ai-usage-stat">
      <p className="acelera-ai-usage-stat-label">{label}</p>
      <p className="acelera-ai-usage-stat-value">{value}</p>
      {hint && <p className="acelera-ai-usage-stat-hint">{hint}</p>}
    </Card>
  );
}

function StatSkeletons() {
  return (
    <div className="acelera-ai-usage-stat-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="acelera-ai-usage-stat">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-2 h-8 w-32" />
        </Card>
      ))}
    </div>
  );
}

function ChartSkeletons() {
  return (
    <div className="acelera-ai-usage-skeleton-grid">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="acelera-ai-usage-chart-skeleton">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-4 h-[200px] w-full" />
        </div>
      ))}
    </div>
  );
}

export function UsageDashboardClient({ agents, initial }: Props) {
  const t = useT();
  const searchParams = useSearchParams();

  const filters: AiUsageFilters = {
    agent_id: searchParams.get("agent_id") ?? undefined,
    invocation_kind: searchParams.get("invocation_kind") ?? undefined,
    from: searchParams.get("from") ?? undefined,
    to: searchParams.get("to") ?? undefined,
  };

  const q = useAiUsage(filters);

  return (
    <div className="acelera-ai-usage-dashboard">
      <section className="acelera-ai-usage-filter-section" aria-labelledby="ai-usage-filter-heading">
        <header className="acelera-ai-usage-section-heading">
          <div>
            <h2 id="ai-usage-filter-heading">{t("Explorar atividade")}</h2>
            <p>{t("Escolha os agentes, tipos de uso e datas deste relatório.")}</p>
          </div>
        </header>
        <UsageFilters agents={agents} initial={initial} />
      </section>

      {q.isLoading ? (
        <>
          <StatSkeletons />
          <ChartSkeletons />
        </>
      ) : q.isError || !q.data ? (
        <div className="acelera-feedback" role="alert">
          <h2>{t("Não foi possível carregar o uso de IA")}</h2>
          <p>{t("Confira a conexão e tente novamente.")}</p>
          <Button variant="outline" onClick={() => void q.refetch()}>
            {t("Tentar novamente")}
          </Button>
        </div>
      ) : (
        <>
          <section className="acelera-ai-usage-summary" aria-labelledby="ai-usage-summary-heading">
            <header className="acelera-ai-usage-section-heading">
              <div>
                <h2 id="ai-usage-summary-heading">{t("Resumo do período")}</h2>
                <p>{t("Custo, atendimentos, transferências e tempo de resposta.")}</p>
              </div>
            </header>
            <div className="acelera-ai-usage-stat-grid">
            <StatCard
              label={t("Custo no período")}
              // DÓLAR: esta tela mostrava o MESMO número em duas moedas — o card de
              // orçamento logo acima em US$ e este StatCard em R$, dois centímetros abaixo.
              value={formatCentsUSD(q.data.totals.cost_cents)}
            />
            <StatCard
              label={t("Atendimentos com IA")}
              value={q.data.totals.invocations.toLocaleString("pt-BR")}
            />
            <StatCard
              label={t("Passaram para uma pessoa")}
              value={`${(q.data.totals.handoff_rate * 100).toFixed(2)}%`}
              hint={t("quanto mais alto, mais a IA precisou de ajuda")}
            />
            {/*
              "p95" quer dizer: em 95 das 100 respostas o tempo foi ATÉ isso.
              É a medida honesta para tempo de resposta (a média esconde os
              casos ruins), mas o rótulo não pode ser a sigla — quem lê a tela
              precisa saber o que fazer com o número, não decorar estatística.
            */}
            <StatCard
              label={t("Tempo de resposta")}
              value={`${(q.data.totals.p95_latency_ms / 1000).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })} s`}
              hint={`${t("a maioria responde em")} ${(
                q.data.totals.p50_latency_ms / 1000
              ).toLocaleString("pt-BR", {
                maximumFractionDigits: 1,
              })} s; ${t("este é o pior caso comum")}`}
            />
            </div>
          </section>

          <UsageChart payload={q.data} />
        </>
      )}
    </div>
  );
}
