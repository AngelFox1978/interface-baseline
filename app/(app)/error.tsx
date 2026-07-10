"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Error boundary des pages protégées : rend à la place de la page en erreur,
// en conservant la coquille (sidebar + topbar). `reset` retente le rendu.
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errorPage");

  return (
    <div className="rounded-3xl border bg-card p-10 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t("kicker")}
      </p>
      <h2 className="mt-2 text-2xl font-extrabold tracking-tight">
        {t("title")}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      <Button size="sm" className="mt-6" onClick={reset}>
        <RotateCcw className="h-4 w-4" />
        {t("retry")}
      </Button>
    </div>
  );
}
