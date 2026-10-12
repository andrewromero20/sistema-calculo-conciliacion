"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { registroSESchema } from "@/lib/validations/seSchema";
import PesosTable from "./PesosTable";
import PesosModal from "./PesosModal";
import AuditTrailModal from "./AuditTrailModal";
import Icon from "../ui/Icon";

const DRAFT_STORAGE_KEY = "se_form_draft";

export default function FormularioSE({
  initialData = null,
  isEdit = false,
  readOnly = false,
}) {
  const router = useRouter();

  // Estados de interfaz y flujo
  const [successBanner, setSuccessBanner] = useState(null); // { message, record }
  const [templateMode, setTemplateMode] = useState(false);
  const [hasDraftNotice, setHasDraftNotice] = useState(false);
  const [showPesosModal, setShowPesosModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);
  const [apiError, setApiError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valores por defecto
  const defaultValues = useMemo(() => {
    if (initialData) {
      return {
        ordenGranel: initialData.ordenGranel || "",
        lote: initialData.lote || "",
        codigoMaterial: initialData.codigoMaterial || "",
        producto: initialData.producto || "",
        tamanoLoteEstandar: Number(initialData.tamanoLoteEstandar) || "",
        supervisorPreparacion: initialData.supervisorPreparacion || "",
        supervisorTabRecub: initialData.supervisorTabRecub || "",
        pesoNetoTotalTabletas: Number(initialData.pesoNetoTotalTabletas) || 0,
        pesoPromedio: Number(initialData.pesoPromedio) || "",
        cantPzasCargarSap: Number(initialData.cantPzasCargarSap) || "",
        cantPzasAcondicionar: Number(initialData.cantPzasAcondicionar) || "",
        muestrasTabRecub: Number(initialData.muestrasTabRecub) || "",
        rendimientoTab: Number(initialData.rendimientoTab) || "",
        ctecGranelSap: initialData.ctecGranelSap || "",
        fechaInicioTableteado: initialData.fechaInicioTableteado
          ? new Date(initialData.fechaInicioTableteado).toISOString().slice(0, 16)
          : "",
        fechaFinTableteado: initialData.fechaFinTableteado
          ? new Date(initialData.fechaFinTableteado).toISOString().slice(0, 16)
          : "",
        fechaInicioRecubrimiento: initialData.fechaInicioRecubrimiento
          ? new Date(initialData.fechaInicioRecubrimiento).toISOString().slice(0, 16)
          : "",
        fechaFinPrimeraCarga: initialData.fechaFinPrimeraCarga
          ? new Date(initialData.fechaFinPrimeraCarga).toISOString().slice(0, 16)
          : "",
        fechaFinRecubrimiento: initialData.fechaFinRecubrimiento
          ? new Date(initialData.fechaFinRecubrimiento).toISOString().slice(0, 16)
          : "",
        pesos:
          initialData.pesos && initialData.pesos.length > 0
            ? initialData.pesos.map((p) => ({
                id: p.id,
                pesoBruto: Number(p.pesoBruto),
                pesoTara: Number(p.pesoTara),
                pesoNeto: Number(p.pesoNeto),
              }))
            : [{ pesoBruto: "", pesoTara: 0, pesoNeto: 0 }],
      };
    }

    return {
      ordenGranel: "",
      lote: "",
      codigoMaterial: "",
      producto: "",
      tamanoLoteEstandar: "",
      supervisorPreparacion: "",
      supervisorTabRecub: "",
      pesoNetoTotalTabletas: 0,
      pesoPromedio: "",
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
      pesos: [
        { pesoBruto: "", pesoTara: 2.1, pesoNeto: 0 },
        { pesoBruto: "", pesoTara: 2.1, pesoNeto: 0 },
      ],
    };
  }, [initialData]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(registroSESchema),
    defaultValues,
  });

  const watchedPesos = watch("pesos");
  const formValues = watch();

  // 1. Cálculo automático en cliente: Suma de Pesos Netos -> pesoNetoTotalTabletas
  useEffect(() => {
    if (watchedPesos && Array.isArray(watchedPesos)) {
      const suma = watchedPesos.reduce(
        (acc, p) => acc + (Number(p.pesoNeto) || 0),
        0,
      );
      const sumaRedondeada = Number(suma.toFixed(4));
      setValue("pesoNetoTotalTabletas", sumaRedondeada, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [watchedPesos, setValue]);

  // 2. Persistencia de Borrador en sessionStorage (solo en modo creación)
  useEffect(() => {
    if (initialData || readOnly) return;

    // Verificar si hay borrador previo al montar
    const savedDraft = sessionStorage.getItem(DRAFT_STORAGE_KEY);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        if (parsed.ordenGranel || parsed.lote || parsed.producto) {
          setHasDraftNotice(true);
        }
      } catch {
        // ignore
      }
    }
  }, [initialData, readOnly]);

  // Guardar borrador en tiempo real
  useEffect(() => {
    if (initialData || readOnly) return;

    if (formValues && (formValues.ordenGranel || formValues.lote || formValues.producto)) {
      sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(formValues));
    }
  }, [formValues, initialData, readOnly]);

  // 3. Prevención de pérdida con beforeunload
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (isDirty && !successBanner) {
        e.preventDefault();
        e.returnValue = "";
      }
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, successBanner]);

  function restaurarBorrador() {
    try {
      const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        reset(draft);
        setHasDraftNotice(false);
      }
    } catch (e) {
      console.error("Error al restaurar borrador:", e);
    }
  }

  function descartarBorrador() {
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    setHasDraftNotice(false);
    reset(defaultValues);
  }

  // 4. Lógica de Guardado (POST o PUT)
  const onFormSubmit = async (values) => {
    setApiError("");

    // Si es edición de registro existente, requerimos justificación mediante modal de auditoría
    if (isEdit && initialData) {
      setPendingValues(values);
      setShowAuditModal(true);
      return;
    }

    // Creación nueva
    await executeSave(values);
  };

  const executeSave = async (values, justificacion = null) => {
    setIsSubmitting(true);
    setApiError("");

    try {
      const isUpdating = isEdit && initialData;
      const url = isUpdating
        ? `/api/se/${encodeURIComponent(initialData.ordenGranel)}`
        : "/api/se";

      const method = isUpdating ? "PUT" : "POST";
      const payload = isUpdating ? { ...values, justificacion } : values;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(
          resData.error ||
            "Error al guardar el registro. Se canceló la transacción.",
        );
      }

      // Limpiar borrador temporal si existía
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setHasDraftNotice(false);
      setShowAuditModal(false);

      const savedRecord = isUpdating ? resData.registro : resData;

      // Mostrar banner de éxito
      setSuccessBanner({
        message: isUpdating
          ? `¡El registro ${savedRecord.ordenGranel} fue actualizado con éxito y auditado!`
          : `¡Registro de Producto Semielaborado guardado exitosamente con transacción atómica!`,
        record: savedRecord,
      });
    } catch (err) {
      setApiError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Opciones Post-Guardado
  function handleNuevoEnBlanco() {
    setSuccessBanner(null);
    setTemplateMode(false);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    reset(defaultValues);
    if (isEdit) {
      router.push("/se/nuevo");
    }
  }

  function handleDuplicarPlantilla() {
    if (!successBanner?.record) return;

    const prev = successBanner.record;
    setSuccessBanner(null);
    setTemplateMode(true);

    // Duplicar datos pero limpiar orden y lote únicos
    const templateData = {
      ordenGranel: "",
      lote: "",
      codigoMaterial: prev.codigoMaterial,
      producto: prev.producto,
      tamanoLoteEstandar: Number(prev.tamanoLoteEstandar),
      supervisorPreparacion: prev.supervisorPreparacion,
      supervisorTabRecub: prev.supervisorTabRecub,
      pesoNetoTotalTabletas: Number(prev.pesoNetoTotalTabletas),
      pesoPromedio: Number(prev.pesoPromedio),
      cantPzasCargarSap: Number(prev.cantPzasCargarSap),
      cantPzasAcondicionar: Number(prev.cantPzasAcondicionar),
      muestrasTabRecub: Number(prev.muestrasTabRecub),
      rendimientoTab: Number(prev.rendimientoTab),
      ctecGranelSap: prev.ctecGranelSap,
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
        prev.pesos?.map((p) => ({
          pesoBruto: Number(p.pesoBruto),
          pesoTara: Number(p.pesoTara),
          pesoNeto: Number(p.pesoNeto),
        })) || [],
    };

    reset(templateData);
    if (isEdit) {
      router.push("/se/nuevo");
    }
  }

  // Diferencia calculada para el modal de auditoría
  const previewDiff = useMemo(() => {
    if (!initialData || !pendingValues) return {};
    const diff = {};
    const fields = [
      "lote",
      "codigoMaterial",
      "producto",
      "tamanoLoteEstandar",
      "supervisorPreparacion",
      "supervisorTabRecub",
      "pesoNetoTotalTabletas",
      "pesoPromedio",
      "cantPzasCargarSap",
      "cantPzasAcondicionar",
      "muestrasTabRecub",
      "rendimientoTab",
      "ctecGranelSap",
    ];
    for (const f of fields) {
      const vOld = String(initialData[f] ?? "").trim();
      const vNew = String(pendingValues[f] ?? "").trim();
      if (vOld !== vNew) {
        diff[f] = { anterior: initialData[f], nuevo: pendingValues[f] };
      }
    }
    return diff;
  }, [initialData, pendingValues]);

  return (
    <div className="space-y-6">
      {/* Aviso de borrador disponible */}
      {hasDraftNotice && !initialData && (
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-blue-200 text-blue-800 font-bold flex items-center justify-center text-sm">
              ℹ
            </span>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider">
                Borrador pendiente detectado
              </p>
              <p className="text-xs text-blue-700">
                Se encontraron datos guardados temporalmente en tu sesión.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={restaurarBorrador}
              className="py-1.5 px-3 rounded-md bg-[#0d6efd] text-white text-xs font-semibold hover:bg-[#0b5ed7] transition shadow-xs"
            >
              Restaurar borrador
            </button>
            <button
              type="button"
              onClick={descartarBorrador}
              className="py-1.5 px-3 rounded-md border border-slate-300 text-slate-700 text-xs font-medium hover:bg-slate-100 transition"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* Banner de Modo Plantilla (Opción B) */}
      {templateMode && (
        <div className="p-4 rounded-xl bg-amber-50 border-2 border-amber-400 text-amber-900 flex items-start gap-3 shadow-sm animate-in fade-in">
          <span className="w-8 h-8 rounded-full bg-amber-200 text-amber-800 font-bold flex items-center justify-center flex-shrink-0">
            ★
          </span>
          <div className="text-xs">
            <p className="font-bold text-sm text-amber-900">
              Modo Edición de Plantilla Activo
            </p>
            <p className="mt-0.5 text-amber-800">
              Se han cargado los parámetros del lote previo como plantilla. Por
              favor ingresa el nuevo <strong>Número de Orden a Granel</strong> y{" "}
              <strong>Lote</strong> antes de guardar.
            </p>
          </div>
        </div>
      )}

      {/* Banner/Toast de Confirmación Post-Guardado */}
      {successBanner && (
        <div className="p-6 rounded-xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-md space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              ✓
            </div>
            <div>
              <h3 className="font-bold text-base text-emerald-900">
                Operación Exitosa
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                {successBanner.message}
              </p>
              <div className="mt-2 text-xs font-mono bg-white/70 px-3 py-1.5 rounded border border-emerald-200 inline-block">
                Orden Granel: <strong>{successBanner.record?.ordenGranel}</strong> · Lote: <strong>{successBanner.record?.lote}</strong>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-emerald-200">
            <p className="text-xs font-bold text-emerald-900 uppercase tracking-wider mb-2">
              ¿Cómo deseas continuar?
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleNuevoEnBlanco}
                className="py-2 px-4 rounded-lg bg-white border border-emerald-300 text-emerald-900 hover:bg-emerald-100 text-xs font-bold transition shadow-xs flex items-center gap-1.5"
              >
                <span>Opción A: Nuevo en blanco</span>
              </button>
              <button
                type="button"
                onClick={handleDuplicarPlantilla}
                className="py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition shadow-sm flex items-center gap-1.5"
              >
                <span>Opción B: Duplicar registro anterior (Plantilla)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de error de API */}
      {apiError && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <span className="font-bold text-red-500 text-sm">!</span>
          <div>
            <p className="font-bold">Error en la transacción:</p>
            <p className="mt-0.5">{apiError}</p>
          </div>
        </div>
      )}

      {/* Formulario Principal */}
      <form
        onSubmit={handleSubmit(onFormSubmit)}
        className={`bg-white rounded-xl shadow-xs border transition-all ${
          templateMode
            ? "border-2 border-amber-400 bg-amber-50/10"
            : "border-slate-200"
        } p-6 sm:p-8 space-y-8`}
      >
        {/* Sección 1: Datos de Identificación y Producto */}
        <div>
          <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                1. Identificación del Producto y Lote
              </h2>
              <p className="text-xs text-slate-500">
                Claves primarias que vinculan con el área de Producto Terminado (PT).
              </p>
            </div>
            {readOnly && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                Solo lectura
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Orden Granel <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly || isEdit}
                {...register("ordenGranel")}
                placeholder="Ej. OG-900142"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono font-semibold ${
                  errors.ordenGranel
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.ordenGranel && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.ordenGranel.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Lote <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register("lote")}
                placeholder="Ej. L-2601"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono font-semibold ${
                  errors.lote
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.lote && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.lote.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Código Material <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register("codigoMaterial")}
                placeholder="Ej. MAT-TAB-500"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.codigoMaterial
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.codigoMaterial && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.codigoMaterial.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                CTEC Granel SAP <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register("ctecGranelSap")}
                placeholder="Ej. CTEC-GR-0142"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.ctecGranelSap
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.ctecGranelSap && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.ctecGranelSap.message}
                </p>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Producto <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register("producto")}
                placeholder="Ej. Paracetamol 500mg Granel Tableteado"
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.producto
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.producto && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.producto.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Tamaño Lote Estándar (kg) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                disabled={readOnly}
                {...register("tamanoLoteEstandar")}
                placeholder="Ej. 250.00"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.tamanoLoteEstandar
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.tamanoLoteEstandar && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.tamanoLoteEstandar.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Peso Promedio (g/tab) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                disabled={readOnly}
                {...register("pesoPromedio")}
                placeholder="Ej. 0.5200"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.pesoPromedio
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.pesoPromedio && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.pesoPromedio.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección 2: Supervisión y Cantidades */}
        <div>
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-900">
              2. Supervisión, Rendimiento y Cantidades
            </h2>
            <p className="text-xs text-slate-500">
              Personal a cargo y piezas calculadas para carga y acondicionamiento.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Supervisor Preparación <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register("supervisorPreparacion")}
                placeholder="Nombre del supervisor"
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.supervisorPreparacion
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.supervisorPreparacion && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.supervisorPreparacion.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Supervisor Tab / Recub <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                disabled={readOnly}
                {...register("supervisorTabRecub")}
                placeholder="Nombre del supervisor"
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.supervisorTabRecub
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.supervisorTabRecub && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.supervisorTabRecub.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cant. Pzas Cargar SAP <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                disabled={readOnly}
                {...register("cantPzasCargarSap")}
                placeholder="Ej. 477884"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.cantPzasCargarSap
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.cantPzasCargarSap && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.cantPzasCargarSap.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Cant. Pzas Acondicionar <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                disabled={readOnly}
                {...register("cantPzasAcondicionar")}
                placeholder="Ej. 475000"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.cantPzasAcondicionar
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.cantPzasAcondicionar && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.cantPzasAcondicionar.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Muestras Tab / Recub <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="1"
                disabled={readOnly}
                {...register("muestrasTabRecub")}
                placeholder="Ej. 500"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.muestrasTabRecub
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.muestrasTabRecub && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.muestrasTabRecub.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Rendimiento Tab (%) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                disabled={readOnly}
                {...register("rendimientoTab")}
                placeholder="Ej. 99.40"
                className={`w-full px-3 py-2 border rounded-lg text-xs font-mono ${
                  errors.rendimientoTab
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.rendimientoTab && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.rendimientoTab.message}
                </p>
              )}
            </div>

            {/* Campo Autocalculado: Peso Neto Total Tabletas */}
            <div className="sm:col-span-2 bg-blue-50/80 p-3 rounded-lg border border-blue-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                Peso Neto Total Tabletas (kg) · Autocalculado de pesadas
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="0.001"
                  readOnly
                  {...register("pesoNetoTotalTabletas")}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded text-sm font-mono font-bold text-blue-900"
                />
                <span className="text-xs text-blue-700 font-semibold whitespace-nowrap">
                  ({watchedPesos?.length || 0} pesadas)
                </span>
              </div>
              {errors.pesoNetoTotalTabletas && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.pesoNetoTotalTabletas.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección 3: Fechas de Proceso */}
        <div>
          <div className="border-b border-slate-200 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-900">
              3. Fechas y Horarios de Proceso
            </h2>
            <p className="text-xs text-slate-500">
              Tiempos de tableteado, recubrimiento y primera carga.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Inicio Tableteado <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                disabled={readOnly}
                {...register("fechaInicioTableteado")}
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.fechaInicioTableteado
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.fechaInicioTableteado && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.fechaInicioTableteado.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fin Tableteado <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                disabled={readOnly}
                {...register("fechaFinTableteado")}
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.fechaFinTableteado
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.fechaFinTableteado && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.fechaFinTableteado.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Inicio Recubrimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                disabled={readOnly}
                {...register("fechaInicioRecubrimiento")}
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.fechaInicioRecubrimiento
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.fechaInicioRecubrimiento && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.fechaInicioRecubrimiento.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fin Primera Carga <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                disabled={readOnly}
                {...register("fechaFinPrimeraCarga")}
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.fechaFinPrimeraCarga
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.fechaFinPrimeraCarga && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.fechaFinPrimeraCarga.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Fin Recubrimiento <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                disabled={readOnly}
                {...register("fechaFinRecubrimiento")}
                className={`w-full px-3 py-2 border rounded-lg text-xs ${
                  errors.fechaFinRecubrimiento
                    ? "border-red-400 bg-red-50/20"
                    : "border-slate-300"
                } disabled:bg-slate-100 disabled:text-slate-600`}
              />
              {errors.fechaFinRecubrimiento && (
                <p className="text-[11px] text-red-600 mt-1">
                  {errors.fechaFinRecubrimiento.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Sección 4: Tabla de Pesos (Separación Visual) */}
        <div>
          {initialData ? (
            /* Vista de consulta / edición de registro existente: Oculta por defecto con botón */
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Pesadas Capturadas de Tableteado
                </h3>
                <p className="text-xs text-slate-500">
                  Total de {watchedPesos?.length || 0} pesadas registradas · Peso
                  Neto Total:{" "}
                  <strong className="text-slate-800">
                    {Number(formValues.pesoNetoTotalTabletas || 0).toFixed(3)} kg
                  </strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPesosModal(true)}
                className="py-2 px-4 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs shadow-xs transition flex items-center gap-2"
              >
                <Icon name="eye" size={15} />
                <span>Ver Pesos Capturados ({watchedPesos?.length || 0})</span>
              </button>
            </div>
          ) : (
            /* Vista de nuevo registro: Formulario interactivo completo */
            <div className="border-t border-slate-200 pt-6">
              <Controller
                name="pesos"
                control={control}
                render={({ field }) => (
                  <PesosTable
                    pesos={field.value || []}
                    onChangePesos={field.onChange}
                    readOnly={readOnly}
                    errors={errors.pesos}
                  />
                )}
              />
              {errors.pesos && typeof errors.pesos.message === "string" && (
                <p className="text-xs text-red-600 mt-2 font-semibold">
                  {errors.pesos.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Botones de acción */}
        {!readOnly && (
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
            >
              ← Volver
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="py-2.5 px-6 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-bold shadow-md transition disabled:opacity-60 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>Procesando Transacción...</>
              ) : isEdit ? (
                <>
                  <Icon name="edit" size={15} />
                  <span>Guardar Modificaciones (Auditoría)</span>
                </>
              ) : (
                <>
                  <Icon name="plus" size={15} />
                  <span>Guardar Registro SE Completo</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Modal para ver/editar pesadas en registros guardados */}
      <PesosModal
        isOpen={showPesosModal}
        onClose={() => setShowPesosModal(false)}
        pesos={watchedPesos || []}
        onChangePesos={(newPesos) => {
          if (!readOnly) {
            setValue("pesos", newPesos, { shouldDirty: true });
          }
        }}
        readOnly={readOnly}
        ordenGranel={formValues.ordenGranel}
      />

      {/* Modal obligatorio de Justificación de Auditoría para Edición */}
      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onConfirm={(justificacion) => executeSave(pendingValues, justificacion)}
        diffPreview={previewDiff}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
