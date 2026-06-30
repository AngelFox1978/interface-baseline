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

// Contrainte de faisabilité des visuels, injectée dans TOUS les prompts de
// génération (lot, vidéo, diaporama). Source unique : ne pas recopier ailleurs.
// Le créateur travaille en faceless, uniquement à partir de captures d'écran
// d'outils réels et de schémas/texte simples.
export const VISUAL_CONSTRAINT = `CONTRAINTE VISUELLE STRICTE (créateur faceless, sans caméra) :
Chaque visuel proposé doit être réalisable avec UNE SIMPLE CAPTURE D'ÉCRAN d'un outil réel (interface, prompt, réglage, résultat) ou un schéma/texte simple.
INTERDIT formellement : photos ou plans de personnes, scènes lifestyle, mises en scène, split-screens émotionnels, tout visuel nécessitant un appareil photo, un tournage ou une production, et toute capture inventée d'un outil ou d'un workflow non réellement utilisé.
Privilégie le « montrable à l'écran » : utiliser un outil, comparer des résultats, montrer un réglage, un prompt, ou un workflow reproductible pas à pas.
Écarte tout sujet ou toute idée dont la démonstration exigerait un visuel impossible selon ces règles.`;

// Niches de repli quand le Radar n'a encore rien renvoyé.
export const PRESET_NICHES = [
  "Tutos outils IA",
  "Finance perso",
  "Productivité & IA",
  "Résumés de livres",
  "Histoire & culture",
  "Tech & comparatifs",
] as const;
