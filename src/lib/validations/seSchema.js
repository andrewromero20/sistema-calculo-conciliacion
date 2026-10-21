import { z } from "zod";

export const pesoSESchema = z.object({
  id: z.number().optional(),
  pesoBruto: z.coerce
    .number({ invalid_type_error: "El peso bruto debe ser un número." })
    .positive("El peso bruto debe ser mayor a 0."),
  pesoTara: z.coerce
    .number({ invalid_type_error: "La tara debe ser un número." })
    .min(0, "La tara no puede ser negativa."),
  pesoNeto: z.coerce
    .number({ invalid_type_error: "El peso neto debe ser un número." })
    .positive("El peso neto debe ser mayor a 0."),
}).refine((data) => data.pesoBruto >= data.pesoTara, {
  message: "El peso bruto debe ser mayor o igual a la tara.",
  path: ["pesoNeto"],
});

export const registroSESchema = z.object({
  ordenGranel: z
    .string({ required_error: "La orden a granel es obligatoria." })
    .trim()
    .min(2, "La orden a granel debe tener al menos 2 caracteres."),
  lote: z
    .string({ required_error: "El lote es obligatorio." })
    .trim()
    .min(2, "El número de lote debe tener al menos 2 caracteres."),
  codigoMaterial: z
    .string({ required_error: "El código de material es obligatorio." })
    .trim()
    .min(2, "El código de material es obligatorio."),
  producto: z
    .string({ required_error: "El nombre del producto es obligatorio." })
    .trim()
    .min(2, "El nombre del producto es obligatorio."),
  tamanoLoteEstandar: z.coerce
    .number({ invalid_type_error: "El tamaño de lote estándar debe ser un número." })
    .positive("El tamaño de lote estándar debe ser mayor a 0."),
  supervisorPreparacion: z
    .string({ required_error: "El supervisor de preparación es obligatorio." })
    .trim()
    .min(2, "El nombre del supervisor de preparación es obligatorio."),
  supervisorTabRecub: z
    .string({ required_error: "El supervisor de tableteado/recubrimiento es obligatorio." })
    .trim()
    .min(2, "El nombre del supervisor de tableteado/recubrimiento es obligatorio."),
  pesoNetoTotalTabletas: z.coerce
    .number({ invalid_type_error: "El peso neto total debe ser un número." })
    .positive("El peso neto total debe ser mayor a 0."),
  pesoPromedio: z.coerce
    .number({ invalid_type_error: "El peso promedio debe ser un número." })
    .positive("El peso promedio debe ser mayor a 0."),
  cantTabPorPza: z.coerce
    .number({ invalid_type_error: "La cantidad de tabletas por pieza debe ser un número." })
    .optional(),
  cantPzasCargarSap: z.coerce
    .number({ invalid_type_error: "La cantidad de piezas a cargar SAP debe ser un número." })
    .int("La cantidad de piezas a cargar SAP debe ser un número entero.")
    .nonnegative("No puede ser negativo."),
  cantPzasAcondicionar: z.coerce
    .number({ invalid_type_error: "La cantidad de piezas a acondicionar debe ser un número." })
    .int("La cantidad de piezas a acondicionar debe ser un número entero.")
    .nonnegative("No puede ser negativo."),
  muestrasTabRecub: z.coerce
    .number({ invalid_type_error: "Las muestras deben ser un número." })
    .nonnegative("No puede ser negativo."),
  rendimientoTab: z.coerce
    .number({ invalid_type_error: "El rendimiento debe ser un número." })
    .nonnegative("El rendimiento debe ser un número válido."),
  ctecGranelSap: z
    .string({ required_error: "El CTEC Granel SAP es obligatorio." })
    .trim()
    .min(1, "El CTEC Granel SAP es obligatorio."),
  fechaInicioTableteado: z.coerce
    .date({ invalid_type_error: "Fecha de inicio tableteado inválida." })
    .refine((d) => d <= new Date(Date.now() + 60 * 1000), {
      message: "No es posible registrar un día que aún no ha ocurrido.",
    }),
  fechaFinTableteado: z.coerce
    .date({ invalid_type_error: "Fecha fin tableteado inválida." })
    .refine((d) => d <= new Date(Date.now() + 60 * 1000), {
      message: "No es posible registrar un día que aún no ha ocurrido.",
    }),
  fechaInicioRecubrimiento: z.coerce
    .date({ invalid_type_error: "Fecha inicio recubrimiento inválida." })
    .refine((d) => d <= new Date(Date.now() + 60 * 1000), {
      message: "No es posible registrar un día que aún no ha ocurrido.",
    }),
  fechaFinPrimeraCarga: z.coerce
    .date({ invalid_type_error: "Fecha fin primera carga inválida." })
    .refine((d) => d <= new Date(Date.now() + 60 * 1000), {
      message: "No es posible registrar un día que aún no ha ocurrido.",
    }),
  fechaFinRecubrimiento: z.coerce
    .date({ invalid_type_error: "Fecha fin recubrimiento inválida." })
    .refine((d) => d <= new Date(Date.now() + 60 * 1000), {
      message: "No es posible registrar un día que aún no ha ocurrido.",
    }),
  pesos: z
    .array(pesoSESchema, { required_error: "Debe ingresar pesadas." })
    .min(1, "Debe registrar al menos una pesada.")
    .max(48, "No se permiten más de 48 pesadas."),
});

export const actualizacionSESchema = registroSESchema.extend({
  justificacion: z
    .string({ required_error: "La justificación del cambio es obligatoria." })
    .trim()
    .min(10, "La justificación debe tener al menos 10 caracteres explicativos."),
});
