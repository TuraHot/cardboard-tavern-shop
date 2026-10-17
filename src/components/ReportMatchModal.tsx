import React, { useState } from 'react';
import { Match, Player } from '../types';
import { NationBadge } from './NationBadge';
import { Trophy, XCircle, X } from 'lucide-react';

interface ReportMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  player1?: Player;
  player2?: Player;
  onSaveResult: (winnerId: string | null, isDoubleLoss: boolean) => Promise<void>;
  isAdmin?: boolean;
}

export const ReportMatchModal: React.FC<ReportMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  player1,
  player2,
  onSaveResult,
  isAdmin = false,
}) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !match || !player1) return null;

  const isBye = match.is_bye || match.is_Bye || !player2;

  const handleSelect = async (winnerId: string | null, isDoubleLoss: boolean) => {
    try {
      setSubmitting(true);
      await onSaveResult(winnerId, isDoubleLoss);
      onClose();
    } catch (err) {
      console.error('Failed to save match result:', err);
      alert('เกิดข้อผิดพลาดในการบันทึกผลการแข่ง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#111827] border border-gray-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">
            โต๊ะที่ {match.table_number} · รอบที่ {match.round_number}
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {isAdmin ? 'บันทึก / แก้ไขผลการแข่งขัน' : 'รายงานผลการแข่งขัน'}
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            เลือกผู้ชนะประจำโต๊ะนี้ หรือเลือกแพ้คู่กรณีหมดเวลาและไม่สามารถหาผู้ชนะได้
          </p>
        </div>

        {/* Players Card */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {/* Player 1 Option */}
          <button
            disabled={submitting}
            onClick={() => handleSelect(player1.id, false)}
            className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
              match.winner_id === player1.id
                ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30'
                : 'bg-gray-850 hover:bg-gray-800 border-gray-700/80 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-400">🍀 #{player1.lucky_draw_number}</span>
                <span className="font-bold text-base sm:text-lg text-white">{player1.name}</span>
              </div>
              <NationBadge nation={player1.nation} deckBoss={player1.deck_boss} size="sm" />
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-medium text-sm">
              <Trophy className="w-4 h-4 text-emerald-400" />
              <span>ชนะ</span>
            </div>
          </button>

          {!isBye && player2 && (
            <>
              <div className="flex items-center justify-center my-1">
                <span className="text-xs uppercase font-extrabold text-gray-500 tracking-wider">
                  — VS —
                </span>
              </div>

              {/* Player 2 Option */}
              <button
                disabled={submitting}
                onClick={() => handleSelect(player2.id, false)}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  match.winner_id === player2.id
                    ? 'bg-emerald-950/40 border-emerald-500/60 ring-2 ring-emerald-500/30'
                    : 'bg-gray-850 hover:bg-gray-800 border-gray-700/80 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-400">🍀 #{player2.lucky_draw_number}</span>
                    <span className="font-bold text-base sm:text-lg text-white">{player2.name}</span>
                  </div>
                  <NationBadge nation={player2.nation} deckBoss={player2.deck_boss} size="sm" />
                </div>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 font-medium text-sm">
                  <Trophy className="w-4 h-4 text-emerald-400" />
                  <span>ชนะ</span>
                </div>
              </button>

              {/* Double Loss Option */}
              <button
                disabled={submitting}
                onClick={() => handleSelect(null, true)}
                className={`mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                  match.is_double_loss
                    ? 'bg-red-950/50 border-red-500/60 text-red-300 ring-2 ring-red-500/30'
                    : 'bg-gray-900/60 hover:bg-red-950/30 border-gray-700 hover:border-red-500/40 text-gray-400 hover:text-red-300'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>แพ้คู่ (Double Loss)</span>
              </button>
            </>
          )}

          {isBye && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-center text-cyan-300 text-sm">
              ผู้เล่น {player1.name} ชนะ BYE
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};
