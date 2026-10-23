import { prisma } from "@/lib/prisma";

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

export async function GET() {
  const materiales = await prisma.material.findMany({
    orderBy: { id: "desc" },
  });

  return Response.json(materiales);
}

export async function POST(request) {
  const body = await request.json();

  const requiredFields = [
    "descripcion",
    "unidadMedida",
    "conciliacionId",
  ];
  const missingFields = requiredFields.filter((field) => {
    const value = body[field];

    if (field === "conciliacionId") {
      return value === undefined || value === null || Number.isNaN(Number(value)) || Number(value) <= 0;
    }

    if (typeof value === "string") {
      return value.trim() === "";
    }

    return value === undefined || value === null || value === "";
  });

  if (missingFields.length > 0) {
    return Response.json(
      {
        error: "Faltan campos obligatorios.",
        campos: missingFields,
      },
      { status: 400 },
    );
  }

  const descripcion = String(body.descripcion).trim();
  const codigoSAP =
    typeof body.codigoSAP === "string"
      ? body.codigoSAP.trim()
      : "";
  const unidadMedida = String(body.unidadMedida).trim();
  const conciliacionId = Number(body.conciliacionId);

  if (!materialTypes.includes(descripcion)) {
    return Response.json(
      { error: "La descripción seleccionada no es válida.", campos: ["descripcion"] },
      { status: 400 },
    );
  }

  if (
    codigoSAP !== "" &&
    codigoSAP.length < 3
  ) {
    return Response.json(
      {
        error:
          "El código SAP no tiene un formato válido.",
        campos: ["codigoSAP"],
      },
      {
        status: 400,
      },
    );
  }

  const conciliacion = await prisma.conciliacion.findUnique({
    where: { id: conciliacionId },
  });

  if (!conciliacion) {
    return Response.json(
      { error: "No se encontró la conciliación asociada.", campos: ["conciliacionId"] },
      { status: 404 },
    );
  }

  const data = {
    descripcion,
    codigoSAP,
    unidadMedida,
    numeroOrden: conciliacion.numeroOrden,
    conciliacionId,
    estadoMaterial: "CAPTURA_INCOMPLETA",
  };

  try {
    const material = await prisma.material.create({ data });
    return Response.json(material, { status: 201 });
  } catch (error) {
    if (error.code === "P2003") {
      return Response.json(
        { error: "La conciliación indicada no existe." },
        { status: 404 },
      );
    }

    throw error;
  }
}