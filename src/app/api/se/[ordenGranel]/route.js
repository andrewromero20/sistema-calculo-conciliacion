import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { actualizacionSESchema } from "@/lib/validations/seSchema";
import { obtenerRegistroSEPorOrden, actualizarRegistroSE } from "@/lib/seRepository";

export async function GET(request, { params }) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { ordenGranel } = await params;
    const registro = await obtenerRegistroSEPorOrden(ordenGranel);

    if (!registro) {
      return NextResponse.json(
        { error: `No se encontró el registro SE con Orden Granel ${ordenGranel}.` },
        { status: 404 },
      );
    }

    return NextResponse.json(registro);
  } catch (error) {
    console.error("Error al obtener registro SE:", error);
    return NextResponse.json(
      { error: "Error interno al consultar el registro SE." },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión." }, { status: 401 });
    }

    if (session.rol !== "USER_SE" && session.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Permiso denegado. Solo personal de Semielaborados o Administradores pueden modificar registros." },
        { status: 403 },
      );
    }

    const { ordenGranel } = await params;
    const body = await request.json();

    // Validar esquema completo con justificación
    const validation = actualizacionSESchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Los datos de actualización o la justificación no cumplen con las reglas.",
          details: validation.error.format(),
        },
        { status: 400 },
      );
    }

    const { justificacion, ...datosActualizados } = validation.data;

    // Actualización segura con Diff y Auditoría atómica
    const { registro, diff } = await actualizarRegistroSE(
      ordenGranel,
      datosActualizados,
      session.id,
      justificacion,
    );

    return NextResponse.json({
      success: true,
      mensaje: "Registro actualizado exitosamente con registro en el Audit Trail.",
      registro,
      diff,
    });
  } catch (error) {
    console.error("Error al actualizar registro SE:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar el registro de Semielaborado." },
      { status: 500 },
    );
  }
}
