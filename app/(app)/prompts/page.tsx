"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Globe, Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/console/atelier/copy-button";
import { useConsole } from "@/components/console/console-provider";
import { callClaude, parseIdeas } from "@/lib/console/claude";
import { cn } from "@/lib/utils";

// Forme d'un prompt tel que renvoyé par /api/prompts (table Postgres).
type Prompt = {
  id: number;
  titre: string;
  cible: string | null;
  categorie: string | null;
  prompt_text: string;
  cas_usage: string | null;
  source_url: string | null;
  tags: string[] | null;
  created_at: string;
};

// Un candidat renvoyé par le mode « Découvrir » (avant enregistrement).
type Candidate = {
  titre: string;
  cible?: string;
  categorie?: string;
  prompt_text: string;
  cas_usage?: string;
  source_url?: string;
  tags?: string[];
};

const FIELD =
  "h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

// Cibles proposées dans le sélecteur du mode Découvrir ("" = toutes).
const TARGETS = ["", "Claude", "ChatGPT", "Gemini", "Midjourney"];

// Suggestions de catégories (datalist) — l'utilisateur peut aussi saisir la
// sienne. Localisées selon la langue de l'interface.
const PROMPT_CATEGORIES: Record<string, string[]> = {
  fr: [
    "Rédaction", "Code", "Retouche photo", "Image / illustration", "Marketing",
    "Email", "SEO", "Résumé", "Traduction", "Productivité", "Réseaux sociaux",
    "Analyse de données",
  ],
  en: [
    "Writing", "Code", "Photo editing", "Image / illustration", "Marketing",
    "Email", "SEO", "Summary", "Translation", "Productivity", "Social media",
    "Data analysis",
  ],
};

