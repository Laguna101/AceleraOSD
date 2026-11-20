"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useT } from "@/hooks/i18n/useT";
import { Plus, MagnifyingGlass, UploadSimple, UsersThree } from "@/lib/ui/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useContactList } from "@/hooks/contacts/useContactList";
import { ContactsTable } from "@/components/contacts/ContactsTable";
import { NewContactDialog } from "@/components/contacts/NewContactDialog";
import { ImportContactsDialog } from "@/components/contacts/ImportContactsDialog";
import { TAG_DE_CLIENTE } from "@/lib/contacts/cliente";
import { useActiveOrg } from "@/hooks/auth/AuthProvider";
import { MergeDialog } from "@/components/contacts/MergeDialog";
import { EmptyContacts } from "@/components/empty";
import type { ContactOrderBy } from "@/lib/schemas/contacts";

const SOURCE_OPTIONS = [
  { value: undefined, label: "Todas as origens" },
  { value: "manual", label: "Manual" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "site", label: "Site (landing page)" },
  { value: "nuvemshop", label: "Nuvemshop" },
  { value: "import_csv", label: "Importado (CSV)" },
  // Os dois valores que a atribuição de anúncio grava em `contacts.source`
  // (`PlataformaDeAnuncio` em lib/leads/atribuicao-de-anuncio.ts). Sem eles, o
  // contato que veio de um clique em anúncio existe no banco e não é
  // alcançável por nenhum filtro desta tela. O handler aceita qualquer valor
  // (`_handler.ts:167` faz `eq("source", q.source)`), então a lista é a única
  // porta — e ela estava incompleta desde que a atribuição passou a existir.
  { value: "meta_ads", label: "Anúncio da Meta" },
  { value: "google_ads", label: "Anúncio do Google" },
];

const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;

