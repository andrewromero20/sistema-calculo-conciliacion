import StatusBadge from "../ui/StatusBadge";
import { formatDateTime } from "../../lib/dateFormat";

export default function InfoCard({ reconciliation }) {
	if (!reconciliation) return null;
	return <aside className="card info-card"><div className="section-heading"><h2>Información de la conciliación</h2><span className="info-dot">i</span></div><dl><div><dt>Número de orden</dt><dd>{reconciliation.numeroOrden}</dd></div><div><dt>Estado</dt><dd><StatusBadge status={reconciliation.estadoConciliacion} /></dd></div><div><dt>Último guardado</dt><dd>{formatDateTime(reconciliation.fechaActualizacion)}</dd></div><div><dt>Última modificación por</dt><dd>{reconciliation.usuarioUltimaModificacion}</dd></div></dl></aside>;
}
