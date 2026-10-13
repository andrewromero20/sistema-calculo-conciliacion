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
          title="Inicio (SE)"
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

            <div className="flex items-center gap-3">
              <Link
                href="/se/nuevo"
                className="py-1.5 px-3.5 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs whitespace-nowrap"
              >
                <Icon name="plus" size={14} />
                <span>Nuevo Registro</span>
              </Link>

              <div className="w-full sm:w-64">
                <input
                  type="text"
                  placeholder="Buscar orden, lote..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
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
            <div className="table-wrap">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3">Orden Granel</th>
                    <th className="px-3 py-3">Lote</th>
                    <th className="px-3 py-3">Producto</th>
                    <th className="px-3 py-3">Peso Neto (kg)</th>
                    <th className="px-3 py-3">Rendimiento</th>
                    <th className="px-3 py-3">Fecha Registro</th>
                    <th className="px-3 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.slice(0, 8).map((item) => (
                    <tr key={item.ordenGranel} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3 font-mono font-bold text-blue-800">
                        {item.ordenGranel}
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                        {item.lote}
                      </td>
                      <td className="px-3 py-3">
                        <span className="font-semibold text-slate-900 block">
                          {item.producto}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {item.codigoMaterial}
                        </span>
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-800">
                        {Number(item.pesoNetoTotalTabletas || 0).toFixed(2)} kg
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-emerald-700">
                        {Number(item.rendimientoTab || 0).toFixed(1)}%
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatDateTime(item.fechaCreacion)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link
                          href={`/se/${encodeURIComponent(item.ordenGranel)}`}
                          className="py-1 px-3 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-bold text-xs transition inline-flex items-center gap-1 shadow-xs"
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
          )}
        </div>
      </main>
    </div>
  );
}
