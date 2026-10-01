import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularTotalRecibido,
  calcularETableta,
  calcularECajaPlegadiza,
  calcularFCajaPlegadiza,
  calcularGCajaPlegadiza,
  calcularFCajaEmpaque,
  calcularGCajaEmpaque,
  calcularEEtiquetaColectiva,
  calcularECajaEmpaque,
  calcularFTableta,
  calcularGTableta,
  calcularTotalUtilizadoAH,
  calcularDiferenciaAH,
  calcularPorcentajeDiferencia,
  calcularTotalUtilizado,
  calcularDiferencia,
  calcularPorcentaje,
  evaluarEstadoMaterial,
} from './calculosMateriales.mjs';

test('TABLETA: la API de fórmulas expone H, diferencia y porcentaje', () => {
  assert.equal(calcularTotalUtilizado(706560, 2510, 290), 709360);
  assert.equal(calcularDiferencia(800000, 709360), 90640);
  assert.equal(calcularPorcentaje(90640, 800000), 11.33);
});

test('TABLETA: las entradas pendientes producen resultados pendientes', () => {
  assert.equal(calcularETableta(null, 10), null);
  assert.equal(calcularFTableta({ telecamara: 186, hermeticidad: null, otraMerma: 0, tabletasPorBlister: 10 }), null);
  assert.equal(calcularGTableta(29, null), null);
  assert.equal(calcularTotalUtilizado(null, 2510, 290), null);
});
test('TABLETA: D, E, F, G y H se calculan con la fórmula esperada', () => {
  const d = calcularTotalRecibido(800000, 0, 0);
  const e = calcularETableta(70656, 10);
  const f = calcularFTableta(186, 65, 0, 10);
  const g = calcularGTableta(29, 10);
  const h = calcularTotalUtilizadoAH(e, f, g);
  const diferencia = calcularDiferenciaAH(d, h);
  const porcentaje = calcularPorcentajeDiferencia(d, diferencia);

  assert.equal(d, 800000);
  assert.equal(e, 706560);
  assert.equal(f, 2510);
  assert.equal(g, 290);
  assert.equal(h, 709360);
  assert.equal(diferencia, 90640);
  assert.equal(porcentaje, 11.33);
});

test('CAJA PLEGADIZA: E es igual a la cantidad acondicionada', () => {
  const e = calcularECajaPlegadiza(70656);
  assert.equal(e, 70656);
});

test('CAJA PLEGADIZA: calcula F, G, H, diferencia, porcentaje y límite', () => {
  const d = calcularTotalRecibido(73450, 5200, 6500);
  const e = calcularECajaPlegadiza(70656);
  const f = calcularFCajaPlegadiza(1463);
  const g = calcularGCajaPlegadiza(29, 2);
  const h = calcularTotalUtilizado(e, f, g);
  const diferencia = calcularDiferencia(d, h);
  const porcentaje = calcularPorcentaje(diferencia, d);

  assert.equal(d, 72150);
  assert.equal(e, 70656);
  assert.equal(f, 1463);
  assert.equal(g, 31);
  assert.equal(h, 72150);
  assert.equal(diferencia, 0);
  assert.equal(porcentaje, 0);
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA PLEGADIZA', d, diferencia, porcentaje, faltanValores: false }).estado, 'DENTRO_DEL_LIMITE');
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA PLEGADIZA', d: 10000, diferencia: 200, porcentaje: 2, faltanValores: false }).estado, 'FUERA_DEL_LIMITE');
});

test('CAJA PLEGADIZA: cero de arranque es válido y pendientes devuelven null', () => {
  assert.equal(calcularGCajaPlegadiza(29, 0), 29);
  assert.equal(calcularFCajaPlegadiza(null), null);
  assert.equal(calcularGCajaPlegadiza(29, null), null);
});

test('CAJA PLEGADIZA: D, H y diferencia quedan pendientes si faltan entradas', () => {
  assert.equal(calcularTotalRecibido(null, 0, 0), null);
  assert.equal(calcularTotalUtilizado(null, 0, 0), null);
  assert.equal(calcularDiferencia(null, 0), null);
  assert.equal(calcularPorcentaje(null, null), null);
});

test('CAJA PLEGADIZA: ceros confirmados producen ceros calculados', () => {
  assert.equal(calcularTotalRecibido(0, 0, 0), 0);
  assert.equal(calcularTotalUtilizado(0, 0, 0), 0);
  assert.equal(calcularDiferencia(0, 0), 0);
  assert.equal(calcularPorcentaje(0, 0), null);
});

test('ETIQUETA COLECTIVA: redondeo hacia arriba', () => {
  const e = calcularEEtiquetaColectiva(70656, 80);
  assert.equal(e, 884);
});

test('ETIQUETA COLECTIVA: D, E, F, G y H se calculan con la fórmula esperada', () => {
  const d = calcularTotalRecibido(883, 10, 0);
  const e = calcularEEtiquetaColectiva(70656, 80);
  const f = 8;
  const g = 1;
  const h = calcularTotalUtilizadoAH(e, f, g);
  const diferencia = calcularDiferenciaAH(d, h);
  const porcentaje = calcularPorcentajeDiferencia(d, diferencia);

  assert.equal(d, 893);
  assert.equal(e, 884);
  assert.equal(f, 8);
  assert.equal(g, 1);
  assert.equal(h, 893);
  assert.equal(diferencia, 0);
  assert.equal(porcentaje, 0);
  assert.equal(calcularPorcentajeDiferencia(900, 8), 0.89);
  assert.equal(calcularPorcentajeDiferencia(0, 0), null);
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'ETIQUETA COLECTIVA', d, diferencia, porcentaje, faltanValores: false }).estado, 'DENTRO_DEL_LIMITE');
});

