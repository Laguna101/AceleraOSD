"use client";

import Link from "next/link";
import { useState } from "react";

import { EmptyState } from "@/components/empty";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useT } from "@/hooks/i18n/useT";
import { useActivityReport } from "@/hooks/reports/useActivityReport";
import type {
  LinhaDeAtividade,
  LinhaDeAtor,
  LinhaDeTipo,
  LinhaDoDia,
} from "@/lib/reports/atividades";
import { ClockCounterClockwise } from "@/lib/ui/icons";
import { cn } from "@/lib/utils";

const PERIODOS = [7, 30, 90] as const;

/**
 * Marcador do ator: FORMA, nunca cor — os mesmos três desenhos do kanban e da
 * timeline. Preenchido = gente, anel = agente, tracejado = nem um nem outro.
 * Um quarto alfabeto nesta tela obrigaria a decorar dois.
 */
function MarcadorDeAtor({ forma }: { forma: LinhaDeAtor["forma"] }) {
  return (
    <span
      aria-hidden
      className={cn(
        "h-2 w-2 shrink-0",
        forma === "filled" && "rounded-full bg-accent",
        forma === "ring" && "rounded-full border border-accent bg-surface",
        forma === "dashed" && "rounded-full border border-dashed border-border-strong",
      )}
    />
  );
}

function BarraDeLinha({ fatia }: { fatia: number }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-accent" style={{ width: `${fatia}%` }} />
    </div>
  );
}

