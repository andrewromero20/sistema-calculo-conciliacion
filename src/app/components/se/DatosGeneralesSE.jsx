"use client";

import AutocompleteInput from "./AutocompleteInput";

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
 * DatosGeneralesSE: Formulario técnico basado en nodo 22:188 de Figma.
 * Estructurado en columnas balanceadas con tarjetas de borde sutil y campos estandarizados.
 */
export default function DatosGeneralesSE({
  values,
  onChangeField,
  errors = {},
  readOnly = false,
}) {
  return (
    <div className="space-y-5">
      {/* Grid de 2 Columnas: Identificación y Parámetros Técnicos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Columna Izquierda: Identificación del Lote y Supervisores */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              1. Identificación del Lote y Personal
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Supervisión de proceso, especificaciones de material y orden de granel.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
              />

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
              />
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
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.codigoMaterial
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
                {errors.codigoMaterial && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.codigoMaterial}
                  </p>
                )}
              </div>
            </div>

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
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="tamanoLoteEstandar"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Tamaño Lote Estándar (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  id="tamanoLoteEstandar"
                  type="number"
                  step="0.01"
                  value={values.tamanoLoteEstandar ?? ""}
                  onChange={(e) => onChangeField("tamanoLoteEstandar", e.target.value)}
                  disabled={readOnly}
                  placeholder="250.0"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.tamanoLoteEstandar
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
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
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono font-bold ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.lote
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
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
          <div className="border-b border-slate-100 pb-2.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              2. Parámetros de Tableteado y Rendimiento
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Valores computados, masa total de pesadas y balance analítico.
            </p>
          </div>

          <div className="space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
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
                    values.pesoNetoTotalTabletas !== undefined
                      ? Number(values.pesoNetoTotalTabletas).toFixed(2)
                      : "0.00"
                  }
                  disabled={true}
                  title="Calculado automáticamente sumando la tabla de pesadas"
                  className="w-full px-3 py-2 text-xs border border-blue-200 bg-blue-50/80 text-blue-900 font-mono font-black rounded-lg cursor-not-allowed"
                />
                <span className="text-[10px] text-blue-600 mt-0.5 block">
                  Autocalculado de pesadas (Paso 2)
                </span>
              </div>

              <div>
                <label
                  htmlFor="pesoPromedio"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Peso Promedio (g) <span className="text-red-500">*</span>
                </label>
                <input
                  id="pesoPromedio"
                  type="number"
                  step="0.001"
                  value={values.pesoPromedio ?? ""}
                  onChange={(e) => onChangeField("pesoPromedio", e.target.value)}
                  disabled={readOnly}
                  placeholder="0.520"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.pesoPromedio
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
                {errors.pesoPromedio && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.pesoPromedio}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label
                  htmlFor="cantTabPorPza"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Cant. de Tab. por Pza.
                </label>
                <input
                  id="cantTabPorPza"
                  type="number"
                  step="1"
                  value={values.cantTabPorPza ?? "1"}
                  onChange={(e) => onChangeField("cantTabPorPza", e.target.value)}
                  disabled={readOnly}
                  placeholder="1"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
              </div>

              <div>
                <label
                  htmlFor="muestrasTabRecub"
                  className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
                >
                  Muestras Tab / Recub <span className="text-red-500">*</span>
                </label>
                <input
                  id="muestrasTabRecub"
                  type="number"
                  step="1"
                  value={values.muestrasTabRecub ?? ""}
                  onChange={(e) => onChangeField("muestrasTabRecub", e.target.value)}
                  disabled={readOnly}
                  placeholder="500"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.muestrasTabRecub
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
                {errors.muestrasTabRecub && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.muestrasTabRecub}
                  </p>
                )}
              </div>
            </div>

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
                  type="number"
                  step="1"
                  value={values.cantPzasCargarSap ?? ""}
                  onChange={(e) => onChangeField("cantPzasCargarSap", e.target.value)}
                  disabled={readOnly}
                  placeholder="477884"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.cantPzasCargarSap
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
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
                  type="number"
                  step="1"
                  value={values.cantPzasAcondicionar ?? ""}
                  onChange={(e) => onChangeField("cantPzasAcondicionar", e.target.value)}
                  disabled={readOnly}
                  placeholder="475000"
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.cantPzasAcondicionar
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
                {errors.cantPzasAcondicionar && (
                  <p className="mt-1 text-[11px] text-red-600 font-medium">
                    {errors.cantPzasAcondicionar}
                  </p>
                )}
              </div>
            </div>

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
                    type="number"
                    step="0.1"
                    value={values.rendimientoTab ?? ""}
                    onChange={(e) => onChangeField("rendimientoTab", e.target.value)}
                    disabled={readOnly}
                    placeholder="99.4"
                    className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono font-bold ${
                      readOnly
                        ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                        : errors.rendimientoTab
                        ? "border-red-400 bg-red-50/30 text-slate-900"
                        : "border-slate-300 bg-white hover:border-slate-400"
                    }`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-bold">
                    %
                  </span>
                </div>
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
                  className={`w-full px-3 py-2 text-xs border rounded-lg transition font-mono ${
                    readOnly
                      ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                      : errors.ctecGranelSap
                      ? "border-red-400 bg-red-50/30 text-slate-900"
                      : "border-slate-300 bg-white hover:border-slate-400"
                  }`}
                />
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
        <div className="border-b border-slate-100 pb-2.5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            3. Tiempos de Fabricación (Tableteado y Recubrimiento)
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Registro cronológico de inicio, fin de tableteado y etapas de recubrimiento.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div>
            <label
              htmlFor="fechaInicioTableteado"
              className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
            >
              Inicio Tableteado <span className="text-red-500">*</span>
            </label>
            <input
              id="fechaInicioTableteado"
              type="datetime-local"
              value={values.fechaInicioTableteado || ""}
              onChange={(e) => onChangeField("fechaInicioTableteado", e.target.value)}
              disabled={readOnly}
              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${
                readOnly
                  ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                  : errors.fechaInicioTableteado
                  ? "border-red-400 bg-red-50/30 text-slate-900"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            />
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
            <input
              id="fechaFinTableteado"
              type="datetime-local"
              value={values.fechaFinTableteado || ""}
              onChange={(e) => onChangeField("fechaFinTableteado", e.target.value)}
              disabled={readOnly}
              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${
                readOnly
                  ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                  : errors.fechaFinTableteado
                  ? "border-red-400 bg-red-50/30 text-slate-900"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            />
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
            <input
              id="fechaInicioRecubrimiento"
              type="datetime-local"
              value={values.fechaInicioRecubrimiento || ""}
              onChange={(e) => onChangeField("fechaInicioRecubrimiento", e.target.value)}
              disabled={readOnly}
              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${
                readOnly
                  ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                  : errors.fechaInicioRecubrimiento
                  ? "border-red-400 bg-red-50/30 text-slate-900"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            />
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
            <input
              id="fechaFinPrimeraCarga"
              type="datetime-local"
              value={values.fechaFinPrimeraCarga || ""}
              onChange={(e) => onChangeField("fechaFinPrimeraCarga", e.target.value)}
              disabled={readOnly}
              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${
                readOnly
                  ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                  : errors.fechaFinPrimeraCarga
                  ? "border-red-400 bg-red-50/30 text-slate-900"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            />
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
            <input
              id="fechaFinRecubrimiento"
              type="datetime-local"
              value={values.fechaFinRecubrimiento || ""}
              onChange={(e) => onChangeField("fechaFinRecubrimiento", e.target.value)}
              disabled={readOnly}
              className={`w-full px-2.5 py-1.5 text-xs border rounded-lg transition font-mono ${
                readOnly
                  ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
                  : errors.fechaFinRecubrimiento
                  ? "border-red-400 bg-red-50/30 text-slate-900"
                  : "border-slate-300 bg-white hover:border-slate-400"
              }`}
            />
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
