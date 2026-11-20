"use client";
import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Robot, Plus } from "@/lib/ui/icons";
import { useT } from "@/hooks/i18n/useT";
import { useAgentsList } from "@/hooks/ai/useAgents";
import type { AgentRow } from "@/hooks/ai/useAgent";
import { AgentCard } from "./AgentCard";
import { AgentsListFilters, type StatusFilter } from "./AgentsListFilters";
import { deriveAgentStatus } from "./AgentStatusBadge";

interface Props {
  initialData?: AgentRow[];
  canWrite: boolean;
}

export function AgentsList({ initialData, canWrite }: Props) {
  const t = useT();
  const { data, isLoading, isError, refetch } = useAgentsList({ initialData });
  const [status, setStatus] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  const agents = data ?? [];
  const activeCount = agents.filter((agent) => deriveAgentStatus(agent) === "published").length;
  const draftCount = agents.filter((agent) => deriveAgentStatus(agent) === "draft").length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return agents.filter((a) => {
      const s = deriveAgentStatus(a);
      if (!showArchived && s === "archived") return false;
      if (status !== "all" && s !== status) return false;
      if (q && !a.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [agents, status, query, showArchived]);

  if (isLoading) {
    return (
      <div className="acelera-feedback" role="status">
        {t("Carregando agentes…")}
      </div>
    );
  }
  if (isError && !data) {
    return (
      <div className="acelera-feedback" role="alert">
        <h2>{t("Não foi possível carregar os agentes")}</h2>
        <p>{t("Confira a conexão e tente novamente.")}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          {t("Tentar novamente")}
        </Button>
      </div>
    );
  }
  if (agents.length === 0) {
    return (
      <div className="acelera-agent-empty">
        <span className="acelera-agent-empty-mark">
          <Robot size={26} aria-hidden />
        </span>
        <h2>{t("Nenhum agente configurado")}</h2>
        <p>
          {t(
            "Crie um agente para responder a conversas no WhatsApp com IA. Configure suas instruções, ferramentas e gatilhos.",
          )}
        </p>
        {canWrite && (
          <Link href="/app/ai/agents/new">
            <Button className="mt-1">
              <Plus size={14} aria-hidden className="mr-2" /> {t("Novo agente")}
            </Button>
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="acelera-agents-workspace flex flex-col gap-4">
      <div className="acelera-agent-summary" aria-label={t("Resumo dos agentes")}>
        <div>
          <span>{t("Total")}</span>
          <strong>{agents.length}</strong>
        </div>
        <div>
          <span>{t("Em operação")}</span>
          <strong>{activeCount}</strong>
        </div>
        <div>
          <span>{t("Rascunhos")}</span>
          <strong>{draftCount}</strong>
        </div>
      </div>
      <div className="acelera-filter-bar flex flex-wrap items-center justify-between gap-3">
        <AgentsListFilters
          status={status}
          onStatusChange={setStatus}
          query={query}
          onQueryChange={setQuery}
          showArchived={showArchived}
          onShowArchivedChange={setShowArchived}
        />
        {canWrite && (
          <Link href="/app/ai/agents/new">
            <Button>
              <Plus size={14} aria-hidden className="mr-2" /> {t("Novo agente")}
            </Button>
          </Link>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="acelera-feedback" role="status">
          <h2>{t("Nenhum agente corresponde aos filtros atuais")}</h2>
          <p>{t("Ajuste a busca ou remova os filtros para consultar a lista completa.")}</p>
        </div>
      ) : (
        <ul className="acelera-agent-grid grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((agent) => (
            <li key={agent.id}>
              <AgentCard agent={agent} canWrite={canWrite} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
