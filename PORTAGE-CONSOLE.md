# Brief de portage — Console de création → interface-baseline

Document à donner à **Claude Code** (et à garder ouvert dans **Trae AI**) pour
intégrer la console dans ton template. Il décrit la cible, les contraintes, le
mapping fichier par fichier, et les pièges à ne pas rater.

---

## 0. Contexte

- **Source** : `console-creation-v2.jsx` — un seul fichier React, styles *inline*,
  persistance via `window.storage` (API des artefacts), appel à l'API Anthropic
  **depuis le navigateur sans clé** (ne marche QUE dans le bac à sable des artefacts).
- **Cible** : repo `interface-baseline` — Next.js (App Router) + TypeScript +
  Tailwind v4 + shadcn/ui. Tokens de couleur dans `app/globals.css`, règles dans
  `design-system/MASTER.md`, icônes `lucide-react`, police Plus Jakarta Sans,
  i18n FR/EN (`messages/`), auth déjà en place.

Objectif : reproduire les 5 onglets (Radar, Atelier, Pipeline, Repères, Paramètres)
comme pages du dashboard, en respectant la charte du template.

---

## 1. Contraintes dures (non négociables)

1. **Boutons en NOIR**, pas en indigo. Le primaire indigo du template ne sert PAS
   pour les boutons d'action de la console. Ajouter un token `--ink` (~#191A1D) dans
   `globals.css` et une variante de bouton `ink` (`bg-ink text-white`). Tous les CTA
   de la console utilisent cette variante.
2. **Aucune couleur en dur dans les composants** (règle du MASTER.md). Le `const C = {…}`
   de la console est converti en tokens Tailwind : `bg-card`, `text-muted-foreground`,
   `border`, etc. Les couleurs spécifiques (corail « vidéo », teal « diaporama »,
   risque faible/moyen/élevé) deviennent des tokens dédiés dans `globals.css`.
3. **Icônes `lucide-react`**, jamais d'emoji ni de glyphe texte (◉ ✎ ⚡ ▦ …).
4. **Plus Jakarta Sans** partout (déjà chargée). Supprimer Space Grotesk / IBM Plex Mono.
5. **Sentence case**, et **clés FR + EN** présentes dans `messages/` pour chaque texte.

---

## 2. Piège n°1 — l'appel API doit passer côté serveur

La console fait `fetch("https://api.anthropic.com/v1/messages")` sans clé. À remplacer
par une **route serveur** qui détient la clé, et un client qui l'appelle.

### `app/api/claude/route.ts`
```ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { prompt, search } = await req.json();

  const body: Record<string, unknown> = {
    model: "claude-sonnet-4-6", // vérifier l'id courant sur docs.claude.com
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  };
  if (search) body.tools = [{ type: "web_search_20250305", name: "web_search" }];

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    return NextResponse.json({ error: await r.text() }, { status: r.status });
  }
  const data = await r.json();
  const text = (data.content || [])
    .filter((b: { type: string }) => b.type === "text")
    .map((b: { text: string }) => b.text)
    .join("\n")
    .trim();
  return NextResponse.json({ text });
}
```

### Client (remplace `callClaude` dans la console)
```ts
export async function callClaude(prompt: string, { search = false } = {}) {
  const r = await fetch("/api/claude", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt, search }),
  });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const { text } = await r.json();
  return text as string;
}
```

### Variables d'env
- Ajouter `ANTHROPIC_API_KEY=...` dans `.env.local` (jamais commité ; `.env.example` documente la clé).
- **La clé ne doit jamais arriver dans le bundle client.** Elle ne vit que dans la route serveur.

> Vérifier sur https://docs.claude.com l'id de modèle courant et la version exacte
> de l'outil de recherche web avant de figer ces chaînes.

---

## 3. Piège n°2 — remplacer `window.storage`

`window.storage` n'existe pas hors artefact. Deux phases :

- **Phase 1 (rapide, pour shipper)** : un hook `usePersistentState` basé sur `localStorage`
  (client). Suffit pour valider l'UI. Clés : `pipeline:items`, `pipeline:settings`.
- **Phase 2 (propre)** : persistance côté serveur, par utilisateur, branchée sur la couche
  auth/data déjà présente dans le repo (les items du pipeline sont des données métier).

