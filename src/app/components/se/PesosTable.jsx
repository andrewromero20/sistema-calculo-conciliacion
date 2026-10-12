"use client";

import { useMemo } from "react";
import Icon from "../ui/Icon";

export default function PesosTable({
  pesos = [],
  onChangePesos,
  readOnly = false,
  errors = {},
}) {
  // Calcular totales
  const totalNeto = useMemo(() => {
    return pesos.reduce((acc, p) => acc + (Number(p.pesoNeto) || 0), 0);
  }, [pesos]);

  const totalBruto = useMemo(() => {
    return pesos.reduce((acc, p) => acc + (Number(p.pesoBruto) || 0), 0);
  }, [pesos]);

  const totalTara = useMemo(() => {
    return pesos.reduce((acc, p) => acc + (Number(p.pesoTara) || 0), 0);
  }, [pesos]);

  function handleRowChange(index, field, value) {
    if (readOnly || !onChangePesos) return;

    const updated = pesos.map((item, i) => {
      if (i !== index) return item;

      const newItem = { ...item, [field]: value };
      const bruto = Number(field === "pesoBruto" ? value : item.pesoBruto) || 0;
      const tara = Number(field === "pesoTara" ? value : item.pesoTara) || 0;
      const neto = bruto >= tara ? Number((bruto - tara).toFixed(4)) : 0;
      newItem.pesoNeto = neto;
      return newItem;
    });

    onChangePesos(updated);
  }

  function handleAddRow() {
    if (readOnly || !onChangePesos || pesos.length >= 48) return;
    const newRow = {
      pesoBruto: "",
      pesoTara: pesos.length > 0 ? pesos[pesos.length - 1].pesoTara : 0,
      pesoNeto: 0,
    };
    onChangePesos([...pesos, newRow]);
  }

  function handleAddMultiple(count = 5) {
    if (readOnly || !onChangePesos) return;
    const available = Math.min(count, 48 - pesos.length);
    if (available <= 0) return;

    const defaultTara = pesos.length > 0 ? pesos[pesos.length - 1].pesoTara : 0;
    const newRows = Array.from({ length: available }).map(() => ({
      pesoBruto: "",
      pesoTara: defaultTara,
      pesoNeto: 0,
    }));
    onChangePesos([...pesos, ...newRows]);
  }

  function handleRemoveRow(index) {
    if (readOnly || !onChangePesos || pesos.length <= 1) return;
    onChangePesos(pesos.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">
            Tabla de Pesos de Tableteado ({pesos.length} de 48 máx.)
          </h3>
          <p className="text-xs text-slate-500">
            {readOnly
              ? "Lectura de pesadas capturadas durante la producción."
              : "Registra entre 1 y 48 pesadas. El peso neto y total se calculan automáticamente."}
          </p>
        </div>

        {!readOnly && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddRow}
              disabled={pesos.length >= 48}
              className="py-1.5 px-3 rounded-md bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <Icon name="plus" size={14} />
              <span>+1 Pesada</span>
            </button>
            <button
              type="button"
              onClick={() => handleAddMultiple(5)}
              disabled={pesos.length >= 44}
              className="py-1.5 px-3 rounded-md border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium transition disabled:opacity-50"
            >
              +5 Pesadas
            </button>
          </div>
        )}
      </div>

      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
            <thead className="bg-slate-50 sticky top-0 z-10 font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-3 py-2.5 w-14 text-center">
                  #
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Peso Bruto (kg)
                </th>
                <th scope="col" className="px-3 py-2.5">
                  Tara (kg)
                </th>
                <th scope="col" className="px-3 py-2.5 bg-blue-50/60 text-blue-900">
                  Peso Neto (kg)
                </th>
                {!readOnly && (
                  <th scope="col" className="px-3 py-2.5 w-16 text-center">
                    Acción
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {pesos.map((peso, index) => {
                const hasError =
                  errors?.[index] ||
                  (Number(peso.pesoBruto) > 0 &&
                    Number(peso.pesoTara) > Number(peso.pesoBruto));

                return (
                  <tr
                    key={index}
                    className={`hover:bg-slate-50/70 transition ${
                      hasError ? "bg-red-50/30" : ""
                    }`}
                  >
                    <td className="px-3 py-2 text-center font-bold text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-3 py-2">
                      {readOnly ? (
                        <span className="font-semibold text-slate-800">
                          {Number(peso.pesoBruto).toFixed(3)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          required
                          value={peso.pesoBruto === "" ? "" : peso.pesoBruto}
                          onChange={(e) =>
                            handleRowChange(index, "pesoBruto", e.target.value)
                          }
                          placeholder="0.000"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      )}
                    </td>

                    <td className="px-3 py-2">
                      {readOnly ? (
                        <span className="text-slate-600">
                          {Number(peso.pesoTara).toFixed(3)}
                        </span>
                      ) : (
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={peso.pesoTara === "" ? "" : peso.pesoTara}
                          onChange={(e) =>
                            handleRowChange(index, "pesoTara", e.target.value)
                          }
                          placeholder="0.000"
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-blue-500 font-mono"
                        />
                      )}
                    </td>

                    <td className="px-3 py-2 bg-blue-50/30 font-mono font-bold text-blue-900">
                      {Number(peso.pesoNeto || 0).toFixed(3)}
                    </td>

                    {!readOnly && (
                      <td className="px-3 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(index)}
                          disabled={pesos.length <= 1}
                          title="Eliminar fila"
                          className="p-1 rounded text-red-600 hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
                        >
                          <Icon name="trash" size={15} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300 sticky bottom-0 text-slate-900">
              <tr>
                <td className="px-3 py-2.5 text-center text-xs">Total</td>
                <td className="px-3 py-2.5 font-mono text-xs">
                  {totalBruto.toFixed(3)} kg
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-slate-600">
                  {totalTara.toFixed(3)} kg
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-blue-700 bg-blue-100/70">
                  {totalNeto.toFixed(3)} kg
                </td>
                {!readOnly && <td></td>}
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
        <span className="font-medium">
          Peso Neto Total calculado:{" "}
          <strong className="text-sm font-bold text-blue-800">
            {totalNeto.toFixed(3)} kg
          </strong>
        </span>
        <span className="text-blue-700">
          Total de pesadas registradas: <strong>{pesos.length}</strong>
        </span>
      </div>
    </div>
  );
}
