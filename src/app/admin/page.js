"use client";

import { useEffect, useState, useMemo } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import Icon from "../components/ui/Icon";
import AppErrorModal from "../components/ui/AppErrorModal";
import { formatDateTime } from "../lib/dateFormat";

export default function AdminPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("ALL");
  const [updatingId, setUpdatingId] = useState(null);

  // Estados de retroalimentación
  const [successNotice, setSuccessNotice] = useState("");
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
    actionText: "Entendido",
    cancelText: "",
    onConfirm: null,
  });

  // 1. Cargar usuario en sesión y catálogo de usuarios registrados
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setCurrentUser(data.user);
      })
      .catch(() => {});

    cargarUsuarios();
  }, []);

  async function cargarUsuarios() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo cargar la lista de usuarios.");
      }
      const data = await res.json();
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "Error al consultar usuarios",
        message: err.message,
        type: "error",
        actionText: "Aceptar",
        cancelText: "",
        onConfirm: null,
      });
    } finally {
      setLoading(false);
    }
  }

  // 2. Solicitar confirmación para cambio de rol
  function solicitarCambioRol(targetUser, nuevoRol) {
    if (targetUser.rol === nuevoRol) return;

    const nombreRolNuevo =
      nuevoRol === "USER_SE" ? "Semielaborado (SE)" : "Producto Terminado (PT)";

    setErrorModal({
      isOpen: true,
      title: "Confirmar asignación de rol",
      message: `¿Estás seguro de que deseas cambiar el rol de "${targetUser.nombre}" (${targetUser.email}) a ${nombreRolNuevo}?\n\nEl usuario tendrá acceso inmediato a las funciones de ${nombreRolNuevo}.`,
      type: "warning",
      actionText: "Confirmar cambio",
      cancelText: "Cancelar",
      onConfirm: () => ejecutarCambioRol(targetUser.id, nuevoRol, targetUser.nombre, nombreRolNuevo),
    });
  }

  // 3. Ejecutar cambio de rol en el servidor
  async function ejecutarCambioRol(userId, nuevoRol, nombreUsuario, nombreRolNuevo) {
    setUpdatingId(userId);
    setSuccessNotice("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: userId, rol: nuevoRol }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar el rol.");
      }

      // Actualizar estado local (si cambia a PT o ADMIN, se revoca el permiso de edición)
      setUsuarios((prev) =>
        prev.map((u) =>
          Number(u.id) === Number(userId)
            ? { ...u, rol: nuevoRol, puedeEditar: nuevoRol === "USER_SE" ? u.puedeEditar : false }
            : u
        )
      );

      setSuccessNotice(`Rol de ${nombreUsuario} actualizado a ${nombreRolNuevo} correctamente.`);
      setTimeout(() => setSuccessNotice(""), 4500);
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "Error al cambiar rol",
        message: err.message,
        type: "error",
        actionText: "Entendido",
        cancelText: "",
        onConfirm: null,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // 4. Conmutar permiso de edición para usuarios de Semielaborados (Punto 5)
  async function handleToggleEditPermission(targetUser) {
    if (targetUser.rol !== "USER_SE") return;
    const nuevoPermiso = !targetUser.puedeEditar;
    setUpdatingId(targetUser.id);
    setSuccessNotice("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: targetUser.id, puedeEditar: nuevoPermiso }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al actualizar permiso de edición.");
      }

      setUsuarios((prev) =>
        prev.map((u) =>
          Number(u.id) === Number(targetUser.id) ? { ...u, puedeEditar: nuevoPermiso } : u
        )
      );

      setSuccessNotice(
        `Permiso de edición para "${targetUser.nombre}" ${
          nuevoPermiso ? "habilitado" : "deshabilitado"
        } exitosamente.`
      );
      setTimeout(() => setSuccessNotice(""), 4500);
    } catch (err) {
      setErrorModal({
        isOpen: true,
        title: "Error de Permisos",
        message: err.message,
        type: "error",
        actionText: "Entendido",
        cancelText: "",
        onConfirm: null,
      });
    } finally {
      setUpdatingId(null);
    }
  }

  // Métricas de roles
  const metrics = useMemo(() => {
    const total = usuarios.length;
    const se = usuarios.filter((u) => u.rol === "USER_SE").length;
    const pt = usuarios.filter((u) => u.rol === "USER_PT").length;
    const admin = usuarios.filter((u) => u.rol === "ADMIN").length;
    return { total, se, pt, admin };
  }, [usuarios]);

  // Filtrado de usuarios
  const filteredUsers = useMemo(() => {
    return usuarios.filter((u) => {
      const matchSearch =
        !searchTerm.trim() ||
        u.nombre.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase().trim());

      const matchRole =
        filterRole === "ALL" ||
        (filterRole === "USER_SE" && u.rol === "USER_SE") ||
        (filterRole === "USER_PT" && u.rol === "USER_PT") ||
        (filterRole === "ADMIN" && u.rol === "ADMIN");

      return matchSearch && matchRole;
    });
  }, [usuarios, searchTerm, filterRole]);

  return (
    <div className="app-shell">
      <Sidebar activeView="admin-usuarios" />
      <main className="main-content space-y-6">
        <Header
          title="Panel de Administración"
          description="Gestión centralizada de usuarios registrados y asignación de roles operativos (Semielaborado y Producto Terminado)."
        />

        {/* Notificación de Éxito */}
        {successNotice && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold">
                ✓
              </span>
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice("")}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tarjetas de Resumen de Roles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <Icon name="user" size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                Total Registrados
              </p>
              <p className="text-xl font-black text-slate-900 mt-0.5">{metrics.total}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              SE
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">
                Semielaborado
              </p>
              <p className="text-xl font-black text-blue-900 mt-0.5">{metrics.se}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              PT
            </div>
            <div>
              <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Prod. Terminado
              </p>
              <p className="text-xl font-black text-emerald-900 mt-0.5">{metrics.pt}</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
              AD
            </div>
            <div>
              <p className="text-[11px] font-bold text-purple-800 uppercase tracking-wider">
                Administradores
              </p>
              <p className="text-xl font-black text-purple-900 mt-0.5">{metrics.admin}</p>
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Búsqueda (Un solo recuadro con lupa interna como en historial) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[280px] max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 z-10">
              <Icon name="search" size={16} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o correo electrónico..."
              style={{
                height: "42px",
                paddingLeft: "38px",
                paddingRight: searchTerm ? "38px" : "14px",
                border: "1px solid #cbd5e1",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.05)",
                fontSize: "13px",
              }}
              className="w-full text-slate-800 placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 text-xs transition cursor-pointer z-10"
                title="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 shadow-xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilterRole("ALL")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterRole === "ALL"
                  ? "bg-slate-800 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Todos ({metrics.total})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole("USER_SE")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterRole === "USER_SE"
                  ? "bg-blue-600 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Semi ({metrics.se})
            </button>
            <button
              type="button"
              onClick={() => setFilterRole("USER_PT")}
              className={`px-3 py-1.5 rounded-lg transition ${
                filterRole === "USER_PT"
                  ? "bg-emerald-600 text-white shadow-2xs font-bold"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Terminado ({metrics.pt})
            </button>
          </div>
        </div>

        {/* Tabla de Usuarios Registrados */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Usuarios Registrados en el Sistema
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Asigna y conmuta los roles operativos entre Semielaborado y Producto Terminado en tiempo real.
              </p>
            </div>
            <button
              type="button"
              onClick={cargarUsuarios}
              disabled={loading}
              className="py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition inline-flex items-center gap-1.5"
            >
              <span>{loading ? "Actualizando..." : "↻ Recargar lista"}</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">
              Cargando catálogo de usuarios...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 space-y-2">
              <p className="font-semibold text-slate-700">
                No se encontraron usuarios que coincidan con la búsqueda.
              </p>
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left divide-y divide-slate-200">
                <thead className="bg-[#f8fafc] text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th scope="col" className="px-5 py-3.5">
                      Usuario
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Correo Electrónico
                    </th>
                    <th scope="col" className="px-5 py-3.5">
                      Rol Actual
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      Permiso de edición
                    </th>
                    <th scope="col" className="px-5 py-3.5 text-center">
                      Asignar Rol (Semi / Terminado)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => {
                    const isSelf = currentUser && Number(currentUser.id) === Number(u.id);
                    const isAdmin = u.rol === "ADMIN";
                    const isUpdating = updatingId === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition">
                        {/* Nombre y Avatar */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                                u.rol === "USER_SE"
                                  ? "bg-blue-100 text-blue-800"
                                  : u.rol === "USER_PT"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {u.nombre.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 text-xs">
                                  {u.nombre}
                                </span>
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-200 text-slate-700">
                                    Tú
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 font-mono">
                                ID: #{u.id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Correo Electrónico */}
                        <td className="px-5 py-3.5 font-mono text-slate-700 font-medium">
                          {u.email}
                        </td>

                        {/* Rol Actual */}
                        <td className="px-5 py-3.5">
                          {u.rol === "USER_SE" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                              Semielaborado (SE)
                            </span>
                          ) : u.rol === "USER_PT" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                              Prod. Terminado (PT)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                              Administrador
                            </span>
                          )}
                        </td>

                        {/* Permiso de edición (Punto 5) */}
                        <td className="px-5 py-3.5 text-center">
                          {u.rol === "USER_SE" ? (
                            <label className="inline-flex items-center justify-center cursor-pointer p-1">
                              <input
                                type="checkbox"
                                checked={Boolean(u.puedeEditar)}
                                disabled={isUpdating}
                                onChange={() => handleToggleEditPermission(u)}
                                className="w-4 h-4 text-blue-600 bg-white border-slate-300 rounded focus:ring-blue-500 cursor-pointer transition accent-blue-600"
                                title={
                                  u.puedeEditar
                                    ? "Permiso de edición habilitado. Clic para revocar."
                                    : "Sin permiso de edición. Clic para habilitar."
                                }
                              />
                              <span className="sr-only">Permiso de edición para {u.nombre}</span>
                            </label>
                          ) : (
                            <div
                              className="inline-flex items-center justify-center"
                              title="No disponible para usuarios fuera de Semielaborado"
                            >
                              <div className="w-4 h-4 rounded bg-slate-700 border border-slate-600 opacity-60 flex items-center justify-center cursor-not-allowed select-none">
                                <span className="text-[10px] text-slate-400 font-bold leading-none">✕</span>
                              </div>
                            </div>
                          )}
                        </td>

                        {/* Selector de Rol: Semi vs Terminado */}
                        <td className="px-5 py-3.5 text-center">
                          {isAdmin ? (
                            <span className="text-[11px] text-slate-400 font-semibold italic">
                              Cuenta Administrador (Fijo)
                            </span>
                          ) : (
                            <div className="inline-flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 gap-1 shadow-2xs">
                              {/* Botón Semielaborado */}
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => solicitarCambioRol(u, "USER_SE")}
                                title={`Asignar rol Semielaborado a ${u.nombre}`}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                  u.rol === "USER_SE"
                                    ? "bg-blue-600 text-white shadow-xs pointer-events-none"
                                    : "text-slate-600 hover:bg-white hover:text-blue-700"
                                }`}
                              >
                                <span>Semi</span>
                                {u.rol === "USER_SE" && <span className="text-[10px]">✓</span>}
                              </button>

                              {/* Botón Producto Terminado */}
                              <button
                                type="button"
                                disabled={isUpdating}
                                onClick={() => solicitarCambioRol(u, "USER_PT")}
                                title={`Asignar rol Producto Terminado a ${u.nombre}`}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                                  u.rol === "USER_PT"
                                    ? "bg-emerald-600 text-white shadow-xs pointer-events-none"
                                    : "text-slate-600 hover:bg-white hover:text-emerald-700"
                                }`}
                              >
                                <span>Terminado</span>
                                {u.rol === "USER_PT" && <span className="text-[10px]">✓</span>}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Nativo de Alerta y Confirmación */}
        <AppErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal((prev) => ({ ...prev, isOpen: false }))}
          title={errorModal.title}
          message={errorModal.message}
          type={errorModal.type}
          actionText={errorModal.actionText}
          cancelText={errorModal.cancelText}
          onConfirm={errorModal.onConfirm}
        />
      </main>
    </div>
  );
}
