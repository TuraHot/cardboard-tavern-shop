import React, { useState } from 'react';
import { PlayerStanding } from '../types';
import { NationBadge } from './NationBadge';
import { formatRate, STANDINGS_FOOTER_NOTICE } from '../utils/tiebreaker';
import { Medal, Award, Search, Info, Crown } from 'lucide-react';

interface StandingsTableProps {
  standings: PlayerStanding[];
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
  showNationAndBoss?: boolean;
}

export const StandingsTable: React.FC<StandingsTableProps> = ({
  standings,
  searchQuery = '',
  onSearchChange,
  showNationAndBoss = true,
}) => {
  const [internalSearch, setInternalSearch] = useState('');
  const query = searchQuery || internalSearch;

  const filteredStandings = standings.filter((s) => {
    if (!query.trim()) return true;
    const lower = query.toLowerCase();
    const matchBasic =
      s.player.name.toLowerCase().includes(lower) ||
      s.player.lucky_draw_number.toString() === lower.replace('🍀', '').trim();

    if (matchBasic) return true;

    if (showNationAndBoss) {
      return (
        s.player.nation.toLowerCase().includes(lower) ||
        (s.player.deck_boss && s.player.deck_boss.toLowerCase().includes(lower))
      );
    }
    return false;
  });

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <div className="relative inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 text-gray-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-amber-200">
          <Crown className="w-4 h-4 fill-current drop-shadow-sm" />
        </div>
      );
    }
    if (rank === 2) {
      return (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-slate-200 to-slate-400 text-gray-950 font-black shadow-[0_0_12px_rgba(203,213,225,0.3)] border border-white/40">
          <Medal className="w-4 h-4" />
        </div>
      );
    }
    if (rank === 3) {
      return (
        <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-b from-amber-600 to-amber-900 text-amber-100 font-black shadow-[0_0_12px_rgba(217,119,6,0.3)] border border-amber-500/40">
          <Award className="w-4 h-4" />
        </div>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-white/[0.04] text-gray-400 font-mono text-xs font-semibold border border-white/[0.06]">
        {rank}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Header */}
      {onSearchChange || !searchQuery ? (
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              if (onSearchChange) onSearchChange(e.target.value);
              else setInternalSearch(e.target.value);
            }}
            placeholder={
              showNationAndBoss
                ? 'ค้นหาชื่อผู้เล่น, หมายเลข 🍀 หรือประเทศ/แวนการ์ดหลัก...'
                : 'ค้นหาชื่อผู้เล่น หรือ หมายเลข 🍀...'
            }
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-[#0b101c]/80 border border-white/[0.08] text-sm text-white placeholder-gray-500 focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all shadow-inner"
          />
        </div>
      ) : null}

      {/* Standings Table Card */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0c121e]/90 backdrop-blur-xl overflow-hidden shadow-[0_15px_35px_-10px_rgba(0,0,0,0.8)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] bg-black/40 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-4 text-center w-16">อันดับ</th>
                <th className="py-3 px-4">ผู้เล่น (Player)</th>
                <th className="py-3 px-3 text-center">แต้ม</th>
                <th className="py-3 px-3 text-center">ชนะ-แพ้</th>
                <th className="py-3 px-3 text-center" title="Opponent Match Win % (ขั้นต่ำ 0.33)">
                  OMW
                </th>
                <th className="py-3 px-3 text-center" title="Opponent's Opponent Match Win %">
                  OOMW
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04] text-sm font-sans">
              {filteredStandings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    ไม่พบข้อมูลผู้เล่นที่ค้นหา
                  </td>
                </tr>
              ) : (
                filteredStandings.map((s) => {
                  const isDropped = s.player.is_dropped;
                  const isChampion = s.rank === 1;
                  const isPodium = s.rank <= 3;

                  return (
                    <tr
                      key={s.player.id}
                      className={`transition-colors ${
                        isChampion
                          ? 'bg-gradient-to-r from-amber-500/10 via-amber-950/20 to-transparent hover:from-amber-500/15'
                          : isPodium
                          ? 'bg-gradient-to-r from-white/[0.03] to-transparent hover:bg-white/[0.05]'
                          : 'hover:bg-white/[0.02]'
                      } ${isDropped ? 'opacity-40 line-through' : ''}`}
                    >
                      <td className="py-3.5 px-4 text-center">
                        {getRankBadge(s.rank)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/30 font-bold whitespace-nowrap shadow-sm">
                              🍀 #{s.player.lucky_draw_number}
                            </span>
                            <span className={`font-bold text-base tracking-tight ${isChampion ? 'gold-gradient-text' : 'text-white'}`}>
                              {s.player.name}
                            </span>
                            {isDropped && (
                              <span className="text-[10px] px-2 py-0.2 rounded bg-red-950 text-red-400 border border-red-500/40">
                                ดรอปแล้ว
                              </span>
                            )}
                          </div>
                          {showNationAndBoss ? (
                            <NationBadge
                              nation={s.player.nation}
                              deckBoss={s.player.deck_boss}
                              size="sm"
                            />
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-white/[0.04] text-gray-400 border border-white/[0.08]">
                              <span className="text-gray-500">🔒</span> ซ่อนข้อมูลเด็คจนจบการแข่งขัน
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span className={`font-mono font-black text-lg ${isChampion ? 'gold-gradient-text drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'text-amber-200'}`}>
                          {s.points}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs whitespace-nowrap">
                        <span className="text-emerald-400 font-bold">{s.wins}</span>
                        <span className="text-gray-500 mx-1.5">-</span>
                        <span className="text-rose-400 font-bold">{s.losses}</span>
                        {s.byes > 0 && (
                          <span className="text-[10px] text-cyan-400 ml-1.5 px-1.5 py-0.5 rounded bg-cyan-950/40 border border-cyan-500/20">
                            {s.byes} BYE
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs font-semibold text-gray-300">
                        {formatRate(s.omw)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs font-semibold text-gray-400">
                        {formatRate(s.oomw)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Required Mandatory Thai Footer Notice */}
        <div className="p-4 bg-black/40 border-t border-white/[0.06] text-xs text-gray-400 flex items-start gap-2.5 leading-relaxed">
          <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <span className="text-gray-300 font-light">{STANDINGS_FOOTER_NOTICE}</span>
        </div>
      </div>
    </div>
  );
};
