import { prisma } from "@/lib/prisma";
import {
  calcularDiferenciaAH,
  calcularECajaEmpaque,
  calcularECajaPlegadiza,
  calcularFCajaPlegadiza,
  calcularFCajaEmpaque,
  calcularGCajaPlegadiza,
  calcularGCajaEmpaque,
  calcularEInstructivo,
  calcularFInstructivo,
  calcularGInstructivo,
  calcularESelloGarantia,
  calcularFSelloGarantia,
  calcularGSelloGarantia,
  calcularETableta,
  calcularEEtiquetaColectiva,
  calcularFTableta,
  calcularFEtiquetaColectiva,
  calcularGTableta,
  calcularGEtiquetaColectiva,
  calcularPorcentajeDiferencia,
  calcularTotalRecibido,
  calcularTotalUtilizadoAH,
  calcularDiferenciaFoil,
  calcularEFoil,
  calcularFFoil,
  calcularTotalFoil,
  evaluarEstadoMaterial,
} from "@/lib/calculosMateriales";

const materialFields = [
  "descripcion",
  "codigoSAP",
  "numeroOrden",
  "unidadMedida",
  "blisterPorCaja",
  "tabletasPorBlister",
  "cantidadRealAcondicionada",
  "capacidadCajaEmpaque",
  "cantidadSurtidaA",
  "cantidadAdicionalB",
  "cantidadDevueltaC",
  "telecamara",
  "hermeticidad",
  "otraMerma",
  "cajasTomadasMuestra",
  "cajasUtilizadasArranque",
  "totalRecibidaD",
  "resultadoE",
  "resultadoF",
  "resultadoG",
  "totalUtilizadaH",
  "diferencia",
  "porcentajeDiferencia",
  "limitePermitido",
  "estadoMaterial",
  "conciliacionId",
];

const materialTypes = [
  "CAJA PLEGADIZA",
  "ETIQUETA COLECTIVA",
  "CAJA EMPAQUE",
  "FOIL ALUMINIO",
  "FOIL PVC",
  "SELLO GARANTÍA",
  "INSTRUCTIVO",
  "TABLETA",
];

const numericMaterialFields = new Set([
  "blisterPorCaja",
  "tabletasPorBlister",
  "cantidadRealAcondicionada",
  "capacidadCajaEmpaque",
  "cantidadSurtidaA",
  "cantidadAdicionalB",
  "cantidadDevueltaC",
  "telecamara",
  "hermeticidad",
  "otraMerma",
  "cajasTomadasMuestra",
  "cajasUtilizadasArranque",
  "totalRecibidaD",
  "resultadoE",
  "resultadoF",
  "resultadoG",
  "totalUtilizadaH",
  "diferencia",
  "porcentajeDiferencia",
  "limitePermitido",
]);

const nonNegativeMaterialFields = [
  "cantidadSurtidaA",
  "cantidadAdicionalB",
  "cantidadDevueltaC",
  "cantidadRealAcondicionada",
  "capacidadCajaEmpaque",
  "tabletasPorBlister",
  "blisterPorCaja",
  "telecamara",
  "hermeticidad",
  "otraMerma",
  "cajasTomadasMuestra",
  "cajasUtilizadasArranque",
];

function getId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function pickMaterialFields(body) {
  return Object.fromEntries(
    materialFields
      .filter((field) => body[field] !== undefined)
      .map((field) => [field, numericMaterialFields.has(field) ? normalizeOptionalNumber(body[field]) : body[field]]),
  );
}

