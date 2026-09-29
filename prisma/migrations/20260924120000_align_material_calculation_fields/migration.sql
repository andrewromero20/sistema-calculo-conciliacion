-- Align Material with the nullable calculation inputs defined in prisma/schema.prisma.
ALTER TABLE "Material"
  ADD COLUMN "cantidadRealAcondicionada" DOUBLE PRECISION,
  ADD COLUMN "capacidadCajaEmpaque" DOUBLE PRECISION,
  ADD COLUMN "telecamara" DOUBLE PRECISION,
  ADD COLUMN "hermeticidad" DOUBLE PRECISION,
  ADD COLUMN "otraMerma" DOUBLE PRECISION,
  ADD COLUMN "cajasTomadasMuestra" DOUBLE PRECISION,
  ADD COLUMN "cajasUtilizadasArranque" DOUBLE PRECISION;

ALTER TABLE "Material"
  ALTER COLUMN "cantidadSurtidaA" DROP NOT NULL,
  ALTER COLUMN "cantidadAdicionalB" DROP NOT NULL,
  ALTER COLUMN "cantidadDevueltaC" DROP NOT NULL,
  ALTER COLUMN "totalRecibidaD" DROP NOT NULL,
  ALTER COLUMN "resultadoE" DROP NOT NULL,
  ALTER COLUMN "resultadoF" DROP NOT NULL,
  ALTER COLUMN "resultadoG" DROP NOT NULL,
  ALTER COLUMN "totalUtilizadaH" DROP NOT NULL,
  ALTER COLUMN "diferencia" DROP NOT NULL,
  ALTER COLUMN "porcentajeDiferencia" DROP NOT NULL,
  ALTER COLUMN "limitePermitido" DROP NOT NULL,
  ALTER COLUMN "estadoMaterial" DROP NOT NULL;
