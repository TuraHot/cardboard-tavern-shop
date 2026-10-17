-- ============================================================
-- Cardfight!! Vanguard Store Tournament Web Application
-- Supabase Database Schema & Realtime Setup
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tournaments Table
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    format TEXT NOT NULL DEFAULT 'Standard TH', -- Standard TH, Standard JP, Premium TH, V-Premium
    status TEXT NOT NULL DEFAULT 'registering', -- registering, ongoing, completed
    current_round INT NOT NULL DEFAULT 0,
    max_rounds INT NOT NULL DEFAULT 4,
    round_duration_minutes INT NOT NULL DEFAULT 30,
    event_date TIMESTAMPTZ DEFAULT NOW(),
    entry_fee INT DEFAULT 70,
    max_players INT DEFAULT 20,
    store_name TEXT DEFAULT 'Cardboard Tavern',
    location TEXT DEFAULT 'Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)',
    banner_url TEXT DEFAULT '/images/vanguard_banner_1.jpg',
    description TEXT,
    timer_ends_at TIMESTAMPTZ,
    timer_paused_remaining_seconds INT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Players Table
CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nation TEXT NOT NULL, -- Dragon Empire, Dark States, Brandt Gate, Keter Sanctuary, Stoicheia, Lyrical Monasterio, Other
    deck_boss TEXT, -- e.g., Nirvana, Bavsargra, Youthberk
    lucky_draw_number INT NOT NULL, -- 🍀 Sequential number per tournament (1, 2, 3...)
    is_dropped BOOLEAN NOT NULL DEFAULT FALSE,
    has_received_bye BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tournament_id, lucky_draw_number)
);

-- 3. Matches Table
CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round_number INT NOT NULL,
    table_number INT NOT NULL,
    player1_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES players(id) ON DELETE CASCADE, -- NULL if BYE
    winner_id UUID REFERENCES players(id) ON DELETE SET NULL,
    is_Bye BOOLEAN NOT NULL DEFAULT FALSE,
    is_double_loss BOOLEAN NOT NULL DEFAULT FALSE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, completed
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_tournament_id ON players(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament_round ON matches(tournament_id, round_number);

-- Enable Supabase Realtime for all tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'tournaments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE tournaments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'players'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE players;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE matches;
  END IF;
END $$;

-- Row Level Security (RLS) Configuration
-- For store tournament management, allow public read and write access
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for tournaments" ON tournaments;
CREATE POLICY "Allow all for tournaments" ON tournaments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for players" ON players;
CREATE POLICY "Allow all for players" ON players FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for matches" ON matches;
CREATE POLICY "Allow all for matches" ON matches FOR ALL USING (true) WITH CHECK (true);
