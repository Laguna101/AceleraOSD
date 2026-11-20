import { redirect } from "next/navigation";

/** Mantém o endereço histórico e leva a demonstração ao design vigente. */
export default function DesignShowcasePage() {
  redirect("/design-preview");
}
