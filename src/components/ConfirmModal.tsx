import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: React.ReactNode;
  warningText?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'success' | 'info';
  icon?: React.ReactNode;
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  warningText,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  icon,
  isLoading = false,
  children,
}) => {
  if (!isOpen) return null;

  const variantStyles = {
    danger: {
      iconBg: 'bg-rose-500/10 border-rose-500/25 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      confirmBtn: 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.35)] border border-rose-500/30',
      warningBox: 'bg-rose-950/30 border-rose-500/20 text-rose-300/90',
      defaultIcon: <Trash2 className="w-5 h-5" />,
    },
    warning: {
      iconBg: 'bg-amber-500/10 border-amber-500/25 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      confirmBtn: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.35)] border border-amber-400/40',
      warningBox: 'bg-amber-950/30 border-amber-500/20 text-amber-300/90',
      defaultIcon: <AlertTriangle className="w-5 h-5" />,
    },
    success: {
      iconBg: 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      confirmBtn: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.35)] border border-emerald-500/30',
      warningBox: 'bg-emerald-950/30 border-emerald-500/20 text-emerald-300/90',
      defaultIcon: <AlertTriangle className="w-5 h-5" />,
    },
    info: {
      iconBg: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      confirmBtn: 'bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-500 hover:to-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.35)] border border-cyan-500/30',
      warningBox: 'bg-cyan-950/30 border-cyan-500/20 text-cyan-300/90',
      defaultIcon: <AlertTriangle className="w-5 h-5" />,
    },
  }[variant];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoading) {
          onClose();
        }
      }}
    >
      <div className="bg-[#0e1422] border border-white/[0.12] rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden tcg-card animate-scale-up">
        {/* Close Button */}
        <button
          type="button"
          disabled={isLoading}
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-3.5">
          <div className={`p-2.5 border rounded-xl shrink-0 ${variantStyles.iconBg}`}>
            {icon || variantStyles.defaultIcon}
          </div>
          <h3 className="text-lg font-bold text-white tracking-tight">
            {title}
          </h3>
        </div>

        {/* Description */}
        {description && (
          <div className="text-sm text-gray-300 leading-relaxed mb-4">
            {description}
          </div>
        )}

        {/* Custom preview slot (e.g. Player Card, Boss Item) */}
        {children && <div className="mb-4">{children}</div>}

        {/* Warning callout */}
        {warningText && (
          <div
            className={`text-xs p-3 rounded-xl border flex items-start gap-2 mb-5 ${variantStyles.warningBox}`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 opacity-90" />
            <span className="leading-relaxed">{warningText}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/[0.06]">
          <button
            type="button"
            disabled={isLoading}
            onClick={() => !isLoading && onClose()}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white/[0.05] hover:bg-white/[0.09] text-gray-300 hover:text-white border border-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={() => !isLoading && onConfirm()}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none cursor-pointer ${variantStyles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>กำลังดำเนินการ...</span>
              </>
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
