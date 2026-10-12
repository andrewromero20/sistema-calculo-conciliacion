"use client";

import CapturaCantidades from "./CapturaCantidades";

export default function PesosModal({
  isOpen,
  onClose,
  pesos = [],
  onChangePesos,
  readOnly = true,
  ordenGranel = "",
}) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado del modal */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Pesos Capturados {ordenGranel ? `· Orden ${ordenGranel}` : ""}
            </h2>
            <p className="text-xs text-slate-500">
              Desglose detallado de pesadas, taras y pesos netos por tambor/recipiente.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 flex items-center justify-center text-xl font-bold transition"
            aria-label="Cerrar modal"
          >
            ×
          </button>
        </div>

        {/* Contenido con la tabla */}
        <div className="p-6">
          <CapturaCantidades
            pesos={pesos}
            onChangePesos={onChangePesos}
            readOnly={readOnly}
          />
        </div>

        {/* Pie del modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs shadow-sm transition"
          >
            Cerrar visualización
          </button>
        </div>
      </div>
    </div>
  );
}
