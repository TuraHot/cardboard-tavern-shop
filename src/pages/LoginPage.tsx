import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Loader2, LogIn, Mail, Lock } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, isAdmin, signOut } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Already logged in as admin -> go home
  useEffect(() => {
    if (isAdmin) navigate("/", { replace: true });
  }, [isAdmin, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email.trim(), password);
    } catch (err: any) {
      setError(
        err?.message === "Invalid login credentials"
          ? "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
          : err?.message || "เข้าสู่ระบบไม่สำเร็จ",
      );
    } finally {
      setSubmitting(false);
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

          {user && !isAdmin && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-xs">
              บัญชี <b>{user.email}</b> ไม่มีสิทธิ์ผู้ดูแล (admin){" "}
              <button
                id="login-signout-btn"
                type="button"
                onClick={signOut}
                className="underline underline-offset-2 font-semibold hover:text-white"
              >
                ออกจากระบบ
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
                  autoComplete="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
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
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#070a12] border border-white/10 text-white text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30"
                />
              </div>
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
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
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
