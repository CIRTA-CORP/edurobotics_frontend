// Dashboard tab: recent usage first (SessionActivity), then global and
// per-course cumulative metrics as context below. The consolidated analytics
// screen (Analítica) owns the question-ordered view; this tab keeps the raw
// platform totals with the panel's design language.
import { SessionActivity } from '@/features/admin/features/courses/SessionActivity'
import { GlobalMetrics } from '@/features/admin/features/courses/GlobalMetrics'
import { CoursesMetricsOverview } from '@/features/admin/features/courses/CoursesMetricsOverview'

export function DashboardTab() {
  return (
    <div className="space-y-8">
      <div>
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#a9a8b4]">Panel</span>
        <h1
          className="mt-2 text-[28px] font-bold leading-[1.16] tracking-[-0.014em] text-[#16151b]"
          >
          Dashboard
        </h1>
        <p className="mt-2.5 text-[14px] text-[#55545f]">
          Uso reciente y totales acumulados de la plataforma.
        </p>
      </div>
      <SessionActivity />
      <GlobalMetrics />
      <CoursesMetricsOverview />
    </div>
  )
}
