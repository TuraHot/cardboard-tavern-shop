import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShieldCheck, Lock, KeyRound, AlertTriangle, ArrowLeft } from "lucide-react";
import { sounds } from "../utils/audio";

const SUPER_ADMIN_UNLOCK_KEY = "cb_superadmin_unlocked";
const SUPER_ADMIN_DEFAULT_PASS = "cardboardtvP@ssw0rd";

export const SuperAdminRoute: React.FC<{ children: React.ReactElement }> = ({
  children,
}) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SUPER_ADMIN_UNLOCK_KEY) === "true";
  });

  const [passcode, setPasscode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // If not admin, ensure lock is reset
    if (!isAdmin) {
      setIsUnlocked(false);
      sessionStorage.removeItem(SUPER_ADMIN_UNLOCK_KEY);
    }
  }, [isAdmin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#04060a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in or not admin -> Kick out immediately
  if (!user || !isAdmin) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // Security Passcode Challenge Screen
  if (!isUnlocked) {
    const handleVerify = (e: React.FormEvent) => {
      e.preventDefault();
      if (passcode.trim() === SUPER_ADMIN_DEFAULT_PASS) {
        sounds.fanfare();
        sessionStorage.setItem(SUPER_ADMIN_UNLOCK_KEY, "true");
        setIsUnlocked(true);
        setErrorMsg("");
      } else {
        sounds.alarm();
        setErrorMsg("รหัสผ่าน Super Admin ไม่ถูกต้อง!");
        setAttempts((prev) => prev + 1);
        setPasscode("");
      }
    };

    return (
      <div className="min-h-screen bg-[#05070c] text-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#0b0f19] border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.9)] sleeve-frame relative overflow-hidden">
          {/* Header Shield */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/40 flex items-center justify-center text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.25)] mb-4">
              <ShieldCheck className="w-8 h-8 text-amber-400" />
            </div>
            <span className="text-[11px] px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider mb-2">
              Super Admin Security Gate
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              ยืนยันสิทธิ์ Super Admin
            </h1>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              ระบบจัดการฐานข้อมูลระดับสูงสุด กรุณากรอกรหัสผ่านเพื่อเข้าใช้งาน
            </p>
          </div>

          {/* User info badge */}
          <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs">
            <span className="text-gray-400">บัญชีผู้ใช้ปัจจุบัน:</span>
            <span className="text-amber-300 font-mono font-semibold truncate max-w-[200px]">
              {user.email}
            </span>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                รหัสผ่าน Super Admin Master Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="กรอกรหัสผ่าน..."
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-black/60 border border-white/15 focus:border-amber-400 rounded-xl text-white text-sm placeholder-gray-500 outline-none transition-colors"
                />
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>ปลดล็อคเข้าสู่ระบบจัดการฐานข้อมูล</span>
            </button>

            <a
              href="/"
              className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>กลับสู่หน้าหลัก</span>
            </a>
          </form>

          {attempts >= 3 && (
            <p className="mt-4 text-[11px] text-center text-gray-500 font-mono">
              รหัสผ่านเริ่มต้นคือรหัสผ่านของบัญชีผู้ดูแลระบบ Cardboard Tavern
            </p>
          )}
        </div>
      </div>
    );
  }

  return children;
};
