/**
 * CourseTimeMetrics — real active time-on-task for a course (issue #22 / F5).
 *
 * Time is *measured* from client heartbeats while a learner has the lesson open
 * and its tab visible — not inferred from the calendar span between first start
 * and last completion (which made single-content units read as ~0 / "1 s").
 * Scopes with no accrued time show "datos insuficientes", never a fake number.
 */
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/shared/components/card'
import { getCourseTimeMetrics } from '@/features/progress/services/progress'
import { Clock } from 'lucide-react'

/** Formatea minutos a "Xd Yh" / "Xh Ym" / "Y min" / "Z s" / "—". */
function fmt(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 1) {
    const seconds = Math.max(1, Math.round(minutes * 60))
    return `${seconds} s`
  }
  if (minutes < 60) return `${Math.round(minutes)} min`
  if (minutes < 1440) {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return m ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(minutes / 1440)
  const h = Math.round((minutes % 1440) / 60)
  return h ? `${d}d ${h}h` : `${d} d`
}

/** Picks the headline figure for a scope: median active time, else invested.
 *  A value of 0 means no heartbeats accrued → treated as insufficient data. */
function headline(data) {
  if (!data || (data.learners ?? 0) === 0) return null
  // If anyone completed the scope, the figure is completion time — never "en
  // progreso". When their typical time wasn't measured (median 0, e.g. old
  // completions with no heartbeat history), show insufficient data instead of
  // falling back to the in-progress average.
  if ((data.completed ?? 0) > 0) {
    if (data.median_minutes) {
      return { value: data.median_minutes, label: 'tiempo activo típico', inProgress: false }
    }
    return null
  }
  // Nobody has finished yet → in-progress invested time (only here does "en
  // progreso" make sense).
  if (data.invested_avg_minutes) {
    return { value: data.invested_avg_minutes, label: 'invertido hasta ahora', inProgress: true }
  }
  return null
}

/** One row of the per-module / per-unit table: Parte · Completaron · Tiempo típico. */
function MetricRow({ label, sub, data }) {
  const h = headline(data)
  const completed = data.completed ?? 0
  const learners = data.learners ?? 0
  return (
    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-b border-gray-100 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="truncate text-xs text-gray-400">{sub}</p>}
      </div>
      <p className="w-24 text-right text-[11px] text-gray-400">
        {completed > 0 ? `${completed} de ${learners} completó` : `${learners} iniciaron`}
      </p>
      <div className="w-16 text-right">
        {h ? (
          <>
            <p className="text-sm font-semibold text-gray-900">{fmt(h.value)}</p>
            <p className="text-[10px] text-gray-400">{h.inProgress ? 'en progreso' : 'activo'}</p>
          </>
        ) : (
          <p className="text-[11px] text-gray-300">datos insuficientes</p>
        )}
      </div>
    </div>
  )
}

/** Small header above a metric table. */
function TableHead() {
  return (
    <div className="grid grid-cols-[1fr_auto_auto] gap-4 pb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-300">
      <span>Parte</span>
      <span className="w-24 text-right">Completaron</span>
      <span className="w-16 text-right">Tiempo</span>
    </div>
  )
}

export function CourseTimeMetrics({ courseId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['course-time-metrics', courseId],
    queryFn: () => getCourseTimeMetrics(courseId),
    enabled: !!courseId,
    staleTime: 30_000,
  })

  if (isLoading) {
    return <Card className="border-gray-200"><CardContent className="py-6 text-center text-sm text-gray-400">Cargando métricas…</CardContent></Card>
  }
  if (!data || data.error) return null

  const course = data.course
  const h = headline(course)

  return (
    <Card className="border-gray-200">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tiempo de dedicación</h3>
            <p className="text-xs text-gray-400">Tiempo activo real mientras el alumno está en la lección</p>
          </div>
        </div>

        {/* Course summary */}
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/60 p-4">
          {!h ? (
            <p className="text-sm text-gray-400">Aún no hay tiempo activo registrado en este curso.</p>
          ) : (
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div>
                <p className="text-2xl font-bold text-gray-900">{fmt(h.value)}</p>
                <p className="text-xs text-gray-500">{h.label}</p>
              </div>
              {course.sample >= 2 && (
                <div>
                  <p className="text-sm font-medium text-gray-700">{fmt(course.min_minutes)} – {fmt(course.max_minutes)}</p>
                  <p className="text-xs text-gray-400">rango mín – máx</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {course.learners} {course.learners === 1 ? 'inició' : 'iniciaron'}
                  {course.completed > 0 && <span className="text-gray-400"> · {course.completed} completaron</span>}
                </p>
                <p className="text-xs text-gray-400">alumnos</p>
              </div>
            </div>
          )}
        </div>

        {/* Modules */}
        {data.modules?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Por módulo</p>
            <TableHead />
            {data.modules.map((m) => <MetricRow key={`m-${m.id}`} label={m.title} data={m} />)}
          </div>
        )}

        {/* Units */}
        {data.units?.length > 0 && (
          <div className="mt-4">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Por unidad</p>
            <TableHead />
            {data.units.map((u) => <MetricRow key={`u-${u.id}`} label={u.title} sub={u.module_title} data={u} />)}
          </div>
        )}

        <p className="mt-4 text-[11px] text-gray-400">
          "Tiempo activo típico" = mediana del tiempo real en la lección (pestaña abierta y visible),
          entre quienes completaron cada parte. Las partes sin actividad registrada muestran "datos insuficientes".
        </p>
      </CardContent>
    </Card>
  )
}
