"use client";

import {
  useMemo,
  useState,
} from "react";
import { crearMaterial } from "../../../services/materialesService";
import {
  MATERIAL_DEFINITIONS,
  getMaterialDefinition,
} from "../../../lib/materialDefinitions";
function normalizeFormValue(value) {
  return value === null ||
    value === undefined
    ? ""
    : value;
}

function createMaterialDraft(material) {
  const isTablet =
    material.descripcion === "TABLETA";

  return {
    cantidadSurtidaA:
      normalizeFormValue(
        material.cantidadSurtidaA,
      ),

    cantidadAdicionalB: isTablet
      ? 0
      : normalizeFormValue(
          material.cantidadAdicionalB,
        ),

    cantidadDevueltaC: isTablet
      ? 0
      : normalizeFormValue(
          material.cantidadDevueltaC,
        ),

    cantidadRealAcondicionada:
      normalizeFormValue(
        material.cantidadRealAcondicionada,
      ),

    tabletasPorBlister:
      normalizeFormValue(
        material.tabletasPorBlister,
      ),

    capacidadCajaEmpaque:
      normalizeFormValue(
        material.capacidadCajaEmpaque,
      ),

    telecamara:
      normalizeFormValue(
        material.telecamara,
      ),

    hermeticidad:
      normalizeFormValue(
        material.hermeticidad,
      ),

    otraMerma:
      normalizeFormValue(
        material.otraMerma,
      ),

    cajasTomadasMuestra:
      normalizeFormValue(
        material.cajasTomadasMuestra,
      ),

    cajasUtilizadasArranque:
      normalizeFormValue(
        material.cajasUtilizadasArranque,
      ),

    resultadoE:
      normalizeFormValue(
        material.resultadoE,
      ),

    resultadoF:
      normalizeFormValue(
        material.resultadoF,
      ),

    resultadoG:
      normalizeFormValue(
        material.resultadoG,
      ),
  };
}

