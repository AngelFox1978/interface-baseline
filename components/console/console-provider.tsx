"use client";

import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { useEffect } from "react";
import { usePersistentState } from "@/lib/console/use-persistent-state";
import { DEFAULT_CATEGORIES } from "@/lib/console/constants";
import {
  DEFAULT_MODEL,
  DEFAULT_OLLAMA_MODEL,
  PRICING,
  WEB_SEARCH_PER_1K,
} from "@/lib/console/models";
import { setUsageSink } from "@/lib/console/claude";
import type {
  AtelierSeed,
  Favorite,
  Niche,
  PipelineItem,
  Settings,
  Tool,
  UsageStats,
} from "@/lib/console/types";

const EMPTY_USAGE: UsageStats = {
  inputTokens: 0,
  outputTokens: 0,
  webSearches: 0,
  costUsd: 0,
  lastCostUsd: 0,
  since: null,
};

// État partagé entre les pages de la console (piège n°3 du brief). Dans la
// console source, le composant App détenait cet état ; en multi-pages Next, il
// vit ici, dans un provider qui englobe les routes via (app)/layout.tsx.

const DEFAULT_SETTINGS: Settings = {
  nicheCount: 10,
  batchCount: 20,
  weekGoal: 3,
  categories: DEFAULT_CATEGORIES,
  model: DEFAULT_MODEL,
  provider: "anthropic",
  ollamaModel: DEFAULT_OLLAMA_MODEL,
  budgetUsd: 0,
};

type ConsoleContextValue = {
  // Résultats du scan Radar « niches », lus par l'Atelier. Persistés.
  niches: Niche[];
  setNiches: Dispatch<SetStateAction<Niche[]>>;
  // Horodatage (ms) du dernier scan niches. Persisté. null = jamais scanné.
  nichesAt: number | null;
  setNichesAt: Dispatch<SetStateAction<number | null>>;
  // Résultats de la veille outils (Radar). Persistés.
  tools: Tool[];
  setTools: Dispatch<SetStateAction<Tool[]>>;
  // Horodatage (ms) de la dernière veille outils. Persisté.
  toolsAt: number | null;
  setToolsAt: Dispatch<SetStateAction<number | null>>;
  // Cartes du Pipeline. Persistées.
  items: PipelineItem[];
  setItems: Dispatch<SetStateAction<PipelineItem[]>>;
  // Favoris de l'Atelier (idées + scripts). Persistés.
  favorites: Favorite[];
  setFavorites: Dispatch<SetStateAction<Favorite[]>>;
  // Consommation Anthropic cumulée (estimation). Persistée.
  usage: UsageStats;
  resetUsage: () => void;
  // Réglages (steppers Paramètres). Persistés.
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  // Niche envoyée Radar → Atelier (handoff transient, NON persisté).
  seed: Niche | null;
  setSeed: Dispatch<SetStateAction<Niche | null>>;
  // Sujet envoyé Pipeline → Atelier (handoff transient, NON persisté).
  atelierSeed: AtelierSeed | null;
  setAtelierSeed: Dispatch<SetStateAction<AtelierSeed | null>>;
};

const ConsoleContext = createContext<ConsoleContextValue | null>(null);

export function ConsoleProvider({ children }: { children: React.ReactNode }) {
  const [niches, setNiches] = usePersistentState<Niche[]>("radar:niches", []);
  const [nichesAt, setNichesAt] = usePersistentState<number | null>(
    "radar:niches:at",
    null,
  );
  const [tools, setTools] = usePersistentState<Tool[]>("radar:tools", []);
  const [toolsAt, setToolsAt] = usePersistentState<number | null>(
    "radar:tools:at",
    null,
  );
  const [items, setItems] = usePersistentState<PipelineItem[]>(
    "pipeline:items",
    [],
  );
  const [favorites, setFavorites] = usePersistentState<Favorite[]>(
    "atelier:favorites",
    [],
  );
  const [usage, setUsage] = usePersistentState<UsageStats>(
    "console:usage",
    EMPTY_USAGE,
  );

  // Accumule l'usage de chaque appel Anthropic (via le sink de callClaude).
  useEffect(() => {
    setUsageSink((rec) => {
      setUsage((u) => {
        const price = PRICING[rec.model];
        const inTok = rec.input_tokens ?? 0;
        const outTok = rec.output_tokens ?? 0;
        const web = rec.web_search_requests ?? 0;
        const tokenCost = price
          ? (inTok / 1e6) * price.input + (outTok / 1e6) * price.output
          : 0;
        const webCost = (web / 1000) * WEB_SEARCH_PER_1K;
        return {
          inputTokens: u.inputTokens + inTok,
          outputTokens: u.outputTokens + outTok,
          webSearches: u.webSearches + web,
          costUsd: u.costUsd + tokenCost + webCost,
          lastCostUsd: tokenCost + webCost,
          since: u.since ?? Date.now(),
        };
      });
    });
    return () => setUsageSink(null);
  }, [setUsage]);

  function resetUsage() {
    setUsage({ ...EMPTY_USAGE, since: Date.now() });
  }
  const [settings, setSettings] = usePersistentState<Settings>(
    "pipeline:settings",
    DEFAULT_SETTINGS,
  );
  const [seed, setSeed] = useState<Niche | null>(null);
  const [atelierSeed, setAtelierSeed] = useState<AtelierSeed | null>(null);

  return (
    <ConsoleContext.Provider
      value={{
        niches,
        setNiches,
        nichesAt,
        setNichesAt,
        tools,
        setTools,
        toolsAt,
        setToolsAt,
        items,
        setItems,
        favorites,
        setFavorites,
        usage,
        resetUsage,
        settings,
        setSettings,
        seed,
        setSeed,
        atelierSeed,
        setAtelierSeed,
      }}
    >
      {children}
    </ConsoleContext.Provider>
  );
}

export function useConsole(): ConsoleContextValue {
  const ctx = useContext(ConsoleContext);
  if (!ctx) {
    throw new Error("useConsole doit être utilisé dans <ConsoleProvider>.");
  }
  return ctx;
}
