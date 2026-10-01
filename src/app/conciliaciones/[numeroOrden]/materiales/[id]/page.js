"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "../../../../components/layout/Header";
import Sidebar from "../../../../components/layout/Sidebar";
import StatusBadge from "../../../../components/ui/StatusBadge";
import {
  calcularDiferenciaAH,
  calcularECajaPlegadiza,
  calcularECajaEmpaque,
  calcularEEtiquetaColectiva,
  calcularETableta,
  calcularFCajaPlegadiza,
  calcularFEtiquetaColectiva,
  calcularFTableta,
  calcularGCajaPlegadiza,
  calcularGEtiquetaColectiva,
  calcularGTableta,
  calcularPorcentajeDiferencia,
  calcularTotalRecibido,
  calcularTotalUtilizadoAH,
} from "../../../../../lib/calculosMateriales";
import { actualizarMaterial, obtenerMaterial } from "../../../../../services/materialesService";

const emptyValues = {
  tabletasPorBlister: "",
  blisterPorCaja: "",
  capacidadCajaEmpaque: "",
  cantidadRealAcondicionada: "",
  cantidadSurtidaA: "",
  cantidadAdicionalB: "",
  cantidadDevueltaC: "",
  telecamara: "",
  hermeticidad: "",
  otraMerma: "",
  cajasTomadasMuestra: "",
  resultadoE: "",
  resultadoF: "",
  resultadoG: "",
};

const calculatedMaterialTypes = [
  "TABLETA",
  "CAJA PLEGADIZA",
  "ETIQUETA COLECTIVA",
  "CAJA EMPAQUE",
];

const nonNegativeFields = new Set([
  "cantidadSurtidaA",
  "cantidadAdicionalB",
  "cantidadDevueltaC",
  "cantidadRealAcondicionada",
  "capacidadCajaEmpaque",
  "tabletasPorBlister",
  "blisterPorCaja",
  "telecamara",
  "hermeticidad",
  "otraMerma",
  "cajasTomadasMuestra",
  "cajasUtilizadasArranque",
]);

const negativeQuantityError = "Las cantidades no pueden ser negativas";

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizarValorFormulario(value) {
  return value ?? "";
}

