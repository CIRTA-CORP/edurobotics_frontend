/**
 * SpecializationsSection — student-facing list of specializations (issue #24).
 *
 * Shows published specializations as "learning path" cards above the course
 * grid. Each card links to the specialization detail page. Renders nothing
 * when there are no specializations, so it stays out of the way until an admin
 * creates one.
 */
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Layers, ArrowRight, BookOpen, CheckCircle } from 'lucide-react'
import { getSpecializations } from '@/features/specializations/services/specializations'
import { getRoadmap } from '@/features/progress/services/progress'
import { getStoredUser } from '@/features/auth/services/auth'

function SpecializationCard({ spec, progress, onClick }) {
  const count = spec.course_count ?? spec.courses?.length ?? 0
  const { completed, total } = progress
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0
  const done = total > 0 && completed >= total
  return (
    <article
      className="group relative flex cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      onClick={() => onClick(spec.id)}
    >
      {/* Cover */}
      <div className="relative w-32 flex-shrink-0 sm:w-40">
        {spec.image_url ? (
          <img
            src={spec.image_url}
            alt={spec.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center overflow-hidden bg-[#0a0a0c]">
            <div
              className="absolute inset-0 opacity-[0.14]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '14px 14px' }}
            />
            <Layers className="relative h-9 w-9 text-white/90" strokeWidth={1.5} />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-600">
            <Layers className="h-3 w-3" />
            Especialización
          </span>
          <h3 className="mt-2 truncate text-base font-bold text-gray-900">{spec.title}</h3>
          {spec.description && (
            <p className="mt-1 line-clamp-2 text-sm text-gray-500">{spec.description}</p>
          )}
        </div>

        {/* Progress */}
        {total > 0 && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={`flex items-center gap-1 font-medium ${done ? 'text-emerald-600' : 'text-gray-500'}`}>
                {done && <CheckCircle className="h-3 w-3" />}
                {completed}/{total} completados
              </span>
              <span className="font-semibold text-gray-700">{pct}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${done ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <BookOpen className="h-3.5 w-3.5" />
            {count} {count === 1 ? 'curso' : 'cursos'}
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
            Ver ruta
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </article>
  )
}

export function SpecializationsSection() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const { data: specs = [], isLoading } = useQuery({
    queryKey: ['specializations-public'],
    queryFn: getSpecializations,
    staleTime: 60_000,
  })

  // Shared with the dashboard query (same key) — no extra round-trip.
  const { data: roadmapResp } = useQuery({
    queryKey: ['roadmap-full', user?.id],
    queryFn: () => getRoadmap(user.id),
    enabled: !!user?.id,
    staleTime: 20_000,
  })

  const completedIds = new Set(
    (Array.isArray(roadmapResp?.roadmap) ? roadmapResp.roadmap : [])
      .filter((c) => c.state === 'completed')
      .map((c) => c.id)
  )

  const progressFor = (spec) => {
    const courses = spec.courses || []
    return {
      total: courses.length,
      completed: courses.filter((c) => completedIds.has(c.id)).length,
    }
  }

  // Stay invisible until there's something to show.
  if (isLoading || specs.length === 0) return null

  return (
    <section className="mb-10">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">Especializaciones</h2>
          <p className="text-sm text-gray-500">Rutas de aprendizaje que agrupan varios cursos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {specs.map((spec) => (
          <SpecializationCard
            key={spec.id}
            spec={spec}
            progress={progressFor(spec)}
            onClick={(id) => navigate(`/specializations/${id}`)}
          />
        ))}
      </div>
    </section>
  )
}

export default SpecializationsSection
