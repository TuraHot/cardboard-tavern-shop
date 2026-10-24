import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Tournament } from '../types';
import { Copy, Calendar, Loader2, X, AlertCircle, Clock, Users } from 'lucide-react';

export interface DuplicateTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament | null;
  onSuccess?: (newTournament: Tournament) => void;
}

const getTodayDateString = (d: Date = new Date()) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const toLocalDatetimeInput = (dateStr?: string | null) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const now = new Date();
  if (!dateStr) {
    return `${getTodayDateString(now)}T14:30`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      return `${getTodayDateString(now)}T14:30`;
    }
    // Default to today with the same time of day as the source tournament
    return `${getTodayDateString(now)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return `${getTodayDateString(now)}T14:30`;
  }
};

export const DuplicateTournamentModal: React.FC<DuplicateTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  onSuccess,
}) => {
  const [duplicateName, setDuplicateName] = useState('');
  const [duplicateEventDate, setDuplicateEventDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (tournament && isOpen) {
      setDuplicateName(`${tournament.name} (คัดลอก)`);
      setDuplicateEventDate(toLocalDatetimeInput(tournament.event_date));
      setErrorMsg(null);
    }
  }, [tournament, isOpen]);

  if (!isOpen || !tournament) return null;

  const handleDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateName.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      const payload = {
        name: duplicateName.trim(),
        format: tournament.format,
        max_rounds: Math.max(1, Number(tournament.max_rounds) || 4),
        round_duration_minutes: Math.max(5, Number(tournament.round_duration_minutes) || 30),
        status: 'registering' as const,
        current_round: 0,
        event_date: duplicateEventDate
          ? new Date(duplicateEventDate).toISOString()
          : new Date().toISOString(),
        entry_fee: Math.max(0, Number(tournament.entry_fee) || 0),
        max_players: Math.max(2, Number(tournament.max_players) || 20),
        store_name: tournament.store_name?.trim() || 'Cardboard Tavern',
        location: tournament.location?.trim() || 'Lotus หลักสี่ ชั้น 2 (BTS วัดพระศรี)',
        banner_url: tournament.banner_url || '/images/vanguard_banner_1.jpg',
        description: tournament.description?.trim() || null,
        timer_ends_at: null,
        timer_paused_remaining_seconds: null,
      };

      let createdTournament: Tournament | null = null;

      const { data, error } = await supabase
        .from('tournaments')
        .insert(payload)
        .select()
        .single();

      if (error) {
        // Fallback for minimal column schema if needed
        const isMissingColumn =
          error.code === 'PGRST204' ||
          error.code === '42703' ||
          error.message?.includes('column');

        if (isMissingColumn) {
          const basePayload = {
            name: duplicateName.trim(),
            format: tournament.format,
            max_rounds: tournament.max_rounds || 4,
            round_duration_minutes: tournament.round_duration_minutes || 30,
            status: 'registering' as const,
            current_round: 0,
          };
          const fallbackRes = await supabase
            .from('tournaments')
            .insert(basePayload)
            .select()
            .single();

          if (fallbackRes.error) throw fallbackRes.error;
          createdTournament = fallbackRes.data;
        } else {
          throw error;
        }
      } else {
        createdTournament = data;
      }

      onClose();
      if (createdTournament && onSuccess) {
        onSuccess(createdTournament);
      }
    } catch (err: any) {
      console.error('Failed to duplicate tournament:', err);
      setErrorMsg(err.message || 'เกิดข้อผิดพลาดในการคัดลอกการแข่งขัน');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div className="bg-[#0e1422] border border-white/[0.12] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden tcg-card animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          disabled={isSubmitting}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">
              คัดลอกการแข่งขัน (Duplicate)
            </h3>
            <p className="text-xs text-gray-400">
              สร้างการแข่งขันใหม่จากการตั้งค่าเดิมของรายการนี้
            </p>
          </div>
        </div>

        {/* Source Tournament Card Preview */}
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] mb-4 space-y-2">
          <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
            ต้นแบบการแข่งขัน:
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm">
              {tournament.name}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-white/[0.06] text-amber-300 border border-white/10 font-mono">
              {tournament.format}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400 pt-1 border-t border-white/[0.04]">
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              <span>สูงสุด {tournament.max_players || 20} คน</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>{tournament.max_rounds || 4} รอบ ({tournament.round_duration_minutes || 30} นาที)</span>
            </span>
            <span>ค่าสมัคร ฿{tournament.entry_fee ?? 70}</span>
          </div>
        </div>

        {/* Notification Banner */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-cyan-200 text-xs flex items-start gap-2.5 mb-4 shadow-inner">
          <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            การแข่งขันที่คัดลอกมาจะถูกปรับเป็นสถานะ <strong className="text-white">"เปิดรับสมัคร" (RECEPTION)</strong> โดยอัตโนมัติ โดย<strong className="text-amber-300">ไม่รวม</strong>รายชื่อผู้เข้าแข่งขันเดิมและประวัติการจับคู่
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleDuplicate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              ชื่อการแข่งขันใหม่ <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={duplicateName}
              onChange={(e) => setDuplicateName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 shadow-inner"
              placeholder="ระบุชื่อการแข่งขัน..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-200 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                วันและเวลาเริ่มแข่ง (24 ชม.){' '}
                <span className="text-cyan-400">*</span>
              </span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* 1. ช่องเลือกวันที่ */}
              <input
                type="date"
                required
                value={
                  duplicateEventDate
                    ? duplicateEventDate.split('T')[0]
                    : getTodayDateString()
                }
                onChange={(e) => {
                  const datePart = e.target.value;
                  const timePart =
                    duplicateEventDate?.split('T')[1]?.slice(0, 5) || '14:30';
                  setDuplicateEventDate(
                    datePart ? `${datePart}T${timePart}` : '',
                  );
                }}
                style={{ colorScheme: 'dark' }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500/30"
              />

              {/* 2. ช่องเลือกเวลาแบบ 24 ชั่วโมง (ชั่วโมง : นาที) */}
              <div className="flex items-center gap-1.5 bg-[#070a12] border border-white/10 rounded-xl px-3 py-2 focus-within:border-cyan-500 focus-within:ring-1 focus-within:ring-cyan-500/30">
                {/* เลือกชั่วโมง (00 - 23) */}
                <select
                  value={
                    duplicateEventDate?.split('T')[1]?.split(':')[0] || '14'
                  }
                  onChange={(e) => {
                    const datePart =
                      duplicateEventDate?.split('T')[0] || getTodayDateString();
                    const minutePart =
                      duplicateEventDate
                        ?.split('T')[1]
                        ?.split(':')[1]
                        ?.slice(0, 2) || '30';
                    setDuplicateEventDate(
                      `${datePart}T${e.target.value}:${minutePart}`,
                    );
                  }}
                  className="w-full bg-transparent text-white text-sm font-mono text-center focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 24 }, (_, i) =>
                    String(i).padStart(2, '0'),
                  ).map((hour) => (
                    <option
                      key={hour}
                      value={hour}
                      className="bg-gray-900 text-white"
                    >
                      {hour}
                    </option>
                  ))}
                </select>

                <span className="text-cyan-400 font-bold">:</span>

                {/* เลือกนาที (ทีละ 5 นาที: 00, 05, 10, ..., 55) */}
                <select
                  value={
                    duplicateEventDate
                      ?.split('T')[1]
                      ?.split(':')[1]
                      ?.slice(0, 2) || '30'
                  }
                  onChange={(e) => {
                    const datePart =
                      duplicateEventDate?.split('T')[0] || getTodayDateString();
                    const hourPart =
                      duplicateEventDate?.split('T')[1]?.split(':')[0] || '14';
                    setDuplicateEventDate(
                      `${datePart}T${hourPart}:${e.target.value}`,
                    );
                  }}
                  className="w-full bg-transparent text-white text-sm font-mono text-center focus:outline-none cursor-pointer"
                >
                  {Array.from({ length: 12 }, (_, i) =>
                    String(i * 5).padStart(2, '0'),
                  ).map((minute) => (
                    <option
                      key={minute}
                      value={minute}
                      className="bg-gray-900 text-white"
                    >
                      {minute}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/[0.04] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/10 transition-all disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !duplicateName.trim()}
              className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังคัดลอก...</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>ยืนยันคัดลอกการแข่งขัน</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