function parseNumeroOpcional(value) {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export default function MaterialCapturePage() {
  const { numeroOrden, id } = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState(null);
  const [values, setValues] = useState(emptyValues);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    obtenerMaterial(id)
      .then((data) => {
        if (!data) {
          setError("Material no encontrado.");
          return;
        }

        if (String(data.conciliacion?.numeroOrden) !== String(numeroOrden)) {
          setError("El material no pertenece a esta conciliación.");
          return;
        }

        const isMaterialTablet = data.descripcion === "TABLETA";
        setMaterial(data);
        setValues({
          tabletasPorBlister: normalizarValorFormulario(data.tabletasPorBlister),
          blisterPorCaja: normalizarValorFormulario(data.blisterPorCaja),
          capacidadCajaEmpaque: normalizarValorFormulario(data.capacidadCajaEmpaque),
          cantidadRealAcondicionada: normalizarValorFormulario(data.cantidadRealAcondicionada),
          cantidadSurtidaA: normalizarValorFormulario(data.cantidadSurtidaA),
          cantidadAdicionalB: isMaterialTablet ? 0 : normalizarValorFormulario(data.cantidadAdicionalB),
          cantidadDevueltaC: isMaterialTablet ? 0 : normalizarValorFormulario(data.cantidadDevueltaC),
          telecamara: normalizarValorFormulario(data.telecamara),
          hermeticidad: normalizarValorFormulario(data.hermeticidad),
          otraMerma: normalizarValorFormulario(data.otraMerma),
          cajasTomadasMuestra: normalizarValorFormulario(data.cajasTomadasMuestra),
          cajasUtilizadasArranque: normalizarValorFormulario(data.cajasUtilizadasArranque),
          resultadoE: normalizarValorFormulario(data.resultadoE),
          resultadoF: normalizarValorFormulario(data.resultadoF),
          resultadoG: normalizarValorFormulario(data.resultadoG),
        });
      })
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [id, numeroOrden]);

  const isTablet = material?.descripcion === "TABLETA";
  const isCajaPlegadiza = material?.descripcion === "CAJA PLEGADIZA";
  const isEtiquetaColectiva = material?.descripcion === "ETIQUETA COLECTIVA";
  const normalizedB = isTablet ? 0 : toNumber(values.cantidadAdicionalB);
  const normalizedC = isTablet ? 0 : toNumber(values.cantidadDevueltaC);
  const totalRecibidaD = isCajaPlegadiza
    ? calcularTotalRecibido(values.cantidadSurtidaA, values.cantidadAdicionalB, values.cantidadDevueltaC)
    : isEtiquetaColectiva
      ? calcularTotalRecibido(values.cantidadSurtidaA, values.cantidadAdicionalB, values.cantidadDevueltaC)
      : calcularTotalRecibido(values.cantidadSurtidaA, normalizedB, normalizedC);
  const tabletaResultadoE = isTablet
    ? calcularETableta(values.cantidadRealAcondicionada, values.tabletasPorBlister)
    : null;
  const tabletaResultadoF = isTablet
    ? calcularFTableta({
      telecamara: values.telecamara,
      hermeticidad: values.hermeticidad,
      otraMerma: values.otraMerma,
      tabletasPorBlister: values.tabletasPorBlister,
    })
    : null;
  const tabletaResultadoG = isTablet
    ? calcularGTableta(values.cajasTomadasMuestra, values.tabletasPorBlister)
    : null;
  const cajaResultadoE = isCajaPlegadiza ? calcularECajaPlegadiza(values.cantidadRealAcondicionada) : null;
  const cajaResultadoF = isCajaPlegadiza ? calcularFCajaPlegadiza(values.otraMerma) : null;
  const cajaResultadoG = isCajaPlegadiza
    ? calcularGCajaPlegadiza(values.cajasTomadasMuestra, values.cajasUtilizadasArranque)
    : null;
  const etiquetaResultadoE = isEtiquetaColectiva
    ? calcularEEtiquetaColectiva(values.cantidadRealAcondicionada, values.capacidadCajaEmpaque)
    : null;

  const operacionEtiquetaE = (() => {
    if (!isEtiquetaColectiva) {
      return "";
    }

    const cantidad =
      values.cantidadRealAcondicionada;

    const capacidad =
      values.capacidadCajaEmpaque;

    const cantidadPendiente =
      cantidad === "" ||
      cantidad === null ||
      cantidad === undefined;

    const capacidadPendiente =
      capacidad === "" ||
      capacidad === null ||
      capacidad === undefined;

    if (
      cantidadPendiente ||
      capacidadPendiente
    ) {
      return "Pendiente de completar datos";
    }

    const cantidadNumero = Number(cantidad);
    const capacidadNumero = Number(capacidad);

    if (capacidadNumero <= 0) {
      return "La capacidad debe ser mayor que cero";
    }

    const division =
      cantidadNumero / capacidadNumero;

    return (
      `${cantidadNumero.toLocaleString("es-MX")} / ` +
      `${capacidadNumero.toLocaleString("es-MX")} = ` +
      `${division.toFixed(2)} | ` +
      `Redondeo físico: ${etiquetaResultadoE} PZA`
    );
  })();
  const etiquetaResultadoF = isEtiquetaColectiva ? calcularFEtiquetaColectiva(values.otraMerma) : null;
  const etiquetaResultadoG = isEtiquetaColectiva ? calcularGEtiquetaColectiva(values.cajasTomadasMuestra) : null;
  const resultadoEVisible = isTablet
    ? tabletaResultadoE
    : isCajaPlegadiza
      ? cajaResultadoE
      : isEtiquetaColectiva
        ? etiquetaResultadoE
        : values.resultadoE;
  const resultadoFVisible = isTablet
    ? tabletaResultadoF
    : isCajaPlegadiza
      ? cajaResultadoF
      : isEtiquetaColectiva
        ? etiquetaResultadoF
        : values.resultadoF;
  const resultadoGVisible = isTablet
    ? tabletaResultadoG
    : isCajaPlegadiza
      ? cajaResultadoG
      : isEtiquetaColectiva
        ? etiquetaResultadoG
        : values.resultadoG;
  const requiresCalculation = calculatedMaterialTypes.includes(material?.descripcion);
  const formulaD = "D = A + B - C";
  const formulaE = material?.descripcion === "CAJA PLEGADIZA"
    ? "E = cantidad real acondicionada"
    : material?.descripcion === "TABLETA"
      ? "E = cantidad real acondicionada × tabletas por blíster"
      : material?.descripcion === "ETIQUETA COLECTIVA"
        ? "E = CEIL(cantidad real acondicionada / capacidad)"
        : material?.descripcion === "CAJA EMPAQUE"
          ? "E = cantidad real acondicionada / capacidad"
          : "E = cálculo manual";
  const totalUtilizadaH = calcularTotalUtilizadoAH(resultadoEVisible, resultadoFVisible, resultadoGVisible);
  const diferencia = calcularDiferenciaAH(totalRecibidaD, totalUtilizadaH);
  const porcentajeDiferencia = calcularPorcentajeDiferencia(totalRecibidaD, diferencia);
  const hasCantidadSurtida = values.cantidadSurtidaA !== "";
  const hasResultados = [resultadoEVisible, resultadoFVisible, resultadoGVisible].every((value) => value !== null && value !== "");
  const totalRecibidaVisible = totalRecibidaD ?? "";
  const totalUtilizadaVisible = totalUtilizadaH ?? "";
  const diferenciaVisible = diferencia ?? "";
  const porcentajeDiferenciaTexto = totalRecibidaD === 0 && hasCantidadSurtida
    ? "No calculable"
    : porcentajeDiferencia === null
      ? ""
      : Number(porcentajeDiferencia).toFixed(2);
  const cajaFaltanValores = [totalRecibidaD, cajaResultadoE, cajaResultadoF, cajaResultadoG, totalUtilizadaH, diferencia]
    .some((value) => value === null);
  const cajaEstado = cajaFaltanValores
    ? "CAPTURA_INCOMPLETA"
    : totalRecibidaD > 0 && porcentajeDiferencia <= 1
      ? "DENTRO_DEL_LIMITE"
      : "FUERA_DEL_LIMITE";
  const etiquetaFaltanValores = [totalRecibidaD, etiquetaResultadoE, etiquetaResultadoF, etiquetaResultadoG, totalUtilizadaH, diferencia]
    .some((value) => value === null);
  const etiquetaEstado = etiquetaFaltanValores
    ? "CAPTURA_INCOMPLETA"
    : Math.abs(diferencia) <= 10
      ? "DENTRO_DEL_LIMITE"
      : "FUERA_DEL_LIMITE";

  function updateValue(field, value) {
    if (isTablet && (field === "cantidadAdicionalB" || field === "cantidadDevueltaC")) {
      return;
    }

    if (nonNegativeFields.has(field) && value !== "" && Number(value) < 0) {
      setError(negativeQuantityError);
      return;
    }

    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setError((currentError) => currentError === negativeQuantityError ? "" : currentError);
  }

  function calculateResultE() {
    let resultadoE = 0;

    if (material.descripcion === "CAJA PLEGADIZA") {
      resultadoE = calcularECajaPlegadiza(values.cantidadSurtidaA);
    } else if (material.descripcion === "TABLETA") {
      const factor = toNumber(values.tabletasPorBlister);
      if (factor <= 0) {
        setError("Indica la cantidad de tabletas en el blíster.");
        return;
      }
      resultadoE = calcularETableta(values.cantidadRealAcondicionada, factor);
    } else if (material.descripcion === "ETIQUETA COLECTIVA") {
      const capacidad = toNumber(values.capacidadCajaEmpaque);
      if (capacidad <= 0) {
        setError("La capacidad debe ser mayor que cero.");
        return;
      }
      resultadoE = calcularEEtiquetaColectiva(values.cantidadRealAcondicionada, capacidad);
    } else if (material.descripcion === "CAJA EMPAQUE") {
      const capacidad = toNumber(values.blisterPorCaja);
      if (capacidad <= 0) {
        setError("Indica la capacidad de cajas plegadizas.");
        return;
      }
      resultadoE = calcularECajaEmpaque(values.cantidadSurtidaA, capacidad).total;
    } else {
      setError("Este material aún usa captura manual de E.");
      return;
    }

    setValues((currentValues) => ({ ...currentValues, resultadoE }));
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const payload = isEtiquetaColectiva
        ? {
          cantidadSurtidaA: parseNumeroOpcional(values.cantidadSurtidaA),
          cantidadAdicionalB: parseNumeroOpcional(values.cantidadAdicionalB),
          cantidadDevueltaC: parseNumeroOpcional(values.cantidadDevueltaC),
          cantidadRealAcondicionada: parseNumeroOpcional(values.cantidadRealAcondicionada),
          capacidadCajaEmpaque: parseNumeroOpcional(values.capacidadCajaEmpaque),
          otraMerma: parseNumeroOpcional(values.otraMerma),
          cajasTomadasMuestra: parseNumeroOpcional(values.cajasTomadasMuestra),
        }
        : {
          ...values,
          cantidadAdicionalB: isTablet ? 0 : parseNumeroOpcional(values.cantidadAdicionalB),
          cantidadDevueltaC: isTablet ? 0 : parseNumeroOpcional(values.cantidadDevueltaC),
          cantidadSurtidaA: parseNumeroOpcional(values.cantidadSurtidaA),
          cantidadRealAcondicionada: parseNumeroOpcional(values.cantidadRealAcondicionada),
          tabletasPorBlister: parseNumeroOpcional(values.tabletasPorBlister),
          blisterPorCaja: parseNumeroOpcional(values.blisterPorCaja),
          resultadoE: requiresCalculation ? parseNumeroOpcional(values.resultadoE) : null,
          resultadoF: parseNumeroOpcional(values.resultadoF),
          resultadoG: parseNumeroOpcional(values.resultadoG),
          totalRecibidaD: hasCantidadSurtida ? totalRecibidaD : null,
          totalUtilizadaH: hasResultados ? totalUtilizadaH : null,
          diferencia: hasCantidadSurtida && hasResultados ? diferencia : null,
          porcentajeDiferencia: hasCantidadSurtida && hasResultados ? porcentajeDiferencia : null,
        };

      if (isTablet) {
        payload.resultadoE = tabletaResultadoE;
        payload.resultadoF = tabletaResultadoF;
        payload.resultadoG = tabletaResultadoG;
        payload.totalRecibidaD = totalRecibidaD;
        payload.totalUtilizadaH = totalUtilizadaH;
        payload.diferencia = diferencia;
        payload.porcentajeDiferencia = porcentajeDiferencia;
      }

      await actualizarMaterial(id, payload);
      router.push(`/conciliaciones/${numeroOrden}`);
    } catch (saveError) {
      setError(saveError.message);
      setSaving(false);
    }
  }

  if (loading) return <div className="app-shell"><Sidebar activeView="inicio" /><main className="main-content"><p>Cargando material...</p></main></div>;
  if (!material) return <div className="app-shell"><Sidebar activeView="inicio" /><main className="main-content"><div className="alert info-alert"><div className="alert-symbol">i</div><div>{error || "Material no encontrado."}</div></div></main></div>;
  if (isTablet) {
    return <TabletaCaptureForm
      material={material}
      numeroOrden={numeroOrden}
      values={values}
      updateValue={updateValue}
      totalRecibida={totalRecibidaVisible}
      resultadoE={tabletaResultadoE}
      resultadoF={tabletaResultadoF}
      resultadoG={tabletaResultadoG}
      totalUtilizada={totalUtilizadaVisible}
      diferencia={diferenciaVisible}
      porcentaje={porcentajeDiferenciaTexto}
      error={error}
      saving={saving}
      onSubmit={handleSubmit}
    />;
  }
  if (isCajaPlegadiza) {
    return <CajaPlegadizaCaptureForm
      material={material}
      numeroOrden={numeroOrden}
      values={values}
      updateValue={updateValue}
      totalRecibida={totalRecibidaVisible}
      resultadoE={cajaResultadoE}
      resultadoF={cajaResultadoF}
      resultadoG={cajaResultadoG}
      totalUtilizada={totalUtilizadaVisible}
      diferencia={diferenciaVisible}
      porcentaje={porcentajeDiferenciaTexto}
      status={cajaEstado}
      error={error}
      saving={saving}
      onSubmit={handleSubmit}
    />;
  }
  
  return (
  <div className="app-shell">
    <Sidebar activeView="inicio" />
    <main className="main-content">
      <Header
        title={`Material: ${material.descripcion}`}
        description={`Orden ${numeroOrden}`}
      />
      <form className="card material-capture-card" onSubmit={handleSubmit}>
        <div className="section-heading">
          <div>
            <h2>Captura de cantidades</h2>
            <p>
              {material.codigoSAP} · {material.unidadMedida}
            </p>
          </div>
          <StatusBadge status={material.estadoMaterial} />
        </div>

        <div className="capture-grid">
          <label>
            A. Cantidad surtida
            <input
              type="number"
              min="0"
              step="any"
              value={values.cantidadSurtidaA ?? ""}
              onChange={(event) =>
                updateValue("cantidadSurtidaA", event.target.value)
              }
            />
          </label>

          <label>
            B. Cantidad adicional
            <input
              type="number"
              min="0"
              step="any"
              value={isTablet ? 0 : values.cantidadAdicionalB ?? ""}
              onChange={(event) =>
                updateValue("cantidadAdicionalB", event.target.value)
              }
              readOnly={isTablet}
            />
          </label>

          <label>
            C. Cantidad devuelta
            <input
              type="number"
              min="0"
              step="any"
              value={isTablet ? 0 : values.cantidadDevueltaC ?? ""}
              onChange={(event) =>
                updateValue("cantidadDevueltaC", event.target.value)
              }
              readOnly={isTablet}
            />
          </label>

          <label>
            D. Total recibida ({formulaD})
            <input
              className="calculated-field"
              type="number"
              value={totalRecibidaVisible}
              readOnly
            />
          </label>

          {material.descripcion === "TABLETA" && (
            <label>
              Tabletas por blíster
              <input
                type="number"
                step="1"
                min="0"
                value={values.tabletasPorBlister ?? ""}
                onChange={(event) =>
                  updateValue("tabletasPorBlister", event.target.value)
                }
              />
            </label>
          )}

          {isEtiquetaColectiva && (
            <>
              <label>
                Cantidad real acondicionada

                <input
                  type="number"
                  step="1"
                  min="0"
                  value={
                    values.cantidadRealAcondicionada ?? ""
                  }
                  onChange={(event) =>
                    updateValue(
                      "cantidadRealAcondicionada",
                      event.target.value
                    )
                  }
                  placeholder="Ej. 70656"
                />

                <small>PZA</small>
              </label>

              <label>
                Capacidad de cajas plegadizas por caja de empaque

                <input
                  type="number"
                  step="1"
                  min="0"
                  value={
                    values.capacidadCajaEmpaque ?? ""
                  }
                  onChange={(event) =>
                    updateValue(
                      "capacidadCajaEmpaque",
                      event.target.value
                    )
                  }
                  placeholder="Ej. 80"
                />

                <small>PZA/caja</small>
              </label>
              {isEtiquetaColectiva && (
                <label>
                  Operación de E

                  <input
                    className="calculated-field"
                    type="text"
                    value={operacionEtiquetaE}
                    readOnly
                  />
                </label>
              )}
            </>
          )}
          <label>
            E. Cantidad utilizada ({formulaE})

            <input
              className="calculated-field"
              type="text"
              value={
                isEtiquetaColectiva
                  ? etiquetaResultadoE === null
                    ? "Pendiente"
                    : `${etiquetaResultadoE.toLocaleString(
                        "es-MX"
                      )} PZA`
                  : values.resultadoE ?? ""
              }
              readOnly
            />

            {!isEtiquetaColectiva &&
              requiresCalculation && (
                <button
                  className="button secondary calculate-button"
                  type="button"
                  onClick={calculateResultE}
                >
                  Calcular E
                </button>
              )}
          </label>
          

          {isEtiquetaColectiva ? (
        <>
          <label>
            Merma registrada en la MBR

            <input
              type="number"
              min="0"
              step="1"
              value={values.otraMerma ?? ""}
              onChange={(event) =>
                updateValue(
                  "otraMerma",
                  event.target.value
                )
              }
              placeholder="Ej. 8"
            />

            <small>PZA</small>
          </label>

          <label>
            Etiquetas tomadas o anexadas como muestra

            <input
              type="number"
              min="0"
              step="1"
              value={values.cajasTomadasMuestra ?? ""}
              onChange={(event) =>
                updateValue(
                  "cajasTomadasMuestra",
                  event.target.value
                )
              }
              placeholder="Ej. 1"
            />

            <small>PZA</small>
          </label>
        </>
      ) : (
        <>
          <label>
            F. Merma

            <input
              type="number"
              step="any"
              value={values.resultadoF ?? ""}
              onChange={(event) =>
                updateValue(
                  "resultadoF",
                  event.target.value
                )
              }
            />
          </label>

          <label>
            G. Muestra

            <input
              type="number"
              step="any"
              value={values.resultadoG ?? ""}
              onChange={(event) =>
                updateValue(
                  "resultadoG",
                  event.target.value
                )
              }
            />
          </label>
        </>
      )}

          <label>
            H. Total utilizada
            <input
              className="calculated-field"
              type="number"
              value={requiresCalculation ? totalUtilizadaVisible : "N/A"}
              readOnly
            />
          </label>

          <label>
            Diferencia (D - H)
            <input
              className="calculated-field"
              type="number"
              value={requiresCalculation ? diferenciaVisible : "N/A"}
              readOnly
            />
          </label>

          <label>
            Porcentaje de diferencia
            <input
              className="calculated-field"
              type="text"
              value={
                requiresCalculation ? porcentajeDiferenciaTexto : "N/A"
              }
              readOnly
            />
          </label>
        </div>

        {error && <p className="field-error">{error}</p>}

        <div className="button-row">
          <button
            className="button primary"
            type="submit"
            disabled={saving}
          >
            {saving ? "Guardando..." : "Guardar captura"}
          </button>
          <Link
            className="button secondary"
            href={`/conciliaciones/${numeroOrden}`}
          >
            Cancelar
          </Link>
        </div>
      </form>
    </main>
  </div>
);
}

