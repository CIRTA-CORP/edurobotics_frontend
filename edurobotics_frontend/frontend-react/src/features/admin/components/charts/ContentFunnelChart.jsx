/**
 * Embudo por contenido: qué parte de los alumnos matriculados completó cada contenido, en el
 * orden del curso, con la mayor caída marcada (change `admin-analytics-v2`, tarea 3.2).
 *
 * Datos: `progress.funnel` del overview del curso — `steps[]` ({content_id, title,
 * completed, pct}) y `biggest_drop_index`, ambos calculados en el backend
 * (analytics/service.py). La barra resaltada es el contenido DESPUÉS del cual más alumnos
 * dejan de avanzar.
 */
import { useCallback, useMemo } from 'react'
import { PlotFigure } from './PlotFigure'
import { ChartNumbers } from './ChartNumbers'
import { ACCENT, BAR_SOFT, GRID, INK_SOFT, baseOptions, fmtPct, labelChars, labelMargin, truncate } from './chartTheme'

export function ContentFunnelChart({ steps, dropIndex, enrolled }) {
  const rows = useMemo(
    () => steps.map((s, i) => ({ ...s, index: i, pct: s.pct ?? 0, highlight: i === dropIndex })),
    [steps, dropIndex]
  )

  const render = useCallback(
    (Plot, width) => {
      const chars = labelChars(width)
      const label = (d) => `${d.index + 1}. ${truncate(d.title, chars)}`
      return Plot.plot({
        ...baseOptions(width),
        height: rows.length * 26 + 34,
        marginLeft: labelMargin(width, chars + 4),
        marginRight: 44,
        x: { domain: [0, 100], label: null, tickFormat: (d) => `${d}%`, ticks: width < 420 ? 3 : 5 },
        y: { domain: rows.map(label), label: null, tickSize: 0 },
        marks: [
          Plot.gridX({ stroke: GRID, strokeOpacity: 1 }),
          Plot.barX(rows, {
            x: 'pct',
            y: label,
            fill: (d) => (d.highlight ? ACCENT : BAR_SOFT),
            rx2: 4,
            insetTop: 4,
            insetBottom: 4,
          }),
          Plot.text(rows, {
            x: 'pct',
            y: label,
            text: (d) => fmtPct(d.pct),
            dx: 5,
            textAnchor: 'start',
            fill: (d) => (d.highlight ? ACCENT : INK_SOFT),
            fontWeight: (d) => (d.highlight ? 700 : 500),
          }),
          Plot.ruleX([0], { stroke: '#d8d7e0' }),
          Plot.tip(
            rows,
            Plot.pointerY({
              x: 'pct',
              y: label,
              channels: {
                Contenido: 'title',
                Completaron: (d) => `${d.completed} de ${enrolled} (${fmtPct(d.pct)})`,
              },
              format: { x: false, y: false, Contenido: true, Completaron: true },
            })
          ),
        ],
      })
    },
    [rows, enrolled]
  )

  const drop =
    dropIndex != null && rows[dropIndex + 1]
      ? { from: rows[dropIndex], to: rows[dropIndex + 1], points: Math.round(rows[dropIndex].pct - rows[dropIndex + 1].pct) }
      : null

  const summary = drop
    ? `La mayor caída es después de «${drop.from.title}»: de ${fmtPct(drop.from.pct)} a ${fmtPct(drop.to.pct)} de los matriculados (−${drop.points} puntos).`
    : 'Ningún contenido pierde alumnos respecto del anterior.'

  return (
    <>
      <p className="mt-2 text-[13px] leading-relaxed text-[#33323b]">{summary}</p>
      <p className="mt-1 text-[11.5px] text-[#a9a8b4]">
        Porcentaje de los {enrolled} alumnos matriculados que completó cada contenido, en el orden del curso.
      </p>
      <div className={`mt-4 ${rows.length > 24 ? 'max-h-[560px] overflow-y-auto pr-1' : ''}`}>
        <PlotFigure
          render={render}
          height={rows.length * 26 + 34}
          label={`Embudo de ${rows.length} contenidos. ${summary}`}
        />
      </div>
      <ChartNumbers
        caption="Alumnos que completaron cada contenido"
        columns={[
          { key: 'n', label: '#', numeric: true },
          { key: 'title', label: 'Contenido' },
          { key: 'completed', label: 'Completaron', numeric: true },
          { key: 'pct', label: '% matriculados', numeric: true },
        ]}
        rows={rows.map((r) => ({
          id: r.content_id,
          n: r.index + 1,
          title: r.highlight ? `${r.title} — mayor caída después` : r.title,
          completed: r.completed,
          pct: fmtPct(r.pct),
          highlight: r.highlight,
        }))}
        highlight={(r) => r.highlight}
      />
    </>
  )
}

export default ContentFunnelChart
