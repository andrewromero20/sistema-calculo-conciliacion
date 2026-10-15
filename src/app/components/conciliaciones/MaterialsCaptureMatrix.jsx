"use client";

    import {
    calcularDiferenciaFoil,
    calcularEFoil,
    calcularFFoil,
    calcularPorcentajeDiferencia,
    calcularTotalFoil,
    calcularTotalRecibido,
    evaluarEstadoMaterial,
    calcularDiferenciaAH,
    calcularEInstructivo,
    calcularFInstructivo,
    calcularGInstructivo,
    calcularTotalUtilizadoAH,
    calcularESelloGarantia,
    calcularFSelloGarantia,
    calcularGSelloGarantia,
} from "../../../lib/calculosMateriales";

import {
  useMemo,
  useState,
} from "react";
import { actualizarMaterial,crearMaterial } from "../../../services/materialesService";
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

function calculateFoilPreview(material, draft) {
  if (!draft) {
    return {
      totalRecibidaD: null,
      resultadoE: null,
      resultadoF: null,
      resultadoG: null,
      totalUtilizadaH: null,
      diferencia: null,
      porcentajeDiferencia: null,
      limitePermitido:
        material.descripcion === "FOIL PVC"
          ? 7
          : 2,
      estadoMaterial: "CAPTURA_INCOMPLETA",
    };
  }

  const totalRecibidaD =
    calcularTotalRecibido(
      parseOptionalNumber(
        draft.cantidadSurtidaA,
      ),
      parseOptionalNumber(
        draft.cantidadAdicionalB,
      ),
      parseOptionalNumber(
        draft.cantidadDevueltaC,
      ),
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
    material.descripcion === "FOIL PVC"
      ? calcularPorcentajeDiferencia(
          totalRecibidaD,
          diferencia,
        )
      : null;

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
      tipoMaterial: material.descripcion,
      d: totalRecibidaD,
      diferencia,
      porcentaje: porcentajeDiferencia,
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
    limitePermitido:
      material.descripcion === "FOIL PVC"
        ? 7
        : 2,
    estadoMaterial,
  };
}

