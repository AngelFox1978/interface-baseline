"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Loader2, Radar, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConsole } from "@/components/console/console-provider";
import { NicheCard } from "@/components/console/radar/niche-card";
import { ToolCard } from "@/components/console/radar/tool-card";
import { callClaude, extractJSON } from "@/lib/console/claude";
import { NICHE_CATEGORIES } from "@/lib/console/constants";
import type { Niche, Tool } from "@/lib/console/types";

export default function RadarPage() {
  const t = useTranslations("radar");
  const locale = useLocale();
  const router = useRouter();
  // Niches ET outils viennent du provider (persistés) : au montage on affiche
  // le dernier résultat sauvegardé, sans relancer aucun appel.
  const {
    niches,
    setNiches,
    nichesAt,
    setNichesAt,
    tools,
    setTools,
    toolsAt,
    setToolsAt,
    setSeed,
    settings,
  } = useConsole();

  // Les états transients (en cours / erreur) restent locaux, non persistés.
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsErr, setToolsErr] = useState("");

  // « Scanné il y a … » — formaté selon la locale, calculé au rendu.
  function scannedAgo(ts: number) {
    const diff = ts - Date.now(); // négatif (passé)
    const abs = Math.abs(diff);
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    const MIN = 60_000;
    const HOUR = 3_600_000;
    const DAY = 86_400_000;
    let rel: string;
    if (abs < MIN) rel = rtf.format(Math.round(diff / 1000), "second");
    else if (abs < HOUR) rel = rtf.format(Math.round(diff / MIN), "minute");
    else if (abs < DAY) rel = rtf.format(Math.round(diff / HOUR), "hour");
    else rel = rtf.format(Math.round(diff / DAY), "day");
    return t("scannedAgo", { time: rel });
  }

  async function scanNiches() {
    setLoading(true);
    setErr("");
    setNiches([]);
    // [] (tout décoché) ou ancien réglage sans catégories -> toutes.
    const selectedCats = settings.categories?.length
      ? settings.categories
      : [...NICHE_CATEGORIES];
    const prompt = `Tu es analyste de tendances pour créateurs de vidéos courtes IA "faceless".
Recherche sur le web les niches porteuses MAINTENANT pour des chaînes faceless/IA sur TikTok et YouTube Shorts (France/Europe).
Restreins-toi STRICTEMENT à ces catégories : ${selectedCats.join(" ; ")}.
Réponds UNIQUEMENT par un tableau JSON de ${settings.nicheCount} objets (un top ${settings.nicheCount}), sans aucun texte avant ou après, sans backticks. Champs (français, très concis) :
"nom" (string), "categorie" (exactement l'une des catégories listées ci-dessus, telle quelle), "pourquoi" (1 phrase courte : pourquoi ça marche maintenant), "format" (string court),
"monetisation_fr" (1 phrase : comment ça gagne en France), "risque" ("faible"|"moyen"|"eleve" : risque de démonétisation "slop"),
"angle" (1 exemple d'angle vidéo concret).`;
    try {
      const txt = await callClaude(prompt, {
        search: true,
        model: settings.model,
        provider: settings.provider,
        ollamaModel: settings.ollamaModel,
        searchQuery: `niches porteuses chaînes faceless IA TikTok YouTube Shorts France 2026 ${selectedCats.join(" ")}`,
      });
      const json = extractJSON(txt);
      if (!json || !Array.isArray(json)) throw new Error("parse");
      setNiches(json as Niche[]);
      setNichesAt(Date.now());
    } catch {
      setErr(t("error"));
    } finally {
      setLoading(false);
    }
  }

  async function scanTools() {
    setToolsLoading(true);
    setToolsErr("");
    setTools([]);
    const prompt = `Tu es veilleur d'outils pour créateurs de vidéos courtes et diaporamas faceless (France, 2026).
Recherche sur le web les meilleurs outils du moment, avec leurs évolutions récentes (changements de prix, fonctions devenues payantes, conditions d'utilisation problématiques).
Couvre ces catégories : "Montage", "Voix off", "Visuel / IA", "Sous-titres", "Publication / suivi".
Réponds UNIQUEMENT par un tableau JSON de 8 à 10 objets, sans texte ni backticks. Champs (français, concis) :
"categorie" (une des catégories ci-dessus), "outil" (nom), "pour_quoi" (1 phrase : à quoi ça sert / sa force),
"prix" (ex: "Gratuit", "Gratuit + Pro ~12€/mois", "~24$/mois"), "note" (1 conseil ou piège à connaître, ex: paywall récent, filigrane, droits sur le contenu),
"pertinence" (entier de 1 à 5 évaluant l'outil POUR CE PROJET précis : créateur faceless, tutos IA, petit budget avec gratuit privilégié, France — 5 = indispensable, 1 = peu pertinent).`;
    try {
      const txt = await callClaude(prompt, {
        search: true,
        model: settings.model,
        provider: settings.provider,
        ollamaModel: settings.ollamaModel,
        searchQuery:
          "meilleurs outils créateurs vidéos courtes diaporamas faceless IA montage voix off visuel sous-titres publication prix 2026",
      });
      const json = extractJSON(txt);
      if (!json || !Array.isArray(json)) throw new Error("parse");
      setTools(json as Tool[]);
      setToolsAt(Date.now());
    } catch {
      setToolsErr(t("tools.error"));
    } finally {
      setToolsLoading(false);
    }
  }

  function workNiche(niche: Niche) {
    setSeed(niche);
    router.push("/atelier");
  }

  return (
    <div className="space-y-8">
      {/* Scan 1 — niches */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h2 className="mt-1 text-xl font-extrabold tracking-tight">
          {t("title")}
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="ink" onClick={scanNiches} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Radar className="h-4 w-4" />
            )}
            {loading
              ? t("scanning")
              : niches.length > 0
                ? t("refresh")
                : t("scan")}
          </Button>
          {!loading && nichesAt && (
            <span className="text-xs text-muted-foreground">
              {scannedAgo(nichesAt)}
            </span>
          )}
        </div>

        {err && <p className="mt-3 text-sm text-risk-high">{err}</p>}

        <div className="mt-5 grid gap-3.5">
          {niches.map((niche, i) => (
            <NicheCard key={i} niche={niche} index={i} onWork={workNiche} />
          ))}
        </div>

        {!loading && niches.length === 0 && !err && (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {t("empty")}
            <br />
            <span className="text-xs">{t("emptyHint")}</span>
          </p>
        )}
      </section>

      {/* Scan 2 — veille outils */}
      <section className="border-t pt-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("tools.eyebrow")}
        </p>
        <h3 className="mt-1 text-lg font-extrabold tracking-tight">
          {t("tools.title")}
        </h3>
        <p className="mt-1 max-w-xl text-sm text-muted-foreground">
          {t("tools.subtitle")}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button variant="ink" onClick={scanTools} disabled={toolsLoading}>
            {toolsLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4" />
            )}
            {toolsLoading
              ? t("tools.scanning")
              : tools.length > 0
                ? t("refresh")
                : t("tools.scan")}
          </Button>
          {!toolsLoading && toolsAt && (
            <span className="text-xs text-muted-foreground">
              {scannedAgo(toolsAt)}
            </span>
          )}
        </div>

        {toolsErr && <p className="mt-3 text-sm text-risk-high">{toolsErr}</p>}

        <div className="mt-5 grid gap-3">
          {[...tools]
            .sort((a, b) => (b.pertinence ?? 0) - (a.pertinence ?? 0))
            .map((tool, i) => (
              <ToolCard key={i} tool={tool} />
            ))}
        </div>

        {!toolsLoading && tools.length === 0 && !toolsErr && (
          <p className="mt-4 text-sm text-muted-foreground">{t("tools.empty")}</p>
        )}
      </section>
    </div>
  );
}
