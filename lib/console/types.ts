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

/** Réglages (steppers + catégories + modèle de la page Paramètres). */
export type Settings = {
  nicheCount: number;
  batchCount: number;
  weekGoal: number;
  // Catégories de niches cochées ; [] = toutes (ne bloque pas le scan).
  categories: string[];
  // Modèle Claude choisi (id de la liste blanche). La route revalide.
  model: string;
};
