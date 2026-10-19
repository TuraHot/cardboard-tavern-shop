import React, { useState } from 'react';
import { Match, Player } from '../types';
import { Search, Trophy, XCircle, Clock, ChevronRight, Swords, Shield, Printer } from 'lucide-react';

interface PairingsListProps {
  matches: Match[];
  players: Player[];
  onSelectMatch?: (match: Match) => void;
  canReport?: boolean;
  onExportPdf?: () => void;
}

export const PairingsList: React.FC<PairingsListProps> = ({
  matches,
  players,
  onSelectMatch,
  canReport = true,
  onExportPdf,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const playerMap = new Map<string, Player>();
  for (const p of players) {
    playerMap.set(p.id, p);
  }

  // Filter matches based on search query
  const filteredMatches = matches.filter((m) => {
    if (!searchQuery.trim()) return true;
    const lower = searchQuery.toLowerCase().trim();
    const cleanQuery = lower.replace('🍀', '').trim();

    const p1 = playerMap.get(m.player1_id);
    const p2 = m.player2_id ? playerMap.get(m.player2_id) : undefined;

    const matchP1 =
      p1 &&
      (p1.name.toLowerCase().includes(lower) ||
        p1.lucky_draw_number.toString() === cleanQuery);

    const matchP2 =
      p2 &&
      (p2.name.toLowerCase().includes(lower) ||
        p2.lucky_draw_number.toString() === cleanQuery);

    const matchTable = m.table_number.toString() === cleanQuery;

    return matchP1 || matchP2 || matchTable;
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Search Header and Export Button */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาชื่อผู้เล่น, โต๊ะ หรือหมายเลข 🍀..."
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0b101c]/80 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
          />
        </div>

        {onExportPdf && (
          <button
            type="button"
            onClick={onExportPdf}
            className="px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm shrink-0 active:scale-95"
            title="พิมพ์หรือบันทึกตารางจับคู่นี้เป็น PDF"
          >
            <Printer className="w-4 h-4 text-amber-400" />
            <span>Export PDF ตารางแข่งขัน</span>
          </button>
        )}
      </div>

      {/* Match Cards */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0c121e]/80 border border-white/[0.06] text-gray-500">
          <Swords className="w-10 h-10 mx-auto mb-3 text-gray-600 opacity-60" />
          <p className="text-sm">ไม่พบคู่แข่งขันที่ค้นหา หรือยังไม่มีการจับคู่ในรอบนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredMatches.map((match) => {
            const p1 = playerMap.get(match.player1_id);
            const p2 = match.player2_id ? playerMap.get(match.player2_id) : undefined;
            const isCompleted = match.status === 'completed';
            const isBye = match.is_bye || match.is_Bye || !p2;

            const p1Won = isCompleted && match.winner_id === match.player1_id;
            const p2Won = isCompleted && p2 && match.winner_id === p2.id;
            const isDoubleLoss = isCompleted && match.is_double_loss;

            return (
              <div
                key={match.id}
                onClick={() => canReport && !isBye && onSelectMatch && onSelectMatch(match)}
                className={`p-4 rounded-2xl border transition-all tcg-card sleeve-frame ${
                  canReport && !isBye
                    ? 'cursor-pointer hover:border-amber-500/40 hover:shadow-[0_10px_25px_-5px_rgba(245,158,11,0.15)] hover:-translate-y-0.5'
                    : ''
                } ${
                  isCompleted
                    ? 'bg-[#0a0f1b]/90 border-white/[0.06]'
                    : 'bg-[#0d1424] border-white/[0.1] shadow-lg'
                }`}
              >
                {/* Top Table Header */}
                <div className="flex items-center justify-between mb-3.5 border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-200 border border-amber-500/30 shadow-sm flex items-center gap-1.5">
                      <Shield className="w-3 h-3 text-amber-400" />
                      <span>โต๊ะ {match.table_number}</span>
                    </span>
                    <span className="text-xs text-gray-400 font-medium">รอบที่ {match.round_number}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    {isCompleted ? (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-semibold shadow-sm">
                        ✓ จบการแข่งขัน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-500/30 font-semibold animate-pulse">
                        <Clock className="w-3 h-3" /> กำลังแข่งขัน
                      </span>
                    )}

                    {canReport && !isBye && (
                      <span className="text-xs text-amber-300/80 hover:text-amber-200 hidden sm:inline-flex items-center gap-0.5 font-medium ml-1">
                        {isCompleted ? 'แก้ไขผล' : 'ลงผลการแข่ง'} <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Match Opponents Dual Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                  {/* Player 1 Card */}
                  <div
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      p1Won
                        ? 'bg-gradient-to-r from-emerald-950/40 to-[#0e1626] border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20'
                        : isCompleted && !isBye
                        ? 'bg-black/20 border-white/[0.04] opacity-50'
                        : 'bg-[#0b101c] border-white/[0.06] hover:border-white/10'
                    }`}
                  >
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
                          🍀 #{p1?.lucky_draw_number ?? '-'}
                        </span>
                        <span className={`font-bold text-base ${p1Won ? 'text-emerald-200' : 'text-white'}`}>
                          {p1?.name ?? 'ไม่พบข้อมูล'}
                        </span>
                      </div>
                    </div>

                    {p1Won && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-xs font-black shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-emerald-300" />
                        <span>ชนะ</span>
                      </span>
                    )}
                  </div>

                  {/* Player 2 Card or BYE */}
                  {isBye ? (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 text-center text-amber-200 text-sm font-semibold flex items-center justify-center gap-2">
                      <span>ชนะ BYE</span>
                    </div>
                  ) : (
                    <div
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                        p2Won
                          ? 'bg-gradient-to-r from-emerald-950/40 to-[#0e1626] border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.15)] ring-1 ring-emerald-500/20'
                          : isCompleted
                          ? 'bg-black/20 border-white/[0.04] opacity-50'
                          : 'bg-[#0b101c] border-white/[0.06] hover:border-white/10'
                      }`}
                    >
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30 font-bold">
                            🍀 #{p2?.lucky_draw_number ?? '-'}
                          </span>
                          <span className={`font-bold text-base ${p2Won ? 'text-emerald-200' : 'text-white'}`}>
                            {p2?.name ?? 'ไม่พบข้อมูล'}
                          </span>
                        </div>
                      </div>

                      {p2Won && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/40 text-xs font-black shadow-sm">
                          <Trophy className="w-3.5 h-3.5 text-emerald-300" />
                          <span>ชนะ</span>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {isDoubleLoss && (
                  <div className="mt-2.5 text-center text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 py-1.5 rounded-lg flex items-center justify-center gap-1.5 font-medium">
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>แพ้คู่ (Double Loss)</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
