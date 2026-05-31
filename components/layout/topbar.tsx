import { getTranslations } from "next-intl/server";
import { Bell, FileText, Plus, Search, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/layout/lang-switch";
import { logout } from "@/actions/auth";

export async function Topbar({ name }: { name: string }) {
  const t = await getTranslations();

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">
          {t("dashboard.welcome", { name })}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("dashboard.subtitle")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder={t("common.search")}
            className="h-10 w-full rounded-xl border bg-card pl-9 pr-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-56"
          />
        </div>

        <LangSwitch />

        <Button variant="outline" size="icon" aria-label="notes">
          <FileText className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" aria-label="notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <Button>
          <Plus className="h-4 w-4" />
          {t("common.newProject")}
        </Button>

        <form action={logout}>
          <Button variant="ghost" size="icon" aria-label={t("common.logout")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
