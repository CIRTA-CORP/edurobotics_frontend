/**
 * Course Grid Component
 *
 * Responsive grid displaying course cards with visual progress bars,
 * level badges, and state-based colors. Shows empty state when no courses.
 *
 * Performance: Prefetches course detail data on hover so the
 * CoursePreviewPage loads instantly when the user clicks.
 */

import { useCallback } from 'react'
import { Card, CardContent } from '@/shared/components/card'
import { Badge } from '@/shared/components/badge'
import { Button } from '@/shared/components/button'
import {
  BookOpen, ArrowRight, Check, Clock, PlayCircle,
  GraduationCap, Zap, Trophy
} from 'lucide-react'
import { getCourseDetail } from '@/features/courses/services/courses'

const LEVEL_CONFIG = {
  beginner: { label: 'Principiante', color: 'bg-emerald-100 text-emerald-700', icon: GraduationCap },
  intermediate: { label: 'Intermedio', color: 'bg-amber-100 text-amber-700', icon: Zap },
  advanced: { label: 'Avanzado', color: 'bg-rose-100 text-rose-700', icon: Trophy },
}

const STATE_CONFIG = {
  completed: { label: 'Completado', color: 'text-emerald-600', bg: 'bg-emerald-50', barColor: 'bg-emerald-500', icon: Check },
  in_progress: { label: 'En progreso', color: 'text-blue-600', bg: 'bg-blue-50', barColor: 'bg-blue-500', icon: PlayCircle },
  not_started: { label: 'No iniciado', color: 'text-gray-500', bg: 'bg-gray-50', barColor: 'bg-gray-300', icon: Clock },
}

export function CourseGrid({ courses, onCourseClick }) {
  // Prefetch course data on hover — fires silently, fills the cache
  const handlePrefetch = useCallback((courseId) => {
    getCourseDetail(courseId).catch(() => { })
  }, [])

  if (courses.length === 0) {
    return (
      <Card className="border-dashed border-2 border-gray-200">
        <CardContent className="py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 font-medium mb-1">Aún no tienes cursos activos</p>
          <p className="text-sm text-gray-400">Los cursos disponibles aparecerán aquí</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {courses.map((course) => {
        const summary = course.roadmapSummary || null
        const state = summary ? summary.state : 'no_data'
        const percentage = summary ? summary.percentage : null
        const completed = state === 'completed'
        const stateConfig = STATE_CONFIG[state] || STATE_CONFIG.not_started
        const levelConfig = LEVEL_CONFIG[course.level] || LEVEL_CONFIG.beginner
        const LevelIcon = levelConfig.icon
        const StateIcon = stateConfig.icon

        return (
          <article
            key={course.id}
            className="group cursor-pointer"
            onClick={() => onCourseClick(course.id)}
            onMouseEnter={() => handlePrefetch(course.id)}
          >
            <Card className={`h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border ${completed ? 'border-emerald-200' : 'border-gray-200 hover:border-gray-300'}`}>
              {/* Color accent bar */}
              <div className={`h-1 rounded-t-lg ${completed ? 'bg-emerald-500' : state === 'in_progress' ? 'bg-blue-500' : 'bg-gray-200'}`} />

              <CardContent className="p-5">
                {/* Header: badges */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${levelConfig.color}`}>
                      <LevelIcon className="w-3 h-3" />
                      {levelConfig.label}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 font-mono">CR-{course.id}</span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-gray-900 text-base mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {course.title}
                </h3>

                {/* Description (if available) */}
                {course.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{course.description}</p>
                )}

                {/* Progress bar */}
                {percentage !== null && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <StateIcon className={`w-3.5 h-3.5 ${stateConfig.color}`} />
                        <span className={`font-medium ${stateConfig.color}`}>{stateConfig.label}</span>
                      </div>
                      <span className="font-semibold text-gray-700">{percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-700 ease-out ${stateConfig.barColor}`}
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* No progress data */}
                {percentage === null && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Sin iniciar</span>
                  </div>
                )}

                {/* CTA */}
                <Button
                  className={`w-full group/btn ${completed
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : state === 'in_progress'
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : ''
                    }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onCourseClick(course.id)
                  }}
                >
                  <span>{completed ? 'Revisar' : state === 'in_progress' ? 'Continuar' : 'Ver curso'}</span>
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              </CardContent>
            </Card>
          </article>
        )
      })}
    </div>
  )
}
