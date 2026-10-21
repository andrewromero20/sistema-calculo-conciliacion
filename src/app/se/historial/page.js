"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Icon from "../../components/ui/Icon";
import GooglePagination from "../../components/ui/GooglePagination";
import { formatDateTime } from "../../lib/dateFormat";

const PAGE_SIZE = 8;

export default function SeHistorialPage() {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Búsqueda rápida
  const [searchTerm, setSearchTerm] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/se")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el historial de Semielaborados.");
        return res.json();
      })
      .then((data) => {
        // Orden cronológico por última modificación / creación
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
          : [];
        setRegistros(sorted);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Filtrado por término de búsqueda
  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return registros;
    const term = searchTerm.toLowerCase().trim();
    return registros.filter((item) => {
      return (
        item.ordenGranel?.toLowerCase().includes(term) ||
        item.lote?.toLowerCase().includes(term) ||
        item.producto?.toLowerCase().includes(term) ||
        item.codigoMaterial?.toLowerCase().includes(term)
      );
    });
  }, [registros, searchTerm]);

  function limpiarFiltros() {
    setSearchTerm("");
    setCurrentPage(1);
  }

  // Paginación
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE) || 1;
  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const paginatedItems = filtered.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  );

  return (
    <div className="app-shell">
      <Sidebar activeView="se-historial" />
      <main className="main-content space-y-6">
        <Header
          title="Historial de registros (SE)"
          description="Consulta cronológica completa y examinación de parámetros por orden."
        />

        {/* Barra de Búsqueda y Acción (sin recuadro contenedor externo) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[280px] max-w-md flex items-center bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition shadow-xs">
            <span className="text-slate-400 shrink-0 mr-2.5 flex items-center justify-center pointer-events-none">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Buscar por número de orden o lote..."
              className="w-full text-sm font-medium focus:outline-none bg-transparent text-slate-800 placeholder-slate-400 border-none p-0"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-slate-400 hover:text-slate-600 text-xs shrink-0 ml-2 transition cursor-pointer"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <Link
            href="/se/nuevo"
            className="py-2.5 px-4 rounded-xl bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Icon name="plus" size={14} />
            <span>Nuevo Registro</span>
          </Link>
        </div>

        {/* Tabla de Resultados */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Cargando historial de Semielaborados...
            </div>
          ) : error ? (
            <div className="p-6 bg-red-50 text-red-700 text-xs border-b border-red-200">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">
                No se encontraron registros que coincidan con la búsqueda.
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={limpiarFiltros}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <>
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
                    {paginatedItems.map((item) => (
                      <tr
                        key={item.ordenGranel}
                        className="hover:bg-slate-50/80 transition"
                      >
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
                          {/* Botón Examinar */}
                          <Link
                            href={`/se/${encodeURIComponent(item.ordenGranel)}`}
                            className="inline-flex items-center justify-center py-1.5 px-3 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition shadow-xs"
                          >
                            <span>Examinar</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación Google de máx 6 botones */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/50">
                <GooglePagination
                  currentPage={safeCurrentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  maxButtons={6}
                />
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
