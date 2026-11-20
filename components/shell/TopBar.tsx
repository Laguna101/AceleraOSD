"use client";
import { AlertsBell } from "./AlertsBell";
import { MobileSidebar } from "./MobileSidebar";
import { TenantSwitcher } from "./TenantSwitcher";
import { UserMenu } from "./UserMenu";
import { SearchTrigger } from "./SearchTrigger";
import { usePathname } from "next/navigation";
import { NAV_DESTINATIONS, NAV_GROUPS } from "@/lib/navigation/registry";
import { useT } from "@/hooks/i18n/useT";

export function TopBar() {
  const pathname = usePathname();
  const t = useT();
  const destination = NAV_DESTINATIONS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  const group = NAV_GROUPS.find((item) => item.id === destination?.group);
  return (
    <header className="acelera-topbar sticky top-0 z-20 flex h-[72px] items-center justify-between gap-2 border-b bg-background px-3 md:gap-4 md:px-8">
      <div className="flex min-w-0 items-center gap-2">
        <MobileSidebar />
        <TenantSwitcher />
        {destination && (
          <div className="acelera-breadcrumb hidden min-w-0 items-center gap-3 lg:flex" aria-label={t("Página atual")}>
            <span>{destination.href === "/app/metrics" ? t("Visão geral") : group ? t(group.label) : "AceleraOS"}</span>
            <span aria-hidden="true">/</span>
            <span className="truncate">{t(destination.label)}</span>
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 justify-center md:max-w-md">
        <SearchTrigger />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <AlertsBell />
        <UserMenu />
      </div>
    </header>
  );
}
