export function toSafeNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export function isEmptyValue(value) {
  return value === null || value === undefined || value === "";
}

export function calcularTotalRecibido(a, b, c) {
  if ([a, b, c].some(isEmptyValue)) return null;
  return Number((toSafeNumber(a) + toSafeNumber(b) - toSafeNumber(c)).toFixed(3));
}

export function calcularTotalUtilizadoAH(e, f, g) {
  if ([e, f, g].some(isEmptyValue)) return null;
  return Number((toSafeNumber(e) + toSafeNumber(f) + toSafeNumber(g)).toFixed(3));
}

export function calcularDiferenciaAH(d, h) {
  if (isEmptyValue(d) || isEmptyValue(h)) return null;
  return Number((toSafeNumber(d) - toSafeNumber(h)).toFixed(3));
}

export function calcularPorcentajeDiferencia(d, diferencia) {
  if (isEmptyValue(d) || isEmptyValue(diferencia)) return null;
  const denominator = toSafeNumber(d);
  if (denominator === 0) return null;
  return Number(((Math.abs(diferencia) / denominator) * 100).toFixed(2));
}

export function calcularETableta(cantidadRealAcondicionada, tabletasPorBlister) {
  if (isEmptyValue(cantidadRealAcondicionada) || isEmptyValue(tabletasPorBlister)) return null;
  return Math.round(toSafeNumber(cantidadRealAcondicionada) * toSafeNumber(tabletasPorBlister));
}

export function calcularECajaPlegadiza(cantidadRealAcondicionada) {
  return isEmptyValue(cantidadRealAcondicionada) ? null : toSafeNumber(cantidadRealAcondicionada);
}

export function calcularFCajaPlegadiza(mermaRegistrada) {
  return isEmptyValue(mermaRegistrada) ? null : toSafeNumber(mermaRegistrada);
}

export function calcularGCajaPlegadiza(cajasTomadasMuestra, cajasUtilizadasArranque) {
  if (isEmptyValue(cajasTomadasMuestra) || isEmptyValue(cajasUtilizadasArranque)) return null;
  return Number((toSafeNumber(cajasTomadasMuestra) + toSafeNumber(cajasUtilizadasArranque)).toFixed(3));
}

export function calcularEEtiquetaColectiva(cantidadRealAcondicionada, capacidad) {
  if (isEmptyValue(cantidadRealAcondicionada) || isEmptyValue(capacidad)) return null;
  const capacidadValida = toSafeNumber(capacidad);
  if (capacidadValida <= 0) return null;
  return Math.ceil(toSafeNumber(cantidadRealAcondicionada) / capacidadValida);
}

export function calcularFEtiquetaColectiva(mermaRegistrada) {
  return isEmptyValue(mermaRegistrada) ? null : toSafeNumber(mermaRegistrada);
}

export function calcularGEtiquetaColectiva(cajasTomadasMuestra) {
  return isEmptyValue(cajasTomadasMuestra) ? null : toSafeNumber(cajasTomadasMuestra);
}

export function calcularECajaEmpaque(cantidadRealAcondicionada, capacidad) {
  if (isEmptyValue(cantidadRealAcondicionada) || isEmptyValue(capacidad)) return null;

  const cantidad = Number(cantidadRealAcondicionada);
  const capacidadCaja = Number(capacidad);

  if (!Number.isFinite(cantidad) || !Number.isFinite(capacidadCaja) || cantidad < 0 || capacidadCaja <= 0) {
    return null;
  }

  return Math.ceil(cantidad / capacidadCaja);
}

export function calcularFCajaEmpaque(mermaRegistrada) {
  if (isEmptyValue(mermaRegistrada)) return null;
  const merma = Number(mermaRegistrada);
  return Number.isFinite(merma) && merma >= 0 ? merma : null;
}

export function calcularGCajaEmpaque(cajasTomadasMuestra) {
  if (isEmptyValue(cajasTomadasMuestra)) return null;
  const muestra = Number(cajasTomadasMuestra);
  return Number.isFinite(muestra) && muestra >= 0 ? muestra : null;
}

