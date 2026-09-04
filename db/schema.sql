-- Bibliothèque de prompts réutilisables.
-- À exécuter manuellement (DB viewer) ; non lancé par l'application.
CREATE TABLE IF NOT EXISTS prompts (
  id           SERIAL PRIMARY KEY,
  titre        TEXT NOT NULL,
  cible        TEXT,
  categorie    TEXT,
  prompt_text  TEXT NOT NULL,
  cas_usage    TEXT,
  source_url   TEXT,
  tags         TEXT[],
  content_hash TEXT UNIQUE,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Journal d'activité (audit log). Alimenté en best-effort par lib/audit.ts :
-- un échec d'insertion ne doit jamais faire échouer l'action métier.
CREATE TABLE IF NOT EXISTS audit_log (
  id         BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  email      TEXT,
  action     TEXT NOT NULL,
  details    JSONB
);
