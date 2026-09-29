-- CreateTable
CREATE TABLE "Conciliacion" (
    "id" SERIAL NOT NULL,
    "numeroOrden" TEXT NOT NULL,
    "estadoConciliacion" TEXT NOT NULL,
    "fechaCreacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaActualizacion" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conciliacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Material" (
    "id" SERIAL NOT NULL,
    "descripcion" TEXT NOT NULL,
    "numeroOrden" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "blisterPorCaja" INTEGER,
    "tabletasPorBlister" INTEGER,
    "cantidadSurtidaA" DOUBLE PRECISION NOT NULL,
    "cantidadAdicionalB" DOUBLE PRECISION NOT NULL,
    "cantidadDevueltaC" DOUBLE PRECISION NOT NULL,
    "totalRecibidaD" DOUBLE PRECISION NOT NULL,
    "resultadoE" DOUBLE PRECISION NOT NULL,
    "resultadoF" DOUBLE PRECISION NOT NULL,
    "resultadoG" DOUBLE PRECISION NOT NULL,
    "totalUtilizadaH" DOUBLE PRECISION NOT NULL,
    "diferencia" DOUBLE PRECISION NOT NULL,
    "porcentajeDiferencia" DOUBLE PRECISION NOT NULL,
    "limitePermitido" DOUBLE PRECISION NOT NULL,
    "estadoMaterial" TEXT NOT NULL,
    "conciliacionId" INTEGER NOT NULL,

    CONSTRAINT "Material_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HistorialCambio" (
    "id" SERIAL NOT NULL,
    "accion" TEXT NOT NULL,
    "campoModificado" TEXT,
    "valorAnterior" TEXT,
    "valorNuevo" TEXT,
    "usuario" TEXT NOT NULL,
    "fechaHora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conciliacionId" INTEGER NOT NULL,

    CONSTRAINT "HistorialCambio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Conciliacion_numeroOrden_key" ON "Conciliacion"("numeroOrden");

-- AddForeignKey
ALTER TABLE "Material" ADD CONSTRAINT "Material_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "Conciliacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HistorialCambio" ADD CONSTRAINT "HistorialCambio_conciliacionId_fkey" FOREIGN KEY ("conciliacionId") REFERENCES "Conciliacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
