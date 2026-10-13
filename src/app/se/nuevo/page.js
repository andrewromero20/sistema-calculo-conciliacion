"use client";

import Header from "../../components/layout/Header";
import Sidebar from "../../components/layout/Sidebar";
import NuevoRegistroWizard from "../../components/se/NuevoRegistroWizard";

export default function NuevoRegistroSePage() {
  return (
    <div className="app-shell">
      <Sidebar activeView="se-nuevo" />
      <main className="main-content space-y-6">
        <Header
          title="Nuevo registro (SE)"
          description="Flujo por etapas: validación de orden, captura de cantidades de tableteado y datos técnicos."
        />

        <NuevoRegistroWizard />
      </main>
    </div>
  );
}
