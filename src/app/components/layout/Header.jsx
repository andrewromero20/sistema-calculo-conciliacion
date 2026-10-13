export default function Header({
  title = "Inicio",
  description = "Ingresa el número de orden para consultar o crear una conciliación.",
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
    </header>
  );
}
