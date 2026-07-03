/**
 * CourseTimeMetrics — time-spent metrics for a course (issue #22).
 *
 * Shows the estimated *active* time learners spend on the course, its modules
 * and units. Completion time (avg/min/max) is measured over learners who
 * finished a scope; learners still in progress are reflected via the
 * "invested so far" figure and the started/completed counts, so the panel is
 * useful before anyone completes the course.
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

/** Picks the headline figure for a scope: median completion time, else invested. */
function headline(data) {
  if (!data || (data.learners ?? 0) === 0) return null
  if (data.sample > 0) {
    return { value: data.median_minutes, label: 'habitual al completar', inProgress: false }
  }
  return { value: data.invested_avg_minutes, label: 'invertido hasta ahora', inProgress: true }
}

function MetricRow({ label, sub, data }) {
  const h = headline(data)
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      {!h ? (
        <span className="text-xs text-gray-300">Sin actividad</span>
      ) : (
        <div className="flex items-center gap-4 text-right">
          <div>
            <p className="text-sm font-semibold text-gray-900">{fmt(h.value)}</p>
            <p className="text-[10px] text-gray-400">{h.inProgress ? 'en progreso' : 'habitual'}</p>
          </div>
          <p className="w-20 text-[11px] text-gray-400">
            {data.completed > 0
              ? `${data.completed} de ${data.learners} completó`
              : `${data.learners} iniciaron`}
          </p>
        </div>
      )}
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
            <p className="text-xs text-gray-400">Desde que inician hasta que completan (incluye pausas entre sesiones)</p>
          </div>
        </div>

        {/* Course summary */}
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50/60 p-4">
          {!h ? (
            <p className="text-sm text-gray-400">Aún no hay actividad en este curso.</p>
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
            {data.modules.map((m) => <MetricRow key={`m-${m.id}`} label={m.title} data={m} />)}
          </div>
        )}

        {/* Units */}
        {data.units?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Por unidad</p>
            {data.units.map((u) => <MetricRow key={`u-${u.id}`} label={u.title} sub={u.module_title} data={u} />)}
          </div>
        )}

        <p className="mt-4 text-[11px] text-gray-400">
          "Habitual" = mediana del tiempo entre iniciar y completar, de quienes terminaron cada parte (robusta ante casos que quedaron pausados mucho tiempo). Las unidades de un solo contenido tienden a ~0.
        </p>
      </CardContent>
    </Card>
  )
}
