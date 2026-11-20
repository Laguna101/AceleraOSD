"use client";

import { useT } from "@/hooks/i18n/useT";
import { useTagDeIdioma } from "@/hooks/i18n/useLocaleDeData";
import { useEffect, useRef, useState } from "react";
import { BadgeCheck, CalendarCheck2, Trophy, UsersRound } from "lucide-react";

import {
  useCommercialActivityMetrics,
  type TrendBucket,
} from "@/hooks/metrics/useCommercialActivityMetrics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAttendantMetrics, type AttendantMetric } from "@/hooks/metrics/useAttendantMetrics";
import { useTeamMembers } from "@/hooks/team/useTeamMembers";
import { AtritoPanel } from "./AtritoPanel";
import { larguraDoGrafico } from "@/lib/metrics/largura-do-grafico";

const ALL_ATTENDANTS = "__all__";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const roundedSeconds = Math.round(seconds);
  if (roundedSeconds < 60) return `${roundedSeconds}s`;
  const minutes = Math.floor(roundedSeconds / 60);
  const remainder = roundedSeconds % 60;
  return remainder === 0 ? `${minutes}min` : `${minutes}min ${remainder}s`;
}

function attendantLabel(metric: AttendantMetric, t: (text: string) => string): string {
  return metric.name ?? metric.email ?? `${t("Atendente")} ${metric.user_id.slice(0, 8)}`;
}

const PERIODOS: Array<{ dias: 30 | 90 | 180; rotulo: string }> = [
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
  { dias: 180, rotulo: "6 meses" },
];

