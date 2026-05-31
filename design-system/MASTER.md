# Design System — MASTER

Source de vérité visuelle de l'interface. Toute page doit s'y conformer.
Référence visuelle : `design-system/reference/dashboard-reference.png`.

## Direction

Dashboard clair, professionnel, friendly. Fond lavande-gris, cartes blanches
arrondies avec ombre douce, primaire indigo, sidebar à pastille active pleine.
À ne PAS faire : dégradés violet/rose « AI slop », coins durs, ombres lourdes.

## Couleurs (tokens définis dans `app/globals.css`)

| Token              | Rôle                          | Repère    |
| ------------------ | ----------------------------- | --------- |
| `--background`     | Fond app (lavande-gris)       | ~#EEF1F8  |
| `--card`           | Cartes / sidebar              | #FFFFFF   |
| `--foreground`     | Texte (encre indigo profond)  | ~#262345  |
| `--primary`        | Indigo (boutons, actif, CTA)  | ~#4F46E5  |
| `--muted-foreground` | Texte secondaire            | gris froid |
| `--border`         | Bordures fines                | ~#E6E8F0  |
| `--chart-1..5`     | Séries de graphiques (indigo/violet) | — |

Ne pas coder de couleur en dur dans les composants : utiliser les classes
Tailwind mappées (`bg-primary`, `text-muted-foreground`, `border`, etc.).

## Typo

Plus Jakarta Sans (400→800), chargée via `<link>` Google Fonts dans le layout
racine. Titres en `font-extrabold tracking-tight`.
Pour self-hoster plus tard : `next/font/google`.

## Formes & espace

- Cartes : `rounded-2xl`, ombre `shadow-sm`.
- Sidebar : `rounded-3xl`, item actif = `bg-primary text-primary-foreground`.
- Boutons / inputs : `rounded-xl`, hauteur 40–44px.
- Icônes : `lucide-react`, taille 16–20px. Jamais d'emoji comme icône.

## Checklist avant livraison d'une page

- [ ] `cursor-pointer` sur tout élément cliquable
- [ ] États hover avec transition douce (150–300ms)
- [ ] Focus visible au clavier (`focus-visible:ring-2 ring-ring`)
- [ ] Contraste texte ≥ 4.5:1
- [ ] Responsive : 375 / 768 / 1024 / 1440 px
- [ ] FR + EN présents (clés dans `messages/`)

## Couche skill

Le design est assisté par la skill **ui-ux-pro-max** (`.claude/skills/`). Ce
MASTER.md prime : la skill propose, le MASTER tranche.
