"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CopyButton } from "@/components/console/atelier/copy-button";
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

const FIELD =
  "h-10 w-full rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function PromptsPage() {
  const t = useTranslations("prompts");

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

                  <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                    {p.prompt_text}
                  </p>

                  {p.cas_usage && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {p.cas_usage}
                    </p>
                  )}

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
