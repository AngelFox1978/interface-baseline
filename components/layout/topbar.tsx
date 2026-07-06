import { getTranslations } from "next-intl/server";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangSwitch } from "@/components/layout/lang-switch";
import { ThemeToggle } from "@/components/layout/theme-toggle";
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
        <LangSwitch />
        <ThemeToggle />
        <form action={logout}>
          <Button variant="ghost" size="icon" aria-label={t("common.logout")}>
            <LogOut className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
