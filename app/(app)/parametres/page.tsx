"use client";

import { useTranslations } from "next-intl";
import { useConsole } from "@/components/console/console-provider";
import { Card, CardContent } from "@/components/ui/card";
import { NICHE_CATEGORIES, DEFAULT_CATEGORIES } from "@/lib/console/constants";

export default function ParametresPage() {
  const t = useTranslations("parametres");
  const { settings, setSettings } = useConsole();

  // Anciens réglages persistés sans `categories` -> on retombe sur le défaut.
  const selected = settings.categories ?? DEFAULT_CATEGORIES;

  function toggle(category: string) {
    setSettings((s) => {
      const current = s.categories ?? DEFAULT_CATEGORIES;
      const next = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...s, categories: next };
    });
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </section>

      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-bold tracking-tight">
            {t("categoriesTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("categoriesHint")}
          </p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {NICHE_CATEGORIES.map((category) => (
              <label
                key={category}
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(category)}
                  onChange={() => toggle(category)}
                  className="h-4 w-4 cursor-pointer rounded border accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span>{category}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
