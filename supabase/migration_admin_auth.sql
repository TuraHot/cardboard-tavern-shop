-- ============================================================
-- Admin-only write access (Supabase Auth role based)
-- Run this in Supabase Dashboard -> SQL Editor
--
-- Everyone (anon + logged-in non-admin) : SELECT only
-- Users with app_metadata.role = 'admin' : full access
-- ============================================================

-- Helper: is the current JWT an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin';
$$;

-- ---------- tournaments ----------
DROP POLICY IF EXISTS "Allow all for tournaments" ON tournaments;
DROP POLICY IF EXISTS "Public read tournaments" ON tournaments;
DROP POLICY IF EXISTS "Admin write tournaments" ON tournaments;
CREATE POLICY "Public read tournaments" ON tournaments
  FOR SELECT USING (true);
CREATE POLICY "Admin write tournaments" ON tournaments
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- players ----------
DROP POLICY IF EXISTS "Allow all for players" ON players;
DROP POLICY IF EXISTS "Public read players" ON players;
DROP POLICY IF EXISTS "Admin write players" ON players;
CREATE POLICY "Public read players" ON players
  FOR SELECT USING (true);
CREATE POLICY "Admin write players" ON players
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- matches ----------
DROP POLICY IF EXISTS "Allow all for matches" ON matches;
DROP POLICY IF EXISTS "Public read matches" ON matches;
DROP POLICY IF EXISTS "Admin write matches" ON matches;
CREATE POLICY "Public read matches" ON matches
  FOR SELECT USING (true);
CREATE POLICY "Admin write matches" ON matches
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- storage: banners bucket ----------
DROP POLICY IF EXISTS "Public Upload Banners" ON storage.objects;
DROP POLICY IF EXISTS "Public Update Banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Banners" ON storage.objects;
DROP POLICY IF EXISTS "Admin Update Banners" ON storage.objects;
CREATE POLICY "Admin Upload Banners" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'banners' AND public.is_admin());
CREATE POLICY "Admin Update Banners" ON storage.objects
  FOR UPDATE USING (bucket_id = 'banners' AND public.is_admin());

-- ---------- nations ----------
ALTER TABLE nations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for nations" ON nations;
DROP POLICY IF EXISTS "Public read nations" ON nations;
DROP POLICY IF EXISTS "Admin write nations" ON nations;
CREATE POLICY "Public read nations" ON nations
  FOR SELECT USING (true);
CREATE POLICY "Admin write nations" ON nations
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ---------- bosses ----------
ALTER TABLE bosses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for bosses" ON bosses;
DROP POLICY IF EXISTS "Public read bosses" ON bosses;
DROP POLICY IF EXISTS "Admin write bosses" ON bosses;
CREATE POLICY "Public read bosses" ON bosses
  FOR SELECT USING (true);
CREATE POLICY "Admin write bosses" ON bosses
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================================
-- Grant admin role to a user (create the user first in
-- Dashboard -> Authentication -> Users -> Add user)
-- ============================================================
UPDATE auth.users
SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'cardboard.tavern@officialshop.com';
