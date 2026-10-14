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
    pesoTara: "",
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
  const [templateBaseline, setTemplateBaseline] = useState(null); // Valores base precargados de la plantilla para comparar cambios
  const [ultimoRegistroGuardado, setUltimoRegistroGuardado] = useState(null);
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

  // Cargar el último registro guardado para permitir rellenar plantilla (Item 14)
  useEffect(() => {
    fetch("/api/se")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          const sorted = [...data].sort(
            (a, b) => new Date(b.fechaCreacion) - new Date(a.fechaCreacion)
          );
          setUltimoRegistroGuardado(sorted[0]);
        }
      })
      .catch((err) => console.error("Error al obtener último registro:", err));
  }, []);

  // Cálculo automático y en tiempo real de Cant. SAP, Acondicionar y Rendimiento (Items 9, 10, 11)
  useEffect(() => {
    const pesoNeto = Number(values.pesoNetoTotalTabletas) || 0;
    const pesoProm = Number(values.pesoPromedio) || 0;
    const cantTabPorPza = Number(values.cantTabPorPza) || 1;
    const tamanoLote = Number(values.tamanoLoteEstandar) || 0;

    let cantSap = "";
    let cantAcond = "";
    let rend = "";

    if (pesoNeto > 0 && pesoProm > 0) {
      // 9. CANT. PZAS A CARGAR EN SAP = Math.floor((PESO NETO TOTAL * 1000) / PESO PROMEDIO)
      // Se redondea hacia abajo a entero, sin decimales
      const piezas = Math.floor((pesoNeto * 1000) / pesoProm);
      cantSap = piezas;

      // 10. CANT. PZAS A ACONDICIONAR = Math.floor(CANT. PZAS A CARGAR EN SAP / CANT DE TAB. POR PZA)
      // Se redondea hacia abajo a entero, sin decimales
      if (cantTabPorPza > 0) {
        cantAcond = Math.floor(piezas / cantTabPorPza);
      }

      // 11 y 10. RENDIMIENTO TAB = ((PESO NETO TOTAL / PESO PROMEDIO) / TAMAÑO DEL LOTE ESTANDAR)
      // Formato como porcentaje realista (ej. 92.5%, nunca 92456.3%)
      if (tamanoLote > 0) {
        let r =
          tamanoLote > 1000
            ? (piezas / tamanoLote) * 100
            : (pesoNeto / tamanoLote) * 100;
        while (r > 500) {
          r = r / 1000;
        }
        rend = Number(r.toFixed(1));
      }
    }

    setValues((prev) => {
      if (
        prev.cantPzasCargarSap === cantSap &&
        prev.cantPzasAcondicionar === cantAcond &&
        prev.rendimientoTab === rend
      ) {
        return prev;
      }
      return {
        ...prev,
        cantPzasCargarSap: cantSap,
        cantPzasAcondicionar: cantAcond,
        rendimientoTab: rend,
      };
    });
  }, [
    values.pesoNetoTotalTabletas,
    values.pesoPromedio,
    values.cantTabPorPza,
    values.tamanoLoteEstandar,
  ]);

  // Helper para verificar si un campo no ha cambiado respecto a la plantilla base (Punto 5)
  const isUnmodifiedField = useCallback(
    (field) => {
      if (!templateMode || !templateBaseline) return false;
      const currentVal = values[field];
      const baseVal = templateBaseline[field];
      if (currentVal === undefined || currentVal === null || String(currentVal).trim() === "") {
        return false;
      }
      return String(currentVal).trim() === String(baseVal ?? "").trim();
    },
    [templateMode, templateBaseline, values]
  );

  // Cancelar Modo Edición de Plantilla y borrar por completo el registro (Punto 4)
  function handleCancelarPlantilla() {
    setTemplateMode(false);
    setTemplateBaseline(null);
    setValues(INITIAL_STATE);
    setCurrentStep(1);
    setOrdenExistenteInfo(null);
    setOrdenError("");
    try {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      sessionStorage.removeItem(DRAFT_SESSION_KEY);
    } catch (e) {
      console.error(e);
    }
    notifyDraftUpdate();
  }

  function handleRellenarConUltimoRegistro() {
    if (!ultimoRegistroGuardado) return;
    const prev = { ...ultimoRegistroGuardado };
    setTemplateMode(true);
    setTemplateBaseline(prev);
    setValues((curr) => ({
      ...curr,
      ordenGranel: prev.ordenGranel || "",
      lote: prev.lote || "",
      codigoMaterial: prev.codigoMaterial || "",
      producto: prev.producto || "",
      tamanoLoteEstandar: prev.tamanoLoteEstandar || "",
      supervisorPreparacion: prev.supervisorPreparacion || "",
      supervisorTabRecub: prev.supervisorTabRecub || "",
      pesoPromedio: prev.pesoPromedio || "",
      cantTabPorPza: prev.cantTabPorPza || "1",
      muestrasTabRecub: prev.muestrasTabRecub || "",
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
      pesos:
        prev.pesos && prev.pesos.length > 0
          ? Array.from({ length: 48 }, (_, i) => ({
              pesoBruto: prev.pesos[i]?.pesoBruto ? String(prev.pesos[i].pesoBruto) : "",
              pesoTara: prev.pesos[i]?.pesoTara !== undefined && prev.pesos[i]?.pesoTara !== null ? String(prev.pesos[i].pesoTara) : "",
              pesoNeto: Number(prev.pesos[i]?.pesoNeto) || 0,
            }))
          : curr.pesos,
      pesoNetoTotalTabletas: Number(prev.pesoNetoTotalTabletas) || curr.pesoNetoTotalTabletas || 0,
    }));
  }

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
        if (parsed.templateMode) setTemplateMode(Boolean(parsed.templateMode));
        if (parsed.templateBaseline) setTemplateBaseline(parsed.templateBaseline);
        if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 3) {
          setCurrentStep(parsed.currentStep);
        } else if (parsed.ordenGranel && Number(parsed.currentStep) >= 2) {
          setCurrentStep(2);
        }
        setHasDraftNotice(false);
      } else if (Number(parsed.currentStep) >= 2) {
        // El usuario salió de la aplicación: solo mostrar aviso si la captura estaba en el Paso 2 o superior
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
      const serialized = JSON.stringify({
        ...values,
        currentStep,
        templateMode,
        templateBaseline,
      });
      localStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      sessionStorage.setItem(DRAFT_STORAGE_KEY, serialized);
      sessionStorage.setItem(DRAFT_SESSION_KEY, "true");
      notifyDraftUpdate();
    }
  }, [values, currentStep, hasDraftNotice, notifyDraftUpdate, templateMode, templateBaseline]);

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
        if (parsed.templateMode) setTemplateMode(Boolean(parsed.templateMode));
        if (parsed.templateBaseline) setTemplateBaseline(parsed.templateBaseline);
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
    setTemplateMode(false);
    setTemplateBaseline(null);
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
      return false;
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
        return false;
      } else {
        // Orden disponible: avanzar a captura de cantidades
        setOrdenExistenteInfo(null);
        setCurrentStep(2);
        return true;
      }
    } catch (err) {
      setOrdenError(err.message || "Error al consultar la existencia de la orden.");
      return false;
    } finally {
      setIsCheckingOrden(false);
    }
  }

  // PASO 2 -> PASO 3: Validar que haya al menos 1 pesada válida, tara ingresada manualmente y no mayor a bruto (Items 7 y 8)
  function handleContinuarADatos() {
    const pesadasConBruto = values.pesos
      .map((p, idx) => ({ ...p, originalIndex: idx + 1 }))
      .filter((p) => p.pesoBruto !== "" && !isNaN(Number(p.pesoBruto)) && Number(p.pesoBruto) > 0);

    if (pesadasConBruto.length === 0) {
      alert("Debes capturar al menos 1 pesada válida (con Peso Bruto mayor a 0) para continuar.");
      return false;
    }

    // Punto 7 y 8: No dejar continuar si un peso bruto no tiene registrado su peso tara manualmente o si tara > bruto o < 0
    for (const p of pesadasConBruto) {
      if (p.pesoTara === "" || p.pesoTara === null || p.pesoTara === undefined) {
        alert(
          `La pesada #${p.originalIndex} tiene un peso bruto capturado (${p.pesoBruto} kg) pero no tiene peso tara registrado.\n\nDebes ingresar manualmente la tara en esa casilla (ingresa 0 si no aplica tara).`
        );
        return false;
      }
      const numTara = Number(p.pesoTara);
      const numBruto = Number(p.pesoBruto);
      if (isNaN(numTara) || numTara < 0) {
        alert(`La pesada #${p.originalIndex} tiene un valor de tara inválido o negativo.`);
        return false;
      }
      if (numTara > numBruto) {
        alert(
          `La pesada #${p.originalIndex} tiene un peso tara (${numTara} kg) mayor a su peso bruto (${numBruto} kg).\n\nEl peso tara no puede ser mayor al peso bruto.`
        );
        return false;
      }
    }

    setCurrentStep(3);
    return true;
  }

  // Navegación interactiva por los pasos superiores con validaciones
  async function handleStepClick(targetStep) {
    if (targetStep === currentStep || isCheckingOrden) return;

    if (targetStep === 1) {
      // Regresar al paso 1 siempre está permitido
      setCurrentStep(1);
      return;
    }

    if (targetStep === 2) {
      if (currentStep === 1) {
        // Si está en el paso 1, ejecutar validación de orden existente
        const ok = await handleVerificarOrdenYContinuar();
        if (!ok) return;
      } else {
        setCurrentStep(2);
      }
      return;
    }

    if (targetStep === 3) {
      if (currentStep === 1) {
        // Primero validar orden del paso 1
        const ok = await handleVerificarOrdenYContinuar();
        if (!ok) return;
        // Luego validar que haya pesadas capturadas
        const canGoTo3 = handleContinuarADatos();
        if (!canGoTo3) {
          // Si no hay pesadas, se queda en el paso 2
          return;
        }
      } else if (currentStep === 2) {
        handleContinuarADatos();
      }
    }
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
    setTemplateBaseline({ ...prev });

    // Conservar datos generales previos incluyendo orden y lote como plantilla base (Punto 5)
    setValues({
      ordenGranel: prev.ordenGranel || "",
      lote: prev.lote || "",
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
        pesoTara: "",
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

      {/* Banner de Modo Plantilla (Items 4 y 5) */}
      {templateMode && (
        <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/95 border-2 border-blue-400 text-blue-950 flex flex-wrap items-start justify-between gap-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3.5 max-w-2xl">
            <span className="w-9 h-9 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center shrink-0 text-sm shadow-xs">
              ★
            </span>
            <div className="text-xs space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-bold text-sm text-blue-950">
                  Modo Edición de Plantilla Activo
                </p>
                <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 font-bold text-[10px] tracking-wide">
                  Marco azul iluminado = Campo no modificado
                </span>
              </div>
              <p className="text-blue-900 leading-relaxed">
                Se han precargado los datos del registro anterior para agilizar la captura. Recuerda cambiar los datos necesarios como <strong>Número de Orden</strong> y <strong>Lote</strong>, así como los datos técnicos que varíen.
              </p>
              <div className="flex items-start gap-2 pt-1 text-[11px] text-blue-800">
                <span className="inline-block w-3 h-3 rounded-xs border-2 border-blue-500 bg-blue-200 shrink-0 shadow-[0_0_6px_rgba(59,130,246,0.6)] mt-0.5" />
                <span>
                  <strong>Indicación para el usuario:</strong> Las casillas que muestran un marco azul iluminado no han cambiado respecto al registro anterior. Por favor revisa cada campo antes de confirmar.
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-center sm:self-start">
            <button
              type="button"
              onClick={handleCancelarPlantilla}
              className="py-2 px-3.5 rounded-lg border border-red-300 bg-white hover:bg-red-50 text-red-700 hover:text-red-800 text-xs font-bold transition shadow-2xs flex items-center gap-1.5"
            >
              <Icon name="trash" size={14} />
              <span>Cancelar plantilla (Borrar todo)</span>
            </button>
          </div>
        </div>
      )}

      {/* Barra de progreso de los 3 pasos */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {/* Paso 1 */}
          <div
            onClick={() => handleStepClick(1)}
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
            onClick={() => handleStepClick(2)}
            className={`flex items-center gap-2 cursor-pointer transition ${
              currentStep === 2
                ? "text-blue-600 font-bold"
                : currentStep > 2
                ? "text-emerald-600 font-medium"
                : "text-slate-400 hover:text-slate-600"
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
              {isCheckingOrden && currentStep === 1 ? "..." : currentStep > 2 ? "✓" : "2"}
            </span>
            <span className="text-xs hidden sm:inline">Captura de Cantidades</span>
          </div>

          <div className="flex-1 h-0.5 bg-slate-200 mx-3" />

          {/* Paso 3 */}
          <div
            onClick={() => handleStepClick(3)}
            className={`flex items-center gap-2 cursor-pointer transition ${
              currentStep === 3
                ? "text-blue-600 font-bold"
                : "text-slate-400 hover:text-slate-600"
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

          {/* Opción de rellenar plantilla con el último registro guardado (Item 14) */}
          {ultimoRegistroGuardado && !templateMode && (
            <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                  <Icon name="copy" size={15} />
                </span>
                <div>
                  <p className="font-bold text-blue-950">
                    ¿Deseas reutilizar datos del último registro guardado?
                  </p>
                  <p className="text-[11px] text-blue-800">
                    Orden: <strong>{ultimoRegistroGuardado.ordenGranel}</strong> · {ultimoRegistroGuardado.producto}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleRellenarConUltimoRegistro}
                className="py-1.5 px-3 rounded-lg bg-white border border-blue-300 hover:bg-blue-100/60 text-blue-800 font-bold text-xs shadow-2xs transition"
              >
                Rellenar plantilla
              </button>
            </div>
          )}

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
                className={`w-full px-4 py-3 text-sm font-mono font-bold rounded-lg focus:outline-none transition-all ${
                  isUnmodifiedField("ordenGranel")
                    ? "border-2 border-blue-500 ring-2 ring-blue-400 bg-blue-50/20 shadow-[0_0_10px_rgba(59,130,246,0.45)] text-slate-900"
                    : "border border-slate-300 focus:ring-2 focus:ring-blue-500 text-slate-900"
                }`}
              />
              {isUnmodifiedField("ordenGranel") && (
                <p className="mt-1.5 text-xs text-blue-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Campo idéntico al registro anterior. Modifícalo si este lote corresponde a una nueva orden.</span>
                </p>
              )}
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
                      Si deseas consultar el registro existente, pulsa &quot;Examinar&quot;.
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
                className="py-1.5 px-3.5 rounded-lg bg-[#1a2b45] hover:bg-[#142236] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
              >
                ← Volver al Paso 1
              </button>
              <button
                type="button"
                onClick={handleContinuarADatos}
                className="py-1.5 px-4 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-xs transition"
              >
                Continuar a Datos Técnicos →
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
              className="py-2 px-4 rounded-lg bg-[#1a2b45] hover:bg-[#142236] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
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
                className="py-1.5 px-3.5 rounded-lg bg-[#1a2b45] hover:bg-[#142236] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
              >
                ← Volver a Cantidades
              </button>
              <button
                type="button"
                onClick={handleGuardarRegistro}
                disabled={isSubmitting}
                className="py-1.5 px-5 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition"
              >
                {isSubmitting ? "Guardando..." : "Confirmar y Guardar Registro"}
              </button>
            </div>
          </div>

          {/* Formulario Técnico con Autocompletados */}
          <DatosGeneralesSE
            values={values}
            onChangeField={handleChangeField}
            errors={formErrors}
            readOnly={false}
            isUnmodifiedField={isUnmodifiedField}
          />

          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="py-2 px-4 rounded-lg bg-[#1a2b45] hover:bg-[#142236] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
            >
              ← Volver a Cantidades
            </button>
            <button
              type="button"
              onClick={handleGuardarRegistro}
              disabled={isSubmitting}
              className="py-2.5 px-8 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
            >
              {isSubmitting ? "Guardando..." : "Confirmar y Guardar Registro"}
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
              <p className="text-sm text-slate-700">
                Orden <strong>{successBanner.record?.ordenGranel}</strong> con lote{" "}
                <strong>{successBanner.record?.lote}</strong> guardada exitosamente
              </p>
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
