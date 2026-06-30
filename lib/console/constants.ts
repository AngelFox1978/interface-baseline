// Source unique des catégories de niches (liste FIXE, en dur ici et nulle part
// ailleurs). Ces chaînes servent à la fois d'identifiants persistés, de valeurs
// envoyées au modèle dans le prompt, et de libellés affichés.
export const NICHE_CATEGORIES = [
  "Tutos & outils IA",
  "Productivité & organisation",
  "Finance perso & argent",
  "Tech & gadgets",
  "Résumés de livres & savoirs",
  "Développement & code",
  "Apprentissage & langues",
  "Bien-être & habitudes",
] as const;

// Catégories cochées par défaut au premier lancement.
export const DEFAULT_CATEGORIES: string[] = [
  "Tutos & outils IA",
  "Développement & code",
  "Productivité & organisation",
];

// Plateformes de publication (sélecteurs Atelier). Données, non traduites.
export const PLATFORMS = [
  "TikTok",
  "YouTube Shorts",
  "Instagram Reels",
  "YouTube (long)",
] as const;

// Niches de repli quand le Radar n'a encore rien renvoyé.
export const PRESET_NICHES = [
  "Tutos outils IA",
  "Finance perso",
  "Productivité & IA",
  "Résumés de livres",
  "Histoire & culture",
  "Tech & comparatifs",
] as const;
