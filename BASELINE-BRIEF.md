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

ui-ux-pro-max-skill · github/spec-kit · safishamsi/graphify.
Dream (DreamLM/Dream) = **écarté des défauts** (LLM diffusion, ~20 Go VRAM),
gardé en option uniquement. Mode d'install de graphify **à confirmer**.

## Skills (catalogs/skills-library.json)

Toutes en scope **projet** (pas de global). Minimum systématique : ui-ux-pro-max.

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
