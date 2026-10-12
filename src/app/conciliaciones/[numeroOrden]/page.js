import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import InfoCard from "../../components/conciliaciones/InfoCard";
import MaterialsSection from "../../components/conciliaciones/MaterialsSection";
import GranelLinkCard from "../../components/conciliaciones/GranelLinkCard";
import StatusBadge from "../../components/ui/StatusBadge";
import { formatDateTime } from "../../lib/dateFormat";

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
      <Sidebar activeView="pt-inicio" />
      <main className="main-content">
        <Header
          title={`Orden ${reconciliation.numeroOrden}`}
          description="Consulta la información de esta conciliación."
        />
        <div className="detail-layout">
          <div className="space-y-4">
            <InfoCard reconciliation={reconciliation} />
            <GranelLinkCard
              initialOrdenGranel={reconciliation.ordenGranel || ""}
              numeroOrden={reconciliation.numeroOrden}
            />
          </div>
          <section className="card detail-card">
            <div className="section-heading">
              <div>
                <h2>Conciliación de materiales</h2>
                <p>Agrega y prepara los materiales de esta orden.</p>
              </div>
              <StatusBadge status={reconciliation.estadoConciliacion} />
            </div>
            <div className="detail-summary">
              <strong>Orden {reconciliation.numeroOrden}</strong>
              <span>
                Última modificación: {formatDateTime(reconciliation.fechaActualizacion)}
              </span>
              <span>Usuario: {reconciliation.usuarioUltimaModificacion}</span>
            </div>
            <MaterialsSection
              numeroOrden={reconciliation.numeroOrden}
              conciliacionId={reconciliation.id}
              materials={reconciliation.materiales}
            />
            <Link className="button secondary" href="/pt">
              <span aria-hidden="true">←</span>Volver a PT
            </Link>
          </section>
        </div>
      </main>
    </div>
  );
}
