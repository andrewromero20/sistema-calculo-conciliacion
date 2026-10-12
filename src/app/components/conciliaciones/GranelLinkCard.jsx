"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "../ui/Icon";

export default function GranelLinkCard({ initialOrdenGranel = "", numeroOrden }) {
  const [ordenGranel, setOrdenGranel] = useState(initialOrdenGranel || "");
  const [editing, setEditing] = useState(!initialOrdenGranel);

  return (
    <div className="card p-4 bg-gradient-to-br from-emerald-50/50 to-blue-50/50 border border-emerald-200 rounded-lg text-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-900 font-bold">
          <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center text-[10px]">
            OG
          </span>
          <span>Interoperabilidad · Orden a Granel SE</span>
        </div>
        {ordenGranel && !editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-[11px] text-blue-700 hover:underline font-semibold"
          >
            Cambiar orden
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <label className="block text-[11px] text-slate-600 font-medium">
            Ingresa la Orden a Granel de Semielaborados que abastece a esta orden PT:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Ej. OG-900142"
              value={ordenGranel}
              onChange={(e) => setOrdenGranel(e.target.value.toUpperCase())}
              className="px-2.5 py-1.5 border border-slate-300 rounded font-mono text-xs w-44"
            />
            <button
              type="button"
              onClick={() => {
                if (ordenGranel.trim()) setEditing(false);
              }}
              className="py-1.5 px-3 rounded bg-emerald-600 text-white font-semibold text-xs hover:bg-emerald-700 transition"
            >
              Vincular
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-200/60">
          <div>
            <span className="text-slate-500 text-[11px] block">Orden Granel Vinculada:</span>
            <span className="font-mono font-bold text-sm text-emerald-900">{ordenGranel}</span>
          </div>

          <Link
            href={`/pt/se/${encodeURIComponent(ordenGranel)}`}
            className="py-1.5 px-3 rounded-md bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs transition inline-flex items-center gap-1.5 shadow-xs"
          >
            <Icon name="eye" size={13} />
            <span>Consultar Datos SE y Pesos</span>
          </Link>
        </div>
      )}
    </div>
  );
}