```ts
import { useEffect, useState } from "react";

export function usePersistentState<T>(key: string, initial: T) {
  const [v, setV] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setV(JSON.parse(raw)); } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (ready) try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
  }, [key, v, ready]);
  return [v, setV] as const;
}
```

---

## 4. Piège n°3 — l'état partagé entre pages

Dans la console (fichier unique), `App` détient l'état partagé : la liste des niches
(le Radar la passe à l'Atelier) et les items du pipeline. En multi-pages Next, il faut
un **provider** englobant les routes.

- Créer `components/console/console-provider.tsx` (un Context) monté dans
  `app/(app)/layout.tsx`. Il expose : `niches`, `setNiches`, `items`, `setItems`,
  `settings`, `setSettings`, le tout persisté via `usePersistentState`.
- Chaque page lit/écrit via `useConsole()`.

---

## 5. Mapping fichier par fichier

| Source (console) | Cible (repo) |
|---|---|
| `callClaude`, `extractJSON`, `parseIdeas` | `lib/console/claude.ts` |
| constantes `PLATFORMS`, `STAGES`, `PRESET_NICHES`, maps risque | `lib/console/constants.ts` |
| `RecDot`, `RiskBadge`, `Spinner` | `components/console/ui/*` |
| `NicheRadar` (2 scans : niches + outils) | `app/(app)/radar/page.tsx` + `components/console/radar/*` |
| `Studio` (Atelier : lot + idée perso) | `app/(app)/atelier/page.tsx` |
| `Pipeline` (kanban, stats, CSV, objectif) | `app/(app)/pipeline/page.tsx` |
| `Repere` (référence statique) | `app/(app)/reperes/page.tsx` |
| `Paramètres` (steppers nicheCount/batchCount/weekGoal) | `app/(app)/parametres/page.tsx` |
| nav sidebar | `components/layout/sidebar.tsx` (changer les `items`) |

### Sidebar — nouveaux items (icônes lucide)
```ts
import { Radar, Lightbulb, KanbanSquare, BookOpen, Settings } from "lucide-react";
const items = [
  { key: "radar",      href: "/radar",      icon: Radar },
  { key: "atelier",    href: "/atelier",    icon: Lightbulb },
  { key: "pipeline",   href: "/pipeline",   icon: KanbanSquare },
  { key: "reperes",    href: "/reperes",    icon: BookOpen },
  { key: "parametres", href: "/parametres", icon: Settings },
] as const;
```
Ajouter les clés correspondantes dans `messages/fr.json` et `messages/en.json`.

---

## 6. Ordre d'exécution conseillé (incrémental, testable à chaque étape)

1. Fondations : `lib/console/*`, `components/console/*`, token `--ink` + variante de bouton `ink`.
2. Route `/api/claude` + `.env.local` + nouveau `callClaude`. Tester avec un appel simple.
3. `ConsoleProvider` (persistance localStorage) monté dans `(app)/layout.tsx`.
4. Page **Radar** (les 2 scans). Vérifier que la recherche web passe bien par la route.
5. Page **Atelier** (lot vidéo/diaporama/mixte + idée perso).
6. Page **Pipeline** (kanban + stats + export CSV).
7. Pages **Repères** + **Paramètres**.
8. Sidebar : items + i18n FR/EN.
9. Passe finale : styles inline → tokens, emojis → lucide, police. `npm run build`, corriger.

---

## 7. Première instruction à coller dans Claude Code

> Lis `PORTAGE-CONSOLE.md` et `design-system/MASTER.md`. Commence par l'étape 1 et 2
> uniquement : crée `lib/console/` et `components/console/`, ajoute un token `--ink`
> (~#191A1D) dans `app/globals.css` et une variante de bouton `ink` (`bg-ink text-white`),
> puis crée la route `app/api/claude/route.ts` et le client `callClaude` côté `lib/console/claude.ts`.
> Ne touche pas encore aux pages. Montre-moi le diff et explique comment tester la route
> avant qu'on continue. Boutons en NOIR, pas en indigo. Aucune couleur en dur.

Avance étape par étape, en validant le build à chaque fois. Ne porte pas tout d'un coup.
