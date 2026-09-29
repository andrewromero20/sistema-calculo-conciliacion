import Icon from "../ui/Icon";

const MAX_ORDER_LENGTH = 20;

export default function SearchCard({ order, setOrder, onSearch, onNew, error }) {
	return <section className="card search-card"><div className="section-heading"><div><h2>Buscar por número de orden</h2><p>Consulta el estado de una conciliación existente.</p></div><span className="search-mark"><Icon name="search" /></span></div><form onSubmit={onSearch} noValidate><label htmlFor="order-number">Número de orden</label><input id="order-number" value={order} maxLength={MAX_ORDER_LENGTH} onChange={(event) => setOrder(event.target.value.replace(/\D/g, ""))} placeholder="Ej. 4000137934" inputMode="numeric" aria-invalid={Boolean(error)} />{error && <p className="field-error">{error}</p>}<div className="button-row"><button className="button primary" type="submit"><Icon name="search" size={17} />Buscar orden</button><button className="button secondary" type="button" onClick={onNew}><Icon name="plus" size={17} />Nueva conciliación</button></div></form></section>;
}
