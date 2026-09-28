# Progression — amélioration du template

Une ligne par lot. Mise à jour à la fin de chaque lot.

| Lot | Statut | Branche | Commits | Remarques |
| --- | --- | --- | --- | --- |
| 1 — Nettoyage | mergé (PR #7, 0221aa2) | chore/nettoyage-template | chore: permissions Claude Code génériques · chore: retrait de la console spécifique (archivée en tag) · chore: i18n et CLAUDE.md alignés sur le code réel | Tag `archive/console-v1` (→ 14bf3cb) poussé |
| 2 — Ateliers | terminé, PR à proposer | feat/ateliers | docs: progression — LOT 1 mergé · chore: base de données locale · feat: catalogues des ateliers · feat: plugins Claude Code au niveau projet · feat: serveurs MCP projet · feat: OmniRoute en Docker avec garde-fous · docs: ateliers · fix: seed-admin — saisie masquée, format .env testé · fix: post-init — paquet npm officiel de ui-ux-pro-max | Ajouts A/B/C inclus. Format du hash : \$ sans apostrophes (choix validé, testé). claude-mem : rester en local (pas d’observer hébergé ni de synchro cmem.ai) |
| 3 — Garde-fous git | à faire | chore/lefthook | | |
| 4 — Thème clair/sombre/système | à faire | feat/theme-systeme | | |
| 5 — Thème futuriste + effets | à faire | feat/theme-futuriste | | Voir tâches reportées ci-dessous |
| 6 — Paramètres → Design | à faire | feat/parametres-design | | |
| 7 — Vérification finale | à faire | (chaque branche) | | |

## Tâches reportées

### LOT 5

- Créer des tokens sémantiques `--success`, `--warning`, `--danger` (clair + sombre),
  migrer les pages prompts et journal, supprimer `--risk-*`, et décider si la
  variante de bouton `ink` reste utile avec le thème futuriste.
