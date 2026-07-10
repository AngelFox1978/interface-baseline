"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, RefreshCw, Trash2, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Ligne renvoyée par GET /api/prompts (table prompts).
type PromptRow = {
  id: number;
  titre: string | null;
  cible: string | null;
  categorie: string | null;
  prompt_text: string;
  cas_usage: string | null;
  source_url: string | null;
  tags: string[] | null;
  created_at?: string;
};

const textareaClass =
  "mt-1 w-full rounded-xl border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function PromptsPage() {
  const t = useTranslations("prompts");

  const [prompts, setPrompts] = useState<PromptRow[]>([]);
  const [loading, setLoading] = useState(true);
  // true quand GET /api/prompts échoue (DATABASE_URL absent, Postgres éteint…).
  const [dbError, setDbError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setDbError(false);
    try {
      const r = await fetch("/api/prompts");
      if (!r.ok) throw new Error(String(r.status));
      setPrompts((await r.json()) as PromptRow[]);
    } catch {
      setDbError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Import JSON.
  const [importText, setImportText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importErr, setImportErr] = useState("");

  async function doImport() {
    setImportMsg("");
    setImportErr("");
    let items: unknown;
    try {
      items = JSON.parse(importText);
    } catch {
      setImportErr(t("importInvalid"));
      return;
    }
    if (!Array.isArray(items)) {
      setImportErr(t("importInvalid"));
      return;
    }
    setImporting(true);
    try {
      const r = await fetch("/api/prompts", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(items),
      });
      if (!r.ok) throw new Error(String(r.status));
      const d = (await r.json()) as { recus: number; inserts: number };
      setImportMsg(t("importResult", { recus: d.recus, inserts: d.inserts }));
      setImportText("");
      await load();
    } catch {
      setImportErr(t("dbError"));
    } finally {
      setImporting(false);
    }
  }

  // Édition inline (une ligne à la fois).
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitre, setEditTitre] = useState("");
  const [editTexte, setEditTexte] = useState("");
  const [editErr, setEditErr] = useState("");
  const [saving, setSaving] = useState(false);

  function startEdit(p: PromptRow) {
    setEditId(p.id);
    setEditTitre(p.titre ?? "");
    setEditTexte(p.prompt_text);
    setEditErr("");
    setConfirmId(null);
  }

  async function saveEdit(p: PromptRow) {
    setEditErr("");
    setSaving(true);
    try {
      const r = await fetch(`/api/prompts/${p.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          titre: editTitre,
          prompt_text: editTexte,
          cible: p.cible,
          categorie: p.categorie,
          cas_usage: p.cas_usage,
          source_url: p.source_url,
          tags: p.tags ?? [],
        }),
      });
      if (r.status === 400) {
        setEditErr(t("editRequired"));
        return;
      }
      if (r.status === 409) {
        setEditErr(t("editDuplicate"));
        return;
      }
      if (!r.ok) throw new Error(String(r.status));
      setPrompts((ps) =>
        ps.map((row) =>
          row.id === p.id
            ? { ...row, titre: editTitre.trim(), prompt_text: editTexte.trim() }
            : row,
        ),
      );
      setEditId(null);
    } catch {
      setEditErr(t("actionError"));
    } finally {
      setSaving(false);
    }
  }

  // Suppression avec confirmation en deux temps.
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState("");

  async function doDelete(id: number) {
    setDeleteErr("");
    setDeleting(true);
    try {
      const r = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error(String(r.status));
      setPrompts((ps) => ps.filter((p) => p.id !== id));
      setConfirmId(null);
    } catch {
      setDeleteErr(t("actionError"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          {t("subtitle")}
        </p>
      </section>

      {/* Base injoignable : message clair + bouton réessayer, pas de crash. */}
      {dbError ? (
        <Card>
          <CardContent className="pt-5">
            <div className="rounded-2xl border border-dashed p-8 text-center">
              <p className="text-sm font-semibold text-risk-high">
                {t("dbError")}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={load}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {t("retry")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="pt-5">
              <h3 className="text-base font-bold tracking-tight">
                {t("importTitle")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("importHint")}
              </p>
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                rows={5}
                placeholder='[{ "titre": "…", "prompt_text": "…" }]'
                className={textareaClass}
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={doImport}
                  disabled={importing || !importText.trim()}
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {t("importButton")}
                </Button>
                {importMsg && (
                  <span className="text-sm text-risk-low">{importMsg}</span>
                )}
                {importErr && (
                  <span className="text-sm text-risk-high">{importErr}</span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-5">
              <h3 className="text-base font-bold tracking-tight">
                {t("listTitle", { count: prompts.length })}
              </h3>

              {loading ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("loading")}
                </p>
              ) : prompts.length === 0 ? (
                <p className="mt-4 text-sm text-muted-foreground">
                  {t("empty")}
                </p>
              ) : (
                <div className="mt-4 grid gap-2">
                  {prompts.map((p) =>
                    editId === p.id ? (
                      <div key={p.id} className="rounded-xl border bg-card p-4">
                        <Label htmlFor={`titre-${p.id}`}>{t("fieldTitre")}</Label>
                        <Input
                          id={`titre-${p.id}`}
                          value={editTitre}
                          onChange={(e) => setEditTitre(e.target.value)}
                          className="mt-1"
                        />
                        <Label htmlFor={`texte-${p.id}`} className="mt-3 block">
                          {t("fieldTexte")}
                        </Label>
                        <textarea
                          id={`texte-${p.id}`}
                          value={editTexte}
                          onChange={(e) => setEditTexte(e.target.value)}
                          rows={6}
                          className={textareaClass}
                        />
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <Button
                            size="sm"
                            onClick={() => saveEdit(p)}
                            disabled={saving}
                          >
                            {saving && (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            )}
                            {t("save")}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditId(null)}
                            disabled={saving}
                          >
                            {t("cancel")}
                          </Button>
                          {editErr && (
                            <span className="text-sm text-risk-high">
                              {editErr}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={p.id}
                        className="flex items-start justify-between gap-3 rounded-xl border bg-card p-4"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {p.titre || t("noTitle")}
                          </p>
                          <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-muted-foreground">
                            {p.prompt_text}
                          </p>
                          {(p.categorie || p.cible) && (
                            <p className="mt-1 text-xs text-muted-foreground">
                              {[p.categorie, p.cible]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {confirmId === p.id ? (
                            <>
                              <span className="text-sm">
                                {t("confirmDelete")}
                              </span>
                              <Button
                                size="sm"
                                onClick={() => doDelete(p.id)}
                                disabled={deleting}
                              >
                                {deleting && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                {t("confirm")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmId(null)}
                                disabled={deleting}
                              >
                                {t("cancel")}
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => startEdit(p)}
                              >
                                <Pencil className="h-4 w-4" />
                                {t("edit")}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setConfirmId(p.id);
                                  setDeleteErr("");
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                {t("delete")}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ),
                  )}
                  {deleteErr && (
                    <p className="text-sm text-risk-high">{deleteErr}</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