function CajaPlegadizaCaptureForm({ material, numeroOrden, values, updateValue, totalRecibida, resultadoE, resultadoF, resultadoG, totalUtilizada, diferencia, porcentaje, status, error, saving, onSubmit }) {
  const display = (value) => value ?? "";
  const formatNumber = (value) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(Number(value));
  const result = (value) => value === null || value === undefined || value === ""
    ? "Pendiente"
    : `${formatNumber(value)} PZA`;
  const safeStatus = status || "CAPTURA_INCOMPLETA";
  const friendlyStatus = {
    CAPTURA_INCOMPLETA: "Captura incompleta",
    DENTRO_DEL_LIMITE: "Dentro del límite",
    FUERA_DEL_LIMITE: "Fuera del límite",
    PENDIENTE_DE_REVISION: "Pendiente de revisión",
  }[safeStatus] || "Captura incompleta";
  const muestraOperation = values.cajasTomadasMuestra !== "" && values.cajasUtilizadasArranque !== ""
    ? `${formatNumber(values.cajasTomadasMuestra)} + ${formatNumber(values.cajasUtilizadasArranque)} = ${formatNumber(resultadoG)} PZA`
    : "Pendiente de completar datos";
  const porcentajeVisible = porcentaje === ""
    ? "Pendiente"
    : porcentaje === "No calculable"
      ? porcentaje
      : `${Number(porcentaje).toFixed(2)} %`;

  return <div className="app-shell"><Sidebar activeView="inicio" /><main className="main-content"><Header title={`Material: ${material.descripcion}`} description={`Orden ${numeroOrden}`} /><form className="card material-capture-card" onSubmit={onSubmit}><div className="section-heading"><div><h2>Captura de CAJA PLEGADIZA</h2><p>{material.codigoSAP} · {material.unidadMedida}</p></div><span className={`status-badge status-${safeStatus.toLowerCase()}`}>{friendlyStatus}</span></div><div className="capture-grid"><h3 className="capture-section-title">Cantidad recibida</h3><label>A. Cantidad surtida<input type="number" min="0" step="any" value={display(values.cantidadSurtidaA)} onChange={(event) => updateValue("cantidadSurtidaA", event.target.value)} /></label><label>B. Cantidad adicional<input type="number" min="0" step="any" value={display(values.cantidadAdicionalB)} onChange={(event) => updateValue("cantidadAdicionalB", event.target.value)} /></label><label>C. Cantidad devuelta<input type="number" min="0" step="any" value={display(values.cantidadDevueltaC)} onChange={(event) => updateValue("cantidadDevueltaC", event.target.value)} /></label><label>D. Total recibida<input className="calculated-field" type="text" value={result(totalRecibida)} readOnly /></label><h3 className="capture-section-title">Cantidad utilizada E</h3><label>Cantidad real acondicionada<input type="number" min="0" step="any" value={display(values.cantidadRealAcondicionada)} onChange={(event) => updateValue("cantidadRealAcondicionada", event.target.value)} /></label><label>E. Cantidad utilizada<input className="calculated-field" type="text" value={result(resultadoE)} readOnly /></label><h3 className="capture-section-title">Merma F</h3><label>Merma registrada en la MBR<input type="number" min="0" step="any" value={display(values.otraMerma)} onChange={(event) => updateValue("otraMerma", event.target.value)} /></label><label>F. Merma total<input className="calculated-field" type="text" value={result(resultadoF)} readOnly /></label><h3 className="capture-section-title">Muestra G</h3><label>Cajas tomadas como muestra<input type="number" min="0" step="any" value={display(values.cajasTomadasMuestra)} onChange={(event) => updateValue("cajasTomadasMuestra", event.target.value)} /></label><label>Cajas utilizadas en arranque<input type="number" min="0" step="any" value={display(values.cajasUtilizadasArranque)} onChange={(event) => updateValue("cajasUtilizadasArranque", event.target.value)} /></label><label>Operación<input className="calculated-field" value={muestraOperation} readOnly /></label><label>G. Cantidad de muestra<input className="calculated-field" type="text" value={result(resultadoG)} readOnly /></label><h3 className="capture-section-title">Resultado final</h3><label>H. Total utilizada<input className="calculated-field" type="text" value={result(totalUtilizada)} readOnly /></label><label>Diferencia<input className="calculated-field" type="text" value={result(diferencia)} readOnly /></label><label>Porcentaje de diferencia<input className="calculated-field" type="text" value={porcentajeVisible} readOnly /></label><label>Límite permitido<input className="calculated-field" type="text" value="1.00 %" readOnly /></label><label>Estado<input className="calculated-field" type="text" value={friendlyStatus} readOnly /></label></div>{error && <p className="field-error">{error}</p>}<div className="button-row"><button className="button primary" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar captura"}</button><Link className="button secondary" href={`/conciliaciones/${numeroOrden}`}>Cancelar</Link></div></form></main></div>;
}