export function calcularFTableta(input, hermeticidad, otraMerma, tabletasPorBlister) {
  const values = typeof input === "object" && input !== null
    ? input
    : { telecamara: input, hermeticidad, otraMerma, tabletasPorBlister };
  if ([values.telecamara, values.hermeticidad, values.otraMerma, values.tabletasPorBlister].some(isEmptyValue)) return null;
  return Math.round((toSafeNumber(values.telecamara) * toSafeNumber(values.tabletasPorBlister)) + (toSafeNumber(values.hermeticidad) * toSafeNumber(values.tabletasPorBlister)) + toSafeNumber(values.otraMerma));
}

export function calcularGTableta(cajasMuestra, tabletasPorBlister) {
  if (isEmptyValue(cajasMuestra) || isEmptyValue(tabletasPorBlister)) return null;
  return Math.round(toSafeNumber(cajasMuestra) * toSafeNumber(tabletasPorBlister));
}

export function calcularEInstructivo(valorUtilizado) {
  if (isEmptyValue(valorUtilizado)) return null;
  const value = Number(valorUtilizado);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function calcularFInstructivo(valorMerma) {
  if (isEmptyValue(valorMerma)) return null;
  const value = Number(valorMerma);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function calcularGInstructivo(valorMuestra) {
  if (isEmptyValue(valorMuestra)) return null;
  const value = Number(valorMuestra);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function calcularESelloGarantia(valorUtilizado) {
  if (isEmptyValue(valorUtilizado)) return null;
  const value = Number(valorUtilizado);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function calcularFSelloGarantia(valorMerma) {
  if (isEmptyValue(valorMerma)) return null;
  const value = Number(valorMerma);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function calcularGSelloGarantia(valorMuestra) {
  if (isEmptyValue(valorMuestra)) return null;
  const value = Number(valorMuestra);
  return Number.isFinite(value) && value >= 0 ? value : null;
}

export function evaluarEstadoMaterial({ tipoMaterial, d, diferencia, porcentaje, faltanValores }) {
  if (faltanValores) return { estado: "CAPTURA_INCOMPLETA" };
  if (tipoMaterial === "FOIL ALUMINIO") return { estado: Math.abs(toSafeNumber(diferencia)) <= 2 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  if (tipoMaterial === "FOIL PVC") return { estado: toSafeNumber(porcentaje) <= 7 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  if (tipoMaterial === "TABLETA") return { estado: "PENDIENTE_DE_REVISION" };
  if (tipoMaterial === "CAJA PLEGADIZA") return { estado: Math.abs(toSafeNumber(diferencia)) <= toSafeNumber(d) * 0.01 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  if (tipoMaterial === "CAJA EMPAQUE") return { estado: Math.abs(Number(diferencia)) <= 10 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  if (tipoMaterial === "ETIQUETA COLECTIVA") return { estado: Math.abs(toSafeNumber(diferencia)) <= 10 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  if (tipoMaterial === "INSTRUCTIVO") {
    if (toSafeNumber(d) === 0) return { estado: "PENDIENTE_DE_REVISION" };
    return { estado: toSafeNumber(porcentaje) <= 1 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  }
  if (tipoMaterial === "SELLO GARANTÍA") {
    if (toSafeNumber(d) <= 0) return { estado: "PENDIENTE_DE_REVISION" };
    return { estado: toSafeNumber(porcentaje) <= 7 ? "DENTRO_DEL_LIMITE" : "FUERA_DEL_LIMITE" };
  }
  return { estado: "PENDIENTE_DE_REVISION" };
}

export const calcularTotalUtilizado = calcularTotalUtilizadoAH;
export const calcularDiferencia = calcularDiferenciaAH;
export const calcularPorcentaje = (diferencia, d) => calcularPorcentajeDiferencia(d, diferencia);
