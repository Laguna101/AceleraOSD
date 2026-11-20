/**
 * Nuvemshop integration status page.
 *
 * Three states:
 *   1. not_configured — env vars empty: shows "configure env" card.
 *   2. not_connected  — env ok, no tenant_integrations row: shows Connect button.
 *   3. connected      — row exists with status=healthy: shows store info + Disconnect.
 *
 * The Connect Server Action redirects to Nuvemshop's authorize URL. Callback
 * lives at /api/v1/integrations/nuvemshop/callback.
 */

import { ArrowSquareOut, Storefront } from "@/lib/ui/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadAuthUser, resolveActiveOrg } from "@/lib/auth/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isConfigured } from "@/lib/nuvemshop/config";
import { ConnectButton, DisconnectButton } from "./_components/ConnectButton";
import { StatusToast } from "./_components/StatusToast";
import { Suspense } from "react";
import { tagDeIdioma } from "@/lib/i18n/datas";
import { normalizarIdioma } from "@/lib/i18n/idiomas";
import { traduzir } from "@/lib/i18n/dicionario";

interface IntegrationRow {
  id: string;
  status: string;
  scopes: string[];
  store_metadata: { store_id?: string } | null;
  webhook_subscriptions: Record<string, { id: number | null; error?: string }> | null;
  last_sync_at: string | null;
}

async function loadIntegration(orgId: string): Promise<IntegrationRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("tenant_integrations")
    .select("id, status, scopes, store_metadata, webhook_subscriptions, last_sync_at")
    .eq("organization_id", orgId)
    .eq("provider", "nuvemshop")
    .maybeSingle();
  return (data as IntegrationRow | null) ?? null;
}

export default async function NuvemshopIntegrationPage() {
  const user = await loadAuthUser();
  const activeOrg = user ? await resolveActiveOrg(user) : null;
  const configured = isConfigured();
  const idioma = normalizarIdioma(user?.locale ?? null);

  const integration = activeOrg && configured ? await loadIntegration(activeOrg.orgId) : null;

  const isAdmin =
    activeOrg?.role === "admin" || (user?.is_platform_admin === true && !user.support);
  const integrationState = !configured
    ? "setup"
    : !integration || integration.status === "disconnected"
      ? "disconnected"
      : integration.status === "healthy"
        ? "connected"
        : "attention";
  const stateLabel = {
    setup: "Configuração necessária",
    disconnected: "Sem conexão",
    connected: "Conectado",
    attention: integration?.status ?? "Atenção necessária",
  }[integrationState];

  return (
    <div className="acelera-page acelera-integration-page mx-auto w-full space-y-6 p-0">
      <Suspense fallback={null}>
        <StatusToast />
      </Suspense>

      <header className="acelera-integration-heading">
        <div className="acelera-integration-brand-mark" aria-hidden="true">
          <Storefront size={24} weight="duotone" />
        </div>
        <div className="acelera-integration-heading-copy">
          <h1>Nuvemshop</h1>
          <p>{traduzir("Sincroniza pedidos, produtos e clientes via OAuth + webhooks.", idioma)}</p>
        </div>
        <Badge
          variant={
            integrationState === "connected"
              ? "success"
              : integrationState === "attention"
                ? "warning"
                : "neutral"
          }
          className="acelera-integration-state"
          aria-label={traduzir("Estado da integração", idioma) + ": " + stateLabel}
        >
          {traduzir(stateLabel, idioma)}
        </Badge>
      </header>

      {!configured ? (
        <Card className="acelera-integration-panel" role="status">
          <CardHeader className="acelera-integration-panel-header">
            <div>
              <CardTitle>{traduzir("Integração não configurada", idioma)}</CardTitle>
              <CardDescription>
                {traduzir(
                  "Adicione as credenciais no ambiente do servidor para liberar a conexão da loja.",
                  idioma,
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="acelera-integration-panel-content">
            <div className="acelera-integration-credentials">
              <span>{traduzir("Credenciais necessárias", idioma)}</span>
              <code>NUVEMSHOP_APP_ID</code>
              <code>NUVEMSHOP_CLIENT_ID</code>
              <code>NUVEMSHOP_CLIENT_SECRET</code>
            </div>
            <a
              className="acelera-integration-resource"
              href="https://partners.tiendanube.com/"
              target="_blank"
              rel="noreferrer"
            >
              {traduzir("Acessar parceiros da Nuvemshop", idioma)}
              <ArrowSquareOut size={16} weight="bold" aria-hidden="true" />
            </a>
          </CardContent>
        </Card>
      ) : !integration || integration.status === "disconnected" ? (
        <Card className="acelera-integration-panel">
          <CardHeader className="acelera-integration-panel-header">
            <div>
              <CardTitle>{traduzir("Conectar Nuvemshop", idioma)}</CardTitle>
              <CardDescription>
                {traduzir(
                  "Autorize o AceleraOS na loja. A Nuvemshop abrirá uma etapa segura de autorização.",
                  idioma,
                )}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="acelera-integration-panel-content">
            <ConnectButton disabled={!isAdmin} />
            {!isAdmin ? (
              <p className="acelera-integration-permission-note">
                {traduzir("Somente administradores podem conectar integrações.", idioma)}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="acelera-integration-panel">
          <CardHeader className="acelera-integration-panel-header acelera-integration-connected-header">
            <div>
              <CardTitle className="flex items-center gap-2">
                {traduzir("Loja autorizada", idioma)}
                <Badge variant={integration.status === "healthy" ? "success" : "warning"}>
                  {integration.status}
                </Badge>
              </CardTitle>
              <CardDescription>
                {traduzir("Detalhes de autorização e sincronização desta organização.", idioma)}
              </CardDescription>
            </div>
            {isAdmin ? <DisconnectButton /> : null}
          </CardHeader>
          <CardContent>
            <dl className="acelera-integration-details">
              <div>
                <dt>{traduzir("ID da loja", idioma)}</dt>
                <dd>#{integration.store_metadata?.store_id ?? "—"}</dd>
              </div>
              <div>
                <dt>{traduzir("Última sincronização", idioma)}</dt>
                <dd>
                  {integration.last_sync_at
                    ? new Date(integration.last_sync_at).toLocaleString(tagDeIdioma(idioma))
                    : traduzir("Ainda não registrada", idioma)}
                </dd>
              </div>
              <div>
                <dt>{traduzir("Escopos autorizados", idioma)}</dt>
                <dd>{integration.scopes.length > 0 ? integration.scopes.join(", ") : "—"}</dd>
              </div>
              <div>
                <dt>{traduzir("Webhooks registrados", idioma)}</dt>
                <dd>
                  {integration.webhook_subscriptions
                    ? Object.entries(integration.webhook_subscriptions).filter(
                        ([, v]) => v.id !== null,
                      ).length
                    : 0}{" "}
                  / 8
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
