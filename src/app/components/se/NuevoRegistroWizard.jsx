"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CapturaCantidades from "./CapturaCantidades";
import DatosGeneralesSE from "./DatosGeneralesSE";
import Icon from "../ui/Icon";

const DRAFT_STORAGE_KEY = "se_form_draft";
const DRAFT_SESSION_KEY = "se_draft_session_active";

const INITIAL_STATE = {
  ordenGranel: "",
  lote: "",
  codigoMaterial: "",
  producto: "",
  tamanoLoteEstandar: "",
  supervisorPreparacion: "",
  supervisorTabRecub: "",
  pesoNetoTotalTabletas: 0,
  pesoPromedio: "",
  cantTabPorPza: "1",
  cantPzasCargarSap: "",
  cantPzasAcondicionar: "",
  muestrasTabRecub: "",
  rendimientoTab: "",
  ctecGranelSap: "",
  fechaInicioTableteado: "",
  fechaFinTableteado: "",
  fechaInicioRecubrimiento: "",
  fechaFinPrimeraCarga: "",
  fechaFinRecubrimiento: "",
  pesos: Array.from({ length: 48 }, () => ({
    pesoBruto: "",
    pesoTara: "2.10",
    pesoNeto: 0,
  })),
};

export default function NuevoRegistroWizard() {
  const router = useRouter();

  // Paso activo: 1 = Número de orden, 2 = Cantidades, 3 = Datos técnicos
  const [currentStep, setCurrentStep] = useState(1);

  // Form values
  const [values, setValues] = useState(INITIAL_STATE);
  const [formErrors, setFormErrors] = useState({});

  // Verificación paso 1
  const [isCheckingOrden, setIsCheckingOrden] = useState(false);
  const [ordenExistenteInfo, setOrdenExistenteInfo] = useState(null); // { exists: true, registro: {...} }
  const [ordenError, setOrdenError] = useState("");

  // Modo plantilla y post-guardado
  const [templateMode, setTemplateMode] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Notificar cambio de borrador para Sidebar
  const notifyDraftUpdate = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("se-draft-update"));
    }
  }, []);

  // Verificar borrador al montar el componente
  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(DRAFT_STORAGE_KEY) ||
        sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw);
      const hasContent = Boolean(
        parsed.ordenGranel ||
          parsed.lote ||
          parsed.producto ||
          (parsed.pesos && parsed.pesos.some((p) => Number(p.pesoBruto) > 0))
      );

      if (!hasContent) return;

      const isSessionActive =
        sessionStorage.getItem(DRAFT_SESSION_KEY) === "true";

      if (isSessionActive) {
        // El usuario está navegando entre menús dentro de la aplicación:
        // Restaurar automáticamente sin mostrar aviso
        setValues((prev) => ({ ...prev, ...parsed }));
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 3) {
          setCurrentStep(parsed.currentStep);
        } else if (parsed.ordenGranel) {
          setCurrentStep(2);
        }
        setHasDraftNotice(false);
      } else {
        // El usuario salió de la aplicación (cerró ventana/pestaña o sesión):
        // Mostrar aviso permitiendo restaurar o empezar de cero
        setHasDraftNotice(true);
      }
    } catch (e) {
      console.error("Error al cargar borrador previo:", e);
    }
  }, []);

  // Guardar en localStorage y sessionStorage en tiempo real
  useEffect(() => {
    // Si hay un aviso pendiente de una sesión previa, no sobrescribir el borrador antes de que decida el usuario
    if (hasDraftNotice) return;

    const hasData =
      Boolean(values.ordenGranel) ||
      Boolean(values.lote) ||
      Boolean(values.producto) ||
      values.pesos.some((p) => Number(p.pesoBruto) > 0);

    if (hasData) {
      const serialized = JSON.stringify({ ...values, currentStep });
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      sessionStorage.setItem(DRAFT_SESSION_KEY, "true");
      notifyDraftUpdate();
    }
  }, [values, currentStep, hasDraftNotice, notifyDraftUpdate]);

  // Protección beforeunload
  useEffect(() => {
    function handleBeforeUnload(e) {
      const hasData =
        Boolean(values.ordenGranel) ||
        Boolean(values.lote) ||
        values.pesos.some((p) => Number(p.pesoBruto) > 0);

      if (hasData && !successBanner) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [values, successBanner]);

  function restaurarBorrador() {
    try {
      const raw =
        localStorage.getItem(DRAFT_STORAGE_KEY) ||
        sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setValues((prev) => ({ ...prev, ...parsed }));
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 3) {
          setCurrentStep(parsed.currentStep);
        } else if (parsed.ordenGranel) {
          setCurrentStep(2);
        }
        sessionStorage.setItem(DRAFT_SESSION_KEY, "true");
        setHasDraftNotice(false);
        notifyDraftUpdate();
      }
    } catch (e) {
      console.error("Error al restaurar borrador:", e);
    }
  }

  function descartarBorrador() {
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
    setHasDraftNotice(false);
    setValues(INITIAL_STATE);
    setCurrentStep(1);
    setOrdenExistenteInfo(null);
    notifyDraftUpdate();
  }

  // Actualización de campos
  function handleChangeField(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  // Actualización de pesos desde CapturaCantidades
  function handlePesosChange(newPesos) {
    const sumaNetos = newPesos.reduce((acc, p) => acc + (Number(p.pesoNeto) || 0), 0);
    setValues((prev) => ({
      ...prev,
      pesos: newPesos,
      pesoNetoTotalTabletas: Number(sumaNetos.toFixed(2)),
    }));
  }

  // PASO 1: Validar y verificar si la orden ya existe (Figma Comentarios 1 y 2)
  async function handleVerificarOrdenYContinuar(e) {
    if (e) e.preventDefault();
    setOrdenError("");
    setOrdenExistenteInfo(null);

    const orden = String(values.ordenGranel || "").trim();
    if (!orden || orden.length < 2) {
      setOrdenError("Por favor ingresa un número de orden válido (mínimo 2 caracteres).");
      return;
    }

    setIsCheckingOrden(true);
    try {
      const res = await fetch(`/api/se/check-orden?orden=${encodeURIComponent(orden)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error al verificar la orden.");
      }

      if (data.exists) {
        // La orden ya existe: Mostrar advertencia y botón de examinar manteniendo el número
        setOrdenExistenteInfo(data);
      } else {
        // Orden disponible: avanzar a captura de cantidades
        setOrdenExistenteInfo(null);
        setCurrentStep(2);
      }
    } catch (err) {
      setOrdenError(err.message || "Error al consultar la existencia de la orden.");
    } finally {
      setIsCheckingOrden(false);
    }
  }

  // PASO 2 -> PASO 3: Validar que haya al menos 1 pesada válida
  function handleContinuarADatos() {
    const pesadasValidas = values.pesos.filter(
      (p) => Number(p.pesoBruto) > 0 && Number(p.pesoBruto) >= Number(p.pesoTara)
    );

    if (pesadasValidas.length === 0) {
      alert("Debes capturar al menos 1 pesada válida (Peso bruto mayor a la tara) para continuar.");
      return;
    }

    setCurrentStep(3);
  }

  // PASO 3: Guardar Registro Atómicamente
  async function handleGuardarRegistro(e) {
    if (e) e.preventDefault();
    setApiError("");
    setFormErrors({});

    // Validaciones básicas de cliente
    const errors = {};
    if (!values.lote?.trim()) errors.lote = "El número de lote es obligatorio.";
    if (!values.codigoMaterial?.trim()) errors.codigoMaterial = "El código de material es obligatorio.";
    if (!values.producto?.trim()) errors.producto = "El producto es obligatorio.";
    if (!values.tamanoLoteEstandar) errors.tamanoLoteEstandar = "El tamaño de lote estándar es obligatorio.";
    if (!values.supervisorPreparacion?.trim()) errors.supervisorPreparacion = "El supervisor de preparación es obligatorio.";
    if (!values.supervisorTabRecub?.trim()) errors.supervisorTabRecub = "El supervisor de tab/recub es obligatorio.";
    if (!values.pesoPromedio) errors.pesoPromedio = "El peso promedio es obligatorio.";
    if (!values.rendimientoTab) errors.rendimientoTab = "El rendimiento es obligatorio.";
    if (!values.ctecGranelSap?.trim()) errors.ctecGranelSap = "El CTEC Granel SAP es obligatorio.";
    if (!values.fechaInicioTableteado) errors.fechaInicioTableteado = "Requerido.";
    if (!values.fechaFinTableteado) errors.fechaFinTableteado = "Requerido.";
    if (!values.fechaInicioRecubrimiento) errors.fechaInicioRecubrimiento = "Requerido.";
    if (!values.fechaFinPrimeraCarga) errors.fechaFinPrimeraCarga = "Requerido.";
    if (!values.fechaFinRecubrimiento) errors.fechaFinRecubrimiento = "Requerido.";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setApiError("Por favor completa los campos técnicos obligatorios.");
      return;
    }

    // Filtrar únicamente las pesadas capturadas
    const pesadasCapturadas = values.pesos.filter(
      (p) => Number(p.pesoBruto) > 0
    );

    if (pesadasCapturadas.length === 0) {
      setApiError("Debe haber al menos una pesada capturada.");
      return;
    }

    const payload = {
      ...values,
      pesos: pesadasCapturadas.map((p) => ({
        pesoBruto: Number(p.pesoBruto),
        pesoTara: Number(p.pesoTara),
        pesoNeto: Number(p.pesoNeto),
      })),
    };

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/se", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al guardar el registro en la base de datos.");
      }

      // Limpiar borrador temporal
      try {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        sessionStorage.removeItem(DRAFT_STORAGE_KEY);
        sessionStorage.removeItem(DRAFT_SESSION_KEY);
      } catch (e) {
        console.error(e);
      }
      notifyDraftUpdate();

      // Mostrar modal de éxito y opciones post-guardado
      setSuccessBanner({
        record: data,
        message: `¡Orden a Granel ${data.ordenGranel} y lote ${data.lote} guardados exitosamente!`,
      });
    } catch (err) {
      setApiError(err.message || "Error al procesar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // Opciones Post-Guardado (Figma Comentario 6 & nodos 182:10 / 183:13)
  function handleNuevoEnBlanco() {
    setSuccessBanner(null);
    setTemplateMode(false);
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
    notifyDraftUpdate();
    setValues(INITIAL_STATE);
    setCurrentStep(1);
    setOrdenExistenteInfo(null);
  }

  function handleDuplicarPlantilla() {
    if (!successBanner?.record) return;

    const prev = successBanner.record;
    setSuccessBanner(null);
    setTemplateMode(true);

    // Conservar datos generales previos pero limpiar orden, lote, pesadas y rendimiento
    setValues({
      ordenGranel: "",
      lote: "",
      codigoMaterial: prev.codigoMaterial || "",
      producto: prev.producto || "",
      tamanoLoteEstandar: prev.tamanoLoteEstandar || "",
      supervisorPreparacion: prev.supervisorPreparacion || "",
      supervisorTabRecub: prev.supervisorTabRecub || "",
      pesoNetoTotalTabletas: 0,
      pesoPromedio: prev.pesoPromedio || "",
      cantTabPorPza: prev.cantTabPorPza || "1",
      cantPzasCargarSap: prev.cantPzasCargarSap || "",
      cantPzasAcondicionar: "",
      muestrasTabRecub: prev.muestrasTabRecub || "",
      rendimientoTab: "",
      ctecGranelSap: prev.ctecGranelSap || "",
      fechaInicioTableteado: prev.fechaInicioTableteado
        ? new Date(prev.fechaInicioTableteado).toISOString().slice(0, 16)
        : "",
      fechaFinTableteado: prev.fechaFinTableteado
        ? new Date(prev.fechaFinTableteado).toISOString().slice(0, 16)
        : "",
      fechaInicioRecubrimiento: prev.fechaInicioRecubrimiento
        ? new Date(prev.fechaInicioRecubrimiento).toISOString().slice(0, 16)
        : "",
      fechaFinPrimeraCarga: prev.fechaFinPrimeraCarga
        ? new Date(prev.fechaFinPrimeraCarga).toISOString().slice(0, 16)
        : "",
      fechaFinRecubrimiento: prev.fechaFinRecubrimiento
        ? new Date(prev.fechaFinRecubrimiento).toISOString().slice(0, 16)
        : "",
      pesos: Array.from({ length: 48 }, () => ({
        pesoBruto: "",
        pesoTara: "2.10",
        pesoNeto: 0,
      })),
    });

    setCurrentStep(1);
    setOrdenExistenteInfo(null);
  }

  return (
    <div className="space-y-6">
      {/* Aviso de borrador disponible al volver a la aplicación */}
      {hasDraftNotice && (
        <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-300/80 text-amber-950 flex flex-wrap items-center justify-between gap-4 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
              <Icon name="history" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <h4 className="font-bold text-xs sm:text-sm text-amber-950 tracking-tight">
                  Captura previa en curso detectada
                </h4>
              </div>
              <p className="text-xs text-amber-800/90 mt-0.5">
                Se detectaron datos sin finalizar de tu sesión anterior. ¿Deseas recuperarlos o empezar uno nuevo?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={descartarBorrador}
              className="py-2 px-3.5 rounded-lg border border-amber-300/80 bg-white hover:bg-amber-100/60 text-slate-700 text-xs font-semibold transition shadow-2xs"
            >
              Empezar de cero
            </button>
            <button
              type="button"
              onClick={restaurarBorrador}
              className="py-2 px-4 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Icon name="check" size={14} />
              <span>Restaurar captura</span>
            </button>
          </div>
        </div>
      )}

      {/* Banner de Modo Plantilla (Figma Comment 6) */}
      {templateMode && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-900 flex items-start gap-3 shadow-xs animate-in fade-in">
          <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center flex-shrink-0 text-sm">
            ★
          </span>
          <div className="text-xs">
            <p className="font-bold text-sm text-amber-900">
              Modo Edición de Plantilla Activo
            </p>
            <p className="mt-0.5 text-amber-800">
              Se han precargado los parámetros del lote previo. Ingresa el nuevo{" "}
              <strong>Número de Orden</strong> y <strong>Lote</strong>, y captura
              las nuevas cantidades de tableteado.
            </p>
          </div>
        </div>
      )}

      {/* Barra de progreso de los 3 pasos */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Paso 1 */}
          <div
            onClick={() => setCurrentStep(1)}
            className={`flex items-center gap-2 cursor-pointer transition ${
              currentStep === 1
                ? "text-blue-600 font-bold"
                : currentStep > 1
                ? "text-emerald-600 font-medium"
                : "text-slate-400"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 1
                  ? "bg-blue-600 text-white"
                  : currentStep > 1
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {currentStep > 1 ? "✓" : "1"}
            </span>
            <span className="text-xs hidden sm:inline">Número de Orden</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

          {/* Paso 2 */}
          <div
            onClick={() => values.ordenGranel && setCurrentStep(2)}
            className={`flex items-center gap-2 ${
              values.ordenGranel ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            } transition ${
              currentStep === 2
                ? "text-blue-600 font-bold"
                : currentStep > 2
                ? "text-emerald-600 font-medium"
                : "text-slate-400"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 2
                  ? "bg-blue-600 text-white"
                  : currentStep > 2
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {currentStep > 2 ? "✓" : "2"}
            </span>
            <span className="text-xs hidden sm:inline">Captura de Cantidades</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

          {/* Paso 3 */}
          <div
            onClick={() => values.ordenGranel && setCurrentStep(3)}
            className={`flex items-center gap-2 ${
              values.ordenGranel ? "cursor-pointer" : "cursor-not-allowed opacity-60"
            } transition ${
              currentStep === 3
                ? "text-blue-600 font-bold"
                : "text-slate-400"
            }`}
          >
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                currentStep === 3
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              3
            </span>
            <span className="text-xs hidden sm:inline">Datos Técnicos</span>
          </div>
        </div>
      </div>

      {/* Alerta de error global */}
      {apiError && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
          <span>⚠</span>
          <span>{apiError}</span>
        </div>
      )}

      {/* CONTENIDO DEL PASO ACTIVO */}

      {/* PASO 1: Captura y Verificación de Número de Orden (Figma 4:86 / 69:139) */}
      {currentStep === 1 && (
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-slate-200 shadow-xs max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-1">
            <h2 className="text-lg font-bold text-slate-900">
              Paso 1: Número de Orden a Granel
            </h2>
            <p className="text-xs text-slate-500">
              Ingresa el número de orden asignado en la orden de producción.
            </p>
          </div>

          <form onSubmit={handleVerificarOrdenYContinuar} className="space-y-4">
            <div>
              <label
                htmlFor="inputOrdenGranel"
                className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1"
              >
                Número de Orden <span className="text-red-500">*</span>
              </label>
              <input
                id="inputOrdenGranel"
                type="text"
                autoFocus
                placeholder="ej. 4000137523"
                value={values.ordenGranel}
                onChange={(e) => {
                  handleChangeField("ordenGranel", e.target.value);
                  setOrdenExistenteInfo(null);
                  setOrdenError("");
                }}
                className="w-full px-4 py-3 text-sm font-mono font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {ordenError && (
                <p className="mt-1.5 text-xs text-red-600 font-medium">
                  {ordenError}
                </p>
              )}
            </div>

            {/* Aviso si la orden ya existe (Figma 69:139 - Comentario 2) */}
            {ordenExistenteInfo && (
              <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-950 space-y-3 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg font-bold text-amber-700">⚠️</span>
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-amber-900">
                      La orden ya ha sido registrada anteriormente
                    </h4>
                    <p className="text-xs text-amber-800 mt-0.5">
                      La orden a granel <strong>{ordenExistenteInfo.registro?.ordenGranel}</strong>{" "}
                      ya se encuentra registrada en el sistema (Lote: {ordenExistenteInfo.registro?.lote}).
                    </p>
                    <p className="text-[11px] text-amber-700 mt-1">
                      Si cometiste un error tipográfico, puedes corregir el número arriba. Si deseas consultar el registro existente, pulsa &quot;Examinar&quot;.
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-amber-200 flex justify-end">
                  <Link
                    href={`/se/${encodeURIComponent(ordenExistenteInfo.registro?.ordenGranel)}`}
                    className="py-1.5 px-4 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5"
                  >
                    <Icon name="search" size={13} />
                    <span>Examinar registro existente</span>
                  </Link>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isCheckingOrden || !values.ordenGranel?.trim()}
                className="py-2.5 px-6 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] disabled:opacity-50 text-white font-bold text-xs transition shadow-sm flex items-center gap-2"
              >
                {isCheckingOrden ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <span>Siguiente: Captura de cantidades</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* PASO 2: Captura de Cantidades (Figma 49:3) */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                Paso 2 de 3
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Captura de Cantidades · Orden {values.ordenGranel}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
              >
                ← Volver al Paso 1
              </button>
              <button
                type="button"
                onClick={handleContinuarADatos}
                className="py-1.5 px-4 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-xs transition"
              >
                Siguiente: Datos Técnicos →
              </button>
            </div>
          </div>

          {/* Tabla de 48 pesadas */}
          <CapturaCantidades
            pesos={values.pesos}
            onChangePesos={handlePesosChange}
            readOnly={false}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={handleContinuarADatos}
              className="py-2.5 px-6 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-sm transition"
            >
              Continuar a Datos Técnicos →
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: Captura de Datos Técnicos (Figma 22:188) */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                Paso 3 de 3
              </span>
              <h2 className="text-base font-bold text-slate-900">
                Datos Técnicos del Lote · Orden {values.ordenGranel}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition"
              >
                ← Volver a Cantidades
              </button>
              <button
                type="button"
                onClick={handleGuardarRegistro}
                disabled={isSubmitting}
                className="py-1.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              >
                {isSubmitting ? "Guardando..." : "Guardar Registro SE"}
              </button>
            </div>
          </div>

          {/* Formulario Técnico con Autocompletados */}
          <DatosGeneralesSE
            values={values}
            onChangeField={handleChangeField}
            errors={formErrors}
            readOnly={false}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              ← Volver a Cantidades
            </button>
            <button
              type="button"
              onClick={handleGuardarRegistro}
              disabled={isSubmitting}
              className="py-2.5 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
            >
              {isSubmitting ? "Guardando..." : "✓ Confirmar y Guardar Registro"}
            </button>
          </div>
        </div>
      )}

      {/* MODAL DE ÉXITO Y DUPLICACIÓN POST-GUARDADO (Figma Comment 6 & 182:10 / 183:13) */}
      {successBanner && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden p-6 sm:p-7 space-y-5 animate-in zoom-in-95">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-2xl font-black">
                ✓
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                ¡Registro guardado con éxito!
              </h3>
              <p className="text-xs text-slate-600">
                {successBanner.message}
              </p>
              <div className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg inline-block font-mono text-xs text-slate-800">
                Orden: <strong>{successBanner.record?.ordenGranel}</strong> · Lote:{" "}
                <strong>{successBanner.record?.lote}</strong>
              </div>
            </div>

            <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-center space-y-1">
              <p className="text-xs font-bold text-blue-900">
                ¿Desea seguir agregando registros a partir de este último?
              </p>
              <p className="text-[11px] text-blue-700">
                Puedes reutilizar los datos comunes como plantilla o comenzar una captura desde cero.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleNuevoEnBlanco}
                className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-xs text-center"
              >
                Nuevo en blanco
              </button>
              <button
                type="button"
                onClick={handleDuplicarPlantilla}
                className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm text-center"
              >
                Duplicar registro (Plantilla)
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100 text-center">
              <Link
                href={`/se/${encodeURIComponent(successBanner.record?.ordenGranel)}`}
                className="text-xs text-[#0d6efd] hover:underline font-semibold"
              >
                Examinar registro guardado →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
