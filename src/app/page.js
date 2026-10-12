"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootHomePage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (!res.ok) throw new Error("No autenticado");
        return res.json();
      })
      .then((data) => {
        if (data?.user?.rol === "USER_SE") {
          router.replace("/se");
        } else {
          router.replace("/pt");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
      <p className="text-xs font-semibold text-slate-600">
        Cargando sistema de conciliación...
      </p>
    </div>
  );
}
