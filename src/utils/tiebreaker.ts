import { Match, Player, PlayerStanding } from '../types';

export interface PlayerStats {
  points: number;
  totalMatches: number;
  wins: number;
  losses: number;
  byes: number;
  actualMatches: number;
  actualWins: number;
  actualOpponentIds: string[];
}

/**
 * Calculates standings, MW%, OMW%, and OOMW% according to Bushiroad tournament guidelines.
 * Minimum win-rate floor is 0.33.
 */
export function calculateStandings(
  players: Player[],
  matches: Match[]
): PlayerStanding[] {
  // Map players by ID for fast lookup
  const playerMap = new Map<string, Player>();
  const statsMap = new Map<string, PlayerStats>();

  for (const player of players) {
    playerMap.set(player.id, player);
    statsMap.set(player.id, {
      points: 0,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      byes: 0,
      actualMatches: 0,
      actualWins: 0,
      actualOpponentIds: [],
    });
  }

  // Process all completed matches
  for (const match of matches) {
    if (match.status !== 'completed') continue;

    const p1Stats = statsMap.get(match.player1_id);
    const p2Stats = match.player2_id ? statsMap.get(match.player2_id) : undefined;

    // Handle BYE match
    if (match.is_bye || match.is_Bye || !match.player2_id) {
      if (p1Stats) {
        p1Stats.points += 3;
        p1Stats.totalMatches += 1;
        p1Stats.byes += 1;
      }
      continue;
    }

    // Actual match between two players
    if (p1Stats && p2Stats) {
      p1Stats.totalMatches += 1;
      p2Stats.totalMatches += 1;
      p1Stats.actualMatches += 1;
      p2Stats.actualMatches += 1;

      p1Stats.actualOpponentIds.push(match.player2_id);
      p2Stats.actualOpponentIds.push(match.player1_id);

      if (match.is_double_loss) {
        p1Stats.losses += 1;
        p2Stats.losses += 1;
      } else if (match.winner_id === match.player1_id) {
        p1Stats.points += 3;
        p1Stats.wins += 1;
        p1Stats.actualWins += 1;
        p2Stats.losses += 1;
      } else if (match.winner_id === match.player2_id) {
        p2Stats.points += 3;
        p2Stats.wins += 1;
        p2Stats.actualWins += 1;
        p1Stats.losses += 1;
      } else {
        // Fallback if neither won or tie (treated as double loss in Vanguard)
        p1Stats.losses += 1;
        p2Stats.losses += 1;
      }
    }
  }

  // Step 1: Calculate self MW% and opponent MW% for each player
  const opponentMwMap = new Map<string, number>();
  const selfMwMap = new Map<string, number>();

  for (const player of players) {
    const s = statsMap.get(player.id)!;

    // Self MW (including BYE)
    if (s.totalMatches === 0) {
      selfMwMap.set(player.id, 0.33);
    } else {
      const rate = s.points / (s.totalMatches * 3);
      selfMwMap.set(player.id, Math.max(0.33, rate));
    }

    // Opponent MW (excluding BYE: only actual matches)
    if (s.actualMatches === 0) {
      opponentMwMap.set(player.id, 0.33);
    } else {
      const actualRate = (s.actualWins * 3) / (s.actualMatches * 3);
      opponentMwMap.set(player.id, Math.max(0.33, actualRate));
    }
  }

  // Step 2: Calculate OMW% for each player
  const omwMap = new Map<string, number>();

  for (const player of players) {
    const s = statsMap.get(player.id)!;
    const oppIds = s.actualOpponentIds;

    if (oppIds.length === 0) {
      omwMap.set(player.id, 0.33);
    } else {
      let sumOpponentMw = 0;
      for (const oppId of oppIds) {
        sumOpponentMw += opponentMwMap.get(oppId) ?? 0.33;
      }
      omwMap.set(player.id, sumOpponentMw / oppIds.length);
    }
  }

  // Step 3: Calculate OOMW% for each player
  const oomwMap = new Map<string, number>();

  for (const player of players) {
    const s = statsMap.get(player.id)!;
    const oppIds = s.actualOpponentIds;

    if (oppIds.length === 0) {
      oomwMap.set(player.id, 0.33);
    } else {
      let sumOpponentOmw = 0;
      for (const oppId of oppIds) {
        sumOpponentOmw += omwMap.get(oppId) ?? 0.33;
      }
      oomwMap.set(player.id, sumOpponentOmw / oppIds.length);
    }
  }

  // Step 4: Assemble standings and sort
  const standings: PlayerStanding[] = players.map((player) => {
    const s = statsMap.get(player.id)!;
    return {
      rank: 0,
      player,
      points: s.points,
      matchesPlayed: s.totalMatches,
      wins: s.wins,
      losses: s.losses,
      byes: s.byes,
      mw: selfMwMap.get(player.id) ?? 0.33,
      opponentMw: opponentMwMap.get(player.id) ?? 0.33,
      omw: omwMap.get(player.id) ?? 0.33,
      oomw: oomwMap.get(player.id) ?? 0.33,
      actualOpponentIds: s.actualOpponentIds,
    };
  });

  // Sort: Points DESC -> OMW DESC -> OOMW DESC -> lucky_draw_number ASC
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const omwDiff = b.omw - a.omw;
    if (Math.abs(omwDiff) > 0.000001) return omwDiff;
    const oomwDiff = b.oomw - a.oomw;
    if (Math.abs(oomwDiff) > 0.000001) return oomwDiff;
    return a.player.lucky_draw_number - b.player.lucky_draw_number;
  });

  // Assign 1-indexed ranks
  standings.forEach((item, index) => {
    item.rank = index + 1;
  });

  return standings;
}

/**
 * Format rate to 4 decimal places (e.g. 0.5556, 0.3300)
 */
export function formatRate(val: number): string {
  if (isNaN(val) || val === undefined || val === null) return '0.3300';
  return val.toFixed(4);
}
