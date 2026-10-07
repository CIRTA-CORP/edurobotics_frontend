/**
 * ChartNumbers — los números de un gráfico, fuera de la imagen.
 *
 * La tabla existe siempre: oculta a la vista (`sr-only`) pero legible para un lector de
 * pantalla, y visible con «Ver los números». Así nadie depende de leer barras.
 */
import { useId, useState } from 'react'

const TH = 'pb-2 pr-3 text-left font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4] last:pr-0'
const TD = 'py-2 pr-3 text-[12.5px] text-[#33323b] last:pr-0'

/**
 * columns: [{ key, label, numeric? }]; rows: [{ id, ...valores ya formateados }];
 * `highlight(row)` marca una fila (p. ej., la de la mayor caída).
 */
export function ChartNumbers({ caption, columns, rows, highlight }) {
  const [open, setOpen] = useState(false)
  const id = useId()

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={id}
        className="rounded-md font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] text-[#8b8a95] hover:text-[#4b46d6] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b46d6]"
      >
        {open ? 'Ocultar los números' : 'Ver los números'}
      </button>
      <div id={id} className={open ? 'mt-2.5 overflow-x-auto' : 'sr-only'}>
        <table className="w-full border-collapse">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`${TH} ${c.numeric ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const marked = highlight?.(r)
              return (
                <tr key={r.id} className={`border-t border-[#f2f1f6] ${marked ? 'bg-[#f4f3fd]' : ''}`}>
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`${TD} ${c.numeric ? 'text-right font-mono tabular-nums' : ''} ${marked ? 'font-semibold text-[#16151b]' : ''}`}
                    >
                      {r[c.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ChartNumbers
