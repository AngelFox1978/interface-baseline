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
