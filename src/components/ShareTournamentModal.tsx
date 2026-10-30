import React, { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Tournament } from "../types";
import { sounds } from "../utils/audio";
import {
  Share2,
  Copy,
  Check,
  QrCode,
  Download,
  X,
  Sparkles,
} from "lucide-react";

interface ShareTournamentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tournament: Tournament;
  isAdmin?: boolean;
}

export const ShareTournamentModal: React.FC<ShareTournamentModalProps> = ({
  isOpen,
  onClose,
  tournament,
  isAdmin = false,
}) => {
  const [copied, setCopied] = useState(false);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const tournamentUrl = `${origin}/tournament/${tournament.id}`;
  const qrCanvasId = `tournament-qr-${tournament.id}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(tournamentUrl);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = tournamentUrl;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      sounds.tick();
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  const handleDownloadQr = () => {
    const canvas = document.getElementById(qrCanvasId) as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const exportCanvas = document.createElement("canvas");
      const padding = 28;
      const headerHeight = 56;
      const footerHeight = 36;
      exportCanvas.width = canvas.width + padding * 2;
      exportCanvas.height = canvas.height + padding * 2 + headerHeight + footerHeight;

      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      // Dark card background
      ctx.fillStyle = "#0c121e";
      if (ctx.roundRect) {
        ctx.roundRect(0, 0, exportCanvas.width, exportCanvas.height, 20);
      } else {
        ctx.rect(0, 0, exportCanvas.width, exportCanvas.height);
      }
      ctx.fill();

      // Golden accent border
      ctx.strokeStyle = "rgba(245, 158, 11, 0.4)";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Brand tag
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("CARDBOARD TAVERN TCG", exportCanvas.width / 2, 24);

      // Tournament title
      ctx.fillStyle = "#fef08a";
      ctx.font = "bold 15px sans-serif";
      const displayTitle =
        tournament.name.length > 26 ? tournament.name.slice(0, 24) + "..." : tournament.name;
      ctx.fillText(displayTitle, exportCanvas.width / 2, 44);

      // QR Code white backing box
      const qrX = padding;
      const qrY = padding + headerHeight - 12;
      ctx.fillStyle = "#ffffff";
      if (ctx.roundRect) {
        ctx.roundRect(qrX - 10, qrY - 10, canvas.width + 20, canvas.height + 20, 12);
      } else {
        ctx.rect(qrX - 10, qrY - 10, canvas.width + 20, canvas.height + 20);
      }
      ctx.fill();

      // Draw QR onto canvas
      ctx.drawImage(canvas, qrX, qrY);

      // Subtitle / Footer
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "11px sans-serif";
      ctx.fillText("สแกนดูตารางแข่งขันบนมือถือ", exportCanvas.width / 2, exportCanvas.height - 14);

      const downloadLink = document.createElement("a");
      downloadLink.href = exportCanvas.toDataURL("image/png");
      const safeName = tournament.name.replace(/[^a-zA-Z0-9ก-๙_-]/g, "_").slice(0, 30);
      downloadLink.download = `QR_${safeName}.png`;
      downloadLink.click();
      sounds.tick();
    } catch (e) {
      console.error("QR download error:", e);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-[#0c121e] border border-white/10 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden sleeve-frame flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-5 sm:p-6 border-b border-white/[0.08] bg-white/[0.02] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400/20 via-amber-500/10 to-transparent border border-amber-500/30 flex items-center justify-center text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  แชร์การแข่งขัน
                </h3>
                {isAdmin && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 truncate max-w-[280px] sm:max-w-[360px] font-medium">
                {tournament.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="ปิด"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Quick Info Box */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ลิงก์ดูตารางจับคู่ ผลการแข่งขัน และคะแนน Standings</span>
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-gray-300 font-mono text-[11px] border border-white/10">
              {tournament.format}
            </span>
          </div>

          {/* QR Code Card Frame */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-[#080d16] border border-white/[0.08] relative group">
            <div className="p-3 bg-white rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.6)] my-1 border border-white/20">
              <QRCodeCanvas
                id={qrCanvasId}
                value={tournamentUrl}
                size={170}
                level="M"
                marginSize={1}
              />
            </div>

            <p className="text-[11px] text-gray-400 mt-3 font-medium flex items-center gap-1.5">
              <QrCode className="w-3.5 h-3.5 text-amber-400" />
              <span>สแกน QR Code เพื่อเปิดหน้านี้ได้ทันที</span>
            </p>

            <button
              type="button"
              onClick={handleDownloadQr}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>ดาวน์โหลด QR Code</span>
            </button>
          </div>

          {/* Copy Link Input Bar */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 flex items-center justify-between">
              <span>คัดลอกลิงก์</span>
            </label>

            <div className="relative flex items-center">
              <input
                type="text"
                readOnly
                value={tournamentUrl}
                onClick={(e) => (e.target as HTMLInputElement).select()}
                className="w-full pl-3.5 pr-28 py-2.5 rounded-xl bg-black/50 border border-white/15 text-gray-200 text-xs font-mono focus:outline-none focus:border-amber-400 select-all"
              />
              <button
                type="button"
                onClick={handleCopy}
                className={`absolute right-1 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 ${
                  copied
                    ? "bg-emerald-500 text-gray-950 shadow-[0_0_12px_rgba(16,185,129,0.4)]"
                    : "bg-amber-500 hover:bg-amber-400 text-gray-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.25)]"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>คัดลอก</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
