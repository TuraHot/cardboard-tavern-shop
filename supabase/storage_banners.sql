-- ============================================================
-- Supabase Storage: Create and configure "banners" bucket
-- Run this in Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Create the 'banners' bucket if not already created
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public access to view banners
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Access Banners'
  ) THEN
    CREATE POLICY "Public Access Banners" ON storage.objects
    FOR SELECT USING (bucket_id = 'banners');
  END IF;
END $$;

-- 3. Allow public upload (INSERT) to banners bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Upload Banners'
  ) THEN
    CREATE POLICY "Public Upload Banners" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'banners');
  END IF;
END $$;

-- 4. Allow public update to banners bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Update Banners'
  ) THEN
    CREATE POLICY "Public Update Banners" ON storage.objects
    FOR UPDATE USING (bucket_id = 'banners');
  END IF;
END $$;
