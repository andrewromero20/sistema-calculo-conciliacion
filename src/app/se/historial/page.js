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

  // Filtros avanzados (Figma Comments 11, 12, 13 & nodos 96:140)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filtroCodigoMaterial, setFiltroCodigoMaterial] = useState("");
  const [filtroProducto, setFiltroProducto] = useState("");
  const [filtroSupervisor, setFiltroSupervisor] = useState("");
  const [filtroRendMin, setFiltroRendMin] = useState("");
  const [filtroRendMax, setFiltroRendMax] = useState("");
  const [filtroFechaDesde, setFiltroFechaDesde] = useState("");
  const [filtroFechaHasta, setFiltroFechaHasta] = useState("");

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetch("/api/se")
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar el historial de Semielaborados.");
        return res.json();
      })
      .then((data) => {
        // Orden cronológico por última modificación / creación (Figma Comment 10)
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion))
          : [];
        setRegistros(sorted);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Lista única de productos, códigos y supervisores para autocompletar filtros
  const listaProductos = useMemo(() => {
    return Array.from(new Set(registros.map((r) => r.producto).filter(Boolean)));
  }, [registros]);

  const listaCodigos = useMemo(() => {
    return Array.from(new Set(registros.map((r) => r.codigoMaterial).filter(Boolean)));
  }, [registros]);

  const listaSupervisores = useMemo(() => {
    const set = new Set();
    registros.forEach((r) => {
      if (r.supervisorPreparacion) set.add(r.supervisorPreparacion);
      if (r.supervisorTabRecub) set.add(r.supervisorTabRecub);
    });
    return Array.from(set);
  }, [registros]);

  // Filtrado compuesto
  const filtered = useMemo(() => {
    return registros.filter((item) => {
      // 1. Buscador rápido por número de orden o lote (Figma Comment 11)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesOrden = item.ordenGranel?.toLowerCase().includes(term);
        const matchesLote = item.lote?.toLowerCase().includes(term);
        const matchesProd = item.producto?.toLowerCase().includes(term);
        const matchesCod = item.codigoMaterial?.toLowerCase().includes(term);
        if (!matchesOrden && !matchesLote && !matchesProd && !matchesCod) return false;
      }

      // 2. Filtro por código de material (Figma 96:140)
      if (filtroCodigoMaterial) {
        if (!item.codigoMaterial?.toLowerCase().includes(filtroCodigoMaterial.toLowerCase())) {
          return false;
        }
      }

      // 3. Filtro por producto
      if (filtroProducto) {
        if (!item.producto?.toLowerCase().includes(filtroProducto.toLowerCase())) {
          return false;
        }
      }

      // 4. Filtro por supervisor
      if (filtroSupervisor) {
        const supTerm = filtroSupervisor.toLowerCase();
        const supPrep = item.supervisorPreparacion?.toLowerCase() || "";
        const supTab = item.supervisorTabRecub?.toLowerCase() || "";
        if (!supPrep.includes(supTerm) && !supTab.includes(supTerm)) {
          return false;
        }
      }

      // 5. Filtro por rango de rendimiento (%)
      const rend = Number(item.rendimientoTab) || 0;
      if (filtroRendMin !== "" && rend < Number(filtroRendMin)) {
        return false;
      }
      if (filtroRendMax !== "" && rend > Number(filtroRendMax)) {
        return false;
      }

      // 6. Filtro por rango de fechas
      if (filtroFechaDesde) {
        const itemDate = new Date(item.fechaCreacion).toISOString().slice(0, 10);
        if (itemDate < filtroFechaDesde) return false;
      }
      if (filtroFechaHasta) {
        const itemDate = new Date(item.fechaCreacion).toISOString().slice(0, 10);
        if (itemDate > filtroFechaHasta) return false;
      }

      return true;
    });
  }, [
    registros,
    searchTerm,
    filtroCodigoMaterial,
    filtroProducto,
    filtroSupervisor,
    filtroRendMin,
    filtroRendMax,
    filtroFechaDesde,
    filtroFechaHasta,
  ]);

  function limpiarFiltros() {
    setSearchTerm("");
    setFiltroCodigoMaterial("");
    setFiltroProducto("");
    setFiltroSupervisor("");
    setFiltroRendMin("");
    setFiltroRendMax("");
    setFiltroFechaDesde("");
    setFiltroFechaHasta("");
    setCurrentPage(1);
  }

  const activeFilterCount =
    (filtroCodigoMaterial ? 1 : 0) +
    (filtroProducto ? 1 : 0) +
    (filtroSupervisor ? 1 : 0) +
    (filtroRendMin || filtroRendMax ? 1 : 0) +
    (filtroFechaDesde || filtroFechaHasta ? 1 : 0);

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
          title="Historial de Producto Semielaborado"
          description="Consulta cronológica completa, filtros avanzados y examinación de parámetros por orden."
        />

        {/* Barra de Búsqueda y Botón de Filtros Avanzados (Figma 84:281) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex-1 min-w-[260px] max-w-md relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por número de orden o lote..."
                className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                🔍
              </span>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`py-2 px-3.5 rounded-lg border text-xs font-semibold transition flex items-center gap-2 shadow-xs ${
                  showAdvancedFilters || activeFilterCount > 0
                    ? "bg-blue-50 border-blue-300 text-blue-900"
                    : "bg-white border-slate-300 hover:bg-slate-50 text-slate-700"
                }`}
              >
                <Icon name="search" size={14} />
                <span>Filtros avanzados</span>
                {activeFilterCount > 0 && (
                  <span className="w-5 h-5 rounded-full bg-[#0d6efd] text-white text-[10px] flex items-center justify-center font-bold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <Link
                href="/se/nuevo"
                className="py-2 px-4 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                <Icon name="plus" size={14} />
                <span>Nuevo Registro</span>
              </Link>
            </div>
          </div>

          {/* Panel Desplegable de Filtros Avanzados (Figma Comments 12-13 & nodo 96:140) */}
          {showAdvancedFilters && (
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 animate-in fade-in duration-200">
              {/* Filtro por Código de Material (Figma 96:140) */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código Material
                </label>
                <select
                  value={filtroCodigoMaterial}
                  onChange={(e) => setFiltroCodigoMaterial(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                >
                  <option value="">Todos los códigos</option>
                  {listaCodigos.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Producto */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Producto
                </label>
                <select
                  value={filtroProducto}
                  onChange={(e) => setFiltroProducto(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos los productos</option>
                  {listaProductos.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Supervisor */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Supervisor
                </label>
                <select
                  value={filtroSupervisor}
                  onChange={(e) => setFiltroSupervisor(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">Todos los supervisores</option>
                  {listaSupervisores.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro por Rango de Rendimiento */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rendimiento (%)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    placeholder="Mín %"
                    value={filtroRendMin}
                    onChange={(e) => setFiltroRendMin(e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="number"
                    placeholder="Máx %"
                    value={filtroRendMax}
                    onChange={(e) => setFiltroRendMax(e.target.value)}
                    className="w-1/2 px-2 py-1.5 text-xs border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>

              {/* Filtro por Rango de Fechas */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Rango de Fechas
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={filtroFechaDesde}
                    onChange={(e) => setFiltroFechaDesde(e.target.value)}
                    className="w-1/2 px-1.5 py-1 text-xs border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                  <input
                    type="date"
                    value={filtroFechaHasta}
                    onChange={(e) => setFiltroFechaHasta(e.target.value)}
                    className="w-1/2 px-1.5 py-1 text-xs border border-slate-300 rounded-lg font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Botón para Limpiar */}
              {activeFilterCount > 0 && (
                <div className="col-span-full flex justify-end">
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    Restablecer todos los filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Tabla de Resultados (Figma 84:281) */}
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
              <button
                type="button"
                onClick={limpiarFiltros}
                className="text-blue-600 hover:underline font-semibold"
              >
                Limpiar filtros aplicados
              </button>
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
                        Supervisor Tab.
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Peso Neto Total
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Rendimiento
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Fecha Registro
                      </th>
                      <th scope="col" className="px-4 py-3 text-center">
                        Acción
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
                        <td className="px-4 py-3 text-slate-600">
                          {item.supervisorTabRecub || item.supervisorPreparacion || "-"}
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">
                          {Number(item.pesoNetoTotalTabletas || 0).toFixed(2)} kg
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
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                          {formatDateTime(item.fechaCreacion)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {/* Botón Examinar (Figma Comment 14 & 18) */}
                          <Link
                            href={`/se/${encodeURIComponent(item.ordenGranel)}`}
                            className="inline-flex items-center gap-1.5 py-1 px-3 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition shadow-xs"
                          >
                            <Icon name="search" size={13} />
                            <span>Examinar</span>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación Google de máx 6 botones (Figma Comment 16) */}
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
