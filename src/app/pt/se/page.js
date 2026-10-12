"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import Icon from "../../components/ui/Icon";
import { formatDateTime } from "../../lib/dateFormat";

export default function PtSeCatalogPage() {
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
      r.producto?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="app-shell">
      <Sidebar activeView="pt-se" />
      <main className="main-content space-y-6">
        <Header
          title="Consulta de Producto Semielaborado (SE)"
          description="Visualiza órdenes a granel y pesadas en modo solo lectura para acondicionamiento PT."
        />

        <div className="card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Órdenes a Granel Disponibles
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona cualquier registro para consultar sus especificaciones técnicas y pesadas capturadas.
              </p>
            </div>

            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Buscar por orden, lote o producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Cargando catálogo de Semielaborados...
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
              {error}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
              No se encontraron registros que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="table-wrap">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 font-semibold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-3">Orden Granel</th>
                    <th className="px-3 py-3">Lote Granel</th>
                    <th className="px-3 py-3">Producto</th>
                    <th className="px-3 py-3">Peso Neto Total</th>
                    <th className="px-3 py-3">Pzas a Acondicionar</th>
                    <th className="px-3 py-3">Fecha Captura</th>
                    <th className="px-3 py-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((item) => (
                    <tr key={item.ordenGranel} className="hover:bg-slate-50 transition">
                      <td className="px-3 py-3 font-mono font-bold text-emerald-800">
                        {item.ordenGranel}
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-slate-700">
                        {item.lote}
                      </td>
                      <td className="px-3 py-3 font-medium text-slate-900">
                        {item.producto}
                      </td>
                      <td className="px-3 py-3 font-mono font-bold text-slate-800">
                        {Number(item.pesoNetoTotalTabletas || 0).toFixed(2)} kg
                      </td>
                      <td className="px-3 py-3 font-mono font-semibold text-blue-700">
                        {Number(item.cantPzasAcondicionar || 0).toLocaleString()} pzas
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {formatDateTime(item.fechaCreacion)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Link
                          href={`/pt/se/${encodeURIComponent(item.ordenGranel)}`}
                          className="py-1 px-3 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs transition inline-flex items-center gap-1"
                        >
                          <Icon name="eye" size={13} />
                          <span>Consultar (Read-Only)</span>
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
