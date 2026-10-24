import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, LogIn, Mail, Lock, Clock, X } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, isAdmin, signOut, logoutReason, clearLogoutReason } =
    useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [signingOut, setSigningOut] = useState(false);

  // Already logged in as admin -> go home
  useEffect(() => {
    if (isAdmin) navigate("/", { replace: true });
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double submit
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password, rememberMe);
      // Keep submitting true while waiting for redirect to avoid re-enable flicker
    } catch (err: any) {
      setError(
        err?.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : err?.message || "เข้าสู่ระบบไม่สำเร็จ",
      );
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-gray-100 flex flex-col">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-3xl bg-[#0e1422] border border-white/[0.1] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] p-7 sm:p-8">
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-black border border-amber-500/30 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.2)] mb-4">
              <Shield className="w-7 h-7 text-amber-300" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              เข้าสู่ระบบผู้ดูแล
            </h1>
            <p className="text-xs text-gray-400 mt-1.5">
              สำหรับทีมงานร้าน Cardboard Tavern เท่านั้น
            </p>
          </div>

          {logoutReason && (
            <div
              className={`mb-5 p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-all ${
                logoutReason === "idle_timeout"
                  ? "bg-amber-950/40 border-amber-500/30 text-amber-200"
                  : "bg-slate-900 border-white/15 text-gray-200"
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {logoutReason === "idle_timeout" ? (
                  <Clock className="w-4 h-4 text-amber-400" />
                ) : (
                  <Shield className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              <div className="flex-1">
                {logoutReason === "idle_timeout" && (
                  <>
                    <p className="font-bold text-amber-300">
                      ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งาน
                    </p>
                    <p className="text-[11px] text-amber-200/80 mt-0.5">
                      ไม่มีการทำรายการเกิน 15 นาที เพื่อความปลอดภัยของข้อมูลร้าน กรุณาเข้าสู่ระบบใหม่อีกครั้ง
                    </p>
                  </>
                )}
                {logoutReason === "browser_closed" && (
                  <>
                    <p className="font-bold text-gray-200">
                      เซสชันสิ้นสุดลงเนื่องจากปิดเบราว์เซอร์
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      คุณไม่ได้เลือกจำการเข้าสู่ระบบ ระบบจึงออกจากระบบอัตโนมัติเมื่อปิดหน้าต่าง
                    </p>
                  </>
                )}
                {logoutReason !== "idle_timeout" &&
                  logoutReason !== "browser_closed" && (
                    <p>เซสชันสิ้นสุดลง กรุณาเข้าสู่ระบบใหม่</p>
                  )}
              </div>
              <button
                type="button"
                onClick={clearLogoutReason}
                className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
                title="ปิดการแจ้งเตือน"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {user && !isAdmin && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs flex items-center justify-between gap-3">
              <span className="truncate">
                บัญชี <b>{user.email}</b> ไม่มีสิทธิ์ผู้ดูแล (admin)
              </span>
              <button
                id="login-signout-btn"
                type="button"
                disabled={signingOut || submitting}
                onClick={handleSignOut}
                className="shrink-0 underline underline-offset-2 font-semibold hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 transition-opacity"
              >
                {signingOut && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>{signingOut ? "กำลังออก..." : "ออกจากระบบ"}</span>
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                อีเมล
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-email"
                  type="email"
                  required
                  disabled={submitting}
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-200 mb-1.5">
                รหัสผ่าน
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="login-password"
                  type="password"
                  required
                  disabled={submitting}
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                />
              </div>
            </div>

            {/* Remember Me option */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  id="login-remember-me"
                  type="checkbox"
                  disabled={submitting}
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded bg-[#070a12] border-white/20 text-amber-500 focus:ring-amber-500/30 focus:ring-offset-0 cursor-pointer accent-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <span className="text-xs text-gray-300 group-hover:text-white transition-colors">
                  จำการเข้าสู่ระบบบนเครื่องนี้
                </span>
              </label>
              <p className="text-[11px] text-gray-500 mt-1 pl-6 leading-normal">
                *หากใช้งานบนเครื่องที่เคาน์เตอร์หน้าร้าน แนะนำไม่ต้องเลือก เพื่อให้ออกจากระบบอัตโนมัติเมื่อปิดเบราว์เซอร์
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
                {error}
              </div>
            )}

            <button
              id="login-submit-btn"
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              <span>{submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}</span>
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
};
