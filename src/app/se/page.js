"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Icon from "../components/ui/Icon";
import { formatDateTime } from "../lib/dateFormat";

export default function SeDashboardPage() {
  const router = useRouter();
  const [registros, setRegistros] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/se")
      .then((res) => {
        if (!res.ok) throw new Error("No fue posible cargar los registros SE.");
        return res.json();
      })
      .then((data) => setRegistros(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = registros.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.ordenGranel?.toLowerCase().includes(term) ||
      r.lote?.toLowerCase().includes(term) ||
      r.producto?.toLowerCase().includes(term) ||
      r.codigoMaterial?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="app-shell">
      <Sidebar activeView="se-inicio" />
      <main className="main-content space-y-6">
        <Header
          title="Semi-elaborado"
          description="Control de pesadas, tableteado, recubrimiento y órdenes a granel."
        />

        {/* Buscador y Tabla de Registros */}
        <div className="card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Registros Recientes
              </h2>
              <p className="text-xs text-slate-500">
                Órdenes a granel procesadas en el área de Semielaborados.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/se/nuevo"
                className="py-1.5 px-3.5 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Icon name="plus" size={14} />
                <span>Nuevo Registro</span>
              </Link>

              <div className="relative w-full sm:w-64">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 z-10">
                  <Icon name="search" size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Buscar orden, lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    height: "36px",
                    paddingLeft: "32px",
                    paddingRight: searchTerm ? "28px" : "10px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    backgroundColor: "#ffffff",
                    fontSize: "12px",
                  }}
                  className="w-full text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 text-xs transition cursor-pointer z-10"
                    title="Limpiar búsqueda"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Link
                href="/se/historial"
                className="text-xs font-semibold text-[#0d6efd] hover:underline whitespace-nowrap"
              >
                Ver Historial Completo →
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Cargando registros de Semielaborado...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No se encontraron registros de Semielaborado que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-[#f8fafc] text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Orden Granel
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Lote
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Producto
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Rendimiento
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Fin Tableteado
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Fin 1ra Carga
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Fecha Registro
                    </th>
                    <th scope="col" className="px-4 py-3 text-center">
                      <span className="sr-only">Examinar</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 8).map((item) => (
                    <tr key={item.ordenGranel} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3 font-mono font-bold text-blue-700">
                        {item.ordenGranel}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800">
                        {item.lote}
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {item.producto}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {item.codigoMaterial}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            Number(item.rendimientoTab) >= 90.4 &&
                            Number(item.rendimientoTab) <= 100.9
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-amber-50 text-amber-800 border border-amber-200"
                          }`}
                        >
                          {Number(item.rendimientoTab || 0).toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.fechaFinTableteado ? formatDateTime(item.fechaFinTableteado) : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {item.fechaFinPrimeraCarga ? formatDateTime(item.fechaFinPrimeraCarga) : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                        {formatDateTime(item.fechaCreacion)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Link
                          href={`/se/${encodeURIComponent(item.ordenGranel)}`}
                          className="inline-flex items-center justify-center py-1.5 px-3 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          <span>Examinar</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
