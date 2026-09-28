# AGENTS.md

Qui appeler pour quoi (subagents dans `.claude/agents/`).

- **ui-designer** — pages et composants. Suit `design-system/MASTER.md` et la
  skill ui-ux-pro-max. Sort du code Tailwind/shadcn, FR+EN.
- **data-architect** — modèles de données, requêtes, ETL, intégrations
  (sources type HANA/IMAP/API). Privilégie le SQL lecture seule.
- **code-reviewer** — relecture avant PR : périmètre, sur-ingénierie, sécurité
  (auth, secrets, entrées), i18n complet.

Workflow conseillé : spec (spec-kit) → implémentation (ui-designer /
data-architect) → revue (code-reviewer) → tests (Vitest/Playwright).

Ateliers à mobiliser (détail dans `CLAUDE.md`, section Ateliers) :

- **ui-designer** — skills ui-ux-pro-max + frontend-design, finition avec
  impeccable ; vérification visuelle via Playwright MCP (375 / 768 / 1024 / 1440).
- **data-architect** — doc à jour via Context7 ; base locale via
  `infra/postgres`.
- **code-reviewer** — contrôle aussi que Context7 a servi pour les API de
  bibliothèques et qu'aucun secret n'apparaît dans `.mcp.json` ou `infra/`.
