"use client";

import {
  calcularDiferenciaFoil,
  calcularEFoil,
  calcularFFoil,
  calcularPorcentajeDiferencia,
  calcularTotalFoil,
  calcularTotalRecibido,
  evaluarEstadoMaterial,
} from "../../../lib/calculosMateriales";

import {
  useMemo,
  useState,
} from "react";
import { crearMaterial, actualizarMaterial } from "../../../services/materialesService";
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

function parseOptionalNumber(value) {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function formatQuantity(value, unit = "") {
  if (
    value === null ||
    value === undefined
  ) {
    return "Pendiente";
  }

  const formatted = Number(value).toLocaleString(
    "es-MX",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3,
    },
  );

  return unit
    ? `${formatted} ${unit}`
    : formatted;
}

function formatPercentage(value, totalRecibido) {
  if (
    value === null ||
    value === undefined
  ) {
    return totalRecibido === 0
      ? "No calculable"
      : "Pendiente";
  }

  return `${Number(value).toFixed(2)} %`;
}

function formatMaterialStatus(status) {
  const labels = {
    CAPTURA_INCOMPLETA:
      "Captura incompleta",
    PENDIENTE_DE_REVISION:
      "Pendiente de revisión",
    DENTRO_DEL_LIMITE:
      "Dentro del límite",
    FUERA_DEL_LIMITE:
      "Fuera del límite",
  };

  return labels[status] ?? status;
}

