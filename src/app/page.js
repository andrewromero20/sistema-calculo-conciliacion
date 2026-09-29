"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "./components/layout/Header";
import Sidebar from "./components/layout/Sidebar";
import InfoCard from "./components/conciliaciones/InfoCard";
import RecentTable from "./components/conciliaciones/RecentTable";
import ResultMessage from "./components/conciliaciones/ResultMessage";
import SearchCard from "./components/conciliaciones/SearchCard";
import {
  crearConciliacion,
  obtenerConciliacionPorNumeroOrden,
  obtenerConciliaciones,
} from "../services/conciliacionesService";

export default function Home() {
  const router = useRouter();
  const [order, setOrder] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    obtenerConciliaciones()
      .then(setReconciliations)
      .catch(() => setLoadError("No fue posible cargar las conciliaciones."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    console.log(reconciliations);
  }, [reconciliations]);

  async function handleSearch(event) {
    event.preventDefault();
    if (!order) { setError("Ingresa un número de orden para continuar."); setResult(null); return; }
    if (!/^\d+$/.test(order)) { setError("El número de orden solo debe contener números, sin espacios."); setResult(null); return; }
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
    if (!record) { router.push("/historial"); return; }
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

  return <div className="app-shell"><Sidebar activeView="inicio" /><main className="main-content"><Header />{loading && <p>Cargando conciliaciones...</p>}{loadError && <div className="alert info-alert"><div className="alert-symbol">i</div><div>{loadError}</div></div>}<div className="dashboard-grid"><div><SearchCard order={order} setOrder={setOrder} onSearch={handleSearch} onNew={() => router.push("/conciliaciones/nueva")} error={error} /><ResultMessage result={result} onCreate={createReconciliation} onOpen={openRecord} /></div><InfoCard reconciliation={selected} /></div><RecentTable reconciliations={reconciliations} onOpen={openRecord} /></main></div>;
}
