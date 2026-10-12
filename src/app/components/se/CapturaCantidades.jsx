"use client";

import { useState, useMemo } from "react";
import Icon from "../ui/Icon";

const PAGE_SIZE = 12;
const TOTAL_ROWS = 48;

/**
 * Componente para Captura de Cantidades (Pesadas de Tableteado)
 * Basado en nodo 49:3 y comentarios 3, 4, 5, 23 de Figma:
 * - 48 celdas divididas en 4 páginas (12 por página).
 * - Restricción: solo números, máximo 2 decimales.
 * - Autocompletado con .0 al perder foco si se ingresa número entero.
 * - Peso neto calculado automáticamente en cada fila.
 * - Totales en tiempo real.
 */
export default function CapturaCantidades({
  pesos = [],
  onChangePesos,
  readOnly = false,
  errors = {},
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [defaultTaraInput, setDefaultTaraInput] = useState("2.10");

  // Asegurar que existan exactamente 48 filas para la captura o mapeo uniforme
  const fullPesos = useMemo(() => {
    const list = [...pesos];
    while (list.length < TOTAL_ROWS) {
      list.push({
        pesoBruto: "",
        pesoTara: defaultTaraInput || "2.10",
        pesoNeto: 0,
      });
    }
    return list.slice(0, TOTAL_ROWS);
  }, [pesos, defaultTaraInput]);

  // Cálculos de totales
  const totalNeto = useMemo(() => {
    return fullPesos.reduce((acc, p) => acc + (Number(p.pesoNeto) || 0), 0);
  }, [fullPesos]);

  const totalBruto = useMemo(() => {
    return fullPesos.reduce((acc, p) => acc + (Number(p.pesoBruto) || 0), 0);
  }, [fullPesos]);

  const totalTara = useMemo(() => {
    return fullPesos.reduce((acc, p) => acc + (Number(p.pesoTara) || 0), 0);
  }, [fullPesos]);

  const pesadasConValor = useMemo(() => {
    return fullPesos.filter((p) => Number(p.pesoBruto) > 0).length;
  }, [fullPesos]);

  // Actualizar una celda
  function handleCellChange(index, field, rawValue) {
    if (readOnly || !onChangePesos) return;

    // Permitir solo números y un único punto decimal con hasta 2 decimales
    let val = rawValue;
    if (val !== "") {
      // Regex para validar formato parcial de número decimal con máx 2 decimales
      if (!/^\d*(\.\d{0,2})?$/.test(val)) {
        return;
      }
    }

    const updated = fullPesos.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: val };
      const bruto = Number(field === "pesoBruto" ? val : item.pesoBruto) || 0;
      const tara = Number(field === "pesoTara" ? val : item.pesoTara) || 0;
      newItem.pesoNeto = bruto >= tara ? Number((bruto - tara).toFixed(2)) : 0;
      return newItem;
    });

    onChangePesos(updated);
  }

  // Autocompletar con .0 al salir del foco (Figma Comment 4)
  function handleBlur(index, field, value) {
    if (readOnly || !onChangePesos) return;
    if (!value || String(value).trim() === "") return;

    const trimmed = String(value).trim();
    const num = Number(trimmed);
    if (!isNaN(num) && num > 0) {
      // Si no tiene punto decimal, formatear agregando .0
      let formatted = trimmed;
      if (!trimmed.includes(".")) {
        formatted = `${trimmed}.0`;
      } else if (trimmed.endsWith(".")) {
        formatted = `${trimmed}0`;
      }

      const updated = fullPesos.map((item, i) => {
        if (i !== index) return item;
        const newItem = { ...item, [field]: formatted };
        const bruto = Number(field === "pesoBruto" ? formatted : item.pesoBruto) || 0;
        const tara = Number(field === "pesoTara" ? formatted : item.pesoTara) || 0;
        newItem.pesoNeto = bruto >= tara ? Number((bruto - tara).toFixed(2)) : 0;
        return newItem;
      });

      onChangePesos(updated);
    }
  }

  // Manejo de Enter para avanzar a la siguiente fila fluidamente
  function handleKeyDown(e, globalIndex, field) {
    if (e.key === "Enter") {
      e.preventDefault();
      const nextId =
        field === "pesoBruto"
          ? `input-bruto-${globalIndex + 1}`
          : `input-tara-${globalIndex + 1}`;
      const el = document.getElementById(nextId);
      if (el) {
        el.focus();
      } else if (globalIndex + 1 < TOTAL_ROWS) {
        // Si está en la siguiente página, cambiar de página y enfocar
        const targetPage = Math.floor((globalIndex + 1) / PAGE_SIZE) + 1;
        setCurrentPage(targetPage);
        setTimeout(() => {
          document.getElementById(nextId)?.focus();
        }, 50);
      }
    }
  }

  // Aplicar tara común a todas las filas
  function handleAplicarTaraComun() {
    if (readOnly || !onChangePesos) return;
    const taraNum = Number(defaultTaraInput) || 0;
    const formattedTara = defaultTaraInput.includes(".") ? defaultTaraInput : `${defaultTaraInput}.0`;
    const updated = fullPesos.map((item) => {
      const bruto = Number(item.pesoBruto) || 0;
      const neto = bruto >= taraNum ? Number((bruto - taraNum).toFixed(2)) : 0;
      return {
        ...item,
        pesoTara: formattedTara,
        pesoNeto: neto,
      };
    });
    onChangePesos(updated);
  }

  // Paginación de 12 por página
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = fullPesos.slice(startIndex, startIndex + PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Barra de Controles y Resumen */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Captura de Cantidades (Pesadas 1 a 48)
          </h3>
          <p className="text-xs text-slate-500">
            {readOnly
              ? "Lectura de pesadas registradas (12 por página)."
              : "Ingresa peso bruto y tara en kg. Máximo 2 decimales (ej. 52.5). Enter para avanzar."}
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 font-medium">Tara común:</span>
            <input
              type="text"
              value={defaultTaraInput}
              onChange={(e) => setDefaultTaraInput(e.target.value)}
              className="w-16 px-2 py-1 text-xs border border-slate-300 rounded font-mono text-center focus:ring-1 focus:ring-blue-500"
              placeholder="2.10"
            />
            <button
              type="button"
              onClick={handleAplicarTaraComun}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold border border-slate-300 transition"
              title="Aplica este valor de tara a las 48 celdas"
            >
              Aplicar tara
            </button>
          </div>
        )}
      </div>

      {/* Tabla de 12 celdas con diseño PiSA */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs text-left divide-y divide-slate-200">
            <thead className="bg-[#f8fafc] text-slate-700 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th scope="col" className="px-4 py-3 w-16 text-center">
                  #
                </th>
                <th scope="col" className="px-4 py-3">
                  Peso Bruto (kg)
                </th>
                <th scope="col" className="px-4 py-3">
                  Peso Tara (kg)
                </th>
                <th scope="col" className="px-4 py-3 bg-blue-50/70 text-blue-900">
                  Peso Neto (kg)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageItems.map((item, idx) => {
                const globalIndex = startIndex + idx;
                const hasValue = Number(item.pesoBruto) > 0;
                const invalidRow =
                  hasValue && Number(item.pesoTara) > Number(item.pesoBruto);

                return (
                  <tr
                    key={globalIndex}
                    className={`hover:bg-slate-50/80 transition ${
                      invalidRow ? "bg-red-50/40" : hasValue ? "bg-blue-50/20" : ""
                    }`}
                  >
                    <td className="px-4 py-2.5 text-center font-bold text-slate-500 font-mono">
                      {globalIndex + 1}
                    </td>

                    <td className="px-4 py-2">
                      {readOnly ? (
                        <span className="font-mono font-medium text-slate-800">
                          {item.pesoBruto !== "" ? Number(item.pesoBruto).toFixed(2) : "-"}
                        </span>
                      ) : (
                        <input
                          id={`input-bruto-${globalIndex}`}
                          type="text"
                          inputMode="decimal"
                          value={item.pesoBruto}
                          onChange={(e) =>
                            handleCellChange(globalIndex, "pesoBruto", e.target.value)
                          }
                          onBlur={(e) =>
                            handleBlur(globalIndex, "pesoBruto", e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, globalIndex, "pesoBruto")}
                          placeholder="0.0"
                          className={`w-full max-w-[180px] px-3 py-1.5 border rounded font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            invalidRow
                              ? "border-red-400 bg-red-50"
                              : "border-slate-300 bg-white"
                          }`}
                        />
                      )}
                    </td>

                    <td className="px-4 py-2">
                      {readOnly ? (
                        <span className="font-mono text-slate-600">
                          {item.pesoTara !== "" ? Number(item.pesoTara).toFixed(2) : "-"}
                        </span>
                      ) : (
                        <input
                          id={`input-tara-${globalIndex}`}
                          type="text"
                          inputMode="decimal"
                          value={item.pesoTara}
                          onChange={(e) =>
                            handleCellChange(globalIndex, "pesoTara", e.target.value)
                          }
                          onBlur={(e) =>
                            handleBlur(globalIndex, "pesoTara", e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, globalIndex, "pesoTara")}
                          placeholder="2.10"
                          className="w-full max-w-[180px] px-3 py-1.5 border border-slate-300 rounded font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        />
                      )}
                    </td>

                    <td className="px-4 py-2 bg-blue-50/30 font-mono font-bold text-blue-900">
                      {Number(item.pesoNeto || 0).toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Paginación de 4 páginas (12 por página) - Figma Comment 23 */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600">
            Mostrando pesadas <strong>{startIndex + 1}</strong> a{" "}
            <strong>{Math.min(startIndex + PAGE_SIZE, TOTAL_ROWS)}</strong> de{" "}
            <strong>{TOTAL_ROWS}</strong>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition font-medium"
            >
              Anterior
            </button>

            {[1, 2, 3, 4].map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded text-xs font-bold transition ${
                  currentPage === page
                    ? "bg-[#0d6efd] text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage === 4}
              onClick={() => setCurrentPage((p) => Math.min(p + 1, 4))}
              className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 transition font-medium"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>

      {/* Totales en Vivo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Pesadas Capturadas
          </span>
          <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
            {pesadasConValor} / {TOTAL_ROWS}
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Suma Peso Bruto
          </span>
          <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
            {totalBruto.toFixed(2)} kg
          </span>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Suma Peso Tara
          </span>
          <span className="text-lg font-bold text-slate-800 font-mono mt-0.5 block">
            {totalTara.toFixed(2)} kg
          </span>
        </div>

        <div className="bg-blue-50 p-3.5 rounded-xl border border-blue-200 shadow-xs">
          <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
            Masa Total (Peso Neto)
          </span>
          <span className="text-lg font-black text-blue-900 font-mono mt-0.5 block">
            {totalNeto.toFixed(2)} kg
          </span>
        </div>
      </div>
    </div>
  );
}
