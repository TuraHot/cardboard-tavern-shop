import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Shield, LogIn, LogOut } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

interface NavbarProps {
  tournamentId?: string;
  tournamentName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  tournamentName,
}) => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isCurrent = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#06080d]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-b from-amber-400/20 via-slate-900 to-black border border-amber-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.15)] group-hover:border-amber-400/60 transition-all">
            <Shield className="w-5 h-5 text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-transparent to-white/10 pointer-events-none" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider gold-gradient-text uppercase">
                Cardboard Tavern
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                TCG
              </span>
            </div>
            <span className="text-[11px] text-gray-400 font-medium tracking-tight truncate max-w-[200px] sm:max-w-[320px]">
              {tournamentName
                ? `🏆 ${tournamentName}`
                : "Cardfight!! Vanguard Tournament System"}
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          <Link
            to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
              isCurrent("/")
                ? "bg-white/10 text-white border border-white/15 shadow-inner"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">หน้าแรก</span>
          </Link>

          {user ? (
            <button
              id="navbar-logout-btn"
              type="button"
              onClick={signOut}
              title={user.email ?? undefined}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-rose-300 hover:bg-white/5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          ) : (
            !isCurrent("/login") && (
              <Link
                id="navbar-login-link"
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-gray-400 hover:text-amber-200 hover:bg-white/5 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">เข้าสู่ระบบ</span>
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
};
