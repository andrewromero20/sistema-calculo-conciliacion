"use client";

import { useState, useEffect } from "react";
import { formatDateTime } from "@/app/lib/dateFormat";

/**
 * Componente para captura de fecha y hora estricto en formato 24:00 hrs.
 * Evita que el navegador muestre "a. m." y "p. m." en sistemas con formato regional de 12 hrs.
 */
export default function DateTime24Input({
  id,
  value = "",
  onChange,
  disabled = false,
  readOnly = false,
  className = "",
  maxDate = "",
}) {
  // Descomponer el valor "YYYY-MM-DDTHH:mm"
  const [datePart, setDatePart] = useState("");
  const [timePart, setTimePart] = useState("");

  useEffect(() => {
    if (!value) {
      setDatePart("");
      setTimePart("");
      return;
    }
    const parts = String(value).split("T");
    if (parts.length >= 2) {
      setDatePart(parts[0]);
      setTimePart(parts[1].slice(0, 5));
    } else if (parts[0].includes("-")) {
      setDatePart(parts[0]);
      setTimePart("");
    }
  }, [value]);

  function emitChange(newDate, newTime) {
    if (!onChange) return;
    if (!newDate && !newTime) {
      onChange("");
      return;
    }
    if (newDate && newTime) {
      // Validar si la hora está completa "HH:mm"
      const cleanTime = newTime.trim();
      if (/^([01]\d|2[0-3]):[0-5]\d$/.test(cleanTime)) {
        onChange(`${newDate}T${cleanTime}`);
      } else {
        onChange(`${newDate}T${cleanTime}`);
      }
    } else if (newDate) {
      // Si solo hay fecha, asignamos hora por defecto si no hay
      onChange(`${newDate}T${timePart || "00:00"}`);
    }
  }

  function handleDateChange(e) {
    const d = e.target.value;
    setDatePart(d);
    // Si no había hora y se selecciona fecha, sugerir la hora actual en formato 24 hrs
    let t = timePart;
    if (!t) {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, "0");
      const mm = String(now.getMinutes()).padStart(2, "0");
      t = `${hh}:${mm}`;
      setTimePart(t);
    }
    emitChange(d, t);
  }

  function handleTimeChange(e) {
    let raw = e.target.value.replace(/[^\d:]/g, "");
    
    // Auto-formatear con dos puntos tras 2 dígitos numéricos
    if (raw.length === 2 && !raw.includes(":") && !e.nativeEvent?.inputType?.startsWith("delete")) {
      raw = raw + ":";
    }

    // Limitar longitud a 5 ("HH:mm")
    if (raw.length > 5) {
      raw = raw.slice(0, 5);
    }

    setTimePart(raw);

    // Si coincide con formato HH:mm, validar rangos
    if (/^\d{2}:\d{2}$/.test(raw)) {
      const [hStr, mStr] = raw.split(":");
      let h = parseInt(hStr, 10);
      let m = parseInt(mStr, 10);
      if (h > 23) h = 23;
      if (m > 59) m = 59;
      const validTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setTimePart(validTime);
      if (datePart) {
        emitChange(datePart, validTime);
      }
    } else if (datePart && raw.length === 5) {
      emitChange(datePart, raw);
    }
  }

  function handleTimeBlur() {
    if (!timePart) return;
    // Si el usuario escribió ej. "9" o "9:30" o "14"
    let clean = timePart.trim();
    if (/^\d{1,2}$/.test(clean)) {
      let h = Math.min(23, parseInt(clean, 10));
      clean = `${String(h).padStart(2, "0")}:00`;
      setTimePart(clean);
      if (datePart) emitChange(datePart, clean);
    } else if (/^\d{1,2}:\d{1,2}$/.test(clean)) {
      const [hStr, mStr] = clean.split(":");
      let h = Math.min(23, parseInt(hStr, 10));
      let m = Math.min(59, parseInt(mStr, 10));
      clean = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      setTimePart(clean);
      if (datePart) emitChange(datePart, clean);
    }
  }

  if (readOnly) {
    return (
      <input
        type="text"
        readOnly
        disabled
        value={value ? formatDateTime(value) : "-"}
        className="w-full px-2.5 py-1.5 text-xs border rounded-lg bg-slate-100 text-slate-700 font-mono cursor-not-allowed select-none"
      />
    );
  }

  // Fecha máxima permitida (por defecto hoy si no se pasa)
  const maxDateStr = maxDate || new Date().toISOString().slice(0, 10);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* Campo Fecha */}
      <input
        type="date"
        id={id ? `${id}-date` : undefined}
        value={datePart}
        max={maxDateStr}
        disabled={disabled}
        onChange={handleDateChange}
        className="w-full px-2 py-1 text-xs border border-slate-300 rounded-lg bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
        title="Selecciona la fecha (formato DD/MM/AAAA)"
      />

      {/* Campo Hora en formato 24 hrs */}
      <div className="relative flex items-center">
        <input
          type="text"
          id={id ? `${id}-time` : undefined}
          inputMode="numeric"
          value={timePart}
          disabled={disabled}
          placeholder="00:00"
          maxLength={5}
          onChange={handleTimeChange}
          onBlur={handleTimeBlur}
          className="w-full px-2 py-1 pr-12 text-xs border border-slate-300 rounded-lg bg-white font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs placeholder:text-slate-400"
          title="Ingresa la hora en formato 24 hrs (ej. 14:30)"
        />
        <span className="absolute right-2 text-[10px] font-bold text-slate-500 pointer-events-none select-none tracking-tight">
          24 hrs
        </span>
      </div>
    </div>
  );
}
