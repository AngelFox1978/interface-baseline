"use client";

import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useState,
} from "react";
import { usePersistentState } from "@/lib/console/use-persistent-state";
import { DEFAULT_CATEGORIES } from "@/lib/console/constants";
import { DEFAULT_MODEL, DEFAULT_OLLAMA_MODEL } from "@/lib/console/models";
import type {
  Favorite,
  Niche,
  PipelineItem,
  Settings,
  Tool,
} from "@/lib/console/types";

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
  // Réglages (steppers Paramètres). Persistés.
  settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  // Niche envoyée Radar → Atelier (handoff transient, NON persisté).
  seed: Niche | null;
  setSeed: Dispatch<SetStateAction<Niche | null>>;
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
  const [settings, setSettings] = usePersistentState<Settings>(
    "pipeline:settings",
    DEFAULT_SETTINGS,
  );
  const [seed, setSeed] = useState<Niche | null>(null);

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
        settings,
        setSettings,
        seed,
        setSeed,
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
