/**
 * HeroSection — the student's welcome band.
 *
 * Two columns inside the dark band: the greeting with real numbers on the left,
 * and the "resume where you left off" panel on the right. When the student has
 * no recorded visit the panel is simply absent — no invented course, no empty
 * placeholder — and the greeting takes the full width.
 */

import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { HeroBand } from '@/shared/components/HeroBand'
import { getLastAccessedContent } from '@/features/progress/services/progress'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Buenos días'
  if (hour < 18) return 'Buenas tardes'
  return 'Buenas noches'
}

/** "Llevas 3 de 18 unidades en 2 cursos activos." — only what we can count. */
function summaryLine({ unitsDone, unitsTotal, activeCourses }) {
  if (!unitsTotal) return 'Aún no has empezado ningún curso.'
  const units = `Llevas ${unitsDone} de ${unitsTotal} ${unitsTotal === 1 ? 'unidad' : 'unidades'}`
  if (!activeCourses) return `${units}.`
  return `${units} en ${activeCourses} ${activeCourses === 1 ? 'curso activo' : 'cursos activos'}.`
}

function ResumeCard({ last, percentage, onOpen }) {
  const { course, module, unit } = last
  const position = unit.position && unit.total_in_module
    ? `Unidad ${unit.position} de ${unit.total_in_module}`
    : null

  return (
    <aside className="w-full flex-shrink-0 rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-sm lg:w-[430px]">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
        Continúa donde quedaste
      </p>

      <p className="mt-3 text-[17px] font-semibold leading-snug text-white">{course.title}</p>
      <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
        {module.title}
        {position && <> · {position}</>}
        {unit.title && <> — {unit.title}</>}
      </p>

      <div className="mt-5 flex items-center gap-4">
        {percentage !== null && (
          <>
            <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-[#10b981] transition-all duration-700"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="flex-shrink-0 font-mono text-[13px] tabular-nums text-white/70">
              {percentage}%
            </span>
          </>
        )}
        <button
          onClick={() => onOpen(course.id)}
          className="ml-auto inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#16151b] transition-colors hover:bg-white/90"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </aside>
  )
}

export function HeroSection({ user, unitsDone = 0, unitsTotal = 0, activeCourses = 0, roadmap = [] }) {
  const navigate = useNavigate()

  const { data: lastResp } = useQuery({
    queryKey: ['last-accessed', user?.id],
    queryFn: () => getLastAccessedContent(user.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  })

  // Only render the panel when the backend resolved the full context.
  const last = lastResp?.last_accessed
  const canResume = !!(last?.course && last?.unit)

  // The course's own progress, read from the roadmap the dashboard already has.
  const percentage = canResume
    ? (roadmap.find(c => c.id === last.course.id)?.percentage ?? null)
    : null

  return (
    <HeroBand className="on-brand-band">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
          <div className="lg:pt-6">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">
              {greeting()}
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-white">
              {user.first_name} {user.last_name}
            </h2>
            <p className="mt-2 text-white/55">
              {summaryLine({ unitsDone, unitsTotal, activeCourses })}
            </p>
          </div>

          {canResume && (
            <ResumeCard
              last={last}
              percentage={percentage}
              // Carry the unit so "continue" lands where they actually stopped,
              // instead of dropping them back at the first unit of the course.
              onOpen={(id) => navigate(`/courses/${id}/study?unit=${last.unit.id}`)}
            />
          )}
        </div>
      </div>
    </HeroBand>
  )
}