function formatCount(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function MetricChange({ trend, title }: { trend: TrendBucket[]; title: string }) {
  const delta = trend.length > 1 ? trend.at(-1)!.count - trend[0]!.count : null;
  const direction = delta == null || delta === 0 ? "flat" : delta > 0 ? "up" : "down";
  const percent =
    trend.length > 1 && trend[0]!.count > 0
      ? `${delta! > 0 ? "+" : ""}${Math.round((delta! / trend[0]!.count) * 100)}%`
      : null;

  return percent ? (
    <span className={`acelera-metric-delta is-${direction}`} title={title}>
      {percent}
    </span>
  ) : null;
}

function ActivityTrendChart({
  series,
}: {
  series: Array<{ trend: TrendBucket[]; metric: "leads" | "appointments" | "won" }>;
}) {
  const t = useT();
  const locale = useTagDeIdioma();
  const chartViewportRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(760);
  useEffect(() => {
    const viewport = chartViewportRef.current;
    if (!viewport || typeof ResizeObserver === "undefined") return;
    const atualizarLargura = () => setWidth(larguraDoGrafico(viewport.clientWidth));
    atualizarLargura();
    const observer = new ResizeObserver(atualizarLargura);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  const height = 300;
  const left = 48;
  const right = 18;
  const top = 16;
  const bottom = 48;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(0, ...series.flatMap(({ trend }) => trend.map((point) => point.count)));
  const max = Math.max(5, Math.ceil(maxValue / 5) * 5);
  const valueTicks = Array.from({ length: 6 }, (_, index) => (max / 5) * index);
  const dataSeries = series.map(({ trend, metric }) => {
    const points = trend.map((point, index) => ({
      ...point,
      x: left + (trend.length === 1 ? plotWidth / 2 : (index / (trend.length - 1)) * plotWidth),
      y: top + plotHeight - (point.count / max) * plotHeight,
      label: new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short" })
        .format(new Date(point.from))
        .replace(".", ""),
    }));
    const line = points.reduce((path, point, index) => {
      if (index === 0) return "M" + point.x + "," + point.y;

      const previous = points[index - 1] ?? point;
      const beforePrevious = points[index - 2] ?? previous;
      const next = points[index + 1] ?? point;
      const control1X = previous.x + (point.x - beforePrevious.x) / 6;
      const control1Y = previous.y + (point.y - beforePrevious.y) / 6;
      const control2X = point.x - (next.x - previous.x) / 6;
      const control2Y = point.y - (next.y - previous.y) / 6;

      return (
        path +
        " C" +
        control1X +
        "," +
        control1Y +
        " " +
        control2X +
        "," +
        control2Y +
        " " +
        point.x +
        "," +
        point.y
      );
    }, "");
    const area =
      line +
      " L" +
      (points.at(-1)?.x ?? left + plotWidth) +
      "," +
      (top + plotHeight) +
      " L" +
      (points[0]?.x ?? left) +
      "," +
      (top + plotHeight) +
      " Z";
    return {
      metric,
      points,
      line,
      area,
      color:
        metric === "appointments"
          ? "var(--color-success)"
          : metric === "won"
            ? "var(--color-info)"
            : "var(--color-accent)",
      title:
        metric === "appointments"
          ? t("Visitas agendadas")
          : metric === "won"
            ? t("Negócios ganhos")
            : t("Leads captados"),
      hasActivity: trend.some((point) => point.count > 0),
    };
  });
  const axisPoints = dataSeries[0]?.points ?? [];
  const hasActivity = dataSeries.some((item) => item.hasActivity);
  const title = t("Tendência comercial");
  const description = dataSeries
    .map(
      (item) =>
        item.title +
        ": " +
        item.points.map((point) => point.label + " " + formatCount(point.count)).join(", "),
    )
    .join(". ");

  return (
    <div className="acelera-funnel-chart-wrap">
      <div
        ref={chartViewportRef}
        className="acelera-funnel-chart-scroll"
        role="region"
        aria-label={title}
        tabIndex={0}
      >
        <svg
          className="acelera-funnel-chart"
          viewBox={"0 0 " + width + " " + height}
          role="img"
          aria-label={title + ": " + description}
        >
          <defs>
            {dataSeries.map((item) => (
              <linearGradient
                key={item.metric}
                id={"acelera-activity-fill-" + item.metric}
                x1="0"
                x2="0"
                y1="0"
                y2="1"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity=".2" />
                <stop offset="100%" stopColor={item.color} stopOpacity=".01" />
              </linearGradient>
            ))}
          </defs>
          {valueTicks.map((tick, index) => {
            const y = top + plotHeight - (tick / max) * plotHeight;
            return (
              <g key={index} className="acelera-funnel-chart-grid">
                <line x1={left} x2={width - right} y1={y} y2={y} />
                <text x={left - 10} y={y + 4} textAnchor="end">
                  {formatCount(Math.round(tick))}
                </text>
              </g>
            );
          })}
          {dataSeries.map((item, seriesIndex) => (
            <g key={item.metric}>
              {item.metric === "leads" && (
                <path d={item.area} fill={"url(#acelera-activity-fill-" + item.metric + ")"} />
              )}
              <path
                d={item.line}
                className="acelera-funnel-chart-line"
                style={{ stroke: item.color }}
              />
              {item.points.map((point) => (
                <g key={point.from}>
                  <title>
                    {item.title + " · " + point.label + ": " + formatCount(point.count)}
                  </title>
                  <circle
                    className="acelera-funnel-chart-point"
                    cx={point.x}
                    cy={point.y}
                    r={point === item.points.at(-1) ? 5.5 : 4}
                    style={{ stroke: item.color }}
                  />
                </g>
              ))}
              {item.points.length > 0 &&
                (() => {
                  const latest = item.points[item.points.length - 1];
                  if (!latest) return null;
                  const label = formatCount(latest.count);
                  const labelWidth = Math.max(34, label.length * 8 + 14);
                  const labelX = Math.min(
                    width - right - labelWidth / 2,
                    Math.max(left + labelWidth / 2, latest.x),
                  );
                  const labelY = Math.max(top + 8, latest.y - 16 - seriesIndex * 18);

                  return (
                    <g
                      className="acelera-sales-chart-latest"
                      key="latest"
                      aria-label={t("Último intervalo: {valor}").replace("{valor}", label)}
                    >
                      {item.points.length > 1 && (
                        <line x1={latest.x} x2={latest.x} y1={latest.y + 7} y2={top + plotHeight} />
                      )}
                      <rect
                        x={labelX - labelWidth / 2}
                        y={labelY - 11}
                        width={labelWidth}
                        height={20}
                        rx={7}
                      />
                      <text x={labelX} y={labelY + 3} textAnchor="middle">
                        {label}
                      </text>
                    </g>
                  );
                })()}
            </g>
          ))}
          {axisPoints.map((point) => (
            <text
              key={point.from}
              className="acelera-funnel-chart-label"
              x={point.x}
              y={height - 18}
              textAnchor="middle"
            >
              {point.label}
            </text>
          ))}
        </svg>
      </div>
      <p className="acelera-chart-note">
        {hasActivity
          ? axisPoints.length > 1
            ? t("Compare leads captados e visitas agendadas em cada intervalo do período.")
            : t("Há apenas um intervalo disponível neste período.")
          : t("Ainda não há dados para essas métricas no período selecionado.")}
      </p>
    </div>
  );
}

export function MetricsClient({
  canCompare,
  currentUserId,
}: {
  canCompare: boolean;
  currentUserId: string;
}) {
  const t = useT();
  const [periodDays, setPeriodDays] = useState<30 | 90 | 180>(180);
  const [owner, setOwner] = useState(ALL_ATTENDANTS);
  const { data, isLoading, isError, refetch } = useCommercialActivityMetrics(periodDays);
  const selectedOwner = owner === ALL_ATTENDANTS ? null : owner;
  const attendantMetrics = useAttendantMetrics(selectedOwner, 30);
  const team = useTeamMembers({ enabled: canCompare });

  if (isLoading)
    return (
      <div className="acelera-feedback" role="status">
        {t("Carregando indicadores…")}
      </div>
    );
  if (isError || !data)
    return (
      <div className="acelera-feedback" role="alert">
        <h2>{t("Não foi possível carregar os indicadores")}</h2>
        <p>{t("Confira a conexão e tente novamente.")}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          {t("Tentar novamente")}
        </Button>
      </div>
    );

  const metrics = data.data;
  const hasWonMetrics = metrics.won != null;
  const qualifiedPercent =
    metrics.leads.total > 0
      ? Math.round((metrics.leads.qualified / metrics.leads.total) * 100)
      : null;
  const periodoLabel = PERIODOS.find((periodo) => periodo.dias === periodDays)?.rotulo ?? "6 meses";
  const maxStageCount = Math.max(1, ...metrics.leads.by_stage.map((stage) => stage.count));

  return (
    <div className="acelera-overview flex flex-col gap-6">
      <Tabs defaultValue="overview" className="acelera-metrics-tabs">
        <TabsList aria-label={t("Visões de desempenho")}>
          <TabsTrigger value="overview">{t("Visão geral")}</TabsTrigger>
          <TabsTrigger value="team">
            {canCompare ? t("Equipe e atrito") : t("Minha performance e atrito")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="acelera-metrics-tab-content">
          <div className="acelera-metrics-toolbar">
            <div
              className="acelera-period-filter"
              role="group"
              aria-label={t("Período dos indicadores")}
            >
              <span>{t("Período")}</span>
              <div>
                {PERIODOS.map((periodo) => (
                  <Button
                    key={periodo.dias}
                    type="button"
                    size="sm"
                    variant={periodDays === periodo.dias ? "default" : "ghost"}
                    aria-pressed={periodDays === periodo.dias}
                    onClick={() => setPeriodDays(periodo.dias)}
                  >
                    {t(periodo.rotulo)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="acelera-metrics-section-heading acelera-metrics-overview-heading">
            <div>
              <h2>{t("Panorama comercial")}</h2>
              <p>{t("Indicadores reais da operação no período selecionado")}</p>
            </div>
            <span>{t("Últimos {periodo}").replace("{periodo}", periodoLabel)}</span>
          </div>

          <div
            className={`acelera-overview-summary acelera-sales-overview${hasWonMetrics ? " acelera-sales-overview-four" : ""}`}
            aria-label={t("Resumo do período")}
          >
            <div>
              <div className="acelera-sales-overview-label">
                <span>{t("Leads captados")}</span>
                <i aria-hidden="true">
                  <UsersRound />
                </i>
              </div>
              <div className="acelera-sales-overview-value">
                <strong>{formatCount(metrics.leads.total)}</strong>
                <MetricChange
                  trend={metrics.leads.buckets}
                  title={t("Variação entre o primeiro e o último intervalo")}
                />
              </div>
              <small>{t("No período de {periodo}").replace("{periodo}", periodoLabel)}</small>
            </div>
            <div>
              <div className="acelera-sales-overview-label">
                <span>{t("Leads qualificados")}</span>
                <i aria-hidden="true">
                  <BadgeCheck />
                </i>
              </div>
              <div className="acelera-sales-overview-value">
                <strong>{formatCount(metrics.leads.qualified)}</strong>
                <MetricChange
                  trend={metrics.leads.buckets.map((bucket) => ({
                    ...bucket,
                    count: bucket.qualified_count,
                  }))}
                  title={t("Variação entre o primeiro e o último intervalo")}
                />
              </div>
              <small>{t("Entre os leads captados no período")}</small>
            </div>
            <div>
              <div className="acelera-sales-overview-label">
                <span>{t("Visitas agendadas")}</span>
                <i aria-hidden="true">
                  <CalendarCheck2 />
                </i>
              </div>
              <div className="acelera-sales-overview-value">
                <strong>{formatCount(metrics.appointments.total)}</strong>
                <MetricChange
                  trend={metrics.appointments.buckets}
                  title={t("Variação entre o primeiro e o último intervalo")}
                />
              </div>
              <small>{t("Agendamentos ativos criados no período")}</small>
            </div>
            {metrics.won ? (
              <div>
                <div className="acelera-sales-overview-label">
                  <span>{t("Negócios ganhos")}</span>
                  <i aria-hidden="true">
                    <Trophy />
                  </i>
                </div>
                <div className="acelera-sales-overview-value">
                  <strong>{formatCount(metrics.won.total)}</strong>
                  <MetricChange
                    trend={metrics.won.buckets}
                    title={t("Variação entre o primeiro e o último intervalo")}
                  />
                </div>
                <small>{t("Leads fechados como ganhos no período")}</small>
              </div>
            ) : null}
          </div>

          <div
            className="acelera-sales-trends-grid"
            role="group"
            aria-label={t("Tendências comerciais")}
          >
            <Card className="acelera-overview-section acelera-funnel-chart-card acelera-combined-trend-card acelera-performance-trend-card">
              <CardHeader className="acelera-sales-chart-header">
                <div>
                  <CardTitle className="text-base">{t("Tendência comercial")}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {t("Evolução ao longo do tempo · {periodo}").replace("{periodo}", periodoLabel)}
                  </p>
                </div>
                <div className="acelera-trend-legend" aria-label={t("Séries do gráfico")}>
                  <span>
                    <i className="acelera-trend-legend-dot" aria-hidden="true" />
                    {t("Leads captados")}
                  </span>
                  <span>
                    <i
                      className="acelera-trend-legend-dot acelera-trend-legend-appointments"
                      aria-hidden="true"
                    />
                    {t("Visitas agendadas")}
                  </span>
                  {metrics.won ? (
                    <span>
                      <i
                        className="acelera-trend-legend-dot acelera-trend-legend-won"
                        aria-hidden="true"
                      />
                      {t("Negócios ganhos")}
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <ActivityTrendChart
                  series={[
                    { trend: metrics.leads.buckets, metric: "leads" },
                    { trend: metrics.appointments.buckets, metric: "appointments" },
                    ...(metrics.won
                      ? [{ trend: metrics.won.buckets, metric: "won" as const }]
                      : []),
                  ]}
                />
              </CardContent>
            </Card>
          </div>

          <div className="acelera-overview-details">
            <Card className="acelera-overview-section">
              <CardHeader>
                <CardTitle className="text-base">{t("Leads por etapa")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("Etapa atual dos leads captados no período.")}
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {metrics.leads.by_stage.length === 0 ? (
                  <p className="acelera-empty-state">{t("Ainda não há leads neste período.")}</p>
                ) : (
                  metrics.leads.by_stage.map((stage) => (
                    <div key={stage.stage} className="acelera-funnel-stage">
                      <div className="acelera-funnel-stage-label">
                        <span>{t(stage.stage)}</span>
                        <strong>{formatCount(stage.count)}</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width]"
                          style={{ width: (stage.count / maxStageCount) * 100 + "%" }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="acelera-overview-section">
              <CardHeader>
                <CardTitle className="text-base">{t("Qualificação dos leads")}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {t("Leads captados no período que estão qualificados no momento.")}
                </p>
              </CardHeader>
              <CardContent className="acelera-qualification-summary">
                <strong>{qualifiedPercent === null ? "—" : qualifiedPercent + "%"}</strong>
                <span>
                  {formatCount(metrics.leads.qualified)} / {formatCount(metrics.leads.total)}{" "}
                  {t("leads captados")}
                </span>
              </CardContent>
            </Card>
          </div>

          <Card className="acelera-overview-section acelera-metrics-data-note acelera-performance-data-note">
            <CardHeader>
              <CardTitle className="text-base">{t("Receita de vendas")}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t(
                  hasWonMetrics
                    ? "O CRM registra negócios ganhos, exibidos acima como quantidade. Ainda não há valor de venda registrado para calcular receita; o orçamento informado pelo cliente não é usado como faturamento."
                    : "Ainda não há valor de venda nem quantidade de fechamentos disponível nesta conexão. Por isso, o painel não estima receita a partir do orçamento informado pelo cliente.",
                )}
              </p>
            </CardHeader>
          </Card>
        </TabsContent>
        <TabsContent value="team" className="acelera-metrics-tab-content">
          {canCompare ? (
            <div className="acelera-metrics-attendant-filter">
              <span>{t("Atendente")}</span>
              <Select value={owner} onValueChange={setOwner}>
                <SelectTrigger aria-label={t("Filtrar por atendente")}>
                  <SelectValue placeholder={t("Todos os atendentes")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_ATTENDANTS}>{t("Todos os atendentes")}</SelectItem>
                  {(team.data?.data ?? [])
                    .filter((member) => member.role !== "viewer")
                    .map((member) => (
                      <SelectItem key={member.user_id} value={member.user_id}>
                        {member.full_name ?? member.email ?? member.user_id.slice(0, 8)}
                        {member.user_id === currentUserId ? ` ${t("(você)")}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <AtritoPanel podeEditarRegua={canCompare} />

          <Card className="acelera-overview-section">
            <CardHeader>
              <CardTitle className="text-base">
                {canCompare
                  ? t("Funil e performance por atendente")
                  : t("Seu funil e sua performance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {attendantMetrics.isLoading ? (
                <p className="acelera-empty-state" role="status">
                  {t("Carregando métricas da equipe…")}
                </p>
              ) : attendantMetrics.isError || !attendantMetrics.data ? (
                <div className="acelera-feedback" role="alert">
                  <p>
                    {t(
                      "Não foi possível carregar as métricas da equipe. Confira a conexão e tente novamente.",
                    )}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void attendantMetrics.refetch()}
                  >
                    {t("Tentar novamente")}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <div>
                    <h3 className="mb-3 text-sm font-medium">
                      {t("Funil")} {selectedOwner ? t("do atendente") : ""}
                    </h3>
                    {attendantMetrics.data.data.funnel.length === 0 ? (
                      <p className="acelera-empty-state">{t("Nenhuma etapa configurada.")}</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {attendantMetrics.data.data.funnel.map((stage) => {
                          const max = Math.max(
                            1,
                            ...attendantMetrics.data.data.funnel.map((item) => item.count),
                          );
                          return (
                            <div key={stage.stage_id} className="flex items-center gap-3">
                              <span className="w-40 shrink-0 truncate text-sm">
                                {t(stage.stage_name)}
                              </span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                <div
                                  className="h-full rounded-full bg-primary transition-[width]"
                                  style={{ width: `${(stage.count / max) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 shrink-0 text-right text-sm tabular-nums">
                                {formatCount(stage.count)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="mb-3 text-sm font-medium">
                      {canCompare ? t("Performance por atendente") : t("Sua performance")}
                    </h3>
                    {attendantMetrics.data.data.attendants.length === 0 ? (
                      <p className="acelera-empty-state">
                        {t("Sem atividade no período (ganhos/perdidos, conversas ou respostas).")}
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t("Atendente")}</TableHead>
                              <TableHead className="text-right">{t("Ganhos")}</TableHead>
                              <TableHead className="text-right">{t("Perdidos")}</TableHead>
                              <TableHead className="text-right">{t("Conversas")}</TableHead>
                              <TableHead className="text-right">
                                {t("1ª resposta (média)")}
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendantMetrics.data.data.attendants.map((metric) => (
                              <TableRow key={metric.user_id}>
                                <TableCell className="font-medium">
                                  {attendantLabel(metric, t)}
                                  {metric.user_id === currentUserId ? ` ${t("(você)")}` : ""}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatCount(metric.won)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatCount(metric.lost)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatCount(metric.conversations_handled)}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {formatDuration(metric.avg_first_response_seconds)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
