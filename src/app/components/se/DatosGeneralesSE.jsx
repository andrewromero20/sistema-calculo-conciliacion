"use client";

import AutocompleteInput from "./AutocompleteInput";
import FormattedNumberInput from "./FormattedNumberInput";
import { formatThousands, formatInteger, formatDecimal } from "@/lib/numberFormat";
import { formatDateTime } from "@/app/lib/dateFormat";

const PRODUCTOS_SUGERIDOS = [
  "Paracetamol 500mg Granel Tableteado",
  "Ibuprofeno 400mg Tableteado",
  "Amoxicilina 500mg Granel",
  "Metformina 850mg Tableteado",
  "Ketorolaco 10mg Tableteado",
  "Naproxeno 250mg Recubierto",
  "Omeprazol 20mg Gránulos",
  "Loratadina 10mg Tableteado",
];

const SUPERVISORES_PREPARACION = [
  "Ing. Roberto Domínguez",
  "Q.F.B. Carlos Mendoza",
  "Ing. Alejandro Torres",
  "Ing. Marco Aurelio Soto",
];

const SUPERVISORES_TAB_RECUB = [
  "Ing. Laura Méndez",
  "Ing. Sofía Morales",
  "Q.F.B. Patricia Herrera",
  "Ing. Javier Delgado",
];

/**
 * Helper para aplicar el marco iluminado en azul a campos no modificados en modo plantilla (Punto 5)
 */
function getGlowBorderClass(isUnmodified, error = false, disabled = false) {
  if (disabled) {
    return "bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed select-none";
  }
  if (error) {
    return "border-red-400 bg-red-50/30 text-slate-900";
  }
  if (isUnmodified) {
    return "border-blue-500 ring-2 ring-blue-400 bg-blue-50/15 shadow-[0_0_8px_rgba(59,130,246,0.35)] text-slate-900";
  }
  return "border-slate-300 bg-white text-slate-900 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500";
}

/**
 * Bloquear tecla de signo negativo (-) y notación científica (e)
 */
function preventNegativeInput(e) {
  if (e.key === "-" || e.key === "e" || e.key === "E") {
    e.preventDefault();
  }
}

/**
 * Fecha y hora máxima permitida (momento actual) para no permitir fechas futuras
 */
