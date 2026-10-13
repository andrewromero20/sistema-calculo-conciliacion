export const MATERIAL_DEFINITIONS = [
  {
    descripcion: "TABLETA",
    unidadMedida: "PZA",
  },
  {
    descripcion: "CAJA PLEGADIZA",
    unidadMedida: "PZA",
  },
  {
    descripcion: "ETIQUETA COLECTIVA",
    unidadMedida: "PZA",
  },
  {
    descripcion: "CAJA EMPAQUE",
    unidadMedida: "PZA",
  },
  {
    descripcion: "INSTRUCTIVO",
    unidadMedida: "PZA",
  },
  {
    descripcion: "SELLO GARANTÍA",
    unidadMedida: "PZA",
  },
  {
    descripcion: "FOIL PVC",
    unidadMedida: "kg",
  },
  {
    descripcion: "FOIL ALUMINIO",
    unidadMedida: "kg",
  },
];

export function getMaterialDefinition(
  descripcion,
) {
  return MATERIAL_DEFINITIONS.find(
    (material) =>
      material.descripcion === descripcion,
  );
}