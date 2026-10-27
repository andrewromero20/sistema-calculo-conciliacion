import { prisma } from "@/lib/prisma";
import { DEFAULT_MATERIALS } from "../../../lib/defaultMaterials";

export async function GET() {

  const conciliaciones =
    await prisma.conciliacion.findMany();

  return Response.json(conciliaciones);

} 

export async function POST(request) {
  try {
    const body = await request.json();

    const numeroOrden =
      typeof body.numeroOrden === "string"
        ? body.numeroOrden.trim()
        : "";


    if (!numeroOrden) {
      return Response.json(
        {
          error:
            "El número de orden es obligatorio.",
        },
        {
          status: 400,
        },
      );
    }

    const existente =
      await prisma.conciliacion.findUnique({
        where: {
          numeroOrden,
        },
      });

    if (existente) {
      return Response.json(
        {
          error:
            "Ya existe una conciliación para esa orden.",
        },
        {
          status: 409,
        },
      );
    }

    const conciliacion =
      await prisma.conciliacion.create({
        data: {
          numeroOrden,
          estadoConciliacion: "En captura",

          materiales: {
            create: DEFAULT_MATERIALS.map(
              (material) => ({
                descripcion:
                  material.descripcion,
                codigoSAP: "",
                unidadMedida:
                  material.unidadMedida,
                numeroOrden,
                estadoMaterial:
                  "CAPTURA_INCOMPLETA",
              }),
            ),
          },
        },

        include: {
          materiales: true,
        },
      });

    return Response.json(
      conciliacion,
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "ERROR REAL AL CREAR CONCILIACIÓN:",
      error,
    );

    return Response.json(
      {
        error:
          "No fue posible crear la conciliación.",

        detalle:
          error instanceof Error
            ? error.message
            : String(error),

        codigo:
          error?.code ?? null,
      },
      {
        status: 500,
      },
    );
  }
}