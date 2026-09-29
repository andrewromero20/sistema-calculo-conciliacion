"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import RecentTable from "../components/conciliaciones/RecentTable";
import { obtenerConciliaciones } from "../../services/conciliacionesService";

export default function HistoryPage() {
  const router = useRouter();
  const [reconciliations, setReconciliations] = useState([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    obtenerConciliaciones()
      .then(setReconciliations)
      .catch(() => setLoadError("No fue posible cargar las conciliaciones."));
  }, []);

  return <div className="app-shell"><Sidebar activeView="historial" /><main className="main-content"><Header title="Historial" description="Consulta las conciliaciones registradas y sus últimos cambios." />{loadError && <div className="alert info-alert"><div className="alert-symbol">i</div><div>{loadError}</div></div>}<RecentTable reconciliations={reconciliations} onOpen={(record) => router.push(record ? `/conciliaciones/${record.numeroOrden}` : "/historial")} /></main></div>;
}