function calculateInstructivoPreview(draft) {
  if (!draft) {
    return {
      totalRecibidaD: null,
      resultadoE: null,
      resultadoF: null,
      resultadoG: null,
      totalUtilizadaH: null,
      diferencia: null,
      porcentajeDiferencia: null,
      limitePermitido: 1,
      estadoMaterial:
        "CAPTURA_INCOMPLETA",
    };
  }

  const totalRecibidaD =
    calcularTotalRecibido(
      parseOptionalNumber(
        draft.cantidadSurtidaA,
      ),
      parseOptionalNumber(
        draft.cantidadAdicionalB,
      ),
      parseOptionalNumber(
        draft.cantidadDevueltaC,
      ),
    );

  const resultadoE =
    calcularEInstructivo(
      parseOptionalNumber(
        draft.resultadoE,
      ),
    );

  const resultadoF =
    calcularFInstructivo(
      parseOptionalNumber(
        draft.resultadoF,
      ),
    );

  const resultadoG =
    calcularGInstructivo(
      parseOptionalNumber(
        draft.resultadoG,
      ),
    );

  const totalUtilizadaH =
    calcularTotalUtilizadoAH(
      resultadoE,
      resultadoF,
      resultadoG,
    );

  const diferencia =
    calcularDiferenciaAH(
      totalRecibidaD,
      totalUtilizadaH,
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
    resultadoG,
    totalUtilizadaH,
    diferencia,
  ].some(
    (value) =>
      value === null ||
      value === undefined,
  );

  const { estado: estadoMaterial } =
    evaluarEstadoMaterial({
      tipoMaterial: "INSTRUCTIVO",
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
    limitePermitido: 1,
    estadoMaterial,
  };
}

function calculateMaterialPreview(
  material,
  draft,
) {
  if (
    material.descripcion === "FOIL PVC" ||
    material.descripcion === "FOIL ALUMINIO"
  ) {
    return calculateFoilPreview(
      material,
      draft,
    );
  }

  if (
    material.descripcion === "INSTRUCTIVO"
  ) {
    return calculateInstructivoPreview(
      draft,
    );
  }

  if (
    material.descripcion ===
    "SELLO GARANTÍA"
  ) {
    return calculateSelloGarantiaPreview(
      draft,
    );
  }

  return null;
}

function calculateSelloGarantiaPreview(draft) {
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

  const totalRecibidaD =
    calcularTotalRecibido(
      parseOptionalNumber(
        draft.cantidadSurtidaA,
      ),
      parseOptionalNumber(
        draft.cantidadAdicionalB,
      ),
      parseOptionalNumber(
        draft.cantidadDevueltaC,
      ),
    );

  const resultadoE =
    calcularESelloGarantia(
      parseOptionalNumber(
        draft.resultadoE,
      ),
    );

  const resultadoF =
    calcularFSelloGarantia(
      parseOptionalNumber(
        draft.resultadoF,
      ),
    );

  const resultadoG =
    calcularGSelloGarantia(
      parseOptionalNumber(
        draft.resultadoG,
      ),
    );

  const totalUtilizadaH =
    calcularTotalUtilizadoAH(
      resultadoE,
      resultadoF,
      resultadoG,
    );

  const diferencia =
    calcularDiferenciaAH(
      totalRecibidaD,
      totalUtilizadaH,
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
    resultadoG,
    totalUtilizadaH,
    diferencia,
  ].some(
    (value) =>
      value === null ||
      value === undefined,
  );

  const { estado: estadoMaterial } =
    evaluarEstadoMaterial({
      tipoMaterial: "SELLO GARANTÍA",
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

function formatMaterialLimit(material) {
  switch (material.descripcion) {
    case "TABLETA":
    case "FOIL PVC":
    case "SELLO GARANTÍA":
      return "± 7.00 %";

    case "CAJA PLEGADIZA":
    case "INSTRUCTIVO":
      return "± 1.00 %";

    case "ETIQUETA COLECTIVA":
    case "CAJA EMPAQUE":
      return "± 10 PZA";

    case "FOIL ALUMINIO":
      return "± 2.000 kg";

    default:
      return "Pendiente";
  }
}

function buildDirectMbrPayload(
  draft,
  includeG = true,
) {
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

  if (includeG) {
    payload.resultadoG =
      parseOptionalNumber(
        draft.resultadoG,
      );
  }

  return payload;
}

export default function MaterialsCaptureMatrix({
  materials = [],
  numeroOrden,
  conciliacionId,
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
          conciliacionId,
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

    async function saveMatrixMaterial(material) {
        const draft = drafts[material.id];
        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";

        if (!draft) {
            setError(
            "No se encontraron los datos del material.",
            );
            return;
        }

        const isFoil = [
            "FOIL PVC",
            "FOIL ALUMINIO",
        ].includes(material.descripcion);

        const isInstructivo =
            material.descripcion === "INSTRUCTIVO";

        if (!isFoil && !isInstructivo && !isSelloGarantia) {
            return;
        }

        

        const payload = isFoil
            ? buildDirectMbrPayload(
                draft,
                false,
            )
            : buildDirectMbrPayload(
                draft,
                true,
            );

        setSavingMaterialIds((current) => ({
            ...current,
            [material.id]: true,
        }));

        setMaterialMessages((current) => ({
            ...current,
            [material.id]: "",
        }));

        setError("");

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
            setSavingMaterialIds((current) => ({
            ...current,
            [material.id]: false,
            }));
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
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                        const isInstructivo = material.descripcion === "INSTRUCTIVO";
                        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";

                        const isDirectInput = isFoil || isInstructivo || isSelloGarantia;

                        

                        const draft = drafts[material.id];

                        return (
                        <td key={material.id}>
                            {isDirectInput ? (
                            <MatrixNumberInput
                                value={
                                draft?.cantidadSurtidaA ?? ""
                                }
                                unit={isFoil ? "kg" : "PZA"}
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
                    const isFoil =
                    material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                    const isInstructivo = material.descripcion === "INSTRUCTIVO";
                    const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";

                    const isDirectInput = isFoil || isInstructivo || isSelloGarantia;
                    

                    const draft = drafts[material.id];


                    return (
                    <td key={material.id}>
                        {isDirectInput ? (
                        <MatrixNumberInput
                            value={
                            draft?.cantidadAdicionalB ?? ""
                            }
                            unit={isFoil ? "kg" : "PZA"}
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
                    const isFoil =
                    material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                    const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";
                    const isInstructivo = material.descripcion === "INSTRUCTIVO";
                    

                    const isDirectInput =isFoil || isInstructivo || isSelloGarantia;

                    const draft = drafts[material.id];

                    return (
                    <td key={material.id}>
                        {isDirectInput ? (
                        <MatrixNumberInput
                            value={
                            draft?.cantidadDevueltaC ?? ""
                            }
                            unit={isFoil ? "kg" : "PZA"}
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
                    const isFoil =
                    material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";

                    const preview =calculateMaterialPreview(material,drafts[material.id],);

                    const value = preview
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
                <tr className="matrix-group-row">
                    <td colSpan={materials.length + 1}>
                        Cantidad utilizada
                    </td>
                </tr>   
                <tr>
                    <th className="matrix-concept-column">
                        E. Cantidad utilizada
                    </th>

                    {materials.map((material) => {
                        const isFoil = material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";

                        const isInstructivo = material.descripcion === "INSTRUCTIVO";

                        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";

                        const isManualE =
                          isFoil ||
                          isInstructivo ||
                          isSelloGarantia;

                        const draft = drafts[material.id];

                        return (
                        <td key={material.id}>
                            {isManualE ? (
                            <MatrixNumberInput
                                value={draft?.resultadoE ?? ""}
                                unit={isFoil ? "kg" : "PZA"}
                                onChange={(value) =>
                                updateDraft(
                                    material.id,
                                    "resultadoE",
                                    value,
                                )
                                }
                            />
                            ) : (
                            formatQuantity(
                                material.resultadoE,
                                material.unidadMedida,
                            )
                            )}
                        </td>
                        );
                    })}
                </tr>
                <tr>
                    <th className="matrix-concept-column">
                        F. Merma/ Cantidad utilizada
                    </th>

                    {materials.map((material) => {
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                        const isInstructivo = material.descripcion === "INSTRUCTIVO";

                        const draft = drafts[material.id];
                        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";

                        const isManualF =
                          isFoil ||
                          isInstructivo ||
                          isSelloGarantia;

                        return (
                        <td key={material.id}>
                            {isManualF ? (
                            <MatrixNumberInput
                                value={draft?.resultadoF ?? ""}
                                unit={isFoil ? "kg" : "PZA"}
                                onChange={(value) =>
                                updateDraft(
                                    material.id,
                                    "resultadoF",
                                    value,
                                )
                                }
                            />
                            ) : (
                            formatQuantity(
                                material.resultadoF,
                                material.unidadMedida,
                            )
                            )}
                        </td>
                        );
                    })}
                </tr>
                <tr>
                  <th className="matrix-concept-column">
                    G. Muestras
                  </th>

                  {materials.map((material) => {
                    const isFoil = [
                      "FOIL PVC",
                      "FOIL ALUMINIO",
                    ].includes(material.descripcion);

                    const isInstructivo =
                      material.descripcion ===
                      "INSTRUCTIVO";

                    const isSelloGarantia =
                      material.descripcion ===
                      "SELLO GARANTÍA";

                    const isManualG =
                      isInstructivo ||
                      isSelloGarantia;

                    const draft = drafts[material.id];

                    return (
                      <td
                        key={material.id}
                        className={
                          isFoil
                            ? "matrix-calculated-cell"
                            : undefined
                        }
                      >
                        {isFoil ? (
                          "No aplica"
                        ) : isManualG ? (
                          <MatrixNumberInput
                            value={
                              draft?.resultadoG ?? ""
                            }
                            unit={material.unidadMedida}
                            onChange={(value) =>
                              updateDraft(
                                material.id,
                                "resultadoG",
                                value,
                              )
                            }
                          />
                        ) : (
                          formatQuantity(
                            material.resultadoG,
                            material.unidadMedida,
                          )
                        )}
                      </td>
                    );
                  })}
                </tr>
                
                <tr>
                    <th className="matrix-concept-column">
                        H. Total utilizado
                    </th>

                    {materials.map((material) => {
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";

                        const preview = calculateMaterialPreview(material,drafts[material.id],);

                        const value = preview? preview.totalUtilizadaH: material.totalUtilizadaH;

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
                <tr className="matrix-group-row">
                    <td colSpan={materials.length + 1}>
                        Evaluación final
                    </td>
                </tr>
                <tr>
                    <th className="matrix-concept-column">
                        Diferencia
                    </th>

                    {materials.map((material) => {
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";

                        const preview =
                        calculateMaterialPreview(
                            material,
                            drafts[material.id],
                        );

                        const value = preview
                        ? preview.diferencia
                        : material.diferencia;

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
                <tr>
                    <th className="matrix-concept-column">
                        Porcentaje de diferencia
                    </th>

                    {materials.map((material) => {
                        const isFoilAluminio =
                            material.descripcion ===
                            "FOIL ALUMINIO";

                        if (isFoilAluminio) {
                            return (
                            <td
                                key={material.id}
                                className="matrix-calculated-cell"
                            >
                                No aplica
                            </td>
                            );
                        }

                        const preview =
                            calculateMaterialPreview(
                            material,
                            drafts[material.id],
                            );

                        const porcentaje = preview
                            ? preview.porcentajeDiferencia
                            : material.porcentajeDiferencia;

                        const totalRecibido = preview
                            ? preview.totalRecibidaD
                            : material.totalRecibidaD;

                        return (
                            <td
                            key={material.id}
                            className="matrix-calculated-cell"
                            >
                            {formatPercentage(
                                porcentaje,
                                totalRecibido,
                            )}
                            </td>
                        );
                    })}
                </tr>

                <tr>
                    <th className="matrix-concept-column">
                        Límite permitido
                    </th>

                    {materials.map((material) => (
                        <td
                        key={material.id}
                        className="matrix-calculated-cell"
                        >
                        {formatMaterialLimit(material)}
                        </td>
                    ))}
                </tr>
                <tr>
                    <th className="matrix-concept-column">
                        Estado
                    </th>

                    {materials.map((material) => {
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";

                        const preview =
                            calculateMaterialPreview(
                                material,
                                drafts[material.id],
                        );

                            const status = preview
                            ? preview.estadoMaterial
                            : material.estadoMaterial;

                        return (
                        <td key={material.id}>
                            <span
                            className={`status-badge material-status-${String(
                                status ?? "PENDIENTE",
                            )
                                .toLowerCase()
                                .replaceAll("_", "-")}`}
                            >
                            {formatMaterialStatus(status)}
                            </span>
                        </td>
                        );
                    })}
                </tr>

                <tr className="matrix-actions-row">
                    <th className="matrix-concept-column">
                        Acciones
                    </th>

                    {materials.map((material) => {
                        const isSupportedMaterial = [
                            "FOIL PVC",
                            "FOIL ALUMINIO",
                            "INSTRUCTIVO",
                            "SELLO GARANTÍA",
                        ].includes(material.descripcion);

                        const isSaving = Boolean(
                        savingMaterialIds[material.id],
                        );

                        const message =
                        materialMessages[material.id];

                        return (
                        <td key={material.id}>
                            {isSupportedMaterial ? (
                            <div className="matrix-save-area">
                                <button
                                type="button"
                                className="button primary matrix-save-button"
                                disabled={isSaving}
                                onClick={() =>
                                    saveMatrixMaterial(material)
                                }
                                >
                                {isSaving
                                    ? "Guardando..."
                                    : "Guardar"}
                                </button>

                                {message && (
                                <small
                                    className={
                                    message ===
                                    "Guardado correctamente."
                                        ? "matrix-save-message success"
                                        : "matrix-save-message error"
                                    }
                                >
                                    {message}
                                </small>
                                )}
                            </div>
                            ) : (
                            <span className="matrix-pending-support">
                                Próximamente
                            </span>
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