test('ETIQUETA COLECTIVA: división exacta y capacidad cero', () => {
  assert.equal(calcularEEtiquetaColectiva(70400, 80), 880);
  assert.equal(calcularEEtiquetaColectiva(70656, 0), null);
});

test('ETIQUETA COLECTIVA: F y G aceptan valores pendientes y cero', () => {
  assert.equal(calcularEEtiquetaColectiva(70656, 80), 884);
  assert.equal(calcularPorcentajeDiferencia(0, 10), null);
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'ETIQUETA COLECTIVA', d: 900, diferencia: 10, porcentaje: 1.11, faltanValores: false }).estado, 'DENTRO_DEL_LIMITE');
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'ETIQUETA COLECTIVA', d: 900, diferencia: 11, porcentaje: 1.22, faltanValores: false }).estado, 'FUERA_DEL_LIMITE');
});

test('CAJA EMPAQUE: calcula el caso principal y usa diferencia absoluta para el límite', () => {
  const d = calcularTotalRecibido(883, 10, 0);
  const e = calcularECajaEmpaque(70656, 80);
  const f = calcularFCajaEmpaque(8);
  const g = calcularGCajaEmpaque(1);
  const h = calcularTotalUtilizado(e, f, g);
  const diferencia = calcularDiferencia(d, h);
  const porcentaje = calcularPorcentaje(diferencia, d);

  assert.equal(d, 893);
  assert.equal(e, 884);
  assert.equal(f, 8);
  assert.equal(g, 1);
  assert.equal(h, 893);
  assert.equal(diferencia, 0);
  assert.equal(porcentaje, 0);
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d, diferencia, porcentaje, faltanValores: false }).estado, 'DENTRO_DEL_LIMITE');
});

test('CAJA EMPAQUE: E redondea fracciones, conserva divisiones exactas y rechaza capacidad cero', () => {
  assert.equal(calcularECajaEmpaque(70656, 80), 884);
  assert.equal(calcularECajaEmpaque(70400, 80), 880);
  assert.equal(calcularECajaEmpaque(0, 80), 0);
  assert.equal(calcularECajaEmpaque(70656, 0), null);
  assert.equal(calcularECajaEmpaque(70656, -1), null);
  assert.equal(calcularECajaEmpaque(null, 80), null);
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d: 893, diferencia: null, faltanValores: true }).estado, 'CAPTURA_INCOMPLETA');
});

test('CAJA EMPAQUE: F y G conservan pendientes y cero confirmado', () => {
  assert.equal(calcularFCajaEmpaque(8), 8);
  assert.equal(calcularFCajaEmpaque(0), 0);
  assert.equal(calcularFCajaEmpaque(null), null);
  assert.equal(calcularGCajaEmpaque(1), 1);
  assert.equal(calcularGCajaEmpaque(0), 0);
  assert.equal(calcularGCajaEmpaque(null), null);
});

test('CAJA EMPAQUE: estado por diferencia absoluta incluye límite y diferencia negativa', () => {
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d: 900, diferencia: 7, porcentaje: 0.78, faltanValores: false }).estado, 'DENTRO_DEL_LIMITE');
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d: 900, diferencia: 10, porcentaje: 1.11, faltanValores: false }).estado, 'DENTRO_DEL_LIMITE');
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d: 900, diferencia: 11, porcentaje: 1.22, faltanValores: false }).estado, 'FUERA_DEL_LIMITE');
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d: 900, diferencia: -11, porcentaje: 1.22, faltanValores: false }).estado, 'FUERA_DEL_LIMITE');
  assert.equal(evaluarEstadoMaterial({ tipoMaterial: 'CAJA EMPAQUE', d: 900, diferencia: null, porcentaje: null, faltanValores: true }).estado, 'CAPTURA_INCOMPLETA');
});

test('FOIL PVC: G no se duplica y la diferencia usa D - E - F', () => {
  const d = calcularTotalRecibido(100, 0, 0);
  const e = 1;
  const f = 20;
  const diferencia = d - e - f;
  const porcentaje = calcularPorcentajeDiferencia(d, diferencia);

  assert.equal(diferencia, 79);
  assert.equal(porcentaje, 79);
});

test('FOIL ALUMINIO: límite absoluto de 2.0 kg', () => {
  const d = 10;
  const diferencia = 2.5;
  const resultado = evaluarEstadoMaterial({
    tipoMaterial: 'FOIL ALUMINIO',
    d,
    e: 1,
    f: 6.5,
    diferencia,
    porcentaje: 25,
  });

  assert.equal(resultado.estado, 'FUERA_DEL_LIMITE');
});

test('D igual a cero: porcentaje no calculable', () => {
  const porcentaje = calcularPorcentajeDiferencia(0, 10);
  assert.equal(porcentaje, null);
});

test('Valores vacíos dejan el material en CAPTURA_INCOMPLETA', () => {
  const resultado = evaluarEstadoMaterial({
    tipoMaterial: 'TABLETA',
    d: 500,
    e: null,
    f: null,
    g: null,
    diferencia: null,
    porcentaje: null,
    faltanValores: true,
  });

  assert.equal(resultado.estado, 'CAPTURA_INCOMPLETA');
});

test('Cero confirmado es aceptado como valor válido', () => {
  const resultado = evaluarEstadoMaterial({
    tipoMaterial: 'CAJA PLEGADIZA',
    d: 100,
    e: 0,
    f: 0,
    g: 0,
    diferencia: 0,
    porcentaje: 0,
    faltanValores: false,
  });

  assert.equal(resultado.estado, 'DENTRO_DEL_LIMITE');
});
