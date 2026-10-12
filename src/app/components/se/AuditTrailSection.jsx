"use client";

import { useState } from "react";
import { formatDateTime } from "@/app/lib/dateFormat";

export default function AuditTrailSection({ auditorias = [] }) {
  const [expandedId, setExpandedId] = useState(null);

  if (!auditorias || auditorias.length === 0) {
    return (
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
        No se registran modificaciones previas en este lote (registro original intacto).
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          Historial de Auditoría (Audit Trail) · {auditorias.length} edición(es)
        </h4>
      </div>

      <div className="space-y-2">
        {auditorias.map((aud) => {
          const isExpanded = expandedId === aud.id;
          const cambiosObj = typeof aud.cambios === "object" ? aud.cambios : {};
          const keys = Object.keys(cambiosObj || {});

          return (
            <div
              key={aud.id}
              className="border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs text-xs"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : aud.id)}
                className="p-3 bg-slate-50/70 hover:bg-slate-100/70 cursor-pointer flex items-center justify-between transition"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[11px]">
                    ✎
                  </span>
                  <div>
                    <span className="font-bold text-slate-900 mr-2">
                      {aud.usuario?.nombre || `Usuario #${aud.usuarioId}`}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {formatDateTime(aud.fechaModificacion)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-medium">
                    {keys.length} campo(s) afectado(s)
                  </span>
                  <span className="text-slate-400 font-bold">
                    {isExpanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              <div className="p-3 border-t border-slate-100 bg-white">
                <p className="text-xs text-slate-700 mb-2">
                  <strong className="text-slate-900">Justificación:</strong>{" "}
                  <span className="italic font-serif text-slate-800">
                    &ldquo;{aud.justificacion}&rdquo;
                  </span>
                </p>

                {isExpanded && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-100">
                    <p className="text-[11px] font-bold text-slate-500 mb-1.5 uppercase">
                      Diferencias detectadas (Diff):
                    </p>
                    <div className="space-y-1 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
                      {keys.map((k) => {
                        const item = cambiosObj[k];
                        return (
                          <div
                            key={k}
                            className="flex flex-wrap items-center justify-between gap-1 py-0.5 border-b border-slate-100 last:border-0"
                          >
                            <span className="text-slate-600 font-semibold">{k}:</span>
                            <div className="text-right">
                              <span className="line-through text-red-600 mr-1">
                                {JSON.stringify(item?.anterior ?? "null")}
                              </span>
                              <span>→</span>
                              <span className="text-emerald-700 font-bold ml-1">
                                {JSON.stringify(item?.nuevo ?? "null")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
