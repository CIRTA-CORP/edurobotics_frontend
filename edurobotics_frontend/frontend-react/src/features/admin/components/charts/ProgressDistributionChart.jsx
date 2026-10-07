/**
 * Distribución del avance: cuántos alumnos matriculados van en cada tramo de avance (change
 * `admin-analytics-v2`, tarea 3.3).
 *
 * Datos: `progress.progress_distribution` del overview — [{bin, students}] con los tramos
 * 0, 1–24, 25–49, 50–74, 75–99 y 100 %, calculados en el backend por alumno (contenidos
 * completados sobre los del curso; las evaluaciones no entran).
 */
import { useCallback, useMemo } from 'react'
import { PlotFigure } from './PlotFigure'
import { ChartNumbers } from './ChartNumbers'
import { BAR, INK_SOFT, GRID, baseOptions } from './chartTheme'

const BIN_LABELS = {
  0: '0%',
  '1-24': '1–24%',
  '25-49': '25–49%',
  '50-74': '50–74%',
  '75-99': '75–99%',
  100: '100%',
}

const alumnos = (n) => `${n} alumno${n === 1 ? '' : 's'}`

export function ProgressDistributionChart({ bins, enrolled }) {
  const rows = useMemo(
    () => bins.map((b) => ({ ...b, label: BIN_LABELS[b.bin] ?? `${b.bin}%` })),
    [bins]
  )
  const maxStudents = Math.max(1, ...rows.map((r) => r.students))

  const render = useCallback(
    (Plot, width) =>
      Plot.plot({
        ...baseOptions(width),
        height: 200,
        marginTop: 18,
        marginLeft: 32,
        x: { domain: rows.map((r) => r.label), label: null, tickSize: 0, padding: 0.28 },
        y: { domain: [0, maxStudents], nice: true, label: null, tickSize: 0, ticks: Math.min(4, maxStudents), tickFormat: 'd' },
        marks: [
          Plot.gridY({ stroke: GRID, strokeOpacity: 1 }),
          Plot.barY(rows, { x: 'label', y: 'students', fill: BAR, ry2: 4 }),
          Plot.text(rows, {
            x: 'label',
            y: 'students',
            text: (d) => String(d.students),
            dy: -7,
            fill: INK_SOFT,
            fontWeight: 600,
          }),
          Plot.ruleY([0], { stroke: '#d8d7e0' }),
          Plot.tip(
            rows,
            Plot.pointerX({
              x: 'label',
              y: 'students',
              channels: { Avance: 'label', Alumnos: 'students' },
              format: { x: false, y: false, Avance: true, Alumnos: true },
            })
          ),
        ],
      }),
    [rows, maxStudents]
  )

  const count = (bin) => rows.find((r) => r.bin === bin)?.students ?? 0
  const none = count('0')
  const all = count('100')
  const summary = `De ${alumnos(enrolled)} matriculados, ${none} no ${none === 1 ? 'ha' : 'han'} completado ningún contenido y ${all} ${all === 1 ? 'los completó' : 'los completaron'} todos.`

  return (
    <>
      <p className="mt-2 text-[13px] leading-relaxed text-[#33323b]">{summary}</p>
      <p className="mt-1 text-[11.5px] text-[#a9a8b4]">
        Avance = contenidos completados sobre los del curso; no incluye las evaluaciones.
      </p>
      <div className="mt-4">
        <PlotFigure render={render} height={200} label={`Distribución del avance. ${summary}`} />
      </div>
      <ChartNumbers
        caption="Alumnos por tramo de avance"
        columns={[
          { key: 'label', label: 'Avance' },
          { key: 'students', label: 'Alumnos', numeric: true },
        ]}
        rows={rows.map((r) => ({ id: r.bin, label: r.label, students: r.students }))}
      />
    </>
  )
}

export default ProgressDistributionChart
