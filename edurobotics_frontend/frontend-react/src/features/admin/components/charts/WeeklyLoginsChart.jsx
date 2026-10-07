/**
 * Inicios de sesión de alumnos por semana, en toda la plataforma (change
 * `admin-analytics-v2`, tarea 3.5).
 *
 * Datos: `/api/analytics/sessions-daily?days=84` — la serie diaria (días de Chile,
 * rellenada con ceros) agrupada aquí en 12 semanas de 7 días que terminan hoy. Con menos de
 * un ingreso de alumno por día, una serie diaria era casi toda ceros.
 */
import { useCallback, useMemo } from 'react'
import { PlotFigure } from './PlotFigure'
import { ChartNumbers } from './ChartNumbers'
import { BAR, GRID, INK_SOFT, baseOptions } from './chartTheme'
import { weeklyBuckets } from './weeks'

const ingresos = (n) => `${n} ingreso${n === 1 ? '' : 's'}`

export function WeeklyLoginsChart({ series, students }) {
  const weeks = useMemo(() => weeklyBuckets(series), [series])
  const maxCount = Math.max(1, ...weeks.map((w) => w.count))

  const render = useCallback(
    (Plot, width) => {
      const labels = weeks.map((w) => w.label)
      // A 390 px no caben doce fechas: se rotula una de cada dos (todas siguen en la tabla).
      const ticks = width < 560 ? labels.filter((_, i) => (labels.length - 1 - i) % 2 === 0) : labels
      return Plot.plot({
        ...baseOptions(width),
        height: 190,
        marginTop: 18,
        marginLeft: 32,
        x: { domain: labels, label: null, tickSize: 0, padding: 0.3, ticks },
        y: { domain: [0, maxCount], nice: true, label: null, tickSize: 0, ticks: Math.min(4, maxCount), tickFormat: 'd' },
        marks: [
          Plot.gridY({ stroke: GRID, strokeOpacity: 1 }),
          Plot.barY(weeks, { x: 'label', y: 'count', fill: BAR, ry2: 4 }),
          // Cifra sobre cada barra solo donde cabe; en pantallas angostas, en la tabla y el tip.
          width >= 560
            ? Plot.text(weeks, {
                x: 'label',
                y: 'count',
                text: (d) => (d.count > 0 ? String(d.count) : ''),
                dy: -7,
                fill: INK_SOFT,
                fontWeight: 600,
              })
            : null,
          Plot.ruleY([0], { stroke: '#d8d7e0' }),
          Plot.tip(
            weeks,
            Plot.pointerX({
              x: 'label',
              y: 'count',
              channels: { Semana: 'range', Ingresos: 'count' },
              format: { x: false, y: false, Semana: true, Ingresos: true },
            })
          ),
        ],
      })
    },
    [weeks, maxCount]
  )

  const total = weeks.reduce((acc, w) => acc + w.count, 0)
  const last = weeks.at(-1)
  const who = students == null ? '' : ` de ${students} alumno${students === 1 ? '' : 's'}`
  const summary = `${ingresos(total)}${who} en las últimas ${weeks.length} semanas${
    last ? `; ${ingresos(last.count)} en los últimos 7 días` : ''
  }.`

  return (
    <>
      <p className="mt-2 text-[13px] leading-relaxed text-[#33323b]">{summary}</p>
      <p className="mt-1 text-[11.5px] text-[#a9a8b4]">
        Semanas de 7 días que terminan hoy, rotuladas por su primer día. Un ingreso = un inicio de sesión.
      </p>
      <div className="mt-4">
        <PlotFigure render={render} height={190} label={`Ingresos de alumnos por semana. ${summary}`} />
      </div>
      <ChartNumbers
        caption="Ingresos de alumnos por semana"
        columns={[
          { key: 'range', label: 'Semana' },
          { key: 'count', label: 'Ingresos', numeric: true },
        ]}
        rows={weeks.map((w) => ({ id: w.key, range: w.range, count: w.count }))}
      />
    </>
  )
}

export default WeeklyLoginsChart
