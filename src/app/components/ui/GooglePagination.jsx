"use client";

/**
 * Paginación estilo Google (Figma Comment 16):
 * - Máximo 6 botones de página visibles en la barra.
 * - Siempre reserva la página 1 a la izquierda.
 * - Controles de navegación Anterior y Siguiente.
 */
export default function GooglePagination({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxButtons = 6,
}) {
  if (totalPages <= 1) return null;

  function calculatePages() {
    if (totalPages <= maxButtons) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const pages = [1];
    const remainingSlots = maxButtons - 1;

    if (currentPage <= 3) {
      for (let i = 2; i <= remainingSlots + 1; i++) {
        pages.push(i);
      }
    } else if (currentPage >= totalPages - 2) {
      const start = totalPages - remainingSlots + 1;
      for (let i = start; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // En medio: centrar alrededor de currentPage
      const half = Math.floor(remainingSlots / 2);
      const start = currentPage - half + 1;
      for (let i = start; i < start + remainingSlots; i++) {
        pages.push(i);
      }
    }

    return Array.from(new Set(pages)).sort((a, b) => a - b);
  }

  const visiblePages = calculatePages();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs py-3">
      <span className="text-slate-500 font-medium">
        Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
      </span>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition"
        >
          ‹ Anterior
        </button>

        {visiblePages.map((page, idx) => {
          const prevPage = visiblePages[idx - 1];
          const hasGap = prevPage && page - prevPage > 1;

          return (
            <div key={page} className="flex items-center gap-1.5">
              {hasGap && <span className="text-slate-400 px-1 font-bold">...</span>}
              <button
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-8 h-8 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                  currentPage === page
                    ? "bg-[#0d6efd] text-white shadow-xs"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {page}
              </button>
            </div>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-medium transition"
        >
          Siguiente ›
        </button>
      </div>
    </div>
  );
}
