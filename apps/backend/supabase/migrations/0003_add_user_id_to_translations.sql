-- Add user_id column referencing auth.users for multi-tenant isolation
ALTER TABLE translations
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for fast user-scoped queries
CREATE INDEX IF NOT EXISTS idx_translations_user_id ON translations (user_id);

-- Index for user + project + locale lookups
CREATE INDEX IF NOT EXISTS idx_translations_user_project_locale_status
  ON translations (user_id, project_id, locale, status);

-- Drop old policies and replace with user-isolated RLS policy
DROP POLICY IF EXISTS "Allow authenticated users to update translations" ON translations;
DROP POLICY IF EXISTS "Allow authenticated users to delete translations" ON translations;
DROP POLICY IF EXISTS "Allow users to manage own translations" ON translations;

-- Policy: Authenticated users can manage (select, insert, update, delete) their own translations
CREATE POLICY "Allow users to manage own translations"
  ON translations
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
