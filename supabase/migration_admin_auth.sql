-- ============================================================
-- Cardboard Tavern - Enable RLS & Admin Role Policies
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- 1. Helper function: Is the current session an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
      OR coalesce(auth.jwt() ->> 'role', '') = 'service_role';
$$;

-- 2. Explicitly ENABLE ROW LEVEL SECURITY on all tables
-- (This removes the orange 'UNRESTRICTED' badge in Supabase Table Editor)
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE nations ENABLE ROW LEVEL SECURITY;
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- Table: tournaments
-- Public: Read only
-- Admin: Insert, Update, Delete
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for tournaments" ON tournaments;
DROP POLICY IF EXISTS "Public read tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admin write tournaments" ON tournaments;

CREATE POLICY "Public read tournaments" ON tournaments
  FOR SELECT USING (true);

CREATE POLICY "Admin write tournaments" ON tournaments
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Table: players
-- Public: Read only
-- Admin: Insert, Update, Delete
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for players" ON players;
DROP POLICY IF EXISTS "Public read players" ON players;
DROP POLICY IF EXISTS "Admin write players" ON players;

CREATE POLICY "Public read players" ON players
  FOR SELECT USING (true);

CREATE POLICY "Admin write players" ON players
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Table: matches
-- Public: Read only
-- Admin: Insert, Update, Delete
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for matches" ON matches;
DROP POLICY IF EXISTS "Public read matches" ON matches;
DROP POLICY IF EXISTS "Admin write matches" ON matches;

CREATE POLICY "Public read matches" ON matches
  FOR SELECT USING (true);

CREATE POLICY "Admin write matches" ON matches
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Table: nations
-- Public: Read only
-- Admin: Insert, Update, Delete
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for nations" ON nations;
DROP POLICY IF EXISTS "Public read nations" ON nations;
DROP POLICY IF EXISTS "Admin write nations" ON nations;

CREATE POLICY "Public read nations" ON nations
  FOR SELECT USING (true);

CREATE POLICY "Admin write nations" ON nations
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Table: bosses
-- Public: Read only
-- Admin: Insert, Update, Delete
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Allow all for bosses" ON bosses;
DROP POLICY IF EXISTS "Public read bosses" ON bosses;
DROP POLICY IF EXISTS "Admin write bosses" ON bosses;

CREATE POLICY "Public read bosses" ON bosses
  FOR SELECT USING (true);

CREATE POLICY "Admin write bosses" ON bosses
  FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ------------------------------------------------------------
-- Storage: banners bucket (Optional / Recommended)
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Public Upload Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Public Update Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Banners" ON storage.objects;

    CREATE POLICY "Public Read Banners" ON storage.objects
      FOR SELECT USING (bucket_id = 'banners');

    CREATE POLICY "Admin Upload Banners" ON storage.objects
      FOR INSERT WITH CHECK (bucket_id = 'banners' AND public.is_admin());

    CREATE POLICY "Admin Update Banners" ON storage.objects
      FOR UPDATE USING (bucket_id = 'banners' AND public.is_admin());

    CREATE POLICY "Admin Delete Banners" ON storage.objects
      FOR DELETE USING (bucket_id = 'banners' AND public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Grant Admin Role to your Admin user
-- (Make sure you created this user in Authentication -> Users)
-- ------------------------------------------------------------
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'cardboard.tavern@officialshop.com';
