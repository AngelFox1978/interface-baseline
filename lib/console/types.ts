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
