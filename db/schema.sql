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
