import Icon from "../ui/Icon";
import StatusBadge from "../ui/StatusBadge";
import { formatDateTime } from "../../lib/dateFormat";

export default function ResultMessage({ result, onCreate, onOpen }) {
	if (!result || (!result.match && !result.order)) return null;
	if (!result.match) return <div className="alert info-alert"><div className="alert-symbol">i</div><div><strong>No existe una conciliación para la orden {result.order}.</strong><p>Confirma para comenzar una conciliación nueva.</p><button className="button primary" onClick={onCreate}><Icon name="plus" size={17} />Crear conciliación</button></div></div>;
	const finished = result.match.estadoConciliacion === "Finalizada";
	return <div className="alert success-alert"><div className="alert-symbol">✓</div><div><strong>Se encontró una conciliación para la orden {result.match.numeroOrden}.</strong><p>Estado: <StatusBadge status={result.match.estadoConciliacion} /> · Última modificación: {formatDateTime(result.match.fechaActualizacion)}</p><div className="result-actions"><button className="text-button" onClick={() => onOpen(result.match)}><Icon name={finished ? "eye" : "edit"} size={16} />{finished ? "Ver" : "Continuar"}</button></div></div></div>;
}
