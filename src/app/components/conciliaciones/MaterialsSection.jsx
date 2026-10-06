"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../ui/Icon";
import {
  actualizarMaterial,
  crearMaterial,
  eliminarMaterial,
} from "../../../services/materialesService";

const initialMaterial = {
  blisterPorCaja: null,
  tabletasPorBlister: null,
  cantidadRealAcondicionada: null,
  capacidadCajaEmpaque: null,
  cantidadSurtidaA: null,
  cantidadAdicionalB: null,
  cantidadDevueltaC: null,
  telecamara: null,
  hermeticidad: null,
  otraMerma: null,
  cajasTomadasMuestra: null,
  cajasUtilizadasArranque: null,
  totalRecibidaD: null,
  resultadoE: null,
  resultadoF: null,
  resultadoG: null,
  totalUtilizadaH: null,
  diferencia: null,
  porcentajeDiferencia: null,
  limitePermitido: null,
  estadoMaterial: "PENDIENTE",
};

const materialTypes = [
  "CAJA PLEGADIZA",
  "ETIQUETA COLECTIVA",
  "CAJA EMPAQUE",
  "FOIL ALUMINIO",
  "FOIL PVC",
  "SELLO GARANTÍA",
  "INSTRUCTIVO",
  "TABLETA",
];

