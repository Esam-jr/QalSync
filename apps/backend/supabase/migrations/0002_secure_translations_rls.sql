DROP POLICY IF EXISTS "Allow all access to translations" ON translations;

CREATE POLICY "Allow public select of translations"
  ON translations
  FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert of draft translations"
  ON translations
  FOR INSERT
  WITH CHECK (status = 'draft');

CREATE POLICY "Allow authenticated users to update translations"
  ON translations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete translations"
  ON translations
  FOR DELETE
  TO authenticated
  USING (true);
