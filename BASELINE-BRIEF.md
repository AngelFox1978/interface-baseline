# Brief — interface-baseline

Contexte pour reprendre le projet (ex. dans une autre fenêtre Claude Code).

## Objectif

Repo **template** (option A : *Template repository* coché sur GitHub) que
**Projects Pilot** clone à chaque création d'une nouvelle interface web, pour ne
jamais repartir de zéro.

## Ce que contient le baseline par défaut

- Auth par mot de passe (un admin par interface) — login email + mot de passe
- FR/EN (next-intl, locale en cookie, switch dans la topbar et le login)
- Menu à gauche (sidebar, item actif indigo)
- Wrapper de graphiques (Chart.js)
- Design « indigo dashboard » d'après `design-system/reference/dashboard-reference.png`,
  tokens dans `app/globals.css`, règles dans `design-system/MASTER.md`
- Dashboard reproduisant le visuel (table, 2 charts, formulaire, activités)

## Deux couches

- **skills** (`.claude/skills/`) : aident Claude à produire — invisibles à l'exécution.
- **runtime** : le code livré et visible (Tailwind + primitives shadcn + tokens).

## GitHub par défaut (catalogs/github-sources.json)

Par défaut : ui-ux-pro-max-skill · github/spec-kit · impeccable (CLI officiel) ·
OmniRoute (mode docker : compose copié, jamais lancé automatiquement) · lefthook.
En option : graphify (Graphify-Labs, paquet Python `graphifyy` +
`graphify install --project`, quand le code grossit) · headroom (compression de
contexte, plus tard) · Dream (DreamLM/Dream, LLM diffusion ~20 Go VRAM).

## Skills et plugins (catalogs/skills-library.json)

Tout en scope **projet** (pas de global). Minimum systématique : ui-ux-pro-max.
Par défaut aussi : frontend-design (Anthropic), find-skills (vercel-labs/skills),
et les plugins **ponytail** et **claude-mem** (seule mémoire, locale), déclarés
dans `.claude/settings.json`.

## Ateliers

Tableau complet (quoi / quand / défaut) dans `CLAUDE.md`. Serveurs MCP projet
dans `.mcp.json` : Playwright et Context7. Infra locale optionnelle :
`infra/postgres` (base de l'interface) et `infra/omniroute` (garde-fous dans
son README ; Claude Code reste branché en direct).

## Création d'une interface depuis Pilot

```
gh repo create <nom> --template <user>/interface-baseline --private --clone
cd <nom>
bash scripts/post-init.sh <slug> <port> [admin_email]   # port + secret + admin + skill design
# pour chaque source/skill cochée :
bash scripts/install-source.sh <url> <mode> [target] [install_cmd]
bash scripts/install-skill.sh  <method> <arg> [subdir]
npm install && npm run dev
```

## Versionnement

La liste des défauts vit dans ce repo. La modifier = commit + tag (v1.x). Pilot
mémorise la version utilisée par chaque interface. `--template` part toujours de
la branche par défaut ; pour figer une version antérieure, basculer sur
`git clone --branch <tag>` + réinit `.git` (cas secondaire).

## À finaliser

Voir `docs/AUTH-DECISIONS.md` (création admin + stockage mono/multi-utilisateur).
