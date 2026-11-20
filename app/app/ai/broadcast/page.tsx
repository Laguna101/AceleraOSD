import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChatCircle, ClockCounterClockwise, UsersThree } from "@/lib/ui/icons";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { traduzir } from "@/lib/i18n/dicionario";

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const user = await requireAuth();
  const org = await resolveActiveOrg(user);
  const canManage = org?.role === "admin" || org?.role === "manager";
  const t = (texto: string) => traduzir(texto, user.idioma);
  return (
    <div className="acelera-page acelera-broadcast-page flex h-full flex-col gap-6">
      <header className="acelera-broadcast-heading">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("Campanhas de mensagens")}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            {t("Organize listas, cadências e acompanhamento das conversas de prospecção.")}
          </p>
        </div>
        <span className="acelera-broadcast-mode">
          <i aria-hidden="true" />
          {t("Simulação")}
        </span>
      </header>
      <div className="acelera-campaign-notice acelera-broadcast-notice" role="status">
        <span className="acelera-campaign-status-dot" aria-hidden="true" />
        <div>
          <strong>{t("Envio de mensagens desativado")}</strong>
          <p>
            {t(
              "Esta tela organiza a prospecção, mas ainda não envia mensagens reais. Configure o canal e valide a cadência antes de iniciar uma operação.",
            )}
          </p>
        </div>
      </div>

      <div className="acelera-broadcast-overview">
        <Card className="acelera-broadcast-cadence">
          <header>
            <h2>{t("Cadência de referência")}</h2>
            <span>{t("Até três tentativas")}</span>
          </header>
          <ol aria-label={t("Intervalos da cadência")}>
            <li>
              <span>D0</span>
              <strong>{t("1ª tentativa")}</strong>
            </li>
            <li>
              <span>D2</span>
              <strong>{t("2ª tentativa")}</strong>
            </li>
            <li>
              <span>D6</span>
              <strong>{t("3ª tentativa")}</strong>
            </li>
          </ol>
          <p>{t("A cadência é interrompida quando há resposta.")}</p>
        </Card>

        <Card className="acelera-broadcast-guardrails">
          <h2>{t("Proteções previstas")}</h2>
          <dl>
            <div>
              <dt>{t("Opt-out")}</dt>
              <dd>{t("Exclua da lista contatos que bloquearam novas mensagens.")}</dd>
            </div>
            <div>
              <dt>{t("Limite de envio")}</dt>
              <dd>{t("Revise o limite do canal antes de preparar uma campanha.")}</dd>
            </div>
          </dl>
          <p>
            {canManage
              ? t("Confirme a configuração do canal e dos fluxos antes de iniciar uma operação.")
              : t("A configuração de campanhas é feita pelos gestores.")}
          </p>
        </Card>
      </div>

      <section className="acelera-broadcast-next" aria-labelledby="broadcast-next-heading">
        <header>
          <h2 id="broadcast-next-heading">{t("Etapas da operação")}</h2>
          <p>
            {t("Acesse cada área para preparar a lista, acompanhar respostas e revisar os fluxos.")}
          </p>
        </header>
        <div className="acelera-broadcast-actions">
          <Card>
            <span className="acelera-broadcast-action-icon" aria-hidden="true">
              <UsersThree size={18} />
            </span>
            <div>
              <h3>{t("Preparar contatos")}</h3>
              <p>{t("Importe um CSV e revise os dados da lista de prospecção.")}</p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/app/contacts">
                {t("Abrir contatos")} <ArrowRight size={15} aria-hidden />
              </Link>
            </Button>
          </Card>
          <Card>
            <span className="acelera-broadcast-action-icon" aria-hidden="true">
              <ChatCircle size={18} />
            </span>
            <div>
              <h3>{t("Acompanhar conversas")}</h3>
              <p>{t("Consulte o atendimento e os retornos dos contatos no Inbox.")}</p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/app/inbox">
                {t("Abrir Inbox")} <ArrowRight size={15} aria-hidden />
              </Link>
            </Button>
          </Card>
          <Card>
            <span className="acelera-broadcast-action-icon" aria-hidden="true">
              <ClockCounterClockwise size={18} />
            </span>
            <div>
              <h3>{t("Revisar follow-ups")}</h3>
              <p>{t("Consulte os fluxos de acompanhamento configurados para sua organização.")}</p>
            </div>
            <Button asChild variant="ghost">
              <Link href="/app/ai/followups">
                {t("Abrir follow-ups")} <ArrowRight size={15} aria-hidden />
              </Link>
            </Button>
          </Card>
        </div>
      </section>
    </div>
  );
}
