-- ============================================================
-- Migration: Add Tournament Details & Card Columns
-- Run this script in Supabase Dashboard -> SQL Editor
-- ============================================================

ALTER TABLE tournaments 
ADD COLUMN IF NOT EXISTS event_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS entry_fee INT DEFAULT 70,
ADD COLUMN IF NOT EXISTS max_players INT DEFAULT 20,
ADD COLUMN IF NOT EXISTS store_name TEXT DEFAULT 'Cardboard Tavern',
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT 'Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)',
ADD COLUMN IF NOT EXISTS banner_url TEXT DEFAULT '/images/vanguard_banner_1.jpg',
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing rows with defaults if null
UPDATE tournaments 
SET 
  event_date = COALESCE(event_date, created_at, NOW()),
  entry_fee = COALESCE(entry_fee, 70),
  max_players = COALESCE(max_players, 20),
  store_name = COALESCE(store_name, 'Cardboard Tavern'),
  location = COALESCE(location, 'Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)'),
  banner_url = COALESCE(banner_url, '/images/vanguard_banner_1.jpg'),
  description = COALESCE(description, 'รางวัลอันดับที่ 1-3 โปรโมเดือนนี้คนละ 4 ใบ+\nอันดับที่ 4 เป็นต้นไปคนละ 4 ใบ\nมี Lucky Draw กรณีผู้แข่ง 16 คนขึ้นไป\nเปิดลงทะเบียน walk in 12:00 เริ่มแพริ่ง 14:30');
