"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import { useConsole } from "@/components/console/console-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NICHE_CATEGORIES, DEFAULT_CATEGORIES } from "@/lib/console/constants";
import { MODELS, DEFAULT_MODEL } from "@/lib/console/models";

export default function ParametresPage() {
  const t = useTranslations("parametres");
  const { settings, setSettings } = useConsole();

  // Anciens réglages persistés sans `categories`/`model` -> on retombe sur le défaut.
  const selected = settings.categories ?? DEFAULT_CATEGORIES;
  const model = settings.model ?? DEFAULT_MODEL;

  function toggle(category: string) {
    setSettings((s) => {
      const current = s.categories ?? DEFAULT_CATEGORIES;
      const next = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category];
      return { ...s, categories: next };
    });
  }

  function setModel(id: string) {
    setSettings((s) => ({ ...s, model: id }));
  }

  // Steppers : valeur bornée [min, max].
  const STEPPERS = [
    { key: "nicheCount", min: 3, max: 15 },
    { key: "batchCount", min: 3, max: 30 },
    { key: "weekGoal", min: 1, max: 14 },
  ] as const;

  function setNum(key: "nicheCount" | "batchCount" | "weekGoal", val: number, min: number, max: number) {
    let n = Number.isNaN(val) ? min : val;
    n = Math.max(min, Math.min(max, n));
    setSettings((s) => ({ ...s, [key]: n }));
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </section>

      <Card>
        <CardContent className="space-y-4 pt-5">
          <div>
            <h3 className="text-base font-bold tracking-tight">
              {t("steppersTitle")}
            </h3>
          </div>
          <div className="grid gap-4">
            {STEPPERS.map(({ key, min, max }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-4"
              >
                <div>
                  <p className="text-sm font-semibold">{t(`${key}Label`)}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t(`${key}Hint`)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="−"
                    onClick={() => setNum(key, settings[key] - 1, min, max)}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <input
                    type="number"
                    min={min}
                    max={max}
                    value={settings[key]}
                    onChange={(e) => setNum(key, parseInt(e.target.value, 10), min, max)}
                    className="h-10 w-14 rounded-xl border bg-card text-center text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="+"
                    onClick={() => setNum(key, settings[key] + 1, min, max)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{t("steppersTip")}</p>
        </CardContent>
      </Card>

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

      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-bold tracking-tight">{t("modelTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("modelHint")}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {MODELS.map((m) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={model === m.id}
                  onChange={() => setModel(m.id)}
                  className="h-4 w-4 cursor-pointer accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
