// Contenu de référence (page Repères). C'est du contenu métier spécifique au
// marché FR (« France, 2026 ») : on le traite comme une donnée, pas comme des
// libellés d'UI. Seul le chrome de la page (titre, sous-titre) est traduit.
export type RepereBlock = {
  h: string;
  body: [string, string][];
};

export const REPERES: RepereBlock[] = [
  {
    h: "Seuils de monétisation — France, 2026",
    body: [
      ["TikTok Creator Rewards", "10 000 abonnés · 100 000 vues / 30 j · 18+ · vidéos > 60 s. RPM réel ≈ 0,40–1,00 $ / 1 000 vues. La France est éligible."],
      ["YouTube Partner Program", "1 000 abonnés + 4 000 h de visionnage (ou 10 M de vues Shorts / 90 j). Divulgation du contenu IA réaliste obligatoire."],
      ["Où est l'argent", "Les paiements publicitaires directs sont faibles. Le gros vient du TikTok Shop, de l'affiliation, des partenariats de marque, et de tes propres produits."],
    ],
  },
  {
    h: "Ce qui fait démonétiser (à éviter absolument)",
    body: [
      ["Contenu non authentique", "Vidéos produites en masse sur le même template, voix IA lisant un texte sans angle, diaporamas d'images IA sans montage ni narration."],
      ["Volume sans valeur", "Sortir 6 vidéos quasi identiques par jour = signal de ferme à contenu. Les plateformes évaluent la chaîne entière, pas la vidéo seule."],
      ["Non-divulgation", "Du contenu IA réaliste non déclaré = violation, label imposé, sanctions possibles."],
    ],
  },
  {
    h: "Ce qui reste monétisable",
    body: [
      ["IA = outil, pas substitut", "Tu écris l'angle, tu apportes une opinion/un savoir, tu montes avec intention. L'IA accélère, elle ne remplace pas le jugement."],
      ["Visuels originaux", "Animations, montage rythmé, vraie voix (ou voix IA fortement personnalisée) plutôt que stock + voix robotique brute."],
      ["Format constant, valeur neuve", "Un format reconnaissable est bon ; le répéter sans rien apporter de neuf est le problème."],
    ],
  },
  {
    h: "La stack d'outils, démêlée",
    body: [
      ["Script & idées", "Claude / un LLM (ce que fait l'onglet Atelier). C'est ici que se joue ton apport humain."],
      ["Voix off", "ElevenLabs ou équivalent. Personnalise la voix, ne laisse pas le preset par défaut."],
      ["Visuel / montage", "CapCut, ou des générateurs (Runway, Pika, HeyGen pour l'avatar). Ajoute toujours mouvement et coupe — pas de diaporama figé."],
      ["Publication & suivi", "Manuel pour l'instant. L'auto-publication réelle exige OAuth + l'API Content Posting de TikTok (accès soumis à validation) + les quotas de l'API YouTube Data + un backend."],
    ],
  },
  {
    h: "Produits numériques — l'honnête vérité",
    body: [
      ["Fabrication", "Rapide (template, e-book, preset, mini-formation). Ce n'est pas là qu'est la difficulté."],
      ["Distribution", "C'est tout le jeu. Sans audience, un produit ne se vend pas. D'où l'intérêt des vidéos comme haut de tunnel."],
      ["Le bon montage", "Vidéos → audience → produit. Tes deux idées (vidéos + produits) ne sont pas deux pistes, c'est une seule stratégie."],
    ],
  },
];
