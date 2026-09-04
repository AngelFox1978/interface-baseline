"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  Download,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Sparkles,
  Star,
  Upload,
  Wifi,
} from "lucide-react";
import { useConsole } from "@/components/console/console-provider";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { exportWorkspace, importWorkspace } from "@/lib/console/workspace";
import { notifyError, notifySuccess } from "@/lib/toast";
import {
  MODELS,
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_MODEL,
  OLLAMA_FALLBACK_MODELS,
} from "@/lib/console/models";
import type { Provider } from "@/lib/console/types";

type GithubSource = {
  id: string;
  label: string;
  url: string;
  category: string;
  mode: string;
  default: boolean;
  installed: boolean;
  activeSkills: number | null;
  description: string | null;
  createdAt: string | null;
};

type LibrarySkill = {
  id: string;
  label: string;
  category: string;
  method: string;
  command: string | null;
  url: string | null;
  default: boolean;
};

type ActiveSkill = {
  id: string;
  label: string;
  description: string;
};

type SkillsData = {
  active: ActiveSkill[];
  library: LibrarySkill[];
};

type Suggestion = {
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
};

export default function ParametresPage() {
  const t = useTranslations("parametres");
  const locale = useLocale();
  const { settings, setSettings, usage, resetUsage } = useConsole();

  const model = settings.model ?? DEFAULT_MODEL;
  const provider: Provider = settings.provider ?? "anthropic";
  const ollamaModel = settings.ollamaModel ?? DEFAULT_OLLAMA_MODEL;

  const [ollamaModels, setOllamaModels] = useState<string[]>(
    OLLAMA_FALLBACK_MODELS
  );
  const [ollamaLoading, setOllamaLoading] = useState(false);

  function loadOllamaModels() {
    setOllamaLoading(true);
    fetch("/api/ollama/models")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.models)) setOllamaModels(d.models);
      })
      .catch(() => {})
      .finally(() => setOllamaLoading(false));
  }

  useEffect(() => {
    loadOllamaModels();
  }, []);

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
      .catch(() => {
        setHybridStatus({ ollama: false, searxng: false });
      })
      .finally(() => setTestingHybrid(false));
  }

  function setProvider(p: Provider) {
    setSettings((s) => ({ ...s, provider: p }));
  }

  const [sources, setSources] = useState<GithubSource[] | null>(null);
  const [sourcesErr, setSourcesErr] = useState(false);
  const [installingId, setInstallingId] = useState<string | null>(null);

  const loadSources = useCallback(() => {
    fetch(`/api/github-sources?locale=${locale}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSources(Array.isArray(d) ? d : []))
      .catch(() => setSourcesErr(true));
  }, [locale]);

  const [skillsLib, setSkillsLib] = useState<SkillsData | null>(null);
  const [skillsErr, setSkillsErr] = useState(false);
  const [installingSkillId, setInstallingSkillId] = useState<string | null>(
    null
  );

  function loadSkills() {
    fetch("/api/skills-library")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) =>
        setSkillsLib({
          active: Array.isArray(d?.active) ? d.active : [],
          library: Array.isArray(d?.library) ? d.library : [],
        })
      )
      .catch(() => setSkillsErr(true));
  }

  useEffect(() => {
    loadSources();
    loadSkills();
  }, [loadSources]);

  async function installSkill(s: LibrarySkill) {
    setInstallingSkillId(s.id);
    try {
      const r = await fetch("/api/skills-library", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id }),
      });
      if (!r.ok) throw new Error();
      notifySuccess(t("githubInstallOk", { label: s.label }));
      loadSkills();
    } catch {
      notifyError(t("githubInstallErr", { label: s.label }));
    } finally {
      setInstallingSkillId(null);
    }
  }


  const [newUrl, setNewUrl] = useState("");
  const [newMode, setNewMode] = useState<"clone-subdir" | "skills">(
    "clone-subdir"
  );
  const [addingSource, setAddingSource] = useState(false);

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!newUrl.trim()) return;
    setAddingSource(true);
    try {
      const r = await fetch("/api/github-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl.trim(), mode: newMode }),
      });
      if (r.status === 409) {
        notifyError(t("githubAddDuplicate"));
      } else if (!r.ok) {
        notifyError(t("githubAddErr"));
      } else {
        notifySuccess(t("githubAddOk"));
        setNewUrl("");
        loadSources();
      }
    } catch {
      notifyError(t("githubAddErr"));
    } finally {
      setAddingSource(false);
    }
  }

  async function installSource(s: GithubSource) {
    setInstallingId(s.id);
    try {
      const r = await fetch("/api/github-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: s.id }),
      });
      if (!r.ok) throw new Error();
      notifySuccess(t("githubInstallOk", { label: s.label }));
      loadSources();
    } catch {
      notifyError(t("githubInstallErr", { label: s.label }));
    } finally {
      setInstallingId(null);
    }
  }

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

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
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

  function setModel(id: string) {
    setSettings((s) => ({ ...s, model: id }));
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-extrabold tracking-tight">{t("title")}</h2>
      </section>

      <Card>
        <CardContent className="pt-5">
          <h3 id="provider-title" className="text-base font-bold tracking-tight">
            {t("providerTitle")}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("providerHint")}
          </p>
          <div
            role="radiogroup"
            aria-labelledby="provider-title"
            className="mt-4 grid gap-2"
          >
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
                    role="status"
                    className="inline-flex items-center gap-1.5 text-sm"
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2 w-2 rounded-full ${ok ? "bg-success" : "bg-danger"}`}
                    />
                    {name} — {ok ? t("statusOnline") : t("statusOffline")}
                  </span>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {provider === "anthropic" ? (
        <Card>
          <CardContent className="pt-5">
            <h3 id="model-title" className="text-base font-bold tracking-tight">
              {t("modelTitle")}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{t("modelHint")}</p>

            <div
              role="radiogroup"
              aria-labelledby="model-title"
              className="mt-4 grid gap-2 sm:grid-cols-2"
            >
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
                <h3
                  id="ollama-title"
                  className="text-base font-bold tracking-tight"
                >
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
              <p className="mt-4 text-sm text-danger">{t("ollamaEmpty")}</p>
            ) : (
              <div
                role="radiogroup"
                aria-labelledby="ollama-title"
                className="mt-4 grid gap-2 sm:grid-cols-2"
              >
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
                <span role="status" className="text-sm font-semibold text-danger">
                  {t("usageOver")}
                </span>
              )}
          </div>
        </CardContent>
      </Card>

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
            <span
              aria-live="polite"
              className={`text-sm ${dataErr ? "text-danger" : "text-success"}`}
            >
              {dataMsg || dataErr}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-bold tracking-tight">
            {t("githubTitle")}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("githubHint")}
          </p>
          {sourcesErr ? (
            <p className="mt-4 text-sm text-danger">{t("githubError")}</p>
          ) : !sources ? (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              {t("githubLoading")}
            </p>
          ) : sources.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              {t("githubEmpty")}
            </p>
          ) : (
            <div className="mt-4 grid gap-2">
              {sources.map((s) => (
                <div
                  key={s.id}
                  className="flex min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
                >
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 shrink-0 rounded-full ${
                      s.installed ? "bg-success" : "bg-muted-foreground/30"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold hover:underline"
                    >
                      {s.label}
                      <ExternalLink
                        aria-hidden="true"
                        className="h-3 w-3 text-muted-foreground"
                      />
                      <span className="sr-only">{t("githubOpensNewTab")}</span>
                    </a>
                    {s.description && (
                      <p className="truncate text-xs text-muted-foreground">
                        {s.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {s.category} · {s.mode}
                      {s.createdAt &&
                        ` · ${t("githubCreated", {
                          date: new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                          }).format(new Date(s.createdAt)),
                        })}`}
                      {(s.activeSkills ?? 0) > 0 &&
                        ` · ${t("githubActiveSkills", {
                          count: s.activeSkills,
                        })}`}
                    </p>
                  </div>
                  {s.installed ? (
                    <span className="shrink-0 text-xs font-semibold text-success">
                      {t("githubInstalled")}
                    </span>
                  ) : ["skills", "clone-subdir"].includes(s.mode) ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      onClick={() => installSource(s)}
                      disabled={installingId !== null}
                    >
                      {installingId === s.id ? (
                        <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download aria-hidden="true" className="h-4 w-4" />
                      )}
                      {t("githubInstall")}
                      <span className="sr-only">
                        {" — "}
                        {t("githubNotInstalled")}
                      </span>
                    </Button>
                  ) : (
                    <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                      {t("githubNotInstalled")}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <form
            onSubmit={addSource}
            className="mt-4 flex flex-wrap items-center gap-3 border-t pt-4"
          >
            <span className="w-full text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("githubAddTitle")}
            </span>
            <input
              type="url"
              required
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder={t("githubAddUrlPlaceholder")}
              aria-label={t("githubAddUrlLabel")}
              className="h-10 min-w-64 flex-1 rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <select
              value={newMode}
              onChange={(e) =>
                setNewMode(e.target.value as "clone-subdir" | "skills")
              }
              aria-label={t("githubAddModeLabel")}
              className="h-10 cursor-pointer rounded-xl border bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="clone-subdir">{t("githubModeClone")}</option>
              <option value="skills">{t("githubModeSkills")}</option>
            </select>
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={addingSource || !newUrl.trim()}
            >
              {addingSource ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {t("githubAddSubmit")}
            </Button>
          </form>

          <SuggestionsBlock topic="claude-code" onAdded={loadSources} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5">
          <h3 className="text-base font-bold tracking-tight">
            {t("skillsLibTitle")}
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {t("skillsLibHint")}
          </p>
          {skillsErr ? (
            <p className="mt-4 text-sm text-danger">{t("skillsLibError")}</p>
          ) : !skillsLib ? (
            <p
              role="status"
              className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
            >
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              {t("githubLoading")}
            </p>
          ) : (
            <>
              {skillsLib.active.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("skillsActiveTitle")}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {skillsLib.active.map((s) => (
                      <div
                        key={s.id}
                        className="flex min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full bg-success"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold">{s.label}</span>
                          {s.description && (
                            <p className="truncate text-xs text-muted-foreground">
                              {s.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-success">
                          {t("skillsActiveBadge")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {skillsLib.library.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {t("skillsLibSectionTitle")}
                  </p>
                  <div className="mt-3 grid gap-2">
                    {skillsLib.library.map((s) => (
                      <div
                        key={s.id}
                        className="flex min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
                      >
                        <span
                          aria-hidden="true"
                          className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold">{s.label}</span>
                          <p className="text-xs text-muted-foreground">
                            {s.category} · {s.method}
                          </p>
                        </div>
                        {s.method === "copy" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="shrink-0"
                            onClick={() => installSkill(s)}
                            disabled={installingSkillId !== null}
                          >
                            {installingSkillId === s.id ? (
                              <Loader2
                                aria-hidden="true"
                                className="h-4 w-4 animate-spin"
                              />
                            ) : (
                              <Download
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                            )}
                            {t("githubInstall")}
                            <span className="sr-only">
                              {" — "}
                              {t("githubNotInstalled")}
                            </span>
                          </Button>
                        ) : (
                          <code className="min-w-0 break-all rounded-lg bg-muted px-2 py-1 text-xs">
                            {s.command}
                          </code>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}

              <SuggestionsBlock
                topic="claude-skills"
                onAdded={loadSources}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Bloc « suggestions » partagé par les cartes Sources GitHub et Skills :
// charge à la demande les dépôts populaires d'un topic GitHub, et propose
// de les ajouter au catalogue des sources (mode skills).
function SuggestionsBlock({
  topic,
  onAdded,
}: {
  topic: "claude-code" | "claude-skills";
  onAdded: () => void;
}) {
  const t = useTranslations("parametres");
  const locale = useLocale();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(false);
  const [addingUrl, setAddingUrl] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setErr(false);
    fetch(`/api/github-sources/suggestions?topic=${topic}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setSuggestions(Array.isArray(d) ? d : []))
      .catch(() => setErr(true))
      .finally(() => setLoading(false));
  }

  async function add(s: Suggestion) {
    setAddingUrl(s.url);
    try {
      const r = await fetch("/api/github-sources", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: s.url, mode: "skills" }),
      });
      if (!r.ok) throw new Error();
      notifySuccess(t("githubAddOk"));
      setSuggestions((prev) => prev?.filter((x) => x.url !== s.url) ?? null);
      onAdded();
    } catch {
      notifyError(t("githubAddErr"));
    } finally {
      setAddingUrl(null);
    }
  }

  return (
    <div className="mt-4 border-t pt-4">
      {suggestions === null && !err ? (
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          {loading ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles aria-hidden="true" className="h-4 w-4" />
          )}
          {t("githubSuggest")}
        </Button>
      ) : err ? (
        <div className="flex flex-wrap items-center gap-3">
          <p role="status" className="text-sm text-danger">
            {t("githubSuggestErr")}
          </p>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw aria-hidden="true" className="h-4 w-4" />
            {t("githubSuggestRetry")}
          </Button>
        </div>
      ) : suggestions && suggestions.length === 0 ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t("githubSuggestEmpty")}
        </p>
      ) : (
        <>
          <p role="status" className="sr-only">
            {t("githubSuggestLoaded", { count: suggestions?.length ?? 0 })}
          </p>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t(
              topic === "claude-code"
                ? "githubSuggestTitle"
                : "skillsSuggestTitle"
            )}
          </p>
          <div className="mt-3 grid gap-2">
            {suggestions?.map((s) => (
              <div
                key={s.url}
                className="flex min-w-0 items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm"
              >
                <div className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-x-2">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold hover:underline"
                    >
                      {s.fullName}
                      <ExternalLink
                        aria-hidden="true"
                        className="h-3 w-3 text-muted-foreground"
                      />
                      <span className="sr-only">{t("githubOpensNewTab")}</span>
                    </a>
                    <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                      <Star aria-hidden="true" className="h-3 w-3" />
                      {new Intl.NumberFormat(locale).format(s.stars)}
                    </span>
                  </span>
                  {s.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {s.description}
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => add(s)}
                  disabled={addingUrl !== null}
                >
                  {addingUrl === s.url ? (
                    <Loader2
                      aria-hidden="true"
                      className="h-4 w-4 animate-spin"
                    />
                  ) : (
                    <Plus aria-hidden="true" className="h-4 w-4" />
                  )}
                  {t("githubAddSubmit")}
                </Button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
