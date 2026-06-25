/**
 * CourseTimeMetrics — métricas de tiempo de completado (issue #22).
 *
 * Muestra el tiempo promedio / mínimo / máximo para completar el curso, sus
 * módulos y unidades, calculado a partir del progreso real de los estudiantes.
 */
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/shared/components/card'
import { getCourseTimeMetrics } from '@/features/progress/services/progress'
import { Clock, TrendingUp } from 'lucide-react'

/** Formatea minutos a "Xh Ym" / "Y min" / "Z s" / "—". */
function fmt(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  if (minutes < 1) {
    // Sub-minuto: mostrar segundos reales en vez de un genérico "<1 min".
    const seconds = Math.max(1, Math.round(minutes * 60))
    return `${seconds} s`
  }
  if (minutes < 60) return `${Math.round(minutes)} min`
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m ? `${h}h ${m}m` : `${h}h`
}

function MetricRow({ label, sub, data }) {
  const empty = !data || data.sample === 0
  return (
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-gray-800">{label}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
      {empty ? (
        <span className="text-xs text-gray-400">Sin datos aún</span>
      ) : (
        <div className="flex items-center gap-4 text-right text-xs">
          <div>
            <p className="font-semibold text-gray-900">{fmt(data.avg_minutes)}</p>
            <p className="text-[10px] text-gray-400">
              {data.sample < 2 ? 'tiempo' : 'promedio'}
            </p>
          </div>
          {/* mín – máx solo aporta con ≥2 alumnos (con 1, es idéntico al promedio). */}
          {data.sample >= 2 && (
            <div className="hidden sm:block">
              <p className="text-gray-600">{fmt(data.min_minutes)} – {fmt(data.max_minutes)}</p>
              <p className="text-[10px] text-gray-400">mín – máx</p>
            </div>
          )}
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
            {data.sample} {data.sample === 1 ? 'alumno' : 'alumnos'}
          </span>
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

  return (
    <Card className="border-gray-200">
      <CardContent className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Clock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Tiempo de completado</h3>
            <p className="text-xs text-gray-400">Promedio, mínimo y máximo según el progreso real</p>
          </div>
        </div>

        {/* Curso completo */}
        <div className="mb-2 rounded-lg bg-indigo-50/60 px-3">
          <MetricRow label={<span className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> {data.course?.title || 'Curso completo'}</span>} data={data.course} />
        </div>

        {/* Módulos */}
        {data.modules?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Por módulo</p>
            {data.modules.map((m) => <MetricRow key={`m-${m.id}`} label={m.title} data={m} />)}
          </div>
        )}

        {/* Unidades */}
        {data.units?.length > 0 && (
          <div className="mt-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Por unidad</p>
            {data.units.map((u) => <MetricRow key={`u-${u.id}`} label={u.title} sub={u.module_title} data={u} />)}
          </div>
        )}

        <p className="mt-4 text-[11px] text-gray-400">
          Las métricas se basan en alumnos que completaron cada parte. Se llenan a medida que hay actividad.
        </p>
      </CardContent>
    </Card>
  )
}
