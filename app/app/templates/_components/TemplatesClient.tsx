"use client";

import { useT } from "@/hooks/i18n/useT";
import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, PencilSimple, Trash } from "@/lib/ui/icons";
import { MagnifyingGlass } from "@/lib/ui/icons";
import { apiClient } from "@/lib/api/client";
import { showApiError } from "@/components/feedback/ApiErrorToast";
import { useMessageTemplates, type MessageTemplate } from "@/hooks/inbox/useMessageTemplates";
import { TemplateFormDialog } from "./TemplateFormDialog";
import { EmptyFilterResults } from "@/components/empty";
import { Input } from "@/components/ui/input";

const TEMPLATES_KEY = ["message-templates"];
type TemplateScope = "all" | "mine" | "team";

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

interface Props {
  canShare: boolean;
  currentUserId: string;
}

export function TemplatesClient({ canShare, currentUserId }: Props) {
  const t = useT();
  const { data: templates = [], isLoading, isError, refetch } = useMessageTemplates();
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/api/v1/message-templates/${id}`),
    onError: showApiError,
    onSuccess: () => qc.invalidateQueries({ queryKey: TEMPLATES_KEY }),
  });
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<MessageTemplate | null>(null);
  const [scope, setScope] = React.useState<TemplateScope>("all");
  const [search, setSearch] = React.useState("");

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (template: MessageTemplate) => {
    setEditing(template);
    setFormOpen(true);
  };

  if (isLoading) {
    return (
      <div
        className="acelera-quick-replies-loading"
        role="status"
        aria-label={t("Carregando respostas rápidas")}
      >
        {[0, 1, 2].map((item) => (
          <Skeleton key={item} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="acelera-feedback" role="alert">
        <h2>{t("Não foi possível carregar as respostas rápidas")}</h2>
        <p>{t("Confira a conexão e tente novamente.")}</p>
        <Button variant="outline" onClick={() => void refetch()}>
          {t("Tentar novamente")}
        </Button>
      </div>
    );
  }

  const normalize = normalizeSearch(search);
  const mineCount = templates.filter((template) => template.owner_user_id === currentUserId).length;
  const teamCount = templates.filter((template) => template.owner_user_id === null).length;
  const visibleTemplates = templates.filter((template) => {
    const matchesScope =
      scope === "all" ||
      (scope === "mine" && template.owner_user_id === currentUserId) ||
      (scope === "team" && template.owner_user_id === null);
    if (!matchesScope) return false;
    if (!normalize) return true;
    return normalizeSearch(
      `${template.title} ${template.body} ${template.shortcut ?? ""}`,
    ).includes(normalize);
  });

  return (
    <div className="acelera-quick-replies flex flex-col gap-5">
      <div className="acelera-quick-replies-toolbar">
        {templates.length > 0 ? (
          <>
            <div className="acelera-quick-replies-search">
              <MagnifyingGlass size={17} aria-hidden />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("Buscar por título ou conteúdo")}
                aria-label={t("Buscar respostas rápidas")}
              />
            </div>
            <div
              className="acelera-quick-replies-scopes"
              role="group"
              aria-label={t("Filtrar respostas rápidas")}
            >
              {(
                [
                  ["all", t("Todas"), templates.length],
                  ["mine", t("Minhas"), mineCount],
                  ["team", t("Da equipe"), teamCount],
                ] as const
              ).map(([value, label, count]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={scope === value}
                  onClick={() => setScope(value)}
                >
                  {label}
                  <span>{count}</span>
                </button>
              ))}
            </div>
          </>
        ) : (
          <span />
        )}
        <Button type="button" onClick={openNew} className="w-full sm:w-auto">
          <Plus /> {t("Novo template")}
        </Button>
      </div>
      {templates.length === 0 ? (
        <div className="acelera-quick-replies-empty">
          <h2>{t("Suas respostas rápidas começam aqui")}</h2>
          <p>{t("Salve mensagens recorrentes para responder com consistência no Inbox.")}</p>
          <Button type="button" onClick={openNew}>
            <Plus /> {t("Criar primeira resposta")}
          </Button>
        </div>
      ) : visibleTemplates.length === 0 ? (
        <EmptyFilterResults
          primary={{
            label: t("Limpar filtros"),
            onClick: () => {
              setScope("all");
              setSearch("");
            },
          }}
        />
      ) : (
        <ul className="acelera-quick-replies-list">
          {visibleTemplates.map((template) => {
            // Só quem pode editar/apagar pela RLS vê as ações: o dono do
            // pessoal, ou manager+ no compartilhado (owner null). Sem isto, um
            // agent veria botões que o backend rejeita (404/nada apagado).
            const canModify =
              template.owner_user_id === currentUserId ||
              (template.owner_user_id === null && canShare);
            return (
              <li key={template.id} className="acelera-quick-reply">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="acelera-quick-reply-title">{template.title}</span>
                    <Badge variant={template.owner_user_id ? "neutral" : "default"}>
                      {t(template.owner_user_id ? "Pessoal" : "Compartilhado")}
                    </Badge>
                  </div>
                  <p className="acelera-quick-reply-body">{template.body}</p>
                </div>
                {canModify && (
                  <div className="flex shrink-0 gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("Editar template")}
                      onClick={() => openEdit(template)}
                    >
                      <PencilSimple />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={t("Excluir template")}
                        >
                          <Trash />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("Excluir este template?")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("Essa ação não pode ser desfeita.")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t("Cancelar")}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              del.mutate(template.id, {
                                onSuccess: () => toast.success(t("Template excluído.")),
                              })
                            }
                          >
                            {t("Excluir")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <TemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        canShare={canShare}
        template={editing}
      />
    </div>
  );
}