export default function MaterialsSection({ numeroOrden, conciliacionId, materials = [] }) {
  const router = useRouter();
  const [materialList, setMaterialList] = useState(materials);
  const [description, setDescription] = useState("");
  const [sapCode, setSapCode] = useState("");
  const [unit, setUnit] = useState("");
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState("");

  async function handleAddMaterial(event) {
    event.preventDefault();
    const trimmedDescription = description.trim();
    const trimmedSapCode = sapCode.trim();
    const trimmedUnit = unit.trim();

    if (!trimmedDescription) {
      setError("Falta seleccionar el tipo de material.");
      return;
    }

    if (!trimmedSapCode) {
      setError("Falta capturar el código SAP.");
      return;
    }

    if (!trimmedUnit) {
      setError("Falta seleccionar la unidad.");
      return;
    }

    if (!conciliacionId || !Number.isInteger(Number(conciliacionId))) {
      setError("No se encontró la conciliación asociada.");
      return;
    }

    const payload = {
      descripcion: trimmedDescription,
      codigoSAP: trimmedSapCode,
      unidadMedida: trimmedUnit,
      conciliacionId: Number(conciliacionId),
    };

    console.log("Formulario de material:", payload);
    setError("");
    try {
      const material = await crearMaterial(payload);
      setMaterialList((currentMaterials) => [...currentMaterials, material]);
      setDescription("");
      setSapCode("");
      setUnit("");
      setIsAdding(false);
    } catch (creationError) {
      setError(creationError.message);
    }
  }

  function startEditing(material) {
    if (!Number.isInteger(material.id) || material.id <= 0) {
      setError("El material no tiene un identificador válido.");
      return;
    }

    router.push(`/conciliaciones/${numeroOrden}/materiales/${material.id}`);
  }

  function cancelEditing() {
    setEditingMaterial(null);
    setDescription("");
    setSapCode("");
    setUnit("");
    setError("");
  }

  async function handleEditMaterial(event) {
    event.preventDefault();
    const data = {
      descripcion: description.trim(),
      codigoSAP: sapCode.trim(),
      unidadMedida: unit.trim(),
    };

    if (!data.descripcion || !data.codigoSAP || !data.unidadMedida) {
      setError("Completa la descripción, el código SAP y la unidad.");
      return;
    }

    try {
      const material = await actualizarMaterial(editingMaterial.id, data);
      setMaterialList((currentMaterials) => currentMaterials.map((item) => item.id === material.id ? material : item));
      cancelEditing();
    } catch (updateError) {
      setError(updateError.message);
    }
  }

  async function handleDeleteMaterial(material) {
    if (!window.confirm(`¿Eliminar el material ${material.descripcion}?`)) return;

    try {
      await eliminarMaterial(material.id);
      setMaterialList((currentMaterials) => currentMaterials.filter((item) => item.id !== material.id));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function formatQuantity(value) {
    if (value === null || value === undefined) return "Pendiente";
    return new Intl.NumberFormat("en-US", { maximumFractionDigits: 3 }).format(value);
  }

  function formatPercentage(value) {
    if (value === null || value === undefined) return "Pendiente";
    return `${Number(value).toFixed(2)}%`;
  }

  function formatLimit(material) {
    if (material.limitePermitido === null || material.limitePermitido === undefined) return "Pendiente";
    if (material.descripcion === "INSTRUCTIVO") {
      return `± ${Number(material.limitePermitido).toFixed(2)} %`;
    }
    if (material.descripcion === "SELLO GARANTÍA") {
      return `± ${Number(material.limitePermitido).toFixed(2)} %`;
    }
    if (material.descripcion === "SELLO GARANTÍA") {
      return `± ${Number(material.limitePermitido).toFixed(2)} %`;
    }
    const suffix = material.descripcion === "CAJA PLEGADIZA" ? "%" : " PZA";
    return `${formatQuantity(material.limitePermitido)}${suffix}`;
  }

  function friendlyStatus(status) {
    const labels = {
      CAPTURA_INCOMPLETA: "Captura incompleta",
      DENTRO_DEL_LIMITE: "Dentro del límite",
      FUERA_DEL_LIMITE: "Fuera del límite",
      PENDIENTE_DE_REVISION: "Pendiente de revisión",
      PENDIENTE: "Pendiente",
      "En captura": "En captura",
    };
    return labels[status] || status || "Pendiente";
  }

  const form = <form className="material-form" onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial}><label htmlFor="material-description">Descripción</label><select id="material-description" value={description} onChange={(event) => setDescription(event.target.value)}><option value="">Selecciona un tipo de material</option>{materialTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><label htmlFor="material-sap-code">Código SAP</label><input id="material-sap-code" value={sapCode} onChange={(event) => setSapCode(event.target.value)} placeholder="Ej. 10002345" /><label htmlFor="material-unit">Unidad</label><input id="material-unit" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Ej. PZA" />{error && <p className="field-error">{error}</p>}<div className="button-row"><button className="button primary" type="submit"><Icon name={editingMaterial ? "edit" : "plus"} size={17} />{editingMaterial ? "Guardar cambios" : "Guardar material"}</button><button className="button secondary" type="button" onClick={editingMaterial ? cancelEditing : () => { setIsAdding(false); setError(""); }}>Cancelar</button></div></form>;

  return <section className="card materials-card"><div className="section-heading"><div><h2>Materiales</h2><p>Materiales asociados a esta conciliación.</p></div><span className="recent-count">{materialList.length} registros</span></div><div className="materials-table-wrap"><table className="materials-summary-table"><thead><tr><th className="material-sticky-column">Material</th><th>SAP</th><th>Unidad</th><th className="quantity-header">A</th><th className="quantity-header">B</th><th className="quantity-header">C</th><th className="quantity-header">D</th><th className="usage-header">E</th><th className="usage-header">F</th><th className="usage-header">G</th><th className="usage-header">H</th><th className="difference-header">Diferencia D - H</th><th>Porcentaje sobre D</th><th>Límite permitido</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>{materialList.length === 0 ? <tr><td className="materials-empty-cell" colSpan={16}>Aún no hay materiales agregados.</td></tr> : materialList.map((material) => <tr key={material.id}><th scope="row" className="material-sticky-column material-name">{material.descripcion}</th><td>{material.codigoSAP}</td><td>{material.unidadMedida}</td><td>{formatQuantity(material.cantidadSurtidaA)}</td><td>{formatQuantity(material.cantidadAdicionalB)}</td><td>{formatQuantity(material.cantidadDevueltaC)}</td><td className="calculated-summary-cell">{formatQuantity(material.totalRecibidaD)}</td><td>{formatQuantity(material.resultadoE)}</td><td>{formatQuantity(material.resultadoF)}</td><td>{formatQuantity(material.resultadoG)}</td><td className="calculated-summary-cell">{formatQuantity(material.totalUtilizadaH)}</td><td className="difference-cell">{formatQuantity(material.diferencia)}</td><td>{formatPercentage(material.porcentajeDiferencia)}</td><td>{formatLimit(material)}</td><td><span className={`status-badge material-status-${String(material.estadoMaterial || "pendiente").toLowerCase().replaceAll("_", "-").replaceAll(" ", "-")}`}>{friendlyStatus(material.estadoMaterial)}</span></td><td><span className="material-actions"><button className="icon-button" type="button" onClick={() => startEditing(material)} title={`Editar ${material.descripcion}`}><Icon name="edit" size={16} /></button><button className="icon-button danger" type="button" onClick={() => handleDeleteMaterial(material)} title={`Eliminar ${material.descripcion}`}><Icon name="trash" size={16} /></button></span></td></tr>)}</tbody></table></div>{editingMaterial ? form : isAdding ? form : <button className="button secondary materials-add-button" type="button" onClick={() => { setIsAdding(true); setError(""); }}><Icon name="plus" size={17} />Agregar material</button>}</section>;
}