import { Match, Player } from '../types';
import { calculateStandings } from './tiebreaker';

export interface NewRoundPairingResult {
  roundNumber: number;
  matches: Omit<Match, 'id' | 'created_at'>[];
  byePlayerId: string | null;
}

/**
 * Shuffles an array in place with Fisher-Yates
 */
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Generates Swiss Round Pairings adhering to Bushiroad Vanguard rules.
 */
export function generateSwissPairings(
  tournamentId: string,
  roundNumber: number,
  allPlayers: Player[],
  previousMatches: Match[]
): NewRoundPairingResult {
  // 1. Filter active players
  const activePlayers = allPlayers.filter((p) => !p.is_dropped);

  if (activePlayers.length < 2) {
    throw new Error('ต้องมีผู้เล่นที่ยังอยู่ในการแข่งขันอย่างน้อย 2 คน');
  }

  // Calculate current standings and points for each active player
  const standings = calculateStandings(activePlayers, previousMatches);
  const playerPointsMap = new Map<string, number>();
  for (const s of standings) {
    playerPointsMap.set(s.player.id, s.points);
  }

  // Build match history set to prevent rematches
  const historySet = new Set<string>();
  for (const m of previousMatches) {
    if (m.player1_id && m.player2_id && !m.is_bye && !m.is_Bye) {
      historySet.add(`${m.player1_id}:${m.player2_id}`);
      historySet.add(`${m.player2_id}:${m.player1_id}`);
    }
  }

  let playersToPair = [...activePlayers];
  let byePlayer: Player | null = null;

  // 2. Handle odd player count (BYE Assignment)
  if (playersToPair.length % 2 !== 0) {
    // Candidates who haven't received a BYE yet
    let candidates = playersToPair.filter((p) => !p.has_received_bye);

    // If somehow all have received a BYE, fallback to all active players
    if (candidates.length === 0) {
      candidates = [...playersToPair];
    }

    // Sort by lowest points
    let minPoints = Infinity;
    for (const c of candidates) {
      const pts = playerPointsMap.get(c.id) ?? 0;
      if (pts < minPoints) minPoints = pts;
    }

    // Filter lowest point bracket and randomly select one
    const lowestPointCandidates = candidates.filter(
      (c) => (playerPointsMap.get(c.id) ?? 0) === minPoints
    );
    const shuffledCandidates = shuffleArray(lowestPointCandidates);
    byePlayer = shuffledCandidates[0];

    // Remove bye player from pairing pool
    playersToPair = playersToPair.filter((p) => p.id !== byePlayer!.id);
  }

  // 3. Group by score brackets (descending points) and shuffle within bracket
  // Group players by points
  const bracketMap = new Map<number, Player[]>();
  for (const player of playersToPair) {
    const pts = playerPointsMap.get(player.id) ?? 0;
    if (!bracketMap.has(pts)) {
      bracketMap.set(pts, []);
    }
    bracketMap.get(pts)!.push(player);
  }

  // Sort score brackets descending
  const sortedPoints = Array.from(bracketMap.keys()).sort((a, b) => b - a);

  // Flatten ordered list with shuffled brackets
  const orderedPlayers: Player[] = [];
  for (const pts of sortedPoints) {
    const bracketPlayers = bracketMap.get(pts)!;
    orderedPlayers.push(...shuffleArray(bracketPlayers));
  }

  // 4. Backtracking algorithm to pair players avoiding rematches
  const pairs = solveSwissBacktracking(orderedPlayers, historySet);

  if (!pairs) {
    // If strict no-rematch fails (rare edge case), fallback to best-effort pairing
    console.warn('Strict rematch-free pairing not possible, falling back to soft pairing');
  }

  const finalPairs = pairs || fallbackPairing(orderedPlayers, historySet);

  // 5. Construct Match records with table numbers
  const generatedMatches: Omit<Match, 'id' | 'created_at'>[] = [];
  let tableNumber = 1;

  for (const [p1, p2] of finalPairs) {
    generatedMatches.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      table_number: tableNumber++,
      player1_id: p1.id,
      player2_id: p2.id,
      winner_id: null,
      is_bye: false,
      is_double_loss: false,
      status: 'pending',
    });
  }

  // Add the BYE match if applicable
  if (byePlayer) {
    generatedMatches.push({
      tournament_id: tournamentId,
      round_number: roundNumber,
      table_number: tableNumber++,
      player1_id: byePlayer.id,
      player2_id: null,
      winner_id: byePlayer.id,
      is_bye: true,
      is_double_loss: false,
      status: 'completed',
    });
  }

  return {
    roundNumber,
    matches: generatedMatches,
    byePlayerId: byePlayer ? byePlayer.id : null,
  };
}

/**
 * Recursive backtracking algorithm to find pairings without rematches
 */
function solveSwissBacktracking(
  remaining: Player[],
  historySet: Set<string>
): [Player, Player][] | null {
  if (remaining.length === 0) return [];
  if (remaining.length % 2 !== 0) return null;

  const p1 = remaining[0];
  const candidates = remaining.slice(1);

  for (let i = 0; i < candidates.length; i++) {
    const p2 = candidates[i];
    const matchKey = `${p1.id}:${p2.id}`;

    if (!historySet.has(matchKey)) {
      // Valid pairing, test recursively
      const nextRemaining = [
        ...candidates.slice(0, i),
        ...candidates.slice(i + 1),
      ];
      const subResult = solveSwissBacktracking(nextRemaining, historySet);
      if (subResult !== null) {
        return [[p1, p2], ...subResult];
      }
    }
  }

  return null;
}

/**
 * Fallback pairing that minimizes rematches if strict rematch-free is mathematically impossible
 */
function fallbackPairing(
  players: Player[],
  historySet: Set<string>
): [Player, Player][] {
  const remaining = [...players];
  const pairs: [Player, Player][] = [];

  while (remaining.length >= 2) {
    const p1 = remaining.shift()!;
    // Find candidate with lowest rematch penalty
    let bestIdx = 0;
    let minPenalty = 1;

    for (let i = 0; i < remaining.length; i++) {
      const p2 = remaining[i];
      const hasPlayed = historySet.has(`${p1.id}:${p2.id}`) ? 1 : 0;
      if (hasPlayed < minPenalty) {
        minPenalty = hasPlayed;
        bestIdx = i;
        if (minPenalty === 0) break;
      }
    }

    const p2 = remaining.splice(bestIdx, 1)[0];
    pairs.push([p1, p2]);
  }

  return pairs;
}
