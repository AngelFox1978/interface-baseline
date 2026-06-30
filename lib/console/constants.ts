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
