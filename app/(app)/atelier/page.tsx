"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useConsole } from "@/components/console/console-provider";
import { IdeaCard } from "@/components/console/atelier/idea-card";
import { VideoSheetView } from "@/components/console/atelier/video-sheet";
import { SlideshowView } from "@/components/console/atelier/slideshow";
import {
  FormatToggle,
  type BatchFormat,
} from "@/components/console/atelier/format-toggle";
import { callClaude, extractJSON, parseIdeas } from "@/lib/console/claude";
import {
  PLATFORMS,
  PRESET_NICHES,
  VISUAL_CONSTRAINT,
  LITERAL_TEXT_RULE,
} from "@/lib/console/constants";
import { cn } from "@/lib/utils";
import type {
  FormatType,
  Idea,
  PipelineItem,
  Slideshow,
  VideoSheet,
} from "@/lib/console/types";

export default function AtelierPage() {
  const t = useTranslations("atelier");
  const { niches, setItems, seed, setSeed, settings } = useConsole();

  // Bloc « ton idée à toi »
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<string>(PLATFORMS[0]);
  const [dur, setDur] = useState("60");
  const [format, setFormat] = useState<FormatType>("video");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [sheet, setSheet] = useState<VideoSheet | null>(null);
  const [slides, setSlides] = useState<Slideshow | null>(null);

  // Générateur de lot
  const liveNiches = niches.map((n) => n.nom).filter(Boolean);
  const allNiches = Array.from(new Set([...liveNiches, ...PRESET_NICHES]));
  const [batchNiche, setBatchNiche] = useState(allNiches[0] ?? PRESET_NICHES[0]);
  const [batchFormat, setBatchFormat] = useState<BatchFormat>("video");
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasErr, setIdeasErr] = useState("");

  // Idée du lot en cours de génération (pour le retour visuel sur son bouton).
  const [genIdx, setGenIdx] = useState<number | null>(null);
  // Pour faire défiler vers le résultat dès qu'il apparaît.
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sheet || slides) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [sheet, slides]);

  // Handoff depuis le Radar : pré-remplir puis consommer le seed.
  useEffect(() => {
    if (seed) {
      setNiche(seed.nom ?? "");
      setTopic(seed.angle ?? "");
      setSeed(null);
    }
  }, [seed, setSeed]);

  function addToPipeline(title: string, nicheValue: string) {
    const item: PipelineItem = {
      id: Date.now(),
      title,
      platform,
      niche: nicheValue,
      stage: "script",
      views: "",
      revenue: "",
      date: "",
      retention: "",
    };
    setItems((prev) => [item, ...prev]);
  }

  async function generateIdeas() {
    setIdeasLoading(true);
    setIdeasErr("");
    setIdeas([]);
    setSheet(null);
    setSlides(null);
    const fmtLine =
      batchFormat === "mixte"
        ? `Mélange vidéos et diaporamas : pour chaque idée, choisis le format le plus pertinent et indique-le dans le champ "type" ("video" ou "diaporama").`
        : `Toutes les idées sont au format ${batchFormat === "diaporama" ? "diaporama (carrousel)" : "vidéo courte"}. Mets "type":"${batchFormat}" pour chaque idée.`;
    const prompt = `Tu es scénariste de contenus courts faceless qui RESPECTENT les règles d'authenticité des plateformes (pas de slop).
Niche : ${batchNiche}. Plateforme : ${platform}.
${fmtLine}
${VISUAL_CONSTRAINT}
Donne ${settings.batchCount} idées distinctes et concrètes, à fort potentiel de rétention, avec un vrai angle humain.
Réponds UNIQUEMENT par un tableau JSON de ${settings.batchCount} objets, sans texte ni backticks. Sois TRÈS concis pour tout faire tenir.
Champs : "titre" (court, accrocheur), "type" ("video" ou "diaporama"), "hook" (phrase d'accroche courte), "angle" (l'apport humain, court).`;
    try {
      const txt = await callClaude(prompt, { model: settings.model });
      const json = parseIdeas(txt);
      if (!json || !Array.isArray(json) || json.length === 0)
        throw new Error("parse");
      let list = json as Idea[];
      list =
        batchFormat === "mixte"
          ? list.map((it) => ({
              ...it,
              type: it.type === "diaporama" ? "diaporama" : "video",
            }))
          : list.map((it) => ({ ...it, type: batchFormat }));
      setIdeas(list);
    } catch {
      setIdeasErr(t("batch.error"));
    } finally {
      setIdeasLoading(false);
    }
  }

  async function generate(overrideTopic?: string, overrideFormat?: FormatType) {
    const subject = (overrideTopic ?? topic).trim();
    const fmt = overrideFormat ?? format;
    if (!subject) {
      setErr(t("custom.errorEmpty"));
      return;
    }
    setLoading(true);
    setErr("");
    setSheet(null);
    setSlides(null);
    const nicheForPrompt = niche || batchNiche || "(libre)";
    const videoPrompt = `Tu es scénariste de vidéos courtes virales qui RESPECTENT les règles d'authenticité des plateformes (pas de slop).
Crée une fiche de production pour une vidéo.
Niche: ${nicheForPrompt} | Sujet/angle: ${subject} | Plateforme: ${platform} | Durée cible: ${dur}s.
${VISUAL_CONSTRAINT}
${LITERAL_TEXT_RULE}
Réponds UNIQUEMENT par un objet JSON, sans texte ni backticks. Champs (français) :
"titre" (accrocheur), "hook" (la phrase des 3 premières secondes), "hooks_alt" (tableau de 2 variantes d'accroche différentes, à tester en A/B),
"script" (tableau de 3 à 5 objets {temps:"0-5s", voix:"texte voix off", visuel:"capture d'écran d'outil réel ou schéma simple — JAMAIS de personne ni de mise en scène", texte_ecran:"overlay"}),
"cta" (appel à l'action de fin), "description" (legende publication courte), "hashtags" (tableau de 5 strings sans #),
"angle_humain" (1 phrase: l'apport humain/original qui évite la démonétisation),
"divulgation" (string: rappel si contenu IA réaliste à déclarer, sinon "Non requis ici").`;
    const slidePrompt = `Tu es créateur de carrousels (diaporamas) viraux pour réseaux sociaux, format idéal pour les tutos IA (captures annotées).
Crée la structure d'un carrousel.
Niche: ${nicheForPrompt} | Sujet/angle: ${subject} | Plateforme: ${platform}.
${VISUAL_CONSTRAINT}
${LITERAL_TEXT_RULE}
Réponds UNIQUEMENT par un objet JSON, sans texte ni backticks. Champs (français) :
"titre" (court), "slides" (tableau de 6 à 8 objets {texte:"le texte EXACT à mettre sur la slide, court et percutant", visuel:"capture d'écran d'outil réel ou schéma simple à montrer — JAMAIS de personne ni de mise en scène"} ; la slide 1 = le hook visuel, la dernière = le CTA),
"description" (légende de publication courte), "hashtags" (tableau de 5 strings sans #),
"angle_humain" (1 phrase: l'apport humain qui évite le 'contenu non authentique').`;
    try {
      const txt = await callClaude(fmt === "diaporama" ? slidePrompt : videoPrompt, {
        model: settings.model,
      });
      const json = extractJSON(txt);
      if (!json) throw new Error("parse");
      if (fmt === "diaporama") setSlides(json as Slideshow);
      else setSheet(json as VideoSheet);
    } catch {
      setErr(t("custom.error"));
    } finally {
      setLoading(false);
      setGenIdx(null);
    }
  }

  function scriptFromIdea(idea: Idea) {
    const subject = idea.titre + (idea.angle ? " — " + idea.angle : "");
    const fmt: FormatType = idea.type === "diaporama" ? "diaporama" : "video";
    setFormat(fmt);
    setNiche(batchNiche);
    setTopic(subject);
    generate(subject, fmt);
  }

  const selectClass =
    "h-10 rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

  return (
    <div className="space-y-6">
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
      </section>

      {/* Bloc A — générateur de lot */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("batch.eyebrow", { count: settings.batchCount })}
          </p>

          <FormatToggle
            options={["video", "diaporama", "mixte"]}
            value={batchFormat}
            onChange={setBatchFormat}
          />

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label={t("nicheLabel")}
              value={batchNiche}
              onChange={(e) => setBatchNiche(e.target.value)}
              className={cn(selectClass, "min-w-[200px] flex-1")}
            >
              {allNiches.map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
            <select
              aria-label={t("platformLabel")}
              value={platform}
              onChange={(e) => setPlatform(e.target.value)}
              className={cn(selectClass, "w-40")}
            >
              {PLATFORMS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
            <Button variant="ink" onClick={generateIdeas} disabled={ideasLoading}>
              {ideasLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {ideasLoading
                ? t("batch.generating")
                : t("batch.generate", { count: settings.batchCount })}
            </Button>
          </div>

          {ideasErr && <p className="text-sm text-risk-high">{ideasErr}</p>}

          {ideas.length > 0 ? (
            <div className="grid gap-2">
              {ideas.map((idea, i) => (
                <IdeaCard
                  key={i}
                  idea={idea}
                  index={i}
                  busy={genIdx === i}
                  disabled={loading}
                  onScript={(it) => {
                    setGenIdx(i);
                    scriptFromIdea(it);
                  }}
                  onAddPipeline={(it) => addToPipeline(it.titre, batchNiche)}
                />
              ))}
            </div>
          ) : (
            !ideasLoading &&
            !ideasErr && (
              <p className="text-sm text-muted-foreground">{t("batch.empty")}</p>
            )
          )}
        </CardContent>
      </Card>

      {/* séparateur */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("or")}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Bloc B — ton idée à toi */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("custom.eyebrow")}
            </p>
            <h3 className="mt-1 text-lg font-extrabold tracking-tight">
              {t("custom.title")}
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("custom.subtitle")}
            </p>
          </div>

          <FormatToggle
            options={["video", "diaporama"]}
            value={format}
            onChange={(v) => setFormat(v as FormatType)}
          />

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("custom.topicLabel")}
            </span>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && generate()}
              placeholder={t("custom.topicPlaceholder")}
              className={cn(selectClass, "mt-1 w-full")}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("nicheLabel")}
              </span>
              <input
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                placeholder={t("custom.nichePlaceholder")}
                className={cn(selectClass, "mt-1 w-full")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("platformLabel")}
              </span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className={cn(selectClass, "mt-1 w-full")}
              >
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {format === "video" && (
              <label className="block">
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("custom.durationLabel")}
                </span>
                <input
                  inputMode="numeric"
                  value={dur}
                  onChange={(e) => setDur(e.target.value.replace(/\D/g, ""))}
                  className={cn(selectClass, "mt-1 w-24")}
                />
              </label>
            )}
            <Button variant="ink" onClick={() => generate()} disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {loading
                ? t("custom.generating")
                : format === "diaporama"
                  ? t("custom.generateSlideshow")
                  : t("custom.generateVideo")}
            </Button>
          </div>

          {err && <p className="text-sm text-risk-high">{err}</p>}
        </CardContent>
      </Card>

      <div ref={resultRef} className="scroll-mt-6 space-y-6 empty:hidden">
        {sheet && (
          <VideoSheetView
            sheet={sheet}
            onAddPipeline={() => addToPipeline(sheet.titre, niche)}
          />
        )}
        {slides && (
          <SlideshowView
            show={slides}
            onAddPipeline={() => addToPipeline(slides.titre, niche)}
          />
        )}
      </div>
    </div>
  );
}
