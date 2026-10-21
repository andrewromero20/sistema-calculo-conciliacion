"use client";

import { useState } from "react";
import { formatNumberExcel } from "@/lib/numberFormat";

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
  const [isFocused, setIsFocused] = useState(false);

  // Al estar enfocado se muestra el valor crudo editable (sin comas)
  // Al perder el foco se formatea como en Excel: comas para enteros, sin comas para decimales
  const displayValue = isFocused
    ? value === undefined || value === null
      ? ""
      : String(value).replace(/,/g, "")
    : formatNumberExcel(value, isDecimal);

  function handleChange(e) {
    const raw = e.target.value.replace(/,/g, "").trim();

    // Bloquear caracteres negativos y notación científica
    if (raw.includes("-") || raw.includes("e") || raw.includes("E")) return;

    if (isDecimal) {
      if (raw === "" || /^\d*(\.\d*)?$/.test(raw)) {
        onChange(raw);
      }
    } else {
      if (raw === "" || /^\d*$/.test(raw)) {
        onChange(raw);
      }
    }
  }

  return (
    <input
      id={id}
      type="text"
      inputMode={isDecimal ? "decimal" : "numeric"}
      value={displayValue}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      disabled={disabled || readOnly}
      readOnly={readOnly}
      placeholder={placeholder}
      className={className}
    />
  );
}
