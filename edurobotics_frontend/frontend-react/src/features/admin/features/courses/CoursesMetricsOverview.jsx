/**
 * CoursesMetricsOverview — basic per-course metrics for the admin dashboard
 * (issue #35): feedback (usefulness), difficulty and how many students completed
 * each course, all in one comparative table.
 */
import { useQuery } from '@tanstack/react-query'
import { ClipboardList, EyeOff } from 'lucide-react'
import { getCoursesBasicMetrics } from '@/features/courses/services/courses'

/** "4.2/5" or "—" when there's no data. */
function Rating({ value }) {
  if (value === null || value === undefined) return <span className="text-gray-300">—</span>
  return (
    <span className="font-semibold text-gray-800">
      {value}
      <span className="text-xs font-normal text-gray-400">/5</span>
    </span>
  )
}

export function CoursesMetricsOverview() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-courses-metrics'],
    queryFn: getCoursesBasicMetrics,
    staleTime: 30_000,
  })

  const courses = data?.courses || []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-gray-700" />
        <h3 className="text-lg font-semibold text-gray-900">Métricas por curso</h3>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-gray-400">Cargando…</div>
        ) : courses.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">Aún no hay cursos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Curso</th>
                  <th className="px-4 py-3 text-center">Completaron</th>
                  <th className="px-4 py-3 text-center">Utilidad</th>
                  <th className="px-4 py-3 text-center">Dificultad</th>
                  <th className="px-4 py-3 text-center">Respuestas</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-800">{c.title}</span>
                        {!c.is_published && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                            <EyeOff className="h-3 w-3" /> Borrador
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-semibold text-gray-900">{c.completed}</span>
                      <span className="text-gray-400"> / {c.learners}</span>
                    </td>
                    <td className="px-4 py-3 text-center"><Rating value={c.avg_usefulness} /></td>
                    <td className="px-4 py-3 text-center"><Rating value={c.avg_difficulty} /></td>
                    <td className="px-4 py-3 text-center text-gray-500">{c.feedback_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[11px] text-gray-400">
        "Completaron" = alumnos que terminaron todo el contenido y aprobaron los quizzes, sobre los que iniciaron. Utilidad y dificultad son el promedio del feedback.
      </p>
    </div>
  )
}
