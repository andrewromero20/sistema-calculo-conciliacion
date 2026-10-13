"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "../ui/Icon";

export default function Sidebar({ activeView }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [hasDraft, setHasDraft] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(data.user);
      })
      .catch(() => {});
  }, []);

  // Verificar borrador en curso en tiempo real (Figma Comment 8)
  useEffect(() => {
    const checkDraft = () => {
      try {
        const raw =
          localStorage.getItem("se_form_draft") ||
          sessionStorage.getItem("se_form_draft");
        if (raw) {
          const parsed = JSON.parse(raw);
          const hasContent = Boolean(
            parsed &&
              Number(parsed.currentStep) >= 2 &&
              (parsed.ordenGranel ||
                parsed.lote ||
                parsed.producto ||
                (parsed.pesos && parsed.pesos.some((p) => Number(p.pesoBruto) > 0)))
          );
          setHasDraft(hasContent);
          return;
        }
        setHasDraft(false);
      } catch {
        setHasDraft(false);
      }
    };

    checkDraft();
    const handleCustom = () => checkDraft();
    window.addEventListener("se-draft-update", handleCustom);
    window.addEventListener("storage", checkDraft);
    const interval = setInterval(checkDraft, 1200);

    return () => {
      window.removeEventListener("se-draft-update", handleCustom);
      window.removeEventListener("storage", checkDraft);
      clearInterval(interval);
    };
  }, []);

  async function handleLogout() {
    try {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("se_draft_session_active");
      }
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  const role = user?.rol || "USER_SE";

  const seItems = [
    { id: "se-inicio", label: "Inicio", icon: "home", href: "/se" },
    {
      id: "se-nuevo",
      label: "Nuevo registro",
      icon: "plus",
      href: "/se/nuevo",
      hasBadge: hasDraft,
    },
    { id: "se-historial", label: "Historial", icon: "history", href: "/se/historial" },
  ];

  const ptItems = [
    { id: "pt-inicio", label: "Conciliaciones PT", icon: "home", href: "/pt" },
    { id: "pt-nueva", label: "Nueva Conciliación", icon: "plus", href: "/conciliaciones/nueva" },
    { id: "pt-historial", label: "Historial PT", icon: "history", href: "/historial" },
    { id: "pt-se", label: "Consulta SE (Granel)", icon: "search", href: "/pt/se" },
  ];

  let items = [];
  if (role === "ADMIN") {
    items = [
      ...seItems,
      ...ptItems,
    ];
  } else if (role === "USER_SE") {
    items = seItems;
  } else {
    items = ptItems;
  }

  const roleBadge = {
    USER_SE: { label: "Semielaborado (SE)", bg: "bg-blue-900/60 text-blue-200" },
    USER_PT: { label: "Prod. Terminado (PT)", bg: "bg-emerald-900/60 text-emerald-200" },
    ADMIN: { label: "Administrador Global", bg: "bg-purple-900/60 text-purple-200" },
  }[role] || { label: "Usuario", bg: "bg-slate-800 text-slate-300" };

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon">
          <Icon name="calculator" size={21} />
        </span>
        <span>
          Conciliación<br />de Materiales
        </span>
      </div>

      <nav className="nav-list" aria-label="Navegación principal">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={`nav-item ${activeView === item.id ? "active" : ""}`}
          >
            <Icon name={item.icon} />
            <span className="truncate">{item.label}</span>
            {item.hasBadge && (
              <span
                title="Tienes una captura de registro en curso"
                className={`ml-auto shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-tight transition shadow-xs ${
                  activeView === item.id
                    ? "bg-white/20 text-white border border-white/30"
                    : "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                }`}
              >
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                </span>
                <span>En curso</span>
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="user-profile flex flex-col gap-2 mt-auto">
        <div className="flex items-center gap-2.5 w-full">
          <span className="user-icon flex-shrink-0">
            <Icon name="user" />
          </span>
          <div className="overflow-hidden">
            <strong className="truncate text-xs block text-white">
              {user ? user.nombre : "Cargando..."}
            </strong>
            <span
              className={`inline-block mt-0.5 px-1.5 py-0.5 text-[10px] font-semibold rounded ${roleBadge.bg}`}
            >
              {roleBadge.label}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full mt-2 py-1.5 px-2 rounded bg-white/10 hover:bg-white/20 text-xs text-white/90 font-medium flex items-center justify-center gap-1.5 transition"
        >
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>
  );
}
