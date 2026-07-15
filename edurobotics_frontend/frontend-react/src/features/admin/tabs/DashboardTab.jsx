import { GlobalMetrics } from '@/features/admin/features/courses/GlobalMetrics'
import { SessionActivity } from '@/features/admin/features/courses/SessionActivity'
import { CoursesMetricsOverview } from '@/features/admin/features/courses/CoursesMetricsOverview'

export function DashboardTab() {
  return (
    <div className="space-y-8">
      {/* Lead with real usage; cumulative stats are context below. */}
      <SessionActivity />
      <GlobalMetrics />
      <CoursesMetricsOverview />
    </div>
  )
}
