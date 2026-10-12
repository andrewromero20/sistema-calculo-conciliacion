"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import InfoCard from "../components/conciliaciones/InfoCard";
import RecentTable from "../components/conciliaciones/RecentTable";
import ResultMessage from "../components/conciliaciones/ResultMessage";
import SearchCard from "../components/conciliaciones/SearchCard";
import Icon from "../components/ui/Icon";
import {
  crearConciliacion,
  obtenerConciliacionPorNumeroOrden,
  obtenerConciliaciones,
} from "../../services/conciliacionesService";

export default function PtDashboard() {
  const router = useRouter();
  const [order, setOrder] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Búsqueda de Orden a Granel SE desde PT
  const [granelSearch, setGranelSearch] = useState("");

  useEffect(() => {
    obtenerConciliaciones()
      .then(setReconciliations)
      .catch(() => setLoadError("No fue posible cargar las conciliaciones."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSearch(event) {
    event.preventDefault();
    if (!order) {
      setError("Ingresa un número de orden para continuar.");
      setResult(null);
      return;
    }
    if (!/^\d+$/.test(order)) {
      setError("El número de orden solo debe contener números, sin espacios.");
      setResult(null);
      return;
    }
    setError("");
    try {
      const match = await obtenerConciliacionPorNumeroOrden(order);
      setResult(match ? { match } : { order });
      setSelected(match);
    } catch {
      setError("No fue posible buscar la conciliación.");
      setResult(null);
      setSelected(null);
    }
  }

  function openRecord(record) {
    if (!record) {
      router.push("/historial");
      return;
    }
    router.push(`/conciliaciones/${record.numeroOrden}`);
  }

  async function createReconciliation() {
    if (!result?.order) return;
    try {
      await crearConciliacion(result.order);
      router.push(`/conciliaciones/${result.order}`);
    } catch (creationError) {
      setError(creationError.message);
    }
  }

  function handleGranelLookup(e) {
    e.preventDefault();
    if (!granelSearch.trim()) return;
    router.push(`/pt/se/${encodeURIComponent(granelSearch.trim())}`);
  }

  return (
    <div className="app-shell">
      <Sidebar activeView="pt-inicio" />
      <main className="main-content space-y-6">
        <Header
          title="Producto Terminado (PT)"
          description="Gestión y conciliación de órdenes de acondicionamiento y consulta de granel SE."
        />

        {/* Banner de interoperabilidad con SE */}
        <div className="card p-5 bg-gradient-to-r from-blue-50/70 to-emerald-50/70 border border-emerald-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Icon name="search" size={20} />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Interoperabilidad SE → PT
              </h3>
              <p className="text-xs text-slate-600">
                Consulta los parámetros de tableteado y pesadas netas del granel registrado en Semielaborados.
              </p>
            </div>
          </div>

          <form onSubmit={handleGranelLookup} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Ej. OG-900142"
              value={granelSearch}
              onChange={(e) => setGranelSearch(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg w-44 font-mono uppercase"
            />
            <button
              type="submit"
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
            >
              Consultar SE
            </button>
            <Link
              href="/pt/se"
              className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-white text-xs font-medium text-slate-700 transition"
            >
              Ver Catálogo SE
            </Link>
          </form>
        </div>

        {loading && <p className="text-xs text-slate-500">Cargando conciliaciones...</p>}
        {loadError && (
          <div className="alert info-alert">
            <div className="alert-symbol">i</div>
            <div>{loadError}</div>
          </div>
        )}

        <div className="dashboard-grid">
          <div>
            <SearchCard
              order={order}
              setOrder={setOrder}
              onSearch={handleSearch}
              onNew={() => router.push("/conciliaciones/nueva")}
              error={error}
            />
            <ResultMessage
              result={result}
              onCreate={createReconciliation}
              onOpen={openRecord}
            />
          </div>
          <InfoCard reconciliation={selected} />
        </div>

        <RecentTable
          reconciliations={reconciliations}
          onOpen={openRecord}
        />
      </main>
    </div>
  );
}
