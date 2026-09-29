"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../ui/Icon";
import StatusBadge from "../ui/StatusBadge";
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

  const form = <form className="material-form" onSubmit={editingMaterial ? handleEditMaterial : handleAddMaterial}><label htmlFor="material-description">Descripción</label><select id="material-description" value={description} onChange={(event) => setDescription(event.target.value)}><option value="">Selecciona un tipo de material</option>{materialTypes.map((type) => <option key={type} value={type}>{type}</option>)}</select><label htmlFor="material-sap-code">Código SAP</label><input id="material-sap-code" value={sapCode} onChange={(event) => setSapCode(event.target.value)} placeholder="Ej. 10002345" /><label htmlFor="material-unit">Unidad</label><input id="material-unit" value={unit} onChange={(event) => setUnit(event.target.value)} placeholder="Ej. PZA" />{error && <p className="field-error">{error}</p>}<div className="button-row"><button className="button primary" type="submit"><Icon name={editingMaterial ? "edit" : "plus"} size={17} />{editingMaterial ? "Guardar cambios" : "Guardar material"}</button><button className="button secondary" type="button" onClick={editingMaterial ? cancelEditing : () => { setIsAdding(false); setError(""); }}>Cancelar</button></div></form>;

  return <section className="card materials-card"><div className="section-heading"><div><h2>Materiales</h2><p>Materiales asociados a esta conciliación.</p></div><span className="recent-count">{materialList.length} registros</span></div><div className="materials-list"><div className="material-row material-header"><span>Descripción</span><span>SAP</span><span>Unidad</span><span>Estado</span><span>Acciones</span></div>{materialList.length === 0 ? <p className="materials-empty">Aún no hay materiales agregados.</p> : materialList.map((material) => <div className="material-row" key={material.id}><strong>{material.descripcion}</strong><span>{material.codigoSAP}</span><span>{material.unidadMedida}</span><span><StatusBadge status={material.estadoMaterial} /></span><span className="material-actions"><button className="icon-button" type="button" onClick={() => startEditing(material)} title={`Editar ${material.descripcion}`}><Icon name="edit" size={16} /></button><button className="icon-button danger" type="button" onClick={() => handleDeleteMaterial(material)} title={`Eliminar ${material.descripcion}`}><Icon name="trash" size={16} /></button></span></div>)}</div>{editingMaterial ? form : isAdding ? form : <button className="button secondary materials-add-button" type="button" onClick={() => { setIsAdding(true); setError(""); }}><Icon name="plus" size={17} />Agregar material</button>}</section>;
}