export function ContactsListClient({
  modo = "contatos",
}: {
  modo?: "contatos" | "prospeccao-condominios";
}) {
  const t = useT();
  const clientesLigado = useActiveOrg()?.cliente_pela_agenda === true;
  const tagBase = modo === "prospeccao-condominios" ? "condominio" : undefined;
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | undefined>(
    modo === "prospeccao-condominios" ? "condominio" : undefined,
  );
  const [source, setSource] = useState<string | undefined>(undefined);
  const [orderBy, setOrderBy] = useState<ContactOrderBy>("last_activity_at");
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("desc");
  const [limit, setLimit] = useState<number>(25);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [duplicadosOpen, setDuplicadosOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo(
    () => ({ search, tag, source, order_by: orderBy, order_dir: orderDir, limit }),
    [search, tag, source, orderBy, orderDir, limit],
  );
  const q = useContactList(filters);
  const hasOptionalFilters = Boolean(search || source || (tag && tag !== tagBase));

  const limparFiltros = useCallback(() => {
    setSearchInput("");
    setSearch("");
    setTag(tagBase);
    setSource(undefined);
  }, [tagBase]);

  const allContacts = useMemo(() => q.data?.pages.flatMap((p) => p.data) ?? [], [q.data]);

  const tagOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of allContacts) for (const tag of c.tags) set.add(tag);
    // `cliente` na lista mesmo que nenhum contato da página carregada a tenha —
    // COM A REGRA LIGADA. As demais opções saem do que já foi paginado — o que
    // basta para etiqueta que a equipe criou e usa em bloco, e falha justamente
    // para esta, que o sistema escreve sozinho e cujo primeiro uso é "filtrar
    // quem já é cliente" numa base grande, onde a primeira página pode não ter
    // nenhum. Desligada, a opção fixa ofereceria um filtro de uma regra que não
    // roda; quem já tem a etiqueta continua aparecendo pela linha de cima.
    if (clientesLigado) set.add(TAG_DE_CLIENTE);
    if (modo === "prospeccao-condominios") set.add("condominio");
    return Array.from(set).sort();
  }, [allContacts, clientesLigado, modo]);

  const handleSort = useCallback(
    (column: ContactOrderBy) => {
      if (column === orderBy) {
        setOrderDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setOrderBy(column);
        setOrderDir(column === "display_name" ? "asc" : "desc");
      }
    },
    [orderBy],
  );

  return (
    <div className="acelera-page acelera-contacts-page flex flex-col gap-6">
      <header className="acelera-contacts-heading flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="acelera-contacts-heading-copy min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">
            {modo === "prospeccao-condominios" ? t("Prospecção de condomínios") : t("Contatos")}
          </h1>
          {modo === "prospeccao-condominios" ? (
            <>
              <p className="text-sm text-muted-foreground">
                {t("Organize os contatos de administradoras e condomínios que sua equipe está prospectando.")}
              </p>
              <div className="acelera-prospecting-segment" aria-label={t("Segmento ativo")}>
                <span className="acelera-prospecting-segment-dot" aria-hidden="true" />
                <span>{t("Segmento")}</span>
                <strong>{t("Condomínios")}</strong>
                <code>condominio</code>
              </div>
              <p className="acelera-prospecting-hint">
                {t("Importe uma lista ou aplique a tag condominio aos contatos para incluí-los aqui.")}
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("Encontre pessoas, organize sua base e acompanhe seus relacionamentos.")}
            </p>
          )}
        </div>
        {/*
          A estrutura é a da main (o "Importar CSV" do PR #313); o `shrink-0`
          vem do PR #267, e vale para os DOIS botões agora: numa tela de 390px
          uma linha de dois botões sem isso comprime os rótulos.
        */}
        <div className="acelera-contacts-actions flex flex-wrap items-center gap-2" data-mode={modo}>
          {/*
            A porta do recurso de duplicados fica AQUI, na tela que já existe, e
            não num item de menu novo: quem descobre que tem contato repetido
            descobre olhando a lista, e a barra lateral não precisa crescer para
            um trabalho que se faz de vez em quando.
          */}
          <Button variant="outline" onClick={() => setDuplicadosOpen(true)}>
            <UsersThree size={16} weight="bold" aria-hidden />
            <span>{t("Duplicados")}</span>
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <UploadSimple size={16} weight="bold" aria-hidden />
            <span>{t("Importar CSV")}</span>
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus size={16} weight="bold" aria-hidden />
            <span>{t("Novo contato")}</span>
          </Button>
        </div>
      </header>

      <div
        className="acelera-filter-bar acelera-contacts-toolbar flex flex-wrap items-center gap-2"
        role="group"
        aria-label={t("Filtros de contatos")}
        data-has-filters={hasOptionalFilters ? "true" : "false"}
      >
        <div className="relative w-full sm:w-72">
          <MagnifyingGlass
            size={16}
            className="absolute top-1/2 left-2 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            aria-label={t("Buscar contatos")}
            placeholder={t("Buscar por nome, email ou telefone…")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 w-full pl-8"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" disabled={tagOptions.length === 0}>
              {tag ? `${t("Tag")}: ${tag}` : `${t("Tag")}: ${t("todas")}`}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t("Tag")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setTag(undefined)}>{t("Todas")}</DropdownMenuItem>
            {tagOptions.map((tagOption) => (
              <DropdownMenuItem key={tagOption} onClick={() => setTag(tagOption)}>
                {tagOption}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {t(SOURCE_OPTIONS.find((s) => s.value === source)?.label ?? "Origem")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {SOURCE_OPTIONS.map((s) => (
              <DropdownMenuItem key={s.label} onClick={() => setSource(s.value)}>
                {t(s.label)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {limit} {t("por página")}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t("Itens por página")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {PAGE_SIZE_OPTIONS.map((n) => (
              <DropdownMenuItem key={n} onClick={() => setLimit(n)}>
                {n}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {hasOptionalFilters && (
          <Button variant="ghost" size="sm" onClick={limparFiltros}>
            {t("Limpar filtros")}
          </Button>
        )}
      </div>

      {q.isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : q.isError ? (
        <Card className="acelera-feedback" role="alert">
          <h2>{t("Não foi possível carregar os contatos")}</h2>
          <p>{t("Confira a conexão e tente novamente.")}</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => q.refetch()}>
            {t("Tentar novamente")}
          </Button>
        </Card>
      ) : allContacts.length === 0 && hasOptionalFilters ? (
        <div className="acelera-feedback" role="status">
          <h2>{t("Nenhum contato encontrado")}</h2>
          <p>{t("Tente outra busca ou limpe os filtros para ver mais resultados.")}</p>
          <Button variant="outline" onClick={limparFiltros}>
            {t("Limpar filtros")}
          </Button>
        </div>
      ) : allContacts.length === 0 && modo === "prospeccao-condominios" ? (
        <div className="acelera-feedback" role="status">
          <h2>{t("Nenhum contato encontrado")}</h2>
          <p>{t("Não há contatos marcados com a tag condominio.")}</p>
        </div>
      ) : allContacts.length === 0 ? (
        <Card className="p-2">
          <EmptyContacts />
        </Card>
      ) : (
        <>
          <Card className="acelera-contacts-list-panel overflow-hidden">
            <ContactsTable
              contacts={allContacts}
              orderBy={orderBy}
              orderDir={orderDir}
              onSort={handleSort}
            />
          </Card>
          <div className="acelera-contacts-pagination flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <p className="text-sm text-muted-foreground">
              <strong>{allContacts.length}</strong>{" "}
              {allContacts.length === 1 ? t("contato carregado") : t("contatos carregados")}
              {q.hasNextPage ? ` · ${t("há mais resultados")}` : ` · ${t("fim da lista")}`}
            </p>
            {q.hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => q.fetchNextPage()}
                disabled={q.isFetchingNextPage}
              >
                {q.isFetchingNextPage ? t("Carregando…") : t("Carregar mais")}
              </Button>
            )}
          </div>
        </>
      )}

      <NewContactDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportContactsDialog open={importOpen} onOpenChange={setImportOpen} />
      <MergeDialog open={duplicadosOpen} onOpenChange={setDuplicadosOpen} />
    </div>
  );
}
