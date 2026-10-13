"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import SEDetailView from "../../components/se/SEDetailView";

export default function SeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [registro, setRegistro] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ordenGranel = params.ordenGranel;

  useEffect(() => {
    // 1. Obtener usuario de sesión
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});

    // 2. Obtener registro
    if (ordenGranel) {
      fetch(`/api/se/${encodeURIComponent(ordenGranel)}`)
        .then((res) => {
          if (res.status === 404) throw new Error("Registro no encontrado.");
          if (!res.ok) throw new Error("Error al consultar el registro.");
          return res.json();
        })
        .then((data) => setRegistro(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [ordenGranel]);

  return (
    <div className="app-shell">
      <Sidebar activeView="se-inicio" />
      <main className="main-content space-y-6">
        <Header
          title={`Orden a Granel: ${ordenGranel}`}
          description="Consulta técnica de parámetros de tableteado y pesos capturados."
        />

        {loading ? (
          <div className="card p-10 text-center text-xs text-slate-500">
            Cargando información del registro...
          </div>
        ) : error ? (
          <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-xs space-y-3">
            <p className="font-bold">Error:</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => router.push("/se")}
              className="py-1.5 px-3.5 rounded-lg bg-[#1a2b45] hover:bg-[#142236] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
            >
              ← Volver al catálogo SE
            </button>
          </div>
        ) : (
          <SEDetailView
            registro={registro}
            userRole={user?.rol || "USER_SE"}
            isPTView={false}
          />
        )}
      </main>
    </div>
  );
}
