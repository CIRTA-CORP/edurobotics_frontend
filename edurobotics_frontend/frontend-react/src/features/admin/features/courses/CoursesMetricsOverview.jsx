/**
 * CoursesMetricsOverview — basic per-course metrics for the admin dashboard
 * (issue #35): feedback (usefulness), difficulty and how many students completed
 * each course, all in one comparative table.
 */
import { useQuery } from '@tanstack/react-query'
import { EyeOff } from 'lucide-react'
import { getCoursesBasicMetrics } from '@/features/courses/services/courses'

/** "4.2/5" or "—" when there's no data. */
function Rating({ value }) {
  if (value === null || value === undefined) return <span className="text-[#c4c3cd]">—</span>
  return (
    <span className="font-mono font-semibold text-[#16151b]">
      {value}
      <span className="text-xs font-normal text-[#a9a8b4]">/5</span>
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
    <div className="space-y-3">
      <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">
        Métricas por curso
      </span>

      <div className="overflow-hidden rounded-[14px] border border-[#e9e9ee] bg-white">
        {isLoading ? (
          <div className="p-6 text-center text-sm text-[#a9a8b4]">Cargando…</div>
        ) : courses.length === 0 ? (
          <div className="p-6 text-center text-sm text-[#a9a8b4]">Aún no hay cursos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-[#fcfcfd] text-left">
                  <th className="px-[14px] pb-2.5 pt-3 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Curso</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Inscritos</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Completaron</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Utilidad</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Dificultad</th>
                  <th className="px-[14px] pb-2.5 pt-3 text-center font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#a9a8b4]">Respuestas</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c.id} className="border-t border-[#f2f1f6] transition-colors hover:bg-[#fafafa]">
                    <td className="px-[14px] py-[13px]">
                      <div className="flex items-center gap-2">
                        <span className="text-[13.5px] font-semibold text-[#16151b]">{c.title}</span>
                        {!c.is_published && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f4f7] px-2 py-0.5 text-[10px] font-medium text-[#8b8a95]">
                            <EyeOff className="h-3 w-3" /> Borrador
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-[14px] py-[13px] text-center font-mono text-[13.5px] font-semibold tabular-nums text-[#16151b]">{c.enrolled}</td>
                    <td className="px-[14px] py-[13px] text-center">
                      <span className="font-mono text-[13.5px] font-semibold tabular-nums text-[#047857]">{c.completed}</span>
                      <span className="font-mono text-[12px] text-[#a9a8b4]"> / {c.learners}</span>
                    </td>
                    <td className="px-[14px] py-[13px] text-center"><Rating value={c.avg_usefulness} /></td>
                    <td className="px-[14px] py-[13px] text-center"><Rating value={c.avg_difficulty} /></td>
                    <td className="px-[14px] py-[13px] text-center font-mono text-[13.5px] text-[#55545f]">{c.feedback_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <p className="text-[11.5px] leading-relaxed text-[#8b8a95]">
        "Inscritos" = alumnos que abrieron el curso. "Completaron" = terminaron todo el contenido y aprobaron los quizzes, sobre los que tuvieron actividad. Utilidad y dificultad son el promedio del feedback.
      </p>
    </div>
  )
}
