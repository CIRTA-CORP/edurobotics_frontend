/**
 * ProgressPanel Component (formerly CourseRoadmap)
 *
 * Compact progress panel shown at the bottom of the course sidebar.
 * Displays overall course progress: percentage, state, progress bar,
 * and a button to jump to the next pending unit.
 */

import { useEffect, useState } from 'react'
import { Loader2, ChevronRight } from 'lucide-react'
import { getRoadmap } from '../../../services/progress'

const STATE_LABELS = {
  completed: 'Completado',
  in_progress: 'En progreso',
  not_started: 'No iniciado',
}

const STATE_COLORS = {
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-blue-100 text-blue-700',
  not_started: 'bg-gray-100 text-gray-600',
}

export default function CourseRoadmap({ userId, courseId, onNavigateUnit }) {
  const [roadmap, setRoadmap] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userId) return
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await getRoadmap(userId, courseId)
        if (mounted) setRoadmap(data.roadmap)
      } catch (err) {
        if (mounted) setError(err.message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [userId, courseId])

  if (!userId) return null

  if (loading) return (
    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      Cargando progreso...
    </div>
  )

  if (error || !roadmap) return null

  const { percentage = 0, state = 'not_started', modules } = roadmap

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

  const stateLabel = STATE_LABELS[state] || state
  const stateColor = STATE_COLORS[state] || STATE_COLORS.not_started

  return (
    <div className="py-1">
      {/* State badge */}
      <div className="flex items-center justify-end mb-3">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stateColor}`}>
          {stateLabel}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-1">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Completado</span>
          <span className="font-semibold text-gray-700">{percentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${percentage === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Next pending button */}
      {state !== 'completed' && (
        <button
          onClick={goToNextPending}
          className="mt-3 w-full flex items-center justify-between text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md px-2 py-1.5 transition-colors"
        >
          <span>Ir a la siguiente unidad pendiente</span>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />
        </button>
      )}
    </div>
  )
}
