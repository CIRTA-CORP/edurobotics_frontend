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
import {
  BookOpen, ArrowRight, Check, Clock, PlayCircle,
  GraduationCap, Zap, Trophy, Lock
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

export function CourseGrid({ courses, onCourseClick, specMap = {}, orderMap = {} }) {
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

        const locked = !!course.locked
        const ctaLabel = locked ? 'Bloqueado' : completed ? 'Revisar' : state === 'in_progress' ? 'Continuar' : 'Ver curso'
        const spec = specMap[course.id] || null
        const order = orderMap[course.id] ?? null

        return (
          <article
            key={course.id}
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${locked ? 'border-gray-200 opacity-90' : completed ? 'border-emerald-200' : 'border-gray-200'}`}
            onClick={() => onCourseClick(course.id)}
            onMouseEnter={() => handlePrefetch(course.id)}
          >
            <div className="relative aspect-[4/3] w-full">
              {/* Background image (issue #30), or gradient fallback */}
              {course.image_url ? (
                <img
                  src={course.image_url}
                  alt={course.title}
                  loading="lazy"
                  decoding="async"
                  className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${locked ? 'grayscale' : ''}`}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
                  <BookOpen className="h-12 w-12 text-blue-300" strokeWidth={1.5} />
                </div>
              )}

              {/* Gradient scrim for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              {/* Top row: order (in a route) + level badge + specialization */}
              <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                <div className="flex items-center gap-1.5">
                  {order != null && (
                    <span
                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900 shadow-sm"
                      title={`Curso ${order} de la ruta`}
                    >
                      {order}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm backdrop-blur-sm">
                    <LevelIcon className="h-3 w-3" />
                    {levelConfig.label}
                  </span>
                </div>
                {spec && (
                  <span
                    className={`inline-flex max-w-[55%] items-center gap-1 truncate rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${spec.color.badge}`}
                    title={spec.title}
                  >
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${spec.color.dot}`} />
                    <span className="truncate">{spec.title}</span>
                  </span>
                )}
              </div>

              {/* Bottom content */}
              <div className="absolute inset-x-0 bottom-0 p-4">
                {/* Title — always visible */}
                <h3 className="text-lg font-bold leading-tight text-white line-clamp-2 drop-shadow-md">
                  {course.title}
                </h3>

                {/* Locked reason — always visible so the student knows why */}
                {locked && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-200">
                    <Lock className="h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-1">{course.lockedReason || 'Bloqueado'}</span>
                  </p>
                )}

                {/* Thin progress bar — always visible */}
                {!locked && percentage !== null && (
                  <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ease-out ${stateConfig.barColor}`}
                      style={{ width: `${Math.max(percentage, 2)}%` }}
                    />
                  </div>
                )}

                {/* Reveal on hover: state + % + CTA */}
                <div className="max-h-0 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:mt-3 group-hover:max-h-40 group-hover:opacity-100">
                  {percentage !== null ? (
                    <div className="mb-3 flex items-center justify-between text-xs text-white/85">
                      <span className="flex items-center gap-1.5 font-medium">
                        <StateIcon className="h-3.5 w-3.5" />
                        {stateConfig.label}
                      </span>
                      <span className="font-semibold">{percentage}%</span>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-center gap-1.5 text-xs text-white/70">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Sin iniciar</span>
                    </div>
                  )}

                  <span className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold shadow-sm transition-colors ${locked ? 'bg-white/15 text-white backdrop-blur-sm' : 'bg-white text-slate-900 group-hover:bg-white/95'}`}>
                    {locked ? <Lock className="h-4 w-4" /> : null}
                    {ctaLabel}
                    {!locked && <ArrowRight className="h-4 w-4" />}
                  </span>
                </div>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}
