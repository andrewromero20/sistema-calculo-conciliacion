import { prisma } from "@/lib/prisma";

export async function GET() {

  try {

    const resultado =
      await prisma.conciliacion.findMany();

    return Response.json(resultado);

  } catch(error) {

    return Response.json({
      error: String(error)
    }, {
      status: 500
    });

  }

}