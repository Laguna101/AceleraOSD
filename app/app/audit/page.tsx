import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { traduzir } from "@/lib/i18n/dicionario";
import { ROLE_RANK } from "@/lib/auth/types";
import { AuditClient } from "./_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Registro de auditoria" };

export default async function AuditPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app");
  const idioma = user.idioma;
  if (!(user.is_platform_admin && !user.support) && ROLE_RANK[activeOrg.role] < ROLE_RANK.manager) {
    redirect("/403");
  }
  const t = (texto: string) => traduzir(texto, user.idioma);

  return (
    <div className="acelera-page acelera-audit-page flex h-full flex-col gap-6">
      <header className="acelera-audit-heading">
        <span>{t("Governança da organização")}</span>
        <h1 className="text-2xl font-semibold tracking-tight">{t("Registro de auditoria")}</h1>
        <p className="text-sm text-muted-foreground">
          {traduzir(
            "Histórico imutável de alterações na organização. Acesso para gerentes e superiores.",
            idioma,
          )}
        </p>
      </header>
      <AuditClient />
    </div>
  );
}