function quandoLegivel(iso: string, idioma: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(idioma, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function SerieDiaria({ dias }: { dias: LinhaDoDia[] }) {
  const t = useT();
  const teto = Math.max(1, ...dias.map((d) => d.quantidade));
  const intervalo = Math.max(1, Math.ceil(dias.length / 7));
  return (
    <div className="acelera-activity-chart" data-testid="serie-diaria">
      <div className="acelera-activity-plot" aria-hidden="true">
        {dias.map((d, index) => (
          <div
            key={d.data}
            className="acelera-activity-day"
            title={`${d.rotulo}: ${d.quantidade}`}
            data-dia={d.data}
            data-quantidade={d.quantidade}
          >
            <div className="acelera-activity-bar-space">
              <div
                className="acelera-activity-bar"
                style={{ height: `${(d.quantidade / teto) * 100}%` }}
              />
            </div>
            <span>{index % intervalo === 0 || index === dias.length - 1 ? d.rotulo : ""}</span>
          </div>
        ))}
      </div>
      <details className="acelera-activity-data">
        <summary>{t("Ver dados por dia")}</summary>
        <table>
          <thead>
            <tr>
              <th scope="col">{t("Data")}</th>
              <th scope="col">{t("Atividades")}</th>
            </tr>
          </thead>
          <tbody>
            {dias.map((d) => (
              <tr key={d.data}>
                <td>{d.rotulo}</td>
                <td>{d.quantidade}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

export function ActivityReportClient() {
  const t = useT();
  const [dias, setDias] = useState<number>(7);
  const { data, isLoading, isError, refetch } = useActivityReport(dias);

  const relatorio = data?.data;

  const seletor = (
    <Select value={String(dias)} onValueChange={(v) => setDias(Number(v))}>
      <SelectTrigger className="w-44" aria-label={t("Período")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PERIODOS.map((p) => (
          <SelectItem key={p} value={String(p)}>
            {t("Últimos")} {p} {t("dias")}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  if (isLoading) {
    return (
      <div className="acelera-activity-report flex flex-col gap-6">
        {seletor}
        <div className="acelera-feedback" role="status">
          {t("Carregando relatório…")}
        </div>
      </div>
    );
  }

  if (isError || !relatorio) {
    return (
      <div className="acelera-activity-report flex flex-col gap-6">
        {seletor}
        <div className="acelera-feedback" role="alert">
          <h2>{t("Não foi possível carregar o relatório")}</h2>
          <p>{t("Confira a conexão e tente novamente.")}</p>
          <Button variant="outline" onClick={() => void refetch()}>
            {t("Tentar novamente")}
          </Button>
        </div>
      </div>
    );
  }

  const { total, resumo, atores, tipos, atividades, truncado, vocabulario } = relatorio;

  return (
    <div className="acelera-activity-report flex flex-col gap-6">
      <div className="acelera-filter-bar acelera-activity-toolbar flex flex-wrap items-center justify-between gap-3">
        {seletor}
        <p className="text-sm text-muted-foreground" data-testid="total-de-atividades">
          {total} {total === 1 ? t("acontecimento") : t("acontecimentos")}
        </p>
      </div>

      {total === 0 ? (
        // Zero é RESPOSTA, não erro: "ninguém mexeu em nada neste período" é
        // exatamente o que o gestor precisa saber, e um gráfico de zeros diria
        // a mesma coisa em silêncio.
        <EmptyState
          icon={ClockCounterClockwise}
          headline={t("Nada aconteceu neste período")}
          subcopy={t(
            "Nenhum acontecimento foi registrado na janela escolhida — nem por pessoas, nem pelos agentes. Aumente o período ou confira se o atendimento está de pé.",
          )}
          primary={{ label: t("Ver conversas"), href: "/app/inbox" }}
        />
      ) : (
        <>
          {/* A PERGUNTA, respondida em três números: quanto foi gente, quanto
              foi agente, quanto não foi nem um nem outro. */}
          <div className="grid gap-3 sm:grid-cols-3">
            <CartaoDeOrigem
              rotulo={t("A equipe")}
              valor={resumo.pessoas}
              total={total}
              forma="filled"
            />
            <CartaoDeOrigem
              rotulo={t("Os agentes")}
              valor={resumo.agentes}
              total={total}
              forma="ring"
            />
            <CartaoDeOrigem
              rotulo={t("Automático")}
              valor={resumo.automatico}
              total={total}
              forma="dashed"
            />
          </div>

          <Card className="acelera-activity-panel acelera-activity-trend-panel">
            <CardHeader>
              <CardTitle className="text-base">{t("Atividades por dia")}</CardTitle>
            </CardHeader>
            <CardContent>
              <SerieDiaria dias={relatorio.dias} />
            </CardContent>
          </Card>

          <div className="acelera-activity-rankings grid gap-4 lg:grid-cols-2">
            <Card className="acelera-activity-panel">
              <CardHeader>
                <CardTitle className="text-base">{t("Quem fez")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3" data-testid="ranking-de-atores">
                {atores.map((a) => (
                  <LinhaComBarra
                    key={a.chave}
                    forma={a.forma}
                    nome={a.nome}
                    quantidade={a.quantidade}
                    fatia={a.fatia}
                  />
                ))}
              </CardContent>
            </Card>

            <Card className="acelera-activity-panel">
              <CardHeader>
                <CardTitle className="text-base">{t("O que foi feito")}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3" data-testid="ranking-de-tipos">
                {tipos.map((tp: LinhaDeTipo) => (
                  <LinhaComBarra
                    key={tp.type}
                    nome={tp.rotulo}
                    quantidade={tp.quantidade}
                    fatia={tp.fatia}
                  />
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="acelera-activity-panel acelera-activity-timeline-panel">
            <CardHeader>
              <CardTitle className="text-base">{t("Linha do tempo da operação")}</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2" data-testid="lista-de-atividades">
                {atividades.map((i: LinhaDeAtividade) => (
                  <li
                    key={i.id}
                    className="acelera-activity-timeline-row flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-md border border-border p-2 text-sm"
                  >
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {quandoLegivel(i.quando, "pt-BR")}
                    </span>
                    <MarcadorDeAtor forma={i.atorForma} />
                    <span className="font-medium">{i.rotulo}</span>
                    <span className="text-xs text-muted-foreground">{i.atorNome}</span>
                    {/* O "e daí" da linha: daqui se chega ao negócio. Um
                        relatório que só lista é decorativo. */}
                    {i.negocioId && (
                      <Link
                        href={`/app/leads/${i.negocioId}`}
                        className="text-xs text-accent underline underline-offset-2"
                      >
                        {i.negocioTitulo ?? `${vocabulario.deal} ${i.negocioId.slice(0, 8)}`}
                      </Link>
                    )}
                    {i.contatoNome && (
                      <span className="text-xs text-muted-foreground">· {i.contatoNome}</span>
                    )}
                    {i.motivo && (
                      <span className="w-full truncate text-xs text-muted-foreground">
                        {i.motivo}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              {truncado && (
                // O corte é DITO. Sem esta frase, um período movimentado
                // pareceria calmo — a lista terminaria e ninguém saberia que
                // ela terminou antes do período.
                <p className="mt-3 text-xs text-muted-foreground" data-testid="aviso-de-corte">
                  {t("A lista mostra só os mais recentes.")} {t("No período houve")} {total}{" "}
                  {t("acontecimentos.")}
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function CartaoDeOrigem({
  rotulo,
  valor,
  total,
  forma,
}: {
  rotulo: string;
  valor: number;
  total: number;
  forma: LinhaDeAtor["forma"];
}) {
  const fatia = total > 0 ? Math.round((valor / total) * 100) : 0;
  return (
    <Card
      className={`acelera-activity-kpi acelera-activity-kpi-${forma}`}
      data-testid={`origem-${forma}`}
    >
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MarcadorDeAtor forma={forma} />
          {rotulo}
        </div>
        <div className="text-2xl font-semibold tabular-nums">{valor}</div>
        <div className="text-xs text-muted-foreground tabular-nums">{fatia}%</div>
      </CardContent>
    </Card>
  );
}

function LinhaComBarra({
  forma,
  nome,
  quantidade,
  fatia,
}: {
  forma?: LinhaDeAtor["forma"];
  nome: string;
  quantidade: number;
  fatia: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          {forma && <MarcadorDeAtor forma={forma} />}
          <span className="truncate">{nome}</span>
        </span>
        <span className="shrink-0 text-muted-foreground tabular-nums">{quantidade}</span>
      </div>
      <BarraDeLinha fatia={fatia} />
    </div>
  );
}