function TabletaCaptureForm({ material, numeroOrden, values, updateValue, totalRecibida, resultadoE, resultadoF, resultadoG, totalUtilizada, diferencia, porcentaje, error, saving, onSubmit }) {
  const display = (value) => value ?? "";
  const unit = (value) => value === null || value === undefined ? "Pendiente" : value === "" ? "" : `${value} PZA`;

  return <div className="app-shell"><Sidebar activeView="inicio" /><main className="main-content"><Header title={`Material: ${material.descripcion}`} description={`Orden ${numeroOrden}`} /><form className="card material-capture-card" onSubmit={onSubmit}><div className="section-heading"><div><h2>Captura de TABLETA</h2><p>{material.codigoSAP} · {material.unidadMedida}</p></div><StatusBadge status={material.estadoMaterial} /></div><div className="capture-grid"><h3>Cantidad recibida</h3><label>A. Cantidad surtida<input type="number" min="0" step="any" value={display(values.cantidadSurtidaA)} onChange={(event) => updateValue("cantidadSurtidaA", event.target.value)} /></label><label>B. Cantidad adicional<input type="number" min="0" step="any" value="0" readOnly /></label><label>C. Cantidad devuelta<input type="number" min="0" step="any" value="0" readOnly /></label><label>D. Total recibida<input className="calculated-field" type="text" value={unit(totalRecibida)} readOnly /></label><h3>Cantidad utilizada E</h3><label>Cantidad real acondicionada<input type="number" min="0" step="any" value={display(values.cantidadRealAcondicionada)} onChange={(event) => updateValue("cantidadRealAcondicionada", event.target.value)} /></label><label>Tabletas por blíster<input type="number" step="1" min="0" value={display(values.tabletasPorBlister)} onChange={(event) => updateValue("tabletasPorBlister", event.target.value)} /></label><label>Operación<input className="calculated-field" value={`${display(values.cantidadRealAcondicionada)} × ${display(values.tabletasPorBlister)}`} readOnly /></label><label>E. Cantidad utilizada<input className="calculated-field" type="text" value={unit(resultadoE)} readOnly /></label><h3>Merma F</h3><label>Telecámara (blísteres)<input type="number" min="0" step="any" value={display(values.telecamara)} onChange={(event) => updateValue("telecamara", event.target.value)} /></label><label>Hermeticidad (blísteres)<input type="number" min="0" step="any" value={display(values.hermeticidad)} onChange={(event) => updateValue("hermeticidad", event.target.value)} /></label><label>Otra merma (tabletas)<input type="number" min="0" step="any" value={display(values.otraMerma)} onChange={(event) => updateValue("otraMerma", event.target.value)} /></label><label>Desglose<input className="calculated-field" value={`${display(values.telecamara)} × ${display(values.tabletasPorBlister)} + ${display(values.hermeticidad)} × ${display(values.tabletasPorBlister)} + ${display(values.otraMerma)}`} readOnly /></label><label>F. Merma total<input className="calculated-field" type="text" value={unit(resultadoF)} readOnly /></label><h3>Muestra G</h3><label>Cajas tomadas como muestra<input type="number" min="0" step="any" value={display(values.cajasTomadasMuestra)} onChange={(event) => updateValue("cajasTomadasMuestra", event.target.value)} /></label><label>Operación<input className="calculated-field" value={`${display(values.cajasTomadasMuestra)} × ${display(values.tabletasPorBlister)}`} readOnly /></label><label>G. Cantidad de muestra<input className="calculated-field" type="text" value={unit(resultadoG)} readOnly /></label><h3>Resultado final</h3><label>H. Total utilizada<input className="calculated-field" type="text" value={unit(totalUtilizada)} readOnly /></label><label>Diferencia<input className="calculated-field" type="text" value={diferencia === "" ? "" : `${diferencia} PZA`} readOnly /></label><label>Porcentaje<input className="calculated-field" type="text" value={porcentaje === "" ? "" : `${porcentaje} %`} readOnly /></label></div>{error && <p className="field-error">{error}</p>}<div className="button-row"><button className="button primary" type="submit" disabled={saving}>{saving ? "Guardando..." : "Guardar captura"}</button><Link className="button secondary" href={`/conciliaciones/${numeroOrden}`}>Cancelar</Link></div></form></main></div>;
}