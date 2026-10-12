import { NextResponse } from "next/server";
import { getServerSessionUser } from "@/lib/auth";
import { obtenerRegistroSEPorOrden } from "@/lib/seRepository";

export async function GET(request) {
  try {
    const session = await getServerSessionUser();
    if (!session) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const orden = searchParams.get("orden")?.trim();

    if (!orden) {
      return NextResponse.json({ error: "Número de orden requerido." }, { status: 400 });
    }

    const existente = await obtenerRegistroSEPorOrden(orden);
    if (existente) {
      return NextResponse.json({
        exists: true,
        registro: {
          ordenGranel: existente.ordenGranel,
          lote: existente.lote,
          producto: existente.producto,
          fechaCreacion: existente.fechaCreacion,
        },
      });
    }

    return NextResponse.json({ exists: false });
  } catch (err) {
    console.error("Error al verificar orden:", err);
    return NextResponse.json({ error: err.message || "Error al verificar orden." }, { status: 500 });
  }
}
