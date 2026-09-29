export async function obtenerConciliaciones() {
  const response = await fetch("/api/conciliaciones");

  if (!response.ok) {
    throw new Error("No fue posible cargar las conciliaciones");
  }

  return response.json();
}

export async function obtenerConciliacionPorNumeroOrden(numeroOrden) {
  const response = await fetch(`/api/conciliaciones/${encodeURIComponent(numeroOrden)}`);

  if (response.status === 404) return null;

  if (!response.ok) {
    throw new Error("No fue posible buscar la conciliación");
  }

  return response.json();
}

export async function crearConciliacion(numeroOrden) {
  const response = await fetch("/api/conciliaciones", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ numeroOrden }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "No fue posible crear la conciliación");
  }

  return response.json();
}
