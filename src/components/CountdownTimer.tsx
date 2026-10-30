import React, { useState, useEffect, useRef } from 'react';
import { Clock, Play, Pause, AlertCircle, Volume2, VolumeX, FastForward } from 'lucide-react';
import { sounds } from '../utils/audio';

export interface CountdownTimerProps {
  timerEndsAt: string | null;
  timerPausedRemainingSeconds: number | null;
  roundDurationMinutes: number;
  size?: 'sm' | 'md' | 'lg' | 'tv';
  showControls?: boolean;
  onStart?: () => void;
  onPause?: () => void;
  onReset?: () => void;
  onSkipPrep?: () => void;
  onStartPrep?: () => void;
  onPrepTimeEnd?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({
  timerEndsAt,
  timerPausedRemainingSeconds,
  roundDurationMinutes,
  size = 'md',
  showControls = false,
  onStart,
  onPause,
  onReset,
  onSkipPrep,
  onStartPrep,
  onPrepTimeEnd,
}) => {
  // Prep phase is indicated by negative timerPausedRemainingSeconds (e.g. -1 when running, or negative remaining when paused)
  const isPrepPhase =
    timerPausedRemainingSeconds !== null && timerPausedRemainingSeconds < 0;

  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    if (timerEndsAt) {
      const diff = Math.floor((new Date(timerEndsAt).getTime() - Date.now()) / 1000);
      return Math.max(0, diff);
    }
    if (timerPausedRemainingSeconds !== null) {
      return Math.abs(timerPausedRemainingSeconds);
    }
    return isPrepPhase ? 5 * 60 : roundDurationMinutes * 60;
  });

  const isRunning = Boolean(timerEndsAt);
  const isPaused = !timerEndsAt && timerPausedRemainingSeconds !== null;
  const hasTriggeredAlarm = useRef(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => sounds.isMuted());

  useEffect(() => {
    const calculateRemaining = () => {
      if (timerEndsAt) {
        const diff = Math.floor((new Date(timerEndsAt).getTime() - Date.now()) / 1000);
        const sec = Math.max(0, diff);
        setRemainingSeconds(sec);

        if (sec === 0 && !hasTriggeredAlarm.current) {
          hasTriggeredAlarm.current = true;
          sounds.alarm();
          if (isPrepPhase && onPrepTimeEnd) {
            onPrepTimeEnd();
          }
        } else if (sec > 0) {
          hasTriggeredAlarm.current = false;
        }
      } else if (timerPausedRemainingSeconds !== null) {
        setRemainingSeconds(Math.abs(timerPausedRemainingSeconds));
      } else {
        setRemainingSeconds(isPrepPhase ? 5 * 60 : roundDurationMinutes * 60);
      }
    };

    calculateRemaining();

    if (isRunning) {
      const interval = setInterval(calculateRemaining, 1000);
      return () => clearInterval(interval);
    }
  }, [
    timerEndsAt,
    timerPausedRemainingSeconds,
    roundDurationMinutes,
    isRunning,
    isPrepPhase,
    onPrepTimeEnd,
  ]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const isCritical = !isPrepPhase && remainingSeconds <= 300 && remainingSeconds > 0;
  const isTimeUp = remainingSeconds === 0;

  if (size === 'tv') {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-[#090e18]/90 border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-2xl">
        {/* Soft Ambient Light */}
        <div
          className={`absolute -inset-10 opacity-15 blur-3xl rounded-full transition-colors duration-700 pointer-events-none ${
            isTimeUp
              ? 'bg-rose-600 animate-pulse'
              : isPrepPhase
              ? 'bg-cyan-500 animate-pulse'
              : isCritical
              ? 'bg-amber-500 animate-pulse'
              : isRunning
              ? 'bg-amber-400'
              : 'bg-slate-700'
          }`}
        />

        <div className="flex items-center gap-2 mb-2 uppercase tracking-widest text-xs font-bold">
          <Clock
            className={`w-4 h-4 ${
              isRunning
                ? isPrepPhase
                  ? 'text-cyan-400 animate-pulse'
                  : 'text-amber-400 animate-pulse'
                : 'text-gray-500'
            }`}
          />
          <span
            className={
              isPrepPhase
                ? 'text-cyan-300 font-extrabold tracking-wider'
                : 'text-gray-400 tracking-widest'
            }
          >
            {isPrepPhase
              ? '⏳ เวลาเตรียมตัวก่อนเริ่มแข่งขัน (5 นาที)'
              : 'เวลาการแข่งขันรอบปัจจุบัน'}
          </span>
        </div>

        <div
          className={`font-mono font-black tracking-tight select-none transition-colors duration-300 text-7xl sm:text-8xl md:text-9xl ${
            isTimeUp
              ? 'text-rose-500 animate-bounce'
              : isPrepPhase
              ? 'text-cyan-300 drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]'
              : isCritical
              ? 'text-amber-400 animate-pulse'
              : isRunning
              ? 'gold-gradient-text drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'text-gray-400'
          }`}
        >
          {formattedTime}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
          {isRunning ? (
            isPrepPhase ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/15 text-cyan-200 text-xs font-semibold border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span>กำลังเตรียมตัว • กรุณาเข้าประจำโต๊ะแข่งขัน</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-200 text-xs font-semibold border border-amber-500/30 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>กำลังจับเวลาแข่งขัน</span>
              </span>
            )
          ) : isPaused ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-950/60 text-amber-300 text-xs font-semibold border border-amber-500/30">
              <Pause className="w-3.5 h-3.5" /> พักเวลา{isPrepPhase ? 'เตรียมตัว' : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/[0.04] text-gray-400 text-xs font-medium border border-white/[0.06]">
              พร้อมเริ่มการแข่งขัน
            </span>
          )}

          {isTimeUp && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rose-950/80 text-rose-300 text-xs font-bold border border-rose-500/50">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              {isPrepPhase ? 'หมดเวลาเตรียมตัว!' : 'หมดเวลาการแข่งขัน!'}
            </span>
          )}

          {/* Sound Mute/Unmute & Test Control */}
          <div className="inline-flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-full p-1 pl-2.5 text-xs shadow-inner">
            <button
              type="button"
              onClick={() => {
                const newMute = sounds.toggleMute();
                setIsMuted(newMute);
                if (!newMute) sounds.tick();
              }}
              className={`flex items-center gap-1.5 font-semibold transition-colors ${
                isMuted ? 'text-gray-400 hover:text-white' : 'text-amber-300 hover:text-amber-200'
              }`}
              title={isMuted ? 'คลิกเพื่อเปิดเสียงเตือน' : 'คลิกเพื่อปิดเสียงเตือน'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isMuted ? 'เสียง: ปิด' : 'เสียง: เปิด'}</span>
            </button>
            <button
              type="button"
              onClick={() => sounds.alarm()}
              className="px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 text-[11px] text-gray-300 hover:text-white font-medium transition-colors"
              title="ทดสอบเสียงหมดเวลา"
            >
              ทดสอบเสียง
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header / Card size
  return (
    <div
      className={`inline-flex items-center gap-3 px-3.5 py-1.5 rounded-xl border transition-all ${
        isTimeUp
          ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          : isPrepPhase
          ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          : isCritical
          ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
          : isRunning
          ? 'bg-amber-950/30 border-amber-500/30 text-amber-200 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
          : 'bg-[#0b101c] border-white/[0.08] text-gray-400'
      }`}
    >
      <Clock
        className={`w-4 h-4 ${
          isRunning
            ? isPrepPhase
              ? 'text-cyan-400 animate-pulse'
              : 'text-amber-400 animate-pulse'
            : 'text-gray-500'
        }`}
      />

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-mono font-black text-base sm:text-lg tracking-wider ${
              isPrepPhase
                ? 'text-cyan-300'
                : isRunning
                ? 'text-amber-300'
                : 'text-gray-300'
            }`}
          >
            {formattedTime}
          </span>
          {isPrepPhase && (
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold uppercase tracking-wider">
              เตรียมตัว
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-400 leading-tight">
          {isRunning
            ? isPrepPhase
              ? 'เวลาเตรียมตัว'
              : 'เวลาที่เหลือ'
            : isPaused
            ? 'พักเวลาชั่วคราว'
            : 'รอเริ่มรอบ'}
        </span>
      </div>

      {showControls && (
        <div className="flex items-center gap-1.5 ml-2 border-l border-white/10 pl-2">
          {/* Skip Prep Button: Shown during Prep Phase */}
          {isPrepPhase && onSkipPrep && (
            <button
              type="button"
              onClick={onSkipPrep}
              className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs flex items-center gap-1 shadow-[0_0_12px_rgba(245,158,11,0.3)] transition-all active:scale-95"
              title="ข้ามเวลาเตรียมตัว และเริ่มจับเวลาการแข่งขันทันที"
            >
              <FastForward className="w-3.5 h-3.5 fill-current" />
              <span className="hidden sm:inline">ข้ามเวลาเตรียมตัว</span>
              <span className="sm:hidden">ข้าม</span>
            </button>
          )}

          {!isRunning ? (
            <button
              type="button"
              onClick={onStart}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
              title="เริ่มจับเวลา"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white transition-colors shadow-sm"
              title="พักเวลา"
            >
              <Pause className="w-3.5 h-3.5 fill-current" />
            </button>
          )}

          <button
            type="button"
            onClick={onReset}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs px-2 transition-colors"
            title="รีเซ็ตเวลา"
          >
            รีเซ็ต
          </button>

          {/* Quick Start Prep 5m button if idle & not currently in prep */}
          {!isPrepPhase && onStartPrep && !isRunning && (
            <button
              type="button"
              onClick={onStartPrep}
              className="p-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs px-2 transition-colors font-medium"
              title="เริ่มเวลาเตรียมตัว 5 นาที"
            >
              เตรียมตัว 5m
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              const newMute = sounds.toggleMute();
              setIsMuted(newMute);
              if (!newMute) sounds.tick();
            }}
            className={`p-1.5 rounded-lg border transition-colors ${
              isMuted
                ? 'bg-rose-950/30 border-rose-500/20 text-gray-400 hover:text-white'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title={isMuted ? 'คลิกเพื่อเปิดเสียงเตือน' : 'คลิกเพื่อปิดเสียงเตือน'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
