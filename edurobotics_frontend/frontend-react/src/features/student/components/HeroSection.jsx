/**
 * HeroSection — the student's welcome band.
 *
 * The band now states real numbers instead of a generic slogan, and carries the
 * "resume where you left off" card when the student has a recorded visit. When
 * there is no visit yet the card is simply absent: no invented course, no empty
 * placeholder.
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

function ResumeCard({ last, onOpen }) {
  const { course, module, unit } = last
  const position = unit.position && unit.total_in_module
    ? `Unidad ${unit.position} de ${unit.total_in_module}`
    : null

  return (
    <div className="mt-8 rounded-2xl border border-white/15 bg-white/[0.06] p-5 backdrop-blur-sm sm:p-6">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-white/50">
        Continúa donde quedaste
      </p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-lg font-semibold text-white">{course.title}</p>
          <p className="mt-1 text-sm text-white/60">
            {module.title}
            {position && <> · {position}</>}
            {unit.title && <> — {unit.title}</>}
          </p>
        </div>
        <button
          onClick={() => onOpen(course.id)}
          className="inline-flex h-11 flex-shrink-0 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-[#16151b] transition-colors hover:bg-white/90"
        >
          Continuar
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function HeroSection({ user, unitsDone = 0, unitsTotal = 0, activeCourses = 0 }) {
  const navigate = useNavigate()

  const { data: lastResp } = useQuery({
    queryKey: ['last-accessed', user?.id],
    queryFn: () => getLastAccessedContent(user.id),
    enabled: !!user?.id,
    staleTime: 30_000,
  })

  // Only render the card when the backend resolved the full context.
  const last = lastResp?.last_accessed
  const canResume = !!(last?.course && last?.unit)

  return (
    <HeroBand className="on-brand-band">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="mb-1 text-sm font-medium text-white/60">{greeting()}</p>
        <h2 className="text-3xl font-bold text-white">
          {user.first_name} {user.last_name}
        </h2>
        <p className="mt-1.5 text-white/60">
          {summaryLine({ unitsDone, unitsTotal, activeCourses })}
        </p>

        {canResume && (
          <ResumeCard
            last={last}
            // Carry the unit so "continue" lands where they actually stopped,
            // instead of dropping them back at the first unit of the course.
            onOpen={(id) => navigate(`/courses/${id}/study?unit=${last.unit.id}`)}
          />
        )}
      </div>
    </HeroBand>
  )
}
