"use client";

import { useRef } from "react";
import { formatNumberExcel } from "@/lib/numberFormat";

function formatIntegerString(digits) {
  if (!digits) return "";
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export default function FormattedNumberInput({
  id,
  value,
  onChange,
  disabled = false,
  readOnly = false,
  isDecimal = false,
  placeholder = "",
  className = "",
  onKeyDown,
}) {
  const inputRef = useRef(null);

  // Determinar el valor a mostrar:
  // Si es decimal: se muestra tal cual (sin comas de millar)
  // Si es entero: se formatea automáticamente con separador de miles en tiempo real
  let displayValue = "";
  if (value !== undefined && value !== null && value !== "") {
    if (isDecimal) {
      displayValue = String(value).replace(/,/g, "");
    } else {
      const cleanDigits = String(value).replace(/[^\d]/g, "");
      displayValue = formatIntegerString(cleanDigits);
    }
  }

  function handleKeyDownInternal(e) {
    // Bloquear caracteres negativos y notación científica
    if (e.key === "-" || e.key === "e" || e.key === "E") {
      e.preventDefault();
      return;
    }

    // Si el usuario presiona Backspace justo después de una coma, saltar la coma y borrar el dígito anterior
    if (!isDecimal && e.key === "Backspace" && inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start === end && start > 0) {
        const val = input.value;
        if (val[start - 1] === ",") {
          e.preventDefault();
          const clean = (val.slice(0, start - 2) + val.slice(start)).replace(/[^\d]/g, "");
          onChange(clean);
          return;
        }
      }
    }

    if (onKeyDown) onKeyDown(e);
  }

  function handleChange(e) {
    const input = e.target;
    const prevCursor = input.selectionStart || 0;
    const rawInput = e.target.value;

    if (rawInput.includes("-") || rawInput.includes("e") || rawInput.includes("E")) return;

    if (isDecimal) {
      const clean = rawInput.replace(/,/g, "").trim();
      if (clean === "" || /^\d*(\.\d*)?$/.test(clean)) {
        onChange(clean);
      }
    } else {
      // Contar dígitos numéricos antes del cursor antes del formateo
      const digitsBeforeCursor = rawInput.slice(0, prevCursor).replace(/[^\d]/g, "").length;
      const rawDigits = rawInput.replace(/[^\d]/g, "");

      if (rawDigits === "") {
        onChange("");
        return;
      }

      onChange(rawDigits);

      // Calcular nueva posición del cursor tras la inserción automática de comas
      const newFormatted = formatIntegerString(rawDigits);
      requestAnimationFrame(() => {
        if (!inputRef.current) return;
        let newPos = 0;
        let digitsSeen = 0;
        for (let i = 0; i < newFormatted.length; i++) {
          if (newFormatted[i] !== ",") {
            digitsSeen++;
          }
          if (digitsSeen === digitsBeforeCursor) {
            newPos = i + 1;
            break;
          }
        }
        if (digitsBeforeCursor === 0) newPos = 0;
        inputRef.current.setSelectionRange(newPos, newPos);
      });
    }
  }

  return (
    <input
      ref={inputRef}
      id={id}
      type="text"
      inputMode={isDecimal ? "decimal" : "numeric"}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDownInternal}
      disabled={disabled || readOnly}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
    />
  );
}
