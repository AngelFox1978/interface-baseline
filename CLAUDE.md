# CLAUDE.md — interface-baseline

Modèle d'interface web pour Projects Pilot. Chaque nouvelle interface part d'ici.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · primitives style shadcn ·
next-intl (FR/EN) · Chart.js · auth maison (jose + bcryptjs).

## Règles

1. Vérifie avant d'agir. Ne pas supposer en silence : si une hypothèse est
   nécessaire, l'énoncer. (cf. les 4 règles anti-pièges LLM)
2. Minimal. Ne pas transformer 50 lignes en 500. Pas de sur-ingénierie.
3. Ne touche pas au code hors périmètre de la tâche.
4. Tests attendus pour toute logique non triviale (Vitest / Playwright).
5. Toujours FR + EN : pas de texte en dur dans les composants, clés dans
   `messages/fr.json` et `messages/en.json`.
6. Design : suivre `design-system/MASTER.md`. Couleurs via tokens Tailwind,
   jamais en dur. La skill ui-ux-pro-max assiste, le MASTER tranche.

## Structure

- `app/(app)/` — pages protégées (layout = sidebar + topbar) : accueil,
  page-1..3 (exemples), prompts, journal, apparence, parametres (admin)
- `app/api/` — routes serveur : prompts, journal, github-sources,
  skills-library, ollama/models
- `app/login/` — connexion (email + mot de passe)
- `components/ui/` — primitives (button, input, label, card)
- `components/layout/` — sidebar, topbar, lang-switch, theme-toggle,
  page-placeholder
- `components/charts/` — wrapper Chart.js
- `lib/auth.ts` — session JWT (edge-safe) · `lib/session.ts` — lecture serveur
- `lib/` — aussi : db, audit, rate-limit, validation (Zod), ollama,
  install-sources, toast, utils
- `actions/auth.ts` — login / logout
- `middleware.ts` — protège tout sauf `/login`
- `messages/` — traductions FR/EN · `i18n/request.ts` — config next-intl
- `db/schema.sql` — tables Postgres (à exécuter manuellement)
- `tests/` — tests Vitest
- `scripts/` — post-init, install-source, install-skill, seed-admin
- `catalogs/` — sources GitHub + skills proposées par Pilot
- `infra/` — services Docker locaux optionnels (postgres, omniroute)
- `.mcp.json` — serveurs MCP du projet (Playwright, Context7)
- `docs/AUTH-DECISIONS.md` — décisions auth à finaliser
- `docs/PROGRESSION-AMELIORATION.md` — suivi des lots d'amélioration

## Skills disponibles

Voir `catalogs/skills-library.json`. Minimum systématique : **ui-ux-pro-max**.

## Ateliers (outils Claude Code)

Catalogues : `catalogs/skills-library.json` (skills, plugins) et
`catalogs/github-sources.json` (sources, paquets, Docker). ✓ = proposé par défaut.

| Atelier | Quoi | Quand l'utiliser | Défaut |
| --- | --- | --- | --- |
| ui-ux-pro-max | skill de design | toute UI (le MASTER tranche) | ✓ |
| frontend-design | skill Anthropic de design | pages et composants soignés | ✓ |
| impeccable | commandes de finition visuelle | polish avant livraison d'une page | ✓ |
| ponytail | plugin « code minimal » | en continu (règle 2 : minimal) | ✓ |
| claude-mem | plugin mémoire (unique, local) | en continu ; pas d'autre mémoire, pas de cloud | ✓ |
| find-skills | recherche de skills | besoin non couvert par l'existant | ✓ |
| Playwright MCP | navigateur piloté (`.mcp.json`) | captures, vérif responsive / e2e | ✓ |
| Context7 MCP | doc à jour des bibliothèques | avant toute API de lib (Next, next-intl, Tailwind…) | ✓ |
| OmniRoute | passerelle IA locale (Docker) | seulement selon `infra/omniroute/README.md` | ✓ (copié, non lancé) |
| lefthook | hooks git (lint, tests, build) | automatique à chaque commit / push (mis en place au LOT 3) | ✓ |
| graphify | graphe du code | quand le code grossit | — |
| headroom | compression de contexte | plus tard ; pas avec la compression d'OmniRoute sans test | — |

Plugins déclarés dans `.claude/settings.json` (à installer une fois par poste) ;
serveurs MCP dans `.mcp.json` (clé Context7 optionnelle : `CONTEXT7_API_KEY`).
Claude Code reste branché en direct : ne jamais pointer `ANTHROPIC_BASE_URL`
vers OmniRoute.

## Workflow Git

- Ne jamais basculer de branche pendant que le serveur dev tourne. Si une
  bascule a eu lieu serveur allumé : l'arrêter, supprimer `.next`, relancer.

## Lancer

`PORT` dans `.env` ; `npm run dev` lit ce port. Admin défini dans `.env`
(`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`, généré par `npm run seed:admin`).
