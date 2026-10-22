import React, { useState, useEffect } from 'react';
import { Match, Player } from '../types';
import { NationBadge } from './NationBadge';
import { Trophy, XCircle, X, AlertTriangle, Check } from 'lucide-react';

interface ReportMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match | null;
  player1?: Player;
  player2?: Player;
  onSaveResult: (winnerId: string | null, isDoubleLoss: boolean) => Promise<void>;
  isAdmin?: boolean;
  format?: string | null;
  isPastRound?: boolean;
  currentRound?: number;
}

export const ReportMatchModal: React.FC<ReportMatchModalProps> = ({
  isOpen,
  onClose,
  match,
  player1,
  player2,
  onSaveResult,
  isAdmin = false,
  format,
  isPastRound = false,
  currentRound,
}) => {
  const [selectedWinnerId, setSelectedWinnerId] = useState<string | null>(null);
  const [selectedDoubleLoss, setSelectedDoubleLoss] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (match) {
      setSelectedWinnerId(match.winner_id ?? null);
      setSelectedDoubleLoss(Boolean(match.is_double_loss));
    }
  }, [match, isOpen]);

  if (!isOpen || !match || !player1) return null;

  const isBye = match.is_bye || match.is_Bye || !player2;

  const handleSelectPlayer = (playerId: string) => {
    if (submitting) return;
    setSelectedWinnerId(playerId);
    setSelectedDoubleLoss(false);
  };

  const handleSelectDoubleLoss = () => {
    if (submitting) return;
    setSelectedWinnerId(null);
    setSelectedDoubleLoss(true);
  };

  const handleCancel = () => {
    if (submitting) return;
    // Revert to original match result
    if (match) {
      setSelectedWinnerId(match.winner_id ?? null);
      setSelectedDoubleLoss(Boolean(match.is_double_loss));
    }
    onClose();
  };

  const handleSave = async () => {
    if (submitting) return;
    if (!selectedWinnerId && !selectedDoubleLoss) {
      alert('กรุณาเลือกผู้ชนะหรือผลการแข่งขันก่อนกดบันทึก');
      return;
    }

    try {
      setSubmitting(true);
      await onSaveResult(selectedWinnerId, selectedDoubleLoss);
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
          onClick={handleCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
          title="ปิดและยกเลิก"
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
            เลือกผู้ชนะประจำโต๊ะนี้ หรือเลือกแพ้คู่ จากนั้นกดปุ่มบันทึก
          </p>
        </div>

        {isPastRound && (
          <div className="mb-5 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs text-left flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-200 text-sm">
                คุณกำลังแก้ไขผลรอบที่ {match.round_number} (รอบที่ผ่านมาแล้ว)
              </div>
              <div className="text-gray-300 mt-1 leading-relaxed">
                เมื่อกดบันทึก ระบบจะ<strong>ลบผลการจับคู่ตั้งแต่รอบที่ {match.round_number + 1} {currentRound ? `ถึงรอบที่ ${currentRound}` : ''} ออกทั้งหมด</strong> และ<strong>ย้อนสถานะกลับมาที่รอบที่ {match.round_number}</strong> เพื่อให้คุณสามารถตรวจสอบหรือแก้ไขคู่อื่นๆ จนครบก่อน แล้วค่อยกดปุ่มจับคู่รอบถัดไปด้านบน
              </div>
              <div className="text-amber-300/90 mt-1.5 font-medium">
                *หากกดยกเลิก ระบบจะย้อนกลับไปผลการแข่งขันเดิมโดยไม่มีการเปลี่ยนแปลงใดๆ
              </div>
            </div>
          </div>
        )}

        {/* Players Card */}
        <div className="grid grid-cols-1 gap-3 mb-6">
          {/* Player 1 Option */}
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSelectPlayer(player1.id)}
            className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
              selectedWinnerId === player1.id
                ? 'bg-gradient-to-r from-emerald-950/60 to-[#0e1626] border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                : 'bg-gray-850 hover:bg-gray-800 border-gray-700/80 hover:border-emerald-500/40 opacity-70 hover:opacity-100'
            }`}
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-400">🍀 #{player1.lucky_draw_number}</span>
                <span className={`font-bold text-base sm:text-lg ${selectedWinnerId === player1.id ? 'text-emerald-200' : 'text-white'}`}>
                  {player1.name}
                </span>
              </div>
              <NationBadge nation={player1.nation} deckBoss={player1.deck_boss} format={format} size="sm" />
            </div>

            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs sm:text-sm transition-all ${
                selectedWinnerId === player1.id
                  ? 'bg-emerald-500 text-gray-950 border-emerald-400 shadow-md font-black'
                  : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>{selectedWinnerId === player1.id ? '✓ ชนะ (เลือกอยู่)' : 'ชนะ'}</span>
            </div>
          </button>

          {!isBye && player2 && (
            <>
              <div className="flex items-center justify-center my-0.5">
                <span className="text-xs uppercase font-extrabold text-gray-500 tracking-wider">
                  — VS —
                </span>
              </div>

              {/* Player 2 Option */}
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleSelectPlayer(player2.id)}
                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                  selectedWinnerId === player2.id
                    ? 'bg-gradient-to-r from-emerald-950/60 to-[#0e1626] border-emerald-500 ring-2 ring-emerald-500/40 shadow-[0_0_20px_rgba(52,211,153,0.2)]'
                    : 'bg-gray-850 hover:bg-gray-800 border-gray-700/80 hover:border-emerald-500/40 opacity-70 hover:opacity-100'
                }`}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-400">🍀 #{player2.lucky_draw_number}</span>
                    <span className={`font-bold text-base sm:text-lg ${selectedWinnerId === player2.id ? 'text-emerald-200' : 'text-white'}`}>
                      {player2.name}
                    </span>
                  </div>
                  <NationBadge nation={player2.nation} deckBoss={player2.deck_boss} format={format} size="sm" />
                </div>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-semibold text-xs sm:text-sm transition-all ${
                    selectedWinnerId === player2.id
                      ? 'bg-emerald-500 text-gray-950 border-emerald-400 shadow-md font-black'
                      : 'bg-emerald-600/10 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  <Trophy className="w-4 h-4" />
                  <span>{selectedWinnerId === player2.id ? '✓ ชนะ (เลือกอยู่)' : 'ชนะ'}</span>
                </div>
              </button>

              {/* Double Loss Option */}
              <button
                type="button"
                disabled={submitting}
                onClick={handleSelectDoubleLoss}
                className={`mt-2 flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-semibold transition-all ${
                  selectedDoubleLoss
                    ? 'bg-red-950/60 border-red-500 text-red-200 ring-2 ring-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : 'bg-gray-900/60 hover:bg-red-950/30 border-gray-700 hover:border-red-500/40 text-gray-400 hover:text-red-300'
                }`}
              >
                <XCircle className="w-4 h-4 text-red-400" />
                <span>{selectedDoubleLoss ? '✓ แพ้คู่ (Double Loss - เลือกอยู่)' : 'แพ้คู่ (Double Loss)'}</span>
              </button>
            </>
          )}

          {isBye && (
            <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 text-center text-cyan-300 text-sm">
              ผู้เล่น {player1.name} ชนะ BYE
            </div>
          )}
        </div>

        {/* Action Buttons: Cancel (Revert) vs Save */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={handleCancel}
            disabled={submitting}
            className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-750 text-gray-300 hover:text-white text-xs sm:text-sm font-semibold border border-white/5 transition-colors"
          >
            ยกเลิก (คงผลเดิม)
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || (!selectedWinnerId && !selectedDoubleLoss)}
            className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black flex items-center gap-2 shadow-lg transition-all ${
              !selectedWinnerId && !selectedDoubleLoss
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed border border-white/5'
                : isPastRound
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 shadow-amber-500/25 active:scale-95'
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-gray-950 shadow-emerald-500/25 active:scale-95'
            }`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                <span>กำลังบันทึก...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{isPastRound ? 'บันทึกผลและย้อนกลับรอบนี้' : 'บันทึกผลการแข่งขัน'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
