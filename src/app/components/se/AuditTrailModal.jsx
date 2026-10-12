"use client";

import { useState } from "react";

export default function AuditTrailModal({
  isOpen,
  onClose,
  onConfirm,
  diffPreview = {},
  isSubmitting = false,
}) {
  const [justificacion, setJustificacion] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    if (!justificacion.trim() || justificacion.trim().length < 10) {
      setError("La justificación es obligatoria y debe tener al menos 10 caracteres explicativos.");
      return;
    }
    setError("");
    onConfirm(justificacion.trim());
  }

  const diffEntries = Object.entries(diffPreview);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative bg-white rounded-xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 bg-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-900">
            <span className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center font-bold text-base">
              ✎
            </span>
            <div>
              <h2 className="text-base font-bold">
                Confirmación de Edición y Auditoría
              </h2>
              <p className="text-xs text-amber-700">
                Se registrará una entrada inmutable en el Audit Trail del sistema.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {diffEntries.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Resumen preliminar de campos modificados ({diffEntries.length}):
              </label>
              <div className="max-h-40 overflow-y-auto bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1.5 text-xs font-mono">
                {diffEntries.map(([campo, diff]) => (
                  <div key={campo} className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-1">
                    <span className="font-semibold text-slate-700">{campo}:</span>
                    <span className="text-slate-500">
                      <span className="line-through text-red-600 mr-1.5">{String(diff.anterior ?? "vacío")}</span>
                      →
                      <span className="text-emerald-700 font-bold ml-1.5">{String(diff.nuevo ?? "vacío")}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
              Justificación del Cambio <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Describe claramente el motivo técnico u operativo por el cual se modifican los valores.
            </p>
            <textarea
              required
              rows={4}
              value={justificacion}
              onChange={(e) => {
                setJustificacion(e.target.value);
                if (error) setError("");
              }}
              placeholder="Ejemplo: Se corrigió el peso promedio tras calibración de balanza y ajuste de muestras..."
              className="w-full p-3 rounded-lg border border-slate-300 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {error && (
              <p className="mt-1 text-xs text-red-600 font-semibold">{error}</p>
            )}
            <p className="mt-1 text-[11px] text-slate-400 text-right">
              {justificacion.trim().length} / 10 caracteres mínimos
            </p>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="py-2 px-3.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2 px-4 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition disabled:opacity-60 flex items-center gap-1.5"
            >
              {isSubmitting ? "Guardando con Auditoría..." : "Confirmar y Guardar Registro"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
