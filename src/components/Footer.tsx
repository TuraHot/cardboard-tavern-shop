import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  return (
    <footer className={`mt-auto py-6 border-t border-white/[0.06] bg-[#05070b]/90 backdrop-blur-md ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
        {/* Left Side: System Information */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          <span className="text-gray-300 font-medium">
            Cardboard Tavern Tournament System
          </span>
          <span className="text-gray-600 hidden sm:inline">·</span>
          <span className="text-gray-400 hidden sm:inline">
            Cardfight!! Vanguard
          </span>
        </div>

        {/* Right Side: Facebook Fanpage Link */}
        <div className="flex items-center">
          <a
            href="https://www.facebook.com/profile.php?id=61566019863333"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook Fanpage Cardboard Tavern"
            className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/30 text-[#1877F2] hover:text-[#4294ff] transition-all duration-200 shadow-sm hover:shadow-[0_0_15px_rgba(24,119,242,0.35)] group font-medium"
          >
            {/* Facebook Brand Icon SVG */}
            <svg
              className="w-4 h-4 fill-current transition-transform duration-200 group-hover:scale-110"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span className="text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
              Facebook
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};
