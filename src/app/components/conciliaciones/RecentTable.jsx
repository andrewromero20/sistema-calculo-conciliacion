import Icon from "../ui/Icon";
import StatusBadge from "../ui/StatusBadge";
import { formatDateTime } from "../../lib/dateFormat";

export default function RecentTable({
  reconciliations,
  onOpen,
}) {
  return (
    <section className="card recent-card">
      <div className="section-heading">
        <div>
          <h2>Conciliaciones recientes</h2>

          <p>
            Últimas órdenes actualizadas en el sistema.
          </p>
        </div>

        <span className="recent-count">
          {reconciliations.length} registros
        </span>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Orden</th>
              <th>Estado</th>
              <th>
                Fecha de última modificación
              </th>
              <th>Usuario</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody>
            {reconciliations.map((item) => (
              <tr key={item.id}>
                <td className="order-cell">
                  {item.numeroOrden}
                </td>

                <td>
                  <StatusBadge
                    status={
                      item.estadoConciliacion
                    }
                  />
                </td>

                <td>
                  {formatDateTime(
                    item.fechaActualizacion,
                  )}
                </td>

                <td>
                  {item.usuarioUltimaModificacion}
                </td>

                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="action-button"
                      onClick={() =>
                        onOpen(item)
                      }
                      title={`Editar orden ${item.numeroOrden}`}
                    >
                      <Icon
                        name="edit"
                        size={16}
                      />
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        className="all-link"
        onClick={() => onOpen(null)}
      >
        Ver todas las conciliaciones
        <Icon name="arrow" size={16} />
      </button>
    </section>
  );
}
