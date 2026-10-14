"use client";

import { useState, useRef, useEffect } from "react";

export default function AutocompleteInput({
  label,
  value = "",
  onChange,
  onBlur,
  options = [],
  placeholder = "",
  disabled = false,
  required = false,
  error = "",
  id,
  isUnmodified = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Filtrar sugerencias basadas en el texto actual
  const filtered = options.filter((opt) =>
    opt.toLowerCase().includes((value || "").toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(option) {
    if (onChange) onChange(option);
    setIsOpen(false);
  }

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label
          htmlFor={id}
          className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            if (!disabled && options.length > 0) setIsOpen(true);
          }}
          onBlur={onBlur}
          className={`w-full px-3 py-2 text-xs border rounded-lg transition focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium ${
            disabled
              ? "bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed"
              : error
              ? "border-red-400 bg-red-50/30 text-slate-900"
              : isUnmodified
              ? "border-blue-500 ring-2 ring-blue-400 bg-blue-50/15 shadow-[0_0_8px_rgba(59,130,246,0.35)]"
              : "border-slate-300 bg-white text-slate-900 hover:border-slate-400"
          }`}
        />

        {!disabled && options.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px]"
          >
            ▼
          </button>
        )}
      </div>

      {isOpen && !disabled && filtered.length > 0 && (
        <ul className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-lg py-1 text-xs divide-y divide-slate-100 animate-in fade-in zoom-in-95">
          {filtered.map((item, idx) => (
            <li
              key={idx}
              onMouseDown={() => handleSelect(item)}
              className="px-3 py-2 hover:bg-blue-50 hover:text-blue-900 cursor-pointer font-medium text-slate-700 transition"
            >
              {item}
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-[11px] text-red-600 font-medium">{error}</p>}
    </div>
  );
}
