"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import ResultMessage from "../../components/conciliaciones/ResultMessage";
import SearchCard from "../../components/conciliaciones/SearchCard";
import {
  crearConciliacion,
  obtenerConciliaciones,
} from "../../../services/conciliacionesService";

export default function NewReconciliationPage() {
  const router = useRouter();
  const [order, setOrder] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [reconciliations, setReconciliations] = useState([]);

  useEffect(() => {
    obtenerConciliaciones().then(setReconciliations).catch(() => setError("No fue posible cargar las conciliaciones."));
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    if (!order) { setError("Ingresa un número de orden para continuar."); setResult(null); return; }
    setError("");
    const match = reconciliations.find((item) => item.numeroOrden === order);
    setResult(match ? { match } : { order });
  }

  async function createReconciliation() {

  if (!result?.order) {
    console.error(
      "No se puede crear porque result.order está vacío",
      result
    );
    return;
  }

  try {
    const nuevaConciliacion =
      await crearConciliacion(result.order);


    router.push(
      `/conciliaciones/${nuevaConciliacion.numeroOrden}`
    );
  } catch (creationError) {
    console.error(
      "Error creando conciliación:",
      creationError
    );

    setError(
      creationError instanceof Error
        ? creationError.message
        : "No fue posible crear la conciliación."
    );
  }
}

  return <div className="app-shell"><Sidebar activeView="nueva" /><main className="main-content"><Header title="Nueva conciliación" description="Captura el número de orden para iniciar una conciliación." /><div className="dashboard-grid"><div><SearchCard order={order} setOrder={setOrder} onSearch={handleSearch} onNew={() => router.push("/")} error={error} /><ResultMessage result={result} onCreate={createReconciliation} onOpen={(record) => router.push(`/conciliaciones/${record.numeroOrden}`)} /></div></div></main></div>;
}
