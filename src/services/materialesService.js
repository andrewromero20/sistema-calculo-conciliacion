async function getErrorMessage(response, fallback) {
  const body = await response.json().catch(() => null);
  return body?.error || fallback;
}

export async function crearMaterial(material) {
  const response = await fetch("/api/materiales", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(material),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "No fue posible crear el material."));
  }

  return response.json();
}

export async function actualizarMaterial(id, material) {
  const response = await fetch(`/api/materiales/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(material),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "No fue posible actualizar el material."));
  }

  return response.json();
}

export async function eliminarMaterial(id) {
  const response = await fetch(`/api/materiales/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, "No fue posible eliminar el material."));
  }
}

export async function obtenerMaterial(id) {
  const response = await fetch(`/api/materiales/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  const data = await response.json().catch(() => null);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(data?.error || "No fue posible cargar el material.");
  }

  return data;
}