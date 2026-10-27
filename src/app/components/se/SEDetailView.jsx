"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DatosGeneralesSE from "./DatosGeneralesSE";
import PesosModal from "./PesosModal";
import AuditTrailModal from "./AuditTrailModal";
import AuditTrailSection from "./AuditTrailSection";
import Icon from "../ui/Icon";
import { formatDateTime, formatFriendlyDateTime } from "../../lib/dateFormat";

/**
 * SEDetailView: Pantalla "Examinar - Historial" (Figma 125:76)
 * - Campos deshabilitados por defecto con el mismo diseño que captura.
 * - Insignia superior derecha: "Registrado el: [fecha]" con icono de verificación.
 * - Botón "Ver Pesos Capturados" para abrir modal de pesadas.
 * - Navegación rápida entre registros consecutivos con botones "<" y ">".
 * - Modo edición con justificación obligatoria y auditoría de cambios.
 */
export default function SEDetailView({
  registro: initialRegistro,
  userRole = "USER_SE",
  user = null,
  isPTView = false,
}) {
  const router = useRouter();
  const [registro, setRegistro] = useState(initialRegistro);
  const [isEditing, setIsEditing] = useState(false);
  const [showPesosModal, setShowPesosModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Lista de todas las órdenes para la navegación consecutiva "<" y ">" (Figma Comment 18)
  const [orderList, setOrderList] = useState([]);

  useEffect(() => {
    fetch("/api/se")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setOrderList(data.map((r) => r.ordenGranel));
        }
      })
      .catch(() => {});
  }, []);

  const currentIndex = orderList.indexOf(registro.ordenGranel);
  const prevOrden = currentIndex > 0 ? orderList[currentIndex - 1] : null;
  const nextOrden =
    currentIndex >= 0 && currentIndex < orderList.length - 1
      ? orderList[currentIndex + 1]
      : null;

  function navegarA(orden) {
    if (!orden) return;
    const targetPath = isPTView ? `/pt/se/${encodeURIComponent(orden)}` : `/se/${encodeURIComponent(orden)}`;
    router.push(targetPath);
  }

  // Valores de formulario para edición
  const [formValues, setFormValues] = useState(() => ({
    ordenGranel: registro.ordenGranel,
    lote: registro.lote,
    codigoMaterial: registro.codigoMaterial,
    producto: registro.producto,
    tamanoLoteEstandar: Number(registro.tamanoLoteEstandar),
    supervisorPreparacion: registro.supervisorPreparacion,
    supervisorTabRecub: registro.supervisorTabRecub,
    pesoNetoTotalTabletas: Number(registro.pesoNetoTotalTabletas),
    pesoPromedio: Number(registro.pesoPromedio),
    cantTabPorPza: registro.cantTabPorPza ?? "1",
    cantPzasCargarSap: Number(registro.cantPzasCargarSap),
    cantPzasAcondicionar: Number(registro.cantPzasAcondicionar),
    muestrasTabRecub: Number(registro.muestrasTabRecub),
    rendimientoTab: Number(registro.rendimientoTab),
    ctecGranelSap: registro.ctecGranelSap,
    fechaInicioTableteado: registro.fechaInicioTableteado
      ? new Date(registro.fechaInicioTableteado).toISOString().slice(0, 16)
      : "",
    fechaFinTableteado: registro.fechaFinTableteado
      ? new Date(registro.fechaFinTableteado).toISOString().slice(0, 16)
      : "",
    fechaInicioRecubrimiento: registro.fechaInicioRecubrimiento
      ? new Date(registro.fechaInicioRecubrimiento).toISOString().slice(0, 16)
      : "",
    fechaFinPrimeraCarga: registro.fechaFinPrimeraCarga
      ? new Date(registro.fechaFinPrimeraCarga).toISOString().slice(0, 16)
      : "",
    fechaFinRecubrimiento: registro.fechaFinRecubrimiento
      ? new Date(registro.fechaFinRecubrimiento).toISOString().slice(0, 16)
      : "",
    pesos:
      registro.pesos && registro.pesos.length > 0
        ? registro.pesos.map((p) => ({
            id: p.id,
            pesoBruto: Number(p.pesoBruto),
            pesoTara: Number(p.pesoTara),
            pesoNeto: Number(p.pesoNeto),
          }))
        : [],
  }));

  function handleChangeField(field, value) {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }

  function handlePesosChange(newPesos) {
    const suma = newPesos.reduce((acc, p) => acc + (Number(p.pesoNeto) || 0), 0);
    setFormValues((prev) => ({
      ...prev,
      pesos: newPesos,
      pesoNetoTotalTabletas: Number(suma.toFixed(2)),
    }));
  }

  // Recalcular campos automáticos en modo edición (Items 9, 10, 11, 12)
  useEffect(() => {
    if (!isEditing) return;
    const pesoNeto = Number(formValues.pesoNetoTotalTabletas) || 0;
    const pesoProm = Number(formValues.pesoPromedio) || 0;
    const cantTabPorPza = Number(formValues.cantTabPorPza) || 1;
    const tamanoLote = Number(formValues.tamanoLoteEstandar) || 0;

    let cantSap = "";
    let cantAcond = "";
    let rend = "";

    if (pesoNeto > 0 && pesoProm > 0) {
      // 9. CANT. PZAS A CARGAR EN SAP = Math.round(PESO NETO TOTAL / PESO PROMEDIO)
      // Redondeo de producto entero: < 0.5 hacia abajo, >= 0.5 hacia arriba (sin multiplicar por 1000)
      const rawPiezas = pesoNeto / pesoProm;
      const piezas = Math.round(rawPiezas);
      cantSap = piezas;

      if (cantTabPorPza > 0) {
        cantAcond = Math.round(piezas / cantTabPorPza);
      }

      if (tamanoLote > 0) {
        const r =
          tamanoLote > 1000
            ? (rawPiezas / tamanoLote) * 100
            : (pesoNeto / tamanoLote) * 100;
        rend = Number(r.toFixed(1));
      }
    }

    setFormValues((prev) => {
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
    isEditing,
    formValues.pesoNetoTotalTabletas,
    formValues.pesoPromedio,
    formValues.cantTabPorPza,
    formValues.tamanoLoteEstandar,
  ]);

  // Calcular diff para el modal de auditoría
  const diffPreview = useMemo(() => {
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
      const vOld = String(registro[f] ?? "").trim();
      const vNew = String(formValues[f] ?? "").trim();
      if (vOld !== vNew) {
        diff[f] = { anterior: registro[f], nuevo: formValues[f] };
      }
    }
    return diff;
  }, [registro, formValues]);

  async function handleConfirmAudit(justificacion) {
    setIsSaving(true);
    setErrorMsg("");
    setSaveSuccess("");

    try {
      const pesadasLimpias = formValues.pesos.filter(
        (p) => Number(p.pesoBruto) > 0
      );

      const payload = {
        ...formValues,
        pesos:
          pesadasLimpias.length > 0
            ? pesadasLimpias
            : registro.pesos.map((p) => ({
                pesoBruto: Number(p.pesoBruto),
                pesoTara: Number(p.pesoTara),
                pesoNeto: Number(p.pesoNeto),
              })),
        justificacion,
      };

      const res = await fetch(
        `/api/se/${encodeURIComponent(registro.ordenGranel)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el registro.");
      }

      setRegistro(data.registro);
      setIsEditing(false);
      setShowAuditModal(false);
      setSaveSuccess(
        `¡Orden ${registro.ordenGranel} actualizada con éxito y registrada en el Audit Trail!`
      );
    } catch (err) {
      setErrorMsg(err.message || "Error al guardar cambios.");
    } finally {
      setIsSaving(false);
    }
  }

  // Permiso de edición: únicamente usuarios de Semielaborados con permiso de edición habilitado por el administrador
  const canEdit = !isPTView && (user?.rol || userRole) === "USER_SE" && user?.puedeEditar === true;

  function handleUsarComoPlantilla() {
    if (!registro) return;
    try {
      sessionStorage.setItem("se_apply_template", JSON.stringify(registro));
      router.push("/se/nuevo");
    } catch (e) {
      console.error("Error al preparar plantilla:", e);
    }
  }

  function handleOpenAuditModal() {
    setErrorMsg("");
    const now = new Date();
    const timeKeys = [
      "fechaInicioTableteado",
      "fechaFinTableteado",
      "fechaInicioRecubrimiento",
      "fechaFinPrimeraCarga",
      "fechaFinRecubrimiento",
    ];
    for (const key of timeKeys) {
      if (formValues[key] && new Date(formValues[key]) > now) {
        setErrorMsg("No es posible registrar un día que aún no ha ocurrido en los tiempos de fabricación.");
        return;
      }
    }
    setShowAuditModal(true);
  }

  // Formato amigable de fecha de creación: "Registrado el: 07 sep 2026, 09:45 hrs"
  const formattedCreationDate = useMemo(() => {
    return formatFriendlyDateTime(registro.fechaCreacion);
  }, [registro.fechaCreacion]);

  return (
    <div className="space-y-6">
      {/* Banner de interoperabilidad para PT */}
      {isPTView && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm">
              PT
            </span>
            <div>
              <p className="font-bold text-xs uppercase tracking-wider text-emerald-900">
                Consulta de Interoperabilidad · Área de Producto Terminado
              </p>
              <p className="text-xs text-emerald-800">
                Datos de Producto Semielaborado en modo de solo lectura para conciliación de acondicionamiento.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-200 text-emerald-900 border border-emerald-300">
            Read-Only Granel
          </span>
        </div>
      )}

      {/* Barra Superior con Navegación Consecutiva e Insignia de Fecha (Figma 125:76) */}
      <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        {/* Izquierda: Volver y Navegación entre órdenes */}
        <div className="flex items-center gap-3">
          <Link
            href={isPTView ? "/pt/se" : "/se/historial"}
            className="py-1.5 px-3.5 rounded-lg bg-[#1a2b45] hover:bg-[#142236] text-white text-xs font-semibold shadow-xs transition inline-flex items-center gap-1.5"
          >
            <span>←</span>
            <span>Volver a la lista</span>
          </Link>

          {/* Botones de navegación consecutiva < y > (Figma Comment 18) */}
          <div className="flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              type="button"
              disabled={!prevOrden}
              onClick={() => navegarA(prevOrden)}
              title={prevOrden ? `Ir a orden anterior: ${prevOrden}` : "No hay orden anterior"}
              className="w-8 h-8 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-bold text-sm transition"
            >
              ‹
            </button>
            <span className="text-[11px] font-mono text-slate-500 px-1">
              {currentIndex >= 0 ? `${currentIndex + 1} de ${orderList.length}` : ""}
            </span>
            <button
              type="button"
              disabled={!nextOrden}
              onClick={() => navegarA(nextOrden)}
              title={nextOrden ? `Ir a orden siguiente: ${nextOrden}` : "No hay orden siguiente"}
              className="w-8 h-8 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700 font-bold text-sm transition"
            >
              ›
            </button>
          </div>
        </div>

        {/* Derecha: Botón de pesadas modal, modo edición y badge de registro */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Botón Ver Pesos Capturados en modal (Figma Comment 14) */}
          <button
            type="button"
            onClick={() => setShowPesosModal(true)}
            className="py-1.5 px-3.5 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 text-[#0d6efd] text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Icon name="table" size={14} />
            <span>Ver Pesos Capturados</span>
          </button>

          {/* Botón Usar como Plantilla (Punto 7) */}
          <button
            type="button"
            onClick={handleUsarComoPlantilla}
            className="py-1.5 px-3.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            title="Usar datos de este registro como plantilla para una nueva captura"
          >
            <Icon name="copy" size={14} />
            <span>Usar como Plantilla</span>
          </button>

          {/* Botón Habilitar/Cancelar Edición */}
          {canEdit && (
            <div>
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setErrorMsg("");
                    }}
                    className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleOpenAuditModal}
                    className="py-1.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition"
                  >
                    Guardar Cambios
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="py-1.5 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1.5"
                >
                  <Icon name="edit" size={13} />
                  <span>Editar Registro</span>
                </button>
              )}
            </div>
          )}

          {/* Insignia en la esquina superior derecha (Figma Comment 7 & 125:76) */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold shadow-2xs">
            <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
              ✓
            </span>
            <span>
              Registrado el: <strong>{formattedCreationDate}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Avisos de Éxito o Error */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs flex items-center gap-2 shadow-xs animate-in fade-in">
          <span>✓</span>
          <span>{saveSuccess}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2 shadow-xs">
          <span>⚠</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Datos Técnicos en modo Read-Only o Editable (Figma 125:76) */}
      <div className="space-y-4">
        {isEditing && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold flex items-center gap-2">
            <span>✎</span>
            <span>
              Modo Edición Habilitado: Al guardar se solicitará una justificación obligatoria que quedará registrada en el Audit Trail.
            </span>
          </div>
        )}

        <DatosGeneralesSE
          values={formValues}
          onChangeField={handleChangeField}
          readOnly={!isEditing}
        />
      </div>

      {/* Historial de Auditoría (Audit Trail) */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
        <AuditTrailSection auditorias={registro.auditorias || []} />
      </div>

      {/* Modal de Pesadas Capturadas (Figma Comment 14) */}
      <PesosModal
        isOpen={showPesosModal}
        onClose={() => setShowPesosModal(false)}
        pesos={formValues.pesos}
        onChangePesos={isEditing ? handlePesosChange : undefined}
        readOnly={!isEditing}
        ordenGranel={registro.ordenGranel}
      />

      {/* Modal de Confirmación y Justificación de Auditoría */}
      <AuditTrailModal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        onConfirm={handleConfirmAudit}
        diffPreview={diffPreview}
        isSubmitting={isSaving}
      />
    </div>
  );
}
