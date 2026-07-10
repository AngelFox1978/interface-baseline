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

- `app/(app)/` — pages protégées (layout = sidebar + topbar)
- `app/login/` — connexion (email + mot de passe)
- `components/ui/` — primitives (button, input, label, card)
- `components/layout/` — sidebar, topbar, lang-switch
- `components/dashboard/` — cartes du tableau de bord
- `components/charts/` — wrapper Chart.js
- `lib/auth.ts` — session JWT (edge-safe) · `lib/session.ts` — lecture serveur
- `actions/auth.ts` — login / logout
- `middleware.ts` — protège tout sauf `/login`
- `catalogs/` — sources GitHub + skills proposées par Pilot
- `docs/AUTH-DECISIONS.md` — décisions auth à finaliser

## Skills disponibles

Voir `catalogs/skills-library.json`. Minimum systématique : **ui-ux-pro-max**.

## Workflow Git

- Ne jamais basculer de branche pendant que le serveur dev tourne. Si une
  bascule a eu lieu serveur allumé : l'arrêter, supprimer `.next`, relancer.

## Lancer

`PORT` dans `.env` ; `npm run dev` lit ce port. Admin défini dans `.env`
(`ADMIN_EMAIL` + `ADMIN_PASSWORD_HASH`, généré par `npm run seed:admin`).
