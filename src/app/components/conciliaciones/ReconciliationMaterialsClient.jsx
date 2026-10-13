"use client";

import { useState } from "react";
import MaterialsCaptureMatrix from "./MaterialsCaptureMatrix";
import MaterialsSection from "./MaterialsSection";

export default function ReconciliationMaterialsClient({
  numeroOrden,
  conciliacionId,
  initialMaterials,
}) {
  const [materials, setMaterials] =
    useState(initialMaterials ?? []);

  function handleMaterialCreated(newMaterial) {
    setMaterials((currentMaterials) => {
      const alreadyExists =
        currentMaterials.some(
          (material) =>
            material.id === newMaterial.id,
        );

      if (alreadyExists) {
        return currentMaterials;
      }

      return [
        ...currentMaterials,
        newMaterial,
      ];
    });
  }

  function handleMaterialUpdated(updatedMaterial) {
    setMaterials((currentMaterials) =>
      currentMaterials.map((material) =>
        material.id === updatedMaterial.id
          ? updatedMaterial
          : material,
      ),
    );
  }

  function handleMaterialDeleted(materialId) {
    setMaterials((currentMaterials) =>
      currentMaterials.filter(
        (material) =>
          material.id !== materialId,
      ),
    );
  }

  return (
    <div className="materials-capture-area">
      <MaterialsCaptureMatrix
        materials={materials}
        numeroOrden={numeroOrden}
        onMaterialCreated={
          handleMaterialCreated
        }
        onMaterialUpdated={
          handleMaterialUpdated
        }
        onMaterialDeleted={
          handleMaterialDeleted
        }
      />

      <details className="legacy-materials-view">
        <summary>
          Mostrar vista anterior de materiales
        </summary>

        <MaterialsSection
          numeroOrden={numeroOrden}
          conciliacionId={conciliacionId}
          materials={materials}
        />
      </details>
    </div>
  );
}