function normalizeOptionalNumber(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export async function GET(request, { params }) {
  const { id: rawId } = await params;
  const id = getId(rawId);

  if (!id) {
    return Response.json(
      { error: "El identificador del material no es válido.", idRecibido: rawId },
      { status: 400 },
    );
  }

  const material = await prisma.material.findUnique({
    where: { id },
    include: { conciliacion: true },
  });

  if (!material) {
    return Response.json({ error: "Material no encontrado.", id }, { status: 404 });
  }

  return Response.json(material);
}

export async function PUT(request, { params }) {
  const id = getId((await params).id);

  if (!id) {
    return Response.json({ error: "El id debe ser un entero positivo." }, { status: 400 });
  }

  const data = pickMaterialFields(await request.json());

  if (Object.keys(data).length === 0) {
    return Response.json(
      { error: "Debes enviar al menos un campo para actualizar." },
      { status: 400 },
    );
  }

  const negativeFields = nonNegativeMaterialFields.filter((field) =>
    data[field] !== undefined && data[field] !== null && data[field] < 0,
  );

  if (negativeFields.length > 0) {
    return Response.json(
      {
        error: "Las cantidades no pueden ser negativas.",
        campos: negativeFields,
      },
      { status: 400 },
    );
  }

  if (data.descripcion !== undefined && !materialTypes.includes(data.descripcion)) {
    return Response.json(
      { error: "La descripción seleccionada no es válida." },
      { status: 400 },
    );
  }

  try {
    const currentMaterial = await prisma.material.findUnique({ where: { id } });

    if (!currentMaterial) {
      return Response.json({ error: "Material no encontrado." }, { status: 404 });
    }

    if (currentMaterial.descripcion === "INSTRUCTIVO") {
      const negativeInstructivoFields = ["resultadoE", "resultadoF", "resultadoG"].filter((field) =>
        data[field] !== undefined && data[field] !== null && data[field] < 0,
      );

      if (negativeInstructivoFields.length > 0) {
        return Response.json(
          {
            error: "Las cantidades no pueden ser negativas.",
            campos: negativeInstructivoFields,
          },
          { status: 400 },
        );
      }
    }

    if (currentMaterial.descripcion === "SELLO GARANTÍA") {
      const negativeSelloFields = ["resultadoE", "resultadoF", "resultadoG"].filter((field) =>
        data[field] !== undefined && data[field] !== null && data[field] < 0,
      );

      if (negativeSelloFields.length > 0) {
        return Response.json(
          {
            error: "Las cantidades no pueden ser negativas.",
            campos: negativeSelloFields,
          },
          { status: 400 },
        );
      }
    }

    if (currentMaterial.descripcion === "SELLO GARANTÍA") {
      const negativeSelloFields = ["resultadoE", "resultadoF", "resultadoG"].filter((field) =>
        data[field] !== undefined && data[field] !== null && data[field] < 0,
      );

      if (negativeSelloFields.length > 0) {
        return Response.json(
          {
            error: "Las cantidades no pueden ser negativas.",
            campos: negativeSelloFields,
          },
          { status: 400 },
        );
      }
    }

    const nextData = { ...currentMaterial, ...data };

    if (nextData.descripcion === "TABLETA") {
      const cantidadAdicionalB = nextData.cantidadAdicionalB ?? 0;
      const cantidadDevueltaC = nextData.cantidadDevueltaC ?? 0;
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        cantidadAdicionalB,
        cantidadDevueltaC,
      );
      const resultadoE = calcularETableta(
        nextData.cantidadRealAcondicionada,
        nextData.tabletasPorBlister,
      );
      const resultadoF = calcularFTableta({
        telecamara: nextData.telecamara,
        hermeticidad: nextData.hermeticidad,
        otraMerma: nextData.otraMerma,
        tabletasPorBlister: nextData.tabletasPorBlister,
      });
      const resultadoG = calcularGTableta(
        nextData.cajasTomadasMuestra,
        nextData.tabletasPorBlister,
      );
      const totalUtilizadaH = calcularTotalUtilizadoAH(resultadoE, resultadoF, resultadoG);
      const diferencia = calcularDiferenciaAH(totalRecibidaD, totalUtilizadaH);
      const porcentajeDiferencia = calcularPorcentajeDiferencia(totalRecibidaD, diferencia);
      const faltanValores = [
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
      ].some((value) => value === null);

      Object.assign(data, {
        cantidadAdicionalB,
        cantidadDevueltaC,
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        estadoMaterial: faltanValores ? "CAPTURA_INCOMPLETA" : "PENDIENTE_DE_REVISION",
      });
    }

    if (nextData.descripcion === "ETIQUETA COLECTIVA") {
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );
      const resultadoE = calcularEEtiquetaColectiva(
        nextData.cantidadRealAcondicionada,
        nextData.capacidadCajaEmpaque,
      );
      const resultadoF = calcularFEtiquetaColectiva(nextData.otraMerma);
      const resultadoG = calcularGEtiquetaColectiva(nextData.cajasTomadasMuestra);
      const totalUtilizadaH = calcularTotalUtilizadoAH(resultadoE, resultadoF, resultadoG);
      const diferencia = calcularDiferenciaAH(totalRecibidaD, totalUtilizadaH);
      const porcentajeDiferencia = calcularPorcentajeDiferencia(totalRecibidaD, diferencia);
      const faltanValores = [
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
      ].some((value) => value === null);
      const estadoMaterial = faltanValores
        ? "CAPTURA_INCOMPLETA"
        : Math.abs(diferencia) <= 10
          ? "DENTRO_DEL_LIMITE"
          : "FUERA_DEL_LIMITE";

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        limitePermitido: 10,
        estadoMaterial,
      });
    }

    if (nextData.descripcion === "CAJA PLEGADIZA") {
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );
      const resultadoE = calcularECajaPlegadiza(nextData.cantidadRealAcondicionada);
      const resultadoF = calcularFCajaPlegadiza(nextData.otraMerma);
      const resultadoG = calcularGCajaPlegadiza(
        nextData.cajasTomadasMuestra,
        nextData.cajasUtilizadasArranque,
      );
      const totalUtilizadaH = calcularTotalUtilizadoAH(resultadoE, resultadoF, resultadoG);
      const diferencia = calcularDiferenciaAH(totalRecibidaD, totalUtilizadaH);
      const porcentajeDiferencia = calcularPorcentajeDiferencia(totalRecibidaD, diferencia);
      const faltanValores = [
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
      ].some((value) => value === null);
      const estadoMaterial = faltanValores
        ? "CAPTURA_INCOMPLETA"
        : porcentajeDiferencia !== null && porcentajeDiferencia <= 1
          ? "DENTRO_DEL_LIMITE"
          : "FUERA_DEL_LIMITE";

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        limitePermitido: 1,
        estadoMaterial,
      });
    }

    if (nextData.descripcion === "CAJA EMPAQUE") {
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );
      const resultadoE = calcularECajaEmpaque(
        nextData.cantidadRealAcondicionada,
        nextData.capacidadCajaEmpaque,
      );
      const resultadoF = calcularFCajaEmpaque(nextData.otraMerma);
      const resultadoG = calcularGCajaEmpaque(nextData.cajasTomadasMuestra);
      const totalUtilizadaH = calcularTotalUtilizadoAH(resultadoE, resultadoF, resultadoG);
      const diferencia = calcularDiferenciaAH(totalRecibidaD, totalUtilizadaH);
      const porcentajeDiferencia = calcularPorcentajeDiferencia(totalRecibidaD, diferencia);
      const faltanValores = [
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
      ].some((value) => value === null);
      const estadoMaterial = faltanValores
        ? "CAPTURA_INCOMPLETA"
        : Math.abs(diferencia) <= 10
          ? "DENTRO_DEL_LIMITE"
          : "FUERA_DEL_LIMITE";

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        limitePermitido: 10,
        estadoMaterial,
      });
    }

    if (nextData.descripcion === "INSTRUCTIVO") {
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );
      const resultadoE = calcularEInstructivo(nextData.resultadoE);
      const resultadoF = calcularFInstructivo(nextData.resultadoF);
      const resultadoG = calcularGInstructivo(nextData.resultadoG);
      const totalUtilizadaH = calcularTotalUtilizadoAH(resultadoE, resultadoF, resultadoG);
      const diferencia = calcularDiferenciaAH(totalRecibidaD, totalUtilizadaH);
      const porcentajeDiferencia = calcularPorcentajeDiferencia(totalRecibidaD, diferencia);
      const faltanValores = [
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
      ].some((value) => value === null);
      const estadoMaterial = faltanValores
        ? "CAPTURA_INCOMPLETA"
        : totalRecibidaD <= 0
          ? "PENDIENTE_DE_REVISION"
          : porcentajeDiferencia <= 1
            ? "DENTRO_DEL_LIMITE"
            : "FUERA_DEL_LIMITE";

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        limitePermitido: 1,
        estadoMaterial,
      });
    }
    if (nextData.descripcion === "SELLO GARANTÍA") {
      // Captura manual temporal conforme a valores documentados en la MBR.
      // Pendiente definir el origen automatizado de E, F y G.

      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );

      const resultadoE = calcularESelloGarantia(
        nextData.resultadoE,
      );

      const resultadoF = calcularFSelloGarantia(
        nextData.resultadoF,
      );

      const resultadoG = calcularGSelloGarantia(
        nextData.resultadoG,
      );

      const totalUtilizadaH = calcularTotalUtilizadoAH(
        resultadoE,
        resultadoF,
        resultadoG,
      );

      const diferencia = calcularDiferenciaAH(
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
      ].some((value) => value === null);

      const { estado: estadoMaterial } =
        evaluarEstadoMaterial({
          tipoMaterial: "SELLO GARANTÍA",
          d: totalRecibidaD,
          diferencia,
          porcentaje: porcentajeDiferencia,
          faltanValores,
        });

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        limitePermitido: 7,
        estadoMaterial,
      });
    }
    
    if (nextData.descripcion === "FOIL PVC") {
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );

      // E = Merma pura registrada en la MBR.
      const resultadoE = calcularEFoil(
        nextData.resultadoE,
      );

      // F = Cantidad utilizada real registrada en la MBR.
      const resultadoF = calcularFFoil(
        nextData.resultadoF,
      );

      // G no aplica para FOIL PVC.
      const resultadoG = null;

      // H = E + F.
      const totalUtilizadaH = calcularTotalFoil(
        resultadoE,
        resultadoF,
      );

      // Diferencia = D - E - F.
      const diferencia = calcularDiferenciaFoil(
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
          porcentaje: porcentajeDiferencia,
          faltanValores,
        });

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,
        porcentajeDiferencia,
        limitePermitido: 7,
        estadoMaterial,
      });
    }

    if (nextData.descripcion ==="FOIL ALUMINIO") {
      const totalRecibidaD = calcularTotalRecibido(
        nextData.cantidadSurtidaA,
        nextData.cantidadAdicionalB,
        nextData.cantidadDevueltaC,
      );

      // E = Merma pura registrada en la MBR.
      const resultadoE = calcularEFoil(
        nextData.resultadoE,
      );

      // F = Cantidad utilizada real registrada en la MBR.
      const resultadoF = calcularFFoil(
        nextData.resultadoF,
      );

      // G no aplica para FOIL ALUMINIO.
      const resultadoG = null;

      // H = E + F.
      const totalUtilizadaH = calcularTotalFoil(
        resultadoE,
        resultadoF,
      );

      // Diferencia = D - E - F.
      const diferencia = calcularDiferenciaFoil(
        totalRecibidaD,
        resultadoE,
        resultadoF,
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
          tipoMaterial: "FOIL ALUMINIO",
          d: totalRecibidaD,
          diferencia,

          // El porcentaje no aplica para aluminio.
          porcentaje: null,

          faltanValores,
        });

      Object.assign(data, {
        totalRecibidaD,
        resultadoE,
        resultadoF,
        resultadoG,
        totalUtilizadaH,
        diferencia,

        // En FOIL ALUMINIO no aplica porcentaje.
        porcentajeDiferencia: null,

        limitePermitido: 2,
        estadoMaterial,
      });
    }



    const material = await prisma.material.update({ where: { id }, data });
    return Response.json(material);
  } catch (error) {
    if (error.code === "P2025") {
      return Response.json({ error: "Material no encontrado." }, { status: 404 });
    }

    if (error.code === "P2003") {
      return Response.json(
        { error: "La conciliación indicada no existe." },
        { status: 404 },
      );
    }

    throw error;
  }
}

export async function DELETE(request, { params }) {
  const id = getId((await params).id);

  if (!id) {
    return Response.json({ error: "El id debe ser un entero positivo." }, { status: 400 });
  }

  try {
    await prisma.material.delete({ where: { id } });
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error.code === "P2025") {
      return Response.json({ error: "Material no encontrado." }, { status: 404 });
    }

    throw error;
  }
}