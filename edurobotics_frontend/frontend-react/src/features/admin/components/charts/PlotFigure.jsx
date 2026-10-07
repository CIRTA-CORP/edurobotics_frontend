/**
 * PlotFigure — dibuja un gráfico de Observable Plot dentro de un div (change
 * `admin-analytics-v2`, fase 3).
 *
 * - Plot se carga con `import()` la primera vez que se dibuja un gráfico: queda en su propio
 *   chunk y no engorda el bundle principal (como Monaco, va empaquetado; nada se pide a
 *   terceros, así que funciona con la CSP de `vercel.json`).
 * - El ancho lo da un ResizeObserver sobre el contenedor; al cambiar, se vuelve a dibujar.
 * - Al desmontar (o antes de redibujar) se quita el SVG anterior.
 * - La imagen es `role="img"` con `aria-label`: un lector de pantalla oye la conclusión, y los
 *   números van fuera de la imagen (ChartNumbers).
 *
 * `render(Plot, width)` debe devolver el nodo de `Plot.plot(...)`. Conviene memoizarlo
 * (useCallback) para no redibujar en cada render del padre.
 */
import { useEffect, useRef, useState } from 'react'

let plotModule = null
let plotPromise = null
function loadPlot() {
  if (!plotPromise) {
    plotPromise = import('@observablehq/plot').then((m) => {
      plotModule = m
      return m
    })
    // Si falla (red caída al pedir el chunk), el siguiente intento vuelve a pedirlo.
    plotPromise.catch(() => {
      plotPromise = null
    })
  }
  return plotPromise
}

export function PlotFigure({ render, label, height = 180 }) {
  const ref = useRef(null)
  const [Plot, setPlot] = useState(() => plotModule)
  const [failed, setFailed] = useState(false)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    if (Plot) return undefined
    let alive = true
    loadPlot().then(
      (m) => alive && setPlot(m),
      () => alive && setFailed(true)
    )
    return () => {
      alive = false
    }
  }, [Plot])

  useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el || !Plot || width <= 0) return undefined
    const chart = render(Plot, width)
    chart.setAttribute('aria-hidden', 'true')
    el.replaceChildren(chart)
    return () => chart.remove()
  }, [Plot, width, render])

  return (
    <figure role="img" aria-label={label} className="relative m-0 w-full">
      {/* React no pone hijos en este div: los maneja Plot. */}
      <div ref={ref} className="w-full" style={{ minHeight: Plot ? undefined : height }} />
      {!Plot && (
        <div
          className={`absolute inset-0 grid place-items-center rounded-[10px] bg-[#fafafc] px-4 text-center text-[12px] text-[#a9a8b4] ${
            failed ? '' : 'motion-safe:animate-pulse'
          }`}
        >
          {failed ? 'No se pudo cargar el gráfico. Los números están más abajo.' : 'Cargando el gráfico…'}
        </div>
      )}
    </figure>
  )
}

export default PlotFigure
