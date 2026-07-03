/**
 * ProgressPanel Component (formerly CourseRoadmap)
 *
 * Compact progress panel shown in the course sidebar.
 * Displays overall course progress: percentage, state, progress bar,
 * and a button to jump to the next pending unit.
 * Redesigned with modern card-style and visual indicators.
 */

import { useQuery } from '@tanstack/react-query'
import { Loader2, ChevronRight, CheckCircle, Clock, Circle } from 'lucide-react'
import { getRoadmap } from '@/features/progress/services/progress'

const STATE_CONFIG = {
  completed: { label: 'Completado', icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700', barColor: 'bg-emerald-500' },
  in_progress: { label: 'En progreso', icon: Clock, color: 'bg-blue-100 text-blue-700', barColor: 'bg-blue-500' },
  not_started: { label: 'No iniciado', icon: Circle, color: 'bg-gray-100 text-gray-600', barColor: 'bg-gray-300' },
}

export default function CourseRoadmap({ userId, courseId, onNavigateUnit }) {
  const { data, isLoading: loading, error } = useQuery({
    queryKey: ['roadmap-single', userId, courseId],
    queryFn: () => getRoadmap(userId, courseId),
    enabled: !!userId,
    staleTime: 15_000,
  })
  const roadmap = data?.roadmap || null

  if (!userId) return null

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-400 py-3">
      <Loader2 className="w-3.5 h-3.5 animate-spin" />
      <span className="text-xs">Cargando progreso...</span>
    </div>
  )

  if (error || !roadmap) return null

  const { percentage = 0, state = 'not_started', modules } = roadmap
  const config = STATE_CONFIG[state] || STATE_CONFIG.not_started
  const StateIcon = config.icon

  const goToNextPending = () => {
    if (!modules) return
    for (const mod of modules) {
      for (const unit of mod.units || []) {
        if (unit.state !== 'completed') {
          if (onNavigateUnit) onNavigateUnit(unit.id)
          return
        }
      }
    }
  }

  return (
    <div className="space-y-3">
      {/* State + percentage */}
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${config.color}`}>
          <StateIcon className="w-3 h-3" />
          {config.label}
        </span>
        <span className="text-sm font-bold text-gray-800">{percentage}%</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${config.barColor}`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Next pending button */}
      {state !== 'completed' && (
        <button
          onClick={goToNextPending}
          className="w-full flex items-center justify-between text-xs text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg px-3 py-2 transition-colors"
        >
          <span className="font-medium">Ir a la siguiente unidad pendiente</span>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        </button>
      )}
    </div>
  )
}
