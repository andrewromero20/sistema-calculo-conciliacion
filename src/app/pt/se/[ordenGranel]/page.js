"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/layout/Header";
import Sidebar from "../../../components/layout/Sidebar";
import SEDetailView from "../../../components/se/SEDetailView";
import Icon from "../../../components/ui/Icon";

export default function PtSeDetailLookupPage() {
  const params = useParams();
  const router = useRouter();
  const [registro, setRegistro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const ordenGranel = params.ordenGranel;

  useEffect(() => {
    if (ordenGranel) {
      fetch(`/api/se/${encodeURIComponent(ordenGranel)}`)
        .then((res) => {
          if (res.status === 404) {
            throw new Error(`No se encontró la Orden a Granel ${ordenGranel}.`);
          }
          if (!res.ok) {
            throw new Error("Error al consultar el registro de Semielaborado.");
          }
          return res.json();
        })
        .then((data) => setRegistro(data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [ordenGranel]);

  return (
    <div className="app-shell">
      <Sidebar activeView="pt-se" />
      <main className="main-content space-y-6">
        <Header
          title={`Consulta SE: ${ordenGranel}`}
          description="Datos técnicos de Semielaborados en modo solo lectura para control de Acondicionado PT."
        />

        <div className="flex items-center justify-between">
          <Link
            href="/pt/se"
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition"
          >
            <span>← Volver al catálogo de Semielaborados</span>
          </Link>

          {registro && (
            <Link
              href={`/conciliaciones/nueva?granel=${encodeURIComponent(registro.ordenGranel)}`}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs"
            >
              <Icon name="plus" size={14} />
              <span>Crear Conciliación PT con esta Orden Granel</span>
            </Link>
          )}
        </div>

        {loading ? (
          <div className="card p-10 text-center text-xs text-slate-500">
            Consultando datos de Semielaborado...
          </div>
        ) : error ? (
          <div className="card p-6 border-red-200 bg-red-50 text-red-700 text-xs space-y-3">
            <p className="font-bold">Error de búsqueda:</p>
            <p>{error}</p>
            <button
              type="button"
              onClick={() => router.push("/pt/se")}
              className="py-1.5 px-3 rounded bg-white border border-red-300 text-xs font-semibold text-red-800"
            >
              Volver a buscar
            </button>
          </div>
        ) : (
          <SEDetailView
            registro={registro}
            userRole="USER_PT"
            isPTView={true}
          />
        )}
      </main>
    </div>
  );
}
