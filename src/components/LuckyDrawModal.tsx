import React, { useState } from 'react';
import { Player } from '../types';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, X, Filter, RotateCw, CheckCircle, UserCheck } from 'lucide-react';
import { sounds } from '../utils/audio';
import { NationBadge } from './NationBadge';

interface LuckyDrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

export const LuckyDrawModal: React.FC<LuckyDrawModalProps> = ({
  isOpen,
  onClose,
  players,
}) => {
  const [activeOnly, setActiveOnly] = useState(true);
  const [excludePreviousWinners, setExcludePreviousWinners] = useState(true);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [currentDisplayPlayer, setCurrentDisplayPlayer] = useState<Player | null>(null);
  const [drawHistory, setDrawHistory] = useState<Player[]>([]);

  // Exclude previous winners if option is active
  const previousWinnerIds = new Set(drawHistory.map((p) => p.id));

  const eligiblePlayers = players.filter((p) => {
    if (activeOnly && p.is_dropped) return false;
    if (excludePreviousWinners && previousWinnerIds.has(p.id)) return false;
    return true;
  });

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#22d3ee', '#fbbf24', '#34d399', '#f472b6', '#ef4444', '#818cf8'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
      });
    }, 250);
  };

  const handleStartSpin = () => {
    if (eligiblePlayers.length === 0 || isSpinning) return;

    setIsSpinning(true);
    setWinner(null);

    // Spin duration and speed ramp
    let counter = 0;
    const totalTicks = 35;
    let currentSpeed = 50;

    const tick = () => {
      counter++;
      const randomIdx = Math.floor(Math.random() * eligiblePlayers.length);
      const chosen = eligiblePlayers[randomIdx];
      setCurrentDisplayPlayer(chosen);
      sounds.tick();

      if (counter < totalTicks) {
        // Slow down gradually
        if (counter > 20) {
          currentSpeed += 20;
        }
        setTimeout(tick, currentSpeed);
      } else {
        // Final winner
        setIsSpinning(false);
        setWinner(chosen);
        setDrawHistory((prev) => [chosen, ...prev.filter((p) => p.id !== chosen.id)]);
        sounds.fanfare();
        triggerConfetti();
      }
    };

    tick();
  };

  const handleRemoveWinnerFromHistory = (playerId: string) => {
    setDrawHistory((prev) => prev.filter((p) => p.id !== playerId));
    if (winner?.id === playerId) {
      setWinner(null);
    }
  };

  const handleResetHistory = () => {
    if (confirm('ต้องการล้างประวัติผู้ได้รับรางวัลทั้งหมดเพื่อเริ่มสุ่มใหม่ใช่หรือไม่?')) {
      setDrawHistory([]);
      setWinner(null);
      setCurrentDisplayPlayer(null);
    }
  };

  if (!isOpen) return null;

  const isAllDrawn = eligiblePlayers.length === 0 && drawHistory.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-gray-700 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ระบบสุ่มจับรางวัล Lucky Draw</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            🍀 Lucky Draw Randomizer
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            สุ่มจับรางวัลผู้โชคดีสำหรับผู้เข้าร่วมแข่งขันการ์ดไฟต์ แวนการ์ด
          </p>
        </div>

        {/* Filter Options */}
        <div className="space-y-2 mb-4">
          {/* Exclude Previous Winners Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/60 border border-gray-700/60">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-200">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <div>
                <span className="font-semibold text-white">สุ่มคนไม่ซ้ำ (ไม่สุ่มคนที่ได้รางวัลแล้ว)</span>
                <p className="text-[11px] text-gray-400">คัดรายชื่อผู้ที่ถูกสุ่มได้รางวัลไปแล้วออกจากการสุ่มรอบต่อไป</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={excludePreviousWinners}
                onChange={(e) => setExcludePreviousWinners(e.target.checked)}
                disabled={isSpinning}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Active Players Only Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-gray-800/60 border border-gray-700/60">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300">
              <Filter className="w-4 h-4 text-cyan-400" />
              <span>เฉพาะผู้เล่นที่ยังไม่ออกจากการแข่งขัน (Active Only)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
              <input
                type="checkbox"
                checked={activeOnly}
                onChange={(e) => setActiveOnly(e.target.checked)}
                disabled={isSpinning}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>
        </div>

        {/* Status Pill */}
        <div className="flex items-center justify-between text-xs text-gray-400 mb-2 px-1">
          <span>
            เหลือผู้มีสิทธิ์ลุ้นรางวัล:{' '}
            <strong className="text-emerald-400 font-mono text-sm">{eligiblePlayers.length}</strong> / {players.length} คน
          </span>
          {drawHistory.length > 0 && (
            <span className="text-amber-300/90 font-medium">
              ได้รับรางวัลแล้ว {drawHistory.length} คน
            </span>
          )}
        </div>

        {/* Display / Slot Machine Area */}
        <div className="relative my-4 p-8 rounded-2xl bg-gradient-to-b from-gray-900 to-gray-950 border border-cyan-500/40 shadow-inner flex flex-col items-center justify-center min-h-[220px] overflow-hidden">
          {/* Animated decorative glow rings */}
          <div className="absolute inset-0 bg-radial from-cyan-500/10 via-transparent to-transparent pointer-events-none" />

          {currentDisplayPlayer || winner ? (
            <motion.div
              key={winner ? winner.id : currentDisplayPlayer?.id}
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 15 }}
              className="flex flex-col items-center text-center z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xl sm:text-2xl font-black mb-3">
                🍀 หมายเลข #{winner ? winner.lucky_draw_number : currentDisplayPlayer?.lucky_draw_number}
              </div>

              <div className="text-3xl sm:text-4xl font-black text-white tracking-wide mb-2">
                {winner ? winner.name : currentDisplayPlayer?.name}
              </div>

              <div className="mt-2">
                <NationBadge
                  nation={(winner ? winner.nation : currentDisplayPlayer?.nation) || 'Other'}
                  deckBoss={winner ? winner.deck_boss : currentDisplayPlayer?.deck_boss}
                  size="md"
                />
              </div>

              {winner && (
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-4 flex items-center gap-2 text-amber-300 font-bold text-sm bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30"
                >
                  <Trophy className="w-4 h-4 text-amber-400" />
                  <span>ขอแสดงความยินดีด้วยครับ! (รางวัลที่ #{drawHistory.length})</span>
                </motion.div>
              )}
            </motion.div>
          ) : isAllDrawn ? (
            <div className="text-center z-10 p-4">
              <Trophy className="w-12 h-12 mx-auto mb-2 text-amber-400 animate-bounce" />
              <h3 className="text-lg font-bold text-white mb-1">
                สุ่มรางวัลครบทุกคนแล้ว!
              </h3>
              <p className="text-xs text-gray-400 mb-3">
                ผู้เล่นที่มีสิทธิ์ทั้งหมด ({drawHistory.length} คน) ได้รับรางวัลเรียบร้อย
              </p>
              <button
                type="button"
                onClick={handleResetHistory}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-all"
              >
                🔄 ล้างประวัติเพื่อเริ่มสุ่มใหม่
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-600 animate-pulse" />
              <p className="text-sm">
                มีผู้เล่นที่มีสิทธิ์สุ่ม {eligiblePlayers.length} คน
              </p>
              <p className="text-xs text-gray-600 mt-1">
                กดปุ่ม "เริ่มสุ่มรางวัล" ด้านล่างเพื่อเริ่มการสุ่ม
              </p>
            </div>
          )}
        </div>

        {/* Spin Button */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleStartSpin}
            disabled={isSpinning || eligiblePlayers.length === 0}
            className={`w-full py-4 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-3 shadow-lg transition-all ${
              isSpinning
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : eligiblePlayers.length === 0
                ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-gray-950 hover:shadow-cyan-500/25 active:scale-[0.99]'
            }`}
          >
            <RotateCw className={`w-5 h-5 ${isSpinning ? 'animate-spin' : ''}`} />
            <span>
              {isSpinning
                ? 'กำลังสุ่มหมายเลข...'
                : isAllDrawn
                ? 'สุ่มรางวัลครบทุกคนแล้ว'
                : eligiblePlayers.length === 0
                ? 'ไม่มีผู้เล่นที่มีสิทธิ์สุ่ม'
                : '🎰 เริ่มสุ่มรางวัล (Spin Lucky Draw)'}
            </span>
          </button>
        </div>

        {/* Draw History */}
        {drawHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-800">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider block">
                ประวัติผู้ที่ถูกสุ่มได้รางวัล ({drawHistory.length} คน):
              </span>
              <button
                type="button"
                onClick={handleResetHistory}
                disabled={isSpinning}
                className="text-[11px] text-rose-400 hover:text-rose-300 underline underline-offset-2 transition-colors disabled:opacity-50"
              >
                ล้างประวัติทั้งหมด
              </button>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
              {drawHistory.map((p, idx) => (
                <span
                  key={p.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-800/90 border border-gray-700 text-xs text-gray-200 shadow-sm"
                >
                  <span className="text-amber-400 font-mono font-bold text-[11px]">
                    #{drawHistory.length - idx}
                  </span>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    🍀 #{p.lucky_draw_number} {p.name}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveWinnerFromHistory(p.id)}
                    disabled={isSpinning}
                    title="ลบออกจากประวัติเพื่อให้นำกลับมาสุ่มใหม่ได้"
                    className="text-gray-500 hover:text-rose-400 ml-1 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