function createInitialDrafts(materials) {
  return Object.fromEntries(
    materials.map((material) => [
      material.id,
      createMaterialDraft(material),
    ]),
  );
}
export default function MaterialsCaptureMatrix({
  materials = [],
  numeroOrden,
  onMaterialCreated,
}) {
  const [showAddForm, setShowAddForm] =
    useState(false);

  const [selectedMaterial, setSelectedMaterial] =
    useState("");

  const [savingMaterial, setSavingMaterial] =
    useState(false);

  const [error, setError] = useState("");

  const [drafts, setDrafts] = useState(
  () => createInitialDrafts(materials),
);

  const existingDescriptions = useMemo(
    () =>
      new Set(
        materials.map(
          (material) => material.descripcion,
        ),
      ),
    [materials],
  );

  const availableMaterials = useMemo(
    () =>
      MATERIAL_DEFINITIONS.filter(
        (definition) =>
          !existingDescriptions.has(
            definition.descripcion,
          ),
      ),
    [existingDescriptions],
  );  

  async function handleCreateMaterial(event) {
    event.preventDefault();

    const definition =
      getMaterialDefinition(selectedMaterial);

    if (!definition) {
      setError(
        "Selecciona un material válido.",
      );
      return;
    }

    setSavingMaterial(true);
    setError("");

    try {
      const newMaterial =
        await crearMaterial({
          numeroOrden,
          descripcion: definition.descripcion,
          unidadMedida: definition.unidadMedida,
          codigoSAP: "",
        });

        setDrafts((currentDrafts) => ({
            ...currentDrafts,
            [newMaterial.id]:
            createMaterialDraft(newMaterial),
        }));

      onMaterialCreated(newMaterial);

      setSelectedMaterial("");
      setShowAddForm(false);
    } catch (creationError) {
      setError(
        creationError instanceof Error
          ? creationError.message
          : "No fue posible crear el material.",
      );
    } finally {
      setSavingMaterial(false);
    }
  }
    function updateDraft(
        materialId,
        field,
        value,
    ) {
        if (
            value !== "" &&
            Number(value) < 0
        ) {
            setError(
            "Las cantidades no pueden ser negativas.",
            );
            return;
        }

    setDrafts((currentDrafts) => ({
        ...currentDrafts,

        [materialId]: {
        ...currentDrafts[materialId],
        [field]: value,
        },
    }));

    setError("");
    }

  return (
    <section className="card materials-matrix-card">
      <div className="materials-matrix-header">
        <div>
          <h2>Matriz de captura</h2>

          <p>
            Agrega los materiales de la orden y
            captura sus valores directamente en la
            tabla.
          </p>
        </div>

        {!showAddForm && (
            <button
                type="button"
                className="button primary"
                onClick={() => {
                setShowAddForm(true);
                setError("");
                }}
                disabled={availableMaterials.length === 0}
            >
                + Agregar material
            </button>
            )}
      </div>

      {showAddForm && (
        <form
          className="matrix-add-material-form"
          onSubmit={handleCreateMaterial}
        >
          <label>
            Tipo de material

            <select
              value={selectedMaterial}
              onChange={(event) =>
                setSelectedMaterial(
                  event.target.value,
                )
              }
              required
            >
              <option value="">
                Selecciona un material
              </option>

              {availableMaterials.map(
                (material) => (
                  <option
                    key={material.descripcion}
                    value={material.descripcion}
                  >
                    {material.descripcion}
                  </option>
                ),
              )}
            </select>
          </label>

          {selectedMaterial && (
            <p className="selected-material-unit">
              Unidad:{" "}
              <strong>
                {
                  getMaterialDefinition(
                    selectedMaterial,
                  )?.unidadMedida
                }
              </strong>
            </p>
          )}

          <div className="button-row">
            <button
              type="submit"
              className="button primary"
              disabled={
                savingMaterial ||
                !selectedMaterial
              }
            >
              {savingMaterial
                ? "Agregando..."
                : "Agregar"}
            </button>

            <button
              type="button"
              className="button secondary"
              disabled={savingMaterial}
              onClick={() => {
                setShowAddForm(false);
                setSelectedMaterial("");
                setError("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {error && (
        <p className="field-error">
          {error}
        </p>
      )}

      {materials.length === 0 ? (
        <div className="matrix-empty-state">
          <h3>
            Aún no hay materiales agregados
          </h3>

          <p>
            Agrega el primer material para comenzar
            la conciliación.
          </p>

          <button
            type="button"
            className="button primary"
            onClick={() => {
              setShowAddForm(true);
              setError("");
            }}
          >
            + Agregar primer material
          </button>
        </div>
      ) : (
        <div className="materials-matrix-wrapper">
          <table className="materials-capture-matrix">
            <thead>
              <tr>
                <th className="matrix-concept-column">
                  Concepto
                </th>

                {materials.map((material) => (
                  <th
                    key={material.id}
                    className="matrix-material-column"
                  >
                    <strong>
                      {material.descripcion}
                    </strong>

                    <small>
                      {material.unidadMedida}
                    </small>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr className="matrix-group-row">
                <td
                  colSpan={
                    materials.length + 1
                  }
                >
                  Cantidad recibida
                </td>
              </tr>

              <tr>
                <th className="matrix-concept-column">
                  A. Cantidad surtida
                </th>

                {materials.map((material) => (
                  <td key={material.id}>
                    Pendiente
                  </td>
                ))}
              </tr>

              <tr>
                <th className="matrix-concept-column">
                  B. Cantidad adicional
                </th>

                {materials.map((material) => (
                  <td key={material.id}>
                    {material.descripcion ===
                    "TABLETA"
                      ? "0"
                      : "Pendiente"}
                  </td>
                ))}
              </tr>

              <tr>
                <th className="matrix-concept-column">
                  C. Cantidad devuelta
                </th>

                {materials.map((material) => (
                  <td key={material.id}>
                    {material.descripcion ===
                    "TABLETA"
                      ? "0"
                      : "Pendiente"}
                  </td>
                ))}
              </tr>

              <tr>
                <th className="matrix-concept-column">
                  D. Total recibido
                </th>

                {materials.map((material) => (
                  <td
                    key={material.id}
                    className="matrix-calculated-cell"
                  >
                    Pendiente
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}