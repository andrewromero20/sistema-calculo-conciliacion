import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import InfoCard from "../../components/conciliaciones/InfoCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatDateTime } from "../../lib/dateFormat";
import ReconciliationMaterialsClient from "../../components/conciliaciones/ReconciliationMaterialsClient";

export default async function ReconciliationPage({ params }) {
  const { numeroOrden } = await params;
  const requestHeaders = await headers();
  const protocol = requestHeaders.get("x-forwarded-proto") || "http";
  const host = requestHeaders.get("host");
  const response = await fetch(
    `${protocol}://${host}/api/conciliaciones/${encodeURIComponent(numeroOrden)}`,
    { cache: "no-store" },
  );

  if (response.status === 404) notFound();
  if (!response.ok) throw new Error("No fue posible cargar la conciliación");

  const reconciliation = await response.json();

return (
  <div className="app-shell">
    <Sidebar activeView="inicio" />

    <main className="main-content">
      <Header
        title={`Orden ${reconciliation.numeroOrden}`}
        description="Consulta la información de esta conciliación."
      />

      <div className="reconciliation-page-layout">
        <InfoCard
          reconciliation={reconciliation}
        />

        <section className="card detail-card reconciliation-materials-card">
          <div className="section-heading">
            <div>
              <h2>
                Conciliación de materiales
              </h2>

              <p>
                Agrega y prepara los materiales de
                esta orden.
              </p>
            </div>

            <StatusBadge
              status={
                reconciliation.estadoConciliacion
              }
            />
          </div>

          

          <ReconciliationMaterialsClient
            numeroOrden={
              reconciliation.numeroOrden
            }
            conciliacionId={
              reconciliation.id
            }
            initialMaterials={
              reconciliation.materiales ?? []
            }
          />

          <Link className="button secondary" href="/">
            <span aria-hidden="true">
              ←
            </span>

            Volver al inicio
          </Link>
        </section>
      </div>
    </main>
  </div>
);
}
