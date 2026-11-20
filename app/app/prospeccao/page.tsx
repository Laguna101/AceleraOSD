import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAuth, resolveActiveOrg } from "@/lib/auth/server";
import { ContactsListClient } from "@/app/app/contacts/_client";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Prospecção de condomínios" };

/**
 * Visão de prospecção construída sobre os contatos existentes. O filtro usa a
 * tag estável `condominio`; assim a tela não inventa campos imobiliários que o
 * contrato de contatos atual não possui.
 */
export default async function ProspeccaoPage() {
  const user = await requireAuth();
  const activeOrg = await resolveActiveOrg(user);
  if (!activeOrg) redirect("/app");

  return <ContactsListClient modo="prospeccao-condominios" />;
}
