// Dashboard tab: a platform summary for the director (change admin-analytics-v2, 3.6).
// Recent usage first (SessionActivity), usage per role, then global and per-course
// cumulative metrics. The question-ordered detail of each course (where students drop
// out, how far they get, how quizzes go) lives in Analítica: the header and every row of
// "Métricas por curso" link there instead of repeating those charts here.
import { BarChart3 } from 'lucide-react'
import { useAdmin } from '@/features/admin/context/AdminContext'
import { SessionActivity } from '@/features/admin/features/courses/SessionActivity'
import { UsageByRole } from '@/features/admin/features/courses/UsageByRole'
import { GlobalMetrics } from '@/features/admin/features/courses/GlobalMetrics'
import { CoursesMetricsOverview } from '@/features/admin/features/courses/CoursesMetricsOverview'

export function DashboardTab() {
  const { setActiveTab, setSelectedCourseId } = useAdmin()

  const openAnalytics = (courseId) => {
    if (courseId) setSelectedCourseId(courseId)
    setActiveTab('analitica')
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[640px]">
          <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">Panel</span>
          <h1 className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]">Dashboard</h1>
          <p className="mt-2.5 text-[14px] text-[#55545f]">
            Resumen de la plataforma: quién entra y cómo va cada curso. Dónde abandonan, cuánto avanzan y cómo les va en
            las evaluaciones está en la Analítica de cada curso.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAnalytics(null)}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#16151b] px-5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2b2b26] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#16151b]"
        >
          <BarChart3 className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          Ver la Analítica
        </button>
      </div>
      <SessionActivity />
      <UsageByRole />
      <GlobalMetrics />
      <CoursesMetricsOverview onOpenAnalytics={openAnalytics} />
    </div>
  )
}
