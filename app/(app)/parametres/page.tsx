"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
  Upload,
  Wifi,
} from "lucide-react";
import { useConsole } from "@/components/console/console-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NICHE_CATEGORIES, DEFAULT_CATEGORIES } from "@/lib/console/constants";
import { exportWorkspace, importWorkspace } from "@/lib/console/workspace";
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

  // Test de connexion du mode hybride (Ollama + SearXNG).
  const [hybridStatus, setHybridStatus] = useState<{
    ollama: boolean;
    searxng: boolean;
  } | null>(null);
  const [testingHybrid, setTestingHybrid] = useState(false);
  function testHybrid() {
    setTestingHybrid(true);
    fetch("/api/hybrid/status")
      .then((r) => r.json())
      .then((d) => setHybridStatus({ ollama: !!d.ollama, searxng: !!d.searxng }))
      .catch(() => setHybridStatus({ ollama: false, searxng: false }))
      .finally(() => setTestingHybrid(false));
  }

  function setProvider(p: Provider) {
    setSettings((s) => ({ ...s, provider: p }));
  }

  // Export / import du workspace.
  const fileRef = useRef<HTMLInputElement>(null);
  const [dataMsg, setDataMsg] = useState("");
  const [dataErr, setDataErr] = useState("");
  function doExport() {
    const payload = exportWorkspace(new Date().toISOString());
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `console-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setDataMsg("");
    setDataErr("");
    try {
      const count = importWorkspace(JSON.parse(await file.text()));
      setDataMsg(t("dataImported", { count }));
      setTimeout(() => window.location.reload(), 800);
    } catch {
      setDataErr(t("dataError"));
    }
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

          {provider === "hybrid" && (
            <div className="mt-4 flex flex-wrap items-center gap-4 border-t pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={testHybrid}
                disabled={testingHybrid}
              >
                {testingHybrid ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Wifi className="h-4 w-4" />
                )}
                {testingHybrid ? t("testing") : t("testConnection")}
              </Button>
              {hybridStatus &&
                (
                  [
                    ["Ollama", hybridStatus.ollama],
                    ["SearXNG", hybridStatus.searxng],
                  ] as [string, boolean][]
                ).map(([name, ok]) => (
                  <span
                    key={name}
                    className="inline-flex items-center gap-1.5 text-sm"
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${ok ? "bg-risk-low" : "bg-risk-high"}`}
                    />
                    {name} — {ok ? t("statusOnline") : t("statusOffline")}
                  </span>
                ))}
            </div>
          )}
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
              {usage.lastCostUsd > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("usageLast")}
                  </p>
                  <p className="mt-1 text-sm tabular-nums">
                    {new Intl.NumberFormat(locale, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 4,
                    }).format(usage.lastCostUsd)}
                  </p>
                </div>
              )}
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

          <div className="mt-4 flex flex-wrap items-end gap-4 border-t pt-4">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("usageBudget")}
              </span>
              <input
                type="number"
                min={0}
                step="0.5"
                value={settings.budgetUsd ?? 0}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    budgetUsd: Math.max(0, parseFloat(e.target.value) || 0),
                  }))
                }
                className="mt-1 h-10 w-28 rounded-xl border bg-card px-3 text-sm tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <p className="max-w-md text-xs text-muted-foreground">
              {t("usageBudgetHint")}
            </p>
            {(settings.budgetUsd ?? 0) > 0 &&
              usage.costUsd >= (settings.budgetUsd ?? 0) && (
                <span className="text-sm font-semibold text-risk-high">
                  {t("usageOver")}
                </span>
              )}
          </div>
        </CardContent>
      </Card>

      {/* Sauvegarde / import du workspace */}
      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-bold tracking-tight">
            {t("dataTitle")}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("dataHint")}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={doExport}>
              <Download className="h-4 w-4" />
              {t("dataExport")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {t("dataImport")}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={onImportFile}
            />
            {dataMsg && <span className="text-sm text-risk-low">{dataMsg}</span>}
            {dataErr && <span className="text-sm text-risk-high">{dataErr}</span>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