export default function PromptsPage() {
  const t = useTranslations("prompts");
  const locale = useLocale();
  const { settings } = useConsole();

  const [items, setItems] = useState<Prompt[]>([]);
  const [listErr, setListErr] = useState("");
  const [query, setQuery] = useState("");

  // Champs du formulaire d'ajout
  const [titre, setTitre] = useState("");
  const [cible, setCible] = useState("");
  const [categorie, setCategorie] = useState("");
  const [promptText, setPromptText] = useState("");
  const [casUsage, setCasUsage] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState("");
  const [formErr, setFormErr] = useState("");

  // Mode « Découvrir » (recherche web + curation)
  const [need, setNeed] = useState("");
  // Catégorie : choix dans la liste ("" = toutes, "__other__" = saisie libre).
  const [catChoice, setCatChoice] = useState("");
  const [catCustom, setCatCustom] = useState("");
  const [discTarget, setDiscTarget] = useState("");
  const effectiveCat =
    catChoice === "__other__" ? catCustom.trim() : catChoice.trim();
  const [discovering, setDiscovering] = useState(false);
  const [discErr, setDiscErr] = useState("");
  const [discMsg, setDiscMsg] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [candStatus, setCandStatus] = useState<Record<number, "saved" | "dup">>(
    {},
  );

  async function load() {
    try {
      const r = await fetch("/api/prompts");
      if (!r.ok) throw new Error("HTTP " + r.status);
      setItems((await r.json()) as Prompt[]);
      setListErr("");
    } catch {
      setListErr(t("list.error"));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function add() {
    setFormMsg("");
    setFormErr("");
    if (!titre.trim() || !promptText.trim()) {
      setFormErr(t("form.required"));
      return;
    }
    setSaving(true);
    const payload = [
      {
        titre: titre.trim(),
        cible: cible.trim() || null,
        categorie: categorie.trim() || null,
        prompt_text: promptText.trim(),
        cas_usage: casUsage.trim() || null,
        source_url: sourceUrl.trim() || null,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      },
    ];
    try {
      const r = await fetch("/api/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const { inserts } = (await r.json()) as { recus: number; inserts: number };
      if (inserts > 0) {
        setFormMsg(t("form.added"));
        setTitre("");
        setCible("");
        setCategorie("");
        setPromptText("");
        setCasUsage("");
        setSourceUrl("");
        setTags("");
        await load();
      } else {
        setFormErr(t("form.duplicate"));
      }
    } catch {
      setFormErr(t("list.error"));
    } finally {
      setSaving(false);
    }
  }

  function toPayload(c: Candidate) {
    return {
      titre: c.titre,
      cible: c.cible || null,
      categorie: c.categorie || null,
      prompt_text: c.prompt_text,
      cas_usage: c.cas_usage || null,
      source_url: c.source_url || null,
      tags: Array.isArray(c.tags) ? c.tags : [],
    };
  }

  async function discover() {
    // Au moins l'un des deux (besoin OU catégorie) suffit.
    if (!need.trim() && !effectiveCat) return;
    setDiscovering(true);
    setDiscErr("");
    setDiscMsg("");
    setCandidates([]);
    setCandStatus({});
    const cibleLine = discTarget
      ? `Cible privilégiée : ${discTarget}.`
      : `Cibles variées selon le besoin (Claude, ChatGPT, Gemini, Midjourney…).`;
    const catLine = effectiveCat
      ? `Catégorie visée : ${effectiveCat}. Ne propose QUE des prompts de cette catégorie, et mets cette valeur dans le champ "categorie".`
      : "";
    // Le sujet peut venir du besoin, de la catégorie, ou des deux.
    const subject = need.trim()
      ? `pour ce besoin : "${need.trim()}"`
      : `dans la catégorie « ${effectiveCat} »`;
    // La langue du contenu généré suit le sélecteur de langue de l'interface.
    const langLine =
      locale === "en"
        ? `LANGUE DE SORTIE : ANGLAIS. Rédige "titre", "prompt_text", "cas_usage" et "tags" ENTIÈREMENT en anglais, même si la requête ou les sources trouvées sont dans une autre langue. N'utilise AUCUN mot français.`
        : `LANGUE DE SORTIE : FRANÇAIS. Rédige "titre", "prompt_text", "cas_usage" et "tags" ENTIÈREMENT en français, même si la requête ou les sources trouvées sont dans une autre langue. N'utilise AUCUN mot anglais (hors noms propres d'outils).`;
    const prompt = `Tu es un curateur de prompts pour IA génératives.
Recherche sur le web les meilleurs prompts réutilisables ACTUELS ${subject}.
${cibleLine}
${catLine}
${langLine}
Synthétise des prompts prêts à l'emploi, concrets et directement copiables (inspirés des meilleures pratiques trouvées).
Réponds UNIQUEMENT par un tableau JSON de 5 à 8 objets, sans texte ni backticks. Champs :
"titre" (court), "cible" (Claude|ChatGPT|Gemini|Midjourney ou autre), "categorie" (ex: rédaction, code, retouche photo),
"prompt_text" (le prompt complet prêt à copier), "cas_usage" (1 phrase : quand l'utiliser),
"source_url" (URL de la source si tu en as une, sinon ""), "tags" (tableau de 2 à 4 mots-clés).`;
    try {
      const txt = await callClaude(prompt, {
        search: true,
        model: settings.model,
        provider: settings.provider,
        ollamaModel: settings.ollamaModel,
        searchQuery: [need.trim(), effectiveCat, discTarget, "prompt"]
          .filter(Boolean)
          .join(" "),
      });
      // Tolérant à une réponse tronquée (prompts longs) : on garde les objets
      // complets même si le dernier est coupé.
      const json = parseIdeas(txt);
      if (!json || !Array.isArray(json) || json.length === 0)
        throw new Error("parse");
      setCandidates(json as Candidate[]);
    } catch (e) {
      const msg = String((e as Error)?.message || "").toLowerCase();
      const billing =
        msg.includes("credit") ||
        msg.includes("balance") ||
        msg.includes("billing") ||
        msg.includes("quota");
      setDiscErr(billing ? t("discover.errorBilling") : t("discover.error"));
    } finally {
      setDiscovering(false);
    }
  }

  async function saveCandidates(list: Candidate[], indices: number[]) {
    const payload = list.filter((c) => c.prompt_text?.trim()).map(toPayload);
    if (payload.length === 0) return;
    const r = await fetch("/api/prompts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) {
      setDiscErr(t("list.error"));
      return;
    }
    const { inserts } = (await r.json()) as { recus: number; inserts: number };
    // Marque les candidats concernés (un seul, ou tous).
    setCandStatus((s) => {
      const next = { ...s };
      if (indices.length === 1) {
        next[indices[0]] = inserts > 0 ? "saved" : "dup";
      } else {
        indices.forEach((i) => {
          next[i] = "saved";
        });
      }
      return next;
    });
    if (indices.length > 1) setDiscMsg(t("discover.savedCount", { count: inserts }));
    if (inserts > 0) load();
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((p) =>
      [p.titre, p.cible, p.categorie, p.prompt_text, p.cas_usage, ...(p.tags ?? [])]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [items, query]);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      {/* Découvrir sur le web */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("discover.title")}
            </p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("discover.subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              value={need}
              onChange={(e) => setNeed(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !discovering && discover()}
              placeholder={t("discover.placeholder")}
              className={cn(FIELD, "min-w-[220px] flex-1")}
            />
            <select
              aria-label={t("discover.categoryAll")}
              value={catChoice}
              onChange={(e) => setCatChoice(e.target.value)}
              className={cn(FIELD, "w-full sm:w-48")}
            >
              <option value="">{t("discover.categoryAll")}</option>
              {(PROMPT_CATEGORIES[locale] ?? PROMPT_CATEGORIES.fr).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="__other__">{t("discover.categoryOther")}</option>
            </select>
            {catChoice === "__other__" && (
              <input
                value={catCustom}
                onChange={(e) => setCatCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !discovering && discover()}
                placeholder={t("discover.categoryPlaceholder")}
                className={cn(FIELD, "w-full sm:w-48")}
                autoFocus
              />
            )}
            <select
              aria-label={t("form.cible")}
              value={discTarget}
              onChange={(e) => setDiscTarget(e.target.value)}
              className={cn(FIELD, "w-40")}
            >
              {TARGETS.map((tg) => (
                <option key={tg} value={tg}>
                  {tg || t("discover.targetAll")}
                </option>
              ))}
            </select>
            <Button
              variant="ink"
              onClick={discover}
              disabled={discovering || (!need.trim() && !effectiveCat)}
            >
              {discovering ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              {discovering ? t("discover.searching") : t("discover.button")}
            </Button>
          </div>

          {discErr && <p className="text-sm text-risk-high">{discErr}</p>}
          {discMsg && <p className="text-sm text-risk-low">{discMsg}</p>}

          {candidates.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t("discover.resultsTitle")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    saveCandidates(
                      candidates,
                      candidates.map((_, i) => i),
                    )
                  }
                >
                  {t("discover.saveAll")}
                </Button>
              </div>

              {candidates.map((c, i) => (
                <div key={i} className="rounded-xl border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{c.titre}</span>
                    {c.cible && (
                      <span className="rounded-md border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                        {c.cible}
                      </span>
                    )}
                    {c.categorie && (
                      <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                        {c.categorie}
                      </span>
                    )}
                    <div className="ml-auto">
                      {candStatus[i] === "saved" ? (
                        <span className="inline-flex items-center gap-1 text-sm text-risk-low">
                          <Check className="h-4 w-4" />
                          {t("discover.saved")}
                        </span>
                      ) : candStatus[i] === "dup" ? (
                        <span className="text-sm text-muted-foreground">
                          {t("discover.duplicate")}
                        </span>
                      ) : (
                        <Button
                          variant="ink"
                          size="sm"
                          onClick={() => saveCandidates([c], [i])}
                        >
                          <Plus className="h-4 w-4" />
                          {t("discover.save")}
                        </Button>
                      )}
                    </div>
                  </div>
                  {c.cas_usage && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {c.cas_usage}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {c.prompt_text}
                  </p>
                  {c.source_url && (
                    <a
                      href={c.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      {c.source_url}
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Formulaire d'ajout */}
      <Card>
        <CardContent className="space-y-3 pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("form.legend")}
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("form.titre")}
              </span>
              <input
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                className={cn(FIELD, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("form.cible")}
              </span>
              <input
                value={cible}
                onChange={(e) => setCible(e.target.value)}
                placeholder={t("form.ciblePlaceholder")}
                className={cn(FIELD, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("form.categorie")}
              </span>
              <input
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                placeholder={t("form.categoriePlaceholder")}
                className={cn(FIELD, "mt-1")}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-muted-foreground">
              {t("form.promptText")}
            </span>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder={t("form.promptPlaceholder")}
              rows={4}
              className="mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("form.casUsage")}
              </span>
              <input
                value={casUsage}
                onChange={(e) => setCasUsage(e.target.value)}
                placeholder={t("form.casPlaceholder")}
                className={cn(FIELD, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("form.sourceUrl")}
              </span>
              <input
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className={cn(FIELD, "mt-1")}
              />
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("form.tags")}
              </span>
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder={t("form.tagsPlaceholder")}
                className={cn(FIELD, "mt-1")}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="ink" onClick={add} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {saving ? t("form.submitting") : t("form.submit")}
            </Button>
            {formMsg && <span className="text-sm text-risk-low">{formMsg}</span>}
            {formErr && <span className="text-sm text-risk-high">{formErr}</span>}
          </div>
        </CardContent>
      </Card>

      {/* Recherche + liste */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("list.search")}
              className={cn(FIELD, "pl-9")}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {t("list.count", { count: filtered.length })}
          </span>
        </div>

        {listErr && <p className="text-sm text-risk-high">{listErr}</p>}

        {items.length === 0 && !listErr ? (
          <p className="text-sm text-muted-foreground">{t("list.empty")}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("list.noMatch")}</p>
        ) : (
          <div className="grid gap-3">
            {filtered.map((p) => (
              <Card key={p.id}>
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold tracking-tight">
                        {p.titre}
                      </h3>
                      {p.cible && (
                        <span className="rounded-md border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                          {p.cible}
                        </span>
                      )}
                      {p.categorie && (
                        <span className="rounded-md border px-2 py-0.5 text-xs text-muted-foreground">
                          {p.categorie}
                        </span>
                      )}
                    </div>
                    <CopyButton
                      text={p.prompt_text}
                      label={t("copy")}
                      copiedLabel={t("copied")}
                    />
                  </div>

                  {p.cas_usage && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {p.cas_usage}
                    </p>
                  )}

                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {p.prompt_text}
                  </p>

                  {(p.tags?.length || p.source_url) && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {(p.tags ?? []).map((tag, i) => (
                        <span
                          key={i}
                          className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                      {p.source_url && (
                        <a
                          href={p.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                        >
                          {p.source_url}
                        </a>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
