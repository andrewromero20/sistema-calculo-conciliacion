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
    calcularECajaPlegadiza,
    calcularFCajaPlegadiza,
    calcularGCajaPlegadiza,
    calcularEEtiquetaColectiva,
    calcularFEtiquetaColectiva,
    calcularGEtiquetaColectiva,
    calcularECajaEmpaque,
    calcularFCajaEmpaque,
    calcularGCajaEmpaque,
    calcularETableta,
    calcularFTableta,
    calcularGTableta,
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

  const resultadoG = parseOptionalNumber(draft.resultadoG);

  const totalUtilizadaH =
    calcularTotalFoil(
      resultadoE,
      resultadoF,
      resultadoG, 
    );

  const diferencia =
    calcularDiferenciaAH(
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

  if (
    material.descripcion ===
    "CAJA PLEGADIZA"
  ) {
    return calculateCajaPlegadizaPreview(
      draft,
    );
  }

  if (
    material.descripcion ===
    "ETIQUETA COLECTIVA"
  ) {
    return calculateEtiquetaColectivaPreview(
      draft,
    );
  }

  if (
    material.descripcion ===
    "CAJA EMPAQUE"
  ) {
    return calculateCajaEmpaquePreview(
      draft,
    );
  }

  if (
    material.descripcion === "TABLETA"
  ) {
    return calculateTabletaPreview(draft);
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

function calculateCajaPlegadizaPreview(
  draft,
) {
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
    calcularECajaPlegadiza(
      parseOptionalNumber(
        draft.cantidadRealAcondicionada,
      ),
    );

  const resultadoF =
    calcularFCajaPlegadiza(
      parseOptionalNumber(
        draft.otraMerma,
      ),
    );

  const resultadoG =
  calcularGCajaPlegadiza(
    parseOptionalNumber(
      draft.cajasTomadasMuestra,
    ),
    parseOptionalNumber(
      draft.cajasUtilizadasArranque,
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
      tipoMaterial: "CAJA PLEGADIZA",
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

function calculateEtiquetaColectivaPreview(
  draft,
) {
  if (!draft) {
    return {
      totalRecibidaD: null,
      resultadoE: null,
      resultadoF: null,
      resultadoG: null,
      totalUtilizadaH: null,
      diferencia: null,
      porcentajeDiferencia: null,
      limitePermitido: 10,
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
    parseOptionalNumber(
      draft.resultadoE,
    );

  const resultadoF =
    calcularFEtiquetaColectiva(
      parseOptionalNumber(
        draft.otraMerma,
      ),
    );

  const resultadoG =
    calcularGEtiquetaColectiva(
      parseOptionalNumber(
        draft.cajasTomadasMuestra,
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
      tipoMaterial:
        "ETIQUETA COLECTIVA",
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
    limitePermitido: 10,
    estadoMaterial,
  };
}

function calculateCajaEmpaquePreview(
  draft,
) {
  if (!draft) {
    return {
      totalRecibidaD: null,
      resultadoE: null,
      resultadoF: null,
      resultadoG: null,
      totalUtilizadaH: null,
      diferencia: null,
      porcentajeDiferencia: null,
      limitePermitido: 10,
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
    parseOptionalNumber(
      draft.resultadoE,
    );

  const resultadoF =
    calcularFCajaEmpaque(
      parseOptionalNumber(
        draft.otraMerma,
      ),
    );

  const resultadoG =
    calcularGCajaEmpaque(
      parseOptionalNumber(
        draft.cajasTomadasMuestra,
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
      tipoMaterial: "CAJA EMPAQUE",
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
    limitePermitido: 10,
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

function MatrixInputGroup({
  children,
  resultLabel,
  resultValue,
}) {
  return (
    <div className="matrix-input-group">
      {children}

      <div className="matrix-inline-result">
        <small>{resultLabel}</small>
        <strong>{resultValue}</strong>
      </div>
    </div>
  );
}

function buildCajaPlegadizaPayload(
  draft,
) {
  return {
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

    cantidadRealAcondicionada:
      parseOptionalNumber(
        draft.cantidadRealAcondicionada,
      ),

    otraMerma:
      parseOptionalNumber(
        draft.otraMerma,
      ),

    cajasTomadasMuestra:
      parseOptionalNumber(
        draft.cajasTomadasMuestra,
      ),

    cajasUtilizadasArranque:
      parseOptionalNumber(
        draft.cajasUtilizadasArranque,
      ),
  };
}

function buildEtiquetaColectivaPayload(
  draft,
) {
  return {
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

    otraMerma:
      parseOptionalNumber(
        draft.otraMerma,
      ),

    cajasTomadasMuestra:
      parseOptionalNumber(
        draft.cajasTomadasMuestra,
      ),
  };
}

function buildCajaEmpaquePayload(
  draft,
) {
  return {
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

    otraMerma:
      parseOptionalNumber(
        draft.otraMerma,
      ),

    cajasTomadasMuestra:
      parseOptionalNumber(
        draft.cajasTomadasMuestra,
      ),
  };
}

function calculateTabletaPreview(draft) {
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

  const cantidadAdicionalB = 0;
  const cantidadDevueltaC = 0;

  const cantidadRealAcondicionada =
    parseOptionalNumber(
      draft.cantidadRealAcondicionada,
    );

  const tabletasPorBlister =
    parseOptionalNumber(
      draft.tabletasPorBlister,
    );

  const telecamara =
    parseOptionalNumber(
      draft.telecamara,
    );

  const hermeticidad =
    parseOptionalNumber(
      draft.hermeticidad,
    );

  const otraMerma =
    parseOptionalNumber(
      draft.otraMerma,
    );

  const cajasTomadasMuestra =
    parseOptionalNumber(
      draft.cajasTomadasMuestra,
    );

  const totalRecibidaD =
    calcularTotalRecibido(
      cantidadSurtidaA,
      cantidadAdicionalB,
      cantidadDevueltaC,
    );

  const resultadoE =
    calcularETableta(
      cantidadRealAcondicionada,
      tabletasPorBlister,
    );

  const resultadoF =
    calcularFTableta({
      telecamara,
      hermeticidad,
      otraMerma,
      tabletasPorBlister,
    });

  const resultadoG =
    calcularGTableta(
      cajasTomadasMuestra,
      tabletasPorBlister,
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
      tipoMaterial: "TABLETA",
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

function buildTabletaPayload(draft) {
  return {
    cantidadSurtidaA:
      parseOptionalNumber(
        draft.cantidadSurtidaA,
      ),

    cantidadAdicionalB: 0,
    cantidadDevueltaC: 0,

    cantidadRealAcondicionada:
      parseOptionalNumber(
        draft.cantidadRealAcondicionada,
      ),

    tabletasPorBlister:
      parseOptionalNumber(
        draft.tabletasPorBlister,
      ),

    telecamara:
      parseOptionalNumber(
        draft.telecamara,
      ),

    hermeticidad:
      parseOptionalNumber(
        draft.hermeticidad,
      ),

    otraMerma:
      parseOptionalNumber(
        draft.otraMerma,
      ),

    cajasTomadasMuestra:
      parseOptionalNumber(
        draft.cajasTomadasMuestra,
      ),
  };
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
        const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
        const isInstructivo = material.descripcion === "INSTRUCTIVO";
        const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
        const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";
        const isTableta = material.descripcion === "TABLETA";

        const isFoil = [
            "FOIL PVC",
            "FOIL ALUMINIO",
        ].includes(material.descripcion);
    

        if (!draft) {
            setError(
            "No se encontraron los datos del material.",
            );
            return;
        }

        

        
        if (!isFoil && !isInstructivo && !isSelloGarantia && !isCajaPlegadiza && !isEtiquetaColectiva && !isCajaEmpaque && !isTableta) {
            return;
        }

        

        let payload;


        if (isTableta) {
          payload = buildTabletaPayload(draft);
        } else if (isCajaPlegadiza) {
          payload =
            buildCajaPlegadizaPayload(draft);
        } else if (isEtiquetaColectiva) {
          payload =
            buildEtiquetaColectivaPayload(
              draft,
            );
        } else if (isCajaEmpaque) {
          payload = buildCajaEmpaquePayload(draft);
        } else {
          payload =
            buildDirectMbrPayload(
              draft,
              true,
            );
        }

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
                  Descripcion
                </th>

                {materials.map((material) => (
                  <th
                    key={material.id}
                    className="matrix-material-column"
                  >
                    <strong>
                      {material.descripcion === "TABLETA"
                        ? "TABLETA (TAB)"
                        : material.descripcion}
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
                         (A) Cantidad Surtida Verificada
                    </th>

                    {materials.map((material) => {
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                        const isInstructivo = material.descripcion === "INSTRUCTIVO";
                        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";
                        const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
                        const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
                        const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";
                        const isTableta = material.descripcion === "TABLETA";

                        const isDirectInput = isFoil || isInstructivo || isSelloGarantia || isCajaPlegadiza || isEtiquetaColectiva || isCajaEmpaque || isTableta;

                        const draft = drafts[material.id];

                        return (
                        <td key={material.id}>
                            {isDirectInput ? (
                            <MatrixNumberInput
                                value={
                                draft?.cantidadSurtidaA ?? ""
                                }
                                unit={material.unidadMedida}
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
                    (B) Cantidad Surtida Adicional
                </th>

                {materials.map((material) => {
                    const isFoil =
                    material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                    const isInstructivo = material.descripcion === "INSTRUCTIVO";
                    const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";
                    const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
                    const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
                    const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";

                    const isDirectInput = isFoil || isInstructivo || isSelloGarantia || isCajaPlegadiza || isEtiquetaColectiva || isCajaEmpaque;

                    const draft = drafts[material.id];


                    return (
                    <td key={material.id}>
                        {isDirectInput ? (
                        <MatrixNumberInput
                            value={
                            draft?.cantidadAdicionalB ?? ""
                            }
                            unit={material.unidadMedida}
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
                    (C) Cantidad Devuelta al Almacen
                </th>

                {materials.map((material) => {
                    const isFoil =
                    material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                    const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";
                    const isInstructivo = material.descripcion === "INSTRUCTIVO";
                    const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
                    const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
                    const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";

                    const isDirectInput =isFoil || isInstructivo || isSelloGarantia || isCajaPlegadiza || isEtiquetaColectiva || isCajaEmpaque;

                    const draft = drafts[material.id];

                    return (
                    <td key={material.id}>
                        {isDirectInput ? (
                        <MatrixNumberInput
                            value={
                            draft?.cantidadDevueltaC ?? ""
                            }
                            unit={material.unidadMedida}
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
                    (D) Total total Surtida
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
                        (E) Cantidad utilizada
                    </th>

                    {materials.map((material) => {
                        const isFoil = material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";

                        const isInstructivo = material.descripcion === "INSTRUCTIVO";

                        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";
                        const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
                        const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
                        const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";
                        const isTableta = material.descripcion === "TABLETA";

                        const usesManualCalculation = isEtiquetaColectiva || isCajaEmpaque;

                        const isManualE =
                          isFoil ||
                          isInstructivo ||
                          isSelloGarantia;

                        const draft = drafts[material.id];
                        const preview = calculateMaterialPreview(material,draft,);


                        return (
                        <td key={material.id}>
                          {isTableta ? (
                            <MatrixInputGroup
                              resultLabel="Resultado E "
                              resultValue={formatQuantity(
                                preview?.resultadoE,
                                material.unidadMedida,
                              )}
                            >
                              <span className="matrix-input-label">
                                Cantidad real acondicionada
                              </span>

                              <MatrixNumberInput
                                value={
                                  draft?.cantidadRealAcondicionada ??
                                  ""
                                }
                                unit="CAJAS"
                                onChange={(value) =>
                                  updateDraft(
                                    material.id,
                                    "cantidadRealAcondicionada",
                                    value,
                                  )
                                }
                              />

                              <span className="matrix-input-label">
                                Tabletas por blíster
                              </span>

                              <MatrixNumberInput
                                value={
                                  draft?.tabletasPorBlister ?? ""
                                }
                                unit="PZA"
                                onChange={(value) =>
                                  updateDraft(
                                    material.id,
                                    "tabletasPorBlister",
                                    value,
                                  )
                                }
                              />
                            </MatrixInputGroup>
                          ) : isCajaPlegadiza ? (
                            <MatrixInputGroup
                              resultLabel="Resultado E "
                              resultValue={formatQuantity(
                                preview?.resultadoE,
                                material.unidadMedida,
                              )}
                            >
                              <span className="matrix-input-label">
                                Cantidad real acondicionada
                              </span>

                              <MatrixNumberInput
                                value={
                                  draft?.cantidadRealAcondicionada ??
                                  ""
                                }
                                unit={material.unidadMedida}
                                onChange={(value) =>
                                  updateDraft(
                                    material.id,
                                    "cantidadRealAcondicionada",
                                    value,
                                  )
                                }
                              />
                            </MatrixInputGroup>
                          ) : usesManualCalculation ? (
                            <MatrixNumberInput
                              value={draft?.resultadoE ?? ""}
                              unit={material.unidadMedida}
                              onChange={(value) =>
                                updateDraft(
                                  material.id,
                                  "resultadoE",
                                  value,
                                )
                              }
                            />
                          ) : isManualE ? (
                            <MatrixNumberInput
                              value={draft?.resultadoE ?? ""}
                              unit={material.unidadMedida}
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
                        (F) Cantidad de merma
                    </th>

                    {materials.map((material) => {
                        const isFoil =
                        material.descripcion === "FOIL PVC" || material.descripcion === "FOIL ALUMINIO";
                        const isInstructivo = material.descripcion === "INSTRUCTIVO";

                        const draft = drafts[material.id];
                        const isSelloGarantia = material.descripcion === "SELLO GARANTÍA";
                        const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
                        const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
                        const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";
                        const isTableta = material.descripcion === "TABLETA";
                        const usesCalculatedMerma =
                        isCajaPlegadiza ||
                        isEtiquetaColectiva ||
                        isCajaEmpaque;
                        const preview =calculateMaterialPreview(material,draft,);
                        const isManualF =
                          isFoil ||
                          isInstructivo ||
                          isSelloGarantia;

                        return (
                        <td key={material.id}>
                            {isTableta ? (
                              <MatrixInputGroup
                                resultLabel="Resultado F "
                                resultValue={formatQuantity(
                                  preview?.resultadoF,
                                  material.unidadMedida,
                                )}
                              >
                                <span className="matrix-input-label">
                                  Telecámara
                                </span>

                                <MatrixNumberInput
                                  value={draft?.telecamara ?? ""}
                                  unit="BLÍSTER"
                                  onChange={(value) =>
                                    updateDraft(
                                      material.id,
                                      "telecamara",
                                      value,
                                    )
                                  }
                                />

                                <span className="matrix-input-label">
                                  Hermeticidad
                                </span>

                                <MatrixNumberInput
                                  value={draft?.hermeticidad ?? ""}
                                  unit="BLÍSTER"
                                  onChange={(value) =>
                                    updateDraft(
                                      material.id,
                                      "hermeticidad",
                                      value,
                                    )
                                  }
                                />

                                <span className="matrix-input-label">
                                  Otra merma
                                </span>

                                <MatrixNumberInput
                                  value={draft?.otraMerma ?? ""}
                                  unit="PZA"
                                  onChange={(value) =>
                                    updateDraft(
                                      material.id,
                                      "otraMerma",
                                      value,
                                    )
                                  }
                                />
                              </MatrixInputGroup>
                            ) : usesCalculatedMerma ? (
                              <MatrixInputGroup
                                resultLabel="Resultado F "
                                resultValue={formatQuantity(
                                  preview?.resultadoF,
                                  material.unidadMedida,
                                )}
                              >
                                <span className="matrix-input-label">
                                  Merma registrada
                                </span>

                                <MatrixNumberInput
                                  value={draft?.otraMerma ?? ""}
                                  unit={material.unidadMedida}
                                  onChange={(value) =>
                                    updateDraft(
                                      material.id,
                                      "otraMerma",
                                      value,
                                    )
                                  }
                                />
                              </MatrixInputGroup>
                            ) : isManualF ? (
                              <MatrixNumberInput
                                value={draft?.resultadoF ?? ""}
                                unit={material.unidadMedida}
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
                    (G) Cantidad total de muestra
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
                      
                    const isCajaPlegadiza = material.descripcion === "CAJA PLEGADIZA";
                    const isEtiquetaColectiva = material.descripcion === "ETIQUETA COLECTIVA";
                    const isCajaEmpaque = material.descripcion === "CAJA EMPAQUE";
                    const isTableta = material.descripcion === "TABLETA";
                    const usesSingleSampleInput = isEtiquetaColectiva ||isCajaEmpaque;
                    const draft = drafts[material.id];
                    const preview = calculateMaterialPreview( material,draft,);  
                    const isManualG = isInstructivo || isSelloGarantia;

                    

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
                          <MatrixInputGroup
                            resultLabel="Resultado G "
                            resultValue={formatQuantity(
                              preview?.resultadoG,
                              material.unidadMedida,
                            )}
                          >
                            <span className="matrix-input-label">
                              Cantidad total de muestra
                            </span>

                            <MatrixNumberInput
                              value={draft?.resultadoG ?? ""}
                              unit={material.unidadMedida}
                              onChange={(value) =>
                                updateDraft(
                                  material.id,
                                  "resultadoG",
                                  value,
                                )
                              }
                            />
                          </MatrixInputGroup>
                        ) : isTableta ? (
                          <MatrixInputGroup
                            resultLabel="Resultado G "
                            resultValue={formatQuantity(
                              preview?.resultadoG,
                              material.unidadMedida,
                            )}
                          >
                            <span className="matrix-input-label">
                              Cajas tomadas como muestra
                            </span>

                            <MatrixNumberInput
                              value={
                                draft?.cajasTomadasMuestra ?? ""
                              }
                              unit="CAJAS"
                              onChange={(value) =>
                                updateDraft(
                                  material.id,
                                  "cajasTomadasMuestra",
                                  value,
                                )
                              }
                            />
                          </MatrixInputGroup>
                        ) : isCajaPlegadiza ? (
                          <MatrixInputGroup
                            resultLabel="Resultado G "
                            resultValue={formatQuantity(
                              preview?.resultadoG,
                              material.unidadMedida,
                            )}
                          >
                            <span className="matrix-input-label">
                              Cajas tomadas como muestra
                            </span>

                            <MatrixNumberInput
                              value={
                                draft?.cajasTomadasMuestra ?? ""
                              }
                              unit={material.unidadMedida}
                              onChange={(value) =>
                                updateDraft(
                                  material.id,
                                  "cajasTomadasMuestra",
                                  value,
                                )
                              }
                            />

                            <span className="matrix-input-label">
                              Cajas utilizadas en arranque
                            </span>

                            <MatrixNumberInput
                              value={
                                draft?.cajasUtilizadasArranque ??
                                ""
                              }
                              unit={material.unidadMedida}
                              onChange={(value) =>
                                updateDraft(
                                  material.id,
                                  "cajasUtilizadasArranque",
                                  value,
                                )
                              }
                            />
                          </MatrixInputGroup>
                        ) : usesSingleSampleInput ? (
                          <MatrixInputGroup
                            resultLabel="Resultado G "
                            resultValue={formatQuantity(
                              preview?.resultadoG,
                              material.unidadMedida,
                            )}
                          >
                            <span className="matrix-input-label">
                              {isEtiquetaColectiva
                                ? "Etiquetas tomadas como muestra"
                                : "Cajas de empaque tomadas como muestra"}
                            </span>

                            <MatrixNumberInput
                              value={
                                draft?.cajasTomadasMuestra ?? ""
                              }
                              unit={material.unidadMedida}
                              onChange={(value) =>
                                updateDraft(
                                  material.id,
                                  "cajasTomadasMuestra",
                                  value,
                                )
                              }
                            />
                          </MatrixInputGroup>
                        ) : isManualG ? (
                          <MatrixNumberInput
                            value={draft?.resultadoG ?? ""}
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
                        (H) Cantidad total utilizada
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
                            "CAJA PLEGADIZA",
                            "ETIQUETA COLECTIVA",
                            "CAJA EMPAQUE",
                            "TABLETA",
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