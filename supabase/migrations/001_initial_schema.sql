-- ============================================
-- Part 1: Database & Storage Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Create `sheets` table
-- ============================================
CREATE TABLE IF NOT EXISTS public.sheets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on owner_id for faster queries
CREATE INDEX IF NOT EXISTS idx_sheets_owner_id ON public.sheets(owner_id);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_sheets_created_at ON public.sheets(created_at DESC);

-- Create GIN index on jsonb data for efficient queries
CREATE INDEX IF NOT EXISTS idx_sheets_data_gin ON public.sheets USING GIN (data);

-- ============================================
-- 2. Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;

-- Policy 1: Read (SELECT) - Public read access
-- Anyone (authenticated or anonymous) can view any sheet
CREATE POLICY "Public read access"
  ON public.sheets
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy 2: Write (INSERT) - Only authenticated users can create sheets
CREATE POLICY "Authenticated users can create sheets"
  ON public.sheets
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_id);

-- Policy 3: Update (UPDATE) - Only owner can update their sheets
CREATE POLICY "Owners can update their sheets"
  ON public.sheets
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Policy 4: Delete (DELETE) - Only owner can delete their sheets
CREATE POLICY "Owners can delete their sheets"
  ON public.sheets
  FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_id);

-- ============================================
-- 3. Create function to update updated_at timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. Setup Storage Bucket for Avatars
-- ============================================

-- Create the avatars bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy 1: Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy 2: Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy 3: Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy 4: Allow public read access to avatars
CREATE POLICY "Public can read avatars"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

