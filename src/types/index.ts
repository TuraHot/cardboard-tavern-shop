export type TournamentFormat =
  | 'Standard JP'
  | 'Standard TH'
  | 'Premium TH'
  | 'Standard'
  | 'V-Premium'
  | 'Premium'
  | string;

export type TournamentStatus = 'registering' | 'ongoing' | 'completed';

export type VanguardNation =
  | 'Dragon Empire'
  | 'Dark States'
  | 'Brandt Gate'
  | 'Keter Sanctuary'
  | 'Stoicheia'
  | 'Lyrical Monasterio'
  | 'Other';

export interface Tournament {
  id: string;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  current_round: number;
  max_rounds: number;
  round_duration_minutes: number;
  timer_ends_at: string | null;
  timer_paused_remaining_seconds: number | null;
  event_date?: string | null;
  entry_fee?: number;
  max_players?: number;
  store_name?: string;
  location?: string;
  banner_url?: string | null;
  description?: string | null;
  created_at: string;
}

export interface Player {
  id: string;
  tournament_id: string;
  name: string;
  nation: VanguardNation;
  deck_boss: string | null;
  nation_id?: string | null;
  boss_id?: string | null;
  lucky_draw_number: number;
  is_dropped: boolean;
  has_received_bye: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  tournament_id: string;
  round_number: number;
  table_number: number;
  player1_id: string;
  player2_id: string | null;
  winner_id: string | null;
  is_bye: boolean;
  is_Bye?: boolean;
  is_double_loss: boolean;
  status: 'pending' | 'completed';
  created_at: string;
}

export interface PlayerStanding {
  rank: number;
  player: Player;
  points: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  byes: number;
  mw: number; // Match Win rate for self (with BYE)
  opponentMw: number; // Match Win rate as an opponent (excluding BYE)
  omw: number; // Opponents' Match Win rate floored at 0.33
  oomw: number; // Opponents' Opponents' Match Win rate
  actualOpponentIds: string[];
}

export interface NationTheme {
  name: VanguardNation;
  badgeClass: string;
  borderClass: string;
  textClass: string;
  bgClass: string;
  thaiName: string;
}

export interface NationRow {
  id: string;
  name_en: string;
  name_th: string;
  color_code: string;
  logo_url?: string | null;
}

export interface BossRow {
  id: string;
  nation_id: string;
  name_en: string;
  name_th?: string | null;
  image_url?: string | null;
  is_active: boolean;
}
