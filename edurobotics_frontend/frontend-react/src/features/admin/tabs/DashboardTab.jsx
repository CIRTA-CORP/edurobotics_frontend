import { GlobalMetrics } from '@/features/admin/features/courses/GlobalMetrics'
import { SessionActivity } from '@/features/admin/features/courses/SessionActivity'

export function DashboardTab() {
  return (
    <div className="space-y-8">
      {/* Lead with real usage; cumulative stats are context below. */}
      <SessionActivity />
      <GlobalMetrics />
    </div>
  )
}
