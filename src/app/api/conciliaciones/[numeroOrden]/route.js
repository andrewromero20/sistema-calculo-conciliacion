import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  const { numeroOrden } = await params;

  const conciliacion = await prisma.conciliacion.findUnique({
    where: { numeroOrden },
    include: { materiales: true },
  });

  if (!conciliacion) {
    return Response.json(
      { error: "No existe una conciliación para esa orden." },
      { status: 404 },
    );
  }

  return Response.json(conciliacion);
}