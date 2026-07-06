// Types de l'état partagé de la console (Radar → Atelier → Pipeline).
// Repris tels quels de la console source ; les constantes (PLATFORMS, STAGES…)
// arriveront dans lib/console/constants.ts au moment de porter les pages.

export type RisqueNiveau = "faible" | "moyen" | "eleve";

/** Une niche issue du scan Radar (tableau JSON renvoyé par Claude). */
export type Niche = {
  nom: string;
  categorie: string;
  pourquoi: string;
  format: string;
  monetisation_fr: string;
  risque: RisqueNiveau;
  angle: string;
};

/** Une carte du Pipeline (kanban). `stage` reste libre tant que les
 *  constantes STAGES ne sont pas portées. */
export type PipelineItem = {
  id: number;
  title: string;
  platform: string;
  niche: string;
  stage: string;
  views: string;
  revenue: string;
  date: string;
  retention: string;
};

/** Un outil issu de la veille Radar (scan 2). */
export type Tool = {
  categorie: string;
  outil: string;
  pour_quoi: string;
  prix: string;
  note: string;
  // Pertinence 1-5 pour CE projet (faceless, tutos IA, petit budget, France).
  pertinence: number;
};

export type FormatType = "video" | "diaporama";

/** Une idée du générateur de lot (Atelier). */
export type Idea = {
  titre: string;
  type: FormatType;
  hook: string;
  angle: string;
};

/** Fiche de production vidéo générée. */
export type VideoSheet = {
  titre: string;
  hook: string;
  hooks_alt: string[];
  script: {
    temps: string;
    voix: string;
    visuel: string;
    texte_ecran?: string;
  }[];
  cta: string;
  description: string;
  hashtags: string[];
  angle_humain: string;
  divulgation: string;
};

/** Structure de diaporama (carrousel) générée. */
export type Slideshow = {
  titre: string;
  slides: { texte: string; visuel: string }[];
  description: string;
  hashtags: string[];
  angle_humain: string;
};

/** Un favori de l'Atelier : une idée, ou un script généré (vidéo/diaporama). */
export type Favorite =
  | { id: string; kind: "idea"; createdAt: number; niche: string; platform: string; idea: Idea }
  | { id: string; kind: "video"; createdAt: number; sheet: VideoSheet }
  | { id: string; kind: "slideshow"; createdAt: number; show: Slideshow };

/** Fournisseur d'IA : Anthropic (cloud) ou hybride local (Ollama + SearXNG). */
export type Provider = "anthropic" | "hybrid";

/** Consommation Anthropic cumulée (estimation locale). */
export type UsageStats = {
  inputTokens: number;
  outputTokens: number;
  webSearches: number;
  costUsd: number;
  since: number | null;
};

/** Réglages (steppers + catégories + modèle + fournisseur). */
export type Settings = {
  nicheCount: number;
  batchCount: number;
  weekGoal: number;
  // Catégories de niches cochées ; [] = toutes (ne bloque pas le scan).
  categories: string[];
  // Modèle Claude choisi (id de la liste blanche). La route revalide.
  model: string;
  // Fournisseur d'IA. "anthropic" = Claude ; "hybrid" = Ollama + SearXNG local.
  provider: Provider;
  // Modèle Ollama utilisé en mode hybride (ex. "qwen2.5:7b").
  ollamaModel: string;
};
