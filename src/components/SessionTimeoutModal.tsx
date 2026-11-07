import React, { useEffect, useState } from 'react';
import { Clock, ShieldAlert, RotateCcw, LogOut, Loader2 } from 'lucide-react';

interface SessionTimeoutModalProps {
  isOpen: boolean;
  secondsRemaining: number;
  onExtend: () => void;
  onSignOut: () => void;
}

export const SessionTimeoutModal: React.FC<SessionTimeoutModalProps> = ({
  isOpen,
  secondsRemaining,
  onExtend,
  onSignOut,
}) => {
  const [pendingAction, setPendingAction] = useState<'extend' | 'signout' | null>(null);

  // Reset pendingAction when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPendingAction(null);
    }
  }, [isOpen]);

  const handleExtend = () => {
    if (pendingAction) return;
    setPendingAction('extend');
    onExtend();
  };

  const handleSignOut = () => {
    if (pendingAction) return;
    setPendingAction('signout');
    onSignOut();
  };

  // Allow pressing Enter or Space to quickly extend session, Esc to sign out
  useEffect(() => {
    if (!isOpen || pendingAction) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleExtend();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleSignOut();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pendingAction]);

  if (!isOpen) return null;

  // Percentage for progress indicator (from 60 down to 0)
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / 60) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md rounded-3xl bg-[#0c101b] border border-amber-500/30 p-6 sm:p-7 shadow-[0_20px_60px_-15px_rgba(245,158,11,0.25)] text-gray-100 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col items-center text-center">
          {/* Header Icon */}
          <div className="relative w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4 shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Clock className="w-8 h-8 text-amber-400 animate-pulse" />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-rose-950 border border-rose-500/40 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
            </div>
          </div>

          <h2
            id="session-timeout-title"
            className="text-xl sm:text-2xl font-black text-white tracking-tight"
          >
            เซสชันกำลังจะหมดอายุ
          </h2>

          <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">
            ไม่มีการใช้งานระบบมาระยะหนึ่ง เพื่อความปลอดภัยของข้อมูลการแข่งขัน
            ระบบจะออกจากระบบอัตโนมัติในอีก:
          </p>

          {/* Countdown display */}
          <div className="my-5 w-full bg-[#070a12] border border-white/10 rounded-2xl p-4 flex flex-col items-center">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-mono font-black text-amber-400 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">
                {secondsRemaining}
              </span>
              <span className="text-sm font-semibold text-gray-400">วินาที</span>
            </div>

            {/* Visual progress bar */}
            <div className="w-full h-2 bg-white/5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ease-linear rounded-full ${
                  secondsRemaining <= 15
                    ? 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.7)]'
                    : 'bg-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-gray-500 mb-6">
            กดปุ่ม <span className="text-amber-300 font-semibold">"ใช้งานต่อ"</span>{' '}
            เพื่อรีเซ็ตเวลานับถอยหลัง 15 นาที หรือกดปุ่ม Enter/Space บนคีย์บอร์ด
          </p>

          {/* Action buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-2.5">
            <button
              id="session-extend-btn"
              type="button"
              disabled={!!pendingAction}
              onClick={handleExtend}
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {pendingAction === 'extend' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RotateCcw className="w-4 h-4" />
              )}
              <span>{pendingAction === 'extend' ? 'กำลังรีเซ็ตเวลา...' : 'ใช้งานต่อ'}</span>
            </button>

            <button
              id="session-signout-btn"
              type="button"
              disabled={!!pendingAction}
              onClick={handleSignOut}
              className="py-3 px-4 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-gray-400 hover:text-rose-300 text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {pendingAction === 'signout' ? (
                <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
              <span>{pendingAction === 'signout' ? 'กำลังออก...' : 'ออกจากระบบทันที'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