function calculateFoilPvcPreview(draft) {
  if (!draft) {
    return {
      totalRecibidaD: null,
      resultadoE: null,
      resultadoF: null,
      resultadoG: null,
      totalUtilizadaH: null,
      diferencia: null,
      porcentajeDiferencia: null,
      limitePermitido: 7,
      estadoMaterial:
        "CAPTURA_INCOMPLETA",
    };
  }

  const cantidadSurtidaA =
    parseOptionalNumber(
      draft.cantidadSurtidaA,
    );

  const cantidadAdicionalB =
    parseOptionalNumber(
      draft.cantidadAdicionalB,
    );

  const cantidadDevueltaC =
    parseOptionalNumber(
      draft.cantidadDevueltaC,
    );

  const totalRecibidaD =
    calcularTotalRecibido(
      cantidadSurtidaA,
      cantidadAdicionalB,
      cantidadDevueltaC,
    );

  const resultadoE = calcularEFoil(
    parseOptionalNumber(draft.resultadoE),
  );

  const resultadoF = calcularFFoil(
    parseOptionalNumber(draft.resultadoF),
  );

  const resultadoG = null;

  const totalUtilizadaH =
    calcularTotalFoil(
      resultadoE,
      resultadoF,
    );

  const diferencia =
    calcularDiferenciaFoil(
      totalRecibidaD,
      resultadoE,
      resultadoF,
    );

  const porcentajeDiferencia =
    calcularPorcentajeDiferencia(
      totalRecibidaD,
      diferencia,
    );

  const faltanValores = [
    totalRecibidaD,
    resultadoE,
    resultadoF,
    totalUtilizadaH,
    diferencia,
  ].some(
    (value) =>
      value === null ||
      value === undefined,
  );

  const { estado: estadoMaterial } =
    evaluarEstadoMaterial({
      tipoMaterial: "FOIL PVC",
      d: totalRecibidaD,
      diferencia,
      porcentaje:
        porcentajeDiferencia,
      faltanValores,
    });

  return {
    totalRecibidaD,
    resultadoE,
    resultadoF,
    resultadoG,
    totalUtilizadaH,
    diferencia,
    porcentajeDiferencia,
    limitePermitido: 7,
    estadoMaterial,
  };
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

function MatrixNumberInput({
  value,
  onChange,
  unit,
  disabled = false,
}) {
  return (
    <div className="matrix-input-wrapper">
      <input
        className="matrix-input"
        type="number"
        min="0"
        step={unit === "kg" ? "0.001" : "1"}
        value={value ?? ""}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
      />

      {unit && <small>{unit}</small>}
    </div>
  );
}

export default function MaterialsCaptureMatrix({
  materials = [],
  numeroOrden,
  onMaterialCreated,
  onMaterialUpdated,
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

const [savingMaterialIds, setSavingMaterialIds,] = useState({});

const [ materialMessages,setMaterialMessages,] = useState({});

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

    async function saveFoilPvc(material) {
        const draft = drafts[material.id];

        if (!draft) {
            return;
        }

        const payload = {
            cantidadSurtidaA:
            parseOptionalNumber(
                draft.cantidadSurtidaA,
            ),

            cantidadAdicionalB:
            parseOptionalNumber(
                draft.cantidadAdicionalB,
            ),

            cantidadDevueltaC:
            parseOptionalNumber(
                draft.cantidadDevueltaC,
            ),

            resultadoE:
            parseOptionalNumber(
                draft.resultadoE,
            ),

            resultadoF:
            parseOptionalNumber(
                draft.resultadoF,
            ),
        };

        setSavingMaterialIds((current) => ({
            ...current,
            [material.id]: true,
        }));

        setMaterialMessages((current) => ({
            ...current,
            [material.id]: "",
        }));

        try {
            const updatedMaterial =
            await actualizarMaterial(
                material.id,
                payload,
            );

            setDrafts((currentDrafts) => ({
            ...currentDrafts,
            [material.id]:
                createMaterialDraft(
                updatedMaterial,
                ),
            }));

            onMaterialUpdated?.(
            updatedMaterial,
            );

            setMaterialMessages((current) => ({
            ...current,
            [material.id]:
                "Guardado correctamente.",
            }));
        } catch (saveError) {
            setMaterialMessages((current) => ({
            ...current,
            [material.id]:
                saveError instanceof Error
                ? saveError.message
                : "No fue posible guardar.",
            }));
        } finally {
            setSavingMaterialIds(
            (current) => ({
                ...current,
                [material.id]: false,
            }),
            );
        }
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

                    {materials.map((material) => {
                        const isFoilPvc =
                        material.descripcion === "FOIL PVC";

                        const draft = drafts[material.id];

                        return (
                        <td key={material.id}>
                            {isFoilPvc ? (
                            <MatrixNumberInput
                                value={
                                draft?.cantidadSurtidaA ?? ""
                                }
                                unit="kg"
                                onChange={(value) =>
                                updateDraft(
                                    material.id,
                                    "cantidadSurtidaA",
                                    value,
                                )
                                }
                            />
                            ) : (
                            formatQuantity(
                                material.cantidadSurtidaA,
                                material.unidadMedida,
                            )
                            )}
                        </td>
                        );
                    })}
                    </tr>
              <tr>
                <th className="matrix-concept-column">
                    B. Cantidad adicional
                </th>

                {materials.map((material) => {
                    const isFoilPvc =
                    material.descripcion === "FOIL PVC";

                    const draft = drafts[material.id];

                    return (
                    <td key={material.id}>
                        {isFoilPvc ? (
                        <MatrixNumberInput
                            value={
                            draft?.cantidadAdicionalB ?? ""
                            }
                            unit="kg"
                            onChange={(value) =>
                            updateDraft(
                                material.id,
                                "cantidadAdicionalB",
                                value,
                            )
                            }
                        />
                        ) : material.descripcion ===
                        "TABLETA" ? (
                        "0"
                        ) : (
                        formatQuantity(
                            material.cantidadAdicionalB,
                            material.unidadMedida,
                        )
                        )}
                    </td>
                    );
                })}
                </tr>

              <tr>
                <th className="matrix-concept-column">
                    C. Cantidad devuelta
                </th>

                {materials.map((material) => {
                    const isFoilPvc =
                    material.descripcion === "FOIL PVC";

                    const draft = drafts[material.id];

                    return (
                    <td key={material.id}>
                        {isFoilPvc ? (
                        <MatrixNumberInput
                            value={
                            draft?.cantidadDevueltaC ?? ""
                            }
                            unit="kg"
                            onChange={(value) =>
                            updateDraft(
                                material.id,
                                "cantidadDevueltaC",
                                value,
                            )
                            }
                        />
                        ) : material.descripcion ===
                        "TABLETA" ? (
                        "0"
                        ) : (
                        formatQuantity(
                            material.cantidadDevueltaC,
                            material.unidadMedida,
                        )
                        )}
                    </td>
                    );
                })}
                </tr>

              <tr>
                <th className="matrix-concept-column">
                    D. Total recibido
                </th>

                {materials.map((material) => {
                    const isFoilPvc =
                    material.descripcion === "FOIL PVC";

                    const preview = isFoilPvc
                    ? calculateFoilPvcPreview(
                        drafts[material.id],
                        )
                    : null;

                    const value = isFoilPvc
                    ? preview.totalRecibidaD
                    : material.totalRecibidaD;

                    return (
                    <td
                        key={material.id}
                        className="matrix-calculated-cell"
                    >
                        {formatQuantity(
                        value,
                        material.unidadMedida,
                        )}
                    </td>
                    );
                })}
                </tr>
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}