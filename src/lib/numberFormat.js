/**
 * Utilidades para formateo de cantidades con separador de miles (,) y decimales (.)
 */

export function formatThousands(val, decimals = 0) {
  if (val === "" || val === undefined || val === null || isNaN(Number(val))) return "";
  const num = Number(val);
  if (decimals === 0) {
    return Math.floor(num).toLocaleString("en-US");
  }
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatInteger(val) {
  if (val === "" || val === undefined || val === null || isNaN(Number(val))) return "";
  return Math.floor(Number(val)).toLocaleString("en-US");
}

export function formatDecimal(val, decimals = 2) {
  if (val === "" || val === undefined || val === null || isNaN(Number(val))) return "";
  return Number(val).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
