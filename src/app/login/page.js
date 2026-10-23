"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../components/ui/Icon";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const testUsers = [
    {
      label: "Semielaborado (SE)",
      desc: "USER_SE - Registro y Control",
      email: "se@empresa.com",
      pass: "Se123!",
      color: "bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100",
    },
    {
      label: "Producto Terminado (PT)",
      desc: "USER_PT - Conciliación y Consulta",
      email: "pt@empresa.com",
      pass: "Pt123!",
      color: "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100",
    },
    {
      label: "Administrador (ADMIN)",
      desc: "Gestión de Usuarios y Roles",
      email: "admin@empresa.com",
      pass: "Admin123!",
      color: "bg-purple-50 text-purple-800 border-purple-200 hover:bg-purple-100",
    },
  ];

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        throw new Error(
          res.status === 404
            ? "Ruta /api/auth/login no encontrada (404). Verifica que tu repositorio tenga la rama con autenticación activa (ej. feature/semi)."
            : `El servidor devolvió un error HTTP ${res.status} no-JSON. Revisa la consola del servidor Next.js o tu archivo .env.`
        );
      }

      if (!res.ok) {
        throw new Error(data?.error || "Error al iniciar sesión.");
      }

      // Redirigir según rol
      if (data.user.rol === "ADMIN") {
        router.push("/admin");
      } else if (data.user.rol === "USER_SE") {
        router.push("/se");
      } else {
        router.push("/pt");
      }
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelectTestUser(testUser) {
    setEmail(testUser.email);
    setPassword(testUser.pass);
    setError("");
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#073763] text-white shadow-lg mb-4">
          <Icon name="calculator" size={30} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sistema de Conciliación
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Control de Producto Semielaborado (SE) y Terminado (PT)
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md rounded-xl sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
              <span className="font-bold text-red-500">!</span>
              <div>
                <p className="font-semibold">Error de autenticación</p>
                <p className="mt-0.5 text-xs text-red-600">{error}</p>
              </div>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@empresa.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent text-sm transition"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1"
              >
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0d6efd] focus:border-transparent text-sm transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0d6efd] hover:bg-[#0b5ed7] text-white font-semibold text-sm shadow-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? "Iniciando sesión..." : "Ingresar al Sistema"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 text-center">
              Acceso Rápido por Perfil (Demo RBAC)
            </p>
            <div className="grid grid-cols-1 gap-2">
              {testUsers.map((tu) => (
                <button
                  key={tu.email}
                  type="button"
                  onClick={() => handleSelectTestUser(tu)}
                  className={`text-left p-2.5 rounded-lg border transition ${tu.color} flex items-center justify-between group`}
                >
                  <div>
                    <p className="font-semibold text-xs">{tu.label}</p>
                    <p className="text-[11px] opacity-80">{tu.email}</p>
                  </div>
                  <span className="text-xs font-bold opacity-0 group-hover:opacity-100 transition">
                    Cargar →
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
