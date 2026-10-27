"use client";

import { useRef } from "react";
import { formatWithThousandSeparators } from "@/lib/numberFormat";

function calcCursorPosition(rawInput, prevCursor, formatted) {
  const nonCommasBeforeCursor = rawInput.slice(0, prevCursor).replace(/,/g, "").length;
  if (nonCommasBeforeCursor === 0) return 0;
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (formatted[i] !== ",") {
      count++;
    }
    if (count === nonCommasBeforeCursor) {
      return i + 1;
    }
  }
  return formatted.length;
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

  // Valor a mostrar formateado automáticamente con separador de miles (,)
  let displayValue = "";
  if (value !== undefined && value !== null && value !== "") {
    displayValue = formatWithThousandSeparators(value);
  }

  function handleKeyDownInternal(e) {
    // Bloquear caracteres negativos y notación científica
    if (e.key === "-" || e.key === "e" || e.key === "E") {
      e.preventDefault();
      return;
    }

    // Si el usuario presiona Backspace justo después de una coma, saltar la coma y borrar el dígito anterior
    if (e.key === "Backspace" && inputRef.current) {
      const input = inputRef.current;
      const start = input.selectionStart;
      const end = input.selectionEnd;
      if (start === end && start > 0) {
        const val = input.value;
        if (val[start - 1] === ",") {
          e.preventDefault();
          const clean = (val.slice(0, start - 2) + val.slice(start)).replace(/,/g, "");
          onChange(clean);
          const rawBefore = val.slice(0, start - 2);
          const formatted = formatWithThousandSeparators(clean);
          const newPos = calcCursorPosition(rawBefore, rawBefore.length, formatted);
          requestAnimationFrame(() => {
            if (inputRef.current) {
              inputRef.current.setSelectionRange(newPos, newPos);
            }
          });
          return;
        }
      }
    }

    if (onKeyDown) onKeyDown(e);
  }

  function handleChange(e) {
    const input = e.target;
    const prevCursor = input.selectionStart || 0;
    const rawInput = input.value;

    if (rawInput.includes("-") || rawInput.includes("e") || rawInput.includes("E")) return;

    const clean = rawInput.replace(/,/g, "").trim();

    if (clean === "") {
      onChange("");
      return;
    }

    if (isDecimal) {
      // Permitir números con o sin decimales (solo un punto)
      if (!/^\d*(\.\d*)?$/.test(clean)) return;
    } else {
      // Solo números enteros
      if (!/^\d*$/.test(clean)) return;
    }

    onChange(clean);

    const formatted = formatWithThousandSeparators(clean);
    const newPos = calcCursorPosition(rawInput, prevCursor, formatted);

    // Actualizar sincrónicamente y en el siguiente ciclo de render
    input.value = formatted;
    input.setSelectionRange(newPos, newPos);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
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
