"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Minus, Plus, RefreshCw, RotateCcw } from "lucide-react";
import { useConsole } from "@/components/console/console-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NICHE_CATEGORIES, DEFAULT_CATEGORIES } from "@/lib/console/constants";
import {
  MODELS,
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_MODEL,
  OLLAMA_FALLBACK_MODELS,
} from "@/lib/console/models";
import type { Provider } from "@/lib/console/types";

export default function ParametresPage() {
  const t = useTranslations("parametres");
  const locale = useLocale();
  const { settings, setSettings, usage, resetUsage } = useConsole();

  // Anciens réglages persistés sans certains champs -> on retombe sur le défaut.
  const selected = settings.categories ?? DEFAULT_CATEGORIES;
  const model = settings.model ?? DEFAULT_MODEL;
  const provider: Provider = settings.provider ?? "anthropic";
  const ollamaModel = settings.ollamaModel ?? DEFAULT_OLLAMA_MODEL;

  // Modèles Ollama réellement installés sur la machine courante (mode hybride).
  const [ollamaModels, setOllamaModels] = useState<string[]>(
    OLLAMA_FALLBACK_MODELS,
  );
  const [ollamaLoading, setOllamaLoading] = useState(false);

  function loadOllamaModels() {
    setOllamaLoading(true);
    fetch("/api/ollama/models")
      .then((r) => r.json())
      // Liste faisant autorité : on affiche exactement ce qui est installé
      // maintenant (tableau vide = Ollama éteint ou aucun modèle).
      .then((d) => {
        if (Array.isArray(d.models)) setOllamaModels(d.models);
      })
      .catch(() => {})
      .finally(() => setOllamaLoading(false));
  }
  useEffect(() => {
    loadOllamaModels();
  }, []);

  function setProvider(p: Provider) {
    setSettings((s) => ({ ...s, provider: p }));
  }
  function setOllamaModel(m: string) {
    setSettings((s) => ({ ...s, ollamaModel: m }));
  }

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

      {/* Fournisseur d'IA */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-bold tracking-tight">
            {t("providerTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("providerHint")}
          </p>
          <div className="mt-4 grid gap-2">
            {(
              [
                ["anthropic", t("providerAnthropic")],
                ["hybrid", t("providerHybrid")],
              ] as [Provider, string][]
            ).map(([id, label]) => (
              <label
                key={id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <input
                  type="radio"
                  name="provider"
                  value={id}
                  checked={provider === id}
                  onChange={() => setProvider(id)}
                  className="h-4 w-4 cursor-pointer accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

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

      {provider === "anthropic" ? (
        <Card>
          <CardContent className="pt-5">
            <h3 className="text-base font-bold tracking-tight">
              {t("modelTitle")}
            </h3>
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
      ) : (
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold tracking-tight">
                  {t("ollamaModelTitle")}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t("ollamaModelHint")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadOllamaModels}
                disabled={ollamaLoading}
              >
                {ollamaLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("ollamaRefresh")}
              </Button>
            </div>

            {ollamaModels.length === 0 ? (
              <p className="mt-4 text-sm text-risk-high">{t("ollamaEmpty")}</p>
            ) : (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {ollamaModels.map((m) => (
                  <label
                    key={m}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name="ollamaModel"
                      value={m}
                      checked={ollamaModel === m}
                      onChange={() => setOllamaModel(m)}
                      className="h-4 w-4 cursor-pointer accent-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <span>{m}</span>
                  </label>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Consommation Anthropic (estimation) */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-bold tracking-tight">
                {t("usageTitle")}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                {t("usageHint")}
              </p>
            </div>
            {(usage.costUsd > 0 || usage.since) && (
              <Button variant="outline" size="sm" onClick={resetUsage}>
                <RotateCcw className="h-4 w-4" />
                {t("usageReset")}
              </Button>
            )}
          </div>

          {usage.costUsd === 0 && !usage.since ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("usageEmpty")}
            </p>
          ) : (
            <div className="mt-4 flex flex-wrap items-end gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("usageCost")}
                </p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">
                  {new Intl.NumberFormat(locale, {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 4,
                  }).format(usage.costUsd)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("usageTokens")}
                </p>
                <p className="mt-1 text-sm tabular-nums">
                  {new Intl.NumberFormat(locale).format(usage.inputTokens)} /{" "}
                  {new Intl.NumberFormat(locale).format(usage.outputTokens)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("usageSearches")}
                </p>
                <p className="mt-1 text-sm tabular-nums">
                  {new Intl.NumberFormat(locale).format(usage.webSearches)}
                </p>
              </div>
              {usage.since && (
                <p className="text-xs text-muted-foreground">
                  {t("usageSince", {
                    date: new Date(usage.since).toLocaleDateString(locale),
                  })}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
