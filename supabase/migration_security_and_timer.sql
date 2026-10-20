-- ============================================================
-- Cardboard Tavern - Security & Server Time Enhancement
-- Run this in Supabase Dashboard -> SQL Editor -> New query -> Run
-- ============================================================

-- ------------------------------------------------------------
-- 1. Storage Bucket Security (banners)
-- Only authenticated Admins can upload, update, or delete banner images.
-- Public can only view/read images.
-- ------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Remove loose public upload/update policies
    DROP POLICY IF EXISTS "Public Upload Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Public Update Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Public Access Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Upload Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Update Banners" ON storage.objects;
    DROP POLICY IF EXISTS "Admin Delete Banners" ON storage.objects;

    -- Public read
    CREATE POLICY "Public Read Banners" ON storage.objects
      FOR SELECT
      USING (bucket_id = 'banners');

    -- Admin write only (Insert)
    CREATE POLICY "Admin Upload Banners" ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = 'banners' 
        AND (
          coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
          OR coalesce(auth.jwt() ->> 'role', '') = 'service_role'
        )
      );

    -- Admin write only (Update)
    CREATE POLICY "Admin Update Banners" ON storage.objects
      FOR UPDATE
      USING (
        bucket_id = 'banners' 
        AND (
          coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
          OR coalesce(auth.jwt() ->> 'role', '') = 'service_role'
        )
      );

    -- Admin write only (Delete)
    CREATE POLICY "Admin Delete Banners" ON storage.objects
      FOR DELETE
      USING (
        bucket_id = 'banners' 
        AND (
          coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
          OR coalesce(auth.jwt() ->> 'role', '') = 'service_role'
        )
      );
  END IF;
END $$;


-- ------------------------------------------------------------
-- 2. Server-Side Timer RPC (Accurate Clock Synchronization)
-- Calculates timer_ends_at using server timestamp NOW() directly.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.start_tournament_timer(
  p_tournament_id UUID,
  p_seconds INT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ends_at TIMESTAMPTZ;
BEGIN
  -- Use server timestamp NOW() + duration
  v_ends_at := NOW() + (p_seconds || ' seconds')::INTERVAL;

  UPDATE tournaments
  SET timer_ends_at = v_ends_at,
      timer_paused_remaining_seconds = NULL
  WHERE id = p_tournament_id;

  RETURN v_ends_at;
END;
$$;

-- Grant execution to public / anon / authenticated so frontend can invoke it
GRANT EXECUTE ON FUNCTION public.start_tournament_timer(UUID, INT) TO anon, authenticated, service_role;


-- ------------------------------------------------------------
-- 3. Max Players Database-Level Constraint (PostgreSQL Trigger)
-- Hard enforcement preventing registrations exceeding max_players.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_max_players_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_count INT;
  v_max_players INT;
  v_status TEXT;
BEGIN
  -- Retrieve max_players and status from parent tournament
  SELECT max_players, status 
  INTO v_max_players, v_status
  FROM tournaments
  WHERE id = NEW.tournament_id;

  -- 1) Prevent player insertion if tournament is not registering
  IF v_status != 'registering' THEN
    RAISE EXCEPTION 'ไม่สามารถเพิ่มผู้เล่นได้เนื่องจากการแข่งขันอยู่ในสถานะ %', v_status;
  END IF;

  -- 2) Count current players registered in this tournament
  SELECT COUNT(*) 
  INTO v_current_count
  FROM players
  WHERE tournament_id = NEW.tournament_id;

  -- 3) If count reaches max_players, abort insertion
  IF v_current_count >= coalesce(v_max_players, 20) THEN
    RAISE EXCEPTION 'ไม่สามารถเพิ่มผู้เล่นได้: จำนวนผู้เล่นครบกำหนดสูงสุดแล้ว (% คน)', v_max_players;
  END IF;

  RETURN NEW;
END;
$$;

-- Bind Trigger to players table
DROP TRIGGER IF EXISTS trg_check_max_players ON players;
CREATE TRIGGER trg_check_max_players
  BEFORE INSERT ON players
  FOR EACH ROW
  EXECUTE FUNCTION public.check_max_players_limit();
