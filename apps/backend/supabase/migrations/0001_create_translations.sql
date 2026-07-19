-- QalSync: translations table
-- Run this in Supabase SQL Editor or via `supabase db push`

-- 1. Status enum
CREATE TYPE translation_status AS ENUM ('draft', 'approved');

-- 2. Translations table
CREATE TABLE translations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_text TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  locale      TEXT NOT NULL,
  translation TEXT,
  status      translation_status NOT NULL DEFAULT 'draft',
  project_id  TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Unique constraint: one translation per (hash, locale, project)
ALTER TABLE translations
  ADD CONSTRAINT translations_hash_locale_project_unique
  UNIQUE (source_hash, locale, project_id);

-- 4. Index for fast hash lookups
CREATE INDEX idx_translations_source_hash ON translations (source_hash);

-- 5. Index for dashboard queries (list by project + locale + status)
CREATE INDEX idx_translations_project_locale_status
  ON translations (project_id, locale, status);

-- 6. Auto-update updated_at on row changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON translations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row-Level Security (required by Supabase, permissive for now)
ALTER TABLE translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to translations"
  ON translations
  FOR ALL
  USING (true)
  WITH CHECK (true);
