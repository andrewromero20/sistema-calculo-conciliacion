import Icon from "../ui/Icon";

export default function Header({ title = "Inicio", description = "Ingresa el número de orden para consultar o crear una conciliación." }) {
	const now = new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

	return <header className="page-header"><div><p className="eyebrow">Panel de trabajo</p><h1>{title}</h1><p>{description}</p></div><div className="current-date"><Icon name="calendar" /><span>{now}</span></div></header>;
}
