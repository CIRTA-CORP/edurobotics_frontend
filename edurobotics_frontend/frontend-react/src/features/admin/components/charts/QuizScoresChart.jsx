/**
 * Distribución de puntajes por evaluación (change `admin-analytics-v2`, tarea 3.4).
 *
 * Datos: `performance.quizzes[].distribution` del overview — intentos por tramo de puntaje
 * (0–49, 50–79, 80–89, 90–100), calculados en el backend sobre TODOS los intentos de alumnos.
 * Una barra por evaluación, en proporción, para comparar evaluaciones con distinto número de
 * intentos. Las que rindieron menos de 3 alumnos no se dibujan: se nombran aparte con
 * «datos insuficientes».
 */
import { useCallback, useMemo } from 'react'
import { PlotFigure } from './PlotFigure'
import { ChartNumbers } from './ChartNumbers'
import { GRID, MIN_STUDENTS, SCORE_RAMP, baseOptions, labelChars, labelMargin, truncate } from './chartTheme'

const BINS = [
  { key: '0-49', label: '0–49' },
  { key: '50-79', label: '50–79' },
  { key: '80-89', label: '80–89' },
  { key: '90-100', label: '90–100' },
]

const share = (n, total) => (total ? `${Math.round((n / total) * 100)}%` : '—')

export function QuizScoresChart({ quizzes }) {
  const shown = useMemo(() => quizzes.filter((q) => (q.students_attempted ?? 0) >= MIN_STUDENTS), [quizzes])
  const thin = quizzes.filter((q) => (q.students_attempted ?? 0) < MIN_STUDENTS)

  const rows = useMemo(
    () =>
      shown.flatMap((q, i) => {
        const total = BINS.reduce((acc, b) => acc + (q.distribution?.[b.key] ?? 0), 0)
        return BINS.map((b) => ({
          quiz: q,
          index: i,
          bin: b.label,
          count: q.distribution?.[b.key] ?? 0,
          total,
        }))
      }),
    [shown]
  )

  const render = useCallback(
    (Plot, width) => {
      const chars = labelChars(width)
      const label = (d) => `${d.index + 1}. ${truncate(d.quiz.title, chars)}`
      const domain = shown.map((q, i) => `${i + 1}. ${truncate(q.title, chars)}`)
      return Plot.plot({
        ...baseOptions(width),
        height: shown.length * 34 + 34,
        marginLeft: labelMargin(width, chars + 4),
        marginRight: 20, // la etiqueta «100%» del eje no se corta
        x: { domain: [0, 1], label: null, tickFormat: (d) => `${Math.round(d * 100)}%`, ticks: width < 420 ? 3 : 5 },
        y: { domain, label: null, tickSize: 0 },
        color: { domain: BINS.map((b) => b.label), range: SCORE_RAMP },
        marks: [
          Plot.gridX({ stroke: GRID, strokeOpacity: 1 }),
          Plot.barX(
            rows,
            Plot.stackX({
              x: 'count',
              y: label,
              fill: 'bin',
              offset: 'normalize',
              order: BINS.map((b) => b.label),
              insetTop: 6,
              insetBottom: 6,
              // 2 px de blanco entre tramos: se distinguen aunque el color no baste.
              stroke: '#ffffff',
              strokeWidth: 2,
              channels: {
                Evaluación: (d) => d.quiz.title,
                Puntaje: 'bin',
                Intentos: (d) => `${d.count} de ${d.total} (${share(d.count, d.total)})`,
              },
              tip: { format: { x: false, y: false, fill: false, Evaluación: true, Puntaje: true, Intentos: true } },
            })
          ),
        ],
      })
    },
    [rows, shown]
  )

  return (
    <>
      <p className="mt-2 text-[12.5px] text-[#8b8a95]">
        Proporción de intentos en cada tramo de puntaje. Cuenta cada intento: un alumno que rindió tres veces suma tres.
      </p>
      {shown.length > 0 && (
        <>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Tramos de puntaje">
            {BINS.map((b, i) => (
              <li key={b.key} className="flex items-center gap-1.5 text-[11.5px] text-[#55545f]">
                <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SCORE_RAMP[i] }} aria-hidden="true" />
                {b.label} pts
              </li>
            ))}
          </ul>
          <div className="mt-3">
            <PlotFigure
              render={render}
              height={shown.length * 34 + 34}
              label={`Distribución de puntajes de ${shown.length} evaluaci${shown.length === 1 ? 'ón' : 'ones'}, en proporción de intentos por tramo.`}
            />
          </div>
          <ChartNumbers
            caption="Intentos por tramo de puntaje en cada evaluación"
            columns={[
              { key: 'title', label: 'Evaluación' },
              ...BINS.map((b) => ({ key: b.key, label: b.label, numeric: true })),
              { key: 'total', label: 'Intentos', numeric: true },
            ]}
            rows={shown.map((q) => {
              const total = BINS.reduce((acc, b) => acc + (q.distribution?.[b.key] ?? 0), 0)
              const row = { id: q.quiz_id, title: q.title, total }
              for (const b of BINS) {
                const n = q.distribution?.[b.key] ?? 0
                row[b.key] = `${n} (${share(n, total)})`
              }
              return row
            })}
          />
        </>
      )}
      {thin.length > 0 && (
        <p className="mt-3 text-[12px] text-[#b45309]">
          Datos insuficientes (menos de {MIN_STUDENTS} alumnos la rindieron): {thin.map((q) => q.title).join(', ')}.
        </p>
      )}
    </>
  )
}

export default QuizScoresChart
