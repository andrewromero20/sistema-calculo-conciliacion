"use client";

import { useEffect } from "react";

export default function AppErrorModal({
  isOpen,
  onClose,
  title = "Validación requerida",
  message = "",
  actionText = "Entendido",
  cancelText = "",
  onConfirm = null,
  type = "error", // "error" | "warning"
}) {
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      } else if (e.key === "Enter" && !onConfirm) {
        e.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  const isWarning = type === "warning";

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isWarning
                  ? "bg-amber-100 text-amber-700"
                  : "bg-red-100 text-red-600"
              }`}
            >
              <span className="text-lg font-black leading-none">
                {isWarning ? "!" : "⚠"}
              </span>
            </div>
            <div className="space-y-1.5 flex-1">
              <h3 className="text-base font-bold text-slate-900">
                {title}
              </h3>
              <div className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {message}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-100 flex items-center justify-end gap-2.5">
          {cancelText && (
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              if (onConfirm) {
                onConfirm();
              }
              onClose();
            }}
            autoFocus
            className={`w-full sm:w-auto px-5 py-2 rounded-lg text-white text-xs font-bold shadow-xs transition cursor-pointer ${
              isWarning && onConfirm
                ? "bg-red-600 hover:bg-red-700"
                : "bg-[#0d6efd] hover:bg-[#0b5ed7]"
            }`}
          >
            {actionText}
          </button>
        </div>
      </div>
    </div>
  );
}
