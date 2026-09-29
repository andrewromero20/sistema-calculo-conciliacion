import { prisma } from "@/lib/prisma";

export async function GET() {

  const conciliaciones =
    await prisma.conciliacion.findMany();

  return Response.json(conciliaciones);

}

export async function POST(request) {
  const body =
    await request.json();

  const existente = await prisma.conciliacion.findUnique({
    where: { numeroOrden: body.numeroOrden },
  });

  if (existente) {
    return Response.json(
      { error: "Ya existe una conciliación para esa orden." },
      { status: 409 },
    );
  }

  const conciliacion =
    await prisma.conciliacion.create({
      data: {
        numeroOrden: body.numeroOrden,
        estadoConciliacion: "En captura"
      }
    });

  return Response.json(conciliacion, { status: 201 });

}