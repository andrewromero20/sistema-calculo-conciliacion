/**
 * Utilidades para formateo de cantidades con separador de miles (,) y decimales (.)
 */

/**
 * Redondeo matemático: si la cantidad está por debajo de .5 redondea hacia abajo,
 * si es igual o mayor a .5 redondea hacia arriba.
 */
export function roundHalfUp(val) {
  if (val === "" || val === undefined || val === null) return 0;
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  if (isNaN(num)) return 0;
  return Math.round(num);
}

/**
 * Formatea un número entero con separador de miles (,).
 * Aplica redondeo matemático si recibe decimales.
 */
export function formatInteger(val) {
  if (val === "" || val === undefined || val === null) return "";
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  if (isNaN(num)) return "";
  return Math.round(num).toLocaleString("en-US");
}

/**
 * Formatea cantidades con separador de miles.
 * Si decimals es 0, redondea matemáticamente a entero.
 */
export function formatThousands(val, decimals = 0) {
  if (val === "" || val === undefined || val === null) return "";
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  if (isNaN(num)) return "";
  if (decimals === 0) {
    return Math.round(num).toLocaleString("en-US");
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formateo estilo Excel:
 * - Si es número decimal: NO marca la unidad numérica con coma, conserva el punto decimal (.)
 * - Si es número entero: separa las unidades de millar automáticamente con comas (,)
 */
export function formatNumberExcel(val, isDecimal = false) {
  if (val === "" || val === undefined || val === null) return "";
  const cleanStr = String(val).replace(/,/g, "").trim();
  if (cleanStr === "") return "";
  const num = Number(cleanStr);
  if (isNaN(num)) return String(val);

  // Solo cuando sea un número decimal no se deberá marcar la unidad numérica con ","
  if (isDecimal || cleanStr.includes(".")) {
    return cleanStr;
  }

  // Si es un número entero: separar con coma
  return Math.round(num).toLocaleString("en-US");
}

export function formatDecimal(val, decimals = 2) {
  if (val === "" || val === undefined || val === null) return "";
  const clean = String(val).replace(/,/g, "").trim();
  const num = Number(clean);
  if (isNaN(num)) return "";
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
