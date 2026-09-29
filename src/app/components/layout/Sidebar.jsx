import Link from "next/link";
import Icon from "../ui/Icon";

export default function Sidebar({ activeView }) {
	const items = [["inicio", "Inicio", "home"], ["nueva", "Nueva conciliación", "plus"], ["historial", "Historial", "history"]];

	const routes = { inicio: "/", nueva: "/conciliaciones/nueva", historial: "/historial" };
	return <aside className="sidebar"><div className="brand"><span className="brand-icon"><Icon name="calculator" size={21} /></span><span>Conciliación<br />de Materiales</span></div><nav className="nav-list" aria-label="Navegación principal">{items.map(([id, label, icon]) => <Link key={id} href={routes[id]} className={`nav-item ${activeView === id ? "active" : ""}`}><Icon name={icon} /><span>{label}</span></Link>)}</nav><div className="user-profile"><span className="user-icon"><Icon name="user" /></span><div><strong>Usuario</strong><small>Área: Acondicionado</small></div></div></aside>;
}
