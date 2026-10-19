import React from 'react';
import { Player } from '../types';
import { VANGUARD_NATIONS, getNationConfig, hexToRgba } from '../utils/nations';
import { BarChart3, Shield, Layers } from 'lucide-react';

interface MetaAnalyticsProps {
  players: Player[];
}

export const MetaAnalytics: React.FC<MetaAnalyticsProps> = ({ players }) => {
  const activePlayers = players.filter((p) => !p.is_dropped);
  const total = activePlayers.length;

  // Calculate nation breakdown
  const nationCounts: Record<string, number> = {};
  for (const n of VANGUARD_NATIONS) {
    nationCounts[n.name] = 0;
  }

  for (const p of activePlayers) {
    const nation = p.nation || 'Other';
    nationCounts[nation] = (nationCounts[nation] || 0) + 1;
  }

  const sortedNations = Object.entries(nationCounts)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  // Calculate top deck bosses
  const bossCounts: Record<string, number> = {};
  for (const p of activePlayers) {
    if (p.deck_boss && p.deck_boss.trim()) {
      const boss = p.deck_boss.trim();
      bossCounts[boss] = (bossCounts[boss] || 0) + 1;
    }
  }

  const sortedBosses = Object.entries(bossCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  if (total === 0) {
    return (
      <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 text-center text-gray-500">
        ยังไม่มีข้อมูลผู้เล่นสำหรับวิเคราะห์ Meta
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-[#111827] border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-white">วิเคราะห์ Meta ของร้าน (Meta Analytics)</h3>
        </div>
        <span className="text-xs text-gray-400 font-mono">
          ผู้เล่นทั้งหมด: {total} คน
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nation Breakdown */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-gray-400" />
            <span>สัดส่วนประเทศ</span>
          </h4>

          <div className="space-y-3">
            {sortedNations.map(([nationName, count]) => {
              const config = getNationConfig(nationName);
              const percent = Math.round((count / total) * 100);

              return (
                <div key={nationName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="font-medium text-gray-300 flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: config.colorCode,
                          boxShadow: `0 0 8px ${hexToRgba(config.colorCode, 0.7)}`,
                        }}
                      />
                      {config.name}
                    </span>
                    <span className="text-gray-400 font-mono">
                      {count} คน ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: config.colorCode,
                        boxShadow: `0 0 6px ${hexToRgba(config.colorCode, 0.4)}`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Deck Bosses */}
        <div>
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-gray-400" />
            <span>แวนการ์ดหลักยอดนิยม</span>
          </h4>

          {sortedBosses.length > 0 ? (
            <div className="space-y-2.5">
              {sortedBosses.map(([bossName, count], idx) => {
                const percent = Math.round((count / total) * 100);
                return (
                  <div
                    key={bossName}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-gray-850 border border-gray-800 hover:border-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-md bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                        #{idx + 1}
                      </span>
                      <span className="font-medium text-sm text-white">🎴 {bossName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-semibold">
                        {count} คน
                      </span>
                      <span className="text-xs text-gray-500 font-mono">
                        {percent}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-gray-850 border border-gray-800 text-center text-gray-500 text-xs">
              ผู้เล่นยังไม่ได้ระบุชื่อแวนการ์ดหลัก
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
