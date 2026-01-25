-- ============================================
-- Character Sheets Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.character_sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug VARCHAR(255),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_character_sheets_owner_id
  ON public.character_sheets(owner_id);

CREATE INDEX IF NOT EXISTS idx_character_sheets_created_at
  ON public.character_sheets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_character_sheets_slug
  ON public.character_sheets(slug);

CREATE INDEX IF NOT EXISTS idx_character_sheets_data_gin
  ON public.character_sheets USING GIN (data);

ALTER TABLE public.character_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access for character sheets"
  ON public.character_sheets
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can create character sheets"
  ON public.character_sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their character sheets"
  ON public.character_sheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their character sheets"
  ON public.character_sheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

CREATE TRIGGER set_character_sheets_updated_at
  BEFORE UPDATE ON public.character_sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
