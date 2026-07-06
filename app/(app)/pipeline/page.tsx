"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpDown, ChevronLeft, ChevronRight, Download, Plus, Wand2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarChart } from "@/components/charts/bar-chart";
import { useConsole } from "@/components/console/console-provider";
import { PLATFORMS, STAGES } from "@/lib/console/constants";
import { cn } from "@/lib/utils";
import type { PipelineItem } from "@/lib/console/types";

type PerfMetric = "views" | "revenue" | "retention";

const FIELD =
  "h-10 rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const MINI =
  "w-full rounded-lg border bg-card px-2 py-1 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function PipelinePage() {
  const t = useTranslations("pipeline");
  const locale = useLocale();
  const router = useRouter();
  const { items, setItems, settings, favorites, setAtelierSeed } = useConsole();

  // La carte a-t-elle déjà un script (favori vidéo/diaporama de même titre) ?
  function hasScript(title: string) {
    return favorites.some(
      (f) =>
        (f.kind === "video" && f.sheet.titre === title) ||
        (f.kind === "slideshow" && f.show.titre === title),
    );
  }
  // Développer une carte en script : pré-remplit l'Atelier et y navigue.
  function develop(it: PipelineItem) {
    setAtelierSeed({ topic: it.title, niche: it.niche || "" });
    router.push("/atelier");
  }

  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [sortPerf, setSortPerf] = useState(false);
  const [perfMetric, setPerfMetric] = useState<PerfMetric>("views");

  const weekGoal = settings.weekGoal ?? 3;

  function add() {
    if (!title.trim()) return;
    const item: PipelineItem = {
      id: Date.now(),
      title: title.trim(),
      platform,
      niche: "",
      stage: "idee",
      views: "",
      revenue: "",
      date: "",
      retention: "",
    };
    setItems((prev) => [item, ...prev]);
    setTitle("");
  }
  function update(id: number, patch: Partial<PipelineItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }
  function remove(id: number) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  const published = items.filter((i) => i.stage === "publiee");
  const totViews = published.reduce((a, i) => a + (parseInt(i.views) || 0), 0);
  const totRev = published.reduce((a, i) => a + (parseFloat(i.revenue) || 0), 0);
  const retVals = published
    .map((i) => parseFloat(i.retention))
    .filter((x) => !isNaN(x));
  const avgRet = retVals.length
    ? Math.round(retVals.reduce((a, b) => a + b, 0) / retVals.length)
    : null;

  const weekAgo = Date.now() - 7 * 864e5;
  const weekCount = published.filter(
    (i) => i.date && new Date(i.date).getTime() >= weekAgo,
  ).length;

  const nf = new Intl.NumberFormat(locale);
  const cf = new Intl.NumberFormat(locale, { style: "currency", currency: "EUR" });

  function exportCSV() {
    const head = [
      "titre", "plateforme", "niche", "etape", "date", "vues", "retention_%", "revenu_eur",
    ];
    const rows = items.map((i) => [
      i.title, i.platform, i.niche, i.stage, i.date || "", i.views || "", i.retention || "", i.revenue || "",
    ]);
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    const csv = [head, ...rows].map((r) => r.map(esc).join(",")).join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "pipeline.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const goalReached = weekCount >= weekGoal;

  // Données du graphique de performance (vidéos publiées, top 8 selon la métrique).
  function metricValue(i: PipelineItem, m: PerfMetric) {
    if (m === "views") return parseInt(i.views) || 0;
    if (m === "revenue") return parseFloat(i.revenue) || 0;
    return parseFloat(i.retention) || 0;
  }
  const perfItems = [...published]
    .map((i) => ({ label: i.title, value: metricValue(i, perfMetric) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  return (
    <div className="space-y-5">
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      {/* Stats */}
      <div className="flex flex-wrap items-end gap-6">
        <Stat k={t("stats.published")} v={String(published.length)} />
        <Stat k={t("stats.views")} v={nf.format(totViews)} />
        <Stat
          k={t("stats.retention")}
          v={avgRet === null ? "—" : `${avgRet} %`}
          className="text-risk-medium"
        />
        <Stat k={t("stats.revenue")} v={cf.format(totRev)} className="text-risk-low" />
        <Button variant="outline" className="ml-auto" onClick={exportCSV}>
          <Download className="h-4 w-4" />
          {t("exportCsv")}
        </Button>
      </div>

      {/* Performance des vidéos publiées */}
      {perfItems.length > 0 && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("perfTitle")}
            </p>
            <div className="flex gap-1.5">
              {(
                [
                  ["views", "perfViews"],
                  ["revenue", "perfRevenue"],
                  ["retention", "perfRetention"],
                ] as [PerfMetric, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPerfMetric(m)}
                  className={cn(
                    "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                    perfMetric === m
                      ? "border-ink bg-ink text-ink-foreground"
                      : "bg-card text-muted-foreground hover:bg-muted",
                  )}
                >
                  {t(label)}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3">
            <BarChart
              labels={perfItems.map((p) =>
                p.label.length > 18 ? p.label.slice(0, 18) + "…" : p.label,
              )}
              series={[{ data: perfItems.map((p) => p.value) }]}
              height={220}
            />
          </div>
        </div>
      )}

      {/* Objectif régularité + tri */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-[220px] flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("weekGoal")}
          </p>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  goalReached ? "bg-risk-low" : "bg-ink",
                )}
                style={{
                  width: `${Math.min(100, (weekCount / weekGoal) * 100)}%`,
                }}
              />
            </div>
            <span
              className={cn(
                "text-xs tabular-nums",
                goalReached ? "text-risk-low" : "text-muted-foreground",
              )}
            >
              {weekCount} / {weekGoal}
            </span>
          </div>
        </div>
        <Button
          variant={sortPerf ? "ink" : "outline"}
          size="sm"
          onClick={() => setSortPerf((v) => !v)}
        >
          <ArrowUpDown className="h-4 w-4" />
          {sortPerf ? t("sortPerfOn") : t("sortPerf")}
        </Button>
      </div>

      {/* Ajout */}
      <div className="flex flex-wrap gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder={t("addPlaceholder")}
          className={cn(FIELD, "min-w-[220px] flex-1")}
        />
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className={cn(FIELD, "w-40")}
        >
          {PLATFORMS.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <Button variant="ink" onClick={add}>
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      {/* Kanban */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((stage) => {
          let col = items.filter((i) => i.stage === stage);
          if (stage === "publiee" && sortPerf) {
            col = [...col].sort((a, b) => {
              const ra = parseFloat(a.retention) || -1;
              const rb = parseFloat(b.retention) || -1;
              if (rb !== ra) return rb - ra;
              return (parseInt(b.views) || 0) - (parseInt(a.views) || 0);
            });
          }
          const isPub = stage === "publiee";
          return (
            <div
              key={stage}
              className="min-h-[120px] rounded-xl border bg-muted/40 p-3"
            >
              <div className="mb-3 flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isPub ? "bg-risk-low" : "bg-border",
                  )}
                />
                <span className="text-sm font-semibold">
                  {t(`stages.${stage}`)}
                </span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground">
                  {col.length}
                </span>
              </div>

              <div className="grid gap-2">
                {col.map((it) => {
                  const idx = STAGES.indexOf(it.stage as (typeof STAGES)[number]);
                  return (
                    <div
                      key={it.id}
                      className="rounded-lg border bg-card p-2.5"
                    >
                      <div className="text-sm leading-snug">{it.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{it.platform}</span>
                        {hasScript(it.title) && (
                          <span className="rounded border px-1.5 py-0.5 text-[10px] font-semibold text-format-video">
                            {t("scriptBadge")}
                          </span>
                        )}
                      </div>

                      {isPub && (
                        <div className="mt-2 grid gap-1.5">
                          <input
                            type="date"
                            value={it.date || ""}
                            onChange={(e) => update(it.id, { date: e.target.value })}
                            className={MINI}
                          />
                          <div className="flex gap-1.5">
                            <input
                              value={it.views}
                              onChange={(e) =>
                                update(it.id, {
                                  views: e.target.value.replace(/\D/g, ""),
                                })
                              }
                              placeholder={t("card.views")}
                              className={MINI}
                            />
                            <input
                              value={it.retention}
                              onChange={(e) =>
                                update(it.id, {
                                  retention: e.target.value.replace(/[^\d]/g, ""),
                                })
                              }
                              placeholder={t("card.retention")}
                              className={MINI}
                            />
                          </div>
                          <input
                            value={it.revenue}
                            onChange={(e) =>
                              update(it.id, {
                                revenue: e.target.value.replace(/[^\d.]/g, ""),
                              })
                            }
                            placeholder={t("card.revenue")}
                            className={MINI}
                          />
                        </div>
                      )}

                      <div className="mt-2 flex items-center gap-1">
                        {idx > 0 && (
                          <button
                            type="button"
                            aria-label="précédent"
                            onClick={() => update(it.id, { stage: STAGES[idx - 1] })}
                            className="cursor-pointer rounded-md border p-1 text-muted-foreground hover:bg-muted"
                          >
                            <ChevronLeft className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {idx < STAGES.length - 1 && (
                          <button
                            type="button"
                            aria-label="suivant"
                            onClick={() => update(it.id, { stage: STAGES[idx + 1] })}
                            className="cursor-pointer rounded-md border p-1 text-muted-foreground hover:bg-muted"
                          >
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={t("develop")}
                          title={t("develop")}
                          onClick={() => develop(it)}
                          className="ml-auto cursor-pointer rounded-md border p-1 text-muted-foreground hover:bg-muted"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          aria-label="supprimer"
                          onClick={() => remove(it.id)}
                          className="cursor-pointer rounded-md border p-1 text-risk-high hover:bg-muted"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  k,
  v,
  className,
}: {
  k: string;
  v: string;
  className?: string;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {k}
      </p>
      <p className={cn("mt-1 text-2xl font-extrabold tabular-nums", className)}>
        {v}
      </p>
    </div>
  );
}
