import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { registroSESchema } from "@/lib/validations/seSchema";
import { crearRegistroSE, obtenerTodosRegistrosSE } from "@/lib/seRepository";

export async function GET() {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ error: "No autorizado. Inicia sesión." }, { status: 401 });
    }

    const registros = await obtenerTodosRegistrosSE();
    return NextResponse.json(registros);
  } catch (error) {
    console.error("Error al obtener registros SE:", error);
    return NextResponse.json(
      { error: "Error al obtener los registros de Producto Semielaborado." },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ error: "No autorizado. Debes iniciar sesión." }, { status: 401 });
    }

    if (session.rol !== "USER_SE" && session.rol !== "ADMIN") {
      return NextResponse.json(
        { error: "Permiso denegado. Solo personal de Semielaborados o Administradores pueden registrar." },
        { status: 403 },
      );
    }

    const body = await request.json();

    // 1. Validación Zod completa
    const validation = registroSESchema.safeParse(body);
    if (!validation.success) {
      const formattedErrors = validation.error.format();
      return NextResponse.json(
        {
          error: "Los datos del formulario contienen inconsistencias o campos faltantes.",
          details: formattedErrors,
        },
        { status: 400 },
      );
    }

    // 2. Transacción atómica en base de datos
    const nuevoRegistro = await crearRegistroSE(validation.data, session.id);

    return NextResponse.json(nuevoRegistro, { status: 201 });
  } catch (error) {
    console.error("Error al crear registro SE:", error);
    const status = error.message && error.message.includes("ya se encuentra") ? 409 : 500;
    return NextResponse.json(
      { error: error.message || "Error al procesar el guardado atómico del registro SE." },
      { status },
    );
  }
}