function getMaxDateTime() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function DatosGeneralesSE({
  values,
  onChangeField,
  errors = {},
  readOnly = false,
  isUnmodifiedField = () => false,
}) {
  return (
    <div className="space-y-5">
      {/* Grid de 2 Columnas: Identificación y Parámetros Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Columna Izquierda: Identificación del Lote y Personal */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Identificación del Lote y Personal
            </h3>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <AutocompleteInput
                  id="supervisorPreparacion"
                  label="Supervisor Preparación"
                  value={values.supervisorPreparacion || ""}
                  onChange={(val) => onChangeField("supervisorPreparacion", val)}
                  options={SUPERVISORES_PREPARACION}
                  placeholder="Selecciona supervisor"
                  disabled={readOnly}
                  required
                  error={errors.supervisorPreparacion}
                  isUnmodified={isUnmodifiedField("supervisorPreparacion")}
                />
                {isUnmodifiedField("supervisorPreparacion") && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
              </div>

              <div>
                <AutocompleteInput
                  id="supervisorTabRecub"
                  label="Supervisor Tab / Recub"
                  value={values.supervisorTabRecub || ""}
                  onChange={(val) => onChangeField("supervisorTabRecub", val)}
                  options={SUPERVISORES_TAB_RECUB}
                  placeholder="Selecciona supervisor"
                  disabled={readOnly}
                  required
                  error={errors.supervisorTabRecub}
                  isUnmodified={isUnmodifiedField("supervisorTabRecub")}
                />
                {isUnmodifiedField("supervisorTabRecub") && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="ordenGranel"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Orden Granel <span className="text-red-500">*</span>
                </label>
                <input
                  id="ordenGranel"
                  type="text"
                  value={values.ordenGranel || ""}
                  disabled={true}
                  title="El número de orden fue validado en el paso 1"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-700 font-mono font-bold rounded-lg cursor-not-allowed"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Validado en Paso 1
                </span>
              </div>

              <div>
                <label
                  htmlFor="codigoMaterial"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Código de Material <span className="text-red-500">*</span>
                </label>
                <input
                  id="codigoMaterial"
                  type="text"
                  value={values.codigoMaterial || ""}
                  onChange={(e) => onChangeField("codigoMaterial", e.target.value)}
                  disabled={readOnly}
                  placeholder="ej. MAT-TAB-500"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                    isUnmodifiedField("codigoMaterial"),
                    Boolean(errors.codigoMaterial),
                    readOnly
                  )}`}
                />
                {isUnmodifiedField("codigoMaterial") && !errors.codigoMaterial && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
                {errors.codigoMaterial && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.codigoMaterial}
                  </p>
                )}
              </div>
            </div>

            <div>
              <AutocompleteInput
                id="producto"
                label="Producto"
                value={values.producto || ""}
                onChange={(val) => onChangeField("producto", val)}
                options={PRODUCTOS_SUGERIDOS}
                placeholder="Selecciona o escribe el producto"
                disabled={readOnly}
                required
                error={errors.producto}
                isUnmodified={isUnmodifiedField("producto")}
              />
              {isUnmodifiedField("producto") && (
                <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                  Dato exactamente igual al registro anterior
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="tamanoLoteEstandar"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Tamaño Lote Estándar (kg) <span className="text-red-500">*</span>
                </label>
                <FormattedNumberInput
                  id="tamanoLoteEstandar"
                  isDecimal={true}
                  value={values.tamanoLoteEstandar ?? ""}
                  onKeyDown={preventNegativeInput}
                  onChange={(val) => onChangeField("tamanoLoteEstandar", val)}
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="250.0"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                    isUnmodifiedField("tamanoLoteEstandar"),
                    Boolean(errors.tamanoLoteEstandar),
                    readOnly
                  )}`}
                />
                {isUnmodifiedField("tamanoLoteEstandar") && !errors.tamanoLoteEstandar && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
                {errors.tamanoLoteEstandar && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.tamanoLoteEstandar}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="lote"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Número de Lote <span className="text-red-500">*</span>
                </label>
                <input
                  id="lote"
                  type="text"
                  value={values.lote || ""}
                  onChange={(e) => onChangeField("lote", e.target.value)}
                  disabled={readOnly}
                  placeholder="ej. L-2601"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono font-bold ${getGlowBorderClass(
                    isUnmodifiedField("lote"),
                    Boolean(errors.lote),
                    readOnly
                  )}`}
                />
                {isUnmodifiedField("lote") && !errors.lote && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
                {errors.lote && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.lote}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Parámetros Técnicos y Rendimiento */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Parámetros de Tableteado y Rendimiento
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Grid 1: Peso Neto Total Tabletas (izq) y Cant. de Tab. por Pza. (der) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-end">
              <div>
                <label
                  htmlFor="pesoNetoTotalTabletas"
                  className="block text-[11px] font-bold text-blue-900 uppercase tracking-wider mb-1"
                >
                  Peso Neto Total Tabletas (kg)
                </label>
                <input
                  id="pesoNetoTotalTabletas"
                  type="text"
                  value={
                    values.pesoNetoTotalTabletas !== undefined && values.pesoNetoTotalTabletas !== ""
                      ? formatDecimal(values.pesoNetoTotalTabletas, 2)
                      : "0.00"
                  }
                  disabled={true}
                  readOnly={true}
                  title="Calculado automáticamente sumando la tabla de pesadas"
                  className="w-full px-3 py-2 text-xs border border-blue-200 bg-blue-50/80 text-blue-900 font-mono font-black rounded-lg cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-blue-600 mt-0.5 block">
                  Autocalculado de pesadas (Paso 2)
                </span>
              </div>

              {/* Cant. de Tab. por Pza. */}
              <div className="p-2.5 bg-blue-50/90 border-2 border-blue-400 rounded-xl shadow-xs transition hover:border-blue-500">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor="cantTabPorPza"
                    className="block text-[11px] font-bold text-blue-950 uppercase tracking-wider"
                  >
                    Cant. de Tab. por Pza. <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[9px] bg-blue-200 text-blue-900 font-bold px-1.5 py-0.5 rounded shadow-2xs">
                    ★ Parámetro clave
                  </span>
                </div>
                <FormattedNumberInput
                  id="cantTabPorPza"
                  isDecimal={false}
                  value={values.cantTabPorPza ?? "1"}
                  onKeyDown={preventNegativeInput}
                  onChange={(val) => onChangeField("cantTabPorPza", val)}
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="1"
                  className={`w-full px-3 py-1.5 text-xs font-mono font-bold rounded-lg transition ${
                    isUnmodifiedField("cantTabPorPza")
                      ? "border-blue-500 ring-2 ring-blue-400 bg-white shadow-[0_0_8px_rgba(59,130,246,0.35)]"
                      : "border-blue-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  }`}
                />
                <span className="text-[10px] text-blue-800 font-medium mt-0.5 block">
                  Utilizado para piezas a acondicionar
                </span>
                {isUnmodifiedField("cantTabPorPza") && (
                  <span className="text-[10px] text-blue-700 font-semibold block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
              </div>
            </div>

            {/* Grid 2: Peso Promedio (izq) y Muestras Tab / Recub (der) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="pesoPromedio"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Peso Promedio (g) <span className="text-red-500">*</span>
                </label>
                <FormattedNumberInput
                  id="pesoPromedio"
                  isDecimal={true}
                  value={values.pesoPromedio ?? ""}
                  onKeyDown={preventNegativeInput}
                  onChange={(val) => onChangeField("pesoPromedio", val)}
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="0.520"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                    isUnmodifiedField("pesoPromedio"),
                    Boolean(errors.pesoPromedio),
                    readOnly
                  )}`}
                />
                {isUnmodifiedField("pesoPromedio") && !errors.pesoPromedio && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
                {errors.pesoPromedio && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.pesoPromedio}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="muestrasTabRecub"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Muestras Tab / Recub <span className="text-red-500">*</span>
                </label>
                <FormattedNumberInput
                  id="muestrasTabRecub"
                  isDecimal={false}
                  value={values.muestrasTabRecub ?? ""}
                  onKeyDown={preventNegativeInput}
                  onChange={(val) => onChangeField("muestrasTabRecub", val)}
                  disabled={readOnly}
                  readOnly={readOnly}
                  placeholder="500"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                    isUnmodifiedField("muestrasTabRecub"),
                    Boolean(errors.muestrasTabRecub),
                    readOnly
                  )}`}
                />
                {isUnmodifiedField("muestrasTabRecub") && !errors.muestrasTabRecub && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
                {errors.muestrasTabRecub && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.muestrasTabRecub}
                  </p>
                )}
              </div>
            </div>

            {/* Grid 3: Cant. Pzas a Cargar SAP y Cant. Pzas a Acondicionar (Redondeo entero y miles con coma) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="cantPzasCargarSap"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Cant. Pzas a Cargar SAP <span className="text-red-500">*</span>
                </label>
                <input
                  id="cantPzasCargarSap"
                  type="text"
                  value={
                    values.cantPzasCargarSap !== "" && values.cantPzasCargarSap !== undefined
                      ? formatInteger(values.cantPzasCargarSap)
                      : ""
                  }
                  disabled={true}
                  readOnly={true}
                  placeholder="Calculado automáticamente"
                  title="Calculado automáticamente: Math.round((Peso Neto Total * 1000) / Peso Promedio)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-700 font-mono font-bold rounded-lg cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Autocalculado: Peso Neto Total / Peso Promedio (entero)
                </span>
                {errors.cantPzasCargarSap && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.cantPzasCargarSap}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="cantPzasAcondicionar"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Cant. Pzas a Acondicionar <span className="text-red-500">*</span>
                </label>
                <input
                  id="cantPzasAcondicionar"
                  type="text"
                  value={
                    values.cantPzasAcondicionar !== "" && values.cantPzasAcondicionar !== undefined
                      ? formatInteger(values.cantPzasAcondicionar)
                      : ""
                  }
                  disabled={true}
                  readOnly={true}
                  placeholder="Calculado automáticamente"
                  title="Calculado automáticamente: Math.round(Cant. Pzas SAP / Cant. Tab por Pza.)"
                  className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-700 font-mono font-bold rounded-lg cursor-not-allowed select-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Autocalculado: Cant. SAP / Cant. Tab. por Pza. (entero)
                </span>
                {errors.cantPzasAcondicionar && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.cantPzasAcondicionar}
                  </p>
                )}
              </div>
            </div>

            {/* Grid 4: Rendimiento Tab. y CTEC Granel SAP (Punto 10: porcentaje real formateado) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="rendimientoTab"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Rendimiento Tab. (90.4% - 100.9%) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="rendimientoTab"
                    type="text"
                    value={
                      values.rendimientoTab !== "" && values.rendimientoTab !== undefined
                        ? formatThousands(values.rendimientoTab, 1)
                        : ""
                    }
                    disabled={true}
                    readOnly={true}
                    placeholder="Calculado automáticamente"
                    title="Calculado automáticamente: (Peso Neto / Peso Promedio) / Tamaño de Lote Estándar"
                    className="w-full px-3 py-2 text-xs border border-slate-200 bg-slate-100 text-slate-700 font-mono font-bold rounded-lg cursor-not-allowed select-none"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    %
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Autocalculado: (Peso Neto / Peso Prom.) / Tamaño Lote
                </span>
                {errors.rendimientoTab && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.rendimientoTab}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="ctecGranelSap"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  CTEC Granel SAP (COIO) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ctecGranelSap"
                  type="text"
                  value={values.ctecGranelSap || ""}
                  onChange={(e) => onChangeField("ctecGranelSap", e.target.value)}
                  disabled={readOnly}
                  placeholder="ej. CTEC-GR-0142"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                    isUnmodifiedField("ctecGranelSap"),
                    Boolean(errors.ctecGranelSap),
                    readOnly
                  )}`}
                />
                {isUnmodifiedField("ctecGranelSap") && !errors.ctecGranelSap && (
                  <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                    Dato exactamente igual al registro anterior
                  </span>
                )}
                {errors.ctecGranelSap && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.ctecGranelSap}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fila Inferior: Tiempos de Fabricación (Tableteado y Recubrimiento) */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="border-b border-slate-100 pb-2">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Tiempos de Fabricación (Tableteado y Recubrimiento)
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label
              htmlFor="fechaInicioTableteado"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Inicio Tableteado <span className="text-red-500">*</span>
            </label>
            {readOnly ? (
              <input
                type="text"
                readOnly
                disabled
                value={values.fechaInicioTableteado ? formatDateTime(values.fechaInicioTableteado) : "-"}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-100 text-slate-700 font-mono cursor-not-allowed select-none"
              />
            ) : (
              <input
                id="fechaInicioTableteado"
                type="datetime-local"
                max={getMaxDateTime()}
                value={values.fechaInicioTableteado || ""}
                onChange={(e) => onChangeField("fechaInicioTableteado", e.target.value)}
                disabled={readOnly}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                  isUnmodifiedField("fechaInicioTableteado"),
                  Boolean(errors.fechaInicioTableteado),
                  readOnly
                )}`}
              />
            )}
            {isUnmodifiedField("fechaInicioTableteado") && !errors.fechaInicioTableteado && (
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                Dato exactamente igual al registro anterior
              </span>
            )}
            {errors.fechaInicioTableteado && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">
                {errors.fechaInicioTableteado}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fechaFinTableteado"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Fin Tableteado <span className="text-red-500">*</span>
            </label>
            {readOnly ? (
              <input
                type="text"
                readOnly
                disabled
                value={values.fechaFinTableteado ? formatDateTime(values.fechaFinTableteado) : "-"}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-100 text-slate-700 font-mono cursor-not-allowed select-none"
              />
            ) : (
              <input
                id="fechaFinTableteado"
                type="datetime-local"
                max={getMaxDateTime()}
                value={values.fechaFinTableteado || ""}
                onChange={(e) => onChangeField("fechaFinTableteado", e.target.value)}
                disabled={readOnly}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                  isUnmodifiedField("fechaFinTableteado"),
                  Boolean(errors.fechaFinTableteado),
                  readOnly
                )}`}
              />
            )}
            {isUnmodifiedField("fechaFinTableteado") && !errors.fechaFinTableteado && (
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                Dato exactamente igual al registro anterior
              </span>
            )}
            {errors.fechaFinTableteado && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">
                {errors.fechaFinTableteado}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fechaInicioRecubrimiento"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Inicio Recubrimiento <span className="text-red-500">*</span>
            </label>
            {readOnly ? (
              <input
                type="text"
                readOnly
                disabled
                value={values.fechaInicioRecubrimiento ? formatDateTime(values.fechaInicioRecubrimiento) : "-"}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-100 text-slate-700 font-mono cursor-not-allowed select-none"
              />
            ) : (
              <input
                id="fechaInicioRecubrimiento"
                type="datetime-local"
                max={getMaxDateTime()}
                value={values.fechaInicioRecubrimiento || ""}
                onChange={(e) => onChangeField("fechaInicioRecubrimiento", e.target.value)}
                disabled={readOnly}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                  isUnmodifiedField("fechaInicioRecubrimiento"),
                  Boolean(errors.fechaInicioRecubrimiento),
                  readOnly
                )}`}
              />
            )}
            {isUnmodifiedField("fechaInicioRecubrimiento") && !errors.fechaInicioRecubrimiento && (
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                Dato exactamente igual al registro anterior
              </span>
            )}
            {errors.fechaInicioRecubrimiento && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">
                {errors.fechaInicioRecubrimiento}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fechaFinPrimeraCarga"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Fin 1era Carga <span className="text-red-500">*</span>
            </label>
            {readOnly ? (
              <input
                type="text"
                readOnly
                disabled
                value={values.fechaFinPrimeraCarga ? formatDateTime(values.fechaFinPrimeraCarga) : "-"}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-100 text-slate-700 font-mono cursor-not-allowed select-none"
              />
            ) : (
              <input
                id="fechaFinPrimeraCarga"
                type="datetime-local"
                max={getMaxDateTime()}
                value={values.fechaFinPrimeraCarga || ""}
                onChange={(e) => onChangeField("fechaFinPrimeraCarga", e.target.value)}
                disabled={readOnly}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                  isUnmodifiedField("fechaFinPrimeraCarga"),
                  Boolean(errors.fechaFinPrimeraCarga),
                  readOnly
                )}`}
              />
            )}
            {isUnmodifiedField("fechaFinPrimeraCarga") && !errors.fechaFinPrimeraCarga && (
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                Dato exactamente igual al registro anterior
              </span>
            )}
            {errors.fechaFinPrimeraCarga && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">
                {errors.fechaFinPrimeraCarga}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="fechaFinRecubrimiento"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Fin Recubrimiento <span className="text-red-500">*</span>
            </label>
            {readOnly ? (
              <input
                type="text"
                readOnly
                disabled
                value={values.fechaFinRecubrimiento ? formatDateTime(values.fechaFinRecubrimiento) : "-"}
                className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-100 text-slate-700 font-mono cursor-not-allowed select-none"
              />
            ) : (
              <input
                id="fechaFinRecubrimiento"
                type="datetime-local"
                max={getMaxDateTime()}
                value={values.fechaFinRecubrimiento || ""}
                onChange={(e) => onChangeField("fechaFinRecubrimiento", e.target.value)}
                disabled={readOnly}
                className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${getGlowBorderClass(
                  isUnmodifiedField("fechaFinRecubrimiento"),
                  Boolean(errors.fechaFinRecubrimiento),
                  readOnly
                )}`}
              />
            )}
            {isUnmodifiedField("fechaFinRecubrimiento") && !errors.fechaFinRecubrimiento && (
              <span className="text-[10px] text-blue-600 font-semibold mt-0.5 block">
                Dato exactamente igual al registro anterior
              </span>
            )}
            {errors.fechaFinRecubrimiento && (
              <p className="mt-1 text-[11px] text-red-600 font-medium">
                {errors.fechaFinRecubrimiento